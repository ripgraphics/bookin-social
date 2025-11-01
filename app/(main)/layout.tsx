import type { Metadata } from "next";
import Navbar from "../components/navbar/Navbar";
import ClientOnly from "../components/ClientOnly";
import RegisterModal from "../components/modals/RegisterModal";
import LoginModal from "../components/modals/LoginModal";
import RentModal from "../components/modals/RentModal";
import SearchModal from "../components/modals/SearchModal";
import EditModal from "../components/modals/EditModal";
import ToasterProvider from "../providers/ToasterProvider";
import getCurrentUser from "../actions/getCurrentUser";

export const metadata: Metadata = {
  title: "BOOKIN.social",
  description: "Book unique places to stay around the world",
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <>
      <ClientOnly>
        <ToasterProvider />
        <SearchModal />
        <EditModal />
        <RentModal />
        <LoginModal />
        <RegisterModal />
        <Navbar currentUser={currentUser} />
      </ClientOnly>
      <div className="pb-20 pt-28">
        {children}
      </div>
    </>
  );
}

