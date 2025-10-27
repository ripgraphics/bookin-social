# EditModal Form Data Loading Fix

## Problem
The form submission was only containing `{category, address, guestCount, roomCount, bathroomCount}` but missing required fields: `title`, `description`, `imageSrc`, `price`. This caused a 400 error when trying to save listing edits.

## Root Cause
The `useEffect` dependency array included the entire `editModal` object, which caused the effect to re-run excessively because `editModal` changes reference frequently. This interfered with the form state and prevented `setValue` calls from being properly registered.

## Solution Applied

### Change 1: Fixed useEffect Dependencies
**File**: `app/components/modals/EditModal.tsx` (line 154)

**Before**:
```typescript
}, [editModal.isOpen, editModal.listingId, setValue, editModal]);
```

**After**:
```typescript
}, [editModal.isOpen, editModal.listingId, setValue]);
```

Removed `editModal` from the dependency array to prevent unnecessary re-runs. The effect now only runs when:
- The modal opens/closes (`editModal.isOpen`)
- The listing ID changes (`editModal.listingId`)
- The setValue function changes (rarely)

### Change 2: Added Debug Logging
**File**: `app/components/modals/EditModal.tsx` (after line 144)

Added console logging to verify form population:
```typescript
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
```

## Testing Instructions

1. Open the edit modal for a listing
2. Navigate through all steps to the final Price step
3. Click "Update"
4. Check browser console for:
   - `[EditModal] Form populated with:` - should show all 8 fields with values
   - `[EditModal] Form data:` - should now include title, description, imageSrc, price
   - `[EditModal] Sending PATCH request:` - should include all required fields
5. Verify the listing saves successfully (200 status, "Listing updated!" toast)

## Expected Outcome

After this fix:
- ✅ Form data includes all required fields: `title`, `description`, `imageSrc`, `price`, `category`, `guestCount`, `roomCount`, `bathroomCount`, `address`
- ✅ The PATCH request succeeds (200 status instead of 400)
- ✅ The listing updates successfully in the database
- ✅ The modal closes and shows "Listing updated!" toast message

## Cleanup
After confirming the fix works, remove the temporary debug logging:
- Line 146-155: `console.log('[EditModal] Form populated with:', ...)`
- Line 199-201: Existing debug logs for form data and payload
