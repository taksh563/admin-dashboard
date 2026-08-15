import { useEffect, useState } from "react";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
} from "../../services/userService";

import UserModal from "./UserModal";
import ConfirmModal from "./ConfirmModal";

import { useToast } from "../../context/ToastContext";

export default function Users() {
  const [users, setUsers] = useState([]);
  // const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

  const [modalOpen, setModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [userToDelete, setUserToDelete] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const {
    success,
    error: showError,
  } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await getUsers({
        page,
        limit: 10,
        search,
      });

      setUsers(response.data);

      setPagination(
        response.pagination
      );
    } catch (error) {
      console.error(
        "Unable to load users:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);

    loadUsers();
  };

  const handleStatus = async (user) => {
    try {
      await updateUserStatus(
        user._id,
        !user.isActive
      );

      success(
        `${user.name} is now ${!user.isActive
          ? "active"
          : "inactive"
        }.`
      );

      await loadUsers();
    } catch (error) {
      console.error(
        "Update status error:",
        error
      );

      showError(
        error.response?.data?.message ||
        "Unable to update user status."
      );
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleCreateUser = () => {
    // console.log('abc')
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleSaveUser = async (formData) => {
    try {
      setSaving(true);

      console.log("Sending user data:", formData);

      let response;

      if (selectedUser) {
        response = await updateUser(
          selectedUser._id,
          formData
        );
        success("User updated successfully.");
      } else {
        response = await createUser(formData);
        success("User created successfully.");
      }

      console.log("API response:", response);

      setModalOpen(false);
      setSelectedUser(null);

      await loadUsers();

    } catch (error) {
      console.error("SAVE USER ERROR:", error);
      showError(
        error.response?.data?.message ||
        "Unable to save user."
      );

      // Important: re-throw so UserModal can display the real error
      throw error;

    } finally {
      setSaving(false);
    }
  };


  const confirmDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await deleteUser(userToDelete._id);
      success(
        `${userToDelete.name} deleted successfully.`
      );
      setDeleteModalOpen(false);
      setUserToDelete(null);

      await loadUsers();
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      // alert(
      //   error.response?.data?.message ||
      //   "Unable to delete user"
      // );
      showError(
        error.response?.data?.message ||
        "Unable to delete user."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Users
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage application users and roles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateUser}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />

          Add User
        </button>
      </div>
      {/* IMPORTANT */}

      {/* Search */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name or email..."
              className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />

          </div>

          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-900"
          >
            Search
          </button>
        </form>

      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-[800px] w-full">

            <thead className="border-b bg-slate-50">

              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                  User
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                  Role
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                  Created
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-500">
                  Actions
                </th>
              </tr>

            </thead>

            <tbody className="divide-y">

              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50"
                  >

                    {/* User */}
                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                          {user.name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div className="font-medium text-slate-800">
                            {user.name}
                          </div>

                          <div className="text-xs text-slate-500">
                            {user.email}
                          </div>
                        </div>

                      </div>

                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                        {user.role}
                      </span>

                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">

                      <button
                        onClick={() =>
                          handleStatus(user)
                        }
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck size={13} />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX size={13} />
                            Inactive
                          </>
                        )}
                      </button>

                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(
                        user.createdAt
                      ).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                          onClick={() => handleEditUser(user)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-slate-500">
            Showing page {pagination.page} of{" "}
            {pagination.totalPages || 1}
          </p>

          <div className="flex gap-2">

            <button
              disabled={page <= 1}
              onClick={() =>
                setPage((p) => p - 1)
              }
              className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={
                page >=
                pagination.totalPages
              }
              onClick={() =>
                setPage((p) => p + 1)
              }
              className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>

          </div>

        </div>

      </div>

      {/* Modals for create/update and delete users start here */}
      <UserModal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setSelectedUser(null);
          }
        }}
        onSubmit={handleSaveUser}
        user={selectedUser}
        loading={saving}
      />
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete User"
        message={
          userToDelete
            ? `Are you sure you want to delete "${userToDelete.name}"? This user will be permanently removed from the system.`
            : "Are you sure you want to delete this user?"
        }
        confirmText="Delete User"
        cancelText="Cancel"
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setUserToDelete(null);
          }
        }}
        onConfirm={confirmDeleteUser}
      />
      {/* Modals for create/update and delete users ends here */}
    </div>
  );
}