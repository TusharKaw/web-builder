'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Plus, 
  FileText, 
  Settings, 
  Globe,
  Users,
  BarChart3
} from 'lucide-react'

interface SidebarProps {
  isAdmin?: boolean
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Create Site', href: '/dashboard/sites/new', icon: Plus },
    { name: 'My Sites', href: '/dashboard/sites', icon: Globe },
    { name: 'Pages', href: '/dashboard/pages', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'All Users', href: '/admin/users', icon: Users },
    { name: 'All Sites', href: '/admin/sites', icon: Globe },
  ]

  const currentNavigation = isAdmin ? adminNavigation : navigation

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      <div className="flex items-center h-16 px-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold">
          {isAdmin ? 'Admin Panel' : 'Dashboard'}
        </h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {currentNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
