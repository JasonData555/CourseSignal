import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layouts';
import { Card, Button } from '../components/design-system';
import { Copy, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../lib/api';

export default function Settings() {
  const [kajabiConnected, setKajabiConnected] = useState(false);
  const [kajabiApiKey, setKajabiApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [siteId, setSiteId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/kajabi/status');
      setKajabiConnected(response.data.connected);
      setSiteId(response.data.siteId || 'SITE_ID_PLACEHOLDER');
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

  const handleDisconnect = async () => {
    try {
      await api.post('/kajabi/disconnect');
      setKajabiConnected(false);
      setSuccess('Kajabi disconnected');
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/kajabi/sync');
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Kajabi Integration */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kajabi Integration</h2>

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
                  Connect your Kajabi account to automatically import purchases and
                  track revenue by source.
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tracking Script</h2>
            <p className="text-sm text-gray-600 mb-4">
              Install this script on your website to track visitor sources. Add it before
              the closing &lt;/body&gt; tag on every page.
            </p>
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
            <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-primary-900">
                <strong>Note:</strong> The tracking script captures UTM parameters and
                referrer data to attribute purchases to the right marketing sources.
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
