import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
// import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/header";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Swimology - Swim Instruction & Safety",
  description: "Professional swim instruction and water safety management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <AuthProvider>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
