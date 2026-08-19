import api from "../api/axios";

const productService = {
  // ======================================================
  // GET PRODUCTS
  // ======================================================

  getProducts: async (params = {}) => {
    const response = await api.get(
      "/products",
      {
        params,
      }
    );

    return response.data;
  },

  // ======================================================
  // GET PRODUCT BY ID
  // ======================================================

  getProductById: async (id) => {
    const response = await api.get(
      `/products/${id}`
    );

    return response.data;
  },

  // ======================================================
  // CREATE PRODUCT
  // Supports multiple images
  // ======================================================

  createProduct: async (data) => {
    const formData =
      new FormData();

    // ----------------------------------------------------
    // PRODUCT INFORMATION
    // ----------------------------------------------------

    if (data.name !== undefined) {
      formData.append(
        "name",
        data.name
      );
    }

    if (data.sku !== undefined) {
      formData.append(
        "sku",
        data.sku
      );
    }

    if (
      data.description !==
      undefined
    ) {
      formData.append(
        "description",
        data.description
      );
    }

    if (data.price !== undefined) {
      formData.append(
        "price",
        data.price
      );
    }

    if (data.stock !== undefined) {
      formData.append(
        "stock",
        data.stock
      );
    }

    if (data.isActive !== undefined) {
      formData.append(
        "isActive",
        data.isActive
      );
    }

    // ----------------------------------------------------
    // CATEGORIES
    // ----------------------------------------------------
    // Backend expects categories as an array.
    // Send JSON string so Express can parse it.

    if (
      Array.isArray(
        data.categories
      )
    ) {
      formData.append(
        "categories",
        JSON.stringify(
          data.categories
        )
      );
    }

    // ----------------------------------------------------
    // MULTIPLE IMAGES
    // ----------------------------------------------------

    if (
      Array.isArray(data.images)
    ) {
      data.images.forEach(
        (image) => {
          if (image instanceof File) {
            formData.append(
              "images",
              image
            );
          }
        }
      );
    }

    // ----------------------------------------------------
    // API REQUEST
    // ----------------------------------------------------

    const response =
      await api.post(
        "/products",
        formData
      );

    return response.data;
  },

  // ======================================================
  // UPDATE PRODUCT
  // Supports:
  // - Product information
  // - Adding new images
  // ======================================================

  updateProduct: async (
    id,
    data
  ) => {
    const formData =
      new FormData();

    // ----------------------------------------------------
    // PRODUCT INFORMATION
    // ----------------------------------------------------

    if (data.name !== undefined) {
      formData.append(
        "name",
        data.name
      );
    }

    if (data.sku !== undefined) {
      formData.append(
        "sku",
        data.sku
      );
    }

    if (
      data.description !==
      undefined
    ) {
      formData.append(
        "description",
        data.description
      );
    }

    if (data.price !== undefined) {
      formData.append(
        "price",
        data.price
      );
    }

    if (data.stock !== undefined) {
      formData.append(
        "stock",
        data.stock
      );
    }

    if (data.isActive !== undefined) {
      formData.append(
        "isActive",
        data.isActive
      );
    }

    // ----------------------------------------------------
    // CATEGORIES
    // ----------------------------------------------------

    if (
      Array.isArray(
        data.categories
      )
    ) {
      formData.append(
        "categories",
        JSON.stringify(
          data.categories
        )
      );
    }

    // ----------------------------------------------------
    // NEW IMAGES
    // ----------------------------------------------------

    if (
      Array.isArray(data.images)
    ) {
      data.images.forEach(
        (image) => {
          if (image instanceof File) {
            formData.append(
              "images",
              image
            );
          }
        }
      );
    }

    // ----------------------------------------------------
    // API REQUEST
    // ----------------------------------------------------

    const response =
      await api.put(
        `/products/${id}`,
        formData
      );

    return response.data;
  },

  // ======================================================
  // ADD PRODUCT IMAGES
  // ======================================================

  addProductImages: async (
    id,
    images
  ) => {
    const formData =
      new FormData();

    // ----------------------------------------------------
    // APPEND MULTIPLE FILES
    // ----------------------------------------------------

    if (
      Array.isArray(images)
    ) {
      images.forEach(
        (image) => {
          if (image instanceof File) {
            formData.append(
              "images",
              image
            );
          }
        }
      );
    }

    // ----------------------------------------------------
    // API REQUEST
    // ----------------------------------------------------

    const response =
      await api.post(
        `/products/${id}/images`,
        formData
      );

    return response.data;
  },

  // ======================================================
  // REPLACE ALL PRODUCT IMAGES
  // ======================================================

  replaceProductImages: async (
    id,
    images
  ) => {
    const formData =
      new FormData();

    // ----------------------------------------------------
    // APPEND IMAGES
    // ----------------------------------------------------

    if (
      Array.isArray(images)
    ) {
      images.forEach(
        (image) => {
          if (image instanceof File) {
            formData.append(
              "images",
              image
            );
          }
        }
      );
    }

    // ----------------------------------------------------
    // API REQUEST
    // ----------------------------------------------------

    const response =
      await api.put(
        `/products/${id}/images`,
        formData
      );

    return response.data;
  },

  // ======================================================
  // DELETE PRODUCT IMAGE
  // ======================================================

  deleteProductImage: async (
    productId,
    imageId
  ) => {
    const response =
      await api.delete(
        `/products/${productId}/images/${imageId}`
      );

    return response.data;
  },

  // ======================================================
  // SET PRIMARY PRODUCT IMAGE
  // ======================================================

  setPrimaryProductImage: async (
    productId,
    imageId
  ) => {
    const response =
      await api.patch(
        `/products/${productId}/images/${imageId}/primary`
      );

    return response.data;
  },

  // ======================================================
  // CHANGE PRODUCT STATUS
  // ======================================================

  changeStatus: async (
    id,
    isActive
  ) => {
    const response =
      await api.patch(
        `/products/${id}/status`,
        {
          isActive,
        }
      );

    return response.data;
  },

  // ======================================================
  // DELETE PRODUCT
  // ======================================================

  deleteProduct: async (id) => {
    const response =
      await api.delete(
        `/products/${id}`
      );

    return response.data;
  },
};

export default productService;