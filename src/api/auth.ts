import { api } from "./client";

type RegisterPayload = {
  email: string;
  password: string;
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
