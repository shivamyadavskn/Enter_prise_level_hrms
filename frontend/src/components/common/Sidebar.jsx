import { Fragment } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  HomeIcon, UsersIcon, BuildingOfficeIcon, CalendarDaysIcon,
  ClockIcon, ComputerDesktopIcon, BanknotesIcon, ChartBarIcon,
  DocumentTextIcon, BellIcon, PresentationChartLineIcon,
  FolderOpenIcon, SunIcon, DocumentDuplicateIcon,
  BriefcaseIcon, CheckCircleIcon, CurrencyDollarIcon, UserCircleIcon,
  ClipboardDocumentListIcon, Cog8ToothIcon, ShieldCheckIcon, MegaphoneIcon, CubeIcon, HeartIcon,
  DocumentArrowUpIcon, ClipboardDocumentCheckIcon, UserMinusIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext.jsx'
import clsx from 'clsx'

const navSections = [
  {
    label: null,
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['ALL'] },
    ],
  },
  {
    label: 'My Work',
    items: [
      { name: 'Attendance', href: '/attendance', icon: ClockIcon, roles: ['ALL'] },
      { name: 'Leaves', href: '/leaves', icon: CalendarDaysIcon, roles: ['ALL'] },
      { name: 'Work From Home', href: '/wfh', icon: ComputerDesktopIcon, roles: ['ALL'] },
      { name: 'Reimbursements', href: '/reimbursements', icon: CurrencyDollarIcon, roles: ['ALL'] },
      { name: 'My Documents', href: '/documents', icon: DocumentTextIcon, roles: ['ALL'] },
      { name: 'Payslips', href: '/payroll', icon: BanknotesIcon, roles: ['EMPLOYEE'] },
    ],
  },
  {
    label: 'Approvals',
    items: [
      { name: 'Approvals Inbox', href: '/approvals', icon: CheckCircleIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'] },
    ],
  },
  {
    label: 'People',
    items: [
      { name: 'Employees', href: '/employees', icon: UsersIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'] },
      { name: 'Departments', href: '/departments', icon: BuildingOfficeIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR'] },
      { name: 'Designations', href: '/designations', icon: BriefcaseIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR'] },
      { name: 'Onboarding', href: '/onboarding', icon: ClipboardDocumentListIcon, roles: ['ALL'] },
      { name: 'Performance', href: '/performance', icon: ChartBarIcon, roles: ['ALL'] },
      { name: 'Pulse Survey', href: '/pulse', icon: HeartIcon, roles: ['ALL'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Payroll', href: '/payroll', icon: BanknotesIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'FINANCE'] },
      { name: 'Compliance', href: '/compliance', icon: ClipboardDocumentCheckIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'FINANCE'] },
    ],
  },
  {
    label: 'Organisation',
    items: [
      { name: 'Announcements', href: '/announcements', icon: MegaphoneIcon, roles: ['ALL'] },
      { name: 'Assets', href: '/assets', icon: CubeIcon, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { name: 'Holidays', href: '/holidays', icon: SunIcon, roles: ['ALL'] },
      { name: 'Letter Generation', href: '/letters', icon: DocumentArrowUpIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR'] },
      { name: 'Separation', href: '/separation', icon: UserMinusIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR'] },
      { name: 'HR Documents', href: '/documents/generate', icon: DocumentDuplicateIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'FINANCE'] },
      { name: 'Reports', href: '/reports', icon: PresentationChartLineIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'FINANCE'] },
      { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheckIcon, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { name: 'Settings', href: '/organisation', icon: Cog8ToothIcon, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { name: 'Roles & Access', href: '/roles', icon: ShieldCheckIcon, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    label: null,
    items: [
      { name: 'Notifications', href: '/notifications', icon: BellIcon, roles: ['ALL'] },
      { name: 'My Profile', href: '/profile', icon: UserCircleIcon, roles: ['ALL'] },
    ],
  },
]

function NavItem({ item, onClick }) {
  const location = useLocation()
  const isActive = item.href === '/'
    ? location.pathname === '/'
    : item.href === '/documents'
      ? location.pathname === '/documents'
      : location.pathname.startsWith(item.href)

  return (
    <li>
      <NavLink
        to={item.href}
        onClick={onClick}
        className={clsx(
          'group flex gap-x-3 rounded-lg px-3 py-2 text-[13px] font-medium leading-6 transition-all duration-150',
          isActive
            ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <item.icon
          className={clsx('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600')}
          aria-hidden="true"
        />
        {item.name}
      </NavLink>
    </li>
  )
}

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth()

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.roles.includes('ALL') || item.roles.includes(user?.role)
      ),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div className="flex grow flex-col overflow-y-auto bg-white border-r border-gray-200/80 scrollbar-thin">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center gap-x-3 px-6 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-sm">
          <span className="text-sm font-extrabold text-white tracking-tight">HR</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-gray-900 tracking-tight">HRMS</span>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest -mt-0.5">Enterprise</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 pt-4 pb-3">
        <ul role="list" className="flex flex-1 flex-col gap-y-6">
          {visibleSections.map((section, idx) => (
            <li key={section.label || `section-${idx}`}>
              {section.label && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  {section.label}
                </p>
              )}
              <ul role="list" className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.name} item={item} onClick={onClose} />
                ))}
              </ul>
            </li>
          ))}

          {/* User Profile Section */}
          <li className="mt-auto -mx-4">
            <div className="border-t border-gray-100 px-4 pt-3 pb-2">
              <button
                onClick={logout}
                className="flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold text-sm shadow-sm ring-2 ring-white">
                  {user?.employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-sm font-semibold text-gray-900 truncate w-full text-left">
                    {user?.employee ? `${user.employee.firstName} ${user.employee.lastName || ''}` : user?.email}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</span>
                </div>
                <svg className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" className="-m-2.5 p-2.5" onClick={onClose}>
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
                <SidebarContent onClose={onClose} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent onClose={() => { }} />
      </div>
    </>
  )
}
