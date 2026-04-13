import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

export const getHolidays = async (req, res) => {
  try {
    const { year, type } = req.query;
    const where = { isActive: true };
    if (type) where.type = type;
    if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year), 11, 31, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }
    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });
    return R.success(res, holidays);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { name, date, type } = req.body;
    const holiday = await prisma.holiday.create({
      data: { name, date: new Date(date), type },
    });
    return R.created(res, holiday, "Holiday created");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateHoliday = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, date, type } = req.body;
    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(date && { date: new Date(date) }),
        ...(type && { type }),
      },
    });
    return R.success(res, holiday, "Holiday updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.holiday.update({ where: { id }, data: { isActive: false } });
    return R.success(res, null, "Holiday deleted");
  } catch (err) {
    return R.error(res, err.message);
  }
};
