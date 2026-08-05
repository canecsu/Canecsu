import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGuard } from "./AdminGuard";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center border-b border-border bg-card px-4 gap-3 sticky top-0 z-10">
              <SidebarTrigger className="shrink-0" />
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  A
                </div>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
}
