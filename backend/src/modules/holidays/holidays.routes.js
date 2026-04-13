import { Router } from "express";
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from "./holidays.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { createHolidaySchema, updateHolidaySchema, holidayQuerySchema } from "./holidays.schema.js";

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(holidayQuerySchema), getHolidays);
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), validate(createHolidaySchema), createHoliday);
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN"), validate(updateHolidaySchema), updateHoliday);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), deleteHoliday);

export default router;
