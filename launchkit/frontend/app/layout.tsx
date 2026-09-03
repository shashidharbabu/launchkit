import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { plexSans, plexMono } from "./fonts";
import { SITE_URL, SITE_NAME, TAGLINE, DESCRIPTION, KEYWORDS } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — go-to-market for app publishers`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: KEYWORDS,
  category: "technology",
  authors: [{ name: "RocketRide", url: "https://rocketride.ai" }],
  creator: "RocketRide",
  publisher: "RocketRide",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    images: [
      {
        url: "/brand/hero-launch-pad.jpg",
        width: 2000,
        height: 1125,
        alt: "A crew in flight suits walking toward a rocket on its launch pad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: TAGLINE,
    images: ["/brand/hero-launch-pad.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            duration={4000}
            toastOptions={{
              unstyled: true,
              classNames: {
                toast:
                  "flex w-full items-center gap-2 rounded-lg border border-border bg-popover p-4 text-body text-popover-foreground shadow-float font-sans",
                actionButton:
                  "ml-auto h-8 shrink-0 border border-border bg-secondary px-3 text-body font-medium text-secondary-foreground",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
