import { Link } from 'react-router-dom';
import { Card } from '../components/design-system';
import { BarChart3, Mail } from 'lucide-react';

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="w-10 h-10 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">CourseSignal</span>
          </div>
        </div>

        <Card className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h1>
          <p className="text-gray-600 mb-6">
            We've sent you a verification link. Click the link in the email to verify
            your account and get started.
          </p>

          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700">
              try again
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
