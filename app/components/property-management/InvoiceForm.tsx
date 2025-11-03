'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Save, X, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LineItemsBuilder, { LineItem } from './LineItemsBuilder';

interface InvoiceFormProps {
  invoice?: any;
}

export default function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    invoice_type: invoice?.invoice_type || 'rental',
    property_id: invoice?.property_id || '',
    issued_to: invoice?.issued_to || '',
    customer_type: invoice?.customer_type || 'guest',
    customer_name: invoice?.customer_name || '',
    customer_email: invoice?.customer_email || '',
    customer_address: invoice?.customer_address || { street: '', city: '', state: '', zip: '', country: '' },
    currency: invoice?.currency || 'USD',
    tax_rate: invoice?.tax_rate || 0,
    discount_amount: invoice?.discount_amount || 0,
    due_date: invoice?.due_date || '',
    notes: invoice?.notes || '',
    terms: invoice?.terms || '',
    line_items: invoice?.invoice_line_items || [
      { description: '', quantity: 1, unit_price: 0, tax_rate: 0, total_amount: 0 }
    ] as LineItem[],
  });

  useEffect(() => {
    fetchProperties();
    fetchUsers();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties/management');
      setProperties(response.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent, sendInvoice = false) => {
    e.preventDefault();

    // Validation
    if (!formData.invoice_type) {
      toast.error('Please select an invoice type');
      return;
    }
    if (!formData.issued_to) {
      toast.error('Please select who to issue the invoice to');
      return;
    }
    if (!formData.customer_name || !formData.customer_email) {
      toast.error('Customer name and email are required');
      return;
    }
    if (formData.line_items.length === 0) {
      toast.error('At least one line item is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (invoice) {
        // Update existing invoice
        await axios.put(`/api/invoices/v2/${invoice.id}`, formData);
        toast.success('Invoice updated successfully');
        
        if (sendInvoice) {
          await axios.post(`/api/invoices/v2/${invoice.id}/send`);
          toast.success('Invoice sent successfully');
        }
      } else {
        // Create new invoice
        const response = await axios.post('/api/invoices/v2', formData);
        toast.success('Invoice created successfully');
        
        if (sendInvoice && response.data?.id) {
          await axios.post(`/api/invoices/v2/${response.data.id}/send`);
          toast.success('Invoice sent successfully');
        }
      }

      router.push('/admin/apps/property-management/invoices');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast.error(error.response?.data?.error || 'Failed to save invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customer_address: { ...prev.customer_address, [field]: value }
    }));
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {/* Invoice Type & Property */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
            <FileText className="w-5 h-5 mr-2" />
            Invoice Information
          </h2>
          <p className="text-sm text-gray-600">
            Configure the basic invoice details.
          </p>
        </div>

        <div className="space-y-4">
          {/* Invoice Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="rental"
                  checked={formData.invoice_type === 'rental'}
                  onChange={(e) => handleChange('invoice_type', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  required
                />
                <span className="ml-2 text-sm text-gray-900">Rental</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="operational"
                  checked={formData.invoice_type === 'operational'}
                  onChange={(e) => handleChange('invoice_type', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Operational</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="custom"
                  checked={formData.invoice_type === 'custom'}
                  onChange={(e) => handleChange('invoice_type', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Custom</span>
              </label>
            </div>
          </div>

          {/* Property Selection */}
          <div>
            <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 mb-1">
              Property {formData.invoice_type === 'rental' && '*'}
            </label>
            <select
              id="property_id"
              value={formData.property_id}
              onChange={(e) => handleChange('property_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={formData.invoice_type === 'rental'}
            >
              <option value="">Select a property (optional)</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.listings?.title || `Property ${property.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Issued To */}
          <div>
            <label htmlFor="issued_to" className="block text-sm font-medium text-gray-700 mb-1">
              Issue To *
            </label>
            <select
              id="issued_to"
              value={formData.issued_to}
              onChange={(e) => handleChange('issued_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => handleChange('customer_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email *
            </label>
            <input
              type="email"
              id="customer_email"
              value={formData.customer_email}
              onChange={(e) => handleChange('customer_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="customer_street" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              id="customer_street"
              value={formData.customer_address.street || ''}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="customer_city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="customer_city"
              value={formData.customer_address.city || ''}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="customer_state" className="block text-sm font-medium text-gray-700 mb-1">
              State/Province
            </label>
            <input
              type="text"
              id="customer_state"
              value={formData.customer_address.state || ''}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="customer_zip" className="block text-sm font-medium text-gray-700 mb-1">
              ZIP/Postal Code
            </label>
            <input
              type="text"
              id="customer_zip"
              value={formData.customer_address.zip || ''}
              onChange={(e) => handleAddressChange('zip', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="customer_country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              id="customer_country"
              value={formData.customer_address.country || ''}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
        <LineItemsBuilder
          items={formData.line_items}
          onChange={(items) => handleChange('line_items', items)}
          currency={formData.currency}
        />
      </div>

      {/* Financial Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label htmlFor="discount_amount" className="block text-sm font-medium text-gray-700 mb-1">
              Discount Amount
            </label>
            <input
              type="number"
              id="discount_amount"
              value={formData.discount_amount}
              onChange={(e) => handleChange('discount_amount', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              value={formData.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Internal notes (not visible to customer)"
            />
          </div>
          <div>
            <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">
              Terms & Conditions
            </label>
            <textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => handleChange('terms', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Payment terms and conditions"
            />
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
          {isSubmitting ? 'Saving...' : invoice ? 'Update Invoice' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e as any, true)}
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 inline mr-2" />
          {isSubmitting ? 'Sending...' : 'Save & Send'}
        </button>
      </div>
    </form>
  );
}

