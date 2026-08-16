import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  Settings,
  X,
  Activity
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    path: "/users",
    icon: Users,
  },
  {
    name: "Products",
    path: "/products",
    icon: Package,
  },
  {
    name: "Categories",
    path: "/categories",
    icon: Tags,
  },
  {
  name: "Activity Logs",
  path: "/logs",
  icon: Activity,
},
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 shrink-0
          transform bg-slate-900 text-white
          transition-transform duration-300
          lg:static lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">
          <h1 className="text-xl font-bold">
            AdminPanel
          </h1>

          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-800 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3
                  rounded-lg px-4 py-3
                  text-sm font-medium
                  transition
                  ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                  `
                }
              >
                <Icon size={19} />

                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}