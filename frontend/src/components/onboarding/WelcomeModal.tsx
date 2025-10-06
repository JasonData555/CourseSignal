import { useState } from 'react';
import { X, Rocket, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../design-system';
import { clsx } from 'clsx';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSetup: () => void;
}

export function WelcomeModal({ isOpen, onClose, onStartSetup }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-elevated max-w-2xl w-full p-8 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to CourseSignal! 🎉
            </h2>
            <p className="text-lg text-gray-600">
              Let's get you set up in 2 quick steps
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {/* Step 1 */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-full font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Connect your course platform
                </h3>
                <p className="text-sm text-gray-600">
                  Link Kajabi or Teachable to automatically import purchases
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-full font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Install tracking script on your site
                </h3>
                <p className="text-sm text-gray-600">
                  Add a simple code snippet to track visitor sources
                </p>
              </div>
            </div>
          </div>

          {/* After Setup */}
          <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-success-900">
              <strong>After setup:</strong> You'll see which marketing channels drive your course sales, with detailed attribution for every purchase.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onStartSetup} size="lg">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Start Setup
            </Button>
            <Button onClick={onClose} variant="ghost" size="lg">
              I'll do this later
            </Button>
          </div>

          {/* Time estimate */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Setup takes about 5 minutes. You'll see data within 10 minutes of your first purchase.
          </p>
        </div>
      </div>
    </div>
  );
}
