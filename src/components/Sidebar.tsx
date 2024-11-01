import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database,
  History, 
  Users,
  Settings,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const { user } = useAuthStore();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/verify', icon: CheckCircle2, label: 'Data Verification' },
    { to: '/data', icon: Database, label: 'Data Management' },
    { to: '/history', icon: History, label: 'Data History' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    ...(user?.role === 'admin' 
      ? [{ to: '/users', icon: Users, label: 'User Management' }] 
      : []
    ),
    { to: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#214866] dark:bg-gray-800 transition-all duration-300 z-10 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-gray-100 hover:bg-white/10 ${
                isActive ? 'bg-white/20' : ''
              } ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? link.label : undefined}
          >
            <link.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
            {!isCollapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}