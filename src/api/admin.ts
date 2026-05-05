import { api } from "./client";

export type UserRole = "user" | "admin";

export const getUsers = async () => {
  const res = await api.get("/admin/users");
  return res.data;
};

export const updateUserRole = async (
  userId: string | number,
  role: UserRole,
) => {
  const res = await api.patch(`/admin/users/${userId}/role`, { role });
  return res.data;
};

export const blockUser = async (userId: string | number) => {
  const res = await api.patch(`/admin/users/${userId}/block`);
  return res.data;
};
