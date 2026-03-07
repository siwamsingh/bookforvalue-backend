import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import prisma from "../config/db";


/**
 * CREATE CATEGORY
 * Flat structure (no parent/child)
 * Only admin & super_admin allowed via middleware
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { category_name } = req.body;

    if (!category_name || category_name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await prisma.category.create({
      data: {
        category_name: category_name.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error: any) {
    console.error("Create Category Error:", error);

    // Prisma unique constraint error
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};
    
/**
 * DELETE CATEGORY
 * Flat delete (no recursion)
 * Also removes product-category relations
 * Only admin & super_admin allowed via middleware
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const categoryId = Number(id);

    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Remove product-category relations first
    await prisma.productCategory.deleteMany({
      where: { category_id: categoryId },
    });

    // Delete category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};

/**
 * GET ALL CATEGORIES (PUBLIC)
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { category_name: "asc" },
    });

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};