const COMPANY = {
  name: 'HRMS Enterprise Pvt. Ltd.',
  address: '123, Business Park, Tech City - 400001',
  phone: '+91-9000000000',
  email: 'hr@hrms.com',
  website: 'www.hrms.com',
  cin: 'U72900MH2020PTC123456',
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '___________'
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const BASE_STYLES = `
  *{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;font-size:13px}
  body{padding:48px;color:#111;line-height:1.7}
  .lh{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1d4ed8;padding-bottom:14px;margin-bottom:28px}
  .co-name{font-size:22px;font-weight:700;color:#1d4ed8;letter-spacing:-0.5px}
  .co-meta{font-size:11px;color:#555;margin-top:3px;line-height:1.5}
  .co-right{text-align:right;font-size:11px;color:#555}
  .doc-title{font-size:15px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:2px;color:#1e40af;margin:18px 0 22px;text-decoration:underline}
  .ref-row{display:flex;justify-content:space-between;margin-bottom:20px;font-size:12px;color:#444}
  .to-block{margin-bottom:18px;font-size:12.5px}
  .to-block strong{display:block;margin-bottom:2px}
  p{margin-bottom:12px}
  h4{font-size:13px;font-weight:700;margin:18px 0 6px;text-decoration:underline}
  .comp-table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}
  .comp-table th{background:#eff6ff;padding:8px 12px;text-align:left;border:1px solid #dbeafe;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
  .comp-table td{padding:8px 12px;border:1px solid #e5e7eb}
  .comp-table .total td{font-weight:700;background:#eff6ff;color:#1d4ed8}
  .sig-area{margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:60px}
  .sig-box{border-top:1px solid #aaa;padding-top:8px;font-size:11px;color:#444}
  .footer{margin-top:32px;text-align:center;font-size:10.5px;color:#888;border-top:1px solid #e5e7eb;padding-top:10px}
  .highlight-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;margin:14px 0}
  .notice-box{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px 16px;margin:14px 0}
  @media print{body{padding:24px}.no-print{display:none}}
`

function printDoc(html, title) {
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title><style>${BASE_STYLES}</style></head><body>${html}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}

function letterhead(refNo, date) {
  return `
    <div class="lh">
      <div>
        <div class="co-name">${COMPANY.name}</div>
        <div class="co-meta">${COMPANY.address}<br/>Tel: ${COMPANY.phone} | ${COMPANY.email}<br/>CIN: ${COMPANY.cin}</div>
      </div>
      <div class="co-right">Ref No: ${refNo || 'HR/' + Date.now()}<br/>Date: ${fmtDate(date || new Date())}</div>
    </div>`
}

function footer() {
  return `<div class="footer">This is a computer-generated document. · ${COMPANY.name} · ${COMPANY.website}</div>`
}

// ─────────────────────────────────────────────
// 1. OFFER LETTER
// ─────────────────────────────────────────────
export function generateOfferLetter(emp, params = {}) {
  const { joiningDate, probationMonths = 6, ctc, refNo } = params
  const sal = emp.salaryStructures?.[0]
  const monthlyCTC = sal ? sal.grossSalary + (sal.pfEmployer || 0) : Number(ctc || 0)
  const annualCTC = monthlyCTC * 12

  const html = `
    ${letterhead(refNo || `OL/${emp.employeeCode}`, new Date())}
    <div class="doc-title">Offer Letter</div>
    <div class="ref-row"><span></span><span>Date: ${fmtDate(new Date())}</span></div>
    <div class="to-block">
      <strong>${emp.firstName} ${emp.lastName || ''}</strong>
      ${emp.address ? emp.address + '<br/>' : ''}
      ${[emp.city, emp.state, emp.country].filter(Boolean).join(', ')}
    </div>
    <p>Dear <strong>${emp.firstName}</strong>,</p>
    <p>We are pleased to offer you the position of <strong>${emp.designation?.name || '___________'}</strong> in our <strong>${emp.department?.name || '___________'}</strong> department at ${COMPANY.name}.</p>
    <p>After reviewing your application and interviews, we believe your skills and experience will be a great addition to our team. Your employment is subject to the terms and conditions set out below:</p>
    <h4>1. Employment Details</h4>
    <table class="comp-table">
      <tr><th>Designation</th><td>${emp.designation?.name || '___________'}</td><th>Department</th><td>${emp.department?.name || '___________'}</td></tr>
      <tr><th>Date of Joining</th><td>${fmtDate(joiningDate || emp.dateOfJoining)}</td><th>Employment Type</th><td>Full-Time, Permanent</td></tr>
      <tr><th>Probation Period</th><td>${probationMonths} Months</td><th>Location</th><td>${emp.city || 'Head Office'}</td></tr>
    </table>
    <h4>2. Compensation</h4>
    <table class="comp-table">
      <thead><tr><th>Component</th><th>Monthly (₹)</th><th>Annual (₹)</th></tr></thead>
      <tbody>
        <tr><td>Basic Salary</td><td>${fmtMoney(sal?.basicSalary)}</td><td>${fmtMoney((sal?.basicSalary || 0) * 12)}</td></tr>
        <tr><td>House Rent Allowance (HRA)</td><td>${fmtMoney(sal?.hra)}</td><td>${fmtMoney((sal?.hra || 0) * 12)}</td></tr>
        <tr><td>Conveyance Allowance</td><td>${fmtMoney(sal?.conveyanceAllowance)}</td><td>${fmtMoney((sal?.conveyanceAllowance || 0) * 12)}</td></tr>
        <tr><td>Medical Allowance</td><td>${fmtMoney(sal?.medicalAllowance)}</td><td>${fmtMoney((sal?.medicalAllowance || 0) * 12)}</td></tr>
        <tr><td>Special Allowance</td><td>${fmtMoney(sal?.specialAllowance)}</td><td>${fmtMoney((sal?.specialAllowance || 0) * 12)}</td></tr>
        <tr><td>Employer PF Contribution</td><td>${fmtMoney(sal?.pfEmployer)}</td><td>${fmtMoney((sal?.pfEmployer || 0) * 12)}</td></tr>
        <tr class="total"><td><strong>Total CTC</strong></td><td><strong>${fmtMoney(monthlyCTC)}</strong></td><td><strong>${fmtMoney(annualCTC)}</strong></td></tr>
      </tbody>
    </table>
    <h4>3. Terms & Conditions</h4>
    <p>This offer is contingent upon satisfactory completion of background verification, submission of required documents, and passing the pre-employment health check. Your employment will be governed by the Company's HR policies in force from time to time.</p>
    <p>Kindly sign and return a copy of this letter as your acceptance on or before <strong>${fmtDate(joiningDate || emp.dateOfJoining)}</strong>.</p>
    <p>We look forward to welcoming you to our team.</p>
    <div class="sig-area">
      <div class="sig-box">Employee Signature<br/><br/><br/>Name: ${emp.firstName} ${emp.lastName || ''}<br/>Date: ___________</div>
      <div class="sig-box">For ${COMPANY.name}<br/><br/><br/>Authorised Signatory<br/>HR Department</div>
    </div>
    ${footer()}`
  printDoc(html, `Offer Letter - ${emp.firstName} ${emp.lastName}`)
}

// ─────────────────────────────────────────────
// 2. PROBATION CONFIRMATION LETTER
// ─────────────────────────────────────────────
export function generateProbationLetter(emp, params = {}) {
  const { type = 'CONFIRM', extensionMonths = 3, effectiveDate, refNo } = params
  const isExtend = type === 'EXTEND'

  const html = `
    ${letterhead(refNo || `PL/${emp.employeeCode}`, new Date())}
    <div class="doc-title">${isExtend ? 'Probation Extension Letter' : 'Probation Confirmation Letter'}</div>
    <div class="to-block">
      <strong>${emp.firstName} ${emp.lastName || ''}</strong>
      ${emp.designation?.name || ''}, ${emp.department?.name || ''}<br/>
      Employee Code: ${emp.employeeCode}
    </div>
    <p>Dear <strong>${emp.firstName}</strong>,</p>
    ${isExtend ? `
      <p>This is to inform you that your probation period, which was scheduled to end, has been <strong>extended by ${extensionMonths} month(s)</strong> effective from <strong>${fmtDate(effectiveDate || new Date())}</strong>.</p>
      <p>During this extended period, you are expected to demonstrate improvement in the areas discussed during your review meeting. A re-evaluation will be conducted at the end of this extension period.</p>
      <div class="notice-box"><strong>Areas requiring improvement:</strong> Please refer to your performance review document for specific targets and timelines.</div>
    ` : `
      <p>We are pleased to inform you that upon satisfactory evaluation of your performance during the probation period, your services have been <strong>confirmed as a permanent employee</strong> of ${COMPANY.name} with effect from <strong>${fmtDate(effectiveDate || emp.dateOfConfirmation || new Date())}</strong>.</p>
      <div class="highlight-box">✓ Your confirmation comes with the full benefits applicable to confirmed employees as per company policy.</div>
      <p>Your continued dedication and contributions to the organization have been noted and appreciated. We look forward to your continued growth with us.</p>
    `}
    <h4>Employment Details</h4>
    <table class="comp-table">
      <tr><th>Employee Code</th><td>${emp.employeeCode}</td><th>Date of Joining</th><td>${fmtDate(emp.dateOfJoining)}</td></tr>
      <tr><th>Designation</th><td>${emp.designation?.name || '—'}</td><th>Department</th><td>${emp.department?.name || '—'}</td></tr>
      <tr><th>Effective Date</th><td>${fmtDate(effectiveDate || new Date())}</td><th>Status</th><td>${isExtend ? 'Probation Extended' : 'Confirmed Permanent'}</td></tr>
    </table>
    <p>Please continue to uphold the standards and values of our organization. We wish you a successful career with us.</p>
    <div class="sig-area">
      <div class="sig-box">Employee Acknowledgement<br/><br/><br/>Name: ${emp.firstName} ${emp.lastName || ''}<br/>Date: ___________</div>
      <div class="sig-box">For ${COMPANY.name}<br/><br/><br/>HR Manager / Authorised Signatory<br/>Date: ${fmtDate(new Date())}</div>
    </div>
    ${footer()}`
  printDoc(html, `${isExtend ? 'Probation Extension' : 'Probation Confirmation'} - ${emp.firstName}`)
}

// ─────────────────────────────────────────────
// 3. EXIT / ACCEPTANCE OF RESIGNATION LETTER
// ─────────────────────────────────────────────
export function generateExitLetter(emp, params = {}) {
  const { resignationDate, lastWorkingDate, noticePeriodDays = 30, reason = 'personal reasons', refNo } = params

  const html = `
    ${letterhead(refNo || `EL/${emp.employeeCode}`, new Date())}
    <div class="doc-title">Acceptance of Resignation / Exit Letter</div>
    <div class="to-block">
      <strong>${emp.firstName} ${emp.lastName || ''}</strong>
      ${emp.designation?.name || ''}, ${emp.department?.name || ''}<br/>
      Employee Code: ${emp.employeeCode}
    </div>
    <p>Dear <strong>${emp.firstName}</strong>,</p>
    <p>This is to acknowledge the receipt of your resignation letter dated <strong>${fmtDate(resignationDate)}</strong>, citing <em>${reason}</em> as the reason for your departure.</p>
    <p>After due consideration, we hereby accept your resignation. Your last working day with ${COMPANY.name} will be <strong>${fmtDate(lastWorkingDate)}</strong>, in accordance with the <strong>${noticePeriodDays}-day notice period</strong> as per your employment terms.</p>
    <h4>Exit Checklist — Please ensure the following before your last day:</h4>
    <table class="comp-table">
      <thead><tr><th>Item</th><th>Status</th><th>Responsible</th></tr></thead>
      <tbody>
        <tr><td>Handover of projects/responsibilities</td><td>Pending</td><td>Reporting Manager</td></tr>
        <tr><td>Return of company assets (laptop, ID card, access cards)</td><td>Pending</td><td>IT / Admin</td></tr>
        <tr><td>Clearing of dues / advances</td><td>Pending</td><td>Finance</td></tr>
        <tr><td>No Dues Certificate</td><td>Pending</td><td>HR</td></tr>
        <tr><td>Exit Interview</td><td>Pending</td><td>HR</td></tr>
        <tr><td>Final Salary & F&F Settlement</td><td>Will be processed</td><td>Finance / HR</td></tr>
      </tbody>
    </table>
    <p>Your experience certificate and relieving letter will be issued after completion of the exit formalities and clearance from all departments.</p>
    <p>We appreciate your contributions to ${COMPANY.name} during your tenure of <strong>${emp.dateOfJoining ? Math.round((new Date(lastWorkingDate) - new Date(emp.dateOfJoining)) / (1000 * 60 * 60 * 24 * 30)) : '—'} months</strong>. We wish you the very best in your future endeavours.</p>
    <div class="sig-area">
      <div class="sig-box">Employee Acknowledgement<br/><br/><br/>Name: ${emp.firstName} ${emp.lastName || ''}<br/>Date: ___________</div>
      <div class="sig-box">For ${COMPANY.name}<br/><br/><br/>HR Manager<br/>Date: ${fmtDate(new Date())}</div>
    </div>
    ${footer()}`
  printDoc(html, `Exit Letter - ${emp.firstName}`)
}

// ─────────────────────────────────────────────
// 4. FULL & FINAL SETTLEMENT
// ─────────────────────────────────────────────
export function generateFullFinal(emp, params = {}) {
  const {
    lastWorkingDate, lastMonthSalary = 0, leaveEncashmentDays = 0, noticePeriodRecovery = 0,
    otherDeductions = 0, gratuity = 0, bonus = 0, advanceRecovery = 0, refNo,
  } = params
  const sal = emp.salaryStructures?.[0]
  const perDay = sal ? (sal.grossSalary / 30) : 0
  const leaveEncashment = leaveEncashmentDays * perDay
  const totalEarnings = Number(lastMonthSalary) + leaveEncashment + Number(gratuity) + Number(bonus)
  const totalDeductions = Number(noticePeriodRecovery) + Number(otherDeductions) + Number(advanceRecovery)
  const netPayable = totalEarnings - totalDeductions

  const html = `
    ${letterhead(refNo || `FNF/${emp.employeeCode}`, new Date())}
    <div class="doc-title">Full & Final Settlement Statement</div>
    <div class="to-block">
      <strong>${emp.firstName} ${emp.lastName || ''}</strong>
      ${emp.designation?.name || ''}, ${emp.department?.name || ''}<br/>
      Employee Code: ${emp.employeeCode} | Date of Joining: ${fmtDate(emp.dateOfJoining)}<br/>
      Last Working Date: <strong>${fmtDate(lastWorkingDate)}</strong>
    </div>
    <p>Dear <strong>${emp.firstName}</strong>,</p>
    <p>This letter confirms the Full & Final settlement of your employment dues. The following statement details the amounts payable to/by you upon separation from ${COMPANY.name}:</p>
    <h4>Earnings</h4>
    <table class="comp-table">
      <thead><tr><th>Description</th><th>Details</th><th>Amount (₹)</th></tr></thead>
      <tbody>
        <tr><td>Last Month Salary (pro-rata)</td><td>As per attendance</td><td>${fmtMoney(lastMonthSalary)}</td></tr>
        <tr><td>Leave Encashment</td><td>${leaveEncashmentDays} days × ${fmtMoney(perDay.toFixed(0))}/day</td><td>${fmtMoney(leaveEncashment.toFixed(0))}</td></tr>
        <tr><td>Gratuity</td><td>As per Gratuity Act</td><td>${fmtMoney(gratuity)}</td></tr>
        <tr><td>Bonus / Incentive</td><td>Pending dues</td><td>${fmtMoney(bonus)}</td></tr>
        <tr class="total"><td colspan="2"><strong>Total Earnings</strong></td><td><strong>${fmtMoney(totalEarnings.toFixed(0))}</strong></td></tr>
      </tbody>
    </table>
    <h4>Deductions</h4>
    <table class="comp-table">
      <thead><tr><th>Description</th><th>Details</th><th>Amount (₹)</th></tr></thead>
      <tbody>
        <tr><td>Notice Period Recovery</td><td>Short notice deduction</td><td>${fmtMoney(noticePeriodRecovery)}</td></tr>
        <tr><td>Advance Salary Recovery</td><td>Outstanding advance</td><td>${fmtMoney(advanceRecovery)}</td></tr>
        <tr><td>Other Deductions</td><td>As applicable</td><td>${fmtMoney(otherDeductions)}</td></tr>
        <tr class="total"><td colspan="2"><strong>Total Deductions</strong></td><td><strong>${fmtMoney(totalDeductions)}</strong></td></tr>
      </tbody>
    </table>
    <table class="comp-table" style="margin-top:8px">
      <tr class="total"><td><strong>NET AMOUNT PAYABLE TO EMPLOYEE</strong></td><td style="text-align:right;font-size:15px;color:#1d4ed8"><strong>${fmtMoney(netPayable.toFixed(0))}</strong></td></tr>
    </table>
    <p style="margin-top:14px">The settlement amount will be credited to your registered bank account within <strong>30 working days</strong> from the date of clearance of all dues.</p>
    <h4>Bank Details on Record</h4>
    <table class="comp-table">
      <tr><th>Account Holder</th><td>${emp.bankAccountHolder || '___________'}</td><th>Bank</th><td>${emp.bankName || '___________'}</td></tr>
      <tr><th>Account Number</th><td>${emp.bankAccountNumber ? '****' + emp.bankAccountNumber.slice(-4) : '___________'}</td><th>IFSC</th><td>${emp.bankIFSC || '___________'}</td></tr>
    </table>
    <div class="sig-area">
      <div class="sig-box">Employee Acceptance<br/><br/><br/>Name: ${emp.firstName} ${emp.lastName || ''}<br/>Date: ___________</div>
      <div class="sig-box">For ${COMPANY.name}<br/><br/><br/>Finance / HR Manager<br/>Date: ${fmtDate(new Date())}</div>
    </div>
    ${footer()}`
  printDoc(html, `F&F Settlement - ${emp.firstName}`)
}

// ─────────────────────────────────────────────
// 5. REIMBURSEMENT LETTER
// ─────────────────────────────────────────────
export function generateReimbursement(emp, params = {}) {
  const { expenses = [], refNo, claimDate } = params
  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  const rows = expenses.length > 0
    ? expenses.map((e, i) => `<tr><td>${i + 1}</td><td>${e.description || '—'}</td><td>${fmtDate(e.date)}</td><td>${e.category || '—'}</td><td style="text-align:right">${fmtMoney(e.amount)}</td></tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;color:#888">No expense items added</td></tr>`

  const html = `
    ${letterhead(refNo || `RMB/${emp.employeeCode}`, new Date())}
    <div class="doc-title">Reimbursement Claim Letter</div>
    <div class="to-block">
      <strong>To: Finance Department</strong><br/>
      ${COMPANY.name}
    </div>
    <p>This is to certify that <strong>${emp.firstName} ${emp.lastName || ''}</strong> (${emp.designation?.name || '—'}, ${emp.department?.name || '—'}, Emp Code: ${emp.employeeCode}) has incurred the following business expenses and is hereby claiming reimbursement:</p>
    <h4>Expense Details</h4>
    <table class="comp-table">
      <thead><tr><th>#</th><th>Description</th><th>Date</th><th>Category</th><th style="text-align:right">Amount (₹)</th></tr></thead>
      <tbody>
        ${rows}
        <tr class="total"><td colspan="4"><strong>Total Claim Amount</strong></td><td style="text-align:right"><strong>${fmtMoney(total)}</strong></td></tr>
      </tbody>
    </table>
    <div class="highlight-box">
      I hereby declare that the above expenses were incurred solely for official business purposes and all supporting documents/bills have been attached with this claim.
    </div>
    <h4>Payment Details</h4>
    <table class="comp-table">
      <tr><th>Account Holder</th><td>${emp.bankAccountHolder || '___________'}</td><th>Bank</th><td>${emp.bankName || '___________'}</td></tr>
      <tr><th>Account Number</th><td>${emp.bankAccountNumber || '___________'}</td><th>IFSC</th><td>${emp.bankIFSC || '___________'}</td></tr>
    </table>
    <div class="sig-area">
      <div class="sig-box">Employee Signature<br/><br/><br/>Name: ${emp.firstName} ${emp.lastName || ''}<br/>Date: ${fmtDate(claimDate || new Date())}</div>
      <div class="sig-box">Approved By<br/><br/><br/>Manager / HR / Finance<br/>Date: ___________</div>
    </div>
    ${footer()}`
  printDoc(html, `Reimbursement - ${emp.firstName}`)
}

// ─────────────────────────────────────────────
// 6. HOLIDAY POLICY DOCUMENT
// ─────────────────────────────────────────────
export function generateHolidayPolicy(holidays, year) {
  const byType = { PUBLIC: [], OPTIONAL: [], RESTRICTED: [] }
  holidays.forEach((h) => (byType[h.type] || []).push(h))

  const section = (type, label, color) => {
    const items = byType[type] || []
    if (!items.length) return ''
    return `
      <h4 style="color:${color};margin-top:20px">${label} Holidays (${items.length})</h4>
      <table class="comp-table">
        <thead><tr><th>#</th><th>Holiday</th><th>Date</th><th>Day</th></tr></thead>
        <tbody>${items.map((h, i) => {
          const d = new Date(h.date)
          return `<tr><td>${i + 1}</td><td>${h.name}</td><td>${fmtDate(h.date)}</td><td>${d.toLocaleDateString('en-IN', { weekday: 'long' })}</td></tr>`
        }).join('')}</tbody>
      </table>`
  }

  const html = `
    ${letterhead(`HP/${year}`, new Date())}
    <div class="doc-title">Holiday Policy — ${year}</div>
    <p>This document lists the official holidays observed by <strong>${COMPANY.name}</strong> for the calendar year <strong>${year}</strong>. All employees are entitled to the public holidays listed below.</p>
    <div class="highlight-box">
      <strong>Total Holidays: ${holidays.length}</strong> &nbsp;|&nbsp;
      Public: ${byType.PUBLIC.length} &nbsp;|&nbsp;
      Optional: ${byType.OPTIONAL.length} &nbsp;|&nbsp;
      Restricted: ${byType.RESTRICTED.length}
    </div>
    ${section('PUBLIC', '🟢 Public', '#15803d')}
    ${section('OPTIONAL', '🟡 Optional', '#b45309')}
    ${section('RESTRICTED', '🔵 Restricted', '#1d4ed8')}
    <div class="notice-box" style="margin-top:20px">
      <strong>Note:</strong> Optional holidays can be availed by employees on a first-come-first-served basis subject to prior approval. Restricted holidays are applicable to specific departments or locations as communicated separately.
    </div>
    <div class="sig-area">
      <div class="sig-box">Issued By<br/><br/><br/>HR Manager<br/>Date: ${fmtDate(new Date())}</div>
      <div class="sig-box">Approved By<br/><br/><br/>Management<br/>Date: ${fmtDate(new Date())}</div>
    </div>
    ${footer()}`
  printDoc(html, `Holiday Policy ${year}`)
}

// ─────────────────────────────────────────────
// 7. LEAVE POLICY DOCUMENT
// ─────────────────────────────────────────────
export function generateLeavePolicy(leaveTypes) {
  const year = new Date().getFullYear()
  const rows = leaveTypes.map((lt, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${lt.name}</strong></td>
      <td style="text-align:center">${lt.code}</td>
      <td style="text-align:center">${lt.annualQuota}</td>
      <td style="text-align:center">${lt.carryForwardAllowed ? `✓ (Max ${lt.maxCarryForward})` : '—'}</td>
      <td style="text-align:center">${lt.encashmentAllowed ? '✓' : '—'}</td>
      <td style="text-align:center">${lt.requiresDocument ? '✓' : '—'}</td>
    </tr>`).join('')

  const html = `
    ${letterhead(`LP/${year}`, new Date())}
    <div class="doc-title">Leave Policy — ${year}</div>
    <p>This document outlines the Leave Policy of <strong>${COMPANY.name}</strong> applicable to all confirmed and probationary employees for the year <strong>${year}</strong>.</p>
    <h4>Leave Entitlements</h4>
    <table class="comp-table">
      <thead>
        <tr>
          <th>#</th><th>Leave Type</th><th>Code</th><th>Annual Days</th>
          <th>Carry Forward</th><th>Encashable</th><th>Document Required</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <h4>General Rules</h4>
    <p>1. All leave applications must be submitted through the HR Management System at least 2 working days in advance (except emergency/sick leaves).</p>
    <p>2. Leave applications are subject to approval by the reporting manager and HR. Leaves taken without approval will be treated as Loss of Pay (LOP).</p>
    <p>3. Leave balances are credited at the beginning of each calendar year. New joiners receive a pro-rated entitlement based on their date of joining.</p>
    <p>4. Carry-forward of eligible leaves must be utilized by <strong>March 31st</strong> of the following year, failing which they will lapse.</p>
    <p>5. Leave encashment for eligible leave types is processed as part of the annual payroll cycle or at the time of separation.</p>
    <p>6. Any misuse or misrepresentation in leave applications may result in disciplinary action.</p>
    <div class="sig-area">
      <div class="sig-box">Issued By<br/><br/><br/>HR Department<br/>Date: ${fmtDate(new Date())}</div>
      <div class="sig-box">Approved By<br/><br/><br/>Management<br/>Date: ${fmtDate(new Date())}</div>
    </div>
    ${footer()}`
  printDoc(html, `Leave Policy ${year}`)
}
