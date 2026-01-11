import "./globals.css";
import { ToastProvider } from "../components/ui";

export const metadata = {
  title: "Ticker Analyzer Pro",
  description: "Institutional-grade market intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}