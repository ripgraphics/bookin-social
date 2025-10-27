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
import Heading from '../Heading';

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

interface ListingAmenitiesProps {
  amenities: AmenityCategory[];
}

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

const ListingAmenities: React.FC<ListingAmenitiesProps> = ({ amenities }) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  
  // Expand first 3 categories by default
  useEffect(() => {
    const firstThreeIds = amenities.slice(0, 3).map(cat => cat.id);
    setExpandedCategories(firstThreeIds);
  }, [amenities]);
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const displayedCategories = showAll ? amenities : amenities.slice(0, 5);
  
  if (!amenities || amenities.length === 0) {
    return null;
  }
  
  return (
    <div className="border-b border-neutral-200 pb-8">
      <Heading title="What this place offers" />
      
      <div className="mt-4 flex flex-col gap-4">
        {displayedCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const IconComponent = category.amenities[0]?.icon 
            ? iconRegistry[category.amenities[0].icon] 
            : null;
          
          return (
            <div
              key={category.id}
              className="border border-neutral-300 rounded-xl overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition"
              >
                <div className="flex items-center gap-3">
                  {IconComponent && (
                    <IconComponent className="text-2xl text-neutral-600" />
                  )}
                  <div className="text-left">
                    <div className="text-lg font-semibold">{category.name}</div>
                    <div className="text-sm text-neutral-500">
                      {category.amenities.length} amenit{category.amenities.length !== 1 ? 'ies' : 'y'}
                    </div>
                  </div>
                </div>
                <div className="text-neutral-400">
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </button>
              
              {/* Amenities List */}
              {isExpanded && (
                <div className="border-t border-neutral-300 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {category.amenities.map((amenity) => {
                      const AmenityIcon = amenity.icon ? iconRegistry[amenity.icon] : null;
                      
                      return (
                        <div
                          key={amenity.id}
                          className="flex items-start gap-3 p-3 hover:bg-neutral-50 rounded-lg"
                        >
                          <div className="text-xl text-neutral-700 mt-0.5">
                            {AmenityIcon ? <AmenityIcon /> : '•'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-neutral-900">
                              {amenity.name}
                            </div>
                            {amenity.description && (
                              <div className="text-sm text-neutral-600 mt-0.5">
                                {amenity.description}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Show More/Less Button */}
      {amenities.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-6 text-neutral-700 hover:text-black underline transition"
        >
          {showAll ? 'Show less' : `Show all ${amenities.length} categories`}
        </button>
      )}
    </div>
  );
};

export default ListingAmenities;
