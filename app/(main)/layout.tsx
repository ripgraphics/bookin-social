import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BOOKIN.social",
  description: "Book unique places to stay around the world",
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

