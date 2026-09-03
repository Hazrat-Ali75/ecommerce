"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Package,
  Layers,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface Variant {
  id: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, string>;
}

interface ProductDetails {
  id: string;
  title: string;
  slug: string;
  brand: string;
  description: string | null;
  basePrice: number;
  discountPrice: number | null;
  category: {
    id: string;
    name: string;
    type: string;
  };
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
  variants: Variant[];
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [discountPrice, setDiscountPrice] = useState<number | "">("");
  const [images, setImages] = useState<Array<{ url: string; isPrimary: boolean }>>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: product, isLoading, isError } = useQuery<ProductDetails>({
    queryKey: ["admin-product-edit", id],
    queryFn: async () => {
      // Find product by id from admin products endpoint
      const res = await apiClient.get(`/products/admin/all?search=${id}`);
      const found = res.data?.products?.find((p: ProductDetails) => p.id === id);
      if (!found) {
        // Fallback: try by slug or get all
        const allRes = await apiClient.get(`/products/admin/all?limit=100`);
        const item = allRes.data?.products?.find((p: ProductDetails) => p.id === id);
        if (!item) throw new Error("Product not found");
        return item;
      }
      return found;
    },
  });

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setBrand(product.brand);
      setDescription(product.description || "");
      setBasePrice(Number(product.basePrice));
      setDiscountPrice(product.discountPrice ? Number(product.discountPrice) : "");
      setImages(product.images.map((img) => ({ url: img.url, isPrimary: img.isPrimary })));
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: Number(v.price),
          stockQuantity: Number(v.stockQuantity),
          attributes: v.attributes,
        }))
      );
    }
  }, [product]);

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
      const uploadedUrl = res.data?.url;
      if (uploadedUrl) {
        setImages((prev) => [
          ...prev,
          { url: uploadedUrl, isPrimary: prev.length === 0 },
        ]);
        toast.success("Image uploaded to Cloudinary successfully");
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to upload image"));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !brand.trim() || !basePrice) {
      toast.error("Please fill in required product fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        brand: brand.trim(),
        description: description.trim() || undefined,
        basePrice: Number(basePrice),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        images: images.map((img) => ({ url: img.url, isPrimary: img.isPrimary })),
        variants: variants.map((v) => ({
          sku: v.sku,
          price: Number(v.price),
          stockQuantity: Number(v.stockQuantity),
          attributes: v.attributes,
        })),
      };

      await apiClient.put(`/products/${id}`, payload);
      toast.success("Product updated successfully!");
      router.push("/admin/products");
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to update product"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-gray-500">Loading product information...</div>;
  }

  if (isError || !product) {
    return (
      <div className="p-8 text-center text-red-600 text-xs">
        Product not found. <Link href="/admin/products" className="underline font-bold">Back to Catalog</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Edit Product</h2>
            <p className="text-xs text-gray-500">
              {product.category.name} ({product.category.type})
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? "Saving..." : "Update Product"}</span>
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
          <Package className="w-4 h-4" />
          <h3>Basic Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-gray-700">Product Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Brand *</label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Base Price (৳ BDT) *</label>
            <input
              type="number"
              required
              min="1"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Discount Price (৳ Optional)</label>
            <input
              type="number"
              min="1"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-emerald-600 text-emerald-600"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-gray-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <Upload className="w-4 h-4" />
            <h3>Media Gallery</h3>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer">
            <span>{isUploading ? "Uploading..." : "Upload New Image"}</span>
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border aspect-square bg-gray-100">
              <Image src={img.url} alt="Product image" fill className="object-cover" />
              {img.isPrimary && (
                <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variants & Stock Matrix */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
          <Layers className="w-4 h-4" />
          <h3>Variant Inventory Levels</h3>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="py-2.5 px-3">Variant</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Price (৳ BDT)</th>
                <th className="py-2.5 px-3">Stock Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {variants.map((v, idx) => (
                <tr key={v.id || idx} className="hover:bg-gray-50/50">
                  <td className="py-2.5 px-3 font-semibold text-gray-900 capitalize">
                    {v.attributes.size && `Size ${v.attributes.size.toUpperCase()} `}
                    {v.attributes.gender && `(${v.attributes.gender}) `}
                    {v.attributes.type && `Type: ${v.attributes.type}`}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-gray-700">{v.sku}</td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      value={v.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setVariants((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                        );
                      }}
                      className="px-2 py-1 bg-gray-50 border rounded font-bold text-xs w-24"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={v.stockQuantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setVariants((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, stockQuantity: val } : item
                          )
                        );
                      }}
                      className="px-2 py-1 bg-gray-50 border rounded font-bold text-xs w-20 text-emerald-700"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
