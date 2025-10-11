import { SuperAdminGuard } from "@/lib/auth-guard";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminGuard>{children}</SuperAdminGuard>;
}
