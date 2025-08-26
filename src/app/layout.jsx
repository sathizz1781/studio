
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, BarChart2, Menu, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "WeighBridge Biller",
  description: "A simple weighbridge billing application.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
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
              <Link
                href="/"
                className="text-foreground transition-colors hover:text-foreground"
              >
                Biller
              </Link>
              <Link
                href="/reports"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Reports
              </Link>
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
                  <Link href="/" className="hover:text-foreground">
                    Biller
                  </Link>
                  <Link
                    href="/reports"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Reports
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
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
