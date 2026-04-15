const illustrations = {
  default: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-auto">
      <circle cx="100" cy="75" r="55" fill="#f1f5f9" />
      <rect x="62" y="48" width="76" height="55" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="72" y="60" width="40" height="5" rx="2.5" fill="#e2e8f0" />
      <rect x="72" y="71" width="56" height="5" rx="2.5" fill="#e2e8f0" />
      <rect x="72" y="82" width="48" height="5" rx="2.5" fill="#e2e8f0" />
      <circle cx="152" cy="42" r="14" fill="#ede9fe" />
      <path d="M147 42 L151 46 L158 38" stroke="#7c3aed" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="100" y="145" fontSize="11" fill="#94a3b8" fontFamily="system-ui,sans-serif" textAnchor="middle">Nothing here yet</text>
    </svg>
  ),
  employees: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-auto">
      <circle cx="100" cy="70" r="55" fill="#f1f5f9" />
      <circle cx="80" cy="58" r="18" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <circle cx="80" cy="53" r="8" fill="#ddd6fe" />
      <path d="M62 76 Q80 68 98 76" stroke="#ddd6fe" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="122" cy="65" r="15" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <circle cx="122" cy="60" r="7" fill="#c7d2fe" />
      <path d="M107 81 Q122 74 137 81" stroke="#c7d2fe" strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="150" cy="50" r="10" fill="#ede9fe" />
      <path d="M144 50 L148 54 L156 46" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="100" y="140" fontSize="11" fill="#94a3b8" fontFamily="system-ui,sans-serif" textAnchor="middle">No employees added yet</text>
    </svg>
  ),
  leaves: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-auto">
      <circle cx="100" cy="72" r="55" fill="#f1f5f9" />
      <rect x="58" y="45" width="84" height="76" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="70" y="38" width="14" height="16" rx="4" fill="#ddd6fe" />
      <rect x="116" y="38" width="14" height="16" rx="4" fill="#ddd6fe" />
      <line x1="58" y1="65" x2="142" y2="65" stroke="#f1f5f9" strokeWidth="2" />
      <circle cx="79" cy="80" r="5" fill="#e2e8f0" />
      <circle cx="100" cy="80" r="5" fill="#e2e8f0" />
      <circle cx="121" cy="80" r="5" fill="#e2e8f0" />
      <circle cx="79" cy="97" r="5" fill="#e2e8f0" />
      <circle cx="100" cy="97" r="5" fill="#fef3c7" />
      <circle cx="121" cy="97" r="5" fill="#e2e8f0" />
      <text x="100" y="143" fontSize="11" fill="#94a3b8" fontFamily="system-ui,sans-serif" textAnchor="middle">No leave applications</text>
    </svg>
  ),
  payroll: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-auto">
      <circle cx="100" cy="72" r="55" fill="#f1f5f9" />
      <rect x="55" y="45" width="90" height="60" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="67" y="58" width="18" height="30" rx="3" fill="#ddd6fe" />
      <rect x="91" y="48" width="18" height="40" rx="3" fill="#c7d2fe" />
      <rect x="115" y="54" width="18" height="34" rx="3" fill="#ddd6fe" />
      <circle cx="150" cy="44" r="12" fill="#d1fae5" />
      <text x="144" y="49" fontSize="14" fill="#10b981" fontWeight="700" fontFamily="system-ui,sans-serif">₹</text>
      <text x="100" y="142" fontSize="11" fill="#94a3b8" fontFamily="system-ui,sans-serif" textAnchor="middle">No payroll records</text>
    </svg>
  ),
  attendance: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-auto">
      <circle cx="100" cy="72" r="55" fill="#f1f5f9" />
      <circle cx="100" cy="68" r="32" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <circle cx="100" cy="68" r="28" fill="#f8fafc" />
      <line x1="100" y1="68" x2="100" y2="46" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="68" x2="116" y2="72" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="68" r="4" fill="#4f46e5" />
      <circle cx="100" cy="40" r="2" fill="#94a3b8" />
      <circle cx="100" cy="96" r="2" fill="#94a3b8" />
      <circle cx="72" cy="68" r="2" fill="#94a3b8" />
      <circle cx="128" cy="68" r="2" fill="#94a3b8" />
      <text x="100" y="142" fontSize="11" fill="#94a3b8" fontFamily="system-ui,sans-serif" textAnchor="middle">No attendance records</text>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-auto">
      <circle cx="100" cy="72" r="55" fill="#f1f5f9" />
      <circle cx="93" cy="65" r="28" fill="white" stroke="#e2e8f0" strokeWidth="2.5" />
      <circle cx="93" cy="65" r="20" fill="#f8fafc" />
      <line x1="113" y1="85" x2="130" y2="102" stroke="#e2e8f0" strokeWidth="7" strokeLinecap="round" />
      <path d="M84 62 Q93 56 102 62" stroke="#ddd6fe" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="89" cy="66" r="2.5" fill="#7c3aed" opacity="0.4" />
      <circle cx="97" cy="66" r="2.5" fill="#7c3aed" opacity="0.4" />
      <text x="100" y="142" fontSize="11" fill="#94a3b8" fontFamily="system-ui,sans-serif" textAnchor="middle">No results found</text>
    </svg>
  ),
}

export default function EmptyState({ title, description, action, variant = 'default' }) {
  const illustration = illustrations[variant] || illustrations.default
  const defaultTitle = {
    employees: 'No employees yet',
    leaves: 'No leave applications',
    payroll: 'No payroll records',
    attendance: 'No attendance data',
    search: 'No results found',
    default: 'Nothing here yet',
  }[variant] || 'Nothing here yet'

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="mb-4 opacity-90">{illustration}</div>
      <h3 className="text-base font-semibold text-gray-800">{title || defaultTitle}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
