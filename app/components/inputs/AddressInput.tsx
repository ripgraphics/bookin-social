'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BiCurrentLocation } from 'react-icons/bi';
import { MdLocationOn } from 'react-icons/md';
import { searchAddresses, type AddressData, type GeocodingSuggestion } from '@/lib/geocoding';

interface AddressInputProps {
  value?: AddressData | null;
  onChange: (value: AddressData) => void;
  disabled?: boolean;
  required?: boolean;
}

// Using Nominatim (OpenStreetMap) - 100% Free, No API Key Required!

const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  disabled,
  required
}) => {
  const [query, setQuery] = useState(value?.formattedAddress || '');
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Restore focus to input after suggestions load
  useEffect(() => {
    if (showDropdown && suggestions.length > 0 && !isLoading && inputRef.current) {
      // Only restore focus if the input was previously focused
      if (document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [showDropdown, suggestions.length, isLoading]);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchAddresses(searchQuery);
      setSuggestions(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer (1000ms to respect Nominatim rate limits)
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 1000);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: GeocodingSuggestion) => {
    setQuery(suggestion.placeName);
    onChange(suggestion.addressData);
    setShowDropdown(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle use current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { reverseGeocode } = await import('@/lib/geocoding');
          const addressData = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );
          
          if (addressData) {
            setQuery(addressData.formattedAddress);
            onChange(addressData);
          } else {
            alert('Could not find address for your location');
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          alert('Error getting address from location');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location');
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="w-full relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          disabled={disabled}
          required={required}
          placeholder="Start typing an address..."
          className={`
            w-full
            p-4
            pr-24
            font-light
            bg-white
            border-2
            rounded-md
            outline-none
            transition
            disabled:opacity-70
            disabled:cursor-not-allowed
            ${disabled ? 'border-neutral-200' : 'border-neutral-300'}
            ${disabled ? '' : 'focus:border-black'}
          `}
        />
        
        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={disabled}
          className="
            absolute
            right-2
            top-1/2
            -translate-y-1/2
            p-2
            rounded-md
            hover:bg-neutral-100
            transition
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
          title="Use current location"
        >
          <BiCurrentLocation size={20} className="text-neutral-600" />
        </button>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="
            absolute
            w-full
            mt-2
            bg-white
            border
            border-neutral-300
            rounded-md
            shadow-lg
            max-h-80
            overflow-y-auto
            z-50
          "
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`
                w-full
                px-4
                py-3
                text-left
                transition
                flex
                items-start
                gap-3
                ${index === selectedIndex ? 'bg-neutral-100' : 'hover:bg-neutral-50'}
                ${index === 0 ? 'rounded-t-md' : ''}
                ${index === suggestions.length - 1 ? 'rounded-b-md' : 'border-b border-neutral-100'}
              `}
            >
              <MdLocationOn size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {suggestion.addressData.addressLine1}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {[
                    suggestion.addressData.city,
                    suggestion.addressData.stateProvince,
                    suggestion.addressData.country
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Address Display */}
      {value && query && (
        <div className="mt-2 p-3 bg-neutral-50 rounded-md border border-neutral-200">
          <p className="text-sm font-medium text-neutral-700">Selected Address:</p>
          <p className="text-xs text-neutral-600 mt-1">{value.formattedAddress}</p>
          {value.latitude && value.longitude && (
            <p className="text-xs text-neutral-500 mt-1">
              📍 {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;

