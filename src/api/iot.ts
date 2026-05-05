import { api } from "./client";

export type TelemetryRecord = {
  id?: string;
  fridgeId?: string;
  fridge_id?: string;
  temperature?: number | null;
  humidity?: number | null;
  doorOpen?: boolean | null;
  door_open?: boolean | null;
  recordedAt?: string | null;
  recorded_at?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
};

export const getLatestTelemetry = async (fridgeId: string) => {
  const res = await api.get<TelemetryRecord>(
    `/iot/telemetry/${fridgeId}/latest`,
  );
  return res.data;
};

export const getTelemetryHistory = async (fridgeId: string, limit = 1) => {
  const res = await api.get<TelemetryRecord[]>(
    `/iot/telemetry/${fridgeId}`,
    {
      params: { limit, offset: 0 },
    },
  );
  return res.data;
};
