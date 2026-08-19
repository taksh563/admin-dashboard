import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
  Loader2,
  AlertCircle,
} from "lucide-react";

import productService from "../../services/product.service";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../utils/errorMessage";

// ==========================================================
// CONSTANTS
// ==========================================================

const INITIAL_FORM = {
  name: "",
  sku: "",
  description: "",
  price: "",
  stock: "",
  categories: [],
  isActive: true,
};

const INITIAL_FILTERS = {
  search: "",
  status: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  minStock: "",
  maxStock: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const PAGE_LIMIT = 10;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

// ==========================================================
// HELPERS
// ==========================================================

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return String(value._id || value.id || "");
};

const getCategoryName = (category) => {
  if (!category) return "";

  if (typeof category === "string") {
    return category;
  }

  return category.name || "";
};

const getImageUrl = (image) => {
  if (!image) return "";

  const rawUrl =
    typeof image === "string"
      ? image
      : image.url || image.path || "";

  if (!rawUrl) {
    return "";
  }

  // Blob URL
  if (rawUrl.startsWith("blob:")) {
    return rawUrl;
  }

  // Already complete URL
  if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://")
  ) {
    return rawUrl;
  }

  const baseURL =
    api.defaults?.baseURL ||
    "http://localhost:5000/api";

  const serverURL = baseURL.replace(
    /\/api\/?$/,
    ""
  );

  if (rawUrl.startsWith("/")) {
    return `${serverURL}${rawUrl}`;
  }

  return `${serverURL}/${rawUrl}`;
};

const formatCurrency = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "₹0.00";
  }

  return number.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
};

const normalizeProduct = (product) => {
  if (!product) {
    return null;
  }

  return {
    ...product,

    _id:
      product._id ||
      product.id ||
      "",

    categories: Array.isArray(product.categories)
      ? product.categories
      : [],

    images: Array.isArray(product.images)
      ? product.images
      : [],
  };
};

// ==========================================================
// COMPONENT
// ==========================================================

const ProductPage = () => {
  const { showToast } = useToast();

  // ========================================================
  // PRODUCT DATA
  // ========================================================

  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);

  const [categoriesLoading, setCategoriesLoading] =
    useState(false);

  const [error, setError] = useState("");

  // ========================================================
  // PAGINATION
  // ========================================================

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
  });

  // ========================================================
  // FILTERS
  // ========================================================

  const [filters, setFilters] =
    useState(INITIAL_FILTERS);

  const [searchInput, setSearchInput] =
    useState("");

  // ========================================================
  // FORM
  // ========================================================

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [formErrors, setFormErrors] =
    useState({});

  const [editingProduct, setEditingProduct] =
    useState(null);

  // ========================================================
  // IMAGE STATES
  // ========================================================

  const [selectedFiles, setSelectedFiles] =
    useState([]);

  const [previewImages, setPreviewImages] =
    useState([]);

  const [existingImages, setExistingImages] =
    useState([]);

  const fileInputRef = useRef(null);

  // ========================================================
  // MODALS
  // ========================================================

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [showStatusModal, setShowStatusModal] =
    useState(false);

  const [showImageDeleteModal, setShowImageDeleteModal] =
    useState(false);

  // ========================================================
  // SELECTED DATA
  // ========================================================

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [selectedImage, setSelectedImage] =
    useState(null);

  // ========================================================
  // ACTION LOADING
  // ========================================================

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [changingStatus, setChangingStatus] =
    useState(false);

  const [imageActionLoading, setImageActionLoading] =
    useState(false);

  // ========================================================
  // CLEANUP PREVIEW URLS
  // ========================================================

  const cleanupPreviewUrls = useCallback(() => {
    previewImages.forEach((preview) => {
      if (
        preview?.url &&
        preview.url.startsWith("blob:")
      ) {
        URL.revokeObjectURL(preview.url);
      }
    });
  }, [previewImages]);

  // ========================================================
  // FETCH CATEGORIES
  // ========================================================

  const fetchCategories = useCallback(
    async () => {
      try {
        setCategoriesLoading(true);

        const response = await api.get(
          "/categories",
          {
            params: {
              page: 1,
              limit: 100,
              status: "active",
            },
          }
        );

        if (response.data?.success) {
          const categoryData =
            response.data.data || [];

          setCategories(
            Array.isArray(categoryData)
              ? categoryData
              : []
          );
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error(
          "Fetch categories error:",
          err
        );

        setCategories([]);

          showToast({
          type: "success",
          message:getErrorMessage(err) ||
            "Unable to load categories.",
        });

        
      } finally {
        setCategoriesLoading(false);
      }
    },
    [showToast]
  );

  // ========================================================
  // FETCH PRODUCTS
  // ========================================================

  const fetchProducts = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: PAGE_LIMIT,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        };

        if (filters.search.trim()) {
          params.search =
            filters.search.trim();
        }

        if (filters.status) {
          params.status =
            filters.status;
        }

        if (filters.category) {
          params.category =
            filters.category;
        }

        if (filters.minPrice !== "") {
          params.minPrice =
            filters.minPrice;
        }

        if (filters.maxPrice !== "") {
          params.maxPrice =
            filters.maxPrice;
        }

        if (filters.minStock !== "") {
          params.minStock =
            filters.minStock;
        }

        if (filters.maxStock !== "") {
          params.maxStock =
            filters.maxStock;
        }

        const response =
          await productService.getProducts(
            params
          );

        if (response?.success) {
          const data =
            response.data || [];

          setProducts(
            Array.isArray(data)
              ? data
                  .map(normalizeProduct)
                  .filter(Boolean)
              : []
          );

          setPagination(
            response.pagination || {
              page,
              limit: PAGE_LIMIT,
              total: 0,
              totalPages: 0,
            }
          );
        } else {
          setProducts([]);

          setError(
            response?.message ||
              "Unable to load products."
          );
        }
      } catch (err) {
        console.error(
          "Fetch products error:",
          err
        );

        const message =
          err.response?.data?.message ||
          getErrorMessage(err) ||
          "Unable to load products.";

        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [page, filters]
  );

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ========================================================
  // SEARCH
  // ========================================================

  const handleSearch = (e) => {
    e.preventDefault();

    setFilters((previous) => ({
      ...previous,
      search: searchInput,
    }));

    setPage(1);
  };

  // ========================================================
  // RESET FILTERS
  // ========================================================

  const handleResetFilters = () => {
    setSearchInput("");

    setFilters({
      ...INITIAL_FILTERS,
    });

    setPage(1);
  };

  // ========================================================
  // FORM INPUT
  // ========================================================

  const handleInputChange = (e) => {
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

  // ========================================================
  // CATEGORY SELECTION
  // ========================================================

  const handleCategoryChange = (
    categoryId
  ) => {
    setForm((previous) => {
      const exists =
        previous.categories.includes(
          categoryId
        );

      return {
        ...previous,

        categories: exists
          ? previous.categories.filter(
              (id) =>
                id !== categoryId
            )
          : [
              ...previous.categories,
              categoryId,
            ],
      };
    });

    setFormErrors((previous) => ({
      ...previous,
      categories: "",
    }));
  };

  // ========================================================
  // FILE SELECTION
  // ========================================================

  const handleFileChange = (e) => {
    const files = Array.from(
      e.target.files || []
    );

    if (!files.length) {
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(
          file.type
        )
      ) {

          showToast({
          type: "error",
          message:`${file.name}: Only JPG, JPEG, PNG and WEBP images are allowed.`,
        });

        

        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
       
         showToast({
          type: "error",
          message:`${file.name}: Maximum file size is 5 MB.`,
        });

        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      e.target.value = "";
      return;
    }

    const currentImageCount =
      existingImages.length +
      selectedFiles.length;

    const availableSlots =
      MAX_IMAGES -
      currentImageCount;

    if (availableSlots <= 0) {
       showToast({
          type: "error",
          message:"Maximum 10 images are allowed per product.",
        });

      

      e.target.value = "";
      return;
    }

    const filesToAdd =
      validFiles.slice(
        0,
        availableSlots
      );

    if (
      validFiles.length >
      availableSlots
    ) {

      showToast({
          type: "error",
          message:`Only ${availableSlots} more image${
          availableSlots === 1
            ? ""
            : "s"
        } can be added.`,
        });

     
    }

    setSelectedFiles((previous) => [
      ...previous,
      ...filesToAdd,
    ]);

    const newPreviews =
      filesToAdd.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
      }));

    setPreviewImages((previous) => [
      ...previous,
      ...newPreviews,
    ]);

    setFormErrors((previous) => ({
      ...previous,
      images: "",
    }));

    e.target.value = "";
  };

  // ========================================================
  // REMOVE NEW IMAGE
  // ========================================================

  const handleRemoveSelectedImage = (
    index
  ) => {
    const preview =
      previewImages[index];

    if (
      preview?.url &&
      preview.url.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        preview.url
      );
    }

    setPreviewImages((previous) =>
      previous.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );

    setSelectedFiles((previous) =>
      previous.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );
  };

  // ========================================================
  // VALIDATE FORM
  // ========================================================

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name =
        "Product name is required.";
    }

    if (!form.sku.trim()) {
      errors.sku =
        "SKU is required.";
    }

    if (
      form.price === "" ||
      Number.isNaN(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      errors.price =
        "Please enter a valid price.";
    }

    if (
      form.stock === "" ||
      Number.isNaN(Number(form.stock)) ||
      Number(form.stock) < 0 ||
      !Number.isInteger(
        Number(form.stock)
      )
    ) {
      errors.stock =
        "Stock must be a valid whole number.";
    }

    if (
      !Array.isArray(
        form.categories
      ) ||
      form.categories.length === 0
    ) {
      errors.categories =
        "Please select at least one category.";
    }

    const totalImages =
      existingImages.length +
      selectedFiles.length;

    if (
      !editingProduct &&
      selectedFiles.length === 0
    ) {
      errors.images =
        "Please upload at least one product image.";
    }

    if (
      totalImages > MAX_IMAGES
    ) {
      errors.images =
        "Maximum 10 images are allowed.";
    }

    setFormErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  };

  // ========================================================
  // OPEN CREATE MODAL
  // ========================================================

  const handleAddProduct = () => {
    cleanupPreviewUrls();

    setEditingProduct(null);

    setForm({
      ...INITIAL_FORM,
    });

    setFormErrors({});

    setSelectedFiles([]);

    setPreviewImages([]);

    setExistingImages([]);

    setSelectedProduct(null);

    setShowFormModal(true);
  };

  // ========================================================
  // OPEN EDIT MODAL
  // ========================================================

  const handleEditProduct = (
    product
  ) => {
    cleanupPreviewUrls();

    setEditingProduct(product);

    setForm({
      name: product.name || "",

      sku: product.sku || "",

      description:
        product.description || "",

      price:
        product.price ?? "",

      stock:
        product.stock ?? "",

      categories:
        Array.isArray(
          product.categories
        )
          ? product.categories.map(
              getId
            )
          : [],

      isActive:
        Boolean(
          product.isActive
        ),
    });

    setExistingImages(
      Array.isArray(product.images)
        ? product.images
        : []
    );

    setSelectedFiles([]);

    setPreviewImages([]);

    setFormErrors({});

    setShowFormModal(true);
  };

  // ========================================================
  // CLOSE FORM MODAL
  // ========================================================

  const closeFormModal = () => {
    if (saving) {
      return;
    }

    cleanupPreviewUrls();

    setShowFormModal(false);

    setEditingProduct(null);

    setForm({
      ...INITIAL_FORM,
    });

    setFormErrors({});

    setSelectedFiles([]);

    setPreviewImages([]);

    setExistingImages([]);
  };

  // ========================================================
  // SUBMIT PRODUCT
  // ========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),

        sku: form.sku
          .trim()
          .toUpperCase(),

        description:
          form.description.trim(),

        price: Number(form.price),

        stock: Number(form.stock),

        categories:
          form.categories,

        isActive:
          Boolean(form.isActive),

        images:
          selectedFiles,
      };

      let response;

      if (editingProduct) {
        response =
          await productService.updateProduct(
            getId(editingProduct),
            payload
          );
      } else {
        response =
          await productService.createProduct(
            payload
          );
      }

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to save product."
        );
      }

      // IMPORTANT:
      // ToastContext expects message + type.
      showToast({
        type:"success",
        message:editingProduct
          ? "Product updated successfully."
          : "Product created successfully.",
        
    });

      closeFormModal();

      await fetchProducts();
    } catch (err) {
      console.error(
        "Save product error:",
        err
      );

      const message =
        err.response?.data?.message ||
        getErrorMessage(err) ||
        err.message ||
        "Unable to save product.";

         showToast({
          type: "error",
          message:message
        });
     
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // VIEW PRODUCT
  // ========================================================

  const handleViewProduct = (
    product
  ) => {
    setSelectedProduct(
      normalizeProduct(product)
    );

    setShowViewModal(true);
  };

  // ========================================================
  // DELETE PRODUCT
  // ========================================================

  const handleDeleteProduct = (
    product
  ) => {
    setSelectedProduct(
      normalizeProduct(product)
    );

    setShowDeleteModal(true);
  };

  const confirmDeleteProduct =
    async () => {
      if (!selectedProduct) {
        return;
      }

      try {
        setDeleting(true);

        const response =
          await productService.deleteProduct(
            getId(selectedProduct)
          );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to delete product."
          );
        }

      
        showToast({
        type:"error",
        message:response.message ||
            "Product deleted successfully.",
        
    });

        setShowDeleteModal(false);

        setSelectedProduct(null);

        if (
          products.length === 1 &&
          page > 1
        ) {
          setPage(
            (previous) =>
              previous - 1
          );
        } else {
          await fetchProducts();
        }
      } catch (err) {
        console.error(
          "Delete product error:",
          err
        );

         showToast({
        type:"error",
        message:err.response?.data?.message ||
            getErrorMessage(err) ||
            "Unable to delete product.",
        
    });

        
      } finally {
        setDeleting(false);
      }
    };

  // ========================================================
  // CHANGE STATUS
  // ========================================================

  const handleStatusClick = (
    product
  ) => {
    setSelectedProduct(
      normalizeProduct(product)
    );

    setShowStatusModal(true);
  };

  const confirmChangeStatus =
    async () => {
      if (!selectedProduct) {
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
            getId(selectedProduct),
            newStatus
          );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to change product status."
          );
        }

         showToast({
          type: "success",
          message:
            response?.data?.message ||
             response.message ||
            "Product status updated successfully.",
        });

       

        setShowStatusModal(false);

        setSelectedProduct(null);

        await fetchProducts();
      } catch (err) {
        console.error(
          "Change status error:",
          err
        );

         showToast({
          type: "success",
          message:err.response?.data?.message ||
            getErrorMessage(err) ||
            "Unable to change product status.",
        });

       

       
      } finally {
        setChangingStatus(false);
      }
    };

  // ========================================================
  // DELETE EXISTING IMAGE
  // ========================================================

  const handleDeleteImage = (
    image
  ) => {
    setSelectedImage(image);

    setShowImageDeleteModal(true);
  };

  const confirmDeleteImage =
    async () => {
      if (
        !editingProduct ||
        !selectedImage
      ) {
        return;
      }

      try {
        setImageActionLoading(true);

        const response =
          await productService.deleteProductImage(
            getId(editingProduct),
            getId(selectedImage)
          );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to delete image."
          );
        }

        if (
          Array.isArray(
            response.data
          )
        ) {
          setExistingImages(
            response.data
          );
        } else {
          setExistingImages(
            (previous) =>
              previous.filter(
                (image) =>
                  getId(image) !==
                  getId(
                    selectedImage
                  )
              )
          );
        }

        showToast({
          type: "success",
          message:response.message ||
            "Product image deleted successfully.",
        });
       
        

        setShowImageDeleteModal(
          false
        );

        setSelectedImage(null);

        await fetchProducts();
      } catch (err) {
        console.error(
          "Delete product image error:",
          err
        );

         showToast({
          type: "success",
          message:err.response?.data?.message ||
            getErrorMessage(err) ||
            "Unable to delete image.",
        });

       
      } finally {
        setImageActionLoading(false);
      }
    };

  // ========================================================
  // SET PRIMARY IMAGE
  // ========================================================

  const handleSetPrimaryImage =
    async (image) => {
      if (
        !editingProduct ||
        !image ||
        image.isPrimary
      ) {
        return;
      }

      try {
        setImageActionLoading(true);

        const response =
          await productService.setPrimaryProductImage(
            getId(editingProduct),
            getId(image)
          );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to set primary image."
          );
        }

        if (
          Array.isArray(
            response.data
          )
        ) {
          setExistingImages(
            response.data
          );
        } else {
          setExistingImages(
            (previous) =>
              previous.map(
                (item) => ({
                  ...item,
                  isPrimary:
                    getId(item) ===
                    getId(image),
                })
              )
          );
        }

          showToast({
          type: "success",
          message:response.message ||
            "Primary image updated successfully.",
        });

       

        await fetchProducts();
      } catch (err) {
        console.error(
          "Set primary image error:",
          err
        );

          showToast({
          type: "success",
          message:err.response?.data?.message ||
            getErrorMessage(err) ||
            "Unable to set primary image.",
        });

        
      } finally {
        setImageActionLoading(false);
      }
    };

  // ========================================================
  // ADD MORE IMAGES
  // ========================================================

  const handleAddMoreImages = () => {
    fileInputRef.current?.click();
  };

  // ========================================================
  // PAGINATION
  // ========================================================

  const totalPages =
    Number(
      pagination.totalPages
    ) || 0;

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(
        (previous) =>
          previous - 1
      );
    }
  };

  const handleNextPage = () => {
    if (
      totalPages > 0 &&
      page < totalPages
    ) {
      setPage(
        (previous) =>
          previous + 1
      );
    }
  };

  // ========================================================
  // PAGE NUMBERS
  // ========================================================

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) =>
          index + 1
      );
    }

    const pages = [];

    pages.push(1);

    if (page > 3) {
      pages.push("...");
    }

    const start =
      Math.max(2, page - 1);

    const end =
      Math.min(
        totalPages - 1,
        page + 1
      );

    for (
      let number = start;
      number <= end;
      number++
    ) {
      pages.push(number);
    }

    if (
      page <
      totalPages - 2
    ) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  // ========================================================
  // PRODUCT PRIMARY IMAGE
  // ========================================================

  const getProductImage = (
    product
  ) => {
    if (
      !product ||
      !Array.isArray(
        product.images
      ) ||
      product.images.length === 0
    ) {
      return "";
    }

    const primary =
      product.images.find(
        (image) =>
          image?.isPrimary
      );

    return getImageUrl(
      primary ||
        product.images[0]
    );
  };

  // ========================================================
  // IMAGE COUNT
  // ========================================================

  const imageCount =
    existingImages.length +
    selectedFiles.length;

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage products, categories,
            images and inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleAddProduct
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />

          Add Product
        </button>
      </div>

      {/* ==================================================
          FILTER CARD
      ================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
        >
          {/* SEARCH */}

          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Search
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(e) =>
                  setSearchInput(
                    e.target.value
                  )
                }
                placeholder="Search name, SKU..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* STATUS */}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Status
            </label>

            <select
              value={
                filters.status
              }
              onChange={(e) => {
                setFilters(
                  (previous) => ({
                    ...previous,
                    status:
                      e.target.value,
                  })
                );

                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
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

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Category
            </label>

            <select
              value={
                filters.category
              }
              onChange={(e) => {
                setFilters(
                  (previous) => ({
                    ...previous,
                    category:
                      e.target.value,
                  })
                );

                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={getId(
                      category
                    )}
                    value={getId(
                      category
                    )}
                  >
                    {getCategoryName(
                      category
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          {/* MIN PRICE */}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Min Price
            </label>

            <input
              type="number"
              min="0"
              value={
                filters.minPrice
              }
              onChange={(e) => {
                setFilters(
                  (previous) => ({
                    ...previous,
                    minPrice:
                      e.target.value,
                  })
                );

                setPage(1);
              }}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* MAX PRICE */}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Max Price
            </label>

            <input
              type="number"
              min="0"
              value={
                filters.maxPrice
              }
              onChange={(e) => {
                setFilters(
                  (previous) => ({
                    ...previous,
                    maxPrice:
                      e.target.value,
                  })
                );

                setPage(1);
              }}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* ACTIONS */}

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Search size={16} />

              Search
            </button>

            <button
              type="button"
              onClick={
                handleResetFilters
              }
              title="Reset filters"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw
                size={17}
              />
            </button>
          </div>
        </form>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} />

          <span className="flex-1">
            {error}
          </span>

          <button
            type="button"
            onClick={
              fetchProducts
            }
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ==================================================
          PRODUCT TABLE
      ================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Product
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  SKU
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Categories
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Price
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Stock
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                      <Loader2
                        size={28}
                        className="animate-spin"
                      />

                      <span className="text-sm">
                        Loading
                        products...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : products.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-16 text-center"
                  >
                    <Package
                      size={40}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="text-sm font-medium text-gray-600">
                      No products
                      found
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Try changing
                      your filters
                      or create a
                      new product.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map(
                  (product) => {
                    const imageUrl =
                      getProductImage(
                        product
                      );

                    return (
                      <tr
                        key={getId(
                          product
                        )}
                        className="transition hover:bg-gray-50"
                      >
                        {/* PRODUCT */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                              {imageUrl ? (
                                <img
                                  src={
                                    imageUrl
                                  }
                                  alt={
                                    product.name
                                  }
                                  className="h-full w-full object-cover"
                                  onError={(
                                    e
                                  ) => {
                                    e.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                  <ImageIcon
                                    size={
                                      20
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="max-w-[220px] truncate text-sm font-semibold text-gray-900">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                {Array.isArray(
                                  product.images
                                )
                                  ? product
                                      .images
                                      .length
                                  : 0}{" "}
                                image
                                {Array.isArray(
                                  product.images
                                ) &&
                                product
                                  .images
                                  .length !==
                                  1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}

                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-700">
                          {
                            product.sku
                          }
                        </td>

                        {/* CATEGORIES */}

                        <td className="px-4 py-3">
                          <div className="flex max-w-[220px] flex-wrap gap-1">
                            {product.categories
                              ?.length ? (
                              product.categories.map(
                                (
                                  category
                                ) => (
                                  <span
                                    key={getId(
                                      category
                                    )}
                                    className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {getCategoryName(
                                      category
                                    )}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-xs text-gray-400">
                                No
                                category
                              </span>
                            )}
                          </div>
                        </td>

                        {/* PRICE */}

                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-800">
                          {formatCurrency(
                            product.price
                          )}
                        </td>

                        {/* STOCK */}

                        <td className="whitespace-nowrap px-4 py-3">
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
                                ? "text-amber-600"
                                : "text-green-600"
                            }`}
                          >
                            {
                              product.stock
                            }
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusClick(
                                product
                              )
                            }
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              product.isActive
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          >
                            {product.isActive
                              ? "Active"
                              : "Inactive"}
                          </button>
                        </td>

                        {/* ACTIONS */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              title="View"
                              onClick={() =>
                                handleViewProduct(
                                  product
                                )
                              }
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            >
                              <Eye
                                size={
                                  17
                                }
                              />
                            </button>

                            <button
                              type="button"
                              title="Edit"
                              onClick={() =>
                                handleEditProduct(
                                  product
                                )
                              }
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil
                                size={
                                  17
                                }
                              />
                            </button>

                            <button
                              type="button"
                              title="Delete"
                              onClick={() =>
                                handleDeleteProduct(
                                  product
                                )
                              }
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2
                                size={
                                  17
                                }
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
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
            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {(page - 1) *
                    PAGE_LIMIT +
                    1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-700">
                  {Math.min(
                    page *
                      PAGE_LIMIT,
                    pagination.total
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                  {
                    pagination.total
                  }
                </span>{" "}
                products
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={
                    page <= 1
                  }
                  onClick={
                    handlePreviousPage
                  }
                  className="rounded-lg border border-gray-300 p-2 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>

                {getPageNumbers().map(
                  (
                    pageNumber,
                    index
                  ) =>
                    pageNumber ===
                    "..." ? (
                      <span
                        key={`dots-${index}`}
                        className="px-2 text-gray-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={
                          pageNumber
                        }
                        type="button"
                        onClick={() =>
                          setPage(
                            pageNumber
                          )
                        }
                        className={`min-w-9 rounded-lg px-3 py-2 text-sm ${
                          page ===
                          pageNumber
                            ? "bg-blue-600 font-semibold text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {
                          pageNumber
                        }
                      </button>
                    )
                )}

                <button
                  type="button"
                  disabled={
                    totalPages ===
                      0 ||
                    page >=
                      totalPages
                  }
                  onClick={
                    handleNextPage
                  }
                  className="rounded-lg border border-gray-300 p-2 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ==================================================
          PRODUCT FORM MODAL
      ================================================== */}

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  {editingProduct
                    ? "Update product information and images."
                    : "Create a new product with multiple images."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeFormModal
                }
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}

            <form
              onSubmit={
                handleSubmit
              }
              className="overflow-y-auto"
            >
              <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-3">
                {/* LEFT */}

                <div className="space-y-4 lg:col-span-2">
                  {/* NAME */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Product Name{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter product name"
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${
                        formErrors.name
                          ? "border-red-400 focus:ring-red-100"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
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
                      SKU{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      name="sku"
                      value={
                        form.sku
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="PRODUCT-001"
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm uppercase outline-none focus:ring-2 ${
                        formErrors.sku
                          ? "border-red-400 focus:ring-red-100"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
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

                  {/* PRICE / STOCK */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Price{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        value={
                          form.price
                        }
                        onChange={
                          handleInputChange
                        }
                        placeholder="0.00"
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${
                          formErrors.price
                            ? "border-red-400 focus:ring-red-100"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
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

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Stock{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="number"
                        name="stock"
                        min="0"
                        step="1"
                        value={
                          form.stock
                        }
                        onChange={
                          handleInputChange
                        }
                        placeholder="0"
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${
                          formErrors.stock
                            ? "border-red-400 focus:ring-red-100"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
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

                  {/* CATEGORIES */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Categories{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-2">
                      {categoriesLoading ? (
                        <div className="flex items-center gap-2 p-3 text-sm text-gray-500">
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />

                          Loading
                          categories...
                        </div>
                      ) : categories.length ===
                        0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          No active
                          categories
                          available.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                          {categories.map(
                            (
                              category
                            ) => {
                              const categoryId =
                                getId(
                                  category
                                );

                              const selected =
                                form.categories.includes(
                                  categoryId
                                );

                              return (
                                <label
                                  key={
                                    categoryId
                                  }
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                                    selected
                                      ? "bg-blue-50 text-blue-700"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      selected
                                    }
                                    onChange={() =>
                                      handleCategoryChange(
                                        categoryId
                                      )
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />

                                  <span>
                                    {getCategoryName(
                                      category
                                    )}
                                  </span>
                                </label>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>

                    {formErrors.categories && (
                      <p className="mt-1 text-xs text-red-600">
                        {
                          formErrors.categories
                        }
                      </p>
                    )}

                    <p className="mt-1 text-xs text-gray-400">
                      Select one or more
                      categories.
                    </p>
                  </div>

                  {/* DESCRIPTION */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Description
                    </label>

                    <textarea
                      name="description"
                      rows="5"
                      value={
                        form.description
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter product description..."
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* STATUS */}

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={
                        form.isActive
                      }
                      onChange={
                        handleInputChange
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Active Product
                      </p>

                      <p className="text-xs text-gray-500">
                        Product will be
                        available as an
                        active product.
                      </p>
                    </div>
                  </label>
                </div>

                {/* RIGHT IMAGE SECTION */}

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Product Images{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <span className="text-xs text-gray-400">
                        {imageCount}
                        /10
                      </span>
                    </div>

                    {/* EXISTING */}

                    {existingImages.length >
                      0 && (
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-medium text-gray-500">
                          Existing Images
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          {existingImages.map(
                            (image) => (
                              <div
                                key={getId(
                                  image
                                )}
                                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                              >
                                <img
                                  src={getImageUrl(
                                    image
                                  )}
                                  alt={
                                    image.originalName ||
                                    "Product"
                                  }
                                  className="aspect-square w-full object-cover"
                                  onError={(
                                    e
                                  ) => {
                                    e.currentTarget.style.display =
                                      "none";
                                  }}
                                />

                                {image.isPrimary && (
                                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-bold text-yellow-900 shadow">
                                    <Star
                                      size={
                                        10
                                      }
                                      fill="currentColor"
                                    />

                                    Primary
                                  </span>
                                )}

                                <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-1 bg-black/70 p-1.5 transition group-hover:translate-y-0">
                                  {!image.isPrimary && (
                                    <button
                                      type="button"
                                      disabled={
                                        imageActionLoading
                                      }
                                      onClick={() =>
                                        handleSetPrimaryImage(
                                          image
                                        )
                                      }
                                      className="flex flex-1 items-center justify-center gap-1 rounded bg-white/10 px-2 py-1 text-[10px] font-medium text-white hover:bg-white/20 disabled:opacity-50"
                                    >
                                      <Star
                                        size={
                                          12
                                        }
                                      />

                                      Primary
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={
                                      imageActionLoading
                                    }
                                    onClick={() =>
                                      handleDeleteImage(
                                        image
                                      )
                                    }
                                    className="flex items-center justify-center rounded bg-red-500/80 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-500 disabled:opacity-50"
                                  >
                                    <Trash2
                                      size={
                                        12
                                      }
                                    />
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* NEW PREVIEWS */}

                    {previewImages.length >
                      0 && (
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-medium text-gray-500">
                          New Images
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          {previewImages.map(
                            (
                              preview,
                              index
                            ) => (
                              <div
                                key={
                                  preview.id
                                }
                                className="group relative overflow-hidden rounded-lg border border-blue-200 bg-blue-50"
                              >
                                <img
                                  src={
                                    preview.url
                                  }
                                  alt="Preview"
                                  className="aspect-square w-full object-cover"
                                />

                                {index ===
                                  0 &&
                                  existingImages.length ===
                                    0 && (
                                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-bold text-yellow-900">
                                      <Star
                                        size={
                                          10
                                        }
                                        fill="currentColor"
                                      />

                                      Primary
                                    </span>
                                  )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveSelectedImage(
                                      index
                                    )
                                  }
                                  className="absolute right-1.5 top-1.5 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                                >
                                  <X
                                    size={
                                      12
                                    }
                                  />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* UPLOAD */}

                    {imageCount <
                      MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={
                          handleAddMoreImages
                        }
                        className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50"
                      >
                        <Upload
                          size={28}
                          className="mb-2 text-gray-400"
                        />

                        <span className="text-sm font-medium text-gray-700">
                          Click to
                          upload
                        </span>

                        <span className="mt-1 text-xs text-gray-400">
                          JPG, PNG,
                          WEBP · Max
                          5 MB each
                        </span>

                        <span className="mt-1 text-xs text-gray-400">
                          Up to 10
                          images
                        </span>
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={
                        handleFileChange
                      }
                      className="hidden"
                    />

                    {formErrors.images && (
                      <p className="mt-1 text-xs text-red-600">
                        {
                          formErrors.images
                        }
                      </p>
                    )}
                  </div>

                  {/* IMAGE INFORMATION */}

                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <div className="flex gap-2">
                      <ImageIcon
                        size={16}
                        className="mt-0.5 text-blue-600"
                      />

                      <div>
                        <p className="text-xs font-semibold text-blue-800">
                          Image
                          information
                        </p>

                        <ul className="mt-1 space-y-1 text-[11px] text-blue-700">
                          <li>
                            • Maximum
                            10 images
                          </li>

                          <li>
                            • Maximum
                            5 MB per
                            image
                          </li>

                          <li>
                            • First
                            image
                            becomes
                            primary
                          </li>

                          <li>
                            • You can
                            change
                            the
                            primary
                            image
                            later
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    closeFormModal
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check
                        size={17}
                      />

                      {editingProduct
                        ? "Update Product"
                        : "Create Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          VIEW PRODUCT MODAL
      ================================================== */}

      {showViewModal &&
        selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Product Details
                  </h2>

                  <p className="text-xs text-gray-500">
                    View product
                    information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
                {/* IMAGES */}

                <div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProduct.images
                      ?.length ? (
                      selectedProduct.images.map(
                        (image) => (
                          <div
                            key={getId(
                              image
                            )}
                            className="relative overflow-hidden rounded-xl border border-gray-200"
                          >
                            <img
                              src={getImageUrl(
                                image
                              )}
                              alt={
                                image.originalName ||
                                selectedProduct.name
                              }
                              className="aspect-square w-full object-cover"
                              onError={(
                                e
                              ) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />

                            {image.isPrimary && (
                              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-1 text-xs font-semibold text-yellow-900">
                                <Star
                                  size={
                                    12
                                  }
                                  fill="currentColor"
                                />

                                Primary
                              </span>
                            )}
                          </div>
                        )
                      )
                    ) : (
                      <div className="col-span-2 flex aspect-video items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400">
                        <ImageIcon
                          size={40}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* DETAILS */}

                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Product Name
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {
                        selectedProduct.name
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        SKU
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {
                          selectedProduct.sku
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Status
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          selectedProduct.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedProduct.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">
                        Price
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatCurrency(
                          selectedProduct.price
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">
                        Stock
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {
                          selectedProduct.stock
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Categories
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedProduct.categories
                        ?.length ? (
                        selectedProduct.categories.map(
                          (
                            category
                          ) => (
                            <span
                              key={getId(
                                category
                              )}
                              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                            >
                              {getCategoryName(
                                category
                              )}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-sm text-gray-400">
                          No
                          categories
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Description
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {selectedProduct.description ||
                        "No description available."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ==================================================
          DELETE PRODUCT MODAL
      ================================================== */}

      {showDeleteModal &&
        selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Trash2 size={21} />
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                  Delete Product?
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Are you sure you
                  want to delete{" "}
                  <span className="font-semibold text-gray-800">
                    {
                      selectedProduct.name
                    }
                  </span>
                  ? This action
                  cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    setShowDeleteModal(
                      false
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={
                    confirmDeleteProduct
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Delete Product
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
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="p-5">
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
                    selectedProduct.isActive
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {selectedProduct.isActive ? (
                    <X size={21} />
                  ) : (
                    <Check size={21} />
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                  {selectedProduct.isActive
                    ? "Deactivate Product?"
                    : "Activate Product?"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Are you sure you
                  want to{" "}
                  {selectedProduct.isActive
                    ? "deactivate"
                    : "activate"}{" "}
                  <span className="font-semibold text-gray-800">
                    {
                      selectedProduct.name
                    }
                  </span>
                  ?
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
                <button
                  type="button"
                  disabled={
                    changingStatus
                  }
                  onClick={() =>
                    setShowStatusModal(
                      false
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    changingStatus
                  }
                  onClick={
                    confirmChangeStatus
                  }
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white ${
                    selectedProduct.isActive
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-60`}
                >
                  {changingStatus && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {selectedProduct.isActive
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ==================================================
          DELETE IMAGE MODAL
      ================================================== */}

      {showImageDeleteModal &&
        selectedImage && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
              <div className="p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Trash2 size={21} />
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                  Delete Image?
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  This image will be
                  permanently removed
                  from the product.
                </p>

                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={getImageUrl(
                      selectedImage
                    )}
                    alt="Delete"
                    className="aspect-video w-full object-cover"
                    onError={(
                      e
                    ) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
                <button
                  type="button"
                  disabled={
                    imageActionLoading
                  }
                  onClick={() =>
                    setShowImageDeleteModal(
                      false
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    imageActionLoading
                  }
                  onClick={
                    confirmDeleteImage
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {imageActionLoading && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Delete Image
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ProductPage;