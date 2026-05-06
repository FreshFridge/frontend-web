import { api } from "./client";

type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  locale: string;
  timezone: string;
};

export type ProfilePayload = {
  fullName: string;
  locale: string;
  timezone: string;
};

export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  console.log(res.data);
  return res.data;
};

export const register = async (payload: RegisterPayload) => {
  const res = await api.post("/auth/register", payload);
  console.log(res.data);
  return res.data;
};

export const getProfile = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const updateProfile = async (payload: ProfilePayload) => {
  const res = await api.patch("/auth/me", payload);
  return res.data;
};
