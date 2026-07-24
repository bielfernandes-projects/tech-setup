import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import { site } from "@/lib/site";
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
    "google-site-verification": "MtjK5W3N8G89DsjhL03MlXgaj5lPxmmem9-KeJptP88",
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

const footerCategories = [
  { href: "/blog/category/windows-setup", label: "Windows Setup" },
  { href: "/blog/category/discord-bots", label: "Discord Bots" },
  { href: "/blog/category/ai-development", label: "AI Development" },
  { href: "/blog/category/devops", label: "DevOps" },
  { href: "/blog/category/linux", label: "Linux" },
  { href: "/blog/category/home-automation", label: "Home Automation" },
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
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-ink mb-3">Site</h3>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-sm text-muted hover:text-ink transition-colors">Home</Link></li>
                  <li><Link href="/about" className="text-sm text-muted hover:text-ink transition-colors">About</Link></li>
                  <li><Link href="/contact" className="text-sm text-muted hover:text-ink transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink mb-3">Categories</h3>
                <ul className="space-y-2">
                  {footerCategories.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-muted hover:text-ink transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink mb-3">Legal</h3>
                <ul className="space-y-2">
                  {footerLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-muted hover:text-ink transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink mb-3">{site.name}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Built for developers who debug for a living.
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-6 flex items-center justify-between">
              <p className="text-xs text-muted/60">
                &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
