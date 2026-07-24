"use client";

import Script from "next/script";

export function AdSenseScript() {
  return (
    <Script
      id="adsbygoogle-init"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4704944043310509"
      strategy="beforeInteractive"
    />
  );
}
