import type { Metadata } from "next";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource-variable/fraunces";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SampleBanner from "@/components/SampleBanner";

export const metadata: Metadata = {
  title: { default: "Economic Indicators", template: "%s · Economic Indicators" },
  description: "Canadian economic indicators from Statistics Canada and market data, with clean datasets to download.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <main>
            <SampleBanner />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
