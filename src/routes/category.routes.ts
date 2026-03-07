import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
} from "../controllers/category.controller";
import { verifyAuth } from "../middleware/auth.middleware";
import { allowRoles } from "../middleware/role.middleware";

const router = Router();

// PUBLIC
router.get("/", getCategories);

// ADMIN + SUPER ADMIN
router.post(
  "/",
  verifyAuth,
  allowRoles("admin", "super_admin"),
  createCategory
);

router.delete(
  "/:id",
  verifyAuth,
  allowRoles("admin", "super_admin"),
  deleteCategory
);

export default router;