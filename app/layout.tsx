import type { Metadata } from "next";
import "./globals.scss";
import { BusyProvider } from "./components/BusyProvider"

export const metadata: Metadata = { title: "NTi Booking", description: "Equipment booking" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BusyProvider>
          {children}
        </BusyProvider>
      </body>
    </html>
  );
}
