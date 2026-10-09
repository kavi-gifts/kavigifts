"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { bulkUploadToCollection } from "./actions";
import { btnCls } from "@/components/admin/ui";

const MAX_SIDE = 2000;

async function shrink(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("Sıxma alınmadı"))),
      "image/webp",
      0.85
    )
  );
  return new File([blob], file.name, { type: "image/webp" });
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
          lastError = res.error ?? "";
        }
      } catch (e) {
        failed++;
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    setBusy(false);
    if (failed === 0) {
      setStatus(`✓ ${successCount} məhsul uğurla yaradıldı və əlavə olundu!`);
    } else {
      setStatus(
        `${successCount} uğurlu, ${failed} xəta. Səbəb: ${lastError}`
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
