"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  CheckCircle2,
  XCircle,
  X,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/ui/admin-modal";

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  // New banner form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/shop");
  const [sortOrder, setSortOrder] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { data: banners = [], isLoading, isError } = useQuery<BannerItem[]>({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const res = await apiClient.get("/banners/admin/all");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      subtitle?: string;
      badgeText?: string;
      imageUrl: string;
      linkUrl: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => {
      await apiClient.post("/banners", payload);
    },
    onSuccess: () => {
      toast.success("Promo banner added successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to create banner"));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiClient.put(`/banners/${id}`, { isActive });
    },
    onSuccess: () => {
      toast.success("Banner updated");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (err) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to update banner status"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/banners/${id}`);
    },
    onSuccess: () => {
      toast.success("Banner deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (err) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to delete banner"));
    },
  });

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setBadgeText("");
    setImageUrl("");
    setLinkUrl("/shop");
    setSortOrder(0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      const res = await apiClient.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.url) {
        setImageUrl(res.data.url);
        toast.success("Banner image uploaded successfully");
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to upload image"));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || !linkUrl.trim()) {
      toast.error("Please fill in Title, Image URL, and Link URL");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      badgeText: badgeText.trim() || undefined,
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl.trim(),
      sortOrder: Number(sortOrder) || 0,
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Hero Carousel Banners</h2>
          <p className="text-xs text-gray-500">
            Control the homepage slider promotions and featured seasonal campaigns
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Slide</span>
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border animate-pulse" />
          ))
        ) : isError ? (
          <div className="col-span-2 p-8 text-center text-red-600 text-xs">
            Failed to load banners.
          </div>
        ) : banners.length === 0 ? (
          <div className="col-span-2 p-16 text-center space-y-2 bg-white rounded-2xl border">
            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-900">No promo slides configured</h3>
            <p className="text-xs text-gray-500">Create your first homepage promo banner.</p>
          </div>
        ) : (
          banners.map((b) => (
            <div
              key={b.id}
              className="bg-white border rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div className="relative h-44 w-full bg-gray-900">
                <Image src={b.imageUrl} alt={b.title} fill className="object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end text-white">
                  {b.badgeText && (
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-600 text-[10px] font-bold w-fit mb-1">
                      {b.badgeText}
                    </span>
                  )}
                  <h4 className="text-base font-bold line-clamp-1">{b.title}</h4>
                  {b.subtitle && <p className="text-xs text-gray-300 line-clamp-1">{b.subtitle}</p>}
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 flex items-center justify-between text-xs border-t">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Link:</span>
                  <span className="font-mono text-gray-800">{b.linkUrl}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMutation.mutate({ id: b.id, isActive: !b.isActive })}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                      b.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {b.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => deleteMutation.mutate(b.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-gray-900">Add Homepage Slide</h3>
            <button
              onClick={() => setModalOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">Slide Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Eid Trendsetters 2026"
                className="w-full px-3 py-2 bg-gray-50 border rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g., Authentic Bangladeshi Panjabis & Sarees"
                className="w-full px-3 py-2 bg-gray-50 border rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Badge Text</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g., FLAT 30% OFF or NEW ARRIVALS"
                className="w-full px-3 py-2 bg-gray-50 border rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Slide Image *</label>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold cursor-pointer shrink-0">
                  <span>{isUploading ? "Uploading..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 bg-gray-50 border rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Link URL *</label>
              <input
                type="text"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/shop or /product/slug"
                className="w-full px-3 py-2 bg-gray-50 border rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border rounded-xl font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Add Slide"}
              </button>
            </div>
          </form>
        </div>
      </AdminModal>
    </div>
  );
}
