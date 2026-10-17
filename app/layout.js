import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata = {
  title: "Lokaci Careers | Admin Portal",
  description: "Internal Admin Portal for Lokaci Innovations & Technologies - Manage Job Postings and Review Candidate Applications",
  icons: {
    icon: [{ url: "/icon.jpg?v=2", type: "image/jpeg" }],
    shortcut: "/icon.jpg?v=2",
    apple: "/icon.jpg?v=2",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/icon.jpg?v=2" type="image/jpeg" />
        <link rel="shortcut icon" href="/icon.jpg?v=2" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/icon.jpg?v=2" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#FBFBFD] text-[#111111]">
        {children}
      </body>
    </html>
  );
}
