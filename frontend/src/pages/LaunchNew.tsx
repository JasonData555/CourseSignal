import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layouts';
import { LaunchForm } from '../components/launches';
import api from '../lib/api';

export default function LaunchNew() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/launches', data);
      navigate(`/launches/${response.data.id}`);
    } catch (err: any) {
      console.error('Failed to create launch:', err);
      setError(err.response?.data?.error || 'Failed to create launch');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/launches');
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Launch</h1>
          <p className="text-sm text-gray-600 mt-2">
            Set up a new launch to track revenue attribution during your promotion period
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        )}

        <LaunchForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitLabel="Create Launch"
        />
      </div>
    </DashboardLayout>
  );
}
