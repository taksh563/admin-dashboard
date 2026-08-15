import {
  Users,
  Package,
  Tags,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const statistics = [
  {
    title: "Total Users",
    value: "1,248",
    change: "+12.5%",
    icon: Users,
  },
  {
    title: "Products",
    value: "856",
    change: "+8.2%",
    icon: Package,
  },
  {
    title: "Categories",
    value: "42",
    change: "+4.3%",
    icon: Tags,
  },
  {
    title: "Revenue",
    value: "₹2,48,560",
    change: "+18.4%",
    icon: DollarSign,
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="w-full space-y-5 sm:space-y-6">

      {/* Page Header */}
      <section className="w-full">
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          Welcome back, {user?.name} 👋
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Here's what's happening with your application today.
        </p>
      </section>

      {/* Statistics */}
      <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-500">
                    {item.title}
                  </p>

                  <h2 className="mt-2 truncate text-xl font-bold text-slate-800 sm:text-2xl">
                    {item.value}
                  </h2>
                </div>

                <div className="shrink-0 rounded-lg bg-blue-50 p-3 text-blue-600">
                  <Icon size={22} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1 text-xs sm:text-sm">
                <TrendingUp
                  size={15}
                  className="text-green-500"
                />

                <span className="font-medium text-green-600">
                  {item.change}
                </span>

                <span className="text-slate-400">
                  vs last month
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Dashboard Content */}
      <section className="grid w-full grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Revenue */}
        <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-6 xl:col-span-2">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-slate-800">
              Revenue Overview
            </h2>

            <select className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 sm:w-auto">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>

          <div className="flex h-64 w-full items-center justify-center rounded-lg bg-slate-50 sm:h-80">
            <p className="text-sm text-slate-400">
              Chart will be added in Phase 11
            </p>
          </div>
        </div>

        {/* Activity */}
        <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-5 font-semibold text-slate-800">
            Recent Activity
          </h2>

          <div className="space-y-5">
            <Activity
              title="New user registered"
              description="Rahul Kumar created an account"
              time="5 min ago"
            />

            <Activity
              title="Product updated"
              description="Laptop Pro was updated"
              time="30 min ago"
            />

            <Activity
              title="New order received"
              description="Order #ORD-1024 was placed"
              time="1 hour ago"
            />

            <Activity
              title="Profile updated"
              description="Admin profile was modified"
              time="2 hours ago"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Activity({
  title,
  description,
  time,
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">
          {title}
        </p>

        <p className="truncate text-xs text-slate-500">
          {description}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {time}
        </p>
      </div>
    </div>
  );
}