import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/serverAuth";
import { ROLE_HOMES } from "@/lib/constants";

export default async function RootPage() {
  const auth = await getAuthenticatedUser();

  if (!auth || !auth.role) {
    redirect("/login");
  }

  const destination = ROLE_HOMES[auth.role] || "/login";
  redirect(destination);
}
