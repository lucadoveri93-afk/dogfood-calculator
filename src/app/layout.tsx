import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dogfood-calculator.vercel.app"),
  title: {
    default: "DogFood Calculator — la dose perfetta di crocchette",
    template: "%s | DogFood Calculator",
  },
  description:
    "Calcola in pochi secondi la quantità giornaliera di crocchette per il tuo cane, basata sulle tabelle ufficiali dei produttori.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/dog.png"
                  alt=""
                  className="h-6 w-auto dark:invert"
                  width={39}
                  height={24}
                />
                DogFood Calculator
              </Link>
              <div className="flex items-center gap-1">
                <Link
                  href="/catalogo"
                  className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Catalogo
                </Link>
                <Link
                  href="/confronto"
                  className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Confronta
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t py-8">
            <p className="mx-auto max-w-4xl px-4 text-xs leading-relaxed text-muted-foreground">
              Le dosi sono indicative e derivano dalle tabelle pubblicate dai
              produttori. Non sostituiscono il parere del veterinario: per
              cuccioli, gravidanza, patologie o dubbi sul peso forma, chiedi
              sempre a un professionista.
            </p>
          </footer>
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
