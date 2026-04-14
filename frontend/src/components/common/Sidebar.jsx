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
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext.jsx'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard',     href: '/',             icon: HomeIcon,                   roles: ['ALL'] },
  { name: 'Employees',     href: '/employees',    icon: UsersIcon,                  roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
  { name: 'Departments',   href: '/departments',  icon: BuildingOfficeIcon,          roles: ['SUPER_ADMIN','ADMIN'] },
  { name: 'Designations',  href: '/designations', icon: BriefcaseIcon,               roles: ['SUPER_ADMIN','ADMIN'] },
  { name: 'Approvals',     href: '/approvals',    icon: CheckCircleIcon,             roles: ['SUPER_ADMIN','ADMIN','MANAGER'] },
  { name: 'Leaves',        href: '/leaves',       icon: CalendarDaysIcon,            roles: ['ALL'] },
  { name: 'Attendance',    href: '/attendance',   icon: ClockIcon,                  roles: ['ALL'] },
  { name: 'Work From Home',href: '/wfh',          icon: ComputerDesktopIcon,         roles: ['ALL'] },
  { name: 'Payroll',       href: '/payroll',      icon: BanknotesIcon,               roles: ['SUPER_ADMIN','ADMIN','FINANCE','EMPLOYEE'] },
  { name: 'Performance',   href: '/performance',  icon: ChartBarIcon,                roles: ['ALL'] },
  { name: 'Documents',     href: '/documents',    icon: DocumentTextIcon,            roles: ['ALL'] },
  { name: 'HR Documents',  href: '/documents/generate', icon: DocumentDuplicateIcon,  roles: ['SUPER_ADMIN','ADMIN','FINANCE'] },
  { name: 'Holidays',      href: '/holidays',     icon: SunIcon,                     roles: ['ALL'] },
  { name: 'Reports',       href: '/reports',      icon: PresentationChartLineIcon,   roles: ['SUPER_ADMIN','ADMIN','MANAGER','FINANCE'] },
  { name: 'Reimbursements',href: '/reimbursements',icon: CurrencyDollarIcon,          roles: ['ALL'] },
  { name: 'Onboarding',    href: '/onboarding',   icon: ClipboardDocumentListIcon,   roles: ['ALL'] },
  { name: 'Notifications', href: '/notifications',icon: BellIcon,                   roles: ['ALL'] },
  { name: 'My Profile',    href: '/profile',      icon: UserCircleIcon,              roles: ['ALL'] },
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
          'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
          isActive
            ? 'bg-primary-50 text-primary-600'
            : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
        )}
      >
        <item.icon
          className={clsx('h-6 w-6 shrink-0', isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600')}
          aria-hidden="true"
        />
        {item.name}
      </NavLink>
    </li>
  )
}

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth()

  const visibleNav = navigation.filter(
    (item) => item.roles.includes('ALL') || item.roles.includes(user?.role)
  )

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center gap-x-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <span className="text-xs font-bold text-white">HR</span>
        </div>
        <span className="text-lg font-bold text-gray-900">HRMS</span>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {visibleNav.map((item) => (
                <NavItem key={item.name} item={item} onClick={onClose} />
              ))}
            </ul>
          </li>

          <li className="-mx-6 mt-auto">
            <button
              onClick={logout}
              className="flex w-full items-center gap-x-4 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                {user?.employee?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{user?.employee ? `${user.employee.firstName} ${user.employee.lastName || ''}` : user?.email}</span>
                <span className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</span>
              </div>
            </button>
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
        <SidebarContent onClose={() => {}} />
      </div>
    </>
  )
}
