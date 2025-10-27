'use client';

import axios from "axios";
import { toast } from "react-hot-toast";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";

import useEditModal from "@/app/hooks/useEditModal";

import Modal from "./Modal";
import Counter from "../inputs/Counter";
import CategoryInput from "../inputs/CategoryInput";
import AddressInput from "../inputs/AddressInput";
import AddressFieldsGroup from "../inputs/AddressFieldsGroup";
import type { AddressData } from "@/lib/geocoding";
import ImageUpload from "../inputs/ImageUpload";
import Input from "../inputs/Input";
import TiptapEditor from "../inputs/TiptapEditor";
import AmenitySelector from "../inputs/AmenitySelector";
import Heading from "../Heading";
import { categories } from "../navbar/Categories";

enum STEPS {
  CATEGORY = 0,
  LOCATION = 1,
  INFO = 2,
  AMENITIES = 3,
  IMAGES = 4,
  DESCRIPTION = 5,
  PRICE = 6,
}

const EditModal = () => {
  const router = useRouter();
  const editModal = useEditModal();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(STEPS.CATEGORY);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [addressFields, setAddressFields] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    countryCode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    formattedAddress: '',
  });
  const [listingData, setListingData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
    reset
  } = useForm<FieldValues>({
    defaultValues: {
      category: '',
      address: null,
      guestCount: 1,
      roomCount: 1,
      bathroomCount: 1,
      imageSrc: [],
      price: 1,
      title: '',
      description: '',
    }
  });

  const category = watch('category');
  const address = watch('address') as AddressData | null;
  const guestCount = watch('guestCount');
  const roomCount = watch('roomCount');
  const bathroomCount = watch('bathroomCount');
  const imageSrc = watch('imageSrc');
  const title = watch('title');
  const description = watch('description');
  const price = watch('price');

  const Map = useMemo(() => dynamic(() => import('../Map'), {
    ssr: false,
  }), [addressFields.latitude, addressFields.longitude]);

  // Fetch amenities and current listing amenities when modal opens
  useEffect(() => {
    if (editModal.isOpen) {
      // Fetch all available amenities
      axios.get('/api/amenities')
        .then(response => {
          const flatAmenities = response.data || [];
          
          // Group amenities by category
          const grouped = flatAmenities.reduce((acc: any, amenity: any) => {
            const categoryId = amenity.category_id;
            const categoryName = amenity.category_name;
            
            if (!acc[categoryId]) {
              acc[categoryId] = {
                id: categoryId,
                name: categoryName,
                amenities: []
              };
            }
            
            acc[categoryId].amenities.push({
              id: amenity.id,
              name: amenity.name,
              icon: amenity.icon,
              description: amenity.description || null
            });
            
            return acc;
          }, {});
          
          // Convert to array
          const groupedArray = Object.values(grouped);
          setAmenities(groupedArray);
        })
        .catch((error) => {
          console.error('Failed to load amenities:', error);
          toast.error('Failed to load amenities');
          setAmenities([]);
        });

      // Fetch current listing amenities
      if (editModal.listingId) {
        axios.get(`/api/listings/${editModal.listingId}/amenities`)
          .then(response => {
            const amenityIds = response.data.map((item: any) => item.amenity_id);
            setSelectedAmenityIds(amenityIds);
          })
          .catch((error) => {
            // Silently fail - amenities endpoint may not exist yet
            console.log('Could not fetch listing amenities:', error);
            setSelectedAmenityIds([]);
          });
      }
    }
  }, [editModal.isOpen, editModal.listingId]);

  // Memoize address change handler to prevent AddressInput from losing focus
  const handleAddressSelect = useCallback((addressData: AddressData) => {
    setAddressFields({
      addressLine1: addressData.addressLine1,
      addressLine2: addressData.addressLine2 || '',
      city: addressData.city,
      stateProvince: addressData.stateProvince || '',
      postalCode: addressData.postalCode || '',
      country: addressData.country,
      countryCode: addressData.countryCode,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      formattedAddress: addressData.formattedAddress,
    });
  }, []);

  // Fetch listing data when modal opens
  useEffect(() => {
    if (editModal.isOpen && editModal.listingId) {
      setIsLoading(true);
      axios.get(`/api/listings/${editModal.listingId}`)
        .then((response) => {
          const listing = response.data;
          
          // Debug: Log raw API response
          console.log('[EditModal] Raw API response:', listing);
          console.log('[EditModal] Specific fields:', {
            title: listing.title,
            description: listing.description,
            price: listing.price,
            category: listing.category,
            guestCount: listing.guestCount,
            roomCount: listing.roomCount,
            bathroomCount: listing.bathroomCount,
            imageSrc: listing.imageSrc
          });
          
          // Store listing data for submission
          setListingData({
            title: listing.title,
            description: listing.description,
            price: listing.price,
            category: listing.category,
            guestCount: listing.guestCount,
            roomCount: listing.roomCount,
            bathroomCount: listing.bathroomCount,
            imageSrc: listing.imageSrc,
          });
          
          // Populate form fields using reset() to ensure all fields are properly registered
          reset({
            category: listing.category || '',
            guestCount: listing.guestCount || 1,
            roomCount: listing.roomCount || 1,
            bathroomCount: listing.bathroomCount || 1,
            imageSrc: listing.imageSrc || [],
            price: listing.price || 1,
            title: listing.title || '',
            description: listing.description || '',
          });
          
          // Populate address fields state
          if (listing.formatted_address || listing.city) {
            setAddressFields({
              addressLine1: listing.address_line1 || '',
              addressLine2: listing.address_line2 || '',
              city: listing.city || '',
              stateProvince: listing.state_province || '',
              postalCode: listing.postal_code || '',
              country: listing.country || '',
              countryCode: listing.country_code || '',
              latitude: listing.latitude || null,
              longitude: listing.longitude || null,
              formattedAddress: listing.formatted_address || `${listing.city}, ${listing.country}`,
            });
          } else {
            setAddressFields({
              addressLine1: '',
              addressLine2: '',
              city: '',
              stateProvince: '',
              postalCode: '',
              country: '',
              countryCode: '',
              latitude: null,
              longitude: null,
              formattedAddress: '',
            });
          }
          
          console.log('[EditModal] Form populated with:', {
            category: listing.category,
            guestCount: listing.guestCount,
            roomCount: listing.roomCount,
            bathroomCount: listing.bathroomCount,
            imageSrc: listing.imageSrc,
            price: listing.price,
            title: listing.title,
            description: listing.description
          });
        })
        .catch((error) => {
          toast.error('Failed to load listing');
          editModal.onClose();
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [editModal.isOpen, editModal.listingId, reset]);

  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  const onBack = () => {
    setStep((value) => value - 1);
  };

  const onNext = () => {
    setStep((value) => value + 1);
  }

  const onSubmit: SubmitHandler<FieldValues> = () => {
    if (step !== STEPS.PRICE) {
      return onNext();
    }

    setIsLoading(true);

    // Get current form values (not stale state!)
    const currentValues = getValues();
    
    const formData = {
      title: currentValues.title || '',
      description: currentValues.description || '',
      price: currentValues.price || 1,
      category: currentValues.category || '',
      guestCount: currentValues.guestCount || 1,
      roomCount: currentValues.roomCount || 1,
      bathroomCount: currentValues.bathroomCount || 1,
      imageSrc: currentValues.imageSrc || [],
    };

    // Construct address object from fields
    const addressData = {
      addressLine1: addressFields.addressLine1,
      addressLine2: addressFields.addressLine2,
      city: addressFields.city,
      stateProvince: addressFields.stateProvince,
      postalCode: addressFields.postalCode,
      country: addressFields.country,
      countryCode: addressFields.countryCode,
      latitude: addressFields.latitude,
      longitude: addressFields.longitude,
      formattedAddress: addressFields.formattedAddress ||
        `${addressFields.addressLine1}, ${addressFields.city}, ${addressFields.country}`,
    };

    const payload = {
      ...formData,
      address: addressData,
      amenityIds: selectedAmenityIds
    };

    console.log('[EditModal] Form data:', formData);
    console.log('[EditModal] Address data:', addressData);
    console.log('[EditModal] Sending PATCH request:', payload);

    axios.patch(`/api/listings/${editModal.listingId}`, payload)
      .then(() => {
        toast.success('Listing updated!');
        router.refresh();
        reset();
        setStep(STEPS.CATEGORY);
        setSelectedAmenityIds([]);
        setAddressFields({
          addressLine1: '',
          addressLine2: '',
          city: '',
          stateProvince: '',
          postalCode: '',
          country: '',
          countryCode: '',
          latitude: null,
          longitude: null,
          formattedAddress: '',
        });
        editModal.onClose();
      })
      .catch(() => {
        toast.error('Something went wrong.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const actionLabel = useMemo(() => {
    if (step === STEPS.PRICE) {
      return 'Update'
    }

    return 'Next'
  }, [step]);

  const secondaryActionLabel = useMemo(() => {
    if (step === STEPS.CATEGORY) {
      return undefined;
    }

    return 'Back';
  }, [step]);

  let bodyContent = (
    <div className="flex flex-col gap-8">
      <Heading
        title="Which of these best describes your place?"
        subtitle="Pick a category"
      />
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-3
          max-h-[50vh]
          overflow-y-auto
        "
      >
        {categories.map((item) => (
          <div key={item.label} className="col-span-1">
            <CategoryInput
              onClick={(category) =>
                setCustomValue('category', category)}
              selected={category === item.label}
              label={item.label}
              icon={item.icon}
            />
          </div>
        ))}
      </div>
    </div>
  )

  if (step === STEPS.LOCATION) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Where is your place located?"
          subtitle="Help guests find you!"
        />
        
        {/* Autocomplete Search */}
        <AddressInput
          value={addressFields.formattedAddress ? addressFields as AddressData : null}
          onChange={handleAddressSelect}
        />

        {/* Editable Address Fields */}
        <AddressFieldsGroup
          addressLine1={addressFields.addressLine1}
          addressLine2={addressFields.addressLine2}
          city={addressFields.city}
          stateProvince={addressFields.stateProvince}
          postalCode={addressFields.postalCode}
          country={addressFields.country}
          onFieldChange={(field, value) => {
            setAddressFields(prev => ({
              ...prev,
              [field]: value
            }));
          }}
          errors={errors}
          disabled={isLoading}
        />

        {/* Map */}
        <Map
          center={addressFields.latitude && addressFields.longitude 
            ? [addressFields.latitude, addressFields.longitude] 
            : undefined
          }
        />
      </div>
    )
  }

  if (step === STEPS.INFO) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Share some basic information about your place"
          subtitle="What amenities do you have?"
        />
        <Counter
          title="Guests"
          subtitle="How many guests do you allow?"
          value={guestCount}
          onChange={(value) => setCustomValue('guestCount', value)}
        />
        <hr />
        <Counter
          title="Rooms"
          subtitle="How many rooms do you have?"
          value={roomCount}
          onChange={(value) => setCustomValue('roomCount', value)}
        />
        <hr />
        <Counter
          title="Bathrooms"
          subtitle="How many bathrooms do you have?"
          value={bathroomCount}
          onChange={(value) => setCustomValue('bathroomCount', value)}
        />
      </div>
    )
  }

  if (step === STEPS.AMENITIES) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="What amenities do you offer?"
          subtitle="Select all that apply"
        />
        <AmenitySelector
          categories={amenities}
          selectedIds={selectedAmenityIds}
          onChange={setSelectedAmenityIds}
        />
      </div>
    )
  }

  if (step === STEPS.IMAGES) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Update photos of your place"
          subtitle="Show guests what your place looks like! (Up to 35 images)"
        />
        <ImageUpload
          multiple
          maxFiles={35}
          value={imageSrc}
          onChange={(value) => setCustomValue('imageSrc', value)}
          aspectRatio="16:9"
          uploadFolder="listings"
        />
      </div>
    )
  }

  if (step === STEPS.DESCRIPTION) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="How would you describe your place?"
          subtitle="Share what makes your place special!"
        />
        <Input
          id="title"
          label="Title"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
          multiline
          rows={2}
          placeholder="e.g., Cozy Downtown Loft with City Views"
        />
        <hr />
        <TiptapEditor
          id="description"
          label="Description"
          value={watch('description') || ''}
          onChange={(value) => setValue('description', value)}
          disabled={isLoading}
          errors={errors}
          required
          placeholder="Describe your space, amenities, and what guests will love..."
        />
      </div>
    )
  }

  if (step === STEPS.PRICE) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Now, set your price"
          subtitle="How much do you charge per night?"
        />
        <Input
          id="price"
          label="Price"
          formatPrice
          type="number"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
      </div>
    )
  }

  return (
    <Modal
      isOpen={editModal.isOpen}
      onClose={editModal.onClose}
      onSubmit={handleSubmit(onSubmit)}
      actionLabel={actionLabel}
      secondaryActionLabel={secondaryActionLabel}
      secondaryAction={step === STEPS.CATEGORY ? undefined : onBack}
      title="Edit your listing"
      body={bodyContent}
    />
  );
}

export default EditModal;

