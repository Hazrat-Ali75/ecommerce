---
name: ecommerce-business-rules
description: >-
  Enforces and validates domain-specific business rules for the Bangladeshi e-commerce platform.
  Use when creating or updating product variations, categories, catalog filters, cart/checkout logic,
  or delivery fee calculations to prevent adding unauthorized attributes or violating business logic.
---

# Bangladeshi E-Commerce Business Rules & Validation Guide

This skill governs the domain logic, product variation boundaries, delivery calculations, and checkout flows. Any modification to the catalog, cart, checkout, or admin product management must adhere to these rules.

---

## 1. Category & Variation Invariants (STRICT)

> [!CAUTION]
> **Zero Extra Attributes Rule**: Do NOT introduce extra attributes like color, material, storage, ram, plug types, etc. Only the exact attributes specified below are allowed.

### Rule 1: Fashion & Apparel
- **Target Category Name**: `Fashion & Apparel`
- **Allowed Attributes**:
  - `gender`: `"men"` | `"women"` | `"kids"`
  - `size`: `"s"` | `"m"` | `"l"` | `"xl"` | `"xxl"`
  - `brand`: String (e.g. Sailor, Aarong, Richman, Yellow, Apex)
- **JSON Structure**:
  ```json
  { "gender": "men", "size": "xl" }
  ```

### Rule 2: Footwear & Sneakers
- **Target Category Name**: `Footwear & Sneakers`
- **Allowed Attributes**:
  - `gender`: `"men"` | `"women"` | `"kids"`
  - `size`: `"5"` | `"6"` | `"7"` | `"8"` | `"9"` | `"10"`
  - `brand`: String (e.g. Apex, Bata, Lotto, Bay, Orion)
- **JSON Structure**:
  ```json
  { "gender": "men", "size": "9" }
  ```

### Rule 3: Electronics & Gadgets
- **Target Category Name**: `Electronics & Gadgets`
- **Allowed Sub-Types**:
  - `watch` $\rightarrow$ with `gender`: `"men"` | `"women"`
  - `charger`
  - `power bank`
  - `earbuds`
- **Allowed Brand**: String (e.g. Apple, Samsung, Xiaomi, Anker, Baseus)
- **JSON Structure**:
  - Watch: `{ "type": "watch", "gender": "men" }`
  - Charger: `{ "type": "charger" }`
  - Power Bank: `{ "type": "power bank" }`
  - Earbuds: `{ "type": "earbuds" }`

---

## 2. Catalog Filtering vs. Product Details Page Invariants

### Rule 4: Catalog Sidebar Filtering
- **NEVER** render size filters in the catalog sidebar for Fashion or Footwear.
- Sidebar filters are strictly:
  - **Fashion**: Gender (Men, Women, Kids), Brand, Price range.
  - **Footwear**: Gender (Men, Women, Kids), Brand, Price range.
  - **Electronics**: Product Type (Watch, Charger, Power Bank, Earbuds), Watch Gender (Men, Women), Brand, Price range.

### Rule 5: Product Details Page Size Selection
- Size selection (`S` to `XXL` or `5` to `10`) occurs **strictly on the individual Product Details Page**.
- Render interactive pills (`[ S ]`, `[ M ]`, etc.) with real-time stock feedback.
- Add to Cart must be disabled until a size variant is selected by the customer.

---

## 3. Bangladeshi Market Logistics & Pricing Invariants

### Rule 6: Currency Representation
- Display currency in Bangladeshi Taka: `৳` (BDT).
- Formatted as `৳X,XXX` (e.g., `৳1,450`).

### Rule 7: Tiered Delivery Charges
- **Inside Dhaka**: Flat rate ৳60. Delivery window: 24–48 hours.
- **Outside Dhaka**: Flat rate ৳120. Delivery window: 3–5 days across 64 districts.
- The delivery fee must automatically recalculate at checkout when the customer selects their delivery zone or enters their address.

### Rule 8: Bangladeshi Mobile Number Validation
- All checkout and tracking phone numbers must match:
  ```regex
  ^01[3-9]\d{8}$
  ```
  *(11 digits starting with 013, 014, 015, 016, 017, 018, 019)*.

### Rule 9: Dual Checkout Support
- **Cash on Delivery (COD)**: Available nationwide. Order status defaults to `PENDING`.
- **Instant Online Payment (Stripe)**: Session created in BDT equivalent. Status automatically updates to `PAID` upon Stripe webhook verification.
