import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AzoyIs | Creative AI Tools & Systems",
  description:
    "AzoyIs builds practical AI agents, workflow tools, and custom digital systems designed around real needs.",
  metadataBase: new URL("https://www.azoyis.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "AzoyIs | Creative AI Tools & Systems",
    description:
      "Practical AI agents, workflow tools, and custom systems built around real work.",
    url: "/",
    siteName: "AzoyIs",
    images: [{ url: "/logo.png", width: 1200, height: 493, alt: "AzoyIs" }],
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
