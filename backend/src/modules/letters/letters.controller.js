import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

// ── Available Template Variables ──────────────────────────────────────────────

const TEMPLATE_VARIABLES = {
  employee_name: "Full name",
  employee_first_name: "First name",
  employee_last_name: "Last name",
  employee_code: "Employee code",
  employee_email: "Email",
  employee_phone: "Phone",
  employee_designation: "Designation",
  employee_department: "Department",
  date_of_joining: "Date of joining",
  date_of_leaving: "Last working date",
  current_date: "Current date",
  gross_salary: "Monthly gross salary",
  net_salary: "Monthly net salary",
  ctc: "Annual CTC",
  basic_salary: "Basic salary",
  hra: "HRA",
  company_name: "Organisation name",
  company_address: "Organisation address",
  company_email: "Organisation email",
  notice_period: "Notice period (days)",
  experience_years: "Total experience (years)",
  letter_number: "Auto-generated letter number",
};

// ── Default Templates ─────────────────────────────────────────────────────────

const DEFAULT_TEMPLATES = [
  {
    name: "Offer Letter",
    category: "OFFER",
    subject: "Offer of Employment — {{employee_designation}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px">
<div style="text-align:center;margin-bottom:30px">
<h2 style="margin:0;color:#1e40af">{{company_name}}</h2>
<p style="color:#6b7280;margin:4px 0">{{company_address}}</p>
</div>
<p style="text-align:right;color:#6b7280">Date: {{current_date}}</p>
<p style="text-align:right;color:#6b7280">Ref: {{letter_number}}</p>
<p>Dear <strong>{{employee_name}}</strong>,</p>
<p>We are pleased to offer you the position of <strong>{{employee_designation}}</strong> in the <strong>{{employee_department}}</strong> department at {{company_name}}.</p>
<h3 style="color:#1e40af;border-bottom:1px solid #e5e7eb;padding-bottom:8px">Compensation Details</h3>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #e5e7eb">Annual CTC</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">₹{{ctc}}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">Monthly Gross</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">₹{{gross_salary}}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">Monthly Net (Take-home)</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">₹{{net_salary}}</td></tr>
</table>
<p>Your expected date of joining is <strong>{{date_of_joining}}</strong>.</p>
<p>Please sign and return this letter to confirm your acceptance.</p>
<br/>
<p>Warm regards,</p>
<p><strong>HR Department</strong><br/>{{company_name}}</p>
</div>`,
  },
  {
    name: "Appointment Letter",
    category: "APPOINTMENT",
    subject: "Appointment Letter — {{employee_name}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px">
<div style="text-align:center;margin-bottom:30px">
<h2 style="margin:0;color:#1e40af">{{company_name}}</h2>
<p style="color:#6b7280;margin:4px 0">{{company_address}}</p>
</div>
<p style="text-align:right;color:#6b7280">Date: {{current_date}}</p>
<p style="text-align:right;color:#6b7280">Ref: {{letter_number}}</p>
<p>Dear <strong>{{employee_name}}</strong>,</p>
<p>With reference to your application and subsequent discussions, we are pleased to appoint you as <strong>{{employee_designation}}</strong> in our <strong>{{employee_department}}</strong> department, effective from <strong>{{date_of_joining}}</strong>.</p>
<h3 style="color:#1e40af;border-bottom:1px solid #e5e7eb;padding-bottom:8px">Terms of Appointment</h3>
<ul>
<li>Employee Code: <strong>{{employee_code}}</strong></li>
<li>Designation: <strong>{{employee_designation}}</strong></li>
<li>Department: <strong>{{employee_department}}</strong></li>
<li>Annual CTC: <strong>₹{{ctc}}</strong></li>
<li>Notice Period: <strong>{{notice_period}} days</strong></li>
</ul>
<p>You are required to maintain confidentiality of all company information and adhere to the company policies.</p>
<br/>
<p>For <strong>{{company_name}}</strong></p>
<p>Authorized Signatory</p>
</div>`,
  },
  {
    name: "Experience Letter",
    category: "EXPERIENCE",
    subject: "Experience Certificate — {{employee_name}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px">
<div style="text-align:center;margin-bottom:30px">
<h2 style="margin:0;color:#1e40af">{{company_name}}</h2>
<p style="color:#6b7280;margin:4px 0">{{company_address}}</p>
</div>
<p style="text-align:right;color:#6b7280">Date: {{current_date}}</p>
<p style="text-align:right;color:#6b7280">Ref: {{letter_number}}</p>
<h2 style="text-align:center;color:#1e40af">TO WHOM IT MAY CONCERN</h2>
<p>This is to certify that <strong>{{employee_name}}</strong> (Employee Code: {{employee_code}}) was employed with <strong>{{company_name}}</strong> from <strong>{{date_of_joining}}</strong> to <strong>{{date_of_leaving}}</strong> as <strong>{{employee_designation}}</strong> in the <strong>{{employee_department}}</strong> department.</p>
<p>During their tenure of <strong>{{experience_years}} years</strong>, they demonstrated excellent professional skills and conduct. We found them to be sincere, hardworking and result-oriented.</p>
<p>We wish them all the best for their future endeavors.</p>
<br/>
<p>For <strong>{{company_name}}</strong></p>
<p>Authorized Signatory</p>
</div>`,
  },
  {
    name: "Relieving Letter",
    category: "RELIEVING",
    subject: "Relieving Letter — {{employee_name}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px">
<div style="text-align:center;margin-bottom:30px">
<h2 style="margin:0;color:#1e40af">{{company_name}}</h2>
<p style="color:#6b7280;margin:4px 0">{{company_address}}</p>
</div>
<p style="text-align:right;color:#6b7280">Date: {{current_date}}</p>
<p style="text-align:right;color:#6b7280">Ref: {{letter_number}}</p>
<p>Dear <strong>{{employee_name}}</strong>,</p>
<p>This is to inform you that you have been relieved from your duties at <strong>{{company_name}}</strong> effective <strong>{{date_of_leaving}}</strong>.</p>
<p>You were working with us as <strong>{{employee_designation}}</strong> in the <strong>{{employee_department}}</strong> department since <strong>{{date_of_joining}}</strong>.</p>
<p>All dues have been settled as per company policy. You are requested to maintain confidentiality of all proprietary information.</p>
<p>We wish you success in your future career.</p>
<br/>
<p>For <strong>{{company_name}}</strong></p>
<p>Authorized Signatory</p>
</div>`,
  },
  {
    name: "Salary Revision Letter",
    category: "SALARY_REVISION",
    subject: "Salary Revision — {{employee_name}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px">
<div style="text-align:center;margin-bottom:30px">
<h2 style="margin:0;color:#1e40af">{{company_name}}</h2>
<p style="color:#6b7280;margin:4px 0">{{company_address}}</p>
</div>
<p style="text-align:right;color:#6b7280">Date: {{current_date}}</p>
<p style="text-align:right;color:#6b7280">Ref: {{letter_number}}</p>
<p>Dear <strong>{{employee_name}}</strong>,</p>
<p>We are pleased to inform you that based on your performance review, your compensation has been revised as follows, effective immediately:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr style="background:#f9fafb"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">Component</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">Monthly Amount</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">Basic Salary</td><td style="padding:8px;border:1px solid #e5e7eb">₹{{basic_salary}}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">HRA</td><td style="padding:8px;border:1px solid #e5e7eb">₹{{hra}}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">Gross Salary</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">₹{{gross_salary}}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">Net Salary</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;color:#059669">₹{{net_salary}}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">Annual CTC</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold">₹{{ctc}}</td></tr>
</table>
<p>Congratulations on this achievement. We look forward to your continued contributions.</p>
<br/>
<p>For <strong>{{company_name}}</strong></p>
<p>HR Department</p>
</div>`,
  },
];

// ── Helper: Resolve variables for an employee ────────────────────────────────

async function resolveVariables(employeeId, letterNum) {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      department: { select: { name: true } },
      designation: { select: { name: true } },
      organisation: { select: { name: true, address: true, email: true } },
      salaryStructures: { where: { isActive: true }, take: 1 },
    },
  });
  if (!emp) return null;

  const sal = emp.salaryStructures?.[0];
  const joiningDate = emp.dateOfJoining ? new Date(emp.dateOfJoining) : null;
  const leavingDate = emp.dateOfLeaving ? new Date(emp.dateOfLeaving) : null;
  const expYears = joiningDate ? ((leavingDate || new Date()) - joiningDate) / (365.25 * 86400000) : 0;

  const fmt = (d) => d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";
  const fmtNum = (n) => n ? Number(n).toLocaleString("en-IN") : "0";

  return {
    employee_name: `${emp.firstName} ${emp.lastName || ""}`.trim(),
    employee_first_name: emp.firstName,
    employee_last_name: emp.lastName || "",
    employee_code: emp.employeeCode,
    employee_email: emp.email || "",
    employee_phone: emp.phone || "",
    employee_designation: emp.designation?.name || "N/A",
    employee_department: emp.department?.name || "N/A",
    date_of_joining: fmt(joiningDate),
    date_of_leaving: fmt(leavingDate),
    current_date: fmt(new Date()),
    gross_salary: fmtNum(sal?.grossSalary),
    net_salary: fmtNum(sal?.netSalary),
    ctc: fmtNum(sal?.ctc),
    basic_salary: fmtNum(sal?.basicSalary),
    hra: fmtNum(sal?.hra),
    company_name: emp.organisation?.name || "Company",
    company_address: emp.organisation?.address || "",
    company_email: emp.organisation?.email || "",
    notice_period: "30",
    experience_years: expYears.toFixed(1),
    letter_number: letterNum || "",
  };
}

function fillTemplate(body, vars) {
  let result = body;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

async function generateLetterNumber(category, orgId) {
  const count = await prisma.generatedLetter.count({ where: { category } });
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
}

// ── CRUD: Templates ──────────────────────────────────────────────────────────

export const getTemplates = async (req, res) => {
  try {
    const where = { isActive: true };
    if (req.organisationId) where.organisationId = req.organisationId;
    const templates = await prisma.letterTemplate.findMany({ where, orderBy: { createdAt: "desc" } });
    return R.success(res, templates);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const t = await prisma.letterTemplate.findUnique({ where: { id: Number(req.params.id) } });
    if (!t) return R.notFound(res, "Template not found");
    return R.success(res, t);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createTemplate = async (req, res) => {
  try {
    const { name, category, subject, body } = req.body;
    const t = await prisma.letterTemplate.create({
      data: {
        name, category, subject, body,
        variables: Object.keys(TEMPLATE_VARIABLES),
        organisationId: req.organisationId || null,
        createdBy: req.user.id,
      },
    });
    return R.created(res, t, "Template created");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { name, category, subject, body } = req.body;
    const t = await prisma.letterTemplate.update({
      where: { id: Number(req.params.id) },
      data: { name, category, subject, body },
    });
    return R.success(res, t, "Template updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    await prisma.letterTemplate.update({ where: { id: Number(req.params.id) }, data: { isActive: false } });
    return R.success(res, null, "Template deleted");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Seed Default Templates ───────────────────────────────────────────────────

export const seedDefaultTemplates = async (req, res) => {
  try {
    const orgId = req.organisationId || null;
    const existing = await prisma.letterTemplate.count({ where: { organisationId: orgId, isDefault: true } });
    if (existing > 0) return R.success(res, null, "Default templates already exist");

    const templates = await Promise.all(
      DEFAULT_TEMPLATES.map((t) =>
        prisma.letterTemplate.create({
          data: {
            ...t,
            variables: Object.keys(TEMPLATE_VARIABLES),
            isDefault: true,
            organisationId: orgId,
            createdBy: req.user.id,
          },
        })
      )
    );
    return R.created(res, templates, `${templates.length} default templates created`);
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Get Available Variables ──────────────────────────────────────────────────

export const getVariables = async (req, res) => {
  return R.success(res, TEMPLATE_VARIABLES);
};

// ── Preview Letter (dry-run) ─────────────────────────────────────────────────

export const previewLetter = async (req, res) => {
  try {
    const { templateId, employeeId } = req.body;
    const template = await prisma.letterTemplate.findUnique({ where: { id: templateId } });
    if (!template) return R.notFound(res, "Template not found");

    const vars = await resolveVariables(employeeId, "PREVIEW-XXXX");
    if (!vars) return R.notFound(res, "Employee not found");

    const body = fillTemplate(template.body, vars);
    const subject = fillTemplate(template.subject || "", vars);

    return R.success(res, { subject, body, variables: vars });
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Generate Letter (persist) ────────────────────────────────────────────────

export const generateLetter = async (req, res) => {
  try {
    const { templateId, employeeId } = req.body;
    const template = await prisma.letterTemplate.findUnique({ where: { id: templateId } });
    if (!template) return R.notFound(res, "Template not found");

    const letterNum = await generateLetterNumber(template.category, req.organisationId);
    const vars = await resolveVariables(employeeId, letterNum);
    if (!vars) return R.notFound(res, "Employee not found");

    const body = fillTemplate(template.body, vars);
    const subject = fillTemplate(template.subject || "", vars);

    const letter = await prisma.generatedLetter.create({
      data: {
        templateId,
        employeeId,
        letterNumber: letterNum,
        category: template.category,
        subject,
        body,
        metadata: vars,
        generatedBy: req.user.id,
      },
    });

    return R.created(res, letter, "Letter generated successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Bulk Generate Letters ────────────────────────────────────────────────────

export const bulkGenerateLetters = async (req, res) => {
  try {
    const { templateId, employeeIds } = req.body;
    const template = await prisma.letterTemplate.findUnique({ where: { id: templateId } });
    if (!template) return R.notFound(res, "Template not found");

    const letters = [];
    for (const empId of employeeIds) {
      const letterNum = await generateLetterNumber(template.category, req.organisationId);
      const vars = await resolveVariables(empId, letterNum);
      if (!vars) continue;

      const body = fillTemplate(template.body, vars);
      const subject = fillTemplate(template.subject || "", vars);

      const letter = await prisma.generatedLetter.create({
        data: {
          templateId, employeeId: empId, letterNumber: letterNum,
          category: template.category, subject, body,
          metadata: vars, generatedBy: req.user.id,
        },
      });
      letters.push(letter);
    }

    return R.created(res, letters, `${letters.length} letter(s) generated`);
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Get Generated Letters ────────────────────────────────────────────────────

export const getGeneratedLetters = async (req, res) => {
  try {
    const { employeeId, category, page = 1, limit = 20 } = req.query;
    const where = {};
    if (employeeId) where.employeeId = Number(employeeId);
    if (category) where.category = category;

    const [letters, total] = await Promise.all([
      prisma.generatedLetter.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
          template: { select: { name: true, category: true } },
        },
        orderBy: { generatedAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.generatedLetter.count({ where }),
    ]);

    return R.paginated(res, letters, total, Number(page), Number(limit));
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getLetterById = async (req, res) => {
  try {
    const letter = await prisma.generatedLetter.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
        template: { select: { name: true, category: true } },
      },
    });
    if (!letter) return R.notFound(res, "Letter not found");
    return R.success(res, letter);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteLetter = async (req, res) => {
  try {
    await prisma.generatedLetter.delete({ where: { id: Number(req.params.id) } });
    return R.success(res, null, "Letter deleted");
  } catch (err) {
    return R.error(res, err.message);
  }
};
