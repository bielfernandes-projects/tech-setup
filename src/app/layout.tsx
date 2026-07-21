import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import { site, siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: site.locale,
    type: "website",
    images: [
      {
        url: site.ogImage,
        width: 1200,
        height: 630,
        alt: site.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: [site.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: site.icon,
    shortcut: site.icon,
    apple: site.icon,
  },
  other: {
    "google-site-verification": "7HsyJ-d3CkcuUwYeFbw2I24Dnz7hdC_JavINiLc3eg0",
  },
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const footerLinks = [
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookie-policy", label: "Cookies" },
  { href: "/dmca", label: "DMCA" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-border">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="font-bold text-lg tracking-tight text-ink hover:text-primary transition-colors">
                {site.name}
              </Link>
              <nav className="flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted hover:text-ink transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-border mt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted">
                &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
              </p>
              <nav className="flex items-center gap-4">
                {footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs text-muted hover:text-ink transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
