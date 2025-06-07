'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  GraduationCap,
  Menu as MenuIcon,
  X,
  Bell,
  Search
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getNavigationItems = () => {
    const baseItems = [
      {
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        command: () => router.push(`/dashboard/${session?.user?.role?.toLowerCase()}`)
      }
    ];

    switch (session?.user?.role) {
      case 'ADMIN':
        return [
          ...baseItems,
          {
            label: 'Users',
            icon: <Users className="w-5 h-5" />,
            command: () => router.push('/dashboard/admin/users')
          },
          {
            label: 'Departments',
            icon: <BookOpen className="w-5 h-5" />,
            command: () => router.push('/dashboard/admin/departments')
          },
          {
            label: 'Settings',
            icon: <Settings className="w-5 h-5" />,
            command: () => router.push('/dashboard/admin/settings')
          }
        ];
      case 'COORDINATOR':
        return [
          ...baseItems,
          {
            label: 'Supervisors',
            icon: <Users className="w-5 h-5" />,
            command: () => router.push('/dashboard/coordinator/supervisors')
          },
          {
            label: 'Students',
            icon: <GraduationCap className="w-5 h-5" />,
            command: () => router.push('/dashboard/coordinator/students')
          },
          {
            label: 'Projects',
            icon: <BookOpen className="w-5 h-5" />,
            command: () => router.push('/dashboard/coordinator/projects')
          }
        ];
      case 'SUPERVISOR':
        return [
          ...baseItems,
          {
            label: 'My Students',
            icon: <Users className="w-5 h-5" />,
            command: () => router.push('/dashboard/supervisor/students')
          },
          {
            label: 'Projects',
            icon: <BookOpen className="w-5 h-5" />,
            command: () => router.push('/dashboard/supervisor/projects')
          }
        ];
      case 'STUDENT':
        return [
          ...baseItems,
          {
            label: 'My Projects',
            icon: <BookOpen className="w-5 h-5" />,
            command: () => router.push('/dashboard/student/projects')
          },
          {
            label: 'Submissions',
            icon: <BookOpen className="w-5 h-5" />,
            command: () => router.push('/dashboard/student/submissions')
          }
        ];
      default:
        return baseItems;
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:relative lg:translate-x-0 lg:block"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">ProjectFlow</span>
            </div>
            <Button
              icon="pi pi-times"
              className="p-button-text lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item, index) => (
              <motion.button
                key={index}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={item.command}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar
                label={session?.user?.firstName?.charAt(0)}
                className="bg-blue-600 text-white"
                size="large"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.firstName} {session?.user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.role}
                </p>
              </div>
            </div>
            <Button
              label="Sign Out"
              icon="pi pi-sign-out"
              className="w-full p-button-outlined p-button-danger"
              onClick={handleSignOut}
            />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                icon="pi pi-bars"
                className="p-button-text lg:hidden"
                onClick={() => setSidebarOpen(true)}
              />
              <div className="hidden md:flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="border-0 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                icon="pi pi-bell"
                className="p-button-text p-button-rounded"
                tooltip="Notifications"
              />
              <div className="flex items-center space-x-2">
                <Avatar
                  label={session?.user?.firstName?.charAt(0)}
                  className="bg-blue-600 text-white"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.firstName} {session?.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}