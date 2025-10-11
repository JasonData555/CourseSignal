import { useState, useEffect } from 'react';
import { Drawer, Combobox, Button, QRCodeModal } from '../design-system';
import { Copy, CheckCircle, QrCode, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../lib/api';

interface UTMBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlatformPreset {
  label: string;
  source: string;
  medium: string;
}

const PLATFORM_PRESETS: PlatformPreset[] = [
  { label: 'Facebook Ads', source: 'facebook', medium: 'cpc' },
  { label: 'Instagram Ads', source: 'instagram', medium: 'cpc' },
  { label: 'Google Ads', source: 'google', medium: 'cpc' },
  { label: 'YouTube Ads', source: 'youtube', medium: 'video' },
  { label: 'Email Newsletter', source: 'newsletter', medium: 'email' },
  { label: 'LinkedIn Ads', source: 'linkedin', medium: 'cpc' },
];

const COMMON_SOURCES = ['facebook', 'instagram', 'google', 'youtube', 'newsletter', 'linkedin', 'twitter', 'tiktok', 'affiliate', 'podcast'];
const COMMON_MEDIUMS = ['cpc', 'social', 'email', 'video', 'referral', 'organic', 'affiliate'];

export function UTMBuilder({ isOpen, onClose }: UTMBuilderProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeLaunches, setActiveLaunches] = useState<any[]>([]);
  const [selectedLaunchId, setSelectedLaunchId] = useState('');

  // Fetch active launches
  useEffect(() => {
    if (isOpen) {
      fetchActiveLaunches();
    }
  }, [isOpen]);

  const fetchActiveLaunches = async () => {
    try {
      const response = await api.get('/launches?status=active&limit=10');
      setActiveLaunches(response.data.launches || []);
    } catch (error) {
      console.error('Failed to fetch active launches:', error);
    }
  };

  const handlePresetClick = (preset: PlatformPreset) => {
    setSource(preset.source);
    setMedium(preset.medium);
    setErrors({});
  };

  const handleLaunchSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const launchId = e.target.value;
    setSelectedLaunchId(launchId);

    if (launchId) {
      const launch = activeLaunches.find(l => l.id === launchId);
      if (launch) {
        // Slugify launch title for campaign name
        const slugified = launch.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        setCampaign(slugified);
      }
    }
  };

  const validateField = (field: string, value: string): string | null => {
    if (field === 'baseUrl') {
      if (!value) return 'Base URL is required';
      try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`);
        if (!url.protocol.startsWith('http')) {
          return 'URL must use http:// or https://';
        }
      } catch {
        return 'Please enter a valid URL';
      }
    }

    if ((field === 'source' || field === 'medium') && !value) {
      return 'This field is required';
    }

    // Validate format (lowercase, alphanumeric + hyphens only)
    if (value && !/^[a-z0-9-]+$/.test(value)) {
      return 'Use lowercase letters, numbers, and hyphens only';
    }

    return null;
  };

  const handleFieldChange = (field: string, value: string) => {
    // Auto-transform to lowercase and replace spaces with hyphens
    let transformedValue = value.toLowerCase().replace(/\s+/g, '-');

    // Remove invalid characters
    transformedValue = transformedValue.replace(/[^a-z0-9-]/g, '');

    switch (field) {
      case 'baseUrl':
        setBaseUrl(value); // Don't transform URL
        break;
      case 'source':
        setSource(transformedValue);
        break;
      case 'medium':
        setMedium(transformedValue);
        break;
      case 'campaign':
        setCampaign(transformedValue);
        break;
      case 'content':
        setContent(transformedValue);
        break;
      case 'term':
        setTerm(transformedValue);
        break;
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateURL = (): string => {
    if (!baseUrl || !source || !medium) return '';

    try {
      const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
      const params = new URLSearchParams();

      params.set('utm_source', source);
      params.set('utm_medium', medium);
      if (campaign) params.set('utm_campaign', campaign);
      if (content) params.set('utm_content', content);
      if (term) params.set('utm_term', term);

      return `${url.origin}${url.pathname}${url.search ? url.search + '&' : '?'}${params.toString()}`;
    } catch {
      return '';
    }
  };

  const generatedURL = generateURL();

  const handleCopy = async () => {
    if (!generatedURL) return;

    // Validate all fields first
    const newErrors: Record<string, string> = {};

    const baseUrlError = validateField('baseUrl', baseUrl);
    if (baseUrlError) newErrors.baseUrl = baseUrlError;

    const sourceError = validateField('source', source);
    if (sourceError) newErrors.source = sourceError;

    const mediumError = validateField('medium', medium);
    if (mediumError) newErrors.medium = mediumError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(generatedURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleReset = () => {
    setBaseUrl('');
    setSource('');
    setMedium('');
    setCampaign('');
    setContent('');
    setTerm('');
    setSelectedLaunchId('');
    setErrors({});
    setShowAdvanced(false);
  };

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} title="Build Tracking Link" width="md">
        {/* Platform Presets */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Start: Platform Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500 uppercase tracking-wide">Or Build Custom</span>
          </div>
        </div>

        {/* Base URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base URL <span className="text-danger-600">*</span>
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
            placeholder="https://your-site.com/landing-page"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
              errors.baseUrl ? 'border-danger-300' : 'border-gray-300'
            }`}
          />
          {errors.baseUrl && (
            <p className="mt-1 text-xs text-danger-600">{errors.baseUrl}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Your landing page URL</p>
        </div>

        {/* Active Launch Integration */}
        {activeLaunches.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign from Active Launch
            </label>
            <select
              value={selectedLaunchId}
              onChange={handleLaunchSelect}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Custom campaign name</option>
              {activeLaunches.map((launch) => (
                <option key={launch.id} value={launch.id}>
                  {launch.title} ({new Date(launch.start_date).toLocaleDateString()} - {new Date(launch.end_date).toLocaleDateString()})
                </option>
              ))}
            </select>
            {selectedLaunchId && (
              <p className="mt-1 text-xs text-primary-600">Campaign auto-filled from launch</p>
            )}
          </div>
        )}

        {/* Campaign */}
        <div className="mb-4">
          <Combobox
            value={campaign}
            onChange={(value) => handleFieldChange('campaign', value)}
            suggestions={[]}
            label="Campaign"
            placeholder="summer-2024-launch"
            helperText="Content theme or launch name"
          />
        </div>

        {/* Source */}
        <div className="mb-4">
          <Combobox
            value={source}
            onChange={(value) => handleFieldChange('source', value)}
            suggestions={COMMON_SOURCES}
            label="Traffic Source"
            required
            placeholder="facebook"
            helperText="Platform where ad appears"
            error={errors.source}
          />
        </div>

        {/* Medium */}
        <div className="mb-4">
          <Combobox
            value={medium}
            onChange={(value) => handleFieldChange('medium', value)}
            suggestions={COMMON_MEDIUMS}
            label="Medium"
            required
            placeholder="cpc"
            helperText="Marketing channel type"
            error={errors.medium}
          />
        </div>

        {/* Advanced Fields */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Advanced (Optional)
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <Combobox
                value={content}
                onChange={(value) => handleFieldChange('content', value)}
                suggestions={[]}
                label="Content"
                placeholder="ad-variant-a"
                helperText="Ad variant or placement"
              />

              <Combobox
                value={term}
                onChange={(value) => handleFieldChange('term', value)}
                suggestions={[]}
                label="Term"
                placeholder="course+creator"
                helperText="Paid search keywords (optional)"
              />
            </div>
          )}
        </div>

        {/* Generated URL */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Generated URL
          </label>
          <div className="relative">
            <input
              type="text"
              value={generatedURL}
              readOnly
              placeholder="Fill in required fields to generate URL"
              className="w-full px-4 py-2 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
            />
            {generatedURL && (
              <button
                onClick={handleCopy}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Copy URL"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-success-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleCopy}
            disabled={!generatedURL}
            fullWidth
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Generate & Copy Link
              </>
            )}
          </Button>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowQRCode(true)}
              disabled={!generatedURL}
              fullWidth
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>

            <Button
              variant="ghost"
              onClick={handleReset}
              fullWidth
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h3 className="text-sm font-semibold text-primary-900 mb-2">Best Practices</h3>
          <ul className="space-y-1 text-xs text-primary-900">
            <li>• Use consistent naming: always lowercase, hyphens instead of spaces</li>
            <li>• Source = platform (facebook, google, email)</li>
            <li>• Medium = channel type (cpc, social, email)</li>
            <li>• Campaign = content theme or launch name</li>
            <li>• All UTM data auto-links to purchases when customers buy</li>
          </ul>
        </div>
      </Drawer>

      {/* QR Code Modal */}
      <QRCodeModal
        url={generatedURL}
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
      />
    </>
  );
}
