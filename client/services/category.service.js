// src/services/category.service.js

import api from "../api/axios";

const categoryService = {
  // =========================================
  // GET CATEGORIES
  // =========================================

  getCategories: async (params = {}) => {
    const response = await api.get(
      "/categories",
      {
        params,
      }
    );

    return response.data;
  },

  // =========================================
  // GET CATEGORY
  // =========================================

  getCategoryById: async (id) => {
    const response = await api.get(
      `/categories/${id}`
    );

    return response.data;
  },

  // =========================================
  // CREATE
  // =========================================

  createCategory: async (data) => {
    const response = await api.post(
      "/categories",
      data
    );

    return response.data;
  },

  // =========================================
  // UPDATE
  // =========================================

  updateCategory: async (
    id,
    data
  ) => {
    const response = await api.put(
      `/categories/${id}`,
      data
    );

    return response.data;
  },

  // =========================================
  // DELETE
  // =========================================

  deleteCategory: async (id) => {
    const response = await api.delete(
      `/categories/${id}`
    );

    return response.data;
  },
};

export default categoryService;