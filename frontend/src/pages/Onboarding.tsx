import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/design-system';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../lib/api';

type OnboardingStep = 'welcome' | 'platform' | 'connect' | 'install' | 'complete';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [kajabiApiKey, setKajabiApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const steps: OnboardingStep[] = ['welcome', 'platform', 'connect', 'install', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleConnectKajabi = async () => {
    if (!kajabiApiKey) {
      setError('Please enter your Kajabi API key');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      await api.post('/kajabi/connect', { apiKey: kajabiApiKey });
      handleNext();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid Kajabi API key');
    } finally {
      setConnecting(false);
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card padding="lg">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to CourseSignal!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Let's get you set up so you can start tracking which marketing channels
                drive your course sales.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-primary-600">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Connect Platform</h3>
                  <p className="text-sm text-gray-600">Link your Kajabi account</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-primary-600">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Install Script</h3>
                  <p className="text-sm text-gray-600">Add tracking to your site</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-primary-600">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">See Insights</h3>
                  <p className="text-sm text-gray-600">Track your revenue sources</p>
                </div>
              </div>
              <Button size="lg" onClick={handleNext}>
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Platform Selection Step */}
          {currentStep === 'platform' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Course Platform
              </h2>
              <p className="text-gray-600 mb-6">
                Select the platform where you host your courses
              </p>
              <div className="space-y-3 mb-8">
                <button
                  onClick={() => setSelectedPlatform('kajabi')}
                  className={clsx(
                    'w-full p-4 rounded-lg border-2 text-left transition-all',
                    selectedPlatform === 'kajabi'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Kajabi</h3>
                      <p className="text-sm text-gray-600">
                        Connect via API key
                      </p>
                    </div>
                    {selectedPlatform === 'kajabi' && (
                      <CheckCircle className="w-6 h-6 text-primary-600" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setSelectedPlatform('other')}
                  className={clsx(
                    'w-full p-4 rounded-lg border-2 text-left transition-all',
                    selectedPlatform === 'other'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Other Platform</h3>
                      <p className="text-sm text-gray-600">
                        Use tracking script only
                      </p>
                    </div>
                    {selectedPlatform === 'other' && (
                      <CheckCircle className="w-6 h-6 text-primary-600" />
                    )}
                  </div>
                </button>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleBack}>
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!selectedPlatform}
                  onClick={handleNext}
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Connect Platform Step */}
          {currentStep === 'connect' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedPlatform === 'kajabi' ? 'Connect Kajabi' : 'Setup Tracking'}
              </h2>

              {selectedPlatform === 'kajabi' ? (
                <>
                  <p className="text-gray-600 mb-6">
                    Enter your Kajabi API key to sync your purchases automatically
                  </p>
                  <div className="mb-6">
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
                    {error && (
                      <p className="mt-2 text-sm text-danger-600">{error}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      Find your API key in Kajabi Settings → Integrations → API
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleBack}>
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleConnectKajabi}
                      loading={connecting}
                    >
                      Connect Kajabi
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    You'll install the tracking script to capture visitor data
                  </p>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleBack}>
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                    </Button>
                    <Button className="flex-1" onClick={handleNext}>
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Install Script Step */}
          {currentStep === 'install' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Install Tracking Script
              </h2>
              <p className="text-gray-600 mb-6">
                Add this script to your website to track visitor sources
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
                <code className="text-sm">
                  {`<script src="https://your-domain.com/tracking.js" data-site-id="YOUR_SITE_ID"></script>`}
                </code>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Add this script before the closing &lt;/body&gt; tag on every page of your site.
                Full instructions are available in Settings.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleBack}>
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button className="flex-1" onClick={handleNext}>
                  I've Installed the Script
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You're All Set!
              </h2>
              <p className="text-gray-600 mb-8">
                CourseSignal is now tracking your revenue sources. Data will start
                appearing in your dashboard as visitors arrive and students make purchases.
              </p>
              <Button size="lg" onClick={handleFinish}>
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
