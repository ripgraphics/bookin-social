import type { Metadata } from "next";
import Navbar from "@/app/components/navbar/Navbar";
import ClientOnly from "@/app/components/ClientOnly";
import getCurrentUser from "@/app/actions/getCurrentUser";

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
        <Navbar currentUser={currentUser} />
      </ClientOnly>
      <div className="pb-20 pt-28">
        {children}
      </div>
    </>
  );
}

