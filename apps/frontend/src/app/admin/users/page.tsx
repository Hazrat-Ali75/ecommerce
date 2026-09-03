"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import {
  Search,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
}

interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery<AdminUsersResponse>({
    queryKey: ["admin-users", page, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      const res = await apiClient.get(`/users?${params.toString()}`);
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/users/${id}/toggle-status`);
    },
    onSuccess: () => {
      toast.success("User account status toggled");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to update account status"));
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900">User Accounts & Administration</h2>
        <p className="text-xs text-gray-500">
          Manage registered marketplace customers and staff access permissions
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, email, or Bangladeshi phone..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-emerald-600"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading user accounts...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600 text-xs">
            Failed to load users.{" "}
            <button onClick={() => refetch()} className="underline font-bold">
              Retry
            </button>
          </div>
        ) : data?.users.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-900">No matching accounts</h3>
            <p className="text-xs text-gray-500">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.users.map((u) => {
                  const isAdmin = u.role === "ADMIN" || u.role === "SUPER_ADMIN";
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Name & Initials */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                              isAdmin
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono">{u.id.substring(0, 10)}...</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-gray-900 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{u.email}</span>
                          </p>
                          {u.phone && (
                            <p className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{u.phone}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : u.role === "ADMIN"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {isAdmin && <ShieldCheck className="w-3 h-3" />}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 font-bold text-gray-700">
                        {u._count?.orders || 0}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-gray-500">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>
                            {new Date(u.createdAt).toLocaleDateString("en-BD", {
                              dateStyle: "medium",
                            })}
                          </span>
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => toggleMutation.mutate(u.id)}
                          disabled={u.role === "SUPER_ADMIN"}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700"
                              : "bg-red-50 text-red-700 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                          title={u.role === "SUPER_ADMIN" ? "Super Admin cannot be disabled" : "Toggle account active status"}
                        >
                          {u.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
                              <span>Suspended</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} accounts)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
