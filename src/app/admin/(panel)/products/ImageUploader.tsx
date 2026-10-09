"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "./actions";
import { btnCls } from "@/components/admin/ui";

const MAX_SIDE = 2000;

/** Şəkli brauzerdə kiçildir (Vercel 4.5MB sorğu limiti + sürət üçün). */
async function shrink(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Sıxma alınmadı"))), "image/webp", 0.85),
  );
  return new File([blob], "image.webp", { type: "image/webp" });
}

export function ImageUploader({ productId }: { productId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onUpload() {
    const files = Array.from(input.current?.files ?? []);
    if (!files.length) {
      setStatus("Əvvəlcə \"Choose files\" ilə şəkil seçin.");
      return;
    }
    setBusy(true);
    let failed = 0;
    let lastError = "";
    for (let i = 0; i < files.length; i++) {
      setStatus(`Yüklənir ${i + 1}/${files.length}…`);
      try {
        const small = await shrink(files[i]);
        const fd = new FormData();
        fd.set("product_id", productId);
        fd.set("file", small);
        const res = await uploadImage(fd);
        if (!res.ok) {
          failed++;
          lastError = res.error ?? "";
        }
      } catch (e) {
        failed++;
        lastError = e instanceof Error ? e.message : String(e);
      }
    }
    setBusy(false);
    setStatus(failed ? `${failed} şəkil yüklənmədi. ${lastError}` : "Hazırdır ✓");
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onUpload}
        disabled={busy}
      />
      <div className="flex items-center gap-3">
        <button type="button" onClick={onUpload} disabled={busy} className={btnCls}>
          {busy ? "Yüklənir…" : "Şəkilləri yüklə"}
        </button>
        <span className="text-sm text-foreground/70">{status}</span>
      </div>
      <p className="text-xs text-foreground/60">Şəkil seçən kimi avtomatik yüklənir.</p>
    </div>
  );
}

