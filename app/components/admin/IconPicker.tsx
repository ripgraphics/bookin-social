'use client';

import React, { useState, useMemo } from 'react';
import { FaWifi, FaTv, FaCoffee, FaCity, FaBath } from 'react-icons/fa';
import { MdKitchen, MdLocalLaundryService, MdLock, MdHotTub, MdIron, MdCurtains, MdMicrowave, MdAcUnit, MdCleaningServices, MdVolumeUp, MdVideocam, MdSmokeFree, MdSensors, MdWorkspaces, MdBalcony, MdDoorFront, MdOutdoorGrill, MdCable, MdTableRestaurant } from 'react-icons/md';
import { GiIsland, GiCargoShip, GiSailboat, GiShower, GiBed, GiCookingPot, GiGasStove, GiBread, GiBlender, GiWaterfall } from 'react-icons/gi';
import { TbAirConditioning } from 'react-icons/tb';
import { FaWarehouse, FaParking, FaToiletPaper } from 'react-icons/fa';

// Icon registry - map amenity names to icon components (using only icons that exist)
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

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
  disabled?: boolean;
}

const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  label = 'Icon',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Get all icon names
  const iconNames = Object.keys(iconRegistry).sort();
  
  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search) return iconNames;
    return iconNames.filter(name => 
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, iconNames]);
  
  // Get the icon component for the selected value
  const SelectedIcon = value ? iconRegistry[value] : null;
  
  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearch('');
  };
  
  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Selected Icon Display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'border-black' : 'border-neutral-300'}
        `}
      >
        <div className="text-2xl">
          {SelectedIcon ? <SelectedIcon /> : <span className="text-gray-400">Select Icon</span>}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">
            {value || 'No icon selected'}
          </div>
          {value && (
            <div className="text-xs text-gray-500">
              {value}
            </div>
          )}
        </div>
        <div className="text-gray-400">
          {isOpen ? '▲' : '▼'}
        </div>
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-20 max-h-[400px] flex flex-col">
            {/* Search Box */}
            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
              <input
                type="text"
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                autoFocus
              />
            </div>
            
            {/* Icon Grid */}
            <div className="overflow-y-auto flex-1 p-3">
              {filteredIcons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No icons found
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {filteredIcons.map((iconName) => {
                    const IconComponent = iconRegistry[iconName];
                    const isSelected = value === iconName;
                    
                    return (
                      <div
                        key={iconName}
                        onClick={() => handleSelect(iconName)}
                        className={`
                          flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer
                          transition-all border-2
                          ${isSelected 
                            ? 'bg-black text-white border-black' 
                            : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                          }
                        `}
                        title={iconName}
                      >
                        <IconComponent className="text-2xl mb-1" />
                        <span className="text-xs text-center truncate w-full">
                          {iconName.substring(0, 12)}...
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IconPicker;
