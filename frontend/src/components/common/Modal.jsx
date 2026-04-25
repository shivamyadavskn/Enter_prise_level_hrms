import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

/**
 * Enterprise Modal — sticky header, scrollable body, optional sticky footer.
 *
 * Props:
 *   open, onClose, title, subtitle, size (sm | md | lg | xl | 2xl)
 *   icon (optional Heroicon)
 *   footer (optional ReactNode — rendered in modal-footer with border)
 *   children — body content
 *   hideClose — hide the X button
 *   bodyClassName — extra classes for the body wrapper
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = 'md',
  footer,
  hideClose = false,
  bodyClassName,
  children,
}) {
  const sizes = {
    sm:   'sm:max-w-md',
    md:   'sm:max-w-lg',
    lg:   'sm:max-w-2xl',
    xl:   'sm:max-w-4xl',
    '2xl': 'sm:max-w-6xl',
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150"  leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-[2px]" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-3 sm:scale-[0.98]"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-3 sm:scale-[0.98]"
            >
              <Dialog.Panel
                className={clsx(
                  'relative w-full transform overflow-hidden rounded-xl bg-white text-left shadow-modal transition-all flex flex-col max-h-[92vh]',
                  sizes[size]
                )}
              >
                {/* Header */}
                {(title || !hideClose) && (
                  <div className="modal-header shrink-0">
                    <div className="flex items-start gap-3 min-w-0">
                      {Icon && (
                        <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 ring-1 ring-inset ring-primary-100">
                          <Icon className="h-5 w-5 text-primary-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        {title && (
                          <Dialog.Title className="font-display text-base font-semibold tracking-tight text-ink-900 truncate">
                            {title}
                          </Dialog.Title>
                        )}
                        {subtitle && (
                          <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>
                        )}
                      </div>
                    </div>
                    {!hideClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-md p-1 text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
                        aria-label="Close"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Body (scrollable) */}
                <div className={clsx('flex-1 overflow-y-auto scrollbar-thin', bodyClassName ?? 'modal-body')}>
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="modal-footer shrink-0">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
