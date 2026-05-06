import { api } from "./client";

type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  locale: string;
  timezone: string;
};

export type ProfilePayload = {
  fullName?: string;
  locale?: string;
  timezone?: string;
};

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
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
  try {
    const res = await api.get("/users/profile");
    return res.data;
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;

    if (status !== 404) {
      throw error;
    }

    const res = await api.get("/auth/me");
    return res.data;
  }
};

export const updateProfile = async (payload: ProfilePayload) => {
  try {
    const res = await api.patch("/users/profile", payload);
    return res.data;
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;

    if (status !== 404) {
      throw error;
    }

    const res = await api.patch("/auth/me", payload);
    return res.data;
  }
};

export const changePassword = async (payload: ChangePasswordPayload) => {
  const res = await api.patch("/users/profile/password", payload);
  return res.data;
};
