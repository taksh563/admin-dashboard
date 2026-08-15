import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-6xl font-bold text-red-500">
          403
        </h1>

        <h2 className="mt-4 text-2xl font-bold text-slate-800">
          Access Denied
        </h2>

        <p className="mt-2 text-slate-500">
          You don't have permission to access this page.
        </p>

        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}