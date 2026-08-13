import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex items-center justify-between bg-white p-4 shadow">
        <h1 className="text-2xl font-bold">
          Dashboard
        </h1>

        <button
          onClick={logout}
          className="rounded bg-red-600 px-4 py-2 text-white"
        >
          Logout
        </button>
      </div>

      <div className="p-8">
        <div className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-3xl font-bold">
            Welcome {user?.name}
          </h2>

          <p className="mt-2 text-gray-500">
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}