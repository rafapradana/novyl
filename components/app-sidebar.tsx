"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenIcon, ArchiveIcon, PlusIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

function isNavItemActive(itemUrl: string, currentPathname: string): boolean {
  if (itemUrl === "/novels") {
    return currentPathname === "/novels";
  }
  return currentPathname.startsWith(itemUrl);
}

export function AppSidebar(props: AppSidebarProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isNavItemActive(item.url, pathname)}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Novel baru">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sidebar-foreground"
                  disabled
                >
                  <PlusIcon />
                  <span>Novel baru</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
