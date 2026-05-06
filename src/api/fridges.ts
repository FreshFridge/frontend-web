import { api } from "./client";

export type FridgePayload = {
  name: string;
};

export type ShelfPayload = {
  name: string;
};

export const getFridges = async () => {
  const res = await api.get("/fridges");
  return res.data;
};

export const createFridge = async (fridge: FridgePayload) => {
  const res = await api.post("/fridges", fridge);
  return res.data;
};

export const deleteFridge = async (fridgeId: string | number) => {
  await api.delete(`/fridges/${fridgeId}`);
};

export const getShelves = async (fridgeId: string | number) => {
  const res = await api.get(`/fridges/${fridgeId}/shelves`);
  return res.data;
};

export const createShelf = async (
  fridgeId: string | number,
  shelf: ShelfPayload,
) => {
  const res = await api.post(`/fridges/${fridgeId}/shelves`, shelf);
  return res.data;
};

export const updateShelf = async (
  shelfId: string | number,
  shelf: ShelfPayload,
) => {
  const res = await api.put(`/shelves/${shelfId}`, shelf);
  return res.data;
};

export const deleteShelf = async (shelfId: string | number) => {
  await api.delete(`/shelves/${shelfId}`);
};
