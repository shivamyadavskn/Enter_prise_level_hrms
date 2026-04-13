import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

const reviewInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
  reviewer: { select: { id: true, firstName: true, lastName: true } },
};

export const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, reviewType, status, year } = req.query;
    const where = {};

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.notFound(res, "Employee not found");
      where.employeeId = emp.id;
    } else if (req.user.role === "MANAGER") {
      const mgr = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (mgr) {
        const teamIds = (await prisma.employee.findMany({ where: { managerId: mgr.id }, select: { id: true } })).map((e) => e.id);
        where.OR = [{ employeeId: { in: teamIds } }, { reviewerId: mgr.id }];
      }
      if (employeeId) where.employeeId = Number(employeeId);
    } else {
      if (employeeId) where.employeeId = Number(employeeId);
    }

    if (reviewType) where.reviewType = reviewType;
    if (status) where.status = status;
    if (year) where.reviewPeriodStart = { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) };

    const [reviews, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.performanceReview.count({ where }),
    ]);

    return R.paginated(res, reviews, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getReviewById = async (req, res) => {
  try {
    const review = await prisma.performanceReview.findUnique({
      where: { id: Number(req.params.id) },
      include: reviewInclude,
    });
    if (!review) return R.notFound(res, "Review not found");
    return R.success(res, review);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createReview = async (req, res) => {
  try {
    const { employeeId, reviewPeriodStart, reviewPeriodEnd, reviewType, reviewDate } = req.body;

    const reviewer = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!reviewer) return R.notFound(res, "Reviewer profile not found");

    const review = await prisma.performanceReview.create({
      data: {
        employeeId,
        reviewerId: reviewer.id,
        reviewPeriodStart: new Date(reviewPeriodStart),
        reviewPeriodEnd: new Date(reviewPeriodEnd),
        reviewType,
        reviewDate: reviewDate ? new Date(reviewDate) : undefined,
        status: "PENDING",
      },
      include: reviewInclude,
    });

    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, include: { user: true } });
    if (emp?.user) {
      await prisma.notification.create({
        data: {
          userId: emp.user.id,
          notificationType: "PERFORMANCE_REVIEW",
          title: "Performance Review Scheduled",
          message: `Your ${reviewType.toLowerCase()} performance review has been scheduled`,
        },
      });
    }

    return R.created(res, review, "Performance review created");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const submitSelfAppraisal = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const review = await prisma.performanceReview.findUnique({ where: { id } });
    if (!review) return R.notFound(res, "Review not found");
    if (!emp || review.employeeId !== emp.id) return R.forbidden(res, "Access denied");
    if (review.selfRating) return R.badRequest(res, "Self appraisal already submitted");

    const updated = await prisma.performanceReview.update({
      where: { id },
      data: req.body,
      include: reviewInclude,
    });

    const reviewer = await prisma.employee.findUnique({ where: { id: review.reviewerId }, include: { user: true } });
    if (reviewer?.user) {
      await prisma.notification.create({
        data: {
          userId: reviewer.user.id,
          notificationType: "SELF_APPRAISAL_SUBMITTED",
          title: "Self Appraisal Submitted",
          message: `${emp.firstName} ${emp.lastName} has submitted their self appraisal`,
        },
      });
    }

    return R.success(res, updated, "Self appraisal submitted");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const submitManagerAppraisal = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const reviewer = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const review = await prisma.performanceReview.findUnique({ where: { id }, include: { employee: { include: { user: true } } } });
    if (!review) return R.notFound(res, "Review not found");
    if (!reviewer || review.reviewerId !== reviewer.id) return R.forbidden(res, "Access denied");

    const updated = await prisma.performanceReview.update({
      where: { id },
      data: { ...req.body, status: req.body.status || "COMPLETED" },
      include: reviewInclude,
    });

    await prisma.notification.create({
      data: {
        userId: review.employee.userId,
        notificationType: "REVIEW_COMPLETED",
        title: "Performance Review Completed",
        message: "Your manager has completed the performance review. Please acknowledge.",
      },
    });

    return R.success(res, updated, "Manager appraisal submitted");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const acknowledgeReview = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const review = await prisma.performanceReview.findUnique({ where: { id } });
    if (!review) return R.notFound(res, "Review not found");
    if (!emp || review.employeeId !== emp.id) return R.forbidden(res, "Access denied");
    if (review.status !== "COMPLETED") return R.badRequest(res, "Review is not completed yet");

    const updated = await prisma.performanceReview.update({
      where: { id },
      data: { status: "ACKNOWLEDGED" },
      include: reviewInclude,
    });

    return R.success(res, updated, "Review acknowledged");
  } catch (err) {
    return R.error(res, err.message);
  }
};
