# EditModal Remaining Issue

## Current Status

### Fix Applied ✅
- Removed `editModal` from the `useEffect` dependency array to prevent excessive re-runs
- Added debug logging to track form population

### Test Results
The form IS being populated correctly:
```
[EditModal] Form populated with: {category: Modern, guestCount: 1, roomCount: 1, bathroomCount: 1, imageSrc: Array(14)}
```

However, when submitting, the form data is missing required fields:
```
[EditModal] Form data: {category: Modern, address: null, guestCount: 1, roomCount: 1, bathroomCount: 1}
```

**Missing fields**: `title`, `description`, `imageSrc`, `price`

## Root Cause

The issue is that `react-hook-form`'s `handleSubmit` only includes fields in the form data that are:
1. Registered via `register()`
2. Watched via `watch()`
3. Set via `setValue()` AND referenced in the component

Looking at the code, `imageSrc` is watched (line ~73), but `title`, `description`, and `price` are NOT being watched. This means when `handleSubmit` collects the form data, these fields are excluded even though they were set via `setValue`.

## Solution

Add `watch()` calls for the missing fields so they are included in the form submission.

**File**: `app/components/modals/EditModal.tsx`

**Find** (around line 73):
```typescript
const category = watch('category');
const guestCount = watch('guestCount');
const roomCount = watch('roomCount');
const bathroomCount = watch('bathroomCount');
const imageSrc = watch('imageSrc');
```

**Add after**:
```typescript
const title = watch('title');
const description = watch('description');
const price = watch('price');
```

This ensures that `title`, `description`, and `price` are tracked by `react-hook-form` and will be included in the form data when `handleSubmit` is called.

## Why This Happens

`react-hook-form` optimizes performance by only tracking fields that are explicitly registered or watched. When you use `setValue()` to populate a field, it updates the internal form state, but if that field isn't being watched or registered, it won't be included in the form data object passed to `onSubmit`.

## Expected Outcome After Fix

After adding the `watch()` calls, the form data should include all required fields:
```
[EditModal] Form data: {
  category: Modern,
  guestCount: 1,
  roomCount: 1,
  bathroomCount: 1,
  imageSrc: Array(14),
  price: 190,
  title: "the tiny house",
  description: "this is very nice",
  address: null
}
```

Then the PATCH request will succeed with a 200 status.
