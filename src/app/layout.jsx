
"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Menu, Moon, Sun, Globe } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import React, { useState, useEffect, createContext, useContext } from "react";
import en from "@/lib/locales/en.json";

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [translations, setTranslations] = useState(en);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const value = {
    theme,
    toggleTheme,
    language,
    setLanguage,
    translations,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default function RootLayout({ children }) {
  return (
    <AppProvider>
      <LayoutContent>{children}</LayoutContent>
    </AppProvider>
  );
}

function LayoutContent({ children }) {
  const pathname = usePathname();
  const { toggleTheme, theme, translations, setLanguage } = useAppContext();

  const navLinks = [
    { href: "/", label: "Biller" },
    { href: "/reports", label: "Reports" },
    { href: "/customers", label: "Customers" },
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{translations.title}</title>
        <meta name="description" content={translations.description} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning={true}
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          fontInter.variable
        )}
      >
        <div className="flex min-h-screen w-full flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 no-print">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold md:text-base"
              >
                <Home className="h-6 w-6" />
                <span className="sr-only">Weighbridge</span>
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    pathname === link.href
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {translations.nav[link.label.toLowerCase()]}
                </Link>
              ))}
            </nav>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                   <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold"
                  >
                    <Home className="h-6 w-6" />
                    <span className="sr-only">Weighbridge</span>
                  </Link>
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "transition-colors hover:text-foreground",
                          pathname === link.href
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground"
                        )}
                      >
                         {translations.nav[link.label.toLowerCase()]}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Change Language</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("en")}>
                    English
                  </DropdownMenuItem>
                  {/* Add other languages here */}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="icon" onClick={toggleTheme}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-2 p-2 md:gap-4 md:p-4">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
