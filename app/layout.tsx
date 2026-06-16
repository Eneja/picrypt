import { ThemeProvider } from "@/components/theme-provider";
import { SessionDraftProvider } from "@/components/session-draft-provider";
import { SessionTimeoutProvider } from "@/components/session-timeout-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Picrypt",
  description: "Built for when communication is difficult.",
};

const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("picrypt-theme");
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = stored === "dark" || (!stored && systemDark);
    var root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(dark ? "dark" : "light");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <SessionDraftProvider>
            <SessionTimeoutProvider>{children}</SessionTimeoutProvider>
          </SessionDraftProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
