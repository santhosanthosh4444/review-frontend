"use client"
import { LucideHome, LucideClipboardCheck, LucideFileText, LucideCalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  onNavigate: (view: string) => void
  activeView: string
  hasApprovedProject: boolean
}

export function Sidebar({ onNavigate, activeView, hasApprovedProject }: SidebarProps) {
  // Base navigation items that are always shown
  const baseNavItems = [
    {
      name: "Dashboard",
      icon: LucideHome,
      id: "dashboard",
    },
    {
      name: "Project",
      icon: LucideFileText,
      id: "project",
    },
    {
      name: "Logs",
      icon: LucideCalendarClock,
      id: "logs",
    },
  ]

  // Add Review tab only if the team has an approved project
  const navItems = hasApprovedProject
    ? [
        ...baseNavItems,
        {
          name: "Review",
          icon: LucideClipboardCheck,
          id: "review",
        },
      ]
    : baseNavItems

  return (
    <div className="h-screen w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold">Student Portal</h2>
      </div>
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-left font-normal",
                activeView === item.id ? "bg-primary text-primary-foreground" : "hover:bg-gray-200",
              )}
              onClick={() => onNavigate(item.id)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  )
}
