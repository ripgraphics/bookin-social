import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { SafeUser } from "@/app/types";

import useLoginModal from "./useLoginModal";

interface IUseFavorite {
    listingId: string;
    currentUser?: SafeUser | null
}

const useFavorite = ({
    listingId,
    currentUser
}: IUseFavorite) => {
    const router = useRouter();
    const loginModal = useLoginModal();

    const supabase = createClient();
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    useEffect(() => {
        if (!currentUser?.id) return;
        let mounted = true;
        (async () => {
            const { data } = await supabase
                .from('user_favorites')
                .select('listing_id')
                .eq('user_id', currentUser.id);
            if (mounted && data) {
                setFavoriteIds(data.map((r: any) => r.listing_id));
            }
        })();
        return () => { mounted = false };
    }, [currentUser?.id, supabase]);

    const hasFavorited = useMemo(() => {
        return favoriteIds.includes(listingId);
    }, [favoriteIds, listingId]);

    const toggleFavorite = useCallback(async (
        e: React.MouseEvent<HTMLDivElement>
    ) => {
        e.stopPropagation();

        if (!currentUser) {
            return loginModal.onOpen();
        }

        try {
            if (hasFavorited) {
                await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('listing_id', listingId)
                    .eq('user_id', currentUser.id);
                setFavoriteIds((prev) => prev.filter((id) => id !== listingId));
            } else {
                await supabase
                    .from('user_favorites')
                    .insert({ user_id: currentUser.id, listing_id: listingId });
                setFavoriteIds((prev) => prev.concat(listingId));
            }
            router.refresh();
            toast.success('Success');
        } catch (error) {
            toast.error('Something went wrong.');
        }
    }, 
    [
        currentUser, 
        hasFavorited, 
        listingId, 
        loginModal,
        router
    ]);

    return {
        hasFavorited,
        toggleFavorite
    }
}

export default useFavorite;