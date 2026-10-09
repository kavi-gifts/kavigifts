import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Admin yoxlaması: hər admin səhifəsində və hər server action-da çağırılmalıdır. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login?e=forbidden");
  return { supabase, user };
}
