import type { L10n } from "@/lib/forms";

export const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-gold";
export const btnCls =
  "inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90";
export const btnGhostCls =
  "inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm hover:border-gold";
export const btnDangerCls =
  "inline-flex items-center rounded-lg border border-sale/40 px-3 py-1.5 text-sm text-sale hover:bg-sale/10";

const LANGS = [
  { code: "az", hint: "AZ (əsas)" },
  { code: "ru", hint: "RU (boşdursa avtomatik)" },
  { code: "en", hint: "EN (boşdursa avtomatik)" },
] as const;

export function LangFields({
  name,
  label,
  defaults,
  textarea,
  required,
}: {
  name: string;
  label: string;
  defaults?: Partial<L10n> | null;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {LANGS.map((l) =>
        textarea ? (
          <textarea
            key={l.code}
            name={`${name}_${l.code}`}
            defaultValue={defaults?.[l.code] ?? ""}
            placeholder={l.hint}
            rows={4}
            required={required && l.code === "az"}
            className={inputCls}
          />
        ) : (
          <input
            key={l.code}
            name={`${name}_${l.code}`}
            defaultValue={defaults?.[l.code] ?? ""}
            placeholder={l.hint}
            required={required && l.code === "az"}
            className={inputCls}
          />
        ),
      )}
    </fieldset>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function ErrorBox({ message }: { message?: string | string[] }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-lg border border-sale/40 bg-sale/10 px-3 py-2 text-sm text-sale">
      {Array.isArray(message) ? message[0] : message}
    </p>
  );
}
