import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server tərəfdə sessiya ilə işləyən Supabase client (RLS tətbiq olunur). */
export async function createClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          } catch {
            // Server Component-dən çağırıldıqda cookie yazmaq olmur; proxy yeniləyir.
          }
        },
      },
    },
  );
}
