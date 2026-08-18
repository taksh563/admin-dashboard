import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Users,
  Package,
  Tags,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Activity as ActivityIcon,
  CheckCircle2,
  XCircle,
  Clock3,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

import dashboardService from "../../services/dashboard.service";

// ==========================================================
// STATISTIC CARD CONFIGURATION
// ==========================================================

const STAT_CONFIG = [
  {
    key: "users",
    title: "Total Users",
    icon: Users,
    iconClass:
      "bg-blue-50 text-blue-600",
    route: "/users",
  },

  {
    key: "products",
    title: "Products",
    icon: Package,
    iconClass:
      "bg-purple-50 text-purple-600",
    route: "/products",
  },

  {
    key: "categories",
    title: "Categories",
    icon: Tags,
    iconClass:
      "bg-orange-50 text-orange-600",
    route: "/categories",
  },

  {
    key: "revenue",
    title: "Revenue",
    icon: DollarSign,
    iconClass:
      "bg-emerald-50 text-emerald-600",
    route: null,
  },
];

// ==========================================================
// NUMBER FORMATTER
// ==========================================================

const formatNumber = (
  value
) => {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(Number(value || 0));
};

// ==========================================================
// CURRENCY FORMATTER
// ==========================================================

const formatCurrency = (
  value
) => {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(Number(value || 0));
};

// ==========================================================
// DATE FORMATTER
// ==========================================================

const formatDate = (
  date
) => {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(date)
  );
};

// ==========================================================
// RELATIVE TIME
// ==========================================================

const getRelativeTime = (
  date
) => {
  if (!date) {
    return "-";
  }

  const created =
    new Date(date).getTime();

  const now =
    Date.now();

  const difference =
    Math.max(
      0,
      now - created
    );

  const seconds =
    Math.floor(
      difference / 1000
    );

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 30) {
    return `${days}d ago`;
  }

  return formatDate(date);
};

// ==========================================================
// ACTION CLASS
// ==========================================================

const getActionClass = (
  action
) => {
  switch (action) {
    case "CREATE":
      return "bg-emerald-50 text-emerald-700";

    case "UPDATE":
      return "bg-blue-50 text-blue-700";

    case "DELETE":
      return "bg-red-50 text-red-700";

    case "STATUS_UPDATE":
      return "bg-amber-50 text-amber-700";

    case "LOGIN":
      return "bg-violet-50 text-violet-700";

    case "LOGOUT":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

// ==========================================================
// ACTION LABEL
// ==========================================================

const getActionLabel = (
  action
) => {
  if (!action) {
    return "Activity";
  }

  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
};

// ==========================================================
// DASHBOARD
// ==========================================================

export default function Dashboard() {
  const {
    user,
  } = useAuth();

  const {
    error: showError,
  } = useToast();

  const navigate =
    useNavigate();

  // ========================================================
  // STATE
  // ========================================================

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ========================================================
  // LOAD DASHBOARD
  // ========================================================

  const loadDashboard =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const response =
            await dashboardService.getDashboard();

          if (
            response?.success
          ) {
            setDashboard(
              response.data
            );
          } else {
            throw new Error(
              response?.message ||
                "Unable to load dashboard."
            );
          }
        } catch (error) {
          console.error(
            "Dashboard error:",
            error
          );

          showError(
            error.response
              ?.data?.message ||
              error.message ||
              "Unable to load dashboard data."
          );
        } finally {
          setLoading(false);
        }
      },
      [showError]
    );

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ========================================================
  // DATA
  // ========================================================

  const statistics =
    dashboard?.statistics;

  const recentActivity =
    dashboard?.recentActivity ||
    [];

  // ========================================================
  // STATISTICS
  // ========================================================

  const getStatisticValue = (
    key
  ) => {
    if (
      key === "revenue"
    ) {
      return formatCurrency(
        statistics?.revenue
          ?.total || 0
      );
    }

    return formatNumber(
      statistics?.[key]
        ?.total || 0
    );
  };

  const getStatisticGrowth = (
    key
  ) => {
    return Number(
      statistics?.[key]
        ?.growth || 0
    );
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="w-full space-y-5 sm:space-y-6">

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Welcome back,{" "}
            {user?.name ||
              "Admin"}{" "}
            👋
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening
            with your application
            today.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadDashboard
          }
          disabled={loading}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-slate-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-slate-700
            shadow-sm
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <RefreshCcw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>

      </section>

      {/* ====================================================
          STATISTICS
      ==================================================== */}

      <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {STAT_CONFIG.map(
          (item) => {
            const Icon =
              item.icon;

            const growth =
              getStatisticGrowth(
                item.key
              );

            const isPositive =
              growth >= 0;

            return (
              <div
                key={item.key}
                onClick={() => {
                  if (
                    item.route
                  ) {
                    navigate(
                      item.route
                    );
                  }
                }}
                className={`
                  min-w-0
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                  shadow-sm
                  transition
                  sm:p-5
                  ${
                    item.route
                      ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                      : ""
                  }
                `}
              >

                <div className="flex items-center justify-between gap-3">

                  <div className="min-w-0">

                    <p className="truncate text-sm text-slate-500">
                      {item.title}
                    </p>

                    {loading ? (
                      <div className="mt-2 h-8 w-28 animate-pulse rounded-md bg-slate-100" />
                    ) : (
                      <h2 className="mt-2 truncate text-xl font-bold text-slate-800 sm:text-2xl">
                        {getStatisticValue(
                          item.key
                        )}
                      </h2>
                    )}

                  </div>

                  <div
                    className={`
                      shrink-0
                      rounded-lg
                      p-3
                      ${item.iconClass}
                    `}
                  >
                    <Icon
                      size={22}
                    />
                  </div>

                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1 text-xs sm:text-sm">

                  {loading ? (
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                  ) : item.key ===
                    "revenue" ? (
                    <span className="text-xs text-slate-400">
                      Sales module
                      not configured
                    </span>
                  ) : (
                    <>
                      {isPositive ? (
                        <TrendingUp
                          size={15}
                          className="text-green-500"
                        />
                      ) : (
                        <TrendingDown
                          size={15}
                          className="text-red-500"
                        />
                      )}

                      <span
                        className={`
                          font-medium
                          ${
                            isPositive
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        `}
                      >
                        {isPositive
                          ? "+"
                          : ""}
                        {growth}%
                      </span>

                      <span className="text-slate-400">
                        vs last month
                      </span>
                    </>
                  )}

                </div>

              </div>
            );
          }
        )}

      </section>

      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <section className="grid w-full grid-cols-1 gap-5 xl:grid-cols-3">

        {/* ==================================================
            REVENUE
        ================================================== */}

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 xl:col-span-2">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-slate-800">
                Revenue Overview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Sales analytics will
                appear here after
                Orders are implemented.
              </p>
            </div>

            <select
              disabled
              className="
                w-full
                rounded-lg
                border
                border-slate-200
                bg-slate-50
                px-3
                py-2
                text-sm
                text-slate-400
                outline-none
                sm:w-auto
              "
            >
              <option>
                Last 30 days
              </option>
            </select>

          </div>

          <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl bg-slate-50 sm:h-80">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">

              <DollarSign
                size={22}
                className="text-slate-400"
              />

            </div>

            <p className="mt-4 text-sm font-medium text-slate-600">
              No sales data available
            </p>

            <p className="mt-1 max-w-sm text-center text-xs text-slate-400">
              Revenue analytics will
              become dynamic when
              the Order/Sales module
              is added.
            </p>

          </div>

        </div>

        {/* ==================================================
            RECENT ACTIVITY
        ================================================== */}

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h2 className="font-semibold text-slate-800">
                Recent Activity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest admin activities
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/audit-logs"
                )
              }
              className="
                inline-flex
                items-center
                gap-1
                text-xs
                font-medium
                text-blue-600
                hover:text-blue-700
              "
            >
              View all
              <ArrowRight
                size={14}
              />
            </button>

          </div>

          {/* ACTIVITY LOADING */}

          {loading ? (
            <div className="space-y-5">

              {Array.from({
                length: 5,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="flex gap-3"
                  >

                    <div className="mt-1 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-slate-200" />

                    <div className="min-w-0 flex-1">

                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />

                      <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-100" />

                      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-slate-100" />

                    </div>

                  </div>
                )
              )}

            </div>
          ) : recentActivity.length ===
            0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">

                <ActivityIcon
                  size={21}
                  className="text-slate-400"
                />

              </div>

              <p className="mt-3 text-sm font-medium text-slate-600">
                No recent activity
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Activity will appear
                here as users interact
                with the application.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {recentActivity.map(
                (activity) => (
                  <Activity
                    key={
                      activity._id
                    }
                    activity={
                      activity
                    }
                  />
                )
              )}

            </div>
          )}

        </div>

      </section>

      {/* ====================================================
          QUICK SUMMARY
      ==================================================== */}

      {!loading &&
        dashboard && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            {/* USERS */}

            <SummaryCard
              title="Users this month"
              value={formatNumber(
                statistics
                  ?.users
                  ?.currentMonth ||
                  0
              )}
              description="New users registered this month"
              icon={Users}
              iconClass="bg-blue-50 text-blue-600"
            />

            {/* PRODUCTS */}

            <SummaryCard
              title="Products this month"
              value={formatNumber(
                statistics
                  ?.products
                  ?.currentMonth ||
                  0
              )}
              description="New products created this month"
              icon={Package}
              iconClass="bg-purple-50 text-purple-600"
            />

            {/* CATEGORIES */}

            <SummaryCard
              title="Categories this month"
              value={formatNumber(
                statistics
                  ?.categories
                  ?.currentMonth ||
                  0
              )}
              description="New categories created this month"
              icon={Tags}
              iconClass="bg-orange-50 text-orange-600"
            />

          </section>
        )}

    </div>
  );
}

// ==========================================================
// ACTIVITY COMPONENT
// ==========================================================

function Activity({
  activity,
}) {
  const isSuccess =
    activity.status ===
    "SUCCESS";

  return (
    <div className="flex gap-3">

      {/* DOT */}

      <div
        className={`
          mt-1.5
          h-2.5
          w-2.5
          shrink-0
          rounded-full
          ${
            isSuccess
              ? "bg-blue-600"
              : "bg-red-500"
          }
        `}
      />

      {/* CONTENT */}

      <div className="min-w-0 flex-1">

        <div className="flex flex-wrap items-center gap-2">

          <p className="truncate text-sm font-medium text-slate-800">
            {getActionLabel(
              activity.action
            )}
          </p>

          <span
            className={`
              rounded-md
              px-2
              py-0.5
              text-[10px]
              font-semibold
              ${getActionClass(
                activity.action
              )}
            `}
          >
            {activity.module}
          </span>

        </div>

        <p className="mt-1 truncate text-xs text-slate-500">
          {activity.description ||
            "Activity performed"}
        </p>

        <div className="mt-1.5 flex items-center gap-2">

          <span className="text-xs text-slate-400">
            {activity.userName ||
              "System"}
          </span>

          <span className="text-slate-300">
            •
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-slate-400">

            <Clock3
              size={11}
            />

            {getRelativeTime(
              activity.createdAt
            )}

          </span>

          {!isSuccess && (
            <>
              <span className="text-slate-300">
                •
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">

                <XCircle
                  size={11}
                />

                Failed

              </span>
            </>
          )}

          {isSuccess && (
            <CheckCircle2
              size={12}
              className="text-emerald-500"
            />
          )}

        </div>

      </div>

    </div>
  );
}

// ==========================================================
// SUMMARY CARD
// ==========================================================

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>

        </div>

        <div
          className={`
            shrink-0
            rounded-lg
            p-2.5
            ${iconClass}
          `}
        >
          <Icon size={20} />
        </div>

      </div>

    </div>
  );
}