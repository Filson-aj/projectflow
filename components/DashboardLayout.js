'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Search,
  Building2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  FileText
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const pathname = usePathname()

  // Desktop detection
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Prevent body scroll on mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen && !isDesktop ? 'hidden' : '';
  }, [sidebarOpen, isDesktop]);

  const getNavigationItems = () => {
    const baseUrl = `/dashboard/${session?.user?.role?.toLowerCase()}`
    const base = [
      {
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        href: baseUrl,
        command: () => router.push(`/dashboard/${session?.user?.role?.toLowerCase()}`)
      }
    ];
    switch (session?.user?.role) {
      case 'ADMIN':
        return [
          ...base,
          { label: 'Users', icon: <Users className="w-5 h-5" />, href: `${baseUrl}/users`, command: () => router.push('/dashboard/admin/users') },
          { label: 'Departments', icon: <Building2 className="w-5 h-5" />, href: `${baseUrl}/departments`, command: () => router.push('/dashboard/admin/departments') },
          { label: 'Projects', icon: <BookOpen className="w-5 h-5" />, href: `${baseUrl}/projects`, command: () => router.push('/dashboard/admin/projects') },
          { label: 'Settings', icon: <Settings className="w-5 h-5" />, href: `${baseUrl}/settings`, command: () => router.push('/dashboard/admin/settings') }
        ];
      case 'COORDINATOR':
        return [
          ...base,
          { label: 'Supervisors', icon: <Users className="w-5 h-5" />, href: `${baseUrl}/supervisors`, command: () => router.push('/dashboard/coordinator/supervisors') },
          { label: 'Students', icon: <GraduationCap className="w-5 h-5" />, href: `${baseUrl}/students`, command: () => router.push('/dashboard/coordinator/students') },
          { label: 'Projects', icon: <BookOpen className="w-5 h-5" />, href: `${baseUrl}/projects`, command: () => router.push('/dashboard/coordinator/projects') },
          /*  { label: 'Departments', icon: <Building2 className="w-5 h-5" />, href: `${baseUrl}/departments`, command: () => router.push('/dashboard/coordinator/departments') } */
        ];
      case 'SUPERVISOR':
        return [
          ...base,
          { label: 'My Students', icon: <Users className="w-5 h-5" />, href: `${baseUrl}/students`, command: () => router.push('/dashboard/supervisor/students') },
          { label: 'My Projects', icon: <BookOpen className="w-5 h-5" />, href: `${baseUrl}/projects`, command: () => router.push('/dashboard/supervisor/projects') },
          { label: 'My Submissions', icon: <FileText className="w-5 h-5" />, href: `${baseUrl}/submissions`, command: () => router.push('/dashboard/supervisor/submissions') }
        ];
      case 'STUDENT':
        return [
          ...base,
          { label: 'My Projects', icon: <BookOpen className="w-5 h-5" />, href: `${baseUrl}/projects`, command: () => router.push('/dashboard/student/projects') },
          { label: 'My Submissions', icon: <FileText className="w-5 h-5" />, href: `${baseUrl}/submissions`, command: () => router.push('/dashboard/student/submissions') }
        ];
      default:
        return base;
    }
  };
  const navigationItems = getNavigationItems();
  const handleSignOut = () => signOut({ callbackUrl: '/' });

  const notifications = [
    { id: 1, title: 'New Project Submitted', message: 'John Doe submitted a new project topic', time: '2 minutes ago', type: 'info' },
    { id: 2, title: 'Project Approved', message: 'Your project "AI in Healthcare" has been approved', time: '1 hour ago', type: 'success' },
    { id: 3, title: 'Deadline Reminder', message: 'Project submission deadline is tomorrow', time: '3 hours ago', type: 'warning' }
  ];
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return 'pi pi-check-circle text-green-500';
      case 'warning': return 'pi pi-exclamation-triangle text-orange-500';
      case 'error': return 'pi pi-times-circle text-red-500';
      default: return 'pi pi-info-circle text-blue-500';
    }
  };

  const sidebarWidth = isDesktop ? (open ? 80 : 280) : 0;

  return (
    <main className="h-screen flex bg-gray-100 text-gray-900">
      {/* Side bar */}
      <AnimatePresence>
        <aside className={`hidden sm:flex flex-col bg-white  ${open ? 'w-60' : 'w-[75px]'} border-r border-gray-300/40 duration-500`}>
          {/* header */}
          <div className={`flex gap-2 items-center ${open ? 'justify-between' : 'justify-center'} px-1 py-3 text-neutral-200 text-lg`}>
            {open && <div className='flex items-center gap-2'>
              <GraduationCap className='w-6 h-6 text-blue-500 font-bold' />
              <span className='text-gray-900/60 text-[12pt] leading-tight uppercase font-bold hover:text-gray-900 transition-all duration-300'>ProjectFlow</span>
            </div>}
            <div onClick={() => setOpen(!open)} className='cursor-pointer w-6 h-6 text-blue-500'>
              <MenuIcon className="w-5 h-5" />
            </div>
          </div>
          <Divider className="my-1" />

          {/* body */}
          <nav className='flex-2 flex flex-col p-4 space-y-2 overflow-y-auto h-screen'>
            {navigationItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.command}
                className={`w-full flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600  ${!open ? 'justify-center' : ''}  ${pathname === item.href ? 'bg-blue-50 text-blue-600' : ''} transition-all duration-200`}
                title={open ? item.label : ''}
              >
                {item.icon}
                {open && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>


          {/* footer */}
          <div className={`flex flex-col py-3 ${!open ? 'justify-center' : ''}`}>
            <Divider className="my-2" />
            <div className='w-full flex flex-col'>
              <Link
                href={`help-support`}
                className={`w-full flex py-3 space-x-3 px-3 mb-1 text-gray-700 hover:text-blue-600 transition-all duration-200 ${!open ? 'justify-center' : ''}`}>
                <HelpCircle className="w-5 h-5" />
                {open && <span className="ml-3 font-medium">Help & Support</span>}
              </Link>
              <Button
                onClick={handleSignOut}
                className={`w-full flex items-center bg-transparent border-0 py-3 space-x-3 px-3 text-red-700 rounded-xl hover:text-red-600 hover:bg-transparent hover:border-0 focused:outline-none hover:shadow-none transition-all duration-200 ${!open ? 'justify-center' : ''}`}
                title={open ? "Help & Support" : ''}
              >
                <LogOut className="w-5 h-5" />
                {open && <span className="font-medium ml-4">Sign Out</span>}
              </Button>
            </div>
          </div>
        </aside>
      </AnimatePresence>

      {/* Content section */}
      <article className="flex-1 flex flex-col">
        {/* Header */}
        <header
          className='bg-white shadow-sm border-b border-gray-200 px-6 py-4 backdrop-blur-2xl'>
          <div className='flex item-center justify-between'>
            {/* Search baard */}
            <div className='hidden md:flex items-center space-x-3 bg-gray-50 rounded-md px-4 py-2'>
              <Search className='w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search...'
                className='border-0 bg-transparent text-sm focus:outline-none w-80'
              />
            </div>

            {/* Notification and profile */}
            <div className='flex items-center space-x-6'>
              {/* Notification panel */}
              <div className='relative'>
                <Button
                  icon={<Bell className='w-5 h-5' />}
                  className='p-button-text p-button-rounded hover:shadow-none hover:border-0 focused:outline-none active:outline-none active:border-0 transition-all duration-300'
                  onClick={(e) => notificationRef.current.toggle(e)}
                />
                <Badge value={notifications?.length} className='absolute -top-1 -right-1' />
                <OverlayPanel ref={notificationRef} className='w-80 bg-white/40 backdrop-blur-2xl'>
                  <div className='p-4'>
                    <div className='flex items-center justify-between mb-2 border-b border-gray-200/40 hover:py-3 transition-all duration-300'>
                      <h3 className='font-semibold text-gray-900'>Notifications</h3>
                      <Button label='Mark all read' className='p-button-text p-button-sm' />
                    </div>
                    <div className='space-y-3 max-h-80 overflow-y-auto'>
                      {notifications.map((n) => (
                        <div key={n.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <i className={`${getNotificationIcon(n.type)} text-lg`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-sm text-gray-600 truncate">{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Divider className="my-2" />
                    <Button label="View all" className="w-full p-button-outlined" />
                  </div>
                </OverlayPanel>
              </div>

              {/* Profile panel */}
              <div className='relative'>
                <Avatar label={session?.user?.firstName?.charAt(0) || session?.user?.role?.charAt(0)} className='bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-bold rounded-full cursor-pointer hover:p-2 transition-all duration-300' onClick={(e) => profileRef.current.toggle(e)} />
                <OverlayPanel ref={profileRef} className='w-80 bg-white/40 backdrop-blur-2xl'>
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar label={session?.user?.firstName?.charAt(0) || session?.user?.role?.charAt(0)} size="large" className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-full" />
                      <div className='space-y-2'>
                        {/*  <p className="font-medium text-gray-900">{session?.user?.firstName} {session?.user?.lastName}</p> */}
                        <p className="text-sm text-gray-500">{session?.user?.email}</p>
                        <p className="text-xs text-gray-400">{session?.user?.role}</p>
                      </div>
                    </div>
                    <Divider className="my-3" />
                    <Button icon={<User className="w-4 h-4 mr-2" />} label="Profile Settings" className="w-full p-button-text justify-start text-start text-gray-900 hover:shadow-none hover:border-0 focused:outline-none transition-all duration-300" />
                    <Button icon={<Shield className="w-4 h-4 mr-2" />} label="Change Password" className="w-full p-button-text justify-start text-start text-gray-900 hover:shadow-none hover:border-0 focused:outline-none transition-all duration-300" onClick={() => router.push('/auth/change-password')} />
                    <Button icon={<Settings className="w-4 h-4 mr-2" />} label="Account Settings" className="w-full p-button-text justify-start text-start text-gray-900 hover:shadow-none hover:border-0 focused:outline-none transition-all duration-300" />
                    <Divider className="my-3" />
                    <Button icon={<LogOut className="w-4 h-4" />} label="Sign Out" className="w-full p-button-danger p-button-outlined" onClick={handleSignOut} />
                  </div>
                </OverlayPanel>
              </div>
            </div>
          </div>
        </header>

        {/* body */}
        <section className='flex flex-col overflow-scroll'>
          {children}
        </section>
      </article>
    </main>
  );
}
