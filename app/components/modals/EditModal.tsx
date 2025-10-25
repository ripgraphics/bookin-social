'use client';

import axios from "axios";
import { toast } from "react-hot-toast";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

import useEditModal from "@/app/hooks/useEditModal";

import Modal from "./Modal";
import Counter from "../inputs/Counter";
import CategoryInput from "../inputs/CategoryInput";
import AddressInput from "../inputs/AddressInput";
import type { AddressData } from "@/lib/geocoding";
import ImageUpload from "../inputs/ImageUpload";
import Input from "../inputs/Input";
import Heading from "../Heading";
import { categories } from "../navbar/Categories";

enum STEPS {
  CATEGORY = 0,
  LOCATION = 1,
  INFO = 2,
  IMAGES = 3,
  DESCRIPTION = 4,
  PRICE = 5,
}

const EditModal = () => {
  const router = useRouter();
  const editModal = useEditModal();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(STEPS.CATEGORY);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  const Map = useMemo(() => dynamic(() => import('../Map'), {
    ssr: false,
  }), [address]);

  // Fetch listing data when modal opens
  useEffect(() => {
    if (editModal.isOpen && editModal.listingId) {
      setIsLoading(true);
      axios.get(`/api/listings/${editModal.listingId}`)
        .then((response) => {
          const listing = response.data;
          
          // Populate form fields
          setValue('category', listing.category || '');
          // Convert existing address data to AddressData format
          if (listing.formatted_address || listing.city) {
            const addressData: AddressData = {
              formattedAddress: listing.formatted_address || `${listing.city}, ${listing.country}`,
              addressLine1: listing.address_line1 || '',
              addressLine2: listing.address_line2 || '',
              city: listing.city || '',
              stateProvince: listing.state_province || '',
              postalCode: listing.postal_code || '',
              country: listing.country || '',
              countryCode: listing.country_code || '',
              latitude: listing.latitude || 0,
              longitude: listing.longitude || 0,
            };
            setValue('address', addressData);
          } else {
            setValue('address', null);
          }
          setValue('guestCount', listing.guestCount || 1);
          setValue('roomCount', listing.roomCount || 1);
          setValue('bathroomCount', listing.bathroomCount || 1);
          setValue('imageSrc', listing.imageSrc || []);
          setValue('price', listing.price || 1);
          setValue('title', listing.title || '');
          setValue('description', listing.description || '');
        })
        .catch((error) => {
          toast.error('Failed to load listing');
          editModal.onClose();
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [editModal.isOpen, editModal.listingId, setValue, editModal]);

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

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    if (step !== STEPS.PRICE) {
      return onNext();
    }

    setIsLoading(true);

    axios.patch(`/api/listings/${editModal.listingId}`, data)
      .then(() => {
        toast.success('Listing updated!');
        router.refresh();
        reset();
        setStep(STEPS.CATEGORY);
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
        <AddressInput
          value={address}
          onChange={(value) => setCustomValue('address', value)}
          required
        />
        <Map
          center={address ? [address.latitude, address.longitude] : undefined}
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
        <Input
          id="description"
          label="Description"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
          multiline
          rows={6}
          placeholder="Describe your space, amenities, and what guests will love about staying here...&#10;&#10;Press Enter twice to create paragraph breaks."
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

