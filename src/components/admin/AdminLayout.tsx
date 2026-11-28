import { AdminGuard } from "./AdminGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <WorkspaceShell workspace="admin">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </WorkspaceShell>
    </AdminGuard>
  );
}

