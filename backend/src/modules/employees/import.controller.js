import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

const COLUMN_MAP = {
  firstname: "firstName", first_name: "firstName", "first name": "firstName", name: "firstName",
  lastname: "lastName", last_name: "lastName", "last name": "lastName", surname: "lastName",
  email: "email", "email id": "email", "email address": "email",
  phone: "phone", mobile: "phone", "phone number": "phone", "mobile number": "phone",
  department: "department", dept: "department",
  designation: "designation", role: "designation", title: "designation", "job title": "designation",
  dateofjoining: "dateOfJoining", doj: "dateOfJoining", "date of joining": "dateOfJoining", "joining date": "dateOfJoining",
  salary: "basicSalary", "basic salary": "basicSalary", ctc: "ctc", "gross salary": "grossSalary",
  gender: "gender",
  employeecode: "employeeCode", "employee code": "employeeCode", "emp code": "employeeCode", empcode: "employeeCode",
};

const normalizeKey = (k) => String(k).toLowerCase().trim().replace(/[\s_]+/g, " ");

export const previewImport = async (req, res) => {
  try {
    if (!req.file) return R.badRequest(res, "No file uploaded");

    const wb = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { raw: false, defval: "" });

    if (!raw.length) return R.badRequest(res, "Sheet is empty");

    const headers = Object.keys(raw[0]);
    const mapped = {};
    const unmapped = [];

    for (const h of headers) {
      const norm = normalizeKey(h);
      if (COLUMN_MAP[norm]) {
        mapped[h] = COLUMN_MAP[norm];
      } else {
        unmapped.push(h);
      }
    }

    const preview = raw.slice(0, 5).map((row) => {
      const result = {};
      for (const [orig, field] of Object.entries(mapped)) {
        result[field] = row[orig];
      }
      return result;
    });

    return R.success(res, { headers, mapped, unmapped, preview, totalRows: raw.length });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const executeImport = async (req, res) => {
  try {
    if (!req.file) return R.badRequest(res, "No file uploaded");

    const { columnMapping } = req.body;
    const mapping = typeof columnMapping === "string" ? JSON.parse(columnMapping) : columnMapping;

    const wb = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { raw: false, defval: "" });

    const orgId = req.organisationId;

    const existingDepts = await prisma.department.findMany({ where: orgId ? { organisationId: orgId } : {} });
    const existingDesigs = await prisma.designation.findMany({ where: orgId ? { organisationId: orgId } : {} });

    const deptCache = {};
    for (const d of existingDepts) deptCache[d.name.toLowerCase()] = d.id;
    const desigCache = {};
    for (const d of existingDesigs) desigCache[d.name.toLowerCase()] = d.id;

    const lastEmp = await prisma.employee.findFirst({
      where: orgId ? { organisationId: orgId } : {},
      orderBy: { createdAt: "desc" },
    });
    let counter = lastEmp ? parseInt(lastEmp.employeeCode.replace(/\D/g, "")) + 1 : 1;

    const results = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      try {
        const mapped = {};
        for (const [colName, fieldName] of Object.entries(mapping)) {
          mapped[fieldName] = row[colName];
        }

        const firstName = mapped.firstName?.toString().trim();
        if (!firstName) { results.errors.push(`Row ${i + 2}: First name is required`); results.skipped++; continue; }

        const email = mapped.email?.toString().trim().toLowerCase();

        if (email) {
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (existingUser) { results.skipped++; results.errors.push(`Row ${i + 2}: ${email} already exists`); continue; }
        }

        let departmentId = null;
        if (mapped.department) {
          const deptKey = mapped.department.toString().toLowerCase().trim();
          if (deptCache[deptKey]) {
            departmentId = deptCache[deptKey];
          } else {
            const newDept = await prisma.department.create({
              data: { name: mapped.department.toString().trim(), code: mapped.department.toString().toUpperCase().substring(0, 6).replace(/\s/g, ""), organisationId: orgId || undefined },
            });
            deptCache[deptKey] = newDept.id;
            departmentId = newDept.id;
          }
        }

        let designationId = null;
        if (mapped.designation) {
          const desigKey = mapped.designation.toString().toLowerCase().trim();
          if (desigCache[desigKey]) {
            designationId = desigCache[desigKey];
          } else {
            const newDesig = await prisma.designation.create({
              data: { name: mapped.designation.toString().trim(), organisationId: orgId || undefined },
            });
            desigCache[desigKey] = newDesig.id;
            designationId = newDesig.id;
          }
        }

        const empCode = mapped.employeeCode?.toString().trim() || `EMP${String(counter).padStart(3, "0")}`;
        counter++;

        const username = email ? email.split("@")[0] + "_" + Date.now() : `emp_${empCode}_${Date.now()}`;
        const tempPassword = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: { username, email: email || username + "@import.local", passwordHash, role: "EMPLOYEE", organisationId: orgId || undefined },
          });
          await tx.employee.create({
            data: {
              userId: user.id,
              organisationId: orgId || undefined,
              employeeCode: empCode,
              firstName,
              lastName: mapped.lastName?.toString().trim() || null,
              email: email || null,
              phone: mapped.phone?.toString().trim() || null,
              departmentId,
              designationId,
              gender: ["MALE", "FEMALE", "OTHER"].includes(mapped.gender?.toString().toUpperCase()) ? mapped.gender.toUpperCase() : null,
              dateOfJoining: mapped.dateOfJoining ? new Date(mapped.dateOfJoining) : null,
              employmentStatus: "ACTIVE",
            },
          });
        });

        results.created++;
      } catch (rowErr) {
        results.errors.push(`Row ${i + 2}: ${rowErr.message}`);
        results.skipped++;
      }
    }

    return R.success(res, results, `Import complete: ${results.created} created, ${results.skipped} skipped`);
  } catch (err) {
    return R.error(res, err.message);
  }
};
