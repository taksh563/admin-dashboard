import mongoose from "mongoose";
import Product from "../models/product.model.js";

// ==========================================================
// HELPER: BUILD PRODUCT QUERY
// ==========================================================

const buildProductQuery = ({
  search = "",
  status = "",
  category = "",
  categories = [],
  minPrice = "",
  maxPrice = "",
  minStock = "",
  maxStock = "",
  stockStatus = "",
}) => {
  const query = {};

  // ========================================================
  // SEARCH
  // ========================================================

  if (search && search.trim()) {
    const searchValue = search.trim();

    query.$or = [
      {
        name: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        sku: {
          $regex: searchValue,
          $options: "i",
        },
      },
      {
        description: {
          $regex: searchValue,
          $options: "i",
        },
      },
    ];
  }

  // ========================================================
  // STATUS
  // ========================================================

  if (
    status !== undefined &&
    status !== null &&
    status !== ""
  ) {
    if (status === "active" || status === "true") {
      query.isActive = true;
    }

    if (
      status === "inactive" ||
      status === "false"
    ) {
      query.isActive = false;
    }
  }

  // ========================================================
  // CATEGORY
  // ========================================================

  let categoryIds = [];

  // --------------------------------------------------------
  // categories can arrive as:
  //
  // ["id1", "id2"]
  //
  // or:
  //
  // "id1,id2"
  //
  // --------------------------------------------------------

  if (Array.isArray(categories)) {
    categoryIds = categories.filter(Boolean);
  } else if (typeof categories === "string") {
    categoryIds = categories
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  // --------------------------------------------------------
  // category can also arrive as:
  //
  // "id1,id2"
  //
  // --------------------------------------------------------

  if (
    category &&
    typeof category === "string"
  ) {
    const singleOrMultipleCategories =
      category
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

    categoryIds.push(
      ...singleOrMultipleCategories
    );
  }

  // Remove duplicates
  categoryIds = [
    ...new Set(categoryIds),
  ];

  // --------------------------------------------------------
  // Validate ObjectIds
  // --------------------------------------------------------

  const validCategoryIds =
    categoryIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

  // --------------------------------------------------------
  // Multiple category filtering
  //
  // $in means product belongs to ANY
  // selected category.
  // --------------------------------------------------------

  if (validCategoryIds.length > 0) {
    query.categories = {
      $in: validCategoryIds,
    };
  }

  // ========================================================
  // PRICE FILTER
  // ========================================================

  const priceFilter = {};

  if (
    minPrice !== undefined &&
    minPrice !== null &&
    String(minPrice).trim() !== ""
  ) {
    const value = Number(minPrice);

    if (
      !Number.isNaN(value) &&
      value >= 0
    ) {
      priceFilter.$gte = value;
    }
  }

  if (
    maxPrice !== undefined &&
    maxPrice !== null &&
    String(maxPrice).trim() !== ""
  ) {
    const value = Number(maxPrice);

    if (
      !Number.isNaN(value) &&
      value >= 0
    ) {
      priceFilter.$lte = value;
    }
  }

  if (Object.keys(priceFilter).length > 0) {
    query.price = priceFilter;
  }

  // ========================================================
  // STOCK RANGE FILTER
  // ========================================================

  const stockFilter = {};

  if (
    minStock !== undefined &&
    minStock !== null &&
    String(minStock).trim() !== ""
  ) {
    const value = Number(minStock);

    if (
      !Number.isNaN(value) &&
      value >= 0
    ) {
      stockFilter.$gte = value;
    }
  }

  if (
    maxStock !== undefined &&
    maxStock !== null &&
    String(maxStock).trim() !== ""
  ) {
    const value = Number(maxStock);

    if (
      !Number.isNaN(value) &&
      value >= 0
    ) {
      stockFilter.$lte = value;
    }
  }

  // ========================================================
  // STOCK STATUS
  // ========================================================

  if (
    stockStatus &&
    stockStatus !== "all"
  ) {
    switch (stockStatus) {
      // ----------------------------------------------------
      // IN STOCK
      // ----------------------------------------------------
      case "in-stock":
        stockFilter.$gt = 0;
        break;

      // ----------------------------------------------------
      // LOW STOCK
      // ----------------------------------------------------
      case "low-stock":
        stockFilter.$gt = 0;
        stockFilter.$lte = 10;
        break;

      // ----------------------------------------------------
      // OUT OF STOCK
      // ----------------------------------------------------
      case "out-of-stock":
        stockFilter.$eq = 0;
        break;

      default:
        break;
    }
  }

  if (Object.keys(stockFilter).length > 0) {
    query.stock = stockFilter;
  }

  return query;
};

// ==========================================================
// GET PRODUCTS
// ==========================================================

export const getProducts = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  category = "",
  categories = [],
  minPrice = "",
  maxPrice = "",
  minStock = "",
  maxStock = "",
  stockStatus = "",
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  // ========================================================
  // PAGINATION
  // ========================================================

  const currentPage =
    Math.max(Number(page) || 1, 1);

  const pageLimit =
    Math.max(Number(limit) || 10, 1);

  const skip =
    (currentPage - 1) * pageLimit;

  // ========================================================
  // ALLOWED SORT FIELDS
  // ========================================================

  const allowedSortFields = [
    "name",
    "sku",
    "price",
    "stock",
    "isActive",
    "createdAt",
    "updatedAt",
  ];

  const safeSortBy =
    allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

  const safeSortOrder =
    String(sortOrder).toLowerCase() ===
    "asc"
      ? 1
      : -1;

  const sort = {
    [safeSortBy]: safeSortOrder,
  };

  // ========================================================
  // BUILD QUERY
  // ========================================================

  const query = buildProductQuery({
    search,
    status,
    category,
    categories,
    minPrice,
    maxPrice,
    minStock,
    maxStock,
    stockStatus,
  });

  // ========================================================
  // DATABASE QUERY
  // ========================================================

  const [products, total] =
    await Promise.all([
      Product.find(query)
        .populate(
          "categories",
          "name description isActive"
        )
        .sort(sort)
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      Product.countDocuments(query),
    ]);

  // ========================================================
  // PAGINATION
  // ========================================================

  const totalPages =
    Math.ceil(total / pageLimit);

  return {
    products,

    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages,
    },
  };
};

// ==========================================================
// GET PRODUCT BY ID
// ==========================================================

export const getProductById = async (
  id
) => {
  // ========================================================
  // VALIDATE ID
  // ========================================================

  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    return null;
  }

  // ========================================================
  // FIND PRODUCT
  // ========================================================

  return Product.findById(id)
    .populate(
      "categories",
      "name description isActive"
    )
    .lean();
};

// ==========================================================
// CREATE PRODUCT
// ==========================================================

export const createProduct = async (
  data
) => {
  // ========================================================
  // NORMALIZE DATA
  // ========================================================

  const productData = {
    ...data,

    name:
      typeof data.name === "string"
        ? data.name.trim()
        : data.name,

    sku:
      typeof data.sku === "string"
        ? data.sku.trim().toUpperCase()
        : data.sku,

    description:
      typeof data.description === "string"
        ? data.description.trim()
        : "",

    price:
      data.price !== undefined &&
      data.price !== ""
        ? Number(data.price)
        : data.price,

    stock:
      data.stock !== undefined &&
      data.stock !== ""
        ? Number(data.stock)
        : 0,

    categories:
      Array.isArray(data.categories)
        ? data.categories
        : [],
  };

  // ========================================================
  // CREATE
  // ========================================================

  const product =
    new Product(productData);

  const savedProduct =
    await product.save();

  // ========================================================
  // RETURN POPULATED PRODUCT
  // ========================================================

  return Product.findById(
    savedProduct._id
  )
    .populate(
      "categories",
      "name description isActive"
    )
    .lean();
};

// ==========================================================
// UPDATE PRODUCT
// ==========================================================

export const updateProduct = async (
  id,
  data
) => {
  // ========================================================
  // VALIDATE ID
  // ========================================================

  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    return null;
  }

  // ========================================================
  // NORMALIZE DATA
  // ========================================================

  const updateData = {
    ...data,
  };

  if (
    typeof updateData.name ===
    "string"
  ) {
    updateData.name =
      updateData.name.trim();
  }

  if (
    typeof updateData.sku ===
    "string"
  ) {
    updateData.sku =
      updateData.sku
        .trim()
        .toUpperCase();
  }

  if (
    typeof updateData.description ===
    "string"
  ) {
    updateData.description =
      updateData.description.trim();
  }

  if (
    updateData.price !==
      undefined &&
    updateData.price !== ""
  ) {
    updateData.price =
      Number(updateData.price);
  }

  if (
    updateData.stock !==
      undefined &&
    updateData.stock !== ""
  ) {
    updateData.stock =
      Number(updateData.stock);
  }

  if (
    updateData.categories !==
      undefined
  ) {
    updateData.categories =
      Array.isArray(
        updateData.categories
      )
        ? updateData.categories
        : [];
  }

  // ========================================================
  // UPDATE
  // ========================================================

  return Product.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate(
      "categories",
      "name description isActive"
    )
    .lean();
};

// ==========================================================
// CHANGE PRODUCT STATUS
// ==========================================================

export const changeProductStatus =
  async (id, isActive) => {
    // ======================================================
    // VALIDATE ID
    // ======================================================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return null;
    }

    // ======================================================
    // VALIDATE STATUS
    // ======================================================

    if (
      typeof isActive !== "boolean"
    ) {
      throw new Error(
        "Product status must be a boolean."
      );
    }

    // ======================================================
    // UPDATE STATUS
    // ======================================================

    return Product.findByIdAndUpdate(
      id,
      {
        isActive,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "categories",
        "name description isActive"
      )
      .lean();
  };

// ==========================================================
// DELETE PRODUCT
// ==========================================================

export const deleteProduct = async (
  id
) => {
  // ========================================================
  // VALIDATE ID
  // ========================================================

  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    return null;
  }

  // ========================================================
  // DELETE
  // ========================================================

  return Product.findByIdAndDelete(id);
};