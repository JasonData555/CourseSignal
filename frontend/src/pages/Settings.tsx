import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layouts';
import { Card, Button } from '../components/design-system';
import { Copy, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import api from '../lib/api';

type Platform = 'kajabi' | 'teachable';

export default function Settings() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('kajabi');
  const [kajabiConnected, setKajabiConnected] = useState(false);
  const [teachableConnected, setTeachableConnected] = useState(false);
  const [kajabiApiKey, setKajabiApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [siteId, setSiteId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const kajabiResponse = await api.get('/kajabi/status');
      setKajabiConnected(kajabiResponse.data.connected);

      const teachableResponse = await api.get('/teachable/status');
      setTeachableConnected(teachableResponse.data.connected);

      setSiteId('SITE_ID_PLACEHOLDER'); // TODO: Fetch from user settings
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleConnectKajabi = async () => {
    if (!kajabiApiKey) {
      setError('Please enter your Kajabi API key');
      return;
    }

    setConnecting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/kajabi/connect', { apiKey: kajabiApiKey });
      setKajabiConnected(true);
      setSuccess('Kajabi connected successfully!');
      setKajabiApiKey('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid Kajabi API key');
    } finally {
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

  const handleDisconnect = async () => {
    const platform = selectedPlatform;
    try {
      await api.delete(`/${platform}/disconnect`);
      if (platform === 'kajabi') {
        setKajabiConnected(false);
      } else {
        setTeachableConnected(false);
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
    var script = document.createElement('script');
    script.src = 'https://your-domain.com/tracking.js';
    script.setAttribute('data-site-id', '${siteId}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(trackingScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConnected = selectedPlatform === 'kajabi' ? kajabiConnected : teachableConnected;

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Platform Integration */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Integration</h2>

            {/* Platform Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Course Platform
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedPlatform('kajabi')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
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
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
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
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kajabi API Key
                      </label>
                      <input
                        type="password"
                        value={kajabiApiKey}
                        onChange={(e) => setKajabiApiKey(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter your API key"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Find your API key in Kajabi Settings → Integrations → API
                      </p>
                    </div>
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
                Step 2: Install on your {selectedPlatform === 'kajabi' ? 'Kajabi' : 'Teachable'} site
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
                  ) : (
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
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Test Installation */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Step 3: Test your installation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Click the button below to verify that your tracking script is working correctly.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  window.open(`https://your-domain.com/test?siteId=${siteId}`, '_blank');
                }}
              >
                Test Installation
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Opens a test page that checks if the tracking script is installed and sending data correctly.
              </p>
            </div>

            <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-sm text-success-900">
                <strong>What the script tracks:</strong> UTM parameters (utm_source, utm_medium, utm_campaign),
                referrer data, landing pages, and session information. All data is linked to purchases
                automatically when someone buys your course.
              </p>
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
