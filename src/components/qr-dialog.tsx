"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toDataURL } from "qrcode";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QrDialogProps {
  open: boolean;
  onClose: () => void;
  /** Path relativo; viene risolto sull'origin corrente. */
  path: string;
}

export function QrDialog({ open, onClose, path }: QrDialogProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const url =
    typeof window !== "undefined" ? window.location.origin + path : path;

  useEffect(() => {
    if (!open) return;
    toDataURL(url, { width: 280, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [open, url]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-label="Condividi con QR code"
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="relative p-8 text-center">
              <button
                onClick={onClose}
                aria-label="Chiudi"
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold">Condividi la scheda</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Inquadra per aprire il calcolo con questi parametri.
              </p>
              {dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dataUrl}
                  alt="QR code della scheda alimentazione"
                  className="mx-auto mt-5 rounded-2xl border"
                  width={280}
                  height={280}
                />
              ) : (
                <div className="mx-auto mt-5 h-[280px] w-[280px] animate-pulse rounded-2xl bg-muted" />
              )}
              <Button
                variant="secondary"
                size="sm"
                className="mt-5"
                onClick={() => navigator.clipboard?.writeText(url)}
              >
                Copia link
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
