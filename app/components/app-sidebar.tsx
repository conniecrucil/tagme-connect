"use client"

import type * as React from "react"
import { Link } from "react-router"
import {
  LayoutDashboard,
  Files,
  Eye,
  Server,
  Users,
  ShoppingCart,
} from "lucide-react"
import tagmeLogo from "../assets/tagme-logo.svg"

import { NavMain } from "~/components/nav-main"
import { NavUser } from "~/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Admin navigation items
  const navMain = [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: false,
    },
    {
      title: "Orders",
      url: "/admin/orders",
      icon: ShoppingCart,
      isActive: false,
    },
    {
      title: "Website Contact Cards",
      url: "#",
      icon: Files,
      isActive: false,
      items: [
       
        {
          title: "View All Cards",
          url: "/admin/cards",
        },
        {
          title: (
            <span className="inline-flex items-center gap-1 bg-primary px-2 py-1 rounded text-white font-semibold text-sm">
              <span>Create Contact</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 20 20" className="ml-1">
                <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
          ),
          url: "/admin/create",
        },
      ],
    },
    {
      title: "System",
      url: "#",
      icon: Server,
      isActive: false,
      items: [
        {
          title: "Admin Users",
          url: "/admin/users",
        },
        {
          title: "System Status",
          url: "/admin/system-status",
        },
        {
          title: "Data Management",
          url: "/admin/data-management",
        },
        {
          title: "Email Templates",
          url: "/admin/email-templates",
        },
      ],
    },
    {
      title: "Preview",
      url: "/admin/preview",
      icon: Eye,
      isActive: false,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-center px-3 py-3">
          <Link to="/admin" className="flex items-center justify-center">
            <img src={tagmeLogo} alt="TagMe Connections" className="h-10 w-auto" />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
