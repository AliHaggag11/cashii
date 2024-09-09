import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Cashii",
  description: "Budgeting & Expense Tracking - The Smart Way!",
  openGraph: {
    title: "Cashii",
    description: "Budgeting & Expense Tracking - The Smart Way!",
    url: "https://cashii.vercel.app",
    siteName: "Cashii",
    type: "website",
    images: [
      {
        url: "/my-app/public/Purple Modern Money Payment Service Logo.jpg",
        width: 1200,
        height: 630,
        alt: "Preview image for Cashii",
      },
    ],
  },
};

export default function RootLayout<T extends React.ReactNode>({
  children,
}: {
  children: T;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <head>
            <meta property="og:title" content="Cashii" />
            <meta
              property="og:description"
              content="Budgeting & Expense Tracking - The Smart Way!"
            />
            <meta
              property="og:image"
              content="/my-app/public/Purple Modern Money Payment Service Logo.jpg"
            />
          </head>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
