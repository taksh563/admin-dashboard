import api from "../api/axios";

const productService = {
  // ======================================================
  // GET PRODUCTS
  // ======================================================

  getProducts: async (params = {}) => {
    const response = await api.get("/products", {
      params,
    });

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
  // ======================================================

  createProduct: async (data) => {
    const response = await api.post(
      "/products",
      data
    );

    return response.data;
  },

  // ======================================================
  // UPDATE PRODUCT
  // ======================================================

  updateProduct: async (id, data) => {
    const response = await api.put(
      `/products/${id}`,
      data
    );

    return response.data;
  },

  // ======================================================
  // CHANGE STATUS
  // ======================================================

  changeStatus: async (id, isActive) => {
    const response = await api.patch(
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
    const response = await api.delete(
      `/products/${id}`
    );

    return response.data;
  },
};

export default productService;