"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthForm from "../components/AuthForm";
import { usePathname } from "next/navigation";
import AccountDropdown from "../components/AccountDropdown";
import { useRouter } from "next/navigation";
import ClientOnly from "../components/ClientOnly";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [mounted]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showAccountDropdown || !mounted) return;

    function handleClick(e: MouseEvent) {
      if (
        accountBtnRef.current &&
        !accountBtnRef.current.contains(e.target as Node)
      ) {
        setShowAccountDropdown(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showAccountDropdown, mounted]);

  function handleLogout() {
    console.log("Logging out...");
    localStorage.removeItem("token");
    setShowAccountDropdown(false);
    setIsLoggedIn(false);
    router.push("/");
    router.refresh();
  }

  // Special route handling
  if (pathname === "/reset-password" || pathname === "/404" || pathname === "/not-found") {
    return (
      <html lang="en">
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    );
  }

  const content = (
    <>
      {!mounted || isLoggedIn === null ? (
        // Loading state
        <div className="p-8 space-y-4">
          <div className="h-6 w-1/3 bg-gray-300 animate-pulse rounded"></div>
          <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
        </div>
      ) : isLoggedIn ? (
        <>
          {/* navbar - modified to be fixed at the top */}
          <nav className="bg-gray-800 p-4 text-white fixed top-0 left-0 w-full z-50 shadow-md">
            <div className="container mx-auto flex items-center justify-between">
              <Link href="/" className="text-xl font-bold">
                SOCMED
              </Link>
              <div className="flex items-center gap-4">
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-64 p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Link href="/notifications" passHref>
                  <button
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label="Notifications"
                    type="button"
                  >
                    <Image
                      className="dark:invert"
                      src="/notification-bell-1395-svgrepo-com.svg"
                      alt="Notifications"
                      width={24}
                      height={24}
                    />
                  </button>
                </Link>
                <div className="relative">
                  <button
                    ref={accountBtnRef}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label="Account"
                    type="button"
                    onClick={() => setShowAccountDropdown(v => !v)}
                  >
                    <Image
                      className="dark:invert"
                      src="/avatar-people-user-svgrepo-com.svg"
                      alt="Account"
                      width={30}
                      height={30}
                    />
                  </button>
                  {showAccountDropdown && (
                    <AccountDropdown
                      onLogout={handleLogout}
                      onClose={() => setShowAccountDropdown(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          </nav>
          {/* Add padding to content to prevent it from being hidden under the navbar */}
          <div className="pt-16">
            {children}
          </div>
        </>
      ) : (
        <AuthForm onSuccess={() => setIsLoggedIn(true)} />
      )}
    </>
  );

  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {content}
      </body>
    </html>
  );
}