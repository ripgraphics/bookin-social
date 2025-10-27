-- =====================================================
-- SEED AMENITIES DATA
-- =====================================================
-- This migration populates the amenities system with
-- initial categories and amenities based on common
-- vacation rental offerings.
-- =====================================================

-- =====================================================
-- 1. INSERT AMENITY CATEGORIES
-- =====================================================

INSERT INTO public.amenity_categories (name, slug, description, icon, display_order, is_active) VALUES
('Scenic Views', 'scenic-views', 'Beautiful views from the property', '🌅', 1, true),
('Bathroom', 'bathroom', 'Bathroom amenities and features', '🚿', 2, true),
('Bedroom and Laundry', 'bedroom-laundry', 'Bedroom essentials and laundry facilities', '🛏️', 3, true),
('Entertainment', 'entertainment', 'Entertainment systems and connectivity', '📺', 4, true),
('Heating and Cooling', 'heating-cooling', 'Climate control systems', '❄️', 5, true),
('Home Safety', 'home-safety', 'Safety and security features', '🔒', 6, true),
('Internet and Office', 'internet-office', 'Internet connectivity and workspace', '💻', 7, true),
('Kitchen and Dining', 'kitchen-dining', 'Kitchen appliances and dining facilities', '🍳', 8, true),
('Location Features', 'location-features', 'Special location and access features', '📍', 9, true),
('Outdoor', 'outdoor', 'Outdoor spaces and furniture', '🌳', 10, true),
('Parking and Facilities', 'parking-facilities', 'Parking options and facility access', '🚗', 11, true),
('Services', 'services', 'Guest services and conveniences', '🔑', 12, true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2. INSERT AMENITIES
-- =====================================================

-- Get category IDs for reference
DO $$
DECLARE
    cat_scenic_views uuid;
    cat_bathroom uuid;
    cat_bedroom_laundry uuid;
    cat_entertainment uuid;
    cat_heating_cooling uuid;
    cat_home_safety uuid;
    cat_internet_office uuid;
    cat_kitchen_dining uuid;
    cat_location_features uuid;
    cat_outdoor uuid;
    cat_parking_facilities uuid;
    cat_services uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO cat_scenic_views FROM public.amenity_categories WHERE slug = 'scenic-views';
    SELECT id INTO cat_bathroom FROM public.amenity_categories WHERE slug = 'bathroom';
    SELECT id INTO cat_bedroom_laundry FROM public.amenity_categories WHERE slug = 'bedroom-laundry';
    SELECT id INTO cat_entertainment FROM public.amenity_categories WHERE slug = 'entertainment';
    SELECT id INTO cat_heating_cooling FROM public.amenity_categories WHERE slug = 'heating-cooling';
    SELECT id INTO cat_home_safety FROM public.amenity_categories WHERE slug = 'home-safety';
    SELECT id INTO cat_internet_office FROM public.amenity_categories WHERE slug = 'internet-office';
    SELECT id INTO cat_kitchen_dining FROM public.amenity_categories WHERE slug = 'kitchen-dining';
    SELECT id INTO cat_location_features FROM public.amenity_categories WHERE slug = 'location-features';
    SELECT id INTO cat_outdoor FROM public.amenity_categories WHERE slug = 'outdoor';
    SELECT id INTO cat_parking_facilities FROM public.amenity_categories WHERE slug = 'parking-facilities';
    SELECT id INTO cat_services FROM public.amenity_categories WHERE slug = 'services';

    -- ============ SCENIC VIEWS ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_scenic_views, 'Bay view', 'bay-view', 'View of the bay', 'GiIsland', false, 1),
    (cat_scenic_views, 'Harbor view', 'harbor-view', 'View of the harbor', 'GiCargoShip', false, 2),
    (cat_scenic_views, 'City skyline view', 'city-skyline-view', 'View of the city skyline', 'FaCity', false, 3),
    (cat_scenic_views, 'Marina view', 'marina-view', 'View of the marina', 'GiSailboat', false, 4)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ BATHROOM ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_bathroom, 'Bathtub', 'bathtub', 'Full bathtub available', 'FaBath', false, 1),
    (cat_bathroom, 'Hair dryer', 'hair-dryer', 'Hair dryer provided', 'GiHairDryer', false, 2),
    (cat_bathroom, 'Shampoo', 'shampoo', 'Shampoo provided', 'FaBottleDroplet', false, 3),
    (cat_bathroom, 'Conditioner', 'conditioner', 'Conditioner provided', 'FaBottleDroplet', false, 4),
    (cat_bathroom, 'Body soap', 'body-soap', 'Body soap provided', 'FaSoap', false, 5),
    (cat_bathroom, 'Outdoor shower', 'outdoor-shower', 'Outdoor shower available', 'GiShower', false, 6),
    (cat_bathroom, 'Hot water', 'hot-water', 'Hot water available', 'MdHotTub', true, 7),
    (cat_bathroom, 'Shower gel', 'shower-gel', 'Shower gel provided', 'FaBottleDroplet', false, 8),
    (cat_bathroom, 'Cleaning products', 'cleaning-products', 'Cleaning products available', 'MdCleaningServices', false, 9)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ BEDROOM AND LAUNDRY ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_bedroom_laundry, 'Washer', 'washer', 'Free washer in unit', 'MdLocalLaundryService', false, 1),
    (cat_bedroom_laundry, 'Dryer', 'dryer', 'Free dryer in unit', 'MdLocalLaundryService', false, 2),
    (cat_bedroom_laundry, 'Essentials', 'essentials', 'Towels, bed sheets, soap, and toilet paper', 'FaToiletPaper', true, 3),
    (cat_bedroom_laundry, 'Hangers', 'hangers', 'Clothing hangers provided', 'GiHanger', false, 4),
    (cat_bedroom_laundry, 'Bed linens', 'bed-linens', 'Bed linens provided', 'FaBed', true, 5),
    (cat_bedroom_laundry, 'Extra pillows and blankets', 'extra-pillows-blankets', 'Extra pillows and blankets available', 'GiBed', false, 6),
    (cat_bedroom_laundry, 'Room-darkening shades', 'room-darkening-shades', 'Blackout curtains or shades', 'MdCurtains', false, 7),
    (cat_bedroom_laundry, 'Iron', 'iron', 'Iron and ironing board', 'MdIron', false, 8),
    (cat_bedroom_laundry, 'Clothing storage', 'clothing-storage', 'Closet and dresser available', 'GiCloset', false, 9)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ ENTERTAINMENT ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_entertainment, 'Ethernet connection', 'ethernet-connection', 'Wired ethernet available', 'MdCable', false, 1),
    (cat_entertainment, 'HDTV with streaming', 'hdtv-streaming', 'Large HDTV with streaming services', 'FaTv', false, 2),
    (cat_entertainment, 'Sound system', 'sound-system', 'Bluetooth sound system', 'FaVolumeUp', false, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ HEATING AND COOLING ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_heating_cooling, 'Air conditioning', 'air-conditioning', 'AC system available', 'TbAirConditioning', false, 1),
    (cat_heating_cooling, 'Ceiling fan', 'ceiling-fan', 'Ceiling fan installed', 'GiFan', false, 2),
    (cat_heating_cooling, 'Central heating', 'central-heating', 'Central heating system', 'MdLocalFireDepartment', false, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ HOME SAFETY ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_home_safety, 'Noise monitor', 'noise-monitor', 'Noise decibel monitors on property', 'MdVolumeUp', false, 1),
    (cat_home_safety, 'Security cameras', 'security-cameras', 'Exterior security cameras on property', 'MdVideocam', false, 2),
    (cat_home_safety, 'Smoke alarm', 'smoke-alarm', 'Smoke alarm installed', 'MdSmokeFree', true, 3),
    (cat_home_safety, 'Carbon monoxide alarm', 'carbon-monoxide-alarm', 'Carbon monoxide detector installed', 'MdSensors', true, 4),
    (cat_home_safety, 'Fire extinguisher', 'fire-extinguisher', 'Fire extinguisher available', 'FaFireExtinguisher', true, 5),
    (cat_home_safety, 'First aid kit', 'first-aid-kit', 'First aid kit provided', 'FaKitMedical', false, 6)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ INTERNET AND OFFICE ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_internet_office, 'Wifi', 'wifi', 'Fast and reliable wifi', 'FaWifi', true, 1),
    (cat_internet_office, 'Dedicated workspace', 'dedicated-workspace', 'Workspace with desk and chair', 'MdWorkspaces', false, 2)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ KITCHEN AND DINING ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_kitchen_dining, 'Kitchen', 'kitchen', 'Full kitchen available', 'MdKitchen', false, 1),
    (cat_kitchen_dining, 'Refrigerator', 'refrigerator', 'Refrigerator available', 'MdKitchen', false, 2),
    (cat_kitchen_dining, 'Microwave', 'microwave', 'Microwave available', 'MdMicrowave', false, 3),
    (cat_kitchen_dining, 'Cooking basics', 'cooking-basics', 'Pots, pans, oil, salt and pepper', 'GiCookingPot', false, 4),
    (cat_kitchen_dining, 'Dishes and silverware', 'dishes-silverware', 'Bowls, chopsticks, plates, cups, etc.', 'GiPlate', false, 5),
    (cat_kitchen_dining, 'Freezer', 'freezer', 'Freezer available', 'MdAcUnit', false, 6),
    (cat_kitchen_dining, 'Dishwasher', 'dishwasher', 'Dishwasher available', 'MdLocalLaundryService', false, 7),
    (cat_kitchen_dining, 'Stove', 'stove', 'Stove available', 'GiGasStove', false, 8),
    (cat_kitchen_dining, 'Oven', 'oven', 'Oven available', 'GiGasOven', false, 9),
    (cat_kitchen_dining, 'Hot water kettle', 'hot-water-kettle', 'Electric kettle available', 'GiKettle', false, 10),
    (cat_kitchen_dining, 'Coffee maker', 'coffee-maker', 'Coffee maker available', 'FaCoffee', false, 11),
    (cat_kitchen_dining, 'Wine glasses', 'wine-glasses', 'Wine glasses provided', 'FaWineGlass', false, 12),
    (cat_kitchen_dining, 'Toaster', 'toaster', 'Toaster available', 'GiBread', false, 13),
    (cat_kitchen_dining, 'Baking sheet', 'baking-sheet', 'Baking sheets available', 'GiCookingPot', false, 14),
    (cat_kitchen_dining, 'Blender', 'blender', 'Blender available', 'GiBlender', false, 15),
    (cat_kitchen_dining, 'Dining table', 'dining-table', 'Dining table and chairs', 'MdTableRestaurant', false, 16)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ LOCATION FEATURES ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_location_features, 'Waterfront', 'waterfront', 'Right next to a body of water', 'GiWaterfall', false, 1),
    (cat_location_features, 'Beach access', 'beach-access', 'Shared beach access nearby', 'FaUmbrellaBeach', false, 2),
    (cat_location_features, 'Private entrance', 'private-entrance', 'Separate street or building entrance', 'MdDoorFront', false, 3),
    (cat_location_features, 'Laundromat nearby', 'laundromat-nearby', 'Laundromat within walking distance', 'MdLocalLaundryService', false, 4)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ OUTDOOR ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_outdoor, 'Private patio or balcony', 'private-patio-balcony', 'Private outdoor space', 'MdBalcony', false, 1),
    (cat_outdoor, 'Outdoor furniture', 'outdoor-furniture', 'Outdoor seating available', 'GiGardenClaw', false, 2),
    (cat_outdoor, 'Outdoor dining area', 'outdoor-dining-area', 'Outdoor dining table and chairs', 'MdOutdoorGrill', false, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ PARKING AND FACILITIES ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_parking_facilities, 'Free carport', 'free-carport', 'Free covered parking on premises', 'FaWarehouse', false, 1),
    (cat_parking_facilities, 'Free street parking', 'free-street-parking', 'Free street parking available', 'FaParking', false, 2)
    ON CONFLICT (slug) DO NOTHING;

    -- ============ SERVICES ============
    INSERT INTO public.amenities (category_id, name, slug, description, icon, is_essential, display_order) VALUES
    (cat_services, 'Self check-in', 'self-check-in', 'Check in without meeting host', 'MdKey', false, 1),
    (cat_services, 'Smart lock', 'smart-lock', 'Keyless entry with smart lock', 'MdLock', false, 2)
    ON CONFLICT (slug) DO NOTHING;

END $$;

-- =====================================================
-- SEED COMPLETE
-- =====================================================

