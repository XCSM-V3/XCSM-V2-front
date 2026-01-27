import type React from "react"
import { SidebarProvider } from "@/components/sidebar-provider"
import { MainSidebar } from "@/components/main-sidebar"
import { NotificationPoller } from "@/components/notification-poller"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <NotificationPoller />
        <MainSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  )
}
