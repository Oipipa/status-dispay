import type { ReactNode } from "react";
import "./../styles/globals.css";
import Providers from "./providers";

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
