export type ProductFreshnessStatus = "FRESH" | "EXPIRING" | "EXPIRED" | "RISK";

export type ProductFreshnessInput = {
  expirationDate?: string | null;
  expiryDate?: string | null;
  freshnessScore?: number | null;
  storagePenalty?: number | null;
  lastFreshnessUpdate?: number | string | Date | null;
};

export type ProductTelemetryInput = {
  temperature?: number | string | null;
  humidity?: number | string | null;
  doorOpen?: boolean | null;
  door_open?: boolean | null;
} | null;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const parseDateOnly = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const [datePart] = value.split("T");
  const parts = datePart.split("-").map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const todayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const toNumber = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTimestamp = (value?: number | string | Date | null) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsedNumber = Number(value);
  if (Number.isFinite(parsedNumber)) {
    return parsedNumber;
  }

  const parsedDate = new Date(value).getTime();
  return Number.isNaN(parsedDate) ? null : parsedDate;
};

const clampScore = (score: number) => Math.min(100, Math.max(0, score));
const clampPenalty = (penalty: number) => Math.min(30, Math.max(0, penalty));

export const getDaysUntilExpiration = (product: ProductFreshnessInput) => {
  const expirationDate = parseDateOnly(
    product.expirationDate ?? product.expiryDate,
  );

  if (!expirationDate) {
    return null;
  }

  return Math.ceil(
    (expirationDate.getTime() - todayDateOnly().getTime()) / MS_PER_DAY,
  );
};

export const getExpirationFreshness = (product: ProductFreshnessInput) => {
  const daysLeft = getDaysUntilExpiration(product);

  if (daysLeft === null) {
    return 100;
  }

  if (daysLeft < 0) {
    return 0;
  }

  if (daysLeft === 0) {
    return 10;
  }

  if (daysLeft === 1) {
    return 25;
  }

  if (daysLeft <= 3) {
    return 50;
  }

  if (daysLeft <= 7) {
    return 75;
  }

  return 100;
};

export const hasTelemetryRisk = (telemetry: ProductTelemetryInput) => {
  if (!telemetry) {
    return false;
  }

  const temperature = toNumber(telemetry.temperature);
  const humidity = toNumber(telemetry.humidity);
  const doorOpen = telemetry.doorOpen ?? telemetry.door_open ?? false;

  return (
    (temperature !== null && temperature > 8) ||
    (humidity !== null && humidity > 75) ||
    doorOpen === true
  );
};

export const getTelemetryRiskReasons = (telemetry: ProductTelemetryInput) => {
  if (!telemetry) {
    return [];
  }

  const reasons: Array<"highTemperature" | "highHumidity" | "doorOpen"> = [];
  const temperature = toNumber(telemetry.temperature);
  const humidity = toNumber(telemetry.humidity);
  const doorOpen = telemetry.doorOpen ?? telemetry.door_open ?? false;

  if (temperature !== null && temperature > 8) {
    reasons.push("highTemperature");
  }

  if (humidity !== null && humidity > 75) {
    reasons.push("highHumidity");
  }

  if (doorOpen) {
    reasons.push("doorOpen");
  }

  return reasons;
};

export const updateFreshness = (
  product: ProductFreshnessInput,
  telemetry: ProductTelemetryInput,
  now = Date.now(),
) => {
  const currentPenalty = clampPenalty(
    toNumber(product.storagePenalty) ??
      (product.freshnessScore === null || product.freshnessScore === undefined
        ? 0
        : 100 - clampScore(toNumber(product.freshnessScore) ?? 100)),
  );
  const lastUpdate = toTimestamp(product.lastFreshnessUpdate) ?? now;
  const deltaSeconds = Math.max(0, (now - lastUpdate) / 1000);
  const temperature = toNumber(telemetry?.temperature);
  const humidity = toNumber(telemetry?.humidity);
  const doorOpen = telemetry?.doorOpen ?? telemetry?.door_open ?? false;

  let damagePerSecond = 0;
  if (temperature !== null && temperature > 8) damagePerSecond += 0.001;
  if (humidity !== null && humidity > 75) damagePerSecond += 0.0007;
  if (doorOpen) damagePerSecond += 0.0005;

  const damage = damagePerSecond * deltaSeconds;

  return {
    storagePenalty: clampPenalty(currentPenalty + damage),
    lastFreshnessUpdate: now,
  };
};

export const getProductFreshness = (
  product: ProductFreshnessInput,
  _telemetry?: ProductTelemetryInput,
) => {
  const daysLeft = getDaysUntilExpiration(product);
  const expirationFreshness = getExpirationFreshness(product);
  const storagePenalty = clampPenalty(
    toNumber(product.storagePenalty) ??
      (product.freshnessScore === null || product.freshnessScore === undefined
        ? 0
        : 100 - clampScore(toNumber(product.freshnessScore) ?? 100)),
  );
  const finalFreshness =
    daysLeft !== null && daysLeft < 0
      ? 0
      : Math.round(clampScore(expirationFreshness - storagePenalty));

  let status: ProductFreshnessStatus = "FRESH";
  if ((daysLeft !== null && daysLeft < 0) || finalFreshness <= 0) {
    status = "EXPIRED";
  } else if (finalFreshness < 40) {
    status = "RISK";
  } else if ((daysLeft !== null && daysLeft <= 3) || finalFreshness < 70) {
    status = "EXPIRING";
  }

  return {
    daysLeft,
    expirationFreshness,
    storagePenalty,
    finalFreshness,
    status,
  };
};

export const getProductStatus = (
  product: ProductFreshnessInput,
  telemetry?: ProductTelemetryInput,
): ProductFreshnessStatus => {
  return getProductFreshness(product, telemetry).status;
};

export const calculateFreshnessScore = (
  product: ProductFreshnessInput,
  telemetry?: ProductTelemetryInput,
) => {
  return getProductFreshness(product, telemetry).finalFreshness;
};

export const PRODUCT_STATUS_ORDER: Record<ProductFreshnessStatus, number> = {
  EXPIRED: 0,
  RISK: 1,
  EXPIRING: 2,
  FRESH: 3,
};
