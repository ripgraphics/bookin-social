'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export interface LineItem {
  id?: string;
  item_type?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  position?: number;
  metadata?: any;
}

interface LineItemsBuilderProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  currency?: string;
}

export default function LineItemsBuilder({ items, onChange, currency = 'USD' }: LineItemsBuilderProps) {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;

  const handleAddItem = () => {
    const newItem: LineItem = {
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      total_amount: 0,
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleUpdateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate totals
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
      const item = newItems[index];
      const subtotal = item.quantity * item.unit_price;
      const taxAmount = (subtotal * item.tax_rate) / 100;
      newItems[index].tax_amount = taxAmount;
      newItems[index].total_amount = subtotal + taxAmount;
    }

    onChange(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + item.total_amount, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Line Items *
        </label>
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">No line items yet. Click "Add Item" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 px-2">
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-1">Tax %</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Line Items */}
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-2 rounded-lg">
              <div className="col-span-5">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                  placeholder="Item description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  value={item.tax_rate}
                  onChange={(e) => handleUpdateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-medium text-gray-900">
                  {currencySymbol}{item.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Totals Summary */}
          <div className="border-t border-gray-300 pt-3 mt-4">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  {currencySymbol}{calculateSubtotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium text-gray-900">
                  {currencySymbol}{calculateTotalTax().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">
                  {currencySymbol}{calculateGrandTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-red-600 mt-1">At least one line item is required</p>
      )}
    </div>
  );
}

