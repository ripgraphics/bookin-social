import { create } from 'zustand';

interface EditModalStore {
  isOpen: boolean;
  listingId: string | null;
  onOpen: (listingId: string) => void;
  onClose: () => void;
}

const useEditModal = create<EditModalStore>((set) => ({
  isOpen: false,
  listingId: null,
  onOpen: (listingId) => set({ isOpen: true, listingId }),
  onClose: () => set({ isOpen: false, listingId: null })
}));

export default useEditModal;

