'use client';

import { createClient } from '@/lib/supabase/client';
import { AiFillGithub } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { useCallback, useState } from "react";
import { 
    FieldValues, 
    SubmitHandler, 
    useForm
} from "react-hook-form";

import useRegisterModal from "@/app/hooks/useRegisterModal";
import useLoginModal from "@/app/hooks/useLoginModal";

import Modal from "./Modal";
import Heading from "../Heading";
import Input from "../inputs/Input";
import { toast } from "react-hot-toast";
import Button from "../Button";
import { useRouter } from 'next/navigation'
import TestUsersList from "./TestUsersList";

const LoginModal = () => {
    const router = useRouter();

    const registerModal = useRegisterModal();
    const loginModal = useLoginModal();
    
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: {
            errors,
    }
    } = useForm<FieldValues>({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const supabase = createClient();

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        
        toast.success('Logged in');
        loginModal.onClose();
        
        // Wait a moment for the auth cookie to be set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force a full page reload to ensure fresh server-side data
        // Don't set loading to false since we're navigating away
        window.location.href = '/';
      } catch (e: any) {
        toast.error(e?.message || 'Invalid credentials');
        setIsLoading(false);
      }
    }

    const toggle = useCallback(() => {
        loginModal.onClose();
        registerModal.onOpen();
    }, [loginModal, registerModal]);

    const bodyContent = (
        <div className="flex flex-col gap-4">
            <TestUsersList />
            <Heading 
                title="Welcome back"
                subtitle="Login to your account!"
            />
            <Input 
                id="email"
                label="Email"
                disabled={isLoading}
                register={register}
                errors={errors}
                required
            />
            <Input 
                id="password"
                label="Password"
                disabled={isLoading}
                register={register}
                errors={errors}
                required
            />
        </div>
    )

    const footerContent = (
        <div className="flex flex-col gap-4 mt-3">
            <hr />
            <Button 
                outline 
                label="Continue with Google"
                icon={FcGoogle}
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({ provider: 'google' });
                }} 
            />
            <Button 
                outline 
                label="Continue with Github"
                icon={AiFillGithub}
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({ provider: 'github' });
                }} 
            />
            <div 
                className="
                    text-neutral-500
                    text-center
                    mt-4
                    fornt-light            
                "
            >
                <div className="justify-center flex flex-row items-center gap-2">
                    <div>
                        First time using BOOKin?
                    </div>
                    <div
                        onClick={toggle}
                        className="
                            text-neutral-800
                            cursor-pointer
                            hover:underline
                        "
                    >
                        Create an account!
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <Modal
            disabled={isLoading}
            isOpen={loginModal.isOpen}
            title="Login"
            actionLabel="Continue"
            onClose={loginModal.onClose}
            onSubmit={handleSubmit(onSubmit)}
            body={bodyContent}
            footer={footerContent}
        />
    );
}

export default LoginModal;