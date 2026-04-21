import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { AuthProvider } from "@/components/providers";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WA PRO | Enterprise WhatsApp CRM",
  description: "Advanced Multi-User WhatsApp CRM Dashboard",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-invoke-path") ?? h.get("x-pathname") ?? "";
  const isAuthPage = pathname === "/login" || pathname.startsWith("/login");

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.className} bg-[var(--app-bg)] text-slate-900 antialiased selection:bg-green-100 selection:text-green-700`}
      >
        {isAuthPage ? (
          <div className="relative flex min-h-screen items-center justify-center bg-[#eef2f8] px-4 py-10">
            <div className="relative z-10 w-full flex justify-center">{children}</div>
          </div>
        ) : (
          <AuthProvider>
            <div className="min-h-screen bg-[var(--app-bg)]">
              <Sidebar />
              <main className="custom-scrollbar min-h-[calc(100vh-110px)] px-4 py-5 sm:px-6 lg:ml-[272px] lg:px-8">
                {children}
              </main>
            </div>
          </AuthProvider>
        )}
      </body>
    </html>
  );
}
