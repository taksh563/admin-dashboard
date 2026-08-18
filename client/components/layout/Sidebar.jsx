import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  Settings,
  X,
  Activity,
  Mail,
  MailPlus,
  ChevronDown,
  FileText,
} from "lucide-react";

// =========================================
// MENU CONFIGURATION
// =========================================

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



  // =========================================
  // EMAIL PARENT MENU
  // =========================================

  {
    name: "Email",
    icon: Mail,

    children: [
      {
        name: "Compose Email",
        path: "/email/compose",
        icon: MailPlus,
      },

      {
        name: "Email History",
        path: "/email/history",
        icon: FileText,
      },

      {
        name: "Email Templates",
        path: "/email/templates",
        icon: MailPlus,
      },
    ],
  },

  {
    name: "Settings",
    icon: Settings,
    children: [
      {
        name: "Activity Logs",
        path: "/logs",
        icon: Activity,
      },


    ],
  },
];

// =========================================
// SIDEBAR
// =========================================

export default function Sidebar({
  open,
  onClose,
}) {
  const location = useLocation();

  // =========================================
  // CHECK EMAIL ACTIVE
  // =========================================

  const isEmailActive =
    location.pathname.startsWith("/email");

  // =========================================
  // OPEN STATE
  // =========================================

  const [openMenus, setOpenMenus] =
    useState({
      Email: isEmailActive,
    });

  // =========================================
  // AUTO OPEN ACTIVE PARENT
  // =========================================

  useEffect(() => {
    if (isEmailActive) {
      setOpenMenus((prev) => ({
        ...prev,
        Email: true,
      }));
    }
  }, [isEmailActive]);

  // =========================================
  // TOGGLE MENU
  // =========================================

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  // =========================================
  // CHECK CHILD ACTIVE
  // =========================================

  const isChildActive = (children) => {
    return children?.some(
      (child) =>
        location.pathname === child.path
    );
  };

  return (
    <>
      {/* =====================================
          MOBILE OVERLAY
      ====================================== */}

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 shrink-0
          transform
          bg-slate-900
          text-white
          transition-transform duration-300
          lg:static
          lg:translate-x-0
          ${open
            ? "translate-x-0"
            : "-translate-x-full"
          }
        `}
      >
        {/* ===================================
            LOGO
        ==================================== */}

        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">

          <h1 className="text-xl font-bold">
            AdminPanel
          </h1>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-800 lg:hidden"
          >
            <X size={22} />
          </button>

        </div>

        {/* ===================================
            NAVIGATION
        ==================================== */}

        <nav className="space-y-1 p-4">

          {menuItems.map((item) => {
            const Icon = item.icon;

            // =================================
            // PARENT WITH CHILDREN
            // =================================

            if (item.children) {
              const isOpen =
                openMenus[item.name];

              const childActive =
                isChildActive(
                  item.children
                );

              return (
                <div
                  key={item.name}
                  className="space-y-1"
                >

                  {/* Parent Button */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleMenu(
                        item.name
                      )
                    }
                    className={`
                      flex w-full
                      items-center
                      justify-between
                      gap-3
                      rounded-lg
                      px-4 py-3
                      text-sm
                      font-medium
                      transition
                      ${childActive ||
                        isOpen
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }
                    `}
                  >

                    <div className="flex items-center gap-3">

                      <Icon size={19} />

                      <span>
                        {item.name}
                      </span>

                    </div>

                    <ChevronDown
                      size={17}
                      className={`
                        transition-transform duration-200
                        ${isOpen
                          ? "rotate-180"
                          : ""
                        }
                      `}
                    />

                  </button>

                  {/* =================================
                      CHILD MENU
                  ================================== */}

                  <div
                    className={`
                      overflow-hidden
                      transition-all
                      duration-300
                      ${isOpen
                        ? "max-h-60 opacity-100"
                        : "max-h-0 opacity-0"
                      }
                    `}
                  >

                    <div className="ml-4 space-y-1 border-l border-slate-700 pl-3">

                      {item.children.map(
                        (child) => {
                          const ChildIcon =
                            child.icon;

                          return (
                            <NavLink
                              key={
                                child.path
                              }
                              to={
                                child.path
                              }
                              onClick={
                                onClose
                              }
                              className={({
                                isActive,
                              }) =>
                                `
                                flex
                                items-center
                                gap-3
                                rounded-lg
                                px-3 py-2.5
                                text-sm
                                transition
                                ${isActive
                                  ? "bg-blue-600 text-white"
                                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }
                                `
                              }
                            >

                              <ChildIcon
                                size={16}
                              />

                              <span>
                                {
                                  child.name
                                }
                              </span>

                            </NavLink>
                          );
                        }
                      )}

                    </div>

                  </div>

                </div>
              );
            }

            // =================================
            // NORMAL MENU ITEM
            // =================================

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  px-4 py-3
                  text-sm
                  font-medium
                  transition
                  ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                  `
                }
              >

                <Icon size={19} />

                <span>
                  {item.name}
                </span>

              </NavLink>
            );
          })}

        </nav>
      </aside>
    </>
  );
}