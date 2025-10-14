import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layouts';
import { Card, Button } from '../components/design-system';
import { Copy, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import api from '../lib/api';

type Platform = 'kajabi' | 'teachable' | 'skool';

export default function Settings() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('kajabi');
  const [kajabiConnected, setKajabiConnected] = useState(false);
  const [teachableConnected, setTeachableConnected] = useState(false);
  const [skoolConnected, setSkoolConnected] = useState(false);
  const [skoolApiKey, setSkoolApiKey] = useState('');
  const [skoolWebhookUrl, setSkoolWebhookUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [siteId, setSiteId] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [updatingAiPref, setUpdatingAiPref] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const kajabiResponse = await api.get('/kajabi/status');
      setKajabiConnected(kajabiResponse.data.connected);

      const teachableResponse = await api.get('/teachable/status');
      setTeachableConnected(teachableResponse.data.connected);

      const skoolResponse = await api.get('/skool/status');
      setSkoolConnected(skoolResponse.data.connected);
      if (skoolResponse.data.webhookUrl) {
        setSkoolWebhookUrl(skoolResponse.data.webhookUrl);
      }

      // Fetch AI preferences
      const aiPrefResponse = await api.get('/recommendations/preference');
      setAiEnabled(aiPrefResponse.data.aiEnabled);
      setAiAvailable(aiPrefResponse.data.available);

      // Fetch tracking script info
      const scriptResponse = await api.get('/script/info');
      setSiteId(scriptResponse.data.scriptId);
      setScriptUrl(scriptResponse.data.scriptUrl);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleConnectKajabi = async () => {
    setConnecting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.get('/kajabi/connect');
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      setError('Failed to initiate Kajabi connection');
      setConnecting(false);
    }
  };

  const handleConnectTeachable = async () => {
    setConnecting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.get('/teachable/connect');
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      setError('Failed to initiate Teachable connection');
      setConnecting(false);
    }
  };

  const handleConnectSkool = async () => {
    if (!skoolApiKey) {
      setError('Please enter your Skool API key');
      return;
    }

    setConnecting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/skool/connect', { apiKey: skoolApiKey });
      setSkoolConnected(true);
      setSkoolWebhookUrl(response.data.webhookUrl);
      setSuccess('Skool connected successfully! Copy the webhook URL below to complete setup.');
      setSkoolApiKey('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid Skool API key');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const platform = selectedPlatform;
    try {
      await api.delete(`/${platform}/disconnect`);
      if (platform === 'kajabi') {
        setKajabiConnected(false);
      } else if (platform === 'teachable') {
        setTeachableConnected(false);
      } else if (platform === 'skool') {
        setSkoolConnected(false);
        setSkoolWebhookUrl('');
      }
      setSuccess(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/${selectedPlatform}/sync`);
      setSuccess('Sync started! Your purchases will update shortly.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const trackingScript = `<script>
(function() {
  var scriptId = '${siteId}';
  var apiUrl = '${import.meta.env.VITE_API_URL}/tracking/event';

  // Load tracking library
  var script = document.createElement('script');
  script.src = '${scriptUrl}';
  script.async = true;
  script.onload = function() {
    if (window.CourseSignal) {
      window.CourseSignal.init(scriptId, apiUrl);
    }
  };
  document.head.appendChild(script);
})();
</script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(trackingScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(skoolWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAI = async () => {
    setUpdatingAiPref(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/recommendations/preference', { enabled: !aiEnabled });
      setAiEnabled(!aiEnabled);
      setSuccess(`AI recommendations ${!aiEnabled ? 'enabled' : 'disabled'}`);

      // Clear cache when toggling
      await api.post('/recommendations/clear-cache');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update AI preference');
    } finally {
      setUpdatingAiPref(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="space-y-6">
          {/* AI Recommendations */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Insights</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enable AI-powered recommendations for smarter, personalized insights based on your revenue data.
            </p>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
                  {!aiAvailable && (
                    <span className="text-xs text-warning-600 bg-warning-50 px-2 py-0.5 rounded">
                      Requires API Key
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {aiEnabled
                    ? 'Using OpenAI to generate contextual recommendations'
                    : 'Using rule-based recommendations'}
                </p>
              </div>
              <button
                onClick={handleToggleAI}
                disabled={updatingAiPref || !aiAvailable}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aiEnabled && aiAvailable
                    ? 'bg-primary-600'
                    : 'bg-gray-300'
                } ${!aiAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiEnabled && aiAvailable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!aiAvailable && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  To enable AI recommendations, add your OpenAI API key to the backend .env file:
                  <code className="block mt-2 px-2 py-1 bg-white rounded text-xs">
                    OPENAI_API_KEY=sk-...
                  </code>
                </p>
              </div>
            )}
          </Card>

          {/* Platform Integration */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Integration</h2>

            {/* Platform Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Course Platform
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedPlatform('kajabi')}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                    selectedPlatform === 'kajabi'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Kajabi
                  {kajabiConnected && (
                    <CheckCircle className="inline-block w-4 h-4 ml-2 text-success-600" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedPlatform('teachable')}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                    selectedPlatform === 'teachable'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Teachable
                  {teachableConnected && (
                    <CheckCircle className="inline-block w-4 h-4 ml-2 text-success-600" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedPlatform('skool')}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                    selectedPlatform === 'skool'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Skool
                  {skoolConnected && (
                    <CheckCircle className="inline-block w-4 h-4 ml-2 text-success-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Kajabi Integration */}
            {selectedPlatform === 'kajabi' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Kajabi Integration</h3>

                {kajabiConnected ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                      <span className="text-success-700 font-medium">
                        Kajabi connected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Your Kajabi purchases are syncing automatically.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={handleSync}
                        loading={syncing}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </Button>
                      <Button variant="danger" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 font-medium">
                        Not connected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect Kajabi to match every purchase to its traffic source and unlock revenue attribution insights.
                    </p>
                    <Button onClick={handleConnectKajabi} loading={connecting}>
                      Connect Kajabi
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Teachable Integration */}
            {selectedPlatform === 'teachable' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Teachable Integration</h3>

                {teachableConnected ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                      <span className="text-success-700 font-medium">
                        Teachable connected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Your Teachable orders are syncing automatically.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={handleSync}
                        loading={syncing}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </Button>
                      <Button variant="danger" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 font-medium">
                        Not connected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect Teachable to match every order to its traffic source and unlock revenue attribution insights.
                    </p>
                    <Button onClick={handleConnectTeachable} loading={connecting}>
                      Connect Teachable
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Skool Integration */}
            {selectedPlatform === 'skool' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Skool Integration</h3>

                {skoolConnected ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                      <span className="text-success-700 font-medium">
                        Skool connected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Your Skool purchases are being tracked via webhooks.
                    </p>

                    {/* Webhook URL Display */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook URL (paste this in Skool/Zapier)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={skoolWebhookUrl}
                          readOnly
                          className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                        />
                        <button
                          onClick={handleCopyWebhookUrl}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded transition-colors"
                        >
                          {copied ? (
                            <CheckCircle className="w-5 h-5 text-success-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={handleSync}
                        loading={syncing}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </Button>
                      <Button variant="danger" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 font-medium">
                        Not connected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect Skool to match every purchase to its traffic source and unlock revenue attribution insights.
                    </p>

                    {/* API Key Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skool API Key
                      </label>
                      <input
                        type="password"
                        value={skoolApiKey}
                        onChange={(e) => setSkoolApiKey(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter your API key"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Get your API key from{' '}
                        <a
                          href="https://skoolapi.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          SkoolAPI.com
                        </a>{' '}
                        or your Skool community settings
                      </p>
                    </div>

                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        About Skool Integration
                      </h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Skool integration uses webhook-based purchase tracking</li>
                        <li>• After connecting, you'll receive a webhook URL to configure in Skool or Zapier</li>
                        <li>• Purchases will be automatically attributed when webhooks are configured</li>
                        <li>• Works with Skool's Zapier plugin or external payment processors</li>
                      </ul>
                    </div>

                    <Button onClick={handleConnectSkool} loading={connecting}>
                      Connect Skool
                    </Button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-sm text-success-700">{success}</p>
              </div>
            )}
          </Card>

          {/* Tracking Script */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tracking Script Installation</h2>

            <p className="text-sm text-gray-600 mb-4">
              Install this script on your course website to track visitor sources and attribute
              purchases to the right marketing channels.
            </p>

            {/* Step 1: Copy Script */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Step 1: Copy the tracking script</h3>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{trackingScript}</code>
                </pre>
                <button
                  onClick={handleCopyScript}
                  className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-success-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Step 2: Platform-Specific Instructions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Step 2: Install on your {selectedPlatform === 'kajabi' ? 'Kajabi' : selectedPlatform === 'teachable' ? 'Teachable' : 'Skool'} site
              </h3>

              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium mb-3"
              >
                <ExternalLink className="w-4 h-4" />
                {showInstructions ? 'Hide' : 'Show'} detailed instructions
              </button>

              {showInstructions && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  {selectedPlatform === 'kajabi' ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">For Kajabi:</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li>Log in to your Kajabi account</li>
                        <li>Go to <strong>Settings</strong> → <strong>Code Tracking & Analytics</strong></li>
                        <li>Scroll to the <strong>Custom Code</strong> section</li>
                        <li>Paste the tracking script in the <strong>Footer Tracking Code</strong> field</li>
                        <li>Click <strong>Save Changes</strong></li>
                        <li>The script will now appear on all pages of your Kajabi site</li>
                      </ol>
                      <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded">
                        <p className="text-xs text-primary-900">
                          <strong>Pro Tip:</strong> Make sure to paste it in the Footer section, not the Header.
                          This ensures the page loads faster and tracking works correctly.
                        </p>
                      </div>
                    </>
                  ) : selectedPlatform === 'teachable' ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">For Teachable:</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li>Log in to your Teachable account</li>
                        <li>Go to <strong>Settings</strong> → <strong>Code Snippets</strong></li>
                        <li>Scroll to the <strong>Footer Code</strong> section</li>
                        <li>Paste the tracking script in the text area</li>
                        <li>Click <strong>Save</strong></li>
                        <li>The script will now be active on all your school pages</li>
                      </ol>
                      <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded">
                        <p className="text-xs text-primary-900">
                          <strong>Pro Tip:</strong> If you have a custom domain, make sure it's fully set up
                          before testing the tracking script to ensure accurate attribution.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">For Skool:</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li>Log in to your Skool community as an admin</li>
                        <li>Go to <strong>Settings</strong> → <strong>Plugins</strong> (requires Pro plan)</li>
                        <li>Look for the <strong>Custom Code</strong> or <strong>HTML/CSS</strong> section</li>
                        <li>Paste the tracking script in the <strong>Footer Code</strong> field</li>
                        <li>Click <strong>Save</strong> or <strong>Update</strong></li>
                        <li>The script will track all visitors to your Skool community</li>
                      </ol>
                      <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded">
                        <p className="text-xs text-warning-900">
                          <strong>Note:</strong> Custom code injection requires a Skool Pro plan. If you don't have access to custom code, you can track purchases via webhook integration only (configured in the Platform Integration section above).
                        </p>
                      </div>
                      <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded">
                        <p className="text-xs text-primary-900">
                          <strong>Alternative:</strong> If you're using external landing pages or sales funnels that direct to Skool, install the tracking script on those pages instead. Purchases will still be attributed via webhook.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Test Installation */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Step 3: Verify your installation</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-gray-700">
                  To verify the tracking script is working:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-2">
                  <li>Visit your course website in a new browser tab</li>
                  <li>Open browser Developer Tools (F12 or Cmd+Option+I on Mac)</li>
                  <li>Go to the <strong>Console</strong> tab</li>
                  <li>Look for a message like: <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">CourseSignal tracking initialized</code></li>
                  <li>Check the <strong>Network</strong> tab for requests to <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">/api/tracking/event</code></li>
                </ol>
                <p className="text-xs text-gray-600 mt-3">
                  If you see tracking events being sent, your installation is working correctly!
                </p>
              </div>
            </div>

            <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-sm text-success-900">
                <strong>What the script tracks:</strong> UTM parameters (utm_source, utm_medium, utm_campaign),
                referrer data, landing pages, and session information. All data is linked to purchases
                automatically when someone buys your course.
              </p>
            </div>
          </Card>

          {/* Email Capture API */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Email Capture API</h2>

            <p className="text-sm text-gray-600 mb-4">
              Improve your attribution match rate by capturing visitor emails <strong>before</strong> they purchase.
              Add this simple JavaScript call to your opt-in forms, email signup widgets, or lead magnets.
            </p>

            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg mb-6">
              <p className="text-sm text-warning-900">
                <strong>Why this matters:</strong> ~15% of purchases can't be attributed because we never captured
                the visitor's email. By calling <code className="bg-warning-100 px-1 py-0.5 rounded">identify()</code> when
                someone fills out a form, you'll match 95%+ of your sales to their traffic source.
              </p>
            </div>

            {/* Usage Example */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">How to use</h3>
              <p className="text-sm text-gray-600 mb-3">
                Call this method whenever a visitor provides their email (lead magnet, newsletter signup, pre-checkout form):
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`// When user submits a form with their email
window.CourseSignal.identify('user@example.com');`}</code>
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`window.CourseSignal.identify('user@example.com');`);
                    // Could add a separate copied state here
                  }}
                  className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Platform-Specific Examples */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Integration Examples
              </h3>

              <div className="space-y-4">
                {/* Kajabi Example */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Kajabi Forms</p>
                  <p className="text-xs text-gray-600 mb-3">
                    Add this code to your Kajabi form's custom code section (Forms → Form Settings → Advanced → Custom Code):
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <code>{`<script>
  document.addEventListener('DOMContentLoaded', function() {
    var form = document.querySelector('.kajabi-form');
    form.addEventListener('submit', function(e) {
      var emailInput = form.querySelector('input[type="email"]');
      if (emailInput && window.CourseSignal) {
        window.CourseSignal.identify(emailInput.value);
      }
    });
  });
</script>`}</code>
                  </pre>
                </div>

                {/* Teachable Example */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Teachable Custom Forms</p>
                  <p className="text-xs text-gray-600 mb-3">
                    Add this to your custom landing page or use with Teachable's built-in email capture:
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <code>{`<script>
  document.addEventListener('DOMContentLoaded', function() {
    var form = document.querySelector('#email-signup-form');
    form.addEventListener('submit', function(e) {
      var email = document.querySelector('#email').value;
      if (window.CourseSignal) {
        window.CourseSignal.identify(email);
      }
    });
  });
</script>`}</code>
                  </pre>
                </div>

                {/* ConvertKit/Email Service Example */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">ConvertKit / Email Service Providers</p>
                  <p className="text-xs text-gray-600 mb-3">
                    If you use ConvertKit, Mailchimp, or another email service, add this after their embed code:
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <code>{`<script>
  // For ConvertKit forms
  document.addEventListener('DOMContentLoaded', function() {
    var form = document.querySelector('.formkit-form');
    form.addEventListener('submit', function(e) {
      var emailInput = form.querySelector('input[name="email_address"]');
      if (emailInput && window.CourseSignal) {
        window.CourseSignal.identify(emailInput.value);
      }
    });
  });
</script>`}</code>
                  </pre>
                </div>

                {/* Generic HTML Form Example */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Generic HTML Form</p>
                  <p className="text-xs text-gray-600 mb-3">
                    For any custom HTML form on your site:
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <code>{`<form id="lead-magnet-form">
  <input type="email" id="email" required>
  <button type="submit">Get Free Guide</button>
</form>

<script>
  document.getElementById('lead-magnet-form').addEventListener('submit', function(e) {
    var email = document.getElementById('email').value;
    if (window.CourseSignal) {
      window.CourseSignal.identify(email);
    }
  });
</script>`}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <h3 className="text-sm font-semibold text-primary-900 mb-2">Best Practices</h3>
              <ul className="space-y-1 text-xs text-primary-900">
                <li>• Call <code className="bg-primary-100 px-1 py-0.5 rounded">identify()</code> on form submit, not on page load</li>
                <li>• Check that <code className="bg-primary-100 px-1 py-0.5 rounded">window.CourseSignal</code> exists before calling (in case script hasn't loaded yet)</li>
                <li>• Add to ALL email capture points: lead magnets, webinar signups, newsletter forms, etc.</li>
                <li>• The email is automatically linked to the visitor's UTM parameters and session data</li>
                <li>• When they purchase later (even on a different device), we'll match by email</li>
              </ul>
            </div>
          </Card>

          {/* Site Information */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Site Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site ID
                </label>
                <input
                  type="text"
                  value={siteId}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
