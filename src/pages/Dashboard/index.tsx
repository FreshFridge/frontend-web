import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFridges } from "../../api/fridges";
import { getLatestTelemetry, type TelemetryRecord } from "../../api/iot";
import { getProducts } from "../../api/products";
import { getProductFreshness } from "../../utils/productFreshness";

const STALE_AFTER_MS = 30_000;
const POLLING_INTERVAL_MS = 5000;
const SELECTED_FRIDGE_STORAGE_KEY = "dashboardSelectedFridgeId";

const getItems = <T,>(data: T[] | { items?: T[] }) => {
  return Array.isArray(data) ? data : data.items ?? [];
};

type Fridge = {
  id: string;
  name?: string;
};

type TelemetryStatus = "idle" | "loading" | "success" | "empty" | "error";

const getNumberValue = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDoorOpen = (telemetry: TelemetryRecord | null) => {
  return telemetry?.doorOpen ?? telemetry?.door_open ?? null;
};

const getTelemetryTime = (telemetry: TelemetryRecord | null) => {
  return (
    telemetry?.recordedAt ??
    telemetry?.recorded_at ??
    telemetry?.createdAt ??
    telemetry?.created_at ??
    null
  );
};

function Dashboard() {
  const { i18n, t } = useTranslation();
  const telemetryRequestIdRef = useRef(0);
  const [productsCount, setProductsCount] = useState(0);
  const [fridgesCount, setFridgesCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [selectedFridgeId, setSelectedFridgeId] = useState("");
  const [telemetry, setTelemetry] = useState<TelemetryRecord | null>(null);
  const [telemetryStatus, setTelemetryStatus] =
    useState<TelemetryStatus>("idle");
  const [isTelemetryRefreshing, setIsTelemetryRefreshing] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [productsData, fridgesData] = await Promise.all([
          getProducts(),
          getFridges(),
        ]);
        const fridgeItems = getItems<Fridge>(fridgesData);
        const productItems = getItems<{
          expirationDate?: string | null;
          freshnessScore?: number | null;
          storagePenalty?: number | null;
          lastFreshnessUpdate?: number | string | Date | null;
        }>(productsData);

        setProductsCount(productsData.total ?? productItems.length);
        setFridgesCount(fridgeItems.length);
        setExpiredCount(
          productItems.filter(
            (product) => getProductFreshness(product).status === "EXPIRED",
          ).length,
        );
        setExpiringCount(
          productItems.filter(
            (product) => getProductFreshness(product).status === "EXPIRING",
          ).length,
        );
        setFridges(fridgeItems);
        setSelectedFridgeId((currentId) => {
          const savedId = localStorage.getItem(SELECTED_FRIDGE_STORAGE_KEY);
          const nextId = currentId || savedId || "";
          const fridgeExists = fridgeItems.some((fridge) => fridge.id === nextId);

          if (nextId && !fridgeExists) {
            localStorage.removeItem(SELECTED_FRIDGE_STORAGE_KEY);
            return "";
          }

          return fridgeExists ? nextId : "";
        });
      } catch (error) {
        console.log(error);
      }
    };

    loadStats();
  }, []);

  const fetchLatestTelemetry = useCallback(async () => {
    const fridgeId = selectedFridgeId;
    if (!fridgeId) {
      setTelemetry(null);
      setTelemetryStatus("idle");
      setIsTelemetryRefreshing(false);
      return;
    }

    const requestId = telemetryRequestIdRef.current + 1;
    telemetryRequestIdRef.current = requestId;

    setTelemetryStatus((currentStatus) =>
      currentStatus === "idle" ? "loading" : currentStatus,
    );
    setIsTelemetryRefreshing(true);

    try {
      const data = await getLatestTelemetry(fridgeId);
      if (telemetryRequestIdRef.current !== requestId) {
        return;
      }

      setTelemetry(data ?? null);
      setTelemetryStatus(data ? "success" : "empty");
    } catch (error) {
      if (telemetryRequestIdRef.current !== requestId) {
        return;
      }

      console.log(error);
      setTelemetry(null);
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      setTelemetryStatus(status === 404 ? "empty" : "error");
    } finally {
      if (telemetryRequestIdRef.current === requestId) {
        setIsTelemetryRefreshing(false);
      }
    }
  }, [selectedFridgeId]);

  useEffect(() => {
    if (!selectedFridgeId) {
      telemetryRequestIdRef.current += 1;
      setTelemetry(null);
      setTelemetryStatus("idle");
      setIsTelemetryRefreshing(false);
      return;
    }

    fetchLatestTelemetry();
    const intervalId = window.setInterval(
      fetchLatestTelemetry,
      POLLING_INTERVAL_MS,
    );

    return () => window.clearInterval(intervalId);
  }, [fetchLatestTelemetry, selectedFridgeId]);

  const handleFridgeChange = (fridgeId: string) => {
    setSelectedFridgeId(fridgeId);
    setTelemetry(null);
    setTelemetryStatus(fridgeId ? "loading" : "idle");

    if (fridgeId) {
      localStorage.setItem(SELECTED_FRIDGE_STORAGE_KEY, fridgeId);
    } else {
      localStorage.removeItem(SELECTED_FRIDGE_STORAGE_KEY);
    }
  };

  const refreshTelemetry = () => {
    fetchLatestTelemetry();
  };

  const temperature = getNumberValue(telemetry?.temperature);
  const humidity = getNumberValue(telemetry?.humidity);
  const doorOpen = getDoorOpen(telemetry);
  const telemetryTime = getTelemetryTime(telemetry);
  const telemetryDate = telemetryTime ? new Date(telemetryTime) : null;
  const isTelemetryStale =
    telemetryStatus === "success" &&
    telemetryDate !== null &&
    !Number.isNaN(telemetryDate.getTime()) &&
    Date.now() - telemetryDate.getTime() > STALE_AFTER_MS;
  const isInitialTelemetryLoading = telemetryStatus === "loading" && !telemetry;
  const isTelemetryError = telemetryStatus === "error";
  const isTelemetryEmpty = telemetryStatus === "empty";

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return t("no_data");
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return t("no_data");
    }

    return date.toLocaleString(i18n.language);
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t("dashboard")}</h1>
        <p>{t("dashboardSubtitle")}</p>
      </header>

      <section className="grid stats-grid">
        <article className="card stat-card">
          <span className="stat-label">{t("products")}</span>
          <span className="stat-value">{productsCount}</span>
        </article>
        <article className="card stat-card">
          <span className="stat-label">{t("fridges")}</span>
          <span className="stat-value">{fridgesCount}</span>
        </article>
        <article className="card stat-card">
          <span className="stat-label">{t("expired")}</span>
          <span className="stat-value">{expiredCount}</span>
        </article>
        <article className="card stat-card">
          <span className="stat-label">{t("expiringSoon")}</span>
          <span className="stat-value">{expiringCount}</span>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>{t("fridgeStatus")}</h2>
            <p className="muted">{t("fridgeStatusSubtitle")}</p>
          </div>
          <div className="section-actions">
            {fridges.length > 0 && (
              <label className="compact-select">
                <span>{t("fridge")}</span>
                <select
                  value={selectedFridgeId}
                  onChange={(event) => handleFridgeChange(event.target.value)}
                >
                  <option value="">{t("selectFridge")}</option>
                  {fridges.map((fridge) => (
                    <option key={fridge.id} value={fridge.id}>
                      {fridge.name || fridge.id}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              className="button button-secondary"
              disabled={!selectedFridgeId || isTelemetryRefreshing}
              type="button"
              onClick={refreshTelemetry}
            >
              {isTelemetryRefreshing ? t("loading") : t("refresh")}
            </button>
          </div>
        </div>

        {isInitialTelemetryLoading && (
          <p className="muted dashboard-error">{t("loading")}</p>
        )}

        {isTelemetryError && (
          <p className="form-error dashboard-error">{t("iotUnavailable")}</p>
        )}

        {isTelemetryEmpty && (
          <p className="muted dashboard-error">{t("no_data")}</p>
        )}

        {isTelemetryStale && (
          <p className="form-error dashboard-error">{t("staleData")}</p>
        )}

        <div className="grid iot-grid">
          <article className="iot-card">
            <span className="iot-icon" aria-hidden="true">
              🌡
            </span>
            <span className="stat-label">{t("temperature")}</span>
            <strong className="iot-value">
              {temperature === null ? t("no_data") : `${temperature.toFixed(1)} °C`}
            </strong>
          </article>

          <article className="iot-card">
            <span className="iot-icon" aria-hidden="true">
              💧
            </span>
            <span className="stat-label">{t("humidity")}</span>
            <strong className="iot-value">
              {humidity === null ? t("no_data") : `${humidity.toFixed(1)} %`}
            </strong>
          </article>

          <article className="iot-card">
            <span className="iot-icon" aria-hidden="true">
              🚪
            </span>
            <span className="stat-label">{t("door")}</span>
            <strong className="iot-value">
              {doorOpen === null ? t("no_data") : doorOpen ? t("door_open") : t("door_closed")}
            </strong>
            {doorOpen !== null && (
              <span className={`badge ${doorOpen ? "badge-danger" : "badge-success"}`}>
                {doorOpen ? t("door_open") : t("door_closed")}
              </span>
            )}
          </article>
        </div>

        <p className="last-updated">
          {t("last_updated")}: {formatDateTime(telemetryTime)}
        </p>
      </section>
    </main>
  );
}

export default Dashboard;
