import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheckIcon, SparklesIcon, BoltIcon, ChartBarIcon, BanknotesIcon,
  ClockIcon, UserGroupIcon, DocumentTextIcon, ClipboardDocumentCheckIcon,
  ArrowRightIcon, CheckIcon, StarIcon, Bars3Icon, XMarkIcon,
  HeartIcon, BuildingOffice2Icon, RocketLaunchIcon, CurrencyRupeeIcon,
  CpuChipIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// ─── SEO meta injection ─────────────────────────────────────────────────────
function useSeo() {
  useEffect(() => {
    const setMeta = (name, content, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    document.title = 'PeopleOS — Modern HRMS for Indian SMBs | Payroll, Compliance & HR Software'

    setMeta('description', 'PeopleOS is an all-in-one HRMS built for Indian small businesses. Run payroll with anomaly detection, ensure PF/PT/TDS compliance, generate offer letters & manage your entire workforce — at a fraction of Zoho or Keka cost.')
    setMeta('keywords', 'HRMS India, payroll software, small business HR software, HR software India, payroll compliance, PF ECR, TDS, offer letter generator, employee management, attendance system')
    setMeta('author', 'PeopleOS')
    setMeta('robots', 'index, follow')
    setMeta('viewport', 'width=device-width, initial-scale=1.0')

    // Open Graph
    setMeta('og:title', 'PeopleOS — Modern HRMS for Indian SMBs', 'property')
    setMeta('og:description', 'All-in-one HRMS with built-in payroll anomaly detection and compliance dashboard. Built for small businesses.', 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:url', window.location.href, 'property')
    setMeta('og:site_name', 'PeopleOS', 'property')

    // Twitter
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', 'PeopleOS — Modern HRMS for Indian SMBs')
    setMeta('twitter:description', 'All-in-one HRMS with payroll anomaly detection, compliance dashboard, and letter generation.')

    // JSON-LD structured data
    const existing = document.getElementById('ld-software')
    if (!existing) {
      const ld = document.createElement('script')
      ld.type = 'application/ld+json'
      ld.id = 'ld-software'
      ld.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'PeopleOS',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '12' },
        description: 'All-in-one HRMS for Indian small businesses with payroll, compliance, attendance and onboarding.',
      })
      document.head.appendChild(ld)
    }

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname)
  }, [])
}

// ─── Components ─────────────────────────────────────────────────────────────

function NavBar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black text-gray-900 tracking-tight">PeopleOS</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#unique" className="hover:text-gray-900 transition-colors">Why Us</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900">Sign in</Link>
          <Link to="/register" className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all">
            Start Free
          </Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-gray-200 px-6 py-4 space-y-3 bg-white">
          <a href="#features" className="block text-sm font-medium text-gray-700">Features</a>
          <a href="#unique" className="block text-sm font-medium text-gray-700">Why Us</a>
          <a href="#pricing" className="block text-sm font-medium text-gray-700">Pricing</a>
          <a href="#faq" className="block text-sm font-medium text-gray-700">FAQ</a>
          <Link to="/login" className="block text-sm font-semibold text-gray-700">Sign in</Link>
          <Link to="/register" className="block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white text-center">Start Free</Link>
        </div>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/30 via-white to-white">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1100px] rounded-full bg-gradient-to-r from-indigo-200/40 via-purple-200/40 to-pink-200/40 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 mb-6 animate-fade-in">
            <SparklesIcon className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Built for Indian Small Businesses</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.05]">
            HR software that thinks
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">before you make mistakes.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
            The only HRMS that <strong className="text-gray-900">flags payroll errors</strong>, <strong className="text-gray-900">tracks compliance health</strong>, and <strong className="text-gray-900">generates letters in seconds</strong> — purpose-built for companies with 10–200 employees.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all">
              Start Free Trial
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="rounded-2xl bg-white px-8 py-4 text-base font-bold text-gray-900 ring-1 ring-gray-200 hover:ring-gray-300 hover:bg-gray-50 transition-all">
              See Live Demo
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><CheckIcon className="h-4 w-4 text-emerald-500" /> No credit card</div>
            <div className="flex items-center gap-1.5"><CheckIcon className="h-4 w-4 text-emerald-500" /> Free for &lt; 10 employees</div>
            <div className="flex items-center gap-1.5"><CheckIcon className="h-4 w-4 text-emerald-500" /> Setup in 5 minutes</div>
          </div>
        </div>

        {/* Hero dashboard mockup */}
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="relative rounded-2xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-2 shadow-2xl shadow-indigo-500/20">
            <div className="rounded-xl bg-white overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-gray-400">app.peopleos.in/dashboard</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                {[
                  { label: 'Compliance Score', value: '94', sub: '/ 100', color: 'from-emerald-500 to-teal-500', icon: ShieldCheckIcon },
                  { label: 'Payroll Anomalies', value: '3', sub: 'flagged', color: 'from-amber-500 to-orange-500', icon: ExclamationTriangleIcon },
                  { label: 'Active Employees', value: '47', sub: 'people', color: 'from-indigo-500 to-purple-500', icon: UserGroupIcon },
                ].map(c => (
                  <div key={c.label} className="rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
                    <div className={`inline-flex h-10 w-10 rounded-xl bg-gradient-to-br ${c.color} items-center justify-center mb-3`}>
                      <c.icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">{c.value}<span className="text-sm font-medium text-gray-400 ml-1">{c.sub}</span></p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{c.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustBar() {
  return (
    <section className="border-y border-gray-100 bg-gray-50/50 py-8">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">Built with the same standards as enterprise HRMS</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-gray-400">
          {['ISO 27001', 'GDPR Ready', 'SOC 2', '99.9% Uptime', 'AES-256 Encryption'].map(b => (
            <div key={b} className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheckIcon className="h-5 w-5" /> {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function UniqueFeatures() {
  const items = [
    {
      icon: CpuChipIcon, color: 'from-red-500 to-orange-500',
      title: 'AI-Powered Payroll Anomaly Detection',
      desc: 'Catches errors before they hit your employees\' bank accounts. Detects salary spikes, missing PAN, zero attendance, and 8+ other risks automatically.',
      bullets: ['Salary spike detection', 'Missing TDS alerts', 'Duplicate processing warnings'],
      tag: 'INDUSTRY FIRST',
    },
    {
      icon: ShieldCheckIcon, color: 'from-emerald-500 to-teal-500',
      title: 'Real-Time Compliance Dashboard',
      desc: 'Get a single health score for PF, PT, TDS, and labor law compliance. Generate PF ECR files, PT challans, and bank payment files in one click.',
      bullets: ['PF ECR file generation', 'TDS compliance tracking', 'NEFT bank file export'],
      tag: 'EXCLUSIVE',
    },
    {
      icon: DocumentTextIcon, color: 'from-indigo-500 to-purple-500',
      title: 'One-Click Letter Generation',
      desc: 'Generate offer letters, appointment letters, experience certificates, and salary revision letters in 5 seconds. No more Word templates.',
      bullets: ['10+ letter templates', 'Auto-fill from employee data', 'PDF export'],
      tag: 'TIME-SAVER',
    },
  ]
  return (
    <section id="unique" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block rounded-full bg-purple-100 px-4 py-1 text-xs font-bold text-purple-700 uppercase tracking-wide mb-4">What others don't have</span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">Three features no other HRMS gives you</h2>
          <p className="mt-4 text-lg text-gray-600">Zoho, Keka, GreytHR — none of them do this. Built specifically for the problems Indian SMBs face every month.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.title} className="group relative rounded-3xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-8 hover:border-gray-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className={`absolute top-6 right-6 rounded-full bg-gradient-to-r ${item.color} px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider`}>{item.tag}</div>
              <div className={`inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br ${item.color} items-center justify-center shadow-lg mb-5`}>
                <item.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{item.desc}</p>
              <ul className="space-y-2">
                {item.bullets.map(b => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    { icon: BanknotesIcon, title: 'Smart Payroll', desc: 'Editable preview, attendance integration, salary revisions' },
    { icon: ClockIcon, title: 'Attendance & WFH', desc: 'Live timer, regularization, WFH approvals' },
    { icon: HeartIcon, title: 'Leave Management', desc: 'Custom leave types, balance adjustments, comp-off' },
    { icon: UserGroupIcon, title: 'Employee 360°', desc: 'Profiles, documents, education, experience tracking' },
    { icon: ChartBarIcon, title: 'Performance Reviews', desc: 'Self & manager appraisals with acknowledgment flow' },
    { icon: ClipboardDocumentCheckIcon, title: 'Onboarding', desc: 'Custom checklists, progress tracking, asset assignment' },
    { icon: CurrencyRupeeIcon, title: 'Reimbursements', desc: 'Travel claims, expense policies, receipt uploads' },
    { icon: BuildingOffice2Icon, title: 'Multi-Tenant', desc: 'Manage multiple organizations from one platform' },
  ]
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-bold text-indigo-700 uppercase tracking-wide mb-4">Everything else, included</span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">Plus all the HRMS basics you'd expect</h2>
          <p className="mt-4 text-lg text-gray-600">25+ modules that cover the full employee lifecycle — from offer letter to relieving letter.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map(f => (
            <div key={f.title} className="rounded-2xl bg-white border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-md transition-all group">
              <div className="inline-flex h-10 w-10 rounded-xl bg-indigo-50 items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                <f.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">{f.title}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComparisonTable() {
  const rows = [
    ['Payroll anomaly detection', true, false, false, false],
    ['Compliance health dashboard', true, false, false, false],
    ['One-click letter generation', true, true, false, true],
    ['FnF settlement calculator', true, true, true, true],
    ['PF ECR / PT file generation', true, true, true, true],
    ['Attendance with live timer', true, true, true, true],
    ['Custom roles & permissions', true, true, false, true],
    ['Free for &lt; 10 employees', true, false, false, false],
    ['Starting price (50 employees)', '₹2,499/mo', '₹6,000/mo', '₹4,500/mo', '₹3,500/mo'],
  ]
  const cols = ['PeopleOS', 'Keka', 'Zoho People', 'GreytHR']
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">How we compare</h2>
          <p className="mt-4 text-lg text-gray-600">More features. Lower price. Built for Indian businesses.</p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200">
            <div className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Feature</div>
            {cols.map((c, i) => (
              <div key={c} className={`px-6 py-4 text-center text-sm font-black ${i === 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-700'}`}>{c}</div>
            ))}
          </div>
          {rows.map((row, ri) => (
            <div key={ri} className={`grid grid-cols-5 border-b border-gray-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
              <div className="px-6 py-4 text-sm font-semibold text-gray-900" dangerouslySetInnerHTML={{ __html: row[0] }} />
              {row.slice(1).map((cell, ci) => (
                <div key={ci} className={`px-6 py-4 text-center text-sm ${ci === 0 ? 'bg-indigo-50/40 font-bold text-indigo-700' : 'text-gray-600'}`}>
                  {typeof cell === 'boolean' ? (
                    cell ? <CheckIcon className="h-5 w-5 text-emerald-500 mx-auto" /> : <XMarkIcon className="h-5 w-5 text-gray-300 mx-auto" />
                  ) : cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const plans = [
    { name: 'Starter', price: 'Free', period: 'forever', employees: 'Up to 10 employees', features: ['All core HRMS features', 'Payroll & compliance', 'Letter generation', 'Email support'], cta: 'Start Free', highlight: false },
    { name: 'Growth', price: '₹49', period: '/employee/month', employees: '11–100 employees', features: ['Everything in Starter', 'Anomaly detection', 'Compliance dashboard', 'Priority support', 'Custom roles', 'API access'], cta: 'Start 14-day Trial', highlight: true },
    { name: 'Scale', price: '₹39', period: '/employee/month', employees: '100+ employees', features: ['Everything in Growth', 'Dedicated success manager', 'Custom integrations', 'SLA guarantee', 'On-premise option', 'White-labeling'], cta: 'Contact Sales', highlight: false },
  ]
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-white via-indigo-50/30 to-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-4">Simple, honest pricing</span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">Free to start. Affordable to grow.</h2>
          <p className="mt-4 text-lg text-gray-600">No setup fees. No surprise charges. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(p => (
            <div key={p.name} className={`relative rounded-3xl p-8 ${p.highlight ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl shadow-indigo-500/30 scale-105' : 'bg-white border border-gray-200'}`}>
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 text-amber-900 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <h3 className={`text-xl font-black ${p.highlight ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
              <p className={`mt-1 text-xs font-semibold uppercase tracking-wide ${p.highlight ? 'text-white/80' : 'text-gray-500'}`}>{p.employees}</p>
              <div className="mt-6 mb-6">
                <span className={`text-5xl font-black ${p.highlight ? 'text-white' : 'text-gray-900'}`}>{p.price}</span>
                <span className={`text-sm ml-1 ${p.highlight ? 'text-white/70' : 'text-gray-500'}`}>{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${p.highlight ? 'text-white/90' : 'text-gray-700'}`}>
                    <CheckIcon className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? 'text-emerald-300' : 'text-emerald-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`block w-full text-center rounded-xl py-3 text-sm font-bold transition-all ${p.highlight ? 'bg-white text-indigo-700 hover:bg-gray-50 shadow-lg' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const [open, setOpen] = useState(0)
  const qs = [
    { q: 'Is PeopleOS really free for small teams?', a: 'Yes — completely free for up to 10 employees, forever. No credit card required, no time limits. You only pay if you grow beyond 10 people.' },
    { q: 'Can I migrate from Zoho People / Keka / GreytHR?', a: 'Absolutely. We offer free CSV import for employees, leave balances, and salary structures. Most companies are fully migrated within a few hours.' },
    { q: 'How is payroll anomaly detection different from regular payroll?', a: 'Most HRMS just process numbers. We detect issues before payroll runs — like sudden salary spikes, missing PAN numbers, zero-attendance employees, and high LOP days. We catch errors that cost you money.' },
    { q: 'Do you support GST, PF, ESI, and TDS?', a: 'Yes. We auto-generate PF ECR files, PT challans, and provide TDS compliance tracking. Built specifically for Indian statutory requirements.' },
    { q: 'Is my data secure?', a: 'Yes. We use AES-256 encryption at rest, TLS 1.3 in transit, role-based access control, and complete audit logs. Your data is hosted in India.' },
    { q: 'Can I self-host PeopleOS?', a: 'Yes — Docker-based deployment is available on the Scale plan. Get full control over your data with on-premise hosting.' },
  ]
  return (
    <section id="faq" className="py-24 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {qs.map((item, i) => (
            <div key={i} className={`rounded-2xl border transition-all ${open === i ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200 bg-white'}`}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
                <span className="text-sm font-bold text-gray-900">{item.q}</span>
                <span className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shrink-0 ${open === i ? 'bg-indigo-600 text-white rotate-45' : 'bg-gray-100 text-gray-600'}`}>
                  <span className="text-lg leading-none">+</span>
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 sm:p-16 text-center shadow-2xl shadow-indigo-500/30">
          <div className="absolute inset-0 opacity-20">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>
          <div className="relative">
            <RocketLaunchIcon className="h-12 w-12 text-white mx-auto mb-6" />
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Stop firefighting HR.<br />Start running it.</h2>
            <p className="mt-6 text-lg text-white/90 max-w-2xl mx-auto">Join hundreds of small businesses that automate payroll, ensure compliance, and save 10+ hours every month with PeopleOS.</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="rounded-2xl bg-white px-8 py-4 text-base font-bold text-indigo-700 shadow-xl hover:scale-105 transition-transform">
                Start Free — No Credit Card
              </Link>
              <Link to="/login" className="text-white font-bold underline-offset-4 hover:underline">
                Or sign in →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-black text-gray-900">PeopleOS</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs">Modern HRMS for Indian small businesses. Payroll, compliance & people management — done right.</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Product</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Account</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/login">Sign in</Link></li>
              <li><Link to="/register">Sign up</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} PeopleOS. Made in India for Indian businesses.</p>
          <p>Privacy &middot; Terms &middot; Security</p>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  useSeo()
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <NavBar />
      <main>
        <Hero />
        <TrustBar />
        <UniqueFeatures />
        <Features />
        <ComparisonTable />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
