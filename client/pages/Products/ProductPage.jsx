import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Select from "react-select";

import productService from "../../services/product.service";
import categoryService from "../../services/category.service";

import { useToast } from "../../context/ToastContext";

// ======================================================
// INITIAL FORM
// ======================================================

const getInitialForm = () => ({
  name: "",
  sku: "",
  description: "",
  price: "",
  stock: 0,
  categories: [],
  isActive: true,
});

// ======================================================
// INITIAL FILTERS
// ======================================================

const getInitialFilters = () => ({
  status: "all",
  categories: [],
  minPrice: "",
  maxPrice: "",
  minStock: "",
  maxStock: "",
  stockStatus: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
});

// ======================================================
// NORMALIZE API RESPONSE
// ======================================================

const normalizeResponse = (response) => {
  if (
    response &&
    typeof response === "object" &&
    typeof response.success !== "undefined"
  ) {
    return response;
  }

  if (
    response?.data &&
    typeof response.data === "object"
  ) {
    return response.data;
  }

  return response || {};
};

// ======================================================
// GET API MESSAGE
// ======================================================

const getResponseMessage = (
  response,
  fallback
) => {
  const result =
    normalizeResponse(response);

  return (
    result?.message ||
    response?.message ||
    response?.data?.message ||
    fallback
  );
};

// ======================================================
// GET ERROR MESSAGE
// ======================================================

const getErrorMessage = (
  error,
  fallback
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
};

// ======================================================
// PRODUCT PAGE
// ======================================================

const ProductPage = () => {
  // ====================================================
  // TOAST
  // ====================================================

  const {
    success,
    error,
    warning,
    info,
  } = useToast();

  // ====================================================
  // PRODUCT STATE
  // ====================================================

  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [categoryLoading, setCategoryLoading] =
    useState(false);

  // ====================================================
  // PAGINATION
  // ====================================================

  const [page, setPage] =
    useState(1);

  const limit = 10;

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

  // ====================================================
  // SEARCH
  // ====================================================

  const [search, setSearch] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  // ====================================================
  // ADVANCED FILTER STATE
  // ====================================================

  const [filters, setFilters] =
    useState(getInitialFilters());

  const [showFilters, setShowFilters] =
    useState(false);

  // ====================================================
  // MODALS
  // ====================================================

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [showStatusModal, setShowStatusModal] =
    useState(false);

  // ====================================================
  // FORM
  // ====================================================

  const [form, setForm] =
    useState(getInitialForm());

  const [formErrors, setFormErrors] =
    useState({});

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  // ====================================================
  // SUBMIT STATES
  // ====================================================

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [changingStatus, setChangingStatus] =
    useState(false);

  // ====================================================
  // CATEGORY SELECT OPTIONS
  // ====================================================

  const categoryFilterOptions =
    useMemo(() => {
      return categories;
    }, [categories]);

  // ====================================================
  // ACTIVE FILTER COUNT
  // ====================================================

  const activeFilterCount =
    useMemo(() => {
      let count = 0;

      if (
        filters.status &&
        filters.status !== "all"
      ) {
        count++;
      }

      if (
        Array.isArray(
          filters.categories
        ) &&
        filters.categories.length > 0
      ) {
        count++;
      }

      if (
        String(
          filters.minPrice
        ).trim() !== ""
      ) {
        count++;
      }

      if (
        String(
          filters.maxPrice
        ).trim() !== ""
      ) {
        count++;
      }

      if (
        String(
          filters.minStock
        ).trim() !== ""
      ) {
        count++;
      }

      if (
        String(
          filters.maxStock
        ).trim() !== ""
      ) {
        count++;
      }

      if (
        filters.stockStatus &&
        filters.stockStatus !== "all"
      ) {
        count++;
      }

      if (
        filters.sortBy !== "createdAt" ||
        filters.sortOrder !== "desc"
      ) {
        count++;
      }

      return count;
    }, [filters]);

  // ====================================================
  // LOAD PRODUCTS
  // ====================================================

  const loadProducts = useCallback(
    async () => {
      try {
        setLoading(true);

        const requestParams = {
          page,
          limit,
          search,
        };

        // ----------------------------------------------
        // STATUS
        // ----------------------------------------------

        if (
          filters.status &&
          filters.status !== "all"
        ) {
          requestParams.status =
            filters.status;
        }

        // ----------------------------------------------
        // CATEGORY
        // ----------------------------------------------

        if (
          Array.isArray(
            filters.categories
          ) &&
          filters.categories.length > 0
        ) {
          requestParams.category =
            filters.categories
              .map(
                (category) =>
                  category.value
              )
              .join(",");

          requestParams.categories =
            filters.categories
              .map(
                (category) =>
                  category.value
              );
        }

        // ----------------------------------------------
        // PRICE RANGE
        // ----------------------------------------------

        if (
          String(
            filters.minPrice
          ).trim() !== ""
        ) {
          requestParams.minPrice =
            Number(
              filters.minPrice
            );
        }

        if (
          String(
            filters.maxPrice
          ).trim() !== ""
        ) {
          requestParams.maxPrice =
            Number(
              filters.maxPrice
            );
        }

        // ----------------------------------------------
        // STOCK RANGE
        // ----------------------------------------------

        if (
          String(
            filters.minStock
          ).trim() !== ""
        ) {
          requestParams.minStock =
            Number(
              filters.minStock
            );
        }

        if (
          String(
            filters.maxStock
          ).trim() !== ""
        ) {
          requestParams.maxStock =
            Number(
              filters.maxStock
            );
        }

        // ----------------------------------------------
        // STOCK STATUS
        // ----------------------------------------------

        if (
          filters.stockStatus &&
          filters.stockStatus !== "all"
        ) {
          requestParams.stockStatus =
            filters.stockStatus;
        }

        // ----------------------------------------------
        // SORT
        // ----------------------------------------------

        requestParams.sortBy =
          filters.sortBy;

        requestParams.sortOrder =
          filters.sortOrder;

        console.log(
          "Product request params:",
          requestParams
        );

        const response =
          await productService.getProducts(
            requestParams
          );

        const result =
          normalizeResponse(response);

        console.log(
          "Products response:",
          result
        );

        if (result?.success) {
          setProducts(
            Array.isArray(result.data)
              ? result.data
              : []
          );

          setPagination(
            result.pagination || {
              page,
              limit,
              total: 0,
              totalPages: 0,
            }
          );

          return true;
        }

        error(
          getResponseMessage(
            response,
            "Unable to load products."
          )
        );

        return false;
      } catch (err) {
        console.error(
          "Load products error:",
          err
        );

        error(
          getErrorMessage(
            err,
            "Unable to load products."
          )
        );

        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      limit,
      search,
      filters,
      error,
    ]
  );

  // ====================================================
  // LOAD CATEGORIES
  // ====================================================

  const loadCategories = useCallback(
    async () => {
      try {
        setCategoryLoading(true);

        const response =
          await categoryService.getCategories({
            page: 1,
            limit: 1000,
          });

        const result =
          normalizeResponse(response);

        console.log(
          "Categories response:",
          result
        );

        if (result?.success) {
          const options =
            (result.data || [])
              .filter(
                (category) =>
                  Boolean(
                    category.isActive
                  )
              )
              .map((category) => ({
                value: category._id,
                label: category.name,
              }));

          setCategories(options);

          return;
        }

        error(
          getResponseMessage(
            response,
            "Unable to load categories."
          )
        );
      } catch (err) {
        console.error(
          "Load categories error:",
          err
        );

        error(
          getErrorMessage(
            err,
            "Unable to load categories."
          )
        );
      } finally {
        setCategoryLoading(false);
      }
    },
    [error]
  );

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // ====================================================
  // SEARCH
  // ====================================================

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);

    setSearch(
      searchInput.trim()
    );
  };

  // ====================================================
  // CLEAR SEARCH
  // ====================================================

  const handleClearSearch = () => {
    setSearchInput("");

    setSearch("");

    setPage(1);
  };

  // ====================================================
  // FILTER CHANGE
  // ====================================================

  const handleFilterChange = (
    name,
    value
  ) => {
    setFilters(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setPage(1);
  };

  // ====================================================
  // RESET FILTERS
  // ====================================================

  const handleResetFilters = () => {
    setFilters(
      getInitialFilters()
    );

    setPage(1);
  };

  // ====================================================
  // APPLY FILTERS
  // ====================================================

  const handleApplyFilters = () => {
    setPage(1);

    setShowFilters(false);

    info(
      "Product filters applied."
    );
  };

  // ====================================================
  // OPEN ADD MODAL
  // ====================================================

  const openAddModal = () => {
    setEditingProduct(null);

    setForm(
      getInitialForm()
    );

    setFormErrors({});

    setShowFormModal(true);
  };

  // ====================================================
  // OPEN EDIT MODAL
  // ====================================================

  const openEditModal = (
    product
  ) => {
    setEditingProduct(product);

    const selectedCategories =
      (product.categories || [])
        .filter(Boolean)
        .map((category) => ({
          value:
            category._id ||
            category.value,

          label:
            category.name ||
            category.label,
        }));

    setForm({
      name:
        product.name || "",

      sku:
        product.sku || "",

      description:
        product.description || "",

      price:
        product.price ?? "",

      stock:
        product.stock ?? 0,

      categories:
        selectedCategories,

      isActive:
        Boolean(product.isActive),
    });

    setFormErrors({});

    setShowFormModal(true);
  };

  // ====================================================
  // CLOSE FORM MODAL
  // ====================================================

  const closeFormModal = () => {
    if (saving) {
      return;
    }

    setShowFormModal(false);

    setEditingProduct(null);

    setForm(
      getInitialForm()
    );

    setFormErrors({});
  };

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // ====================================================
  // CATEGORY CHANGE
  // ====================================================

  const handleCategoryChange = (
    selected
  ) => {
    setForm((previous) => ({
      ...previous,

      categories:
        selected || [],
    }));

    setFormErrors((previous) => ({
      ...previous,
      categories: "",
    }));
  };

  // ====================================================
  // VALIDATE FORM
  // ====================================================

  const validateForm = () => {
    const errors = {};

    const productName =
      form.name.trim();

    const sku =
      form.sku.trim();

    const price =
      String(form.price).trim();

    const stock =
      String(form.stock).trim();

    // ------------------------------------------
    // PRODUCT NAME
    // ------------------------------------------

    if (!productName) {
      errors.name =
        "Product name is required.";
    } else if (
      productName.length < 2
    ) {
      errors.name =
        "Product name must be at least 2 characters.";
    } else if (
      productName.length > 150
    ) {
      errors.name =
        "Product name cannot exceed 150 characters.";
    }

    // ------------------------------------------
    // SKU
    // ------------------------------------------

    if (!sku) {
      errors.sku =
        "SKU is required.";
    } else if (
      sku.length < 2
    ) {
      errors.sku =
        "SKU must be at least 2 characters.";
    } else if (
      sku.length > 100
    ) {
      errors.sku =
        "SKU cannot exceed 100 characters.";
    }

    // ------------------------------------------
    // CATEGORY
    // ------------------------------------------

    if (
      !Array.isArray(
        form.categories
      ) ||
      form.categories.length === 0
    ) {
      errors.categories =
        "Please select at least one category.";
    }

    // ------------------------------------------
    // PRICE
    // ------------------------------------------

    if (price === "") {
      errors.price =
        "Price is required.";
    } else if (
      Number.isNaN(Number(price))
    ) {
      errors.price =
        "Please enter a valid price.";
    } else if (
      Number(price) < 0
    ) {
      errors.price =
        "Price cannot be negative.";
    }

    // ------------------------------------------
    // STOCK
    // ------------------------------------------

    if (stock === "") {
      errors.stock =
        "Stock is required.";
    } else if (
      Number.isNaN(Number(stock))
    ) {
      errors.stock =
        "Please enter a valid stock quantity.";
    } else if (
      Number(stock) < 0
    ) {
      errors.stock =
        "Stock cannot be negative.";
    } else if (
      !Number.isInteger(
        Number(stock)
      )
    ) {
      errors.stock =
        "Stock must be a whole number.";
    }

    return errors;
  };

  // ====================================================
  // SUBMIT PRODUCT
  // ====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors =
      validateForm();

    setFormErrors(errors);

    if (
      Object.keys(errors).length > 0
    ) {
      error(
        Object.values(errors)[0]
      );

      return;
    }

    try {
      setSaving(true);

      const isEdit =
        Boolean(
          editingProduct?._id
        );

      const payload = {
        name:
          form.name.trim(),

        sku:
          form.sku
            .trim()
            .toUpperCase(),

        description:
          form.description.trim(),

        price:
          Number(form.price),

        stock:
          Number(form.stock),

        categories:
          form.categories.map(
            (category) =>
              category.value
          ),

        isActive:
          Boolean(form.isActive),
      };

      console.log(
        "Product payload:",
        payload
      );

      let response;

      if (isEdit) {
        response =
          await productService.updateProduct(
            editingProduct._id,
            payload
          );
      } else {
        response =
          await productService.createProduct(
            payload
          );
      }

      const result =
        normalizeResponse(response);

      console.log(
        "Save product response:",
        result
      );

      if (result?.success) {
        const message =
          getResponseMessage(
            response,
            isEdit
              ? "Product updated successfully."
              : "Product created successfully."
          );

        setShowFormModal(false);

        setEditingProduct(null);

        setForm(
          getInitialForm()
        );

        setFormErrors({});

        success(message);

        await loadProducts();

        return;
      }

      error(
        getResponseMessage(
          response,
          isEdit
            ? "Unable to update product."
            : "Unable to create product."
        )
      );
    } catch (err) {
      console.error(
        "Save product error:",
        err
      );

      error(
        getErrorMessage(
          err,
          editingProduct
            ? "Unable to update product."
            : "Unable to create product."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // OPEN DELETE MODAL
  // ====================================================

  const openDeleteModal = (
    product
  ) => {
    setSelectedProduct(product);

    setShowDeleteModal(true);
  };

  // ====================================================
  // CLOSE DELETE MODAL
  // ====================================================

  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);

    setSelectedProduct(null);
  };

  // ====================================================
  // DELETE PRODUCT
  // ====================================================

  const handleDelete = async () => {
    if (!selectedProduct?._id) {
      error(
        "Product could not be identified."
      );

      return;
    }

    try {
      setDeleting(true);

      const response =
        await productService.deleteProduct(
          selectedProduct._id
        );

      const result =
        normalizeResponse(response);

      console.log(
        "Delete response:",
        result
      );

      if (result?.success) {
        const message =
          getResponseMessage(
            response,
            "Product deleted successfully."
          );

        setShowDeleteModal(false);

        setSelectedProduct(null);

        success(message);

        if (
          products.length === 1 &&
          page > 1
        ) {
          setPage(
            (previous) =>
              previous - 1
          );
        } else {
          await loadProducts();
        }

        return;
      }

      error(
        getResponseMessage(
          response,
          "Unable to delete product."
        )
      );
    } catch (err) {
      console.error(
        "Delete product error:",
        err
      );

      error(
        getErrorMessage(
          err,
          "Unable to delete product."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  // ====================================================
  // OPEN STATUS MODAL
  // ====================================================

  const openStatusModal = (
    product
  ) => {
    setSelectedProduct(product);

    setShowStatusModal(true);
  };

  // ====================================================
  // CLOSE STATUS MODAL
  // ====================================================

  const closeStatusModal = () => {
    if (changingStatus) {
      return;
    }

    setShowStatusModal(false);

    setSelectedProduct(null);
  };

  // ====================================================
  // CHANGE STATUS
  // ====================================================

  const handleStatusChange =
    async () => {
      if (!selectedProduct?._id) {
        error(
          "Product could not be identified."
        );

        return;
      }

      try {
        setChangingStatus(true);

        const newStatus =
          !Boolean(
            selectedProduct.isActive
          );

        const response =
          await productService.changeStatus(
            selectedProduct._id,
            newStatus
          );

        const result =
          normalizeResponse(response);

        console.log(
          "Status response:",
          result
        );

        if (result?.success) {
          const message =
            getResponseMessage(
              response,
              newStatus
                ? "Product activated successfully."
                : "Product deactivated successfully."
            );

          setShowStatusModal(false);

          setSelectedProduct(null);

          success(message);

          await loadProducts();

          return;
        }

        error(
          getResponseMessage(
            response,
            "Unable to change product status."
          )
        );
      } catch (err) {
        console.error(
          "Change status error:",
          err
        );

        error(
          getErrorMessage(
            err,
            "Unable to change product status."
          )
        );
      } finally {
        setChangingStatus(false);
      }
    };

  // ====================================================
  // FORMAT PRICE
  // ====================================================

  const formatPrice = (
    price
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(
      Number(price) || 0
    );
  };

  // ====================================================
  // SORT LABEL
  // ====================================================

  const getSortLabel = () => {
    const labels = {
      name: "Product Name",
      sku: "SKU",
      price: "Price",
      stock: "Stock",
      isActive: "Status",
      createdAt: "Created Date",
    };

    return (
      labels[filters.sortBy] ||
      "Created Date"
    );
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage products, categories,
            pricing and stock.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Add Product
        </button>

      </div>

      {/* ==================================================
          SEARCH + FILTER TOOLBAR
      ================================================== */}

      <div className="mb-5 rounded-xl bg-white p-4 shadow-sm">

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 lg:flex-row"
        >

          {/* SEARCH */}

          <div className="flex-1">

            <input
              type="text"
              value={searchInput}
              onChange={(e) =>
                setSearchInput(
                  e.target.value
                )
              }
              placeholder="Search by product name or SKU..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

          </div>

          {/* SEARCH BUTTON */}

          <button
            type="submit"
            className="rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            Search
          </button>

          {/* CLEAR SEARCH */}

          {(search ||
            searchInput) && (
            <button
              type="button"
              onClick={
                handleClearSearch
              }
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          )}

          {/* FILTER BUTTON */}

          <button
            type="button"
            onClick={() =>
              setShowFilters(
                (previous) =>
                  !previous
              )
            }
            className={`relative rounded-lg border px-5 py-2.5 text-sm font-semibold transition ${
              showFilters ||
              activeFilterCount > 0
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>
              Filters
            </span>

            {activeFilterCount >
              0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                {
                  activeFilterCount
                }
              </span>
            )}
          </button>

        </form>

        {/* ==================================================
            ADVANCED FILTER PANEL
        ================================================== */}

        {showFilters && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">

            {/* FILTER HEADER */}

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  Advanced Filters
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Narrow down products
                  using multiple
                  conditions.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Reset Filters
              </button>

            </div>

            {/* FILTER GRID */}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              {/* STATUS */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </label>

                <select
                  value={
                    filters.status
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "status",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">
                    All Status
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>

              {/* CATEGORY */}

              <div className="md:col-span-2 xl:col-span-2">

                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Categories
                </label>

                <Select
                  isMulti
                  isClearable
                  isLoading={
                    categoryLoading
                  }
                  options={
                    categoryFilterOptions
                  }
                  value={
                    filters.categories
                  }
                  onChange={(selected) =>
                    handleFilterChange(
                      "categories",
                      selected || []
                    )
                  }
                  placeholder="Filter by categories..."
                  closeMenuOnSelect={
                    false
                  }
                  className="text-sm"
                  classNamePrefix="filter-select"
                />

              </div>

              {/* STOCK STATUS */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Stock Status
                </label>

                <select
                  value={
                    filters.stockStatus
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "stockStatus",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">
                    All Stock
                  </option>

                  <option value="in-stock">
                    In Stock
                  </option>

                  <option value="low-stock">
                    Low Stock
                  </option>

                  <option value="out-of-stock">
                    Out of Stock
                  </option>
                </select>
              </div>

              {/* MIN PRICE */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Minimum Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    filters.minPrice
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "minPrice",
                      e.target.value
                    )
                  }
                  placeholder="₹ Min"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* MAX PRICE */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Maximum Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    filters.maxPrice
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "maxPrice",
                      e.target.value
                    )
                  }
                  placeholder="₹ Max"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* MIN STOCK */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Minimum Stock
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    filters.minStock
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "minStock",
                      e.target.value
                    )
                  }
                  placeholder="Min stock"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* MAX STOCK */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Maximum Stock
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    filters.maxStock
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "maxStock",
                      e.target.value
                    )
                  }
                  placeholder="Max stock"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* SORT BY */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Sort By
                </label>

                <select
                  value={
                    filters.sortBy
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "sortBy",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="createdAt">
                    Created Date
                  </option>

                  <option value="name">
                    Product Name
                  </option>

                  <option value="sku">
                    SKU
                  </option>

                  <option value="price">
                    Price
                  </option>

                  <option value="stock">
                    Stock
                  </option>

                  <option value="isActive">
                    Status
                  </option>
                </select>
              </div>

              {/* SORT ORDER */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Sort Order
                </label>

                <select
                  value={
                    filters.sortOrder
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "sortOrder",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="desc">
                    Descending
                  </option>

                  <option value="asc">
                    Ascending
                  </option>
                </select>
              </div>

            </div>

            {/* FILTER ACTIONS */}

            <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="text-xs text-gray-500">
                {activeFilterCount >
                0 ? (
                  <>
                    {
                      activeFilterCount
                    }{" "}
                    filter
                    {activeFilterCount !==
                    1
                      ? "s"
                      : ""}{" "}
                    active
                  </>
                ) : (
                  "No filters applied"
                )}
              </div>

              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={
                    handleResetFilters
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={
                    handleApplyFilters
                  }
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Apply Filters
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ==================================================
            ACTIVE FILTER SUMMARY
        ================================================== */}

        {activeFilterCount >
          0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">

            <span className="text-xs font-semibold text-gray-500">
              Active:
            </span>

            {filters.status !==
              "all" && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Status:{" "}
                {filters.status ===
                "active"
                  ? "Active"
                  : "Inactive"}
              </span>
            )}

            {filters.categories
              .length > 0 && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Categories:{" "}
                {
                  filters
                    .categories
                    .length
                }
              </span>
            )}

            {filters.minPrice !==
              "" && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                Min Price:{" "}
                {formatPrice(
                  filters.minPrice
                )}
              </span>
            )}

            {filters.maxPrice !==
              "" && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                Max Price:{" "}
                {formatPrice(
                  filters.maxPrice
                )}
              </span>
            )}

            {filters.minStock !==
              "" && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                Min Stock:{" "}
                {
                  filters.minStock
                }
              </span>
            )}

            {filters.maxStock !==
              "" && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                Max Stock:{" "}
                {
                  filters.maxStock
                }
              </span>
            )}

            {filters.stockStatus !==
              "all" && (
              <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
                Stock:{" "}
                {filters.stockStatus
                  .replace(
                    "-",
                    " "
                  )
                  .replace(
                    /\b\w/g,
                    (char) =>
                      char.toUpperCase()
                  )}
              </span>
            )}

            {(filters.sortBy !==
              "createdAt" ||
              filters.sortOrder !==
                "desc") && (
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                Sort:{" "}
                {getSortLabel()}{" "}
                (
                {filters.sortOrder ===
                "asc"
                  ? "ASC"
                  : "DESC"}
                )
              </span>
            )}

          </div>
        )}

      </div>

      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  #
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Product
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  SKU
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Categories
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Price
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Stock
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading products...
                  </td>
                </tr>
              )}

              {!loading &&
                products.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-5 py-12 text-center"
                    >
                      <div className="text-gray-400">
                        No products found.
                      </div>

                      <button
                        type="button"
                        onClick={
                          openAddModal
                        }
                        className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Create your
                        first
                        product
                      </button>
                    </td>
                  </tr>
                )}

              {!loading &&
                products.map(
                  (
                    product,
                    index
                  ) => (
                    <tr
                      key={
                        product._id
                      }
                      className="transition hover:bg-gray-50"
                    >

                      {/* NUMBER */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {(page - 1) *
                          limit +
                          index +
                          1}
                      </td>

                      {/* PRODUCT */}

                      <td className="px-5 py-4">

                        <div className="font-medium text-gray-800">
                          {
                            product.name
                          }
                        </div>

                        {product.description && (
                          <div className="mt-1 max-w-xs truncate text-xs text-gray-400">
                            {
                              product.description
                            }
                          </div>
                        )}

                      </td>

                      {/* SKU */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-600">
                        {
                          product.sku
                        }
                      </td>

                      {/* CATEGORIES */}

                      <td className="px-5 py-4">

                        <div className="flex max-w-xs flex-wrap gap-1">

                          {(
                            product.categories ||
                            []
                          ).map(
                            (
                              category
                            ) => (
                              <span
                                key={
                                  category._id
                                }
                                className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                              >
                                {
                                  category.name
                                }
                              </span>
                            )
                          )}

                        </div>

                      </td>

                      {/* PRICE */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-700">
                        {formatPrice(
                          product.price
                        )}
                      </td>

                      {/* STOCK */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <span
                          className={`text-sm font-semibold ${
                            Number(
                              product.stock
                            ) ===
                            0
                              ? "text-red-600"
                              : Number(
                                    product.stock
                                  ) <=
                                  10
                              ? "text-orange-600"
                              : "text-gray-600"
                          }`}
                        >
                          {
                            product.stock
                          }
                        </span>

                        {Number(
                          product.stock
                        ) === 0 && (
                          <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                            Out
                          </span>
                        )}

                        {Number(
                          product.stock
                        ) > 0 &&
                          Number(
                            product.stock
                          ) <= 10 && (
                            <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                              Low
                            </span>
                          )}

                      </td>

                      {/* STATUS */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            openStatusModal(
                              product
                            )
                          }
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            product.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {product.isActive
                            ? "Active"
                            : "Inactive"}
                        </button>

                      </td>

                      {/* ACTIONS */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                product
                              )
                            }
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openDeleteModal(
                                product
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

            </tbody>

          </table>

        </div>

        {/* ==================================================
            PAGINATION
        ================================================== */}

        {!loading &&
          products.length > 0 && (
            <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="text-sm text-gray-500">

                Showing{" "}

                <span className="font-medium text-gray-700">
                  {(page - 1) *
                    limit +
                    1}
                </span>

                {" "}to{" "}

                <span className="font-medium text-gray-700">
                  {Math.min(
                    page * limit,
                    pagination.total
                  )}
                </span>

                {" "}of{" "}

                <span className="font-medium text-gray-700">
                  {
                    pagination.total
                  }
                </span>

              </div>

              <div className="flex items-center gap-1">

                <button
                  type="button"
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    setPage(
                      (previous) =>
                        Math.max(
                          previous - 1,
                          1
                        )
                    )
                  }
                  className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  {
                    length:
                      pagination.totalPages,
                  },
                  (_, index) =>
                    index + 1
                )
                  .filter(
                    (pageNumber) =>
                      pageNumber ===
                        1 ||
                      pageNumber ===
                        pagination.totalPages ||
                      Math.abs(
                        pageNumber -
                          page
                      ) <= 1
                  )
                  .map(
                    (
                      pageNumber,
                      index,
                      array
                    ) => {

                      const previous =
                        array[
                          index - 1
                        ];

                      const showDots =
                        previous &&
                        pageNumber -
                          previous >
                          1;

                      return (
                        <div
                          key={
                            pageNumber
                          }
                          className="flex"
                        >

                          {showDots && (
                            <span className="px-2 py-2 text-gray-400">
                              ...
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setPage(
                                pageNumber
                              )
                            }
                            className={`rounded-lg px-3 py-2 text-sm ${
                              page ===
                              pageNumber
                                ? "bg-indigo-600 text-white"
                                : "border text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {
                              pageNumber
                            }
                          </button>

                        </div>
                      );
                    }
                  )}

                <button
                  type="button"
                  disabled={
                    page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (previous) =>
                        Math.min(
                          previous + 1,
                          pagination.totalPages
                        )
                    )
                  }
                  className="rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>

              </div>

            </div>
          )}

      </div>

      {/* ==================================================
          ADD / EDIT MODAL
      ================================================== */}

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-gray-800">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingProduct
                    ? "Update product information."
                    : "Create a new product."}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeFormModal
                }
                disabled={saving}
                className="text-2xl text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-6"
            >

              {/* PRODUCT NAME */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Product Name
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  placeholder="Enter product name"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-gray-100 ${
                    formErrors.name
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />

                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      formErrors.name
                    }
                  </p>
                )}

              </div>

              {/* SKU */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  SKU
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  type="text"
                  name="sku"
                  value={
                    form.sku
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  placeholder="e.g. IPHONE-15"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm uppercase outline-none focus:ring-2 disabled:bg-gray-100 ${
                    formErrors.sku
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />

                {formErrors.sku && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      formErrors.sku
                    }
                  </p>
                )}

              </div>

              {/* CATEGORIES */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Categories
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <Select
                  isMulti
                  isLoading={
                    categoryLoading
                  }
                  options={
                    categories
                  }
                  value={
                    form.categories
                  }
                  onChange={
                    handleCategoryChange
                  }
                  placeholder="Select categories..."
                  closeMenuOnSelect={
                    false
                  }
                  isDisabled={
                    saving
                  }
                  className="text-sm"
                  classNamePrefix="product-select"
                />

                {formErrors.categories && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      formErrors.categories
                    }
                  </p>
                )}

              </div>

              {/* PRICE / STOCK */}

              <div className="grid gap-5 md:grid-cols-2">

                {/* PRICE */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Price
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={
                      form.price
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-gray-100 ${
                      formErrors.price
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
                    }`}
                  />

                  {formErrors.price && (
                    <p className="mt-1 text-xs text-red-600">
                      {
                        formErrors.price
                      }
                    </p>
                  )}

                </div>

                {/* STOCK */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Stock
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <input
                    type="number"
                    name="stock"
                    value={
                      form.stock
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    min="0"
                    step="1"
                    placeholder="0"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-gray-100 ${
                      formErrors.stock
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100"
                    }`}
                  />

                  {formErrors.stock && (
                    <p className="mt-1 text-xs text-red-600">
                      {
                        formErrors.stock
                      }
                    </p>
                  )}

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  rows="4"
                  placeholder="Enter product description..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                />

              </div>

              {/* STATUS */}

              <div className="flex items-center gap-3">

                <input
                  type="checkbox"
                  id="product-status"
                  name="isActive"
                  checked={
                    form.isActive
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />

                <label
                  htmlFor="product-status"
                  className="text-sm font-medium text-gray-700"
                >
                  Active Product
                </label>

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  onClick={
                    closeFormModal
                  }
                  disabled={
                    saving
                  }
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Create Product"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ==================================================
          DELETE MODAL
      ================================================== */}

      {showDeleteModal &&
        selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

              <div className="mb-5">

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600">
                  !
                </div>

                <h2 className="text-xl font-bold text-gray-800">
                  Delete Product?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Are you sure you want
                  to delete{" "}
                  <span className="font-semibold text-gray-700">
                    {
                      selectedProduct.name
                    }
                  </span>
                  ?
                  <br />
                  This action cannot be
                  undone.
                </p>

              </div>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    closeDeleteModal
                  }
                  disabled={
                    deleting
                  }
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleDelete
                  }
                  disabled={
                    deleting
                  }
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete Product"}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ==================================================
          STATUS MODAL
      ================================================== */}

      {showStatusModal &&
        selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

              <div className="mb-5">

                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
                    selectedProduct.isActive
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {selectedProduct.isActive
                    ? "!"
                    : "✓"}
                </div>

                <h2 className="text-xl font-bold text-gray-800">
                  {selectedProduct.isActive
                    ? "Deactivate Product?"
                    : "Activate Product?"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Are you sure you want
                  to{" "}
                  {selectedProduct.isActive
                    ? "deactivate"
                    : "activate"}{" "}
                  <span className="font-semibold text-gray-700">
                    {
                      selectedProduct.name
                    }
                  </span>
                  ?
                </p>

              </div>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    closeStatusModal
                  }
                  disabled={
                    changingStatus
                  }
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleStatusChange
                  }
                  disabled={
                    changingStatus
                  }
                  className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                    selectedProduct.isActive
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {changingStatus
                    ? "Updating..."
                    : selectedProduct.isActive
                    ? "Deactivate"
                    : "Activate"}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
};

export default ProductPage;