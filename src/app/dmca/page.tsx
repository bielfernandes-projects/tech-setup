import type { Metadata } from "next";

const siteUrl = "https://tech-setup.vercel.app";

export const metadata: Metadata = {
  title: "DMCA Notice",
  description: "Tech Setup DMCA policy — how to report copyright infringement.",
  alternates: {
    canonical: `${siteUrl}/dmca`,
  },
};

export default function DmcaPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        DMCA Notice
      </h1>
      <div className="mt-8 prose prose-zinc max-w-none text-sm">
        <p>
          Tech Setup respects the intellectual property rights of others. If you
          believe that any material on this site infringes your copyright, please
          contact us with the following information:
        </p>
        <ul>
          <li>Identification of the copyrighted work claimed to be infringed</li>
          <li>Identification of the material that is claimed to be infringing</li>
          <li>
            Your contact information (address, telephone number, email address)
          </li>
          <li>
            A statement that you have a good faith belief that use of the
            material is not authorized by the copyright owner
          </li>
          <li>
            A statement, under penalty of perjury, that the information in the
            notification is accurate
          </li>
          <li>Your physical or electronic signature</li>
        </ul>
        <p>
          Email DMCA notices to:{" "}
          <a href="mailto:dmca@techsetup.com">dmca@techsetup.com</a>
        </p>
      </div>
    </main>
  );
}
