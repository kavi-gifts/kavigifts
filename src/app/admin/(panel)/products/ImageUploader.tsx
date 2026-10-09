"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "./actions";
import { btnCls } from "@/components/admin/ui";

const MAX_SIDE = 2000;

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB Vercel limiti

/** Şəkli brauzerdə təhlükəsiz sıxır; yaddaş sızmasının və xətanın qarşısını alır. */
async function shrink(file: File): Promise<File> {
  try {
    let bmp: ImageBitmap | null = null;
    try {
      bmp = await createImageBitmap(file);
      const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context tapılmadı");
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob(
          (b) => (b ? res(b) : rej(new Error("Sıxma alınmadı"))),
          "image/webp",
          0.85
        )
      );
      canvas.width = 0;
      canvas.height = 0;
      return new File([blob], file.name.replace(/\.[a-zA-Z0-9]+$/, ".webp"), {
        type: "image/webp",
      });
    } finally {
      bmp?.close();
    }
  } catch {
    try {
      return await shrinkWithImgTag(file);
    } catch {
      if (file.size <= MAX_UPLOAD_BYTES) {
        return file;
      }
      throw new Error(`"${file.name}" şəkli oxuna bilmədi və həcmi 4MB-dan böyükdür.`);
    }
  }
}

function shrinkWithImgTag(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            canvas.width = 0;
            canvas.height = 0;
            if (!blob) return resolve(file);
            resolve(
              new File(
                [blob],
                file.name.replace(/\.[a-zA-Z0-9]+$/, ".webp"),
                { type: "image/webp" }
              )
            );
          },
          "image/webp",
          0.85
        );
      } catch {
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      if (file.size <= MAX_UPLOAD_BYTES) {
        resolve(file);
      } else {
        reject(new Error("Şəkil faylı açıla bilmədi"));
      }
    };
    img.src = url;
  });
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

