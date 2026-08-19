import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Tag,
} from "lucide-react";

import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

const Categories = () => {
  const { showToast } = useToast();

  // ==========================================
  // STATE
  // ==========================================

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // ==========================================
  // ADD / EDIT MODAL
  // ==========================================

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
  });

  // ==========================================
  // STATUS MODAL
  // ==========================================

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusCategory, setStatusCategory] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);

  // ==========================================
  // DELETE MODAL
  // ==========================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // LOAD CATEGORIES
  // ==========================================

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await api.get("/categories");

      const categoryData =
        response?.data?.data ||
        response?.data?.categories ||
        [];

      setCategories(
        Array.isArray(categoryData) ? categoryData : []
      );
    } catch (error) {
      console.error("Unable to load categories:", error);

      showToast({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to load categories.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ==========================================
  // FILTER CATEGORIES
  // ==========================================

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // SEARCH
    if (search.trim()) {
      const searchText = search.trim().toLowerCase();

      result = result.filter(
        (category) =>
          category.name
            ?.toLowerCase()
            .includes(searchText) ||
          category.description
            ?.toLowerCase()
            .includes(searchText) ||
          category.slug
            ?.toLowerCase()
            .includes(searchText)
      );
    }

    // STATUS
    if (statusFilter === "ACTIVE") {
      result = result.filter(
        (category) => category.isActive === true
      );
    }

    if (statusFilter === "INACTIVE") {
      result = result.filter(
        (category) => category.isActive === false
      );
    }

    return result;
  }, [categories, search, statusFilter]);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // GENERATE SLUG
  // ==========================================

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      slug,
    }));
  };

  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const handleCreate = () => {
    setEditingCategory(null);

    setFormData({
      name: "",
      slug: "",
      description: "",
      isActive: true,
    });

    setShowFormModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const handleEdit = (category) => {
    setEditingCategory(category);

    setFormData({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      isActive: category.isActive === true,
    });

    setShowFormModal(true);
  };

  // ==========================================
  // CLOSE FORM MODAL
  // ==========================================

  const closeFormModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setEditingCategory(null);

    setFormData({
      name: "",
      slug: "",
      description: "",
      isActive: true,
    });
  };

  // ==========================================
  // SAVE CATEGORY
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDATION
    if (!formData.name.trim()) {
      showToast({
        type: "error",
        message: "Category name is required.",
      });

      return;
    }

    // Generate slug automatically if empty
    const finalSlug =
      formData.slug.trim() ||
      formData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        slug: finalSlug,
        description: formData.description.trim(),
        isActive: formData.isActive === true,
      };

      let response;

      // ========================================
      // UPDATE
      // ========================================

      if (editingCategory) {
        response = await api.put(
          `/categories/${editingCategory._id}`,
          payload
        );

        if (response?.data?.success === false) {
          showToast({
            type: "error",
            message:
              response?.data?.message ||
              "Unable to update category.",
          });
          

          return;
        }

        showToast({
          type: "success",
          message:
            response?.data?.message ||
            "Category updated successfully.",
        });
      }

      // ========================================
      // CREATE
      // ========================================

      else {
        response = await api.post(
          "/categories",
          payload
        );

        if (response?.data?.success === false) {
          showToast({
            type: "error",
            message:
              response?.data?.message ||
              "Unable to create category.",
          });

          return;
        }

        showToast({
          type: "success",
          message:
            response?.data?.message ||
            "Category created successfully.",
        });
      }

      closeFormModal();

      await fetchCategories();
    } catch (error) {
      console.error(
        "Save category error:",
        error
      );

      showToast({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to save category.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // OPEN STATUS MODAL
  // ==========================================

  const handleStatusClick = (category) => {
    setStatusCategory(category);
    setShowStatusModal(true);
  };

  // ==========================================
  // CLOSE STATUS MODAL
  // ==========================================

  const closeStatusModal = () => {
    if (changingStatus) return;

    setShowStatusModal(false);
    setStatusCategory(null);
  };

  // ==========================================
  // CHANGE STATUS
  // ==========================================

  const confirmStatusChange = async () => {
    if (!statusCategory) return;

    try {
      setChangingStatus(true);

      const newStatus = !statusCategory.isActive;

      const response = await api.patch(
        `/categories/${statusCategory._id}/status`,
        {
          isActive: newStatus,
        }
      );

      if (response?.data?.success === false) {
        showToast({
          type: "error",
          message:
            response?.data?.message ||
            "Unable to change category status.",
        });

        return;
      }

      showToast({
        type: "success",
        message:
          response?.data?.message ||
          `Category ${
            newStatus
              ? "activated"
              : "deactivated"
          } successfully.`,
      });

      closeStatusModal();

      await fetchCategories();
    } catch (error) {
      console.error(
        "Change category status error:",
        error
      );

      showToast({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to change category status.",
      });
    } finally {
      setChangingStatus(false);
    }
  };

  // ==========================================
  // OPEN DELETE MODAL
  // ==========================================

  const handleDeleteClick = (category) => {
    setDeleteCategory(category);
    setShowDeleteModal(true);
  };

  // ==========================================
  // CLOSE DELETE MODAL
  // ==========================================

  const closeDeleteModal = () => {
    if (deleting) return;

    setShowDeleteModal(false);
    setDeleteCategory(null);
  };

  // ==========================================
  // DELETE CATEGORY
  // ==========================================

  const confirmDelete = async () => {
    if (!deleteCategory) return;

    try {
      setDeleting(true);

      const response = await api.delete(
        `/categories/${deleteCategory._id}`
      );

      if (response?.data?.success === false) {
        showToast({
          type: "error",
          message:
            response?.data?.message ||
            "Unable to delete category.",
        });

        return;
      }

      showToast({
        type: "success",
        message:
          response?.data?.message ||
          "Category deleted successfully.",
      });

      closeDeleteModal();

      await fetchCategories();
    } catch (error) {
      console.error(
        "Delete category error:",
        error
      );

      showToast({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to delete category.",
      });
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="w-full">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your product categories.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />

          Add Category
        </button>

      </div>

      {/* ======================================
          MAIN CARD
      ======================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* ====================================
            FILTERS
        ===================================== */}

        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search categories..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* STATUS FILTER */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">
              All Status
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>

        </div>

        {/* ====================================
            TABLE
        ===================================== */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead className="bg-gray-50">

              <tr className="border-b border-gray-200">

                <th className="w-16 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  #
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Slug
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {/* LOADING */}

              {loading ? (

                <tr>

                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center"
                  >

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">

                      <Loader2
                        size={20}
                        className="animate-spin"
                      />

                      Loading categories...

                    </div>

                  </td>

                </tr>

              ) : filteredCategories.length === 0 ? (

                /* EMPTY */

                <tr>

                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <div className="mb-3 rounded-full bg-gray-100 p-3">
                        <Tag
                          size={25}
                          className="text-gray-400"
                        />
                      </div>

                      <p className="font-medium text-gray-700">
                        No categories found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search
                        or add a new category.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                /* DATA */

                filteredCategories.map(
                  (category, index) => (

                    <tr
                      key={category._id}
                      className="border-b border-gray-100 transition hover:bg-gray-50"
                    >

                      {/* NUMBER */}

                      <td className="px-4 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      {/* CATEGORY */}

                      <td className="px-4 py-4">

                        <div className="font-semibold text-gray-800">
                          {category.name}
                        </div>

                        <div className="mt-1 max-w-sm truncate text-xs text-gray-500">
                          {category.description ||
                            "Manage your product categories"}
                        </div>

                      </td>

                      {/* SLUG */}

                      <td className="px-4 py-4">

                        <span className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-600">
                          /{category.slug || "-"}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            handleStatusClick(
                              category
                            )
                          }
                          title="Change status"
                          className="group"
                        >

                          {category.isActive ? (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 transition group-hover:bg-green-200">

                              <CheckCircle
                                size={14}
                              />

                              Active

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 transition group-hover:bg-red-200">

                              <XCircle
                                size={14}
                              />

                              Inactive

                            </span>

                          )}

                        </button>

                      </td>

                      {/* CREATED */}

                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(
                          category.createdAt
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4">

                        <div className="flex items-center justify-end gap-2">

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(category)
                            }
                            title="Edit category"
                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          >

                            <Pencil size={17} />

                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteClick(
                                category
                              )
                            }
                            title="Delete category"
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          >

                            <Trash2 size={17} />

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ====================================
            FOOTER
        ===================================== */}

        {!loading &&
          filteredCategories.length > 0 && (

            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">

              <p className="text-sm text-gray-500">

                Showing{" "}

                <span className="font-medium text-gray-700">
                  {filteredCategories.length}
                </span>{" "}

                of{" "}

                <span className="font-medium text-gray-700">
                  {categories.length}
                </span>{" "}

                categories

              </p>

            </div>

          )}

      </div>

      {/* =================================================
          ADD / EDIT CATEGORY MODAL
      ================================================== */}

      {showFormModal && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeFormModal();
            }
          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-semibold text-gray-800">

                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}

                </h2>

                <p className="mt-1 text-xs text-gray-500">

                  {editingCategory
                    ? "Update category information."
                    : "Create a new product category."}

                </p>

              </div>

              <button
                type="button"
                onClick={closeFormModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <X size={20} />

              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">

                  Category Name

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Electronics"
                  autoFocus
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

              </div>

              {/* SLUG */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="text-sm font-medium text-gray-700">
                    Slug
                  </label>

                  <button
                    type="button"
                    onClick={generateSlug}
                    disabled={
                      saving ||
                      !formData.name.trim()
                    }
                    className="text-xs font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Generate from name
                  </button>

                </div>

                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleFormChange}
                  placeholder="electronics"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  URL-friendly version of the category name.
                </p>

              </div>

              {/* DESCRIPTION */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>

                  <span className="text-xs text-gray-400">
                    {formData.description.length}/500
                  </span>

                </div>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Enter category description..."
                  disabled={saving}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

              </div>

              {/* STATUS */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  name="isActive"
                  value={
                    formData.isActive
                      ? "true"
                      : "false"
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive:
                        e.target.value ===
                        "true",
                    }))
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >

                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>

                </select>

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !formData.name.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================
          STATUS CONFIRMATION MODAL
      ================================================== */}

      {showStatusModal &&
        statusCategory && (

          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeStatusModal();
              }
            }}
          >

            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">

              <div className="p-6">

                {/* ICON */}

                <div className="mb-4 flex justify-center">

                  <div
                    className={`rounded-full p-3 ${
                      statusCategory.isActive
                        ? "bg-red-100"
                        : "bg-green-100"
                    }`}
                  >

                    {statusCategory.isActive ? (

                      <XCircle
                        size={28}
                        className="text-red-600"
                      />

                    ) : (

                      <CheckCircle
                        size={28}
                        className="text-green-600"
                      />

                    )}

                  </div>

                </div>

                {/* MESSAGE */}

                <div className="text-center">

                  <h3 className="text-lg font-semibold text-gray-800">

                    {statusCategory.isActive
                      ? "Deactivate Category?"
                      : "Activate Category?"}

                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">

                    Are you sure you want to{" "}

                    <span className="font-semibold text-gray-700">

                      {statusCategory.isActive
                        ? "deactivate"
                        : "activate"}

                    </span>{" "}

                    the category{" "}

                    <span className="font-semibold text-gray-800">

                      "{statusCategory.name}"

                    </span>
                    ?

                  </p>

                  {statusCategory.isActive && (

                    <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">

                      Inactive categories should not
                      be available for new products.

                    </p>

                  )}

                </div>

                {/* BUTTONS */}

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={closeStatusModal}
                    disabled={changingStatus}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={confirmStatusChange}
                    disabled={changingStatus}
                    className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      statusCategory.isActive
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >

                    {changingStatus && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    {changingStatus
                      ? "Updating..."
                      : statusCategory.isActive
                      ? "Deactivate"
                      : "Activate"}

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      {/* =================================================
          DELETE CONFIRMATION MODAL
      ================================================== */}

      {showDeleteModal &&
        deleteCategory && (

          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeDeleteModal();
              }
            }}
          >

            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">

              <div className="p-6">

                {/* ICON */}

                <div className="mb-4 flex justify-center">

                  <div className="rounded-full bg-red-100 p-3">

                    <AlertTriangle
                      size={28}
                      className="text-red-600"
                    />

                  </div>

                </div>

                {/* MESSAGE */}

                <div className="text-center">

                  <h3 className="text-lg font-semibold text-gray-800">
                    Delete Category?
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">

                    Are you sure you want to permanently
                    delete{" "}

                    <span className="font-semibold text-gray-800">

                      "{deleteCategory.name}"

                    </span>
                    ?

                  </p>

                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">

                    This action cannot be undone.

                  </p>

                </div>

                {/* BUTTONS */}

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {deleting && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    {deleting
                      ? "Deleting..."
                      : "Delete Category"}

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

    </div>
  );
};

export default Categories;