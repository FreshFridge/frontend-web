import { api } from "./client";

export type ProductPayload = {
  name: string;
  categoryId: string;
  fridgeId: string | null;
  shelfId: string | null;
  expirationDate: string | null;
  status: "active" | "consumed" | "expired" | "removed";
};

export const getProducts = async () => {
  const res = await api.get("/products");
  return res.data;
};

export const createProduct = async (product: ProductPayload) => {
  const res = await api.post("/products", product);
  return res.data;
};

export const updateProduct = async (
  productId: string | number,
  product: Partial<ProductPayload>,
) => {
  const res = await api.patch(`/products/${productId}`, product);
  return res.data;
};

export const deleteProduct = async (productId: string | number) => {
  await api.delete(`/products/${productId}`);
};

export const getExpiringProducts = async () => {
  const res = await api.get("/products/expiring");
  return res.data;
};
