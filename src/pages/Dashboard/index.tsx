import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFridges } from "../../api/fridges";
import { getLatestTelemetry, type TelemetryRecord } from "../../api/iot";
import { getExpiringProducts, getProducts } from "../../api/products";

const STALE_AFTER_MS = 30_000;

const getItems = <T,>(data: T[] | { items?: T[] }) => {
  return Array.isArray(data) ? data : data.items ?? [];
};

type Fridge = {
  id: string;
  name?: string;
};

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
  const [productsCount, setProductsCount] = useState(0);
  const [fridgesCount, setFridgesCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [selectedFridgeId, setSelectedFridgeId] = useState("");
  const [telemetry, setTelemetry] = useState<TelemetryRecord | null>(null);
  const [isTelemetryLoading, setIsTelemetryLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [productsData, fridgesData, expiringData] = await Promise.all([
          getProducts(),
          getFridges(),
          getExpiringProducts(),
        ]);
        const fridgeItems = getItems<Fridge>(fridgesData);

        setProductsCount(productsData.total ?? getItems(productsData).length);
        setFridgesCount(fridgeItems.length);
        setExpiringCount(getItems(expiringData).length);
        setFridges(fridgeItems);
      } catch (error) {
        console.log(error);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    if (!selectedFridgeId) {
      setTelemetry(null);
      return;
    }

    const loadTelemetry = async () => {
      try {
        setIsTelemetryLoading(true);
        const data = await getLatestTelemetry(selectedFridgeId);
        setTelemetry(data ?? null);
      } catch (error) {
        console.log(error);
        setTelemetry(null);
      } finally {
        setIsTelemetryLoading(false);
      }
    };

    loadTelemetry();
    const intervalId = window.setInterval(loadTelemetry, 5000);

    return () => window.clearInterval(intervalId);
  }, [selectedFridgeId]);

  const refreshTelemetry = async () => {
    if (!selectedFridgeId) {
      return;
    }

    try {
      setIsTelemetryLoading(true);
      const data = await getLatestTelemetry(selectedFridgeId);
      setTelemetry(data ?? null);
    } catch (error) {
      console.log(error);
      setTelemetry(null);
    } finally {
      setIsTelemetryLoading(false);
    }
  };

  const temperature = getNumberValue(telemetry?.temperature);
  const humidity = getNumberValue(telemetry?.humidity);
  const doorOpen = getDoorOpen(telemetry);
  const telemetryTime = getTelemetryTime(telemetry);
  const telemetryDate = telemetryTime ? new Date(telemetryTime) : null;
  const isTelemetryStale =
    telemetryDate !== null &&
    !Number.isNaN(telemetryDate.getTime()) &&
    Date.now() - telemetryDate.getTime() > STALE_AFTER_MS;

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

      <section className="card card-soft">
        <h2>{t("welcomeTitle")}</h2>
        <p className="muted">{t("welcomeText")}</p>
      </section>

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
                  onChange={(event) => setSelectedFridgeId(event.target.value)}
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
              disabled={!selectedFridgeId || isTelemetryLoading}
              type="button"
              onClick={refreshTelemetry}
            >
              {isTelemetryLoading ? t("loading") : t("refresh")}
            </button>
          </div>
        </div>

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
