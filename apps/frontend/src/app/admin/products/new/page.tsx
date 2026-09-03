"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  type: "FASHION" | "FOOTWEAR" | "ELECTRONICS";
}

interface VariantRow {
  key: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, string>;
}

// STRICT BUSINESS RULE INVARIANTS
const FASHION_SIZES = ["s", "m", "l", "xl", "xxl"] as const;
const FASHION_GENDERS = ["men", "women", "kids"] as const;

const FOOTWEAR_SIZES = ["5", "6", "7", "8", "9", "10"] as const;
const FOOTWEAR_GENDERS = ["men", "women", "kids"] as const;

const ELECTRONICS_TYPES = ["watch", "charger", "power bank", "earbuds"] as const;
const WATCH_GENDERS = ["men", "women"] as const;

export default function NewProductPage() {
  const router = useRouter();

  // Basic Information
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [discountPrice, setDiscountPrice] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Images state
  const [images, setImages] = useState<Array<{ url: string; publicId?: string; isPrimary: boolean }>>([]);
  const [imageInputUrl, setImageInputUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Variant Configuration State
  const [fashionGender, setFashionGender] = useState<"men" | "women" | "kids">("men");
  const [selectedFashionSizes, setSelectedFashionSizes] = useState<string[]>(["m", "l", "xl"]);

  const [footwearGender, setFootwearGender] = useState<"men" | "women" | "kids">("men");
  const [selectedFootwearSizes, setSelectedFootwearSizes] = useState<string[]>(["7", "8", "9"]);

  const [electronicsType, setElectronicsType] = useState<"watch" | "charger" | "power bank" | "earbuds">("watch");
  const [watchGender, setWatchGender] = useState<"men" | "women">("men");

  // Generated Variants Matrix
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const res = await apiClient.get("/categories");
      return res.data;
    },
  });

  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Generate / Regenerate Variant Matrix based on strict category rules
  const generateVariants = () => {
    if (!selectedCategory) {
      toast.error("Please select a category first");
      return;
    }

    const price = Number(basePrice) || 1000;
    const cleanBrand = brand.trim() || "BD";
    const prefix = cleanBrand.substring(0, 3).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);

    const generated: VariantRow[] = [];

    if (selectedCategory.type === "FASHION") {
      if (selectedFashionSizes.length === 0) {
        toast.error("Please select at least one apparel size");
        return;
      }
      selectedFashionSizes.forEach((size) => {
        generated.push({
          key: `${fashionGender}-${size}`,
          sku: `${prefix}-${fashionGender.toUpperCase()}-${size.toUpperCase()}-${rand}`,
          price,
          stockQuantity: 15,
          attributes: {
            gender: fashionGender,
            size: size,
          },
        });
      });
    } else if (selectedCategory.type === "FOOTWEAR") {
      if (selectedFootwearSizes.length === 0) {
        toast.error("Please select at least one shoe size");
        return;
      }
      selectedFootwearSizes.forEach((size) => {
        generated.push({
          key: `${footwearGender}-${size}`,
          sku: `${prefix}-SHOE-${footwearGender.toUpperCase()}-${size}-${rand}`,
          price,
          stockQuantity: 12,
          attributes: {
            gender: footwearGender,
            size: size,
          },
        });
      });
    } else if (selectedCategory.type === "ELECTRONICS") {
      if (electronicsType === "watch") {
        generated.push({
          key: `watch-${watchGender}`,
          sku: `${prefix}-WATCH-${watchGender.toUpperCase()}-${rand}`,
          price,
          stockQuantity: 10,
          attributes: {
            type: "watch",
            gender: watchGender,
          },
        });
      } else {
        generated.push({
          key: electronicsType,
          sku: `${prefix}-${electronicsType.replace(/\s+/g, "").toUpperCase()}-${rand}`,
          price,
          stockQuantity: 20,
          attributes: {
            type: electronicsType,
          },
        });
      }
    }

    setVariantRows(generated);
    toast.success(`Generated ${generated.length} variant(s) matching ${selectedCategory.name} rules`);
  };

  // Upload image to Cloudinary via backend
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
      const publicId = res.data?.publicId || `img_${Date.now()}`;
      if (uploadedUrl) {
        setImages((prev) => [
          ...prev,
          { url: uploadedUrl, publicId, isPrimary: prev.length === 0 },
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

  const handleAddImageUrl = () => {
    if (!imageInputUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        url: imageInputUrl.trim(),
        publicId: `url_${Date.now()}`,
        isPrimary: prev.length === 0,
      },
    ]);
    setImageInputUrl("");
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index }))
    );
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

    if (!title.trim()) {
      toast.error("Please provide a product title");
      return;
    }
    if (!brand.trim()) {
      toast.error("Please provide a brand name");
      return;
    }
    if (!categoryId) {
      toast.error("Please choose a category");
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      toast.error("Please provide a valid base price in BDT (৳)");
      return;
    }
    if (images.length === 0) {
      toast.error("Please add at least one product image");
      return;
    }
    if (variantRows.length === 0) {
      toast.error("Please generate product variants for inventory management");
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanTitle = title.trim();
      const cleanBrand = brand.trim();
      const baseSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const generatedSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedSkuPrefix = `${cleanBrand.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      const payload = {
        title: cleanTitle,
        slug: generatedSlug,
        brand: cleanBrand,
        skuPrefix: generatedSkuPrefix,
        description: description.trim() || "Authentic Bangladeshi marketplace product with official warranty.",
        basePrice: Number(basePrice),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        categoryId,
        isFeatured,
        images: images.map((img, idx) => ({
          url: img.url,
          publicId: img.publicId || `img_${Date.now()}_${idx}`,
          isPrimary: img.isPrimary,
          sortOrder: idx,
        })),
        variants: variantRows.map((v) => ({
          sku: v.sku.trim(),
          price: Number(v.price),
          stockQuantity: Number(v.stockQuantity),
          attributes: v.attributes,
        })),
      };

      await apiClient.post("/products", payload);
      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to create product"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Add New Product</h2>
            <p className="text-xs text-gray-500">
              Strict category-governed Bangladeshi catalog builder
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Creating Product..." : "Save & Publish"}
        </button>
      </div>

      {/* 1. BASIC INFORMATION */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
          <Package className="w-4 h-4" />
          <h3>Basic Product Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Title */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-gray-700">Product Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Premium Embroidered Cotton Panjabi"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-emerald-600"
            />
          </div>

          {/* Brand */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Brand *</label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Sailor, Apex, Bata, Anker"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-emerald-600"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Category *</label>
            <select
              required
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setVariantRows([]); // Reset variants when category switches
              }}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:outline-emerald-600 text-gray-800"
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Base Price (BDT) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Base Price (৳ BDT) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                ৳
              </span>
              <input
                type="number"
                required
                min="1"
                value={basePrice}
                onChange={(e) =>
                  setBasePrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="2450"
                className="w-full pl-8 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Discount Price (BDT) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">
              Discount Price (৳ Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                ৳
              </span>
              <input
                type="number"
                min="1"
                value={discountPrice}
                onChange={(e) =>
                  setDiscountPrice(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="1990"
                className="w-full pl-8 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-emerald-600 text-emerald-600"
              />
            </div>
          </div>

          {/* Description */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-gray-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed product features, materials, and warranty information..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* FEATURED STATUS SECTION */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <h3>Featured Product Showcase</h3>
          </div>
          {isFeatured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 animate-in fade-in">
              <Sparkles className="w-3 h-3" />
              Featured on Homepage
            </span>
          ) : (
            <span className="text-xs font-semibold text-gray-400">Standard Catalog Item</span>
          )}
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors">
          <div className="space-y-0.5 pr-4">
            <label htmlFor="isFeaturedToggle" className="text-xs sm:text-sm font-bold text-gray-900 cursor-pointer">
              Mark as Featured Product (isFeatured)
            </label>
            <p className="text-xs text-gray-500">
              Featured products are exclusively displayed in the landing page category showcases and randomized on the featured discovery page.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              id="isFeaturedToggle"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {/* 2. PRODUCT IMAGES */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <Upload className="w-4 h-4" />
            <h3>Product Media & Cloudinary Storage</h3>
          </div>
          <span className="text-[11px] text-gray-400">First image will default to primary thumbnail</span>
        </div>

        {/* Upload Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? "Uploading to Cloudinary..." : "Upload File"}</span>
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <span className="text-xs text-gray-400 font-medium">or URL:</span>

          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <input
              type="url"
              value={imageInputUrl}
              onChange={(e) => setImageInputUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-emerald-600"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800"
            >
              Add URL
            </button>
          </div>
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative group rounded-xl overflow-hidden border-2 aspect-square bg-gray-100 ${
                  img.isPrimary ? "border-emerald-600 shadow-sm" : "border-gray-200"
                }`}
              >
                <Image src={img.url} alt="Uploaded preview" fill className="object-cover" />
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    Primary
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(idx)}
                      className="p-1.5 bg-white text-gray-900 rounded-lg text-[10px] font-bold hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Make Primary
                    </button>
                  )}
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
        )}
      </div>

      {/* 3. STRICT CATEGORY-VARIANT GENERATOR */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <Layers className="w-4 h-4" />
            <h3>Category-Strict Variations & Inventory</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            Rules Guard Active
          </span>
        </div>

        {!selectedCategory ? (
          <div className="p-8 border-2 border-dashed rounded-xl text-center text-xs text-gray-400 space-y-1">
            <AlertCircle className="w-6 h-6 mx-auto text-gray-300" />
            <p className="font-semibold text-gray-600">Please select a Category above</p>
            <p>Variation attributes are automatically customized according to your chosen category.</p>
          </div>
        ) : selectedCategory.type === "FASHION" ? (
          /* FASHION BUILDER */
          <div className="space-y-4 p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800">1. Select Target Gender</label>
              <div className="flex gap-2">
                {FASHION_GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFashionGender(g)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                      fashionGender === g
                        ? "bg-purple-700 text-white shadow-xs"
                        : "bg-white border border-purple-200 text-purple-900 hover:bg-purple-100/60"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800">
                2. Select Apparel Sizes (Strictly s, m, l, xl, xxl)
              </label>
              <div className="flex flex-wrap gap-2">
                {FASHION_SIZES.map((sz) => {
                  const isSelected = selectedFashionSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        setSelectedFashionSizes((prev) =>
                          isSelected ? prev.filter((s) => s !== sz) : [...prev, sz]
                        )
                      }
                      className={`w-12 h-9 rounded-xl text-xs font-bold uppercase transition-colors ${
                        isSelected
                          ? "bg-purple-700 text-white shadow-xs"
                          : "bg-white border border-purple-200 text-purple-900 hover:bg-purple-100/60"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={generateVariants}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Fashion Variants</span>
            </button>
          </div>
        ) : selectedCategory.type === "FOOTWEAR" ? (
          /* FOOTWEAR BUILDER */
          <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800">1. Select Target Gender</label>
              <div className="flex gap-2">
                {FOOTWEAR_GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFootwearGender(g)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                      footwearGender === g
                        ? "bg-blue-700 text-white shadow-xs"
                        : "bg-white border border-blue-200 text-blue-900 hover:bg-blue-100/60"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800">
                2. Select Shoe Sizes (Strictly 5, 6, 7, 8, 9, 10)
              </label>
              <div className="flex flex-wrap gap-2">
                {FOOTWEAR_SIZES.map((sz) => {
                  const isSelected = selectedFootwearSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        setSelectedFootwearSizes((prev) =>
                          isSelected ? prev.filter((s) => s !== sz) : [...prev, sz]
                        )
                      }
                      className={`w-12 h-9 rounded-xl text-xs font-bold transition-colors ${
                        isSelected
                          ? "bg-blue-700 text-white shadow-xs"
                          : "bg-white border border-blue-200 text-blue-900 hover:bg-blue-100/60"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={generateVariants}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Footwear Variants</span>
            </button>
          </div>
        ) : (
          /* ELECTRONICS BUILDER */
          <div className="space-y-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800">
                1. Select Gadget Type (Strictly watch, charger, power bank, earbuds)
              </label>
              <div className="flex flex-wrap gap-2">
                {ELECTRONICS_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setElectronicsType(t)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                      electronicsType === t
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-white border border-emerald-200 text-emerald-900 hover:bg-emerald-100/60"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {electronicsType === "watch" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800">
                  2. Select Watch Target Gender
                </label>
                <div className="flex gap-2">
                  {WATCH_GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setWatchGender(g)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                        watchGender === g
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-white border border-emerald-200 text-emerald-900 hover:bg-emerald-100/60"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={generateVariants}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Electronics Variant</span>
            </button>
          </div>
        )}

        {/* 4. INVENTORY MATRIX TABLE */}
        {variantRows.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Generated Inventory Matrix ({variantRows.length} Variant{variantRows.length > 1 ? "s" : ""})
              </h4>
              <span className="text-[11px] text-gray-400">Set individual stock and pricing below</span>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Attributes</th>
                    <th className="py-2.5 px-3">Generated SKU</th>
                    <th className="py-2.5 px-3">Price (৳ BDT)</th>
                    <th className="py-2.5 px-3">Stock Quantity</th>
                    <th className="py-2.5 px-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {variantRows.map((row, idx) => (
                    <tr key={row.key} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-semibold text-gray-900 capitalize">
                        {row.attributes.size && `Size ${row.attributes.size.toUpperCase()} `}
                        {row.attributes.gender && `(${row.attributes.gender}) `}
                        {row.attributes.type && `Type: ${row.attributes.type}`}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        <input
                          type="text"
                          value={row.sku}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariantRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, sku: val } : r))
                            );
                          }}
                          className="px-2 py-1 bg-gray-50 border rounded font-mono text-[11px] w-36"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="1"
                          value={row.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariantRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, price: val } : r))
                            );
                          }}
                          className="px-2 py-1 bg-gray-50 border rounded font-bold text-xs w-24"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          value={row.stockQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariantRows((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, stockQuantity: val } : r
                              )
                            );
                          }}
                          className="px-2 py-1 bg-gray-50 border rounded font-bold text-xs w-20 text-emerald-700"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setVariantRows((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
