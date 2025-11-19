
"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Menu, Moon, Sun, Globe, LogOut, Settings, BarChart2, Users, Scale } from "lucide-react";
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
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, createContext, useContext } from "react";

// Locales
import en from "@/lib/locales/en.json";
import hi from "@/lib/locales/hi.json";
import ta from "@/lib/locales/ta.json";
import bn from "@/lib/locales/bn.json";

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const translations = { en, hi, ta, bn };

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [currentTranslations, setCurrentTranslations] = useState(en);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState({ 
    upiId: "", 
    companyName: "",
    serialHost: ""
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    const storedLang = localStorage.getItem("language") || "en";
    setLanguage(storedLang);

    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);

    const storedConfig = JSON.parse(localStorage.getItem("appConfig")) || { 
      upiId: "default@upi", 
      companyName: "My Company",
      serialHost: "localhost:4000"
    };
    setConfig(storedConfig);

    if (!authStatus && pathname !== "/login") {
      router.push("/login");
    }
  }, [pathname, router]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setCurrentTranslations(translations[language] || en);
    localStorage.setItem("language", language);
  }, [language]);
  
  const login = () => {
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    router.push("/login");
  };

  const saveConfig = (newConfig) => {
    localStorage.setItem("appConfig", JSON.stringify(newConfig));
    setConfig(newConfig);
  }

  const value = {
    theme,
    toggleTheme: () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
    language,
    setLanguage,
    translations: currentTranslations,
    isAuthenticated,
    login,
    logout,
    config,
    saveConfig,
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
  const { toggleTheme, theme, translations, setLanguage, isAuthenticated, logout } = useAppContext();

  const navLinks = [
    { href: "/", label: "Biller", icon: Home },
    { href: "/reports", label: "Reports", icon: BarChart2 },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/config", label: "Configuration", icon: Settings },
  ];

  if (!isAuthenticated) {
     return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn("min-h-screen bg-background font-body antialiased", fontInter.variable)}>
                {children}
                <Toaster />
            </body>
        </html>
     );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{translations.title}</title>
        <meta name="description" content={translations.description} />
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
                <Scale className="h-6 w-6" />
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
                  {translations.nav[link.label.toLowerCase()] || link.label}
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
                    <Scale className="h-6 w-6" />
                    <span className="sr-only">Weighbridge</span>
                  </Link>
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-4 transition-colors hover:text-foreground",
                          pathname === link.href
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground"
                        )}
                      >
                         <link.icon className="h-5 w-5" />
                         {translations.nav[link.label.toLowerCase()] || link.label}
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
                   <DropdownMenuItem onClick={() => setLanguage("hi")}>
                    Hindi (हिन्दी)
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => setLanguage("ta")}>
                    Tamil (தமிழ்)
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => setLanguage("bn")}>
                    Bengali (বাংলা)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="icon" onClick={toggleTheme}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
               <Button variant="outline" size="icon" onClick={logout}>
                  <LogOut className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">Logout</span>
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
