import { redirect } from "next/navigation";

export default function SitesRedirectPage() {
  redirect("/admin/settings");
}
