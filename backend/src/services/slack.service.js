/**
 * Slack webhook notifier — fully optional.
 *
 * Reads `SLACK_WEBHOOK_URL` from env. If unset, every call is a silent no-op
 * so wiring it into business code never blocks the request.
 *
 * The webhook URL is created by the customer's Slack admin (free):
 *   https://api.slack.com/messaging/webhooks
 *
 * No npm dependency — uses the built-in global fetch (Node ≥ 18).
 */

const url = () => process.env.SLACK_WEBHOOK_URL || "";

/** Returns true when a webhook URL is configured. */
export const slackEnabled = () => Boolean(url());

/**
 * Fire-and-forget message. Never throws — failures are logged so they
 * never break the user-facing request flow.
 *
 * @param {string|object} payload  Either a string (plain text) or a Slack
 *   Block Kit / message-attachments payload.
 */
export async function sendSlack(payload) {
  const webhook = url();
  if (!webhook) return; // silent no-op

  const body = typeof payload === "string" ? { text: payload } : payload;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[slack] webhook returned ${res.status}`);
    }
  } catch (err) {
    console.warn("[slack] webhook send failed:", err.message);
  }
}

/** Common helpers — opinionated formatting for typical HRMS events. */
export const slack = {
  leaveApplied: (emp, leave) => sendSlack({
    text: `:palm_tree: *${emp.firstName} ${emp.lastName || ""}* applied for leave`,
    attachments: [{
      color: "#3b82f6",
      fields: [
        { title: "Type",   value: leave.leaveType?.name || `Type #${leave.leaveTypeId}`, short: true },
        { title: "Days",   value: String(leave.totalDays), short: true },
        { title: "From",   value: String(leave.startDate).slice(0, 10), short: true },
        { title: "To",     value: String(leave.endDate).slice(0, 10),   short: true },
        { title: "Reason", value: leave.reason || "—", short: false },
      ],
    }],
  }),

  leaveDecision: (emp, leave, decision) => sendSlack({
    text: `:${decision === "APPROVED" ? "white_check_mark" : "x"}: Leave for *${emp.firstName} ${emp.lastName || ""}* was *${decision.toLowerCase()}*`,
    attachments: [{
      color: decision === "APPROVED" ? "#10b981" : "#ef4444",
      text: `${String(leave.startDate).slice(0,10)} → ${String(leave.endDate).slice(0,10)} · ${leave.totalDays} day(s)`,
    }],
  }),

  payrollProcessed: (count, month, year, totalNet) => sendSlack({
    text: `:moneybag: Payroll for *${month}/${year}* processed`,
    attachments: [{
      color: "#10b981",
      fields: [
        { title: "Employees paid", value: String(count),   short: true },
        { title: "Total net",      value: `₹${Number(totalNet || 0).toLocaleString("en-IN")}`, short: true },
      ],
    }],
  }),

  newEmployee: (emp) => sendSlack({
    text: `:wave: Welcome *${emp.firstName} ${emp.lastName || ""}* (${emp.employeeCode}) — joined today!`,
  }),
};
