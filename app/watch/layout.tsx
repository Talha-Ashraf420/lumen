import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function WatchLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <div className="bg-black">{children}</div>;
}
