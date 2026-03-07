import { Request, Response } from "express";
import prisma from "../config/db";

/**
 * ➕ ADD PRODUCT
 */
export const addProduct = async (req: Request, res: Response) => {
  try {
    const {
      product_name,
      url_slug,
      description,
      mrp,
      price,
      stock_quantity,
      status,
      images = [],
      categories = [], // 🔥 category IDs array
    } = req.body;

    // Validate
    if (!product_name || !url_slug || !mrp || !price) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    // Ensure single default image
    const defaultImages = images.filter((img: any) => img.is_default);
    if (defaultImages.length > 1) {
      return res
        .status(400)
        .json({ message: "Only one default image is allowed." });
    }

    const product = await prisma.$transaction(async (tx) => {
      // 1️⃣ Create product
      const createdProduct = await tx.product.create({
        data: {
          product_name,
          url_slug,
          description,
          mrp: Number(mrp),
          price: Number(price),
          stock_quantity: Number(stock_quantity),
          status,
        },
      });

      // 2️⃣ Save images
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img: any) => ({
            product_id: createdProduct.id,
            image_url: img.image_url,
            is_default: img.is_default || false,
          })),
        });
      }

      // 3️⃣ Save categories 🔥
      if (categories.length > 0) {
        await tx.productCategory.createMany({
          data: categories.map((catId: number) => ({
            product_id: createdProduct.id,
            category_id: catId,
          })),
        });
      }

      return createdProduct;
    });

    res.status(201).json({
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create product" });
  }
};

/**
 * ✏️ UPDATE PRODUCT
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      product_name,
      url_slug,
      description,
      mrp,
      price,
      stock_quantity,
      status,
      images,
      categories,
    } = req.body;

    const productId = Number(id);

    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // 🔒 Check product exists & not soft deleted
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        deleted_at: null,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 🔥 Validate images (only if provided)
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({ message: "Invalid images format" });
      }

      if (images.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one image is required" });
      }

      const defaultImages = images.filter((img: any) => img.is_default);

      if (defaultImages.length !== 1) {
        return res.status(400).json({
          message: "Exactly one default image is required",
        });
      }
    }

    // 🔥 Validate categories (only if provided)
    if (categories !== undefined) {
      if (!Array.isArray(categories)) {
        return res.status(400).json({ message: "Invalid categories format" });
      }

      if (categories.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one category is required" });
      }
    }

    // 1️⃣ Update main product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        product_name,
        url_slug,
        description,
        mrp: mrp !== undefined ? Number(mrp) : undefined,
        price: price !== undefined ? Number(price) : undefined,
        stock_quantity:
          stock_quantity !== undefined
            ? Number(stock_quantity)
            : undefined,
        status,
      },
    });

    // 2️⃣ Replace images (only if sent)
    if (images !== undefined) {
      await prisma.productImage.deleteMany({
        where: { product_id: productId },
      });

      await prisma.productImage.createMany({
        data: images.map((img: any) => ({
          product_id: productId,
          image_url: img.image_url,
          is_default: img.is_default || false,
        })),
      });
    }

    // 3️⃣ Replace categories (only if sent)
    if (categories !== undefined) {
      await prisma.productCategory.deleteMany({
        where: { product_id: productId },
      });

      await prisma.productCategory.createMany({
        data: categories.map((catId: number) => ({
          product_id: productId,
          category_id: Number(catId),
        })),
      });
    }

    return res.json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error(error);

    // 🔥 Handle duplicate slug
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Slug already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to update product",
    });
  }
};

/**
 * 🔐 GET PRODUCT BY ID (Admin Only)
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

/**
 * 🌍 GET PRODUCT BY SLUG (Public)
 */
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ message: "Invalid slug" });
    }

    const product = await prisma.product.findFirst({
      where: {
        url_slug: slug,
        status: "active",
        deleted_at: null,
      },
      include: {
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

/**
 * 👀 GET PRODUCTS (Advanced Filtering)
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      status = "active",
      page = "1",
      limit = "10",
      sort,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // 🔥 Dynamic WHERE clause
    const where: any = {
      deleted_at: null,
    };

    // 🔎 Text Search
    if (search) {
      where.OR = [
        {
          product_name: {
            contains: String(search),
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: String(search),
            mode: "insensitive",
          },
        },
      ];
    }

    // 💰 Price Range (SAFE VERSION)

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {};

      if (minPrice !== undefined && minPrice !== "") {
        const min = Number(minPrice);
        if (!isNaN(min)) {
          priceFilter.gte = min;
        }
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        const max = Number(maxPrice);
        if (!isNaN(max)) {
          priceFilter.lte = max;
        }
      }

      if (Object.keys(priceFilter).length > 0) {
        where.price = priceFilter;
      }
    }

    // 📦 Status filter
    if (status && ["active", "inactive"].includes(String(status))) {
      where.status = status;
    }

    // 🏷 Category filter
    if (category) {
      where.categories = {
        some: {
          category_id: Number(category),
        },
      };
    }

    // 🔃 Sorting
    let orderBy: any = { created_at: "desc" };

    if (sort === "price_asc") {
      orderBy = { price: "asc" };
    }

    if (sort === "price_desc") {
      orderBy = { price: "desc" };
    }

    if (sort === "name_asc") {
      orderBy = { product_name: "asc" };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNumber,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};
