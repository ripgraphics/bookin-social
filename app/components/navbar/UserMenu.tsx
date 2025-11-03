'use client';

import { useRouter } from 'next/navigation';
import { AiOutlineMenu } from 'react-icons/ai';
import Avatar from '../Avatar';
import { useCallback, useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import axios from 'axios';

import MenuItem from './MenuItem';

import useRegisterModal from '@/app/hooks/useRegisterModal';
import useLoginModal from '@/app/hooks/useLoginModal';
import useRentModal from '@/app/hooks/useRentModal';
import { SafeUser } from '@/app/types';

interface UserMenuProps {
    currentUser?: SafeUser | null;
}

const UserMenu: React.FC<UserMenuProps> = ({
    currentUser
}) => {
    const router = useRouter();
    const registerModal = useRegisterModal();
    const loginModal = useLoginModal();
    const rentModal = useRentModal();
    const supabase = createClient();

    const [isOpen, setIsOpen] = useState(false);
    const [hasPMSAccess, setHasPMSAccess] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleOpen = useCallback(() => {
        setIsOpen((value) => !value);
    }, []);

    const onRent = useCallback(() => {
        if (!currentUser) {
            return loginModal.onOpen();
        }

        rentModal.onOpen();
    }, [currentUser, loginModal, rentModal]);

    // Check if user has PMS access
    useEffect(() => {
        const checkPMSAccess = async () => {
            if (!currentUser) {
                setHasPMSAccess(false);
                return;
            }

            try {
                // Quick client-side check: admins always have access
                if (currentUser.roles && currentUser.roles.some(role => 
                    role.name === 'admin' || role.name === 'super_admin'
                )) {
                    setHasPMSAccess(true);
                    return;
                }

                // For non-admins, check via API
                const response = await axios.get('/api/pms/check-access');
                setHasPMSAccess(response.data.hasAccess);
            } catch (error) {
                console.error('Failed to check PMS access:', error);
                setHasPMSAccess(false);
            }
        };

        checkPMSAccess();
    }, [currentUser]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Helper to close menu after action
    const onMenuItemClick = useCallback((action: () => void) => {
        action();
        setIsOpen(false);
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <div className="flex flex-row items-center gap-3">
                <div
                    onClick={onRent}
                    className="
                        hidden
                        md:block
                        text-sm
                        font-demibold
                        py-3
                        px-4
                        runded-full
                        hover:bg-neutral-100
                        transition
                        cursor-pointer
                    "
                >
                    Host your home
                </div>
                <div 
                    onClick={toggleOpen}
                    className="
                        p-4
                        md:py-1
                        md:px-2
                        border-[1px] 
                        border-neutral-200 
                        flex 
                        flex-row 
                        items-center 
                        gap-3 
                        rounded-full 
                        cursor-pointer 
                        hover:shadow-md 
                        transition
                    "
                >
                    <AiOutlineMenu />
                    <div className="hidden md:block">
                        <Avatar src={currentUser?.avatar_url} />
                    </div>
                </div>
            </div>

            {isOpen && (
                <div 
                    className="
                        absolute
                        rounded-xl
                        shadow-md
                        w-[40vw]
                        md:w-3/4
                        bg-white
                        overflow-hidden
                        right-0
                        top-12
                        text-sm
                    "
                >
                <div className="flex flex-col cursor-pointger">
                    {currentUser ? (
                        <>
                            <MenuItem 
                                onClick={() => onMenuItemClick(() => router.push("/apps/profile"))}
                                label="Profile" 
                            />
                            <MenuItem 
                                onClick={() => onMenuItemClick(() => router.push("/trips"))}
                                label="My trips" 
                            />
                            <MenuItem 
                                onClick={() => onMenuItemClick(() => router.push("/favorites"))}
                                label="My favorites" 
                            />
                            <MenuItem 
                                onClick={() => onMenuItemClick(() => router.push("/reservations"))}
                                label="My reservations" 
                            />
                            <MenuItem 
                                onClick={() => onMenuItemClick(() => router.push("/properties"))}
                                label="My properties" 
                            />
                            {hasPMSAccess && (
                                <MenuItem 
                                    onClick={() => onMenuItemClick(() => router.push("/apps/property-management"))}
                                    label="Property Management" 
                                />
                            )}
                            <MenuItem 
                                onClick={() => onMenuItemClick(() => rentModal.onOpen())}
                                label="Host your home" 
                            />
                            <hr />
                            <MenuItem 
                                onClick={() => onMenuItemClick(async () => { 
                                    await supabase.auth.signOut();
                                    // Force a full page reload to ensure fresh server-side data
                                    window.location.href = '/';
                                })}
                                label="Logout" 
                            />
                        </>
                    ) : (                       
                        <>
                            <MenuItem
                                onClick={() => onMenuItemClick(() => loginModal.onOpen())}
                                label="Login"
                            />
                            <MenuItem
                                onClick={() => onMenuItemClick(() => registerModal.onOpen())}
                                label="Sign up"
                            />
                        </>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}

export default UserMenu;