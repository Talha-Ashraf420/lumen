import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar, MobileNav } from "@/components/layout/Sidebar";
import { Aurora } from "@/components/ui/Aurora";
import { CatalogWarmer } from "@/components/CatalogWarmer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-dvh">
      <Aurora />
      <CatalogWarmer />
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
