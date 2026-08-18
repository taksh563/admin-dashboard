import Product from "../models/product.model.js";

export const getProducts = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  category = "",
}) => {
  const currentPage = Number(page) || 1;
  const pageLimit = Number(limit) || 10;

  const skip = (currentPage - 1) * pageLimit;

  const query = {};

  if (search?.trim()) {
    query.$or = [
      {
        name: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        description: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  if (status !== "") {
    query.isActive = status === "true";
  }

  if (category) {
    query.categories = category;
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("categories", "name")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(pageLimit),

    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages: Math.ceil(total / pageLimit),
    },
  };
};

export const getProductById = async (id) => {
  return Product.findById(id).populate("categories", "name");
};

export const createProduct = async (data) => {
  const product = new Product(data);

  return product.save();
};

export const updateProduct = async (id, data) => {
  return Product.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  ).populate("categories", "name");
};

export const deleteProduct = async (id) => {
  return Product.findByIdAndDelete(id);
};