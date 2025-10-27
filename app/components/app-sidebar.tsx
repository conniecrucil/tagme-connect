"use client"

import type * as React from "react"
import { Link } from "react-router"
import {
  LayoutDashboard,
  Files,
  Eye,
  Server,
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
      items: [
        {
          title: "Overview",
          url: "/admin",
        },
      ],
    },
    {
      title: "Contacts",
      url: "#",
      icon: Files,
      isActive: false,
      items: [
        {
          title: "Create Contact",
          url: "/admin/create",
        },
        {
          title: "Update Contact",
          url: "/admin/update",
        },
        {
          title: "View All Cards",
          url: "/admin/cards",
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
          title: "System Status",
          url: "/admin/system-status",
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
