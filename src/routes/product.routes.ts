import { Router } from "express";
import {
  addProduct,
  updateProduct,
  getProducts,
  getProductById,
  getProductBySlug,
} from "../controllers/product.controller";
import { verifyAuth } from "../middleware/auth.middleware";
import { allowRoles } from "../middleware/role.middleware";

const router = Router();

// PUBLIC
router.get("/", getProducts);

// get product by slug
router.get("/slug/:slug", getProductBySlug);

// ADMIN + SUPER ADMIN
router.post("/", verifyAuth, allowRoles("admin", "super_admin"), addProduct);

// ADMIN + SUPER ADMIN get product by id
router.get(
  "/id/:id",
  verifyAuth,
  allowRoles("admin", "super_admin"),
  getProductById,
);

// update product
router.put(
  "/:id",
  verifyAuth,
  allowRoles("admin", "super_admin"),
  updateProduct,
);

export default router;
