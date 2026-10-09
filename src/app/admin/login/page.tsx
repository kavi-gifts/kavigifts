import { login } from "./actions";
import { btnCls, ErrorBox, Field, inputCls } from "@/components/admin/ui";

const MESSAGES: Record<string, string> = {
  invalid: "E-poçt və ya parol yanlışdır.",
  forbidden: "Bu hesabın admin icazəsi yoxdur.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { e } = await searchParams;
  const code = Array.isArray(e) ? e[0] : e;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 font-serif text-3xl">Admin giriş</h1>
      <ErrorBox message={code ? MESSAGES[code] ?? "Xəta baş verdi." : undefined} />
      <form action={login} className="space-y-4">
        <Field label="E-poçt">
          <input name="email" type="email" required autoComplete="username" className={inputCls} />
        </Field>
        <Field label="Parol">
          <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
        </Field>
        <button className={btnCls}>Daxil ol</button>
      </form>
    </main>
  );
}
