import { useEffect, useState } from "react";
import api from "../../api/axios";
import {getErrorMessage,} from "../../utils/errorMessage";
import { useToast } from "../../context/ToastContext";
import emailService from "../../services/emailService";

const EmailHistory = () => {
  const [logs, setLogs] = useState([]);
  const { showToast } = useToast();
  const [resendingId, setResendingId] =
  useState(null);

  const [resendModal, setResendModal] = useState({
  open: false,
  log: null,
});

const [detailsModal, setDetailsModal] = useState({
  open: false,
  log: null,
});

const [loadingDetails, setLoadingDetails] =
  useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // Filters
  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  // Pagination
  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  // Details modal
  const [selectedLog, setSelectedLog] =
    useState(null);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  // =========================================
  // FETCH EMAIL LOGS
  // =========================================

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status) {
        params.status = status;
      }

      if (fromDate) {
        params.fromDate = fromDate;
      }

      if (toDate) {
        params.toDate = toDate;
      }

      const response = await api.get(
        "/email-logs",
        {
          params,
        }
      );

      if (response.data.success) {
        setLogs(
          response.data.data || []
        );

        setPagination(
          response.data.pagination
        );
      }
    } catch (err) {
      console.error(
        "Fetch email logs error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load email history."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD DATA
  // =========================================

  useEffect(() => {
    fetchEmailLogs();
  }, [
    page,
    limit,
    status,
    fromDate,
    toDate,
  ]);

  // =========================================
  // SEARCH
  // =========================================

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);
    fetchEmailLogs();
  };

  // =========================================
  // RESET FILTERS
  // =========================================

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  // =========================================
  // VIEW DETAILS
  // =========================================

  const handleViewDetails = async (id) => {
  if (!id) {
    error("Invalid email log ID.");
    return;
  }

  try {
    setLoadingDetails(true);

    const response =
      await emailService.getEmailLogById(id);

    if (!response?.success) {
      error(
        response?.message ||
          "Unable to fetch email details."
      );

      return;
    }

    setDetailsModal({
      open: true,
      log: response.data,
    });

  } catch (err) {
    console.error(
      "Get email details error:",
      err
    );

    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Unable to fetch email details.";

    error(message);

  } finally {
    setLoadingDetails(false);
  }
};

  // const handleViewDetails = async (
  //   id
  // ) => {
  //   try {
  //     setDetailsLoading(true);

  //     const response =
  //       await api.get(
  //         `/email-logs/${id}`
  //       );

  //     if (response.data.success) {
  //       setSelectedLog(
  //         response.data.data
  //       );
  //     }
  //   } catch (err) {
  //     console.error(
  //     "Email details error:",
  //     error
  //   );

  //   showToast(
  //     getErrorMessage(
  //       error,
  //       "Unable to fetch email details."
  //     ),
  //     "error"
  //   );
  //   } finally {
  //     setDetailsLoading(false);
  //   }
  // };

  // =========================================
  // STATUS BADGE
  // =========================================

  const getStatusBadge = (
    status
  ) => {
    const styles = {
      SENT:
        "bg-green-100 text-green-700",
      FAILED:
        "bg-red-100 text-red-700",
      PENDING:
        "bg-yellow-100 text-yellow-700",
    };

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          styles[status] ||
          "bg-gray-100 text-gray-700"
        }`}
      >
        {status}
      </span>
    );
  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleString();
  };

  // resend email
  const handleResend = async (id) => {
  if (!id) {
    showToast({
      type: "error",
      message:
        "Invalid email log ID.",
    });

    return;
  }

  try {
    setResendingId(id);

    const response =
      await emailService.resendEmail(id);

    console.log(
      "RESEND RESPONSE:",
      response
    );

    // Backend returned failure
    if (!response?.success) {
      showToast({
        type: "error",
        message:
          response?.message ||
          "Unable to resend email.",
      });

      return;
    }

    // Success
    showToast({
      type: "success",
      message:
        response?.message ||
        "Email resent successfully.",
    });

    // Refresh email history
    await fetchEmailLogs();

  } catch (error) {
    console.error(
      "Resend email error:",
      error
    );

    const message =
      error?.response?.data?.message?.trim() ||
      error?.response?.data?.error?.trim() ||
      error?.message?.trim() ||
      "Unable to resend email.";

    showToast({
      type: "error",
      message,
    });

  } finally {
    setResendingId(null);
  }
};
// resend email

const confirmResend = async () => {
  const log = resendModal.log;

  if (!log?._id) {
    error("Invalid email log.");
    return;
  }

  setResendModal({
    open: false,
    log: null,
  });

  await handleResend(log._id);
};

  return (
    <div className="w-full">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Email History
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage emails sent
            from the dashboard.
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
          Total Emails:{" "}
          <strong>
            {pagination.total}
          </strong>
        </div>

      </div>

      {/* =====================================
          FILTERS
      ====================================== */}

      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">

        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
        >

          {/* Search */}

          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search recipient, subject..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => {
                setStatus(
                  e.target.value
                );
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                All Status
              </option>

              <option value="SENT">
                Sent
              </option>

              <option value="FAILED">
                Failed
              </option>

              <option value="PENDING">
                Pending
              </option>
            </select>
          </div>

          {/* From Date */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(
                  e.target.value
                );
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* To Date */}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              To Date
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(
                  e.target.value
                );
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}

          <div className="flex items-end gap-2 lg:col-span-5">

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Reset
            </button>

          </div>

        </form>

      </div>

      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================
          TABLE
      ====================================== */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-gray-50">
              <tr>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Recipient
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Subject
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Sent By
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading email history...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No email history found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="transition hover:bg-gray-50"
                  >

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {Array.isArray(
                        log.to
                      )
                        ? log.to.join(
                            ", "
                          )
                        : log.to}
                    </td>

                    <td className="max-w-xs truncate px-5 py-4 text-sm font-medium text-gray-800">
                      {log.subject}
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(
                        log.status
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {log.sentBy?.name ||
                        "-"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {formatDate(
                        log.createdAt
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">

                      <button
                        type="button"
                        onClick={() =>
                          handleViewDetails(
                            log._id
                          )
                        }
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                      >
                        View
                      </button>

                      {log.status === "FAILED" && (
  <button
    type="button"
    onClick={() =>
  setResendModal({
    open: true,
    log,
  })
}
    disabled={
      resendingId === log._id
    }
    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {resendingId === log._id ? (
      <>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        Resending...
      </>
    ) : (
      <>
        ↻
        Resend
      </>
    )}
  </button>
)}

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* =====================================
            PAGINATION
        ====================================== */}

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-sm text-gray-500">
            Showing{" "}
            {logs.length > 0
              ? (page - 1) *
                  limit +
                1
              : 0}{" "}
            to{" "}
            {Math.min(
              page * limit,
              pagination.total
            )}{" "}
            of{" "}
            {pagination.total}
          </div>

          <div className="flex items-center gap-2">

            <select
              value={limit}
              onChange={(e) => {
                setLimit(
                  Number(
                    e.target.value
                  )
                );
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="10">
                10
              </option>

              <option value="25">
                25
              </option>

              <option value="50">
                50
              </option>

              <option value="100">
                100
              </option>
            </select>

            <button
              type="button"
              disabled={
                !pagination.hasPreviousPage
              }
              onClick={() =>
                setPage(
                  (prev) =>
                    prev - 1
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm text-gray-600">
              {page} /{" "}
              {pagination.totalPages ||
                1}
            </span>

            <button
              type="button"
              disabled={
                !pagination.hasNextPage
              }
              onClick={() =>
                setPage(
                  (prev) =>
                    prev + 1
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
          DETAILS MODAL
      ====================================== */}
{detailsModal.open &&
  detailsModal.log && (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Email Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Complete information about this email.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setDetailsModal({
                open: false,
                log: null,
              })
            }
            className="text-2xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>

        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">

          <div className="space-y-5">

            {/* Status */}
            <div className="flex items-center justify-between">

              <span className="text-sm font-medium text-gray-500">
                Status
              </span>

              {(() => {
                const status =
                  detailsModal.log.status;

                const statusClasses = {
                  SENT:
                    "bg-green-100 text-green-700",
                  FAILED:
                    "bg-red-100 text-red-700",
                  PENDING:
                    "bg-yellow-100 text-yellow-700",
                };

                return (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusClasses[
                        status
                      ] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {status}
                  </span>
                );
              })()}

            </div>

            {/* To */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                To
              </p>

              <div className="mt-2 flex flex-wrap gap-2">

                {(
                  detailsModal.log.to ||
                  []
                ).map(
                  (email, index) => (
                    <span
                      key={`${email}-${index}`}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                    >
                      {email}
                    </span>
                  )
                )}

              </div>
            </div>

            {/* CC */}
            {detailsModal.log.cc?.length >
              0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  CC
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {detailsModal.log.cc.map(
                    (email, index) => (
                      <span
                        key={`${email}-${index}`}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                      >
                        {email}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* BCC */}
            {detailsModal.log.bcc?.length >
              0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  BCC
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {detailsModal.log.bcc.map(
                    (email, index) => (
                      <span
                        key={`${email}-${index}`}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                      >
                        {email}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Subject */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Subject
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {detailsModal.log.subject ||
                  "No subject"}
              </p>
            </div>

            {/* Sent By */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Sent By
              </p>

              <div className="mt-1">
                <p className="text-sm text-gray-900">
                  {detailsModal.log.sentBy
                    ?.name ||
                    "System"}
                </p>

                {detailsModal.log.sentBy
                  ?.email && (
                  <p className="text-xs text-gray-500">
                    {
                      detailsModal.log
                        .sentBy.email
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Date */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Created
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {detailsModal.log.createdAt
                  ? new Date(
                      detailsModal.log.createdAt
                    ).toLocaleString()
                  : "-"}
              </p>
            </div>

            {/* Message ID */}
            {detailsModal.log
              .messageId && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Message ID
                </p>

                <p className="mt-1 break-all rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600">
                  {
                    detailsModal.log
                      .messageId
                  }
                </p>
              </div>
            )}

            {/* Error */}
            {detailsModal.log.status ===
              "FAILED" && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Error
                </p>

                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="break-words text-sm text-red-700">
                    {detailsModal.log
                      .errorMessage ||
                      "Email delivery failed."}
                  </p>
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Message
              </p>

              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                  {detailsModal.log
                    .message ||
                    "No message available."}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">

          {detailsModal.log.status ===
            "FAILED" && (
            <button
              type="button"
              onClick={() => {
                const log =
                  detailsModal.log;

                setDetailsModal({
                  open: false,
                  log: null,
                });

                setResendModal({
                  open: true,
                  log,
                });
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Resend Email
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setDetailsModal({
                open: false,
                log: null,
              })
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>

        </div>

      </div>
    </div>
  )}

      {/* resend modal start ere */}

      {resendModal.open &&
  resendModal.log && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Resend Email?
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Please confirm that you want to resend this email.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setResendModal({
                open: false,
                log: null,
              })
            }
            className="text-2xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 px-6 py-5">

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Recipient
            </p>

            <p className="mt-1 break-all text-sm text-gray-900">
              {Array.isArray(
                resendModal.log.to
              )
                ? resendModal.log.to.join(", ")
                : resendModal.log.to}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Subject
            </p>

            <p className="mt-1 text-sm text-gray-900">
              {resendModal.log.subject}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Previous Error
            </p>

            <div className="mt-1 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {resendModal.log.errorMessage ||
                "Previous delivery failed."}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">

          <button
            type="button"
            onClick={() =>
              setResendModal({
                open: false,
                log: null,
              })
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirmResend}
            disabled={
              resendingId ===
              resendModal.log._id
            }
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resendingId ===
            resendModal.log._id ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Resending...
              </>
            ) : (
              "Resend Email"
            )}
          </button>

        </div>
      </div>
    </div>
  )}

    </div>
  );
};

export default EmailHistory;