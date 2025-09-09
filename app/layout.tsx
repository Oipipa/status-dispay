import type { ReactNode } from "react";
import "./../styles/globals.css";

export const metadata = {
  title: "Curfew Tracker",
  description: "Realtime curfew/road status and incident map"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
