import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import bcrypt from "bcryptjs";
import { sendOrganisationWelcome } from "../../services/email.service.js";

export const registerOrganisation = async (req, res) => {
  try {
    const { orgName, industry, adminFirstName, adminLastName, adminEmail, password } = req.body;

    if (!orgName || !adminEmail || !password || !adminFirstName) {
      return R.badRequest(res, "orgName, adminFirstName, adminEmail, password are required");
    }

    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) return R.badRequest(res, "Email already registered");

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organisation.create({
        data: { name: orgName, slug, industry: industry || null },
      });

      const passwordHash = await bcrypt.hash(password, 10);
      const username = adminEmail.split("@")[0] + "_" + org.id;

      const user = await tx.user.create({
        data: {
          organisationId: org.id,
          username,
          email: adminEmail,
          passwordHash,
          role: "SUPER_ADMIN",
        },
      });

      const empCode = "EMP001";
      await tx.employee.create({
        data: {
          organisationId: org.id,
          userId: user.id,
          employeeCode: empCode,
          firstName: adminFirstName,
          lastName: adminLastName || null,
          email: adminEmail,
          employmentStatus: "ACTIVE",
        },
      });

      return { org, user };
    });

    sendOrganisationWelcome({
      email: adminEmail,
      firstName: adminFirstName,
      orgName: result.org.name,
      loginEmail: adminEmail,
    }).catch(() => {});

    return R.created(res, { organisationId: result.org.id, slug: result.org.slug, name: result.org.name }, "Organisation registered successfully. Please login.");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getOrganisation = async (req, res) => {
  try {
    const org = await prisma.organisation.findUnique({ where: { id: req.organisationId } });
    if (!org) return R.notFound(res, "Organisation not found");
    return R.success(res, org);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateOrganisation = async (req, res) => {
  try {
    const { name, industry, size, address, city, state, country, phone, email, website, financialYearStart, pfEnabled, esicEnabled } = req.body;
    const org = await prisma.organisation.update({
      where: { id: req.organisationId },
      data: { name, industry, size, address, city, state, country, phone, email, website, financialYearStart, pfEnabled, esicEnabled },
    });
    return R.success(res, org, "Organisation updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};
