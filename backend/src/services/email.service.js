/**
 * Email Service — nodemailer with Resend SMTP relay (or any SMTP provider).
 * Uses RESEND_API_KEY as SMTP password for smtp.resend.com.
 * Falls back to console log if not configured.
 */
import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const APP_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const COMPANY = process.env.COMPANY_NAME || "HRMS Enterprise";

// Supports Resend SMTP (default) or any SMTP via EMAIL_SMTP_* vars
const transporter = process.env.RESEND_API_KEY
  ? nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || "smtp.resend.com",
    port: Number(process.env.EMAIL_SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_SMTP_USER || "resend",
      pass: process.env.RESEND_API_KEY,
    },
  })
  : null;

// ─── Base Template ────────────────────────────────────────────────────────────

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${COMPANY}</title></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-.5px;">${COMPANY}</p>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:1.5px;">HR Management System</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">This is an automated message from ${COMPANY}. Please do not reply to this email.</p>
          <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">&copy; ${new Date().getFullYear()} ${COMPANY}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text, url) {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;margin-top:16px;">${text}</a>`;
}

function badge(text, color) {
  const colors = {
    green: "background:#d1fae5;color:#065f46",
    red: "background:#fee2e2;color:#991b1b",
    blue: "background:#dbeafe;color:#1e40af",
    amber: "background:#fef3c7;color:#92400e",
    purple: "background:#ede9fe;color:#4c1d95",
  };
  return `<span style="display:inline-block;${colors[color] || colors.blue};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${text}</span>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#64748b;width:140px;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#1e293b;font-weight:500;">${value}</td>
  </tr>`;
}

function infoTable(rows) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:20px 0;">
    <tbody>${rows.map(([l, v]) => infoRow(l, v)).join("")}</tbody>
  </table>`;
}

function heading(text) {
  return `<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">${text}</h2>`;
}

function para(text) {
  return `<p style="margin:12px 0;font-size:15px;color:#475569;line-height:1.7;">${text}</p>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">`;
}

// ─── Core sender ─────────────────────────────────────────────────────────────

async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.log(`[EMAIL] No RESEND_API_KEY — skipping: "${subject}" → ${to}`);
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });
    console.log(`[EMAIL] ✉️  Sent "${subject}" → ${to} (msgId: ${info.messageId})`);
  } catch (err) {
    console.error(`[EMAIL] Failed "${subject}" → ${to}:`, err.message);
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export async function sendUserInvite({ email, username, password, role }) {
  const html = baseTemplate(`
    ${heading("Welcome to " + COMPANY + "! 🎉")}
    ${para("Your account has been created. Here are your login credentials:")}
    ${infoTable([
    ["Username", username],
    ["Email", email],
    ["Password", `<code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-family:monospace;">${password}</code>`],
    ["Role", badge(role, "purple")],
  ])}
    ${para("Please log in and change your password immediately for security.")}
    ${btn("Log In Now", `${APP_URL}/login`)}
    ${divider()}
    ${para('<strong>⚠️ Important:</strong> Do not share your credentials. If you did not expect this email, please contact your HR administrator.')}
  `);
  await sendEmail({ to: email, subject: `Welcome to ${COMPANY} — Your Account is Ready`, html });
}

export async function sendEmployeeWelcome({ email, firstName, lastName, employeeCode, designation, department, dateOfJoining }) {
  const html = baseTemplate(`
    ${heading(`Welcome aboard, ${firstName}! 👋`)}
    ${para(`We're excited to have you join the ${COMPANY} family. Your employee profile has been set up.`)}
    ${infoTable([
    ["Employee Code", employeeCode],
    ["Name", `${firstName} ${lastName}`],
    ["Designation", designation || "—"],
    ["Department", department || "—"],
    ["Date of Joining", dateOfJoining ? new Date(dateOfJoining).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"],
  ])}
    ${para("You can now access your employee portal to view attendance, apply for leaves, and more.")}
    ${btn("Open Employee Portal", APP_URL)}
  `);
  await sendEmail({ to: email, subject: `Welcome to ${COMPANY} — Employee Onboarding`, html });
}

export async function sendLeaveApproved({ email, firstName, leaveType, startDate, endDate, totalDays, approverName }) {
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const html = baseTemplate(`
    ${badge("Leave Approved", "green")}
    ${heading("Your Leave Has Been Approved ✅")}
    ${para(`Hi ${firstName}, your leave request has been approved.`)}
    ${infoTable([
    ["Leave Type", leaveType],
    ["From", fmt(startDate)],
    ["To", fmt(endDate)],
    ["Total Days", `${totalDays} day(s)`],
    ["Approved By", approverName || "Management"],
  ])}
    ${para("Have a restful time off. Remember to hand over any pending work before your leave.")}
    ${btn("View My Leaves", `${APP_URL}/leaves`)}
  `);
  await sendEmail({ to: email, subject: `Leave Approved — ${totalDays} day(s) from ${fmt(startDate)}`, html });
}

export async function sendLeaveRejected({ email, firstName, leaveType, startDate, endDate, totalDays, reason, approverName }) {
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const html = baseTemplate(`
    ${badge("Leave Rejected", "red")}
    ${heading("Leave Request Not Approved")}
    ${para(`Hi ${firstName}, unfortunately your leave request could not be approved.`)}
    ${infoTable([
    ["Leave Type", leaveType],
    ["From", fmt(startDate)],
    ["To", fmt(endDate)],
    ["Total Days", `${totalDays} day(s)`],
    ["Rejected By", approverName || "Management"],
    ["Reason", reason],
  ])}
    ${para("If you have any questions, please speak to your manager or HR administrator.")}
    ${btn("View My Leaves", `${APP_URL}/leaves`)}
  `);
  await sendEmail({ to: email, subject: `Leave Request Rejected — ${leaveType}`, html });
}

export async function sendLeaveRequest({ email, managerName, employeeName, leaveType, startDate, endDate, totalDays, reason }) {
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const html = baseTemplate(`
    ${badge("Action Required", "amber")}
    ${heading("New Leave Request 📋")}
    ${para(`Hi ${managerName || "Manager"}, a new leave request requires your review.`)}
    ${infoTable([
    ["Employee", employeeName],
    ["Leave Type", leaveType],
    ["From", fmt(startDate)],
    ["To", fmt(endDate)],
    ["Total Days", `${totalDays} day(s)`],
    ["Reason", reason || "—"],
  ])}
    ${para("Please review and take action on this request.")}
    ${btn("Review in Portal", `${APP_URL}/approvals`)}
  `);
  await sendEmail({ to: email, subject: `Leave Request from ${employeeName} — ${totalDays} day(s)`, html });
}

export async function sendWfhApproved({ email, firstName, startDate, endDate, approverName }) {
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const html = baseTemplate(`
    ${badge("WFH Approved", "green")}
    ${heading("Work From Home Request Approved ✅")}
    ${para(`Hi ${firstName}, your WFH request has been approved.`)}
    ${infoTable([
    ["From", fmt(startDate)],
    ["To", fmt(endDate)],
    ["Approved By", approverName || "Management"],
  ])}
    ${para("Please ensure you are reachable during working hours and attend all scheduled meetings.")}
    ${btn("View WFH Requests", `${APP_URL}/wfh`)}
  `);
  await sendEmail({ to: email, subject: `WFH Approved — ${fmt(startDate)} to ${fmt(endDate)}`, html });
}

export async function sendWfhRejected({ email, firstName, startDate, endDate, reason, approverName }) {
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const html = baseTemplate(`
    ${badge("WFH Rejected", "red")}
    ${heading("WFH Request Not Approved")}
    ${para(`Hi ${firstName}, your WFH request could not be approved.`)}
    ${infoTable([
    ["From", fmt(startDate)],
    ["To", fmt(endDate)],
    ["Rejected By", approverName || "Management"],
    ["Reason", reason],
  ])}
    ${para("Please report to office as scheduled. Reach out to your manager if you need to discuss this.")}
    ${btn("View WFH Requests", `${APP_URL}/wfh`)}
  `);
  await sendEmail({ to: email, subject: `WFH Request Rejected`, html });
}

export async function sendReimbursementApproved({ email, firstName, title, totalAmount, approverName }) {
  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const html = baseTemplate(`
    ${badge("Reimbursement Approved", "green")}
    ${heading("Reimbursement Claim Approved ✅")}
    ${para(`Hi ${firstName}, your reimbursement claim has been approved.`)}
    ${infoTable([
    ["Claim Title", title],
    ["Amount", `<strong style="color:#059669">${fmt(totalAmount)}</strong>`],
    ["Approved By", approverName || "Management"],
  ])}
    ${para("The amount will be processed in the next payroll cycle or as per your company's reimbursement policy.")}
    ${btn("View Claims", `${APP_URL}/reimbursements`)}
  `);
  await sendEmail({ to: email, subject: `Reimbursement Approved — ${title}`, html });
}

export async function sendReimbursementRejected({ email, firstName, title, totalAmount, reason, approverName }) {
  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const html = baseTemplate(`
    ${badge("Reimbursement Rejected", "red")}
    ${heading("Reimbursement Claim Rejected")}
    ${para(`Hi ${firstName}, your reimbursement claim could not be approved.`)}
    ${infoTable([
    ["Claim Title", title],
    ["Amount", fmt(totalAmount)],
    ["Rejected By", approverName || "Management"],
    ["Reason", reason],
  ])}
    ${para("If you believe this decision is incorrect, please contact your HR administrator.")}
    ${btn("View Claims", `${APP_URL}/reimbursements`)}
  `);
  await sendEmail({ to: email, subject: `Reimbursement Rejected — ${title}`, html });
}

export async function sendPayslipReady({ email, firstName, month, year, grossSalary, netSalary }) {
  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const html = baseTemplate(`
    ${badge("Payslip Ready", "blue")}
    ${heading(`Your Payslip for ${MONTHS[month - 1]} ${year} is Ready 💰`)}
    ${para(`Hi ${firstName}, your payslip has been generated.`)}
    ${infoTable([
    ["Pay Period", `${MONTHS[month - 1]} ${year}`],
    ["Gross Salary", `<strong>${fmt(grossSalary)}</strong>`],
    ["Net Salary", `<strong style="color:#059669">${fmt(netSalary)}</strong>`],
  ])}
    ${para("Log in to the portal to view and download your complete payslip.")}
    ${btn("View Payslip", `${APP_URL}/payroll`)}
  `);
  await sendEmail({ to: email, subject: `Payslip Ready — ${MONTHS[month - 1]} ${year}`, html });
}

export async function sendRegularizationApproved({ email, firstName, date, approverName }) {
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const html = baseTemplate(`
    ${badge("Regularization Approved", "green")}
    ${heading("Attendance Regularization Approved ✅")}
    ${para(`Hi ${firstName}, your attendance regularization request has been approved.`)}
    ${infoTable([
    ["Date", fmt(date)],
    ["Approved By", approverName || "Management"],
  ])}
    ${para("Your attendance record has been updated accordingly.")}
    ${btn("View Attendance", `${APP_URL}/attendance`)}
  `);
  await sendEmail({ to: email, subject: `Attendance Regularization Approved — ${fmt(date)}`, html });
}

export async function sendRegularizationRejected({ email, firstName, date, reason, approverName }) {
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const html = baseTemplate(`
    ${badge("Regularization Rejected", "red")}
    ${heading("Attendance Regularization Rejected")}
    ${para(`Hi ${firstName}, your attendance regularization request could not be approved.`)}
    ${infoTable([
    ["Date", fmt(date)],
    ["Rejected By", approverName || "Management"],
    ["Reason", reason],
  ])}
    ${para("Contact HR if you have concerns about your attendance records.")}
    ${btn("View Attendance", `${APP_URL}/attendance`)}
  `);
  await sendEmail({ to: email, subject: `Attendance Regularization Rejected`, html });
}

export async function sendPasswordReset({ email, username, newPassword }) {
  const html = baseTemplate(`
    ${badge("Password Reset", "amber")}
    ${heading("Your Password Has Been Reset 🔑")}
    ${para(`Hi ${username}, your account password has been reset by an administrator.`)}
    ${infoTable([
    ["Email", email],
    ["New Password", `<code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-family:monospace;">${newPassword}</code>`],
  ])}
    ${para("Please log in and change your password immediately.")}
    ${btn("Log In Now", `${APP_URL}/login`)}
    ${divider()}
    ${para("If you did not request this reset, contact your HR administrator immediately.")}
  `);
  await sendEmail({ to: email, subject: `Password Reset — ${COMPANY}`, html });
}
