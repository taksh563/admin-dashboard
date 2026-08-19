
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import AuditLog from "../models/auditLog.model.js";

// ==========================================================
// IMAGE CONFIGURATION
// ==========================================================

const IMAGE_CONFIG = {
  maxImages: 10,

  maxFileSize: 5 * 1024 * 1024, // 5 MB

  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],

  allowedExtensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
  ],
};

// ==========================================================
// AUDIT LOG HELPER
// Same structure as Category controller
// ==========================================================

const createAuditLog = async ({
  req,
  action,
  description,
  recordId = null,
  oldData = null,
  newData = null,
  status = "SUCCESS",
  errorMessage = null,
}) => {
  try {
    const user = req.user || null;

    await AuditLog.create({
      // ------------------------------------------
      // USER
      // ------------------------------------------

      user:
        user?._id || null,

      userName:
        user?.name ||
        user?.username ||
        null,

      userEmail:
        user?.email ||
        null,

      // ------------------------------------------
      // ACTION
      // ------------------------------------------

      action,

      module: "PRODUCT",

      description,

      recordId,

      // ------------------------------------------
      // DATA
      // ------------------------------------------

      oldData,

      newData,

      // ------------------------------------------
      // REQUEST
      // ------------------------------------------

      method:
        req.method || null,

      endpoint:
        req.originalUrl ||
        req.url ||
        null,

      ipAddress:
        req.ip ||
        req.headers?.["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        null,

      userAgent:
        req.headers?.["user-agent"] ||
        null,

      // ------------------------------------------
      // STATUS
      // ------------------------------------------

      status,

      errorMessage,
    });
  } catch (auditError) {
    // Audit failure should NEVER break
    // the main product operation.

    console.error(
      "Product audit log error:",
      auditError
    );
  }
};

// ==========================================================
// VALIDATE OBJECT ID
// ==========================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================================
// SAFE JSON PARSE
// ==========================================================

const parseJSON = (
  value,
  fallback = null
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value === "object"
  ) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// ==========================================================
// PRODUCT AUDIT DATA
// ==========================================================

const getProductAuditData = (
  product
) => {
  if (!product) {
    return null;
  }

  const data = {
    _id: product._id
      ? String(product._id)
      : null,

    name:
      product.name || "",

    sku:
      product.sku || "",

    description:
      product.description || "",

    price:
      Number(product.price) || 0,

    stock:
      Number(product.stock) || 0,

    categories:
      Array.isArray(product.categories)
        ? product.categories.map(
            (category) =>
              String(
                category?._id ||
                category
              )
          )
        : [],

    isActive:
      Boolean(product.isActive),

    images:
      Array.isArray(product.images)
        ? product.images.map(
            (image) => ({
              _id:
                image?._id
                  ? String(
                      image._id
                    )
                  : null,

              url:
                image?.url || "",

              filename:
                image?.filename || "",

              originalName:
                image?.originalName ||
                "",

              mimeType:
                image?.mimeType ||
                "",

              size:
                Number(
                  image?.size
                ) || 0,

              isPrimary:
                Boolean(
                  image?.isPrimary
                ),
            })
          )
        : [],
  };

  // Make sure audit data is plain JSON.
  return JSON.parse(
    JSON.stringify(data)
  );
};

// ==========================================================
// IMAGE AUDIT DATA
// ==========================================================

const getImageAuditData = (
  images = []
) => {
  if (!Array.isArray(images)) {
    return [];
  }

  const data = images.map(
    (image) => ({
      _id:
        image?._id
          ? String(image._id)
          : null,

      url:
        image?.url || "",

      filename:
        image?.filename || "",

      originalName:
        image?.originalName ||
        "",

      mimeType:
        image?.mimeType ||
        "",

      size:
        Number(image?.size) || 0,

      isPrimary:
        Boolean(
          image?.isPrimary
        ),
    })
  );

  return JSON.parse(
    JSON.stringify(data)
  );
};

// ==========================================================
// GET UPLOADED FILES
// ==========================================================

const getUploadedFiles = (
  req
) => {
  if (
    !req.files ||
    !Array.isArray(req.files)
  ) {
    return [];
  }

  return req.files;
};

// ==========================================================
// GET FILE URL
// ==========================================================

const getFileUrl = (
  req,
  file
) => {
  if (!file) {
    return "";
  }

  // Multer path
  if (file.path) {
    let relativePath =
      file.path;

    relativePath =
      relativePath.replace(
        /\\/g,
        "/"
      );

    const uploadsIndex =
      relativePath.indexOf(
        "uploads/"
      );

    if (
      uploadsIndex !== -1
    ) {
      relativePath =
        relativePath.substring(
          uploadsIndex
        );
    }

    return `/${relativePath}`;
  }

  // Multer destination + filename
  if (
    file.destination &&
    file.filename
  ) {
    let relativePath =
      path.join(
        file.destination,
        file.filename
      );

    relativePath =
      relativePath.replace(
        /\\/g,
        "/"
      );

    const uploadsIndex =
      relativePath.indexOf(
        "uploads/"
      );

    if (
      uploadsIndex !== -1
    ) {
      relativePath =
        relativePath.substring(
          uploadsIndex
        );
    }

    return `/${relativePath}`;
  }

  // Existing URL
  if (file.url) {
    return file.url;
  }

  return "";
};

// ==========================================================
// VALIDATE IMAGE FILE
// ==========================================================

const validateImageFile = (
  file
) => {
  if (!file) {
    return {
      valid: false,
      message:
        "Invalid image file.",
    };
  }

  // MIME TYPE
  if (
    !IMAGE_CONFIG.allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    return {
      valid: false,
      message:
        `Invalid image type. Allowed types: ${IMAGE_CONFIG.allowedMimeTypes.join(
          ", "
        )}.`,
    };
  }

  // FILE SIZE
  if (
    file.size >
    IMAGE_CONFIG.maxFileSize
  ) {
    return {
      valid: false,
      message:
        "Image size cannot exceed 5 MB.",
    };
  }

  // EXTENSION
  const extension =
    path.extname(
      file.originalname || ""
    ).toLowerCase();

  if (
    !IMAGE_CONFIG.allowedExtensions.includes(
      extension
    )
  ) {
    return {
      valid: false,
      message:
        "Invalid image extension.",
    };
  }

  return {
    valid: true,
  };
};

// ==========================================================
// VALIDATE ALL UPLOADED IMAGES
// ==========================================================

const validateUploadedImages = (
  files
) => {
  if (!Array.isArray(files)) {
    return {
      valid: true,
    };
  }

  if (
    files.length >
    IMAGE_CONFIG.maxImages
  ) {
    return {
      valid: false,
      message:
        `Maximum ${IMAGE_CONFIG.maxImages} images are allowed.`,
    };
  }

  for (
    const file of files
  ) {
    const validation =
      validateImageFile(
        file
      );

    if (!validation.valid) {
      return validation;
    }
  }

  return {
    valid: true,
  };
};

// ==========================================================
// DELETE FILE
// ==========================================================

const deleteFile = async (
  filePath
) => {
  try {
    if (!filePath) {
      return;
    }

    let normalizedPath =
      String(filePath);

    normalizedPath =
      normalizedPath.replace(
        /^\/+/,
        ""
      );

    const absolutePath =
      path.resolve(
        process.cwd(),
        normalizedPath
      );

    if (
      fs.existsSync(
        absolutePath
      )
    ) {
      await fs.promises.unlink(
        absolutePath
      );

      console.log(
        "Deleted image:",
        absolutePath
      );
    }
  } catch (error) {
    console.error(
      "Unable to delete image:",
      error
    );
  }
};

// ==========================================================
// DELETE IMAGE OBJECT
// ==========================================================

const deleteImageObject = async (
  image
) => {
  if (!image) {
    return;
  }

  if (image.path) {
    await deleteFile(
      image.path
    );

    return;
  }

  if (image.url) {
    await deleteFile(
      image.url
    );
  }
};

// ==========================================================
// CLEANUP UPLOADED FILES
// ==========================================================

const cleanupUploadedFiles =
  async (
    files
  ) => {
    if (!Array.isArray(files)) {
      return;
    }

    for (
      const file of files
    ) {
      if (file?.path) {
        await deleteFile(
          file.path
        );
      }
    }
  };

// ==========================================================
// CREATE IMAGE OBJECT
// ==========================================================

const createImageObject = (
  req,
  file,
  isPrimary = false
) => {
  return {
    url: getFileUrl(
      req,
      file
    ),

    filename:
      file.filename || "",

    originalName:
      file.originalname || "",

    mimeType:
      file.mimetype || "",

    size:
      Number(file.size) || 0,

    isPrimary,
  };
};

// ==========================================================
// ENSURE PRIMARY IMAGE
// ==========================================================

const ensurePrimaryImage = (
  images
) => {
  if (
    !Array.isArray(images) ||
    images.length === 0
  ) {
    return images;
  }

  const primaryIndex =
    images.findIndex(
      (image) =>
        Boolean(
          image?.isPrimary
        )
    );

  if (
    primaryIndex === -1
  ) {
    images[0].isPrimary =
      true;

    return images;
  }

  images.forEach(
    (image, index) => {
      image.isPrimary =
        index ===
        primaryIndex;
    }
  );

  return images;
};

// ==========================================================
// NORMALIZE IMAGES
// ==========================================================

const normalizeImages = (
  images
) => {
  if (
    !Array.isArray(images)
  ) {
    return [];
  }

  return images.map(
    (image) => ({
      _id:
        image?._id,

      url:
        image?.url || "",

      filename:
        image?.filename || "",

      originalName:
        image?.originalName ||
        "",

      mimeType:
        image?.mimeType || "",

      size:
        Number(
          image?.size
        ) || 0,

      isPrimary:
        Boolean(
          image?.isPrimary
        ),
    })
  );
};

// ==========================================================
// CREATE PRODUCT
// ==========================================================

export const createProduct =
  async (
    req,
    res
  ) => {
    const uploadedFiles =
      getUploadedFiles(req);

    try {
      const {
        name,
        sku,
        description = "",
        price,
        stock = 0,
        categories = [],
        isActive = true,
      } = req.body;

      // ----------------------------------------------------
      // PARSE CATEGORIES
      // ----------------------------------------------------

      let parsedCategories =
        categories;

      if (
        typeof categories ===
        "string"
      ) {
        parsedCategories =
          parseJSON(
            categories,
            categories
              .split(",")
              .map((item) =>
                item.trim()
              )
              .filter(Boolean)
          );
      }

      // ----------------------------------------------------
      // VALIDATE IMAGES
      // ----------------------------------------------------

      const imageValidation =
        validateUploadedImages(
          uploadedFiles
        );

      if (
        !imageValidation.valid
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            imageValidation.message,
        });
      }

      // ----------------------------------------------------
      // VALIDATE NAME
      // ----------------------------------------------------

      const productName =
        String(
          name || ""
        ).trim();

      if (!productName) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "Product name is required.",
        });
      }

      // ----------------------------------------------------
      // VALIDATE SKU
      // ----------------------------------------------------

      const productSku =
        String(
          sku || ""
        )
          .trim()
          .toUpperCase();

      if (!productSku) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "SKU is required.",
        });
      }

      // ----------------------------------------------------
      // VALIDATE PRICE
      // ----------------------------------------------------

      const productPrice =
        Number(price);

      if (
        Number.isNaN(
          productPrice
        ) ||
        productPrice < 0
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid non-negative price.",
        });
      }

      // ----------------------------------------------------
      // VALIDATE STOCK
      // ----------------------------------------------------

      const productStock =
        Number(stock);

      if (
        Number.isNaN(
          productStock
        ) ||
        productStock < 0 ||
        !Number.isInteger(
          productStock
        )
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid non-negative whole number.",
        });
      }

      // ----------------------------------------------------
      // VALIDATE CATEGORIES
      // ----------------------------------------------------

      if (
        !Array.isArray(
          parsedCategories
        ) ||
        parsedCategories.length ===
          0
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "Please select at least one category.",
        });
      }

      const uniqueCategoryIds = [
        ...new Set(
          parsedCategories.map(
            (id) =>
              String(id)
          )
        ),
      ];

      const invalidCategory =
        uniqueCategoryIds.some(
          (id) =>
            !isValidObjectId(
              id
            )
        );

      if (
        invalidCategory
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "One or more category IDs are invalid.",
        });
      }

      // ----------------------------------------------------
      // CHECK ACTIVE CATEGORIES
      // ----------------------------------------------------

      const activeCategories =
        await Category.find({
          _id: {
            $in:
              uniqueCategoryIds,
          },

          isActive: true,
        }).select("_id");

      if (
        activeCategories.length !==
        uniqueCategoryIds.length
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "One or more selected categories are inactive or do not exist.",
        });
      }

      // ----------------------------------------------------
      // CHECK DUPLICATE SKU
      // ----------------------------------------------------

      const existingProduct =
        await Product.findOne({
          sku: productSku,
        });

      if (existingProduct) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(409).json({
          success: false,
          message:
            "A product with this SKU already exists.",
        });
      }

      // ----------------------------------------------------
      // CREATE IMAGES
      // ----------------------------------------------------

      const images =
        uploadedFiles.map(
          (
            file,
            index
          ) =>
            createImageObject(
              req,
              file,
              index === 0
            )
        );

      // ----------------------------------------------------
      // CREATE PRODUCT
      // ----------------------------------------------------

      const product =
        await Product.create({
          name:
            productName,

          sku:
            productSku,

          description:
            String(
              description || ""
            ).trim(),

          price:
            productPrice,

          stock:
            productStock,

          categories:
            uniqueCategoryIds,

          isActive:
            Boolean(
              isActive
            ),

          images,
        });

      // ----------------------------------------------------
      // POPULATE CATEGORIES
      // ----------------------------------------------------

      await product.populate({
        path:
          "categories",

        select:
          "name slug isActive",
      });

      // ----------------------------------------------------
      // AUDIT
      // ----------------------------------------------------

      await createAuditLog({
        req,

        action:
          "CREATE",

        description:
          `Created product "${product.name}"`,

        recordId:
          product._id,

        oldData:
          null,

        newData:
          getProductAuditData(
            product
          ),
      });

      return res.status(201).json({
        success: true,

        message:
          "Product created successfully.",

        data:
          product,
      });
    } catch (error) {
      console.error(
        "Create product error:",
        error
      );

      await cleanupUploadedFiles(
        uploadedFiles
      );

      await createAuditLog({
        req,

        action:
          "CREATE",

        description:
          "Failed to create product.",

        status:
          "FAILED",

        errorMessage:
          error?.message ||
          "Unknown error",
      });

      if (
        error?.code ===
        11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A product with this SKU already exists.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          "Unable to create product.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// ==========================================================
// GET PRODUCTS
// ==========================================================

export const getProducts =
  async (
    req,
    res
  ) => {
    try {
      const page =
        Math.max(
          Number(
            req.query.page
          ) || 1,
          1
        );

      const limit =
        Math.min(
          Math.max(
            Number(
              req.query.limit
            ) || 10,
            1
          ),
          100
        );

      const skip =
        (page - 1) *
        limit;

      const search =
        String(
          req.query.search ||
            ""
        ).trim();

      const category =
        req.query.category ||
        req.query.categoryId ||
        "";

      const status =
        req.query.status ||
        "";

      const minPrice =
        req.query.minPrice;

      const maxPrice =
        req.query.maxPrice;

      const minStock =
        req.query.minStock;

      const maxStock =
        req.query.maxStock;

      const lowStock =
        req.query.lowStock;

      // ----------------------------------------------------
      // SORT
      // ----------------------------------------------------

      const allowedSortFields =
        [
          "name",
          "sku",
          "price",
          "stock",
          "isActive",
          "createdAt",
          "updatedAt",
        ];

      let sortBy =
        req.query.sortBy ||
        "createdAt";

      let sortOrder =
        String(
          req.query.sortOrder ||
            "desc"
        ).toLowerCase();

      if (
        !allowedSortFields.includes(
          sortBy
        )
      ) {
        sortBy =
          "createdAt";
      }

      if (
        !["asc", "desc"].includes(
          sortOrder
        )
      ) {
        sortOrder =
          "desc";
      }

      const sortDirection =
        sortOrder ===
        "asc"
          ? 1
          : -1;

      const sort = {
        [sortBy]:
          sortDirection,
      };

      sort._id = -1;

      // ----------------------------------------------------
      // QUERY
      // ----------------------------------------------------

      const query = {};

      if (search) {
        query.$or = [
          {
            name: {
              $regex:
                search,
              $options:
                "i",
            },
          },

          {
            sku: {
              $regex:
                search,
              $options:
                "i",
            },
          },

          {
            description: {
              $regex:
                search,
              $options:
                "i",
            },
          },
        ];
      }

      // ----------------------------------------------------
      // CATEGORY
      // ----------------------------------------------------

      if (category) {
        if (
          !isValidObjectId(
            category
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid category ID.",
          });
        }

        query.categories =
          category;
      }

      // ----------------------------------------------------
      // STATUS
      // ----------------------------------------------------

      if (status) {
        const normalizedStatus =
          String(
            status
          ).toLowerCase();

        if (
          ![
            "active",
            "inactive",
            "all",
          ].includes(
            normalizedStatus
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid status filter.",
          });
        }

        if (
          normalizedStatus ===
          "active"
        ) {
          query.isActive =
            true;
        }

        if (
          normalizedStatus ===
          "inactive"
        ) {
          query.isActive =
            false;
        }
      }

      // ----------------------------------------------------
      // PRICE
      // ----------------------------------------------------

      if (
        minPrice !==
          undefined ||
        maxPrice !==
          undefined
      ) {
        query.price = {};

        if (
          minPrice !==
            undefined &&
          minPrice !==
            ""
        ) {
          const value =
            Number(
              minPrice
            );

          if (
            Number.isNaN(
              value
            ) ||
            value < 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid minimum price.",
            });
          }

          query.price.$gte =
            value;
        }

        if (
          maxPrice !==
            undefined &&
          maxPrice !==
            ""
        ) {
          const value =
            Number(
              maxPrice
            );

          if (
            Number.isNaN(
              value
            ) ||
            value < 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid maximum price.",
            });
          }

          query.price.$lte =
            value;
        }
      }

      // ----------------------------------------------------
      // STOCK
      // ----------------------------------------------------

      if (
        minStock !==
          undefined ||
        maxStock !==
          undefined
      ) {
        query.stock = {};

        if (
          minStock !==
            undefined &&
          minStock !==
            ""
        ) {
          const value =
            Number(
              minStock
            );

          if (
            Number.isNaN(
              value
            ) ||
            value < 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid minimum stock.",
            });
          }

          query.stock.$gte =
            value;
        }

        if (
          maxStock !==
            undefined &&
          maxStock !==
            ""
        ) {
          const value =
            Number(
              maxStock
            );

          if (
            Number.isNaN(
              value
            ) ||
            value < 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid maximum stock.",
            });
          }

          query.stock.$lte =
            value;
        }
      }

      // ----------------------------------------------------
      // LOW STOCK
      // ----------------------------------------------------

      if (
        lowStock !==
          undefined &&
        lowStock !==
          ""
      ) {
        const value =
          Number(
            lowStock
          );

        if (
          Number.isNaN(
            value
          ) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid low stock value.",
          });
        }

        query.stock = {
          ...(query.stock ||
            {}),

          $lte:
            value,
        };
      }

      // ----------------------------------------------------
      // RANGE VALIDATION
      // ----------------------------------------------------

      if (
        query.price?.$gte !==
          undefined &&
        query.price?.$lte !==
          undefined &&
        query.price.$gte >
          query.price.$lte
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum price cannot be greater than maximum price.",
        });
      }

      if (
        query.stock?.$gte !==
          undefined &&
        query.stock?.$lte !==
          undefined &&
        query.stock.$gte >
          query.stock.$lte
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum stock cannot be greater than maximum stock.",
        });
      }

      // ----------------------------------------------------
      // TOTAL
      // ----------------------------------------------------

      const total =
        await Product.countDocuments(
          query
        );

      // ----------------------------------------------------
      // FETCH
      // ----------------------------------------------------

      const products =
        await Product.find(
          query
        )
          .populate({
            path:
              "categories",

            select:
              "name slug isActive",
          })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();

      const totalPages =
        Math.ceil(
          total / limit
        );

      return res.status(200).json({
        success: true,

        data:
          products,

        pagination: {
          page,

          limit,

          total,

          totalPages,
        },
      });
    } catch (error) {
      console.error(
        "Get products error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load products.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// ==========================================================
// GET PRODUCT BY ID
// ==========================================================

export const getProductById =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const product =
        await Product.findById(
          id
        ).populate({
          path:
            "categories",

          select:
            "name slug isActive",
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      return res.status(200).json({
        success: true,

        data:
          product,
      });
    } catch (error) {
      console.error(
        "Get product by ID error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load product.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// ==========================================================
// UPDATE PRODUCT
// ==========================================================

export const updateProduct =
  async (
    req,
    res
  ) => {
    const uploadedFiles =
      getUploadedFiles(req);

    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const product =
        await Product.findById(
          id
        );

      if (!product) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      // ----------------------------------------------------
      // OLD DATA
      // ----------------------------------------------------

      const oldData =
        getProductAuditData(
          product
        );

      // ----------------------------------------------------
      // IMAGE VALIDATION
      // ----------------------------------------------------

      const imageValidation =
        validateUploadedImages(
          uploadedFiles
        );

      if (
        !imageValidation.valid
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            imageValidation.message,
        });
      }

      const {
        name,
        sku,
        description,
        price,
        stock,
        categories,
        isActive,
        removeImages,
        primaryImageId,
        replaceImages,
      } = req.body;

      // ----------------------------------------------------
      // NAME
      // ----------------------------------------------------

      if (
        name !==
        undefined
      ) {
        const productName =
          String(
            name
          ).trim();

        if (
          !productName
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "Product name is required.",
          });
        }

        if (
          productName.length <
          2
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "Product name must be at least 2 characters.",
          });
        }

        if (
          productName.length >
          150
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "Product name cannot exceed 150 characters.",
          });
        }

        product.name =
          productName;
      }

      // ----------------------------------------------------
      // SKU
      // ----------------------------------------------------

      if (
        sku !==
        undefined
      ) {
        const productSku =
          String(
            sku
          )
            .trim()
            .toUpperCase();

        if (
          !productSku
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "SKU is required.",
          });
        }

        if (
          productSku.length <
          2
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "SKU must be at least 2 characters.",
          });
        }

        if (
          productSku.length >
          100
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "SKU cannot exceed 100 characters.",
          });
        }

        const duplicateSku =
          await Product.findOne({
            sku:
              productSku,

            _id: {
              $ne:
                id,
            },
          });

        if (
          duplicateSku
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(409).json({
            success: false,
            message:
              "A product with this SKU already exists.",
          });
        }

        product.sku =
          productSku;
      }

      // ----------------------------------------------------
      // DESCRIPTION
      // ----------------------------------------------------

      if (
        description !==
        undefined
      ) {
        product.description =
          String(
            description ||
              ""
          ).trim();
      }

      // ----------------------------------------------------
      // PRICE
      // ----------------------------------------------------

      if (
        price !==
        undefined
      ) {
        const productPrice =
          Number(
            price
          );

        if (
          Number.isNaN(
            productPrice
          ) ||
          productPrice < 0
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "Please provide a valid non-negative price.",
          });
        }

        product.price =
          productPrice;
      }

      // ----------------------------------------------------
      // STOCK
      // ----------------------------------------------------

      if (
        stock !==
        undefined
      ) {
        const productStock =
          Number(
            stock
          );

        if (
          Number.isNaN(
            productStock
          ) ||
          productStock < 0 ||
          !Number.isInteger(
            productStock
          )
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "Stock must be a valid non-negative whole number.",
          });
        }

        product.stock =
          productStock;
      }

      // ----------------------------------------------------
      // CATEGORIES
      // ----------------------------------------------------

      if (
        categories !==
        undefined
      ) {
        let parsedCategories =
          categories;

        if (
          typeof categories ===
          "string"
        ) {
          parsedCategories =
            parseJSON(
              categories,
              categories
                .split(",")
                .map(
                  (
                    item
                  ) =>
                    item.trim()
                )
                .filter(
                  Boolean
                )
            );
        }

        if (
          !Array.isArray(
            parsedCategories
          ) ||
          parsedCategories.length ===
            0
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "Please select at least one category.",
          });
        }

        const uniqueCategoryIds =
          [
            ...new Set(
              parsedCategories.map(
                (
                  category
                ) =>
                  String(
                    category
                  )
              )
            ),
          ];

        const invalidCategory =
          uniqueCategoryIds.some(
            (
              categoryId
            ) =>
              !isValidObjectId(
                categoryId
              )
          );

        if (
          invalidCategory
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "One or more category IDs are invalid.",
          });
        }

        const activeCategories =
          await Category.find({
            _id: {
              $in:
                uniqueCategoryIds,
            },

            isActive:
              true,
          }).select(
            "_id"
          );

        if (
          activeCategories.length !==
          uniqueCategoryIds.length
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "One or more selected categories are inactive or do not exist.",
          });
        }

        product.categories =
          uniqueCategoryIds;
      }

      // ----------------------------------------------------
      // STATUS
      // ----------------------------------------------------

      if (
        isActive !==
        undefined
      ) {
        product.isActive =
          isActive ===
            true ||
          isActive ===
            "true";
      }

      // ====================================================
      // IMAGE OPERATIONS
      // ====================================================

      let imageChanges =
        false;

      const originalImages =
        normalizeImages(
          product.images ||
            []
        );

      // ----------------------------------------------------
      // REMOVE IMAGES
      // ----------------------------------------------------

      if (
        removeImages !==
        undefined
      ) {
        let imageIds =
          parseJSON(
            removeImages,
            []
          );

        if (
          typeof imageIds ===
          "string"
        ) {
          imageIds = [
            imageIds,
          ];
        }

        if (
          !Array.isArray(
            imageIds
          )
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "removeImages must be an array.",
          });
        }

        const imagesToRemove =
          product.images.filter(
            (
              image
            ) =>
              imageIds.includes(
                String(
                  image._id
                )
              )
          );

        for (
          const image of imagesToRemove
        ) {
          await deleteImageObject(
            image
          );
        }

        product.images =
          product.images.filter(
            (
              image
            ) =>
              !imageIds.includes(
                String(
                  image._id
                )
              )
          );

        imageChanges =
          true;
      }

      // ----------------------------------------------------
      // REPLACE ALL IMAGES
      // ----------------------------------------------------

      const shouldReplaceImages =
        replaceImages ===
          true ||
        replaceImages ===
          "true";

      if (
        shouldReplaceImages
      ) {
        if (
          uploadedFiles.length ===
          0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Please upload at least one image when replacing product images.",
          });
        }

        for (
          const image of product.images
        ) {
          await deleteImageObject(
            image
          );
        }

        const newImages =
          uploadedFiles.map(
            (
              file,
              index
            ) =>
              createImageObject(
                req,
                file,
                index === 0
              )
          );

        product.images =
          newImages;

        imageChanges =
          true;
      } else if (
        uploadedFiles.length >
        0
      ) {
        // --------------------------------------------------
        // ADD NEW IMAGES
        // --------------------------------------------------

        const currentCount =
          Array.isArray(
            product.images
          )
            ? product.images
                .length
            : 0;

        if (
          currentCount +
            uploadedFiles.length >
          IMAGE_CONFIG.maxImages
        ) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              `Maximum ${IMAGE_CONFIG.maxImages} images are allowed per product.`,
          });
        }

        const hasPrimary =
          product.images.some(
            (
              image
            ) =>
              Boolean(
                image.isPrimary
              )
          );

        const newImages =
          uploadedFiles.map(
            (
              file,
              index
            ) =>
              createImageObject(
                req,
                file,
                !hasPrimary &&
                  index === 0
              )
          );

        product.images.push(
          ...newImages
        );

        imageChanges =
          true;
      }

      // ----------------------------------------------------
      // SET PRIMARY IMAGE
      // ----------------------------------------------------

      if (
        primaryImageId !==
          undefined &&
        primaryImageId !==
          ""
      ) {
        const image =
          product.images.find(
            (
              item
            ) =>
              String(
                item._id
              ) ===
              String(
                primaryImageId
              )
          );

        if (!image) {
          await cleanupUploadedFiles(
            uploadedFiles
          );

          return res.status(400).json({
            success: false,
            message:
              "Primary image not found.",
          });
        }

        product.images.forEach(
          (
            item
          ) => {
            item.isPrimary =
              String(
                item._id
              ) ===
              String(
                primaryImageId
              );
          }
        );

        imageChanges =
          true;
      }

      // ----------------------------------------------------
      // ENSURE PRIMARY
      // ----------------------------------------------------

      product.images =
        ensurePrimaryImage(
          product.images
        );

      // ----------------------------------------------------
      // MAX IMAGE COUNT
      // ----------------------------------------------------

      if (
        product.images.length >
        IMAGE_CONFIG.maxImages
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            `Maximum ${IMAGE_CONFIG.maxImages} images are allowed per product.`,
        });
      }

      // ----------------------------------------------------
      // SAVE
      // ----------------------------------------------------

      await product.save();

      // ----------------------------------------------------
      // POPULATE
      // ----------------------------------------------------

      await product.populate({
        path:
          "categories",

        select:
          "name slug isActive",
      });

      // ----------------------------------------------------
      // NEW DATA
      // ----------------------------------------------------

      const newData =
        getProductAuditData(
          product
        );

      // ----------------------------------------------------
      // GENERAL UPDATE AUDIT
      // ----------------------------------------------------

      await createAuditLog({
        req,

        action:
          "UPDATE",

        description:
          `Updated product "${product.name}"`,

        recordId:
          product._id,

        oldData,

        newData,
      });

      // ----------------------------------------------------
      // IMAGE UPDATE AUDIT
      // ----------------------------------------------------

      if (
        imageChanges
      ) {
        await createAuditLog({
          req,

          action:
            "IMAGE_UPDATE",

          description:
            `Updated images for product "${product.name}"`,

          recordId:
            product._id,

          oldData: {
            images:
              getImageAuditData(
                originalImages
              ),
          },

          newData: {
            images:
              getImageAuditData(
                product.images
              ),
          },
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Product updated successfully.",

        data:
          product,
      });
    } catch (error) {
      console.error(
        "Update product error:",
        error
      );

      await cleanupUploadedFiles(
        uploadedFiles
      );

      await createAuditLog({
        req,

        action:
          "UPDATE",

        description:
          "Failed to update product.",

        status:
          "FAILED",

        errorMessage:
          error?.message ||
          "Unknown error",
      });

      if (
        error?.code ===
        11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A product with this SKU already exists.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          "Unable to update product.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// ==========================================================
// DELETE PRODUCT
// ==========================================================

export const deleteProduct =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const product =
        await Product.findById(
          id
        ).populate({
          path:
            "categories",

          select:
            "name slug isActive",
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const oldData =
        getProductAuditData(
          product
        );

      // ----------------------------------------------------
      // DELETE IMAGES
      // ----------------------------------------------------

      if (
        Array.isArray(
          product.images
        )
      ) {
        for (
          const image of product.images
        ) {
          await deleteImageObject(
            image
          );
        }
      }

      // ----------------------------------------------------
      // DELETE PRODUCT
      // ----------------------------------------------------

      await Product.findByIdAndDelete(
        id
      );

      // ----------------------------------------------------
      // AUDIT
      // ----------------------------------------------------

      await createAuditLog({
        req,

        action:
          "DELETE",

        description:
          `Deleted product "${product.name}"`,

        recordId:
          product._id,

        oldData,

        newData:
          null,
      });

      return res.status(200).json({
        success: true,

        message:
          "Product deleted successfully.",

        data:
          null,
      });
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      await createAuditLog({
        req,

        action:
          "DELETE",

        description:
          "Failed to delete product.",

        status:
          "FAILED",

        errorMessage:
          error?.message ||
          "Unknown error",
      });

      return res.status(500).json({
        success: false,

        message:
          "Unable to delete product.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// ==========================================================
// CHANGE PRODUCT STATUS
// ==========================================================

export const changeProductStatus =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const {
        isActive,
      } = req.body;

      if (
        typeof isActive !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false.",
        });
      }

      const product =
        await Product.findById(
          id
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const oldData =
        getProductAuditData(
          product
        );

      product.isActive =
        isActive;

      await product.save();

      await product.populate({
        path:
          "categories",

        select:
          "name slug isActive",
      });

      const newData =
        getProductAuditData(
          product
        );

      await createAuditLog({
        req,

        action:
          "STATUS_UPDATE",

        description:
          `${
            isActive
              ? "Activated"
              : "Deactivated"
          } product "${product.name}"`,

        recordId:
          product._id,

        oldData,

        newData,
      });

      return res.status(200).json({
        success: true,

        message:
          isActive
            ? "Product activated successfully."
            : "Product deactivated successfully.",

        data:
          product,
      });
    } catch (error) {
      console.error(
        "Change product status error:",
        error
      );

      await createAuditLog({
        req,

        action:
          "STATUS_UPDATE",

        description:
          "Failed to update product status.",

        status:
          "FAILED",

        errorMessage:
          error?.message ||
          "Unknown error",
      });

      return res.status(500).json({
        success: false,

        message:
          "Unable to change product status.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// ==========================================================
// ADD PRODUCT IMAGES
// ==========================================================

export const addProductImages =
  async (
    req,
    res
  ) => {
    const uploadedFiles =
      getUploadedFiles(req);

    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      if (
        uploadedFiles.length ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload at least one image.",
        });
      }

      const validation =
        validateUploadedImages(
          uploadedFiles
        );

      if (
        !validation.valid
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            validation.message,
        });
      }

      const product =
        await Product.findById(
          id
        );

      if (!product) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const oldImages =
        normalizeImages(
          product.images ||
            []
        );

      const currentCount =
        product.images?.length ||
        0;

      if (
        currentCount +
          uploadedFiles.length >
        IMAGE_CONFIG.maxImages
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            `Maximum ${IMAGE_CONFIG.maxImages} images are allowed per product.`,
        });
      }

      const hasPrimary =
        product.images.some(
          (
            image
          ) =>
            Boolean(
              image.isPrimary
            )
        );

      const newImages =
        uploadedFiles.map(
          (
            file,
            index
          ) =>
            createImageObject(
              req,
              file,
              !hasPrimary &&
                index === 0
            )
        );

      product.images.push(
        ...newImages
      );

      ensurePrimaryImage(
        product.images
      );

      await product.save();

      await createAuditLog({
        req,

        action:
          "IMAGE_ADD",

        description:
          `Added ${newImages.length} image(s) to product "${product.name}"`,

        recordId:
          product._id,

        oldData: {
          images:
            getImageAuditData(
              oldImages
            ),
        },

        newData: {
          images:
            getImageAuditData(
              product.images
            ),

          addedImages:
            getImageAuditData(
              newImages
            ),
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Product images added successfully.",

        data:
          product.images,
      });
    } catch (error) {
      console.error(
        "Add product images error:",
        error
      );

      await cleanupUploadedFiles(
        uploadedFiles
      );

      await createAuditLog({
        req,

        action:
          "IMAGE_ADD",

        description:
          "Failed to add product images.",

        status:
          "FAILED",

        errorMessage:
          error?.message ||
          "Unknown error",
      });

      return res.status(500).json({
        success: false,

        message:
          "Unable to add product images.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// ==========================================================
// DELETE PRODUCT IMAGE
// ==========================================================

export const deleteProductImage =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
        imageId,
      } = req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      if (
        !isValidObjectId(
          imageId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid image ID.",
        });
      }

      const product =
        await Product.findById(
          id
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const image =
        product.images.id(
          imageId
        );

      if (!image) {
        return res.status(404).json({
          success: false,
          message:
            "Product image not found.",
        });
      }

      const oldImages =
        normalizeImages(
          product.images
        );

      const deletedImage =
        getImageAuditData([
          image,
        ]);

      const wasPrimary =
        Boolean(
          image.isPrimary
        );

      await deleteImageObject(
        image
      );

      image.deleteOne();

      ensurePrimaryImage(
        product.images
      );

      await product.save();

      await createAuditLog({
        req,

        action:
          "IMAGE_DELETE",

        description:
          `Deleted image from product "${product.name}"`,

        recordId:
          product._id,

        oldData: {
          images:
            getImageAuditData(
              oldImages
            ),

          deletedImage,
        },

        newData: {
          images:
            getImageAuditData(
              product.images
            ),

          deletedWasPrimary:
            wasPrimary,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Product image deleted successfully.",

        data:
          product.images,
      });
    } catch (error) {
      console.error(
        "Delete product image error:",
        error
      );

      await createAuditLog({
        req,

        action:
          "IMAGE_DELETE",

        description:
          "Failed to delete product image.",

        status:
          "FAILED",

        errorMessage:
          error?.message ||
          "Unknown error",
      });

      return res.status(500).json({
        success: false,

        message:
          "Unable to delete product image.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// ==========================================================
// SET PRIMARY PRODUCT IMAGE
// ==========================================================

export const setPrimaryProductImage =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
        imageId,
      } = req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      if (
        !isValidObjectId(
          imageId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid image ID.",
        });
      }

      const product =
        await Product.findById(
          id
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const image =
        product.images.id(
          imageId
        );

      if (!image) {
        return res.status(404).json({
          success: false,
          message:
            "Product image not found.",
        });
      }

      const oldImages =
        normalizeImages(
          product.images
        );

      product.images.forEach(
        (
          item
        ) => {
          item.isPrimary =
            String(
              item._id
            ) ===
            String(
              imageId
            );
        }
      );

      await product.save();

      await createAuditLog({
        req,

        action:
          "IMAGE_PRIMARY_UPDATE",

        description:
          `Changed primary image for product "${product.name}"`,

        recordId:
          product._id,

        oldData: {
          images:
            getImageAuditData(
              oldImages
            ),
        },

        newData: {
          images:
            getImageAuditData(
              product.images
            ),

          primaryImageId:
            imageId,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Primary image updated successfully.",

        data:
          product.images,
      });
    } catch (error) {
      console.error(
        "Set primary image error:",
        error
      );

      await createAuditLog({
        req,

        action:
          "IMAGE_PRIMARY_UPDATE",

        description:
          "Failed to update primary product image.",

        status:
          "FAILED",

        errorMessage:
          error?.message ||
          "Unknown error",
      });

      return res.status(500).json({
        success: false,

        message:
          "Unable to set primary image.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// ==========================================================
// REPLACE PRODUCT IMAGES
// ==========================================================

export const replaceProductImages =
  async (
    req,
    res
  ) => {
    const uploadedFiles =
      getUploadedFiles(req);

    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      if (
        uploadedFiles.length ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload at least one image.",
        });
      }

      const validation =
        validateUploadedImages(
          uploadedFiles
        );

      if (
        !validation.valid
      ) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(400).json({
          success: false,
          message:
            validation.message,
        });
      }

      const product =
        await Product.findById(
          id
        );

      if (!product) {
        await cleanupUploadedFiles(
          uploadedFiles
        );

        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const oldImages =
        normalizeImages(
          product.images ||
            []
        );

      // ----------------------------------------------------
      // DELETE OLD FILES
      // ----------------------------------------------------

      for (
        const image of product.images
      ) {
        await deleteImageObject(
          image
        );
      }

      // ----------------------------------------------------
      // CREATE NEW IMAGES
      // ----------------------------------------------------

      product.images =
        uploadedFiles.map(
          (
            file,
            index
          ) =>
            createImageObject(
              req,
              file,
              index === 0
            )
        );

      await product.save();

      // ----------------------------------------------------
      // AUDIT
      // ----------------------------------------------------

      await createAuditLog({
        req,

        action:
          "IMAGE_REPLACE",

        description:
          `Replaced images for product "${product.name}"`,

        recordId:
          product._id,

        oldData: {
          images:
            getImageAuditData(
              oldImages
            ),
        },

        newData: {
          images:
            getImageAuditData(
              product.images
            ),
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Product images replaced successfully.",

        data:
          product.images,
      });
    } catch (error) {
      console.error(
        "Replace product images error:",
        error
      );

      await cleanupUploadedFiles(
        uploadedFiles
      );

      await createAuditLog({
        req,

        action:
          "IMAGE_REPLACE",

        description:
          "Failed to replace product images.",

        status:
          "FAILED",

        errorMessage:
          error?.message ||
          "Unknown error",
      });

      return res.status(500).json({
        success: false,

        message:
          "Unable to replace product images.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

