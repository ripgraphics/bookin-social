'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaWifi, FaTv, FaCoffee, FaCity, FaBath, FaWarehouse, FaParking, FaToiletPaper 
} from 'react-icons/fa';
import { 
  MdKitchen, MdLocalLaundryService, MdLock, MdHotTub, MdIron, MdCurtains, 
  MdMicrowave, MdAcUnit, MdCleaningServices, MdVolumeUp, MdVideocam, MdSmokeFree, 
  MdSensors, MdWorkspaces, MdBalcony, MdDoorFront, MdOutdoorGrill, MdCable, MdTableRestaurant 
} from 'react-icons/md';
import { 
  GiIsland, GiCargoShip, GiSailboat, GiShower, GiBed, 
  GiCookingPot, GiGasStove, GiBread, 
  GiBlender, GiWaterfall 
} from 'react-icons/gi';
import { TbAirConditioning } from 'react-icons/tb';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

// Icon registry - using only icons that exist in react-icons
const iconRegistry: Record<string, React.ComponentType<any>> = {
  'GiIsland': GiIsland,
  'GiCargoShip': GiCargoShip,
  'FaCity': FaCity,
  'GiSailboat': GiSailboat,
  'FaBath': FaBath,
  'GiHairDryer': MdLocalLaundryService, // Using alternative
  'MdLocalLaundryService': MdLocalLaundryService,
  'FaToiletPaper': FaToiletPaper,
  'MdCurtains': MdCurtains,
  'MdIron': MdIron,
  'GiCloset': MdDoorFront, // Using alternative
  'MdCable': MdCable,
  'FaTv': FaTv,
  'MdVolumeUp': MdVolumeUp,
  'TbAirConditioning': TbAirConditioning,
  'GiFan': TbAirConditioning, // Using alternative
  'MdSmokeFree': MdSmokeFree,
  'MdSensors': MdSensors,
  'FaWifi': FaWifi,
  'MdWorkspaces': MdWorkspaces,
  'MdKitchen': MdKitchen,
  'MdMicrowave': MdMicrowave,
  'GiCookingPot': GiCookingPot,
  'GiPlate': MdTableRestaurant, // Using alternative
  'MdAcUnit': MdAcUnit,
  'GiGasStove': GiGasStove,
  'GiGasOven': GiGasStove, // Using alternative
  'GiKettle': FaCoffee, // Using alternative
  'FaCoffee': FaCoffee,
  'GiBread': GiBread,
  'GiBlender': GiBlender,
  'MdTableRestaurant': MdTableRestaurant,
  'GiWaterfall': GiWaterfall,
  'MdBalcony': MdBalcony,
  'GiGardenClaw': MdBalcony, // Using alternative
  'MdOutdoorGrill': MdOutdoorGrill,
  'FaWarehouse': FaWarehouse,
  'FaParking': FaParking,
  'MdLock': MdLock,
  'MdHotTub': MdHotTub,
  'MdCleaningServices': MdCleaningServices,
  'MdVideocam': MdVideocam,
  'GiUmbrellaBeach': MdBalcony, // Using alternative
  'MdDoorFront': MdDoorFront,
};

interface Amenity {
  id: string;
  name: string;
  icon: string;
  description: string | null;
}

interface AmenityCategory {
  id: string;
  name: string;
  amenities: Amenity[];
}

interface AmenitySelectorProps {
  categories: AmenityCategory[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

const AmenitySelector: React.FC<AmenitySelectorProps> = ({
  categories,
  selectedIds,
  onChange,
  disabled = false,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Expand all categories by default
  useEffect(() => {
    if (categories && Array.isArray(categories)) {
      const allCategoryIds = categories.map(cat => cat.id);
      setExpandedCategories(allCategoryIds);
    }
  }, [categories]);
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const handleToggleAmenity = (amenityId: string) => {
    if (disabled) return;
    
    const newSelectedIds = selectedIds.includes(amenityId)
      ? selectedIds.filter(id => id !== amenityId)
      : [...selectedIds, amenityId];
    
    onChange(newSelectedIds);
  };
  
  const handleToggleCategory = (category: AmenityCategory) => {
    if (disabled) return;
    
    const categoryAmenityIds = category.amenities.map(a => a.id);
    const allSelected = categoryAmenityIds.every(id => selectedIds.includes(id));
    
    let newSelectedIds: string[];
    if (allSelected) {
      // Deselect all in category
      newSelectedIds = selectedIds.filter(id => !categoryAmenityIds.includes(id));
    } else {
      // Select all in category
      const idsToAdd = categoryAmenityIds.filter(id => !selectedIds.includes(id));
      newSelectedIds = [...selectedIds, ...idsToAdd];
    }
    
    onChange(newSelectedIds);
  };
  
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No amenities available
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-3">
      {categories.map((category) => {
        const isExpanded = expandedCategories.includes(category.id);
        const categoryAmenityIds = category.amenities.map(a => a.id);
        const selectedCount = categoryAmenityIds.filter(id => selectedIds.includes(id)).length;
        const allSelected = selectedCount === categoryAmenityIds.length && categoryAmenityIds.length > 0;
        const someSelected = selectedCount > 0 && !allSelected;
        
        return (
          <div
            key={category.id}
            className="border border-neutral-300 rounded-lg overflow-hidden"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between p-3 bg-neutral-50">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={() => handleToggleCategory(category)}
                  disabled={disabled}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="flex-1 flex items-center justify-between text-left hover:opacity-75 transition"
                >
                  <div>
                    <div className="font-semibold text-neutral-900">{category.name}</div>
                    <div className="text-xs text-neutral-500">
                      {selectedCount} of {category.amenities.length} selected
                    </div>
                  </div>
                  <div className="text-neutral-400">
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </button>
              </div>
            </div>
            
            {/* Amenities List */}
            {isExpanded && (
              <div className="border-t border-neutral-300 bg-white p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {category.amenities.map((amenity) => {
                    const AmenityIcon = amenity.icon ? iconRegistry[amenity.icon] : null;
                    const isSelected = selectedIds.includes(amenity.id);
                    
                    return (
                      <label
                        key={amenity.id}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                          ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-neutral-50'}
                          ${isSelected ? 'bg-neutral-100' : ''}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleAmenity(amenity.id)}
                          disabled={disabled}
                          className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex-1 flex items-start gap-2">
                          {AmenityIcon && (
                            <div className="text-lg text-neutral-700 mt-0.5">
                              <AmenityIcon />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm text-neutral-900">
                              {amenity.name}
                            </div>
                            {amenity.description && (
                              <div className="text-xs text-neutral-600 mt-0.5">
                                {amenity.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Selection Summary */}
      <div className="text-sm text-neutral-600 text-center py-2">
        {selectedIds.length} amenity{selectedIds.length !== 1 ? 'ies' : ''} selected
      </div>
    </div>
  );
};

export default AmenitySelector;

