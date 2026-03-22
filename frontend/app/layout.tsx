import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Callum — AI news, filtered",
  description:
    "Stay updated on artificial intelligence. Callum filters the noise and delivers only AI news that matters, worldwide.",
  openGraph: {
    title: "Callum — AI news, filtered",
    description:
      "Stay updated on artificial intelligence. Callum filters the noise and delivers only AI news that matters, worldwide.",
    type: "website",
    locale: "en_US",
    siteName: "Callum",
  },
  twitter: {
    card: "summary",
    title: "Callum — AI news, filtered",
    description:
      "Stay updated on artificial intelligence. Callum filters the noise and delivers only AI news that matters, worldwide.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('callum-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans bg-callum-dark text-callum-accent antialiased transition-colors duration-200 dark:bg-callum-dark dark:text-callum-accent">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
