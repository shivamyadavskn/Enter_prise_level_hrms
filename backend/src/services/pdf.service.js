import PDFDocument from "pdfkit";

/**
 * Generates a professional payslip PDF and pipes it to `res`.
 * Uses pdfkit (no paid API). Streams directly so memory stays low.
 *
 * @param {Response} res    - Express response (will be piped)
 * @param {Object}   data   - { payroll, employee, organisation, salaryStructure, adjustments[] }
 */
export function streamPayslipPdf(res, data) {
  const { payroll, employee, organisation, salaryStructure, adjustments = [] } = data;
  const monthName = new Date(payroll.year, payroll.month - 1, 1)
    .toLocaleString("en-IN", { month: "long" });

  const doc = new PDFDocument({ size: "A4", margin: 50, info: {
    Title: `Payslip-${employee.employeeCode}-${monthName}-${payroll.year}`,
    Author: organisation?.name || "HRMS",
  }});

  // ── Headers ────────────────────────────────────────────────────────
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Payslip_${employee.employeeCode}_${monthName}_${payroll.year}.pdf"`
  );
  doc.pipe(res);

  // ── Constants ─────────────────────────────────────────────────────
  const INK   = "#1e293b";
  const MUTED = "#64748b";
  const RULE  = "#e2e8f0";
  const BRAND = "#4f46e5";
  const fmt   = (n) => `INR ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const PAGE_W = doc.page.width - 100; // 50pt margin each side

  // ── Header band ────────────────────────────────────────────────────
  doc.rect(50, 50, PAGE_W, 60).fill(BRAND);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18)
     .text(organisation?.name || "Company", 65, 68);
  doc.font("Helvetica").fontSize(10).fillColor("#e0e7ff")
     .text("Payslip", 65, 90);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff")
     .text(`${monthName} ${payroll.year}`, 50, 75, { width: PAGE_W - 15, align: "right" });

  // ── Employee info ──────────────────────────────────────────────────
  let y = 130;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text("Employee Details", 50, y);
  y += 18;

  const infoRows = [
    ["Employee Code", employee.employeeCode || "-"],
    ["Name", `${employee.firstName} ${employee.lastName || ""}`.trim()],
    ["Designation", employee.designation?.name || "-"],
    ["Department", employee.department?.name || "-"],
    ["PAN", employee.panNumber || "-"],
    ["Bank A/c", employee.bankAccountNumber || "-"],
    ["Pay Period", `${monthName} ${payroll.year}`],
    ["Working Days", `${payroll.presentDays || 0} / ${payroll.workingDays || 0}`],
  ];
  doc.font("Helvetica").fontSize(10);
  infoRows.forEach((row, i) => {
    const col = i % 2;
    const rowY = y + Math.floor(i / 2) * 18;
    const x = 50 + col * (PAGE_W / 2);
    doc.fillColor(MUTED).text(row[0], x, rowY, { width: 110 });
    doc.fillColor(INK).font("Helvetica-Bold").text(row[1], x + 110, rowY, { width: PAGE_W / 2 - 110 });
    doc.font("Helvetica");
  });
  y += Math.ceil(infoRows.length / 2) * 18 + 15;

  // ── Earnings / Deductions tables side-by-side ──────────────────────
  const colW = (PAGE_W - 20) / 2;
  const tableTop = y;

  const earnings = [
    ["Basic Salary", salaryStructure?.basicSalary],
    ["HRA", salaryStructure?.hra],
    ["Conveyance", salaryStructure?.conveyanceAllowance],
    ["Medical", salaryStructure?.medicalAllowance],
    ["Special Allowance", salaryStructure?.specialAllowance],
    ...adjustments
      .filter((a) => ["BONUS", "OVERTIME", "REIMBURSEMENT_PAYOUT", "ADJUSTMENT"].includes(a.type))
      .map((a) => [a.type, a.amount]),
  ].filter(([, v]) => v && Number(v) > 0);

  const deductions = [
    ["PF (Employee)", salaryStructure?.pfEmployee],
    ["Professional Tax", salaryStructure?.professionalTax],
    ["TDS", salaryStructure?.tds],
    ...adjustments
      .filter((a) => ["LOP", "ADVANCE", "PENALTY"].includes(a.type))
      .map((a) => [a.type, a.amount]),
  ].filter(([, v]) => v && Number(v) > 0);

  drawTable(doc, "Earnings", earnings, 50, tableTop, colW, INK, MUTED, RULE, fmt);
  drawTable(doc, "Deductions", deductions, 50 + colW + 20, tableTop, colW, INK, MUTED, RULE, fmt);

  const earningsHeight   = headerH() + earnings.length * rowH() + totalH();
  const deductionsHeight = headerH() + deductions.length * rowH() + totalH();
  y = tableTop + Math.max(earningsHeight, deductionsHeight) + 25;

  // ── Net pay panel ──────────────────────────────────────────────────
  doc.rect(50, y, PAGE_W, 50).fill("#f1f5f9");
  doc.fillColor(MUTED).font("Helvetica").fontSize(10)
     .text("Net Pay (Take Home)", 65, y + 10);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(20)
     .text(fmt(payroll.netSalary), 65, y + 22);

  doc.fillColor(MUTED).font("Helvetica").fontSize(9)
     .text(numberToWords(Math.round(payroll.netSalary)), 50, y + 60, { width: PAGE_W });
  y += 90;

  // ── Footer ─────────────────────────────────────────────────────────
  doc.moveTo(50, y).lineTo(50 + PAGE_W, y).strokeColor(RULE).lineWidth(0.5).stroke();
  doc.fillColor(MUTED).font("Helvetica").fontSize(8)
     .text("This is a computer-generated payslip and does not require a signature.",
           50, y + 10, { width: PAGE_W, align: "center" });
  doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`,
           50, y + 24, { width: PAGE_W, align: "center" });

  doc.end();
}

// ── Helpers ──────────────────────────────────────────────────────────

function headerH() { return 24; }
function rowH()    { return 18; }
function totalH()  { return 22; }

function drawTable(doc, title, rows, x, y, w, INK, MUTED, RULE, fmt) {
  // Header
  doc.rect(x, y, w, headerH()).fill("#f8fafc");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10)
     .text(title, x + 10, y + 7);
  let cy = y + headerH();

  // Rows
  doc.font("Helvetica").fontSize(9);
  let total = 0;
  rows.forEach(([label, value]) => {
    doc.fillColor(MUTED).text(label, x + 10, cy + 5, { width: w - 100 });
    doc.fillColor(INK).text(fmt(value), x + 10, cy + 5, { width: w - 20, align: "right" });
    doc.moveTo(x, cy + rowH()).lineTo(x + w, cy + rowH()).strokeColor(RULE).lineWidth(0.3).stroke();
    cy += rowH();
    total += Number(value || 0);
  });

  // Total
  doc.rect(x, cy, w, totalH()).fill("#f1f5f9");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10)
     .text(`Total ${title}`, x + 10, cy + 6);
  doc.text(fmt(total), x + 10, cy + 6, { width: w - 20, align: "right" });
}

// Tiny INR number-to-words helper (lakhs/crores)
function numberToWords(num) {
  if (num === 0) return "Rupees Zero only";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n/100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
    return "";
  };
  let n = Math.floor(num);
  let words = "";
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh  = Math.floor(n / 100000);   n %= 100000;
  const thousand = Math.floor(n / 1000);  n %= 1000;
  const hundred = n;
  if (crore)    words += inWords(crore) + " Crore ";
  if (lakh)     words += inWords(lakh) + " Lakh ";
  if (thousand) words += inWords(thousand) + " Thousand ";
  if (hundred)  words += inWords(hundred);
  return `Rupees ${words.trim()} only`;
}
