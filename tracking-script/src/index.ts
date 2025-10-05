import FingerprintJS from '@fingerprintjs/fingerprintjs';

interface TrackingConfig {
  scriptId: string;
  apiUrl: string;
}

interface AttributionData {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
}

class CourseSignalTracker {
  private scriptId: string | null = null;
  private apiUrl: string | null = null;
  private visitorId: string | null = null;
  private sessionId: string | null = null;
  private fingerprint: string | null = null;

  async init(scriptId: string, apiUrl: string) {
    this.scriptId = scriptId;
    this.apiUrl = apiUrl;

    // Generate or retrieve visitor ID
    this.visitorId = this.getOrCreateVisitorId();

    // Generate session ID
    this.sessionId = this.getOrCreateSessionId();

    // Get device fingerprint
    await this.generateFingerprint();

    // Track initial visit
    await this.trackVisit();
  }

  private getOrCreateVisitorId(): string {
    const VISITOR_KEY = 'cs_visitor_id';

    // Try localStorage first
    let visitorId = localStorage.getItem(VISITOR_KEY);

    // Try cookie as fallback
    if (!visitorId) {
      visitorId = this.getCookie(VISITOR_KEY);
    }

    // Generate new if doesn't exist
    if (!visitorId) {
      visitorId = this.generateUUID();
      localStorage.setItem(VISITOR_KEY, visitorId);
      this.setCookie(VISITOR_KEY, visitorId, 365);
    }

    return visitorId;
  }

  private getOrCreateSessionId(): string {
    const SESSION_KEY = 'cs_session_id';
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const lastActivity = localStorage.getItem('cs_last_activity');
    const now = Date.now();

    // Check if session expired
    if (lastActivity && now - parseInt(lastActivity) > SESSION_TIMEOUT) {
      localStorage.removeItem(SESSION_KEY);
    }

    let sessionId = localStorage.getItem(SESSION_KEY);

    if (!sessionId) {
      sessionId = this.generateUUID();
      localStorage.setItem(SESSION_KEY, sessionId);
    }

    localStorage.setItem('cs_last_activity', now.toString());

    return sessionId;
  }

  private async generateFingerprint() {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      this.fingerprint = result.visitorId;
    } catch (error) {
      console.warn('Failed to generate fingerprint:', error);
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private setCookie(name: string, value: string, days: number) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private getURLParams(): URLSearchParams {
    return new URLSearchParams(window.location.search);
  }

  private getAttributionData(): AttributionData {
    const params = this.getURLParams();

    return {
      source: params.get('utm_source') || this.getSourceFromReferrer(),
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      content: params.get('utm_content') || undefined,
      term: params.get('utm_term') || undefined,
      referrer: document.referrer || undefined,
      landingPage: window.location.href,
    };
  }

  private getSourceFromReferrer(): string {
    const referrer = document.referrer;

    if (!referrer) return 'direct';

    if (referrer.includes('google')) return 'google';
    if (referrer.includes('facebook')) return 'facebook';
    if (referrer.includes('twitter') || referrer.includes('t.co')) return 'twitter';
    if (referrer.includes('instagram')) return 'instagram';
    if (referrer.includes('youtube')) return 'youtube';
    if (referrer.includes('linkedin')) return 'linkedin';
    if (referrer.includes('pinterest')) return 'pinterest';
    if (referrer.includes('tiktok')) return 'tiktok';

    return 'referral';
  }

  private async trackVisit() {
    if (!this.scriptId || !this.apiUrl || !this.visitorId || !this.sessionId) {
      return;
    }

    const attribution = this.getAttributionData();

    const payload = {
      scriptId: this.scriptId,
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      eventType: 'visit',
      eventData: {
        ...attribution,
        deviceFingerprint: this.fingerprint || undefined,
      },
    };

    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Fail silently - don't break the page
      console.warn('Tracking failed:', error);
    }
  }

  // Public API
  public identify(email: string) {
    localStorage.setItem('cs_visitor_email', email);
  }

  public getVisitorId(): string | null {
    return this.visitorId;
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }
}

// Export global instance
const tracker = new CourseSignalTracker();

// Expose to window
declare global {
  interface Window {
    CourseSignal: {
      init: (scriptId: string, apiUrl: string) => Promise<void>;
      identify: (email: string) => void;
      getVisitorId: () => string | null;
      getSessionId: () => string | null;
    };
  }
}

window.CourseSignal = {
  init: tracker.init.bind(tracker),
  identify: tracker.identify.bind(tracker),
  getVisitorId: tracker.getVisitorId.bind(tracker),
  getSessionId: tracker.getSessionId.bind(tracker),
};

export default tracker;
