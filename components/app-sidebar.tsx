"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenIcon, ArchiveIcon, type LucideIcon } from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface NavItem {
  readonly title: string;
  readonly url: string;
  readonly icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { title: "Novel saya", url: "/novels", icon: BookOpenIcon },
  { title: "Arsip", url: "/novels?archived=true", icon: ArchiveIcon },
] as const;

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  readonly user: {
    readonly displayName: string;
    readonly email: string;
  };
}

function isNavItemActive(itemUrl: string, currentPathname: string): boolean {
  // "Novel saya" (/novels) should only be active on exact match
  if (itemUrl === "/novels") {
    return currentPathname === "/novels";
  }
  return currentPathname.startsWith(itemUrl);
}

export function AppSidebar({ user, ...props }: AppSidebarProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/novels">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">N</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Novyl</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isNavItemActive(item.url, pathname)}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{ name: user.displayName, email: user.email }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
