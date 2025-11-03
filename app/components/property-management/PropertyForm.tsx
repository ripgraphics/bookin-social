'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Save, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface PropertyFormProps {
  property?: any;
}

export default function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await axios.get('/api/listings');
      setListings(response.data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const [formData, setFormData] = useState({
    listing_id: property?.listing_id || '',
    management_type: property?.management_type || 'self_managed',
    commission_rate: property?.commission_rate || 0,
    cleaning_fee: property?.cleaning_fee || 0,
    service_fee_rate: property?.service_fee_rate || 0,
    tax_rate: property?.tax_rate || 0,
    currency: property?.currency || 'USD',
    payment_terms: property?.payment_terms || 30,
    auto_invoice: property?.auto_invoice !== undefined ? property.auto_invoice : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (property) {
        // Update existing property
        await axios.put(`/api/properties/management/${property.id}`, formData);
        toast.success('Property updated successfully');
      } else {
        // Create new property
        await axios.post('/api/properties/management', formData);
        toast.success('Property created successfully');
      }

      router.push('/admin/apps/property-management/properties');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving property:', error);
      toast.error(error.response?.data?.error || 'Failed to save property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
            <Building2 className="w-5 h-5 mr-2" />
            Property Configuration
          </h2>
          <p className="text-sm text-gray-600">
            Configure how this property will be managed and billed.
          </p>
        </div>

        <div className="space-y-4">
          {/* Listing Selection */}
          <div>
            <label htmlFor="listing_id" className="block text-sm font-medium text-gray-700 mb-1">
              Select Listing *
            </label>
            <select
              id="listing_id"
              value={formData.listing_id}
              onChange={(e) => handleChange('listing_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a listing</option>
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title || `Listing ${listing.id}`}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the listing to configure management for
            </p>
          </div>

          {/* Management Type */}
          <div>
            <label htmlFor="management_type" className="block text-sm font-medium text-gray-700 mb-1">
              Management Type *
            </label>
            <select
              id="management_type"
              value={formData.management_type}
              onChange={(e) => handleChange('management_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="self_managed">Self Managed</option>
              <option value="host_managed">Host Managed</option>
              <option value="co_hosted">Co-Hosted</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              How this property will be managed
            </p>
          </div>

          {/* Commission Rate */}
          <div>
            <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700 mb-1">
              Host Commission Rate (%)
            </label>
            <input
              type="number"
              id="commission_rate"
              value={formData.commission_rate}
              onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Commission percentage for hosts managing this property
            </p>
          </div>

          {/* Cleaning Fee */}
          <div>
            <label htmlFor="cleaning_fee" className="block text-sm font-medium text-gray-700 mb-1">
              Cleaning Fee ($)
            </label>
            <input
              type="number"
              id="cleaning_fee"
              value={formData.cleaning_fee}
              onChange={(e) => handleChange('cleaning_fee', parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Default cleaning fee for guests
            </p>
          </div>

          {/* Service Fee Rate */}
          <div>
            <label htmlFor="service_fee_rate" className="block text-sm font-medium text-gray-700 mb-1">
              Service Fee Rate (%)
            </label>
            <input
              type="number"
              id="service_fee_rate"
              value={formData.service_fee_rate}
              onChange={(e) => handleChange('service_fee_rate', parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Service fee percentage for bookings
            </p>
          </div>

          {/* Tax Rate */}
          <div>
            <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              id="tax_rate"
              value={formData.tax_rate}
              onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tax rate applied to rental income
            </p>
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>

          {/* Payment Terms */}
          <div>
            <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms (days)
            </label>
            <input
              type="number"
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) => handleChange('payment_terms', parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of days for invoice payment terms
            </p>
          </div>

          {/* Auto-Invoice */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_invoice"
                checked={formData.auto_invoice}
                onChange={(e) => handleChange('auto_invoice', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="auto_invoice" className="ml-2 block text-sm text-gray-900">
                Auto-generate invoices for bookings
              </label>
            </div>
            <p className="mt-1 ml-6 text-xs text-gray-500">
              Automatically create rental invoices when guests book this property
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <X className="w-4 h-4 inline mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 inline mr-2" />
          {isSubmitting ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
        </button>
      </div>
    </form>
  );
}

