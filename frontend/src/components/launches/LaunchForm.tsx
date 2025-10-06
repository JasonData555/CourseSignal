import { useState } from 'react';
import { Button, Card } from '../design-system';

interface LaunchFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  revenue_goal: string;
  sales_goal: string;
}

interface LaunchFormProps {
  initialData?: Partial<LaunchFormData>;
  onSubmit: (data: LaunchFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function LaunchForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Launch',
}: LaunchFormProps) {
  const [formData, setFormData] = useState<LaunchFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    revenue_goal: initialData?.revenue_goal || '',
    sales_goal: initialData?.sales_goal || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LaunchFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LaunchFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (formData.revenue_goal && parseFloat(formData.revenue_goal) <= 0) {
      newErrors.revenue_goal = 'Revenue goal must be greater than 0';
    }

    if (formData.sales_goal && parseInt(formData.sales_goal) <= 0) {
      newErrors.sales_goal = 'Sales goal must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof LaunchFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Launch Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.title ? 'border-danger-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Summer 2024 Launch"
          />
          {errors.title && <p className="text-sm text-danger-600 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Optional: Describe your launch strategy, target audience, etc."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.start_date ? 'border-danger-500' : 'border-gray-300'
              }`}
            />
            {errors.start_date && (
              <p className="text-sm text-danger-600 mt-1">{errors.start_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
            <input
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.end_date ? 'border-danger-500' : 'border-gray-300'
              }`}
            />
            {errors.end_date && (
              <p className="text-sm text-danger-600 mt-1">{errors.end_date}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revenue Goal (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.revenue_goal}
                onChange={(e) => handleChange('revenue_goal', e.target.value)}
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.revenue_goal ? 'border-danger-500' : 'border-gray-300'
                }`}
                placeholder="10000"
              />
            </div>
            {errors.revenue_goal && (
              <p className="text-sm text-danger-600 mt-1">{errors.revenue_goal}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sales Goal (Optional)
            </label>
            <input
              type="number"
              value={formData.sales_goal}
              onChange={(e) => handleChange('sales_goal', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.sales_goal ? 'border-danger-500' : 'border-gray-300'
              }`}
              placeholder="100"
            />
            {errors.sales_goal && (
              <p className="text-sm text-danger-600 mt-1">{errors.sales_goal}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={isLoading}>
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
