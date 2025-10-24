'use client';

import { createClient } from '@/lib/supabase/client';
import { AiFillFacebook, AiFillGithub, AiFillTwitterCircle, AiFillTwitterSquare, AiOutlineTwitter } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { useCallback, useState } from 'react';
import {
    FieldValues,
    SubmitHandler,
    useForm
} from 'react-hook-form';

import useRegisterModal from '@/app/hooks/useRegisterModal';
import useLoginModal from '@/app/hooks/useLoginModal';
import Modal from './Modal';
import Heading from '../Heading';
import Input from '../inputs/Input';
import { toast } from 'react-hot-toast';
import Button from '../Button';

const RegisterModal = () => {
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
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    }
});

const supabase = createClient();

const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsLoading(true);
    try {
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: { 
                    first_name: data.firstName,
                    last_name: data.lastName
                }
            }
        });
        if (error) throw error;
        toast.success('Account created successfully. Check your email.');
        registerModal.onClose();
        loginModal.onOpen();
    } catch (e: any) {
        toast.error(e?.message || 'Something went wrong.');
    } finally {
        setIsLoading(false);
    }
}

    const toggle = useCallback(() => {
        registerModal.onClose();
        loginModal.onOpen();
    }, [loginModal, registerModal]);

    const bodyContent = (
        <div className="flex flex-col gap-4">
            <Heading 
                title="Welcome to BOOKin.Social"
                subtitle="Create an account!"
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
                id="firstName"
                label="First Name"
                disabled={isLoading}
                register={register}
                errors={errors}
                required
            />
            <Input 
                id="lastName"
                label="Last Name"
                disabled={isLoading}
                register={register}
                errors={errors}
                required
            />
            <Input 
                id="password"
                label="Password"
                type="password"
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
                        Already have an account?
                    </div>
                    <div
                        onClick={toggle}
                        className="
                            text-neutral-800
                            cursor-pointer
                            hover:underline
                        "
                    >
                        Log in
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <Modal
            disabled={isLoading}
            isOpen={registerModal.isOpen}
            title="Register"
            actionLabel="Continue"
            onClose={registerModal.onClose}
            onSubmit={handleSubmit(onSubmit)}
            body={bodyContent}
            footer={footerContent}
        />
    );
}

export default RegisterModal;