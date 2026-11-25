import { Bree_Serif, Montserrat, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Leaves from "@/components/home/Leaves";

const breeSerif = Bree_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bree-serif",
});

const montserrat = Montserrat({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const sourceSans = Source_Sans_3({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-source-sans",
});

export const metadata = {
  title: "Fallora E-Commerce",
  description: "Platform E-Commerce Fallora",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${breeSerif.variable} ${montserrat.variable} ${sourceSans.variable}`}
    >
      <body className="font-sans antialiased">
        <Leaves />
        {children}
      </body>
    </html>
  );
}