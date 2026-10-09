"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { bulkUploadToCollection } from "./actions";
import { btnCls } from "@/components/admin/ui";

const MAX_SIDE = 2000;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB Vercel limiti

/** Şəkli brauzerdə təhlükəsiz sıxır; yaddaş sızmasının və xətanın qarşısını alır. */
async function shrink(file: File): Promise<File> {
  // 1. createImageBitmap ilə cəhd et (həmişə bmp.close() çağırılmalıdır!)
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
      // YADDAŞI DƏRHAL AZAD ET (50+ şəkildə brauzerin dolmaması üçün mütləqdir!)
      bmp?.close();
    }
  } catch {
    // 2. createImageBitmap uğursuz olarsa, klassik HTMLImageElement ilə cəhd et
    try {
      return await shrinkWithImgTag(file);
    } catch {
      // 3. Əgər hər ikisi alınmazsa və fayl 4MB-dan kiçikdirsə, serverdəki sharp-a göndər
      if (file.size <= MAX_UPLOAD_BYTES) {
        return file;
      }
      throw new Error(
        `"${file.name}" şəkli oxuna bilmədi və həcmi 4MB-dan böyükdür.`
      );
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

export function CollectionBulkUploader({
  collectionId,
}: {
  collectionId: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onUpload() {
    const files = Array.from(input.current?.files ?? []);
    if (!files.length) {
      setStatus("Əvvəlcə şəkilləri seçin.");
      return;
    }

    setBusy(true);
    let successCount = 0;
    let failed = 0;
    const failedNames: string[] = [];
    let lastError = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const displayName = file.name.replace(/\.[a-zA-Z0-9]+$/, "");
      setStatus(`Yüklənir ${i + 1}/${files.length}: ${displayName}…`);

      try {
        const small = await shrink(file);
        const fd = new FormData();
        fd.set("collection_id", collectionId);
        fd.set("file", small);
        fd.set("fileName", file.name);

        const res = await bulkUploadToCollection(fd);
        if (res.ok) {
          successCount++;
        } else {
          failed++;
          failedNames.push(file.name);
          lastError = res.error ?? "";
        }
      } catch (e) {
        failed++;
        failedNames.push(file.name);
        lastError = e instanceof Error ? e.message : String(e);
      }

      // Brauzerin yaddaşı təmizləməsi üçün kiçik fasilə
      await new Promise((r) => setTimeout(r, 35));
    }

    setBusy(false);
    if (failed === 0) {
      setStatus(`✓ Bütün ${successCount} məhsul uğurla yaradıldı və əlavə olundu!`);
    } else {
      const namesPreview = failedNames.slice(0, 3).join(", ");
      setStatus(
        `${successCount} uğurlu, ${failed} xəta (${namesPreview}${failedNames.length > 3 ? "..." : ""}). ${lastError}`
      );
    }

    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/50 p-5">
      <div>
        <h3 className="font-semibold text-foreground">
          Toplu Şəkil Yükləmə (Kolleksiya Məhsulları Yarat)
        </h3>
        <p className="mt-1 text-xs text-foreground/70">
          Bir neçə şəkil seçin (məs. 10 ədəd). Hər şəkil üçün avtomatik məhsul
          yaradılacaq, adı şəklin fayl adı kimi təyin olunacaq, kolleksiyanın
          qiyməti və təsviri şamil ediləcək.
        </p>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onUpload}
        disabled={busy}
        className="block w-full text-xs text-foreground/70 file:mr-3 file:rounded-lg file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onUpload}
          disabled={busy}
          className={btnCls}
        >
          {busy ? "Yüklənir…" : "Toplu Yüklə"}
        </button>
        <span className="text-xs font-medium text-foreground/80">{status}</span>
      </div>
    </div>
  );
}
