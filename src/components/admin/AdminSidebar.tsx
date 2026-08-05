import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileWarning,
  Trophy,
  Star,
  AlertOctagon,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  Mail,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Verification", url: "/admin/verification", icon: ShieldCheck },
  { title: "Content", url: "/admin/content", icon: FileWarning },
  { title: "Messages", url: "/admin/messages", icon: Mail },
];

const managementItems = [
  { title: "Rankings", url: "/admin/rankings", icon: Trophy },
  { title: "Featured", url: "/admin/featured", icon: Star },
  { title: "Disputes", url: "/admin/disputes", icon: AlertOctagon },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Blog Posts", url: "/admin/blogs", icon: FileText },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderItems = (items: typeof mainItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/admin"}
            className="hover:bg-muted/50"
            activeClassName="bg-primary/10 text-primary font-medium"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm">Admin Panel</p>
              <p className="text-[10px] text-muted-foreground">Canecsu Management</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(managementItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/admin/settings" className="hover:bg-muted/50" activeClassName="bg-muted text-primary">
                <Settings className="mr-2 h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/" className="hover:bg-destructive/10 text-destructive" activeClassName="">
                <LogOut className="mr-2 h-4 w-4" />
                {!collapsed && <span>Exit Admin</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
