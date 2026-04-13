import path from "path";
import fs from "fs";
import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return R.badRequest(res, "No file uploaded");

    const { employeeId, documentType, documentName } = req.body;

    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== Number(employeeId)) return R.forbidden(res, "Cannot upload documents for other employees");
    }

    const doc = await prisma.document.create({
      data: {
        employeeId: Number(employeeId),
        documentType,
        documentName,
        filePath: req.file.path.replace(/\\/g, "/"),
        uploadedById: req.user.id,
      },
    });

    return R.created(res, doc, "Document uploaded successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, documentType } = req.query;
    const where = {};

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.notFound(res, "Employee not found");
      where.employeeId = emp.id;
    } else {
      if (employeeId) where.employeeId = Number(employeeId);
    }

    if (documentType) where.documentType = documentType;

    const [docs, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          uploadedBy: { select: { id: true, username: true } },
        },
        orderBy: { uploadedOn: "desc" },
      }),
      prisma.document.count({ where }),
    ]);

    return R.paginated(res, docs, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: Number(req.params.id) },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!doc) return R.notFound(res, "Document not found");

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp || emp.id !== doc.employeeId) return R.forbidden(res, "Access denied");
    }

    return R.success(res, doc);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: Number(req.params.id) } });
    if (!doc) return R.notFound(res, "Document not found");

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp || emp.id !== doc.employeeId) return R.forbidden(res, "Access denied");
    }

    if (!fs.existsSync(doc.filePath)) return R.notFound(res, "File not found on server");

    return res.download(path.resolve(doc.filePath), doc.documentName);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: Number(req.params.id) } });
    if (!doc) return R.notFound(res, "Document not found");

    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await prisma.document.delete({ where: { id: doc.id } });
    return R.success(res, null, "Document deleted successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};
