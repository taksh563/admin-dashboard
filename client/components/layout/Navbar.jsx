import { Menu, Bell, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:block">
        <h2 className="text-lg font-semibold text-slate-800">
          Dashboard
        </h2>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button className="relative rounded-lg p-2 hover:bg-slate-100">
          <Bell size={20} />

          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            {user?.name}
          </p>

          <p className="text-xs text-slate-500">
            {user?.role}
          </p>
        </div>

        <button
          onClick={logout}
          title="Logout"
          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}