import {useCallback,useEffect,useState,useRef} from "react";
import emailTemplateService from "../../services/emailTemplate.service";
import { useToast } from "../../context/ToastContext";
import SimpleReactValidator from "simple-react-validator";

export default function EmailTemplates() {
  const {
    success,
    error,
  } = useToast();

  // =========================================
  // LIST STATE
  // =========================================
const [, forceUpdate] = useState();
 const SimpleValidator = useRef(new SimpleReactValidator({ autoForceUpdate: { forceUpdate: forceUpdate } }));

  const [templates, setTemplates] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  // =========================================
  // FILTER STATE
  // =========================================

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  // =========================================
  // MODAL STATE
  // =========================================

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingTemplate, setEditingTemplate] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  // =========================================
  // DELETE STATE
  // =========================================

  const [deleteModal, setDeleteModal] =
    useState({
      open: false,
      template: null,
    });

  const [deleting, setDeleting] =
    useState(false);

  // =========================================
  // STATUS STATE
  // =========================================

  const [updatingStatusId, setUpdatingStatusId] =
    useState(null);

  // =========================================
  // FORM
  // =========================================

  const emptyForm = {
    name: "",
    subject: "",
    message: "",
    html: "",
    status: "ACTIVE",
  };

  const [formData, setFormData] =
    useState(emptyForm);

  // =========================================
  // FETCH TEMPLATES
  // =========================================

  const fetchTemplates =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await emailTemplateService.getTemplates(
            {
              page,
              limit,
              search,
              status,
            }
          );

        if (!response?.success) {
          error(
            response?.message ||
              "Unable to fetch email templates."
          );

          return;
        }

        setTemplates(
          response.data || []
        );

        setTotal(
          response.pagination?.total ||
            0
        );

        setTotalPages(
          response.pagination
            ?.totalPages || 0
        );
      } catch (err) {
        console.error(
          "Fetch templates error:",
          err
        );

        error(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to fetch email templates."
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      limit,
      search,
      status,
      error,
    ]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // =========================================
  // SEARCH
  // =========================================

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  // =========================================
  // STATUS FILTER
  // =========================================

  const handleStatusFilter = (
    value
  ) => {
    setStatus(value);
    setPage(1);
  };

  // =========================================
  // OPEN CREATE
  // =========================================

  const handleCreate = () => {
    setEditingTemplate(null);

    setFormData(emptyForm);

    setModalOpen(true);
  };

  // =========================================
  // OPEN EDIT
  // =========================================

  const handleEdit = async (template) => {
    try {
      setEditingTemplate(template);

      setFormData({
        name:
          template.name || "",

        subject:
          template.subject || "",

        message:
          template.message || "",

        html:
          template.html || "",

        status:
          template.status ||
          "ACTIVE",
      });

      setModalOpen(true);
    } catch (err) {
      console.error(
        "Edit template error:",
        err
      );

      error(
        "Unable to open template."
      );
    }
  };

  // =========================================
  // FORM CHANGE
  // =========================================

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  // =========================================
  // SAVE
  // =========================================

  const handleSubmit = async (e) => {

    e.preventDefault();
 if (SimpleValidator.current.allValid()) {
    if (!formData.name.trim()) {
      error(
        "Template name is required."
      );

      return;
    }

    if (!formData.subject.trim()) {
      error(
        "Template subject is required."
      );

      return;
    }

    try {
      setSaving(true);

      let response;

      if (editingTemplate) {
        response =
          await emailTemplateService.updateTemplate(
            editingTemplate._id,
            {
              name:
                formData.name.trim(),

              subject:
                formData.subject.trim(),

              message:
                formData.message,

              html:
                formData.html,

              status:
                formData.status,
            }
          );
      } else {
        response =
          await emailTemplateService.createTemplate(
            {
              name:
                formData.name.trim(),

              subject:
                formData.subject.trim(),

              message:
                formData.message,

              html:
                formData.html,

              status:
                formData.status,
            }
          );
      }

      if (!response?.success) {
        error(
          response?.message ||
            "Unable to save template."
        );

        return;
      }

      success(
        response.message ||
          "Template saved successfully."
      );

      setModalOpen(false);

      setEditingTemplate(null);

      setFormData(emptyForm);

      await fetchTemplates();

    } catch (err) {
      console.error(
        "Save template error:",
        err
      );

      error(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save template."
      );
    } finally {
      setSaving(false);
    }
    } else {
     SimpleValidator.current.showMessages();
      forceUpdate(1);
    }
  };

  // =========================================
  // DELETE
  // =========================================

  const handleDelete = async () => {
    const template =
      deleteModal.template;

    if (!template?._id) {
      return;
    }

    try {
      setDeleting(true);

      const response =
        await emailTemplateService.deleteTemplate(
          template._id
        );

      if (!response?.success) {
        error(
          response?.message ||
            "Unable to delete template."
        );

        return;
      }

      success(
        response.message ||
          "Template deleted successfully."
      );

      setDeleteModal({
        open: false,
        template: null,
      });

      if (
        templates.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            current - 1
        );
      } else {
        await fetchTemplates();
      }

    } catch (err) {
      console.error(
        "Delete template error:",
        err
      );

      error(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete template."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================
  // STATUS TOGGLE
  // =========================================

  const handleStatusChange =
    async (template) => {
      const newStatus =
        template.status ===
        "ACTIVE"
          ? "INACTIVE"
          : "ACTIVE";

      try {
        setUpdatingStatusId(
          template._id
        );

        const response =
          await emailTemplateService.updateTemplateStatus(
            template._id,
            newStatus
          );

        if (!response?.success) {
          error(
            response?.message ||
              "Unable to update template status."
          );

          return;
        }

        success(
          response.message ||
            "Template status updated."
        );

        await fetchTemplates();

      } catch (err) {
        console.error(
          "Status update error:",
          err
        );

        error(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to update template status."
        );
      } finally {
        setUpdatingStatusId(
          null
        );
      }
    };

  // =========================================
  // PAGINATION
  // =========================================

  const goToPage = (
    newPage
  ) => {
    if (
      newPage < 1 ||
      newPage > totalPages
    ) {
      return;
    }

    setPage(newPage);
  };

  const handleLimitChange = (
    value
  ) => {
    setLimit(
      Number(value)
    );

    setPage(1);
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="w-full space-y-6">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Email Templates
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage reusable email templates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Create Template
        </button>

      </div>

      {/* =====================================
          FILTER BAR
      ===================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Search */}

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                handleSearch(
                  e.target.value
                )
              }
              placeholder="Search template name or subject..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                handleStatusFilter(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

        </div>

      </div>

      {/* =====================================
          TABLE
      ===================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-gray-200">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Template
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Subject
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Created
                </th>

                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">

              {loading ? (

                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center"
                  >
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                      Loading templates...
                    </div>
                  </td>
                </tr>

              ) : templates.length === 0 ? (

                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center"
                  >
                    <p className="text-sm font-medium text-gray-500">
                      No email templates found.
                    </p>

                    <button
                      type="button"
                      onClick={handleCreate}
                      className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Create your first template
                    </button>
                  </td>
                </tr>

              ) : (

                templates.map(
                  (template) => (
                    <tr
                      key={
                        template._id
                      }
                      className="transition hover:bg-gray-50"
                    >

                      {/* Template */}

                      <td className="px-6 py-4">

                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {
                              template.name
                            }
                          </p>

                          {template.createdBy
                            ?.name && (
                            <p className="mt-1 text-xs text-gray-500">
                              Created by{" "}
                              {
                                template
                                  .createdBy
                                  .name
                              }
                            </p>
                          )}
                        </div>

                      </td>

                      {/* Subject */}

                      <td className="max-w-md px-6 py-4">

                        <p className="truncate text-sm text-gray-700">
                          {
                            template.subject
                          }
                        </p>

                      </td>

                      {/* Status */}

                      <td className="px-6 py-4">

                        <button
                          type="button"
                          disabled={
                            updatingStatusId ===
                            template._id
                          }
                          onClick={() =>
                            handleStatusChange(
                              template
                            )
                          }
                          className="inline-flex items-center gap-2"
                        >

                          <span
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              template.status ===
                              "ACTIVE"
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          >

                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                template.status ===
                                "ACTIVE"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />

                          </span>

                          <span
                            className={`text-xs font-semibold ${
                              template.status ===
                              "ACTIVE"
                                ? "text-green-700"
                                : "text-gray-500"
                            }`}
                          >
                            {
                              template.status
                            }
                          </span>

                        </button>

                      </td>

                      {/* Created */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">

                        {template.createdAt
                          ? new Date(
                              template.createdAt
                            ).toLocaleDateString()
                          : "-"}

                      </td>

                      {/* Actions */}

                      <td className="whitespace-nowrap px-6 py-4 text-right">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                template
                              )
                            }
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                template,
                              })
                            }
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
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

        {/* ===================================
            PAGINATION
        =================================== */}

        <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2 text-sm text-gray-500">

            <span>
              Showing
            </span>

            <select
              value={limit}
              onChange={(e) =>
                handleLimitChange(
                  e.target.value
                )
              }
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="5">
                5
              </option>

              <option value="10">
                10
              </option>

              <option value="20">
                20
              </option>

              <option value="50">
                50
              </option>
            </select>

            <span>
              of {total}
            </span>

          </div>

          <div className="flex items-center gap-1">

            <button
              type="button"
              disabled={
                page <= 1
              }
              onClick={() =>
                goToPage(
                  page - 1
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-3 text-sm text-gray-600">
              Page {page} of{" "}
              {totalPages || 1}
            </span>

            <button
              type="button"
              disabled={
                page >=
                totalPages
              }
              onClick={() =>
                goToPage(
                  page + 1
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>

      </div>

      {/* =====================================
          CREATE / EDIT MODAL
      ===================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">

          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Header */}

            <div className="flex items-center justify-between border-b px-6 py-4">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTemplate
                    ? "Edit Email Template"
                    : "Create Email Template"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingTemplate
                    ? "Update the email template."
                    : "Create a reusable email template."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={
                handleSubmit
              }
              className="overflow-y-auto"
            >

              <div className="space-y-5 px-6 py-5">

                {/* Name */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Template Name
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Welcome Email"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                   {SimpleValidator.current.message(
                      "template name",
                      formData.name,
                      "required|min:3"
                    )}
                </div>

                {/* Subject */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Subject
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <input
                    type="text"
                    name="subject"
                    value={
                      formData.subject
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Email subject"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                   {SimpleValidator.current.message(
                      "subject",
                      formData.subject,
                      "required|min:3"
                    )}
                </div>

                {/* Message */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Message
                  </label>

                  <textarea
                    name="message"
                    value={
                      formData.message
                    }
                    onChange={
                      handleChange
                    }
                    rows="6"
                    placeholder="Enter plain text email message..."
                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                   {SimpleValidator.current.message(
                      "message",
                      formData.message,
                      "required|min:10"
                    )}
                </div>

                {/* HTML */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    HTML Content
                  </label>

                  <textarea
                    name="html"
                    value={
                      formData.html
                    }
                    onChange={
                      handleChange
                    }
                    rows="8"
                    placeholder="<h2>Welcome {{name}}</h2>"
                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1.5 text-xs text-gray-500">
                    You can use placeholders such as{" "}
                    <code className="rounded bg-gray-100 px-1">
                      {"{{name}}"}
                    </code>
                    .
                  </p>
                </div>

                {/* Status */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>

              </div>

              {/* Footer */}

              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">

                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(false)
                  }
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingTemplate
                    ? "Update Template"
                    : "Create Template"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================
          DELETE MODAL
      ===================================== */}

      {deleteModal.open &&
        deleteModal.template && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              <div className="p-6">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
                  !
                </div>

                <h2 className="mt-4 text-lg font-semibold text-gray-900">
                  Delete Template?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Are you sure you want to delete{" "}
                  <strong className="text-gray-700">
                    {
                      deleteModal
                        .template
                        .name
                    }
                  </strong>
                  ? This action cannot be undone.
                </p>

              </div>

              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">

                <button
                  type="button"
                  disabled={
                    deleting
                  }
                  onClick={() =>
                    setDeleteModal({
                      open: false,
                      template: null,
                    })
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    deleting
                  }
                  onClick={
                    handleDelete
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {deleting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}

                  {deleting
                    ? "Deleting..."
                    : "Delete Template"}

                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}