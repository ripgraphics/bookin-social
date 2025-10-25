'use client';

import Input from './Input';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface AddressFieldsGroupProps {
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  onFieldChange: (field: string, value: string) => void;
  register: UseFormRegister<any>;
  errors?: FieldErrors;
  disabled?: boolean;
}

export default function AddressFieldsGroup({
  addressLine1,
  addressLine2,
  city,
  stateProvince,
  postalCode,
  country,
  onFieldChange,
  register,
  errors = {},
  disabled = false
}: AddressFieldsGroupProps) {
  return (
    <div className="space-y-4">
      {/* Street Address */}
      <Input
        id="addressLine1"
        label="Street Address"
        value={addressLine1}
        onChange={(e) => onFieldChange('addressLine1', e.target.value)}
        disabled={disabled}
        register={register}
        errors={errors}
        required
      />

      {/* Apt/Unit */}
      <Input
        id="addressLine2"
        label="Apartment, Suite, Unit (Optional)"
        value={addressLine2}
        onChange={(e) => onFieldChange('addressLine2', e.target.value)}
        disabled={disabled}
        register={register}
        errors={errors}
      />

      {/* City & State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="city"
          label="City"
          value={city}
          onChange={(e) => onFieldChange('city', e.target.value)}
          disabled={disabled}
          register={register}
          errors={errors}
          required
        />
        <Input
          id="stateProvince"
          label="State/Province"
          value={stateProvince}
          onChange={(e) => onFieldChange('stateProvince', e.target.value)}
          disabled={disabled}
          register={register}
          errors={errors}
        />
      </div>

      {/* Zip & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="postalCode"
          label="Zip/Postal Code"
          value={postalCode}
          onChange={(e) => onFieldChange('postalCode', e.target.value)}
          disabled={disabled}
          register={register}
          errors={errors}
        />
        <Input
          id="country"
          label="Country"
          value={country}
          onChange={(e) => onFieldChange('country', e.target.value)}
          disabled={disabled}
          register={register}
          errors={errors}
          required
        />
      </div>
    </div>
  );
}

