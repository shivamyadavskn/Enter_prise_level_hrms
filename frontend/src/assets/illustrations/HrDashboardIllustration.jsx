export default function HrDashboardIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 520 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Background blobs */}
      <circle cx="430" cy="60" r="90" fill="rgba(255,255,255,0.07)" />
      <circle cx="80" cy="330" r="70" fill="rgba(255,255,255,0.06)" />

      {/* Desk */}
      <rect x="70" y="248" width="380" height="14" rx="7" fill="rgba(255,255,255,0.25)" />
      {/* Desk legs */}
      <rect x="100" y="260" width="12" height="40" rx="4" fill="rgba(255,255,255,0.15)" />
      <rect x="408" y="260" width="12" height="40" rx="4" fill="rgba(255,255,255,0.15)" />

      {/* Laptop base */}
      <rect x="168" y="236" width="184" height="14" rx="5" fill="rgba(255,255,255,0.4)" />
      {/* Laptop screen frame */}
      <rect x="178" y="138" width="164" height="102" rx="10" fill="white" opacity="0.95" />
      {/* Screen content - mini chart */}
      <rect x="194" y="185" width="14" height="40" rx="3" fill="#4f46e5" />
      <rect x="215" y="168" width="14" height="57" rx="3" fill="#7c3aed" />
      <rect x="236" y="176" width="14" height="49" rx="3" fill="#4f46e5" />
      <rect x="257" y="158" width="14" height="67" rx="3" fill="#7c3aed" />
      <rect x="278" y="168" width="14" height="57" rx="3" fill="#4f46e5" />
      {/* Screen header text lines */}
      <rect x="194" y="148" width="90" height="7" rx="3.5" fill="#e2e8f0" />
      <rect x="194" y="160" width="55" height="5" rx="2.5" fill="#f1f5f9" />
      {/* Hinge */}
      <rect x="178" y="236" width="164" height="5" rx="2" fill="rgba(255,255,255,0.3)" />

      {/* Person — sitting at desk */}
      {/* Head */}
      <circle cx="260" cy="98" r="30" fill="rgba(255,255,255,0.92)" />
      {/* Hair */}
      <path d="M230 93 Q260 65 290 93 Q292 76 260 70 Q228 76 230 93Z" fill="#4f46e5" />
      {/* Neck */}
      <rect x="251" y="124" width="18" height="18" rx="5" fill="rgba(255,255,255,0.85)" />
      {/* Torso / shirt */}
      <path d="M225 140 Q260 130 295 140 L302 240 L218 240Z" fill="rgba(255,255,255,0.75)" />
      {/* Collar */}
      <path d="M245 138 L260 155 L275 138" stroke="#4f46e5" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left arm */}
      <path d="M225 148 Q195 165 178 238" stroke="rgba(255,255,255,0.75)" strokeWidth="20" strokeLinecap="round" fill="none" />
      {/* Right arm */}
      <path d="M295 148 Q325 165 342 238" stroke="rgba(255,255,255,0.75)" strokeWidth="20" strokeLinecap="round" fill="none" />
      {/* Hands on keyboard */}
      <ellipse cx="190" cy="242" rx="16" ry="8" fill="rgba(255,255,255,0.85)" />
      <ellipse cx="330" cy="242" rx="16" ry="8" fill="rgba(255,255,255,0.85)" />

      {/* Face details */}
      <circle cx="251" cy="97" r="3.5" fill="#7c3aed" />
      <circle cx="269" cy="97" r="3.5" fill="#7c3aed" />
      <path d="M249 110 Q260 118 271 110" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Floating card — Employees */}
      <rect x="22" y="72" width="118" height="72" rx="12" fill="white" opacity="0.97" />
      <rect x="22" y="72" width="118" height="72" rx="12" stroke="rgba(79,70,229,0.15)" strokeWidth="1" />
      <circle cx="42" cy="95" r="10" fill="#ede9fe" />
      {/* person icon */}
      <circle cx="42" cy="91" r="4" fill="#7c3aed" />
      <path d="M34 103 Q42 98 50 103" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="58" y="91" fontSize="10" fill="#94a3b8" fontFamily="system-ui,sans-serif">Total</text>
      <text x="58" y="103" fontSize="10" fill="#94a3b8" fontFamily="system-ui,sans-serif">Employees</text>
      <text x="38" y="131" fontSize="22" fill="#4f46e5" fontWeight="700" fontFamily="system-ui,sans-serif">48</text>
      <text x="68" y="131" fontSize="11" fill="#10b981" fontFamily="system-ui,sans-serif">↑ 12%</text>

      {/* Floating card — Present */}
      <rect x="380" y="90" width="118" height="72" rx="12" fill="white" opacity="0.97" />
      <rect x="380" y="90" width="118" height="72" rx="12" stroke="rgba(16,185,129,0.15)" strokeWidth="1" />
      <circle cx="400" cy="113" r="10" fill="#d1fae5" />
      <path d="M395 113 L399 117 L406 109" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="416" y="109" fontSize="10" fill="#94a3b8" fontFamily="system-ui,sans-serif">Present</text>
      <text x="416" y="121" fontSize="10" fill="#94a3b8" fontFamily="system-ui,sans-serif">Today</text>
      <text x="396" y="149" fontSize="22" fill="#10b981" fontWeight="700" fontFamily="system-ui,sans-serif">41</text>
      <text x="425" y="149" fontSize="11" fill="#94a3b8" fontFamily="system-ui,sans-serif">/ 48</text>

      {/* Floating card — Leaves */}
      <rect x="388" y="198" width="118" height="65" rx="12" fill="white" opacity="0.97" />
      <rect x="388" y="198" width="118" height="65" rx="12" stroke="rgba(245,158,11,0.15)" strokeWidth="1" />
      <circle cx="408" cy="219" r="10" fill="#fef3c7" />
      {/* calendar icon */}
      <rect x="402" y="214" width="12" height="11" rx="2" fill="none" stroke="#d97706" strokeWidth="1.5" />
      <line x1="402" y1="219" x2="414" y2="219" stroke="#d97706" strokeWidth="1.5" />
      <text x="424" y="216" fontSize="10" fill="#94a3b8" fontFamily="system-ui,sans-serif">Pending</text>
      <text x="424" y="228" fontSize="10" fill="#94a3b8" fontFamily="system-ui,sans-serif">Leaves</text>
      <text x="404" y="253" fontSize="20" fill="#d97706" fontWeight="700" fontFamily="system-ui,sans-serif">5</text>

      {/* Floating card — Payroll */}
      <rect x="16" y="200" width="118" height="65" rx="12" fill="white" opacity="0.97" />
      <rect x="16" y="200" width="118" height="65" rx="12" stroke="rgba(79,70,229,0.15)" strokeWidth="1" />
      <circle cx="36" cy="221" r="10" fill="#ede9fe" />
      {/* rupee/dollar icon */}
      <text x="30" y="226" fontSize="13" fill="#4f46e5" fontWeight="700" fontFamily="system-ui,sans-serif">₹</text>
      <text x="52" y="218" fontSize="10" fill="#94a3b8" fontFamily="system-ui,sans-serif">Monthly</text>
      <text x="52" y="230" fontSize="10" fill="#94a3b8" fontFamily="system-ui,sans-serif">Payroll</text>
      <text x="22" y="255" fontSize="13" fill="#4f46e5" fontWeight="700" fontFamily="system-ui,sans-serif">₹4.2L</text>

      {/* Dotted decorative dots */}
      <circle cx="160" cy="310" r="5" fill="rgba(255,255,255,0.3)" />
      <circle cx="145" cy="325" r="3.5" fill="rgba(255,255,255,0.2)" />
      <circle cx="370" cy="315" r="4" fill="rgba(255,255,255,0.3)" />
      <circle cx="390" cy="300" r="3" fill="rgba(255,255,255,0.2)" />
      <circle cx="65" cy="160" r="4" fill="rgba(255,255,255,0.2)" />
    </svg>
  )
}
