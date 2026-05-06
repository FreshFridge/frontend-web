import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { getFridges, getShelves } from "../../api/fridges";
import { getLatestTelemetry, type TelemetryRecord } from "../../api/iot";
import {
  createProduct,
  deleteProduct,
  getExpiringProducts,
  getProducts,
  updateProduct,
} from "../../api/products";
import {
  calculateFreshnessScore,
  getDaysUntilExpiration,
  getProductFreshness,
  getTelemetryRiskReasons,
  PRODUCT_STATUS_ORDER,
  updateFreshness,
  type ProductFreshnessStatus,
} from "../../utils/productFreshness";
import Badge, { type BadgeTone } from "../../components/ui/Badge";

type Product = {
  id: string | number;
  name: string;
  fridgeId?: string | null;
  shelfId?: string | null;
  expirationDate?: string;
  freshnessScore?: number;
  storagePenalty?: number;
  lastFreshnessUpdate?: number;
  status?: "active" | "consumed" | "expired" | "removed" | string;
};

type Fridge = {
  id: string | number;
  name?: string;
};

type Shelf = {
  id: string | number;
  fridgeId?: string | number;
  name?: string;
};

type ProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
};

const DEFAULT_CATEGORY_ID = "9AAEC0A6-DB5F-4CDC-8589-185D12F9E159";
const FRESHNESS_STORAGE_KEY = "productFreshnessState";

type StatusFilter = ProductFreshnessStatus | "ALL";
type SortBy = "status" | "expirationDate" | "freshness";

const getItems = <T,>(data: T[] | { items?: T[] }) => {
  return Array.isArray(data) ? data : data.items ?? [];
};

const getStatusTone = (status: ProductFreshnessStatus): BadgeTone => {
  if (status === "EXPIRED") {
    return "danger";
  }

  if (status === "EXPIRING") {
    return "warning";
  }

  if (status === "RISK") {
    return "risk";
  }

  return "success";
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}.${month}.${year}`;
};

type StoredFreshness = Record<
  string,
  {
    freshnessScore: number;
    storagePenalty?: number;
    lastFreshnessUpdate: number;
  }
>;

const readFreshnessStorage = (): StoredFreshness => {
  try {
    const raw = localStorage.getItem(FRESHNESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeFreshnessStorage = (state: StoredFreshness) => {
  localStorage.setItem(FRESHNESS_STORAGE_KEY, JSON.stringify(state));
};

const hydrateProductFreshness = (product: Product): Product => {
  const stored = readFreshnessStorage()[String(product.id)];

  return {
    ...product,
    freshnessScore: stored?.freshnessScore ?? product.freshnessScore ?? 100,
    storagePenalty:
      stored?.storagePenalty ??
      product.storagePenalty ??
      (stored?.freshnessScore === undefined
        ? undefined
        : 100 - stored.freshnessScore),
    lastFreshnessUpdate:
      stored?.lastFreshnessUpdate ??
      product.lastFreshnessUpdate ??
      Date.now(),
  };
};

function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [allShelves, setAllShelves] = useState<Shelf[]>([]);
  const [telemetryByFridgeId, setTelemetryByFridgeId] = useState<
    Record<string, TelemetryRecord | null>
  >({});
  const [name, setName] = useState("");
  const [selectedFridgeId, setSelectedFridgeId] = useState("");
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [fridgeFilter, setFridgeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("status");
  const [errorMessage, setErrorMessage] = useState("");
  const [productsError, setProductsError] = useState("");
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = async () => {
    try {
      setProductsError("");
      const data: ProductsResponse = await getProducts();
      setProducts(data.items.map(hydrateProductFreshness));
    } catch (error) {
      console.error(error);
      setProductsError(t("productsLoadFailed"));
    }
  };

  const loadExpiringProducts = async () => {
    try {
      const data = await getExpiringProducts();
      setExpiringProducts(
        (Array.isArray(data) ? data : data.items ?? []).map(
          hydrateProductFreshness,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const loadFridges = async () => {
    try {
      const data = await getFridges();
      const fridgeItems = getItems<Fridge>(data);
      setFridges(fridgeItems);

      const shelvesByFridge = await Promise.all(
        fridgeItems.map(async (fridge) => {
          try {
            const shelvesData = await getShelves(String(fridge.id));
            return getItems<Shelf>(shelvesData).map((shelf) => ({
              ...shelf,
              fridgeId: fridge.id,
            }));
          } catch (error) {
            console.error(error);
            return [];
          }
        }),
      );

      setAllShelves(shelvesByFridge.flat());
    } catch (error) {
      console.error(error);
    }
  };

  const loadShelves = async (fridgeId: string) => {
    if (!fridgeId) {
      setShelves([]);
      return;
    }

    try {
      const data = await getShelves(fridgeId);
      setShelves(getItems<Shelf>(data));
    } catch (error) {
      console.error(error);
    }
  };

  const refreshProducts = async () => {
    setIsProductsLoading(true);
    await Promise.all([loadProducts(), loadExpiringProducts()]);
    setIsProductsLoading(false);
  };

  useEffect(() => {
    refreshProducts();
    loadFridges();
  }, []);

  const productFridgeIds = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.fridgeId)
          .filter((fridgeId): fridgeId is string => Boolean(fridgeId)),
      ),
    );
  }, [products]);
  const productFridgeIdsKey = productFridgeIds.join("|");

  useEffect(() => {
    if (productFridgeIds.length === 0) {
      setTelemetryByFridgeId({});
      return;
    }

    let isMounted = true;

    const loadTelemetry = async () => {
      const entries = await Promise.all(
        productFridgeIds.map(async (fridgeId) => {
          try {
            const telemetry = await getLatestTelemetry(fridgeId);
            return [fridgeId, telemetry ?? null] as const;
          } catch (error) {
            console.error(error);
            return [fridgeId, null] as const;
          }
        }),
      );

      if (isMounted) {
        setTelemetryByFridgeId(Object.fromEntries(entries));
      }
    };

    loadTelemetry();
    const intervalId = window.setInterval(loadTelemetry, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [productFridgeIdsKey]);

  useEffect(() => {
    if (products.length === 0) {
      return;
    }

    setProducts((currentProducts) => {
      const nextProducts = currentProducts.map((product) => {
        const telemetry = product.fridgeId
          ? telemetryByFridgeId[String(product.fridgeId)]
          : null;
        const freshness = updateFreshness(product, telemetry ?? null);

        return {
          ...product,
          storagePenalty: freshness.storagePenalty,
          lastFreshnessUpdate: freshness.lastFreshnessUpdate,
        };
      });

      const stored = readFreshnessStorage();
      nextProducts.forEach((product) => {
        stored[String(product.id)] = {
          freshnessScore: calculateFreshnessScore(
            product,
            product.fridgeId
              ? telemetryByFridgeId[String(product.fridgeId)] ?? null
              : null,
          ),
          storagePenalty: product.storagePenalty ?? 0,
          lastFreshnessUpdate: product.lastFreshnessUpdate ?? Date.now(),
        };
      });
      writeFreshnessStorage(stored);

      return nextProducts;
    });
  }, [telemetryByFridgeId]);

  const handleFridgeChange = async (fridgeId: string) => {
    setSelectedFridgeId(fridgeId);
    setSelectedShelfId("");
    await loadShelves(fridgeId);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      setErrorMessage("");
      const payload = {
        name,
        fridgeId: selectedFridgeId || null,
        shelfId: selectedShelfId || null,
        expirationDate: expirationDate || null,
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload);
      } else {
        await createProduct({
          ...payload,
          categoryId: DEFAULT_CATEGORY_ID,
          status: "active",
        });
      }

      setName("");
      setSelectedFridgeId("");
      setSelectedShelfId("");
      setShelves([]);
      setExpirationDate("");
      setEditingProductId(null);
      await refreshProducts();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        editingProductId ? t("productUpdateFailed") : t("productCreateFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setExpirationDate(product.expirationDate ?? "");
    setSelectedFridgeId(product.fridgeId ?? "");
    setSelectedShelfId(product.shelfId ?? "");

    if (product.fridgeId) {
      await loadShelves(String(product.fridgeId));
    } else {
      setShelves([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setName("");
    setSelectedFridgeId("");
    setSelectedShelfId("");
    setShelves([]);
    setExpirationDate("");
    setErrorMessage("");
  };

  const handleDeleteProduct = async (productId: string | number) => {
    if (!window.confirm(t("confirmDeleteProduct"))) {
      return;
    }

    try {
      setErrorMessage("");
      await deleteProduct(productId);
      await refreshProducts();
    } catch (error) {
      console.error(error);
      setErrorMessage(t("productDeleteFailed"));
    }
  };

  const getProductTelemetry = (product: Product) => {
    if (!product.fridgeId) {
      return null;
    }

    return telemetryByFridgeId[String(product.fridgeId)] ?? null;
  };

  const getShelfName = (shelfId?: string | null) => {
    if (!shelfId) {
      return "";
    }

    const shelf = allShelves.find((item) => String(item.id) === String(shelfId));
    return shelf?.name || String(shelfId);
  };

  const getFridgeName = (fridgeId?: string | null) => {
    if (!fridgeId) {
      return "";
    }

    const fridge = fridges.find((item) => String(item.id) === String(fridgeId));
    return fridge?.name || String(fridgeId);
  };

  const formatExpirationInfo = (product: Product) => {
    const days = getDaysUntilExpiration(product);
    if (days === null) {
      return t("no_data");
    }

    if (days < 0) {
      return t("overdueDays", { count: Math.abs(days) });
    }

    return t("daysLeft", { count: days });
  };

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        const telemetry = getProductTelemetry(product);
        const { status } = getProductFreshness(product, telemetry);
        const shelfName = getShelfName(product.shelfId).toLowerCase();
        const fridgeName = getFridgeName(product.fridgeId).toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          product.name.toLowerCase().includes(normalizedSearch) ||
          shelfName.includes(normalizedSearch) ||
          fridgeName.includes(normalizedSearch);
        const matchesStatus =
          statusFilter === "ALL" || status === statusFilter;
        const matchesFridge =
          fridgeFilter === "ALL" ||
          String(product.fridgeId ?? "") === String(fridgeFilter);

        return matchesSearch && matchesStatus && matchesFridge;
      })
      .sort((firstProduct, secondProduct) => {
        const firstTelemetry = getProductTelemetry(firstProduct);
        const secondTelemetry = getProductTelemetry(secondProduct);
        const firstFreshness = getProductFreshness(firstProduct, firstTelemetry);
        const secondFreshness = getProductFreshness(
          secondProduct,
          secondTelemetry,
        );

        if (sortBy === "freshness") {
          return firstFreshness.finalFreshness - secondFreshness.finalFreshness;
        }

        if (sortBy === "expirationDate") {
          const firstDays =
            firstFreshness.daysLeft ?? Number.MAX_SAFE_INTEGER;
          const secondDays =
            secondFreshness.daysLeft ?? Number.MAX_SAFE_INTEGER;

          if (firstDays !== secondDays) {
            return firstDays - secondDays;
          }

          return (
            firstFreshness.finalFreshness - secondFreshness.finalFreshness
          );
        }

        const statusDiff =
          PRODUCT_STATUS_ORDER[firstFreshness.status] -
          PRODUCT_STATUS_ORDER[secondFreshness.status];
        if (statusDiff !== 0) {
          return statusDiff;
        }

        return (
          firstFreshness.finalFreshness - secondFreshness.finalFreshness
        );
      });
  }, [
    products,
    telemetryByFridgeId,
    searchTerm,
    statusFilter,
    fridgeFilter,
    sortBy,
    allShelves,
    fridges,
  ]);

  const renderProductCard = (product: Product, hideActions = false) => {
    const telemetry = getProductTelemetry(product);
    const productFreshness = getProductFreshness(product, telemetry);
    const status = productFreshness.status;
    const freshnessScore = productFreshness.finalFreshness;
    const riskReasons = getTelemetryRiskReasons(telemetry);

    return (
      <article
        className={`item-card product-card product-card-${status.toLowerCase()}`}
        key={product.id}
      >
        <div className="item-card-header">
          <h3>{product.name}</h3>
          <Badge tone={getStatusTone(status)}>
            {t(`status${status}`)}
          </Badge>
        </div>
        <div className="product-meta">
          <span>
            <strong>{t("expirationDate")}</strong>
            {formatDate(product.expirationDate)}
          </span>
          <span>
            <strong>{t("timeLeft")}</strong>
            {formatExpirationInfo(product)}
          </span>
          <span>
            <strong>{t("fridge")}</strong>
            {product.fridgeId ? getFridgeName(product.fridgeId) : t("withoutFridge")}
          </span>
          <span>
            <strong>{t("shelf")}</strong>
            {product.shelfId ? getShelfName(product.shelfId) : t("withoutShelf")}
          </span>
        </div>
        <div
          className="freshness-meter"
          aria-label={`${t("freshness")}: ${freshnessScore}%`}
        >
          <div className="freshness-meter-header">
            <span>{t("freshness")}</span>
            <strong>{freshnessScore}%</strong>
          </div>
          <div className="freshness-track">
            <span
              className={`freshness-fill freshness-fill-${status.toLowerCase()}`}
              style={{ width: `${freshnessScore}%` }}
            />
          </div>
        </div>
        {riskReasons.length > 0 && (
          <p className="muted">{t("freshnessDamagedByConditions")}</p>
        )}
        {status === "RISK" && riskReasons.length > 0 && (
          <div className="risk-panel">
            <strong>{t("productRiskWarning")}</strong>
            <ul>
              {riskReasons.map((reason) => (
                <li key={reason}>{t(`riskReason${reason}`)}</li>
              ))}
            </ul>
          </div>
        )}
        {!hideActions && (
          <div className="button-row">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => handleEditProduct(product)}
            >
              {t("editProduct")}
            </button>
            <button
              className="icon-button icon-button-danger"
              type="button"
              onClick={() => handleDeleteProduct(product.id)}
              aria-label={t("deleteProduct")}
              title={t("deleteProduct")}
            >
              ×
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t("products")}</h1>
        <p>{t("productsSubtitle")}</p>
      </header>

      <section className="card">
        <h2>{editingProductId ? t("editProduct") : t("addProduct")}</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">{t("name")}</label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="expirationDate">{t("expirationDate")}</label>
            <input
              id="expirationDate"
              name="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(event) => setExpirationDate(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="productFridge">{t("fridge")}</label>
            <select
              id="productFridge"
              value={selectedFridgeId}
              onChange={(event) => handleFridgeChange(event.target.value)}
            >
              <option value="">{t("withoutFridge")}</option>
              {fridges.map((fridge) => (
                <option key={fridge.id} value={fridge.id}>
                  {fridge.name || fridge.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="productShelf">{t("shelf")}</label>
            <select
              id="productShelf"
              value={selectedShelfId}
              onChange={(event) => setSelectedShelfId(event.target.value)}
              disabled={!selectedFridgeId}
            >
              <option value="">{t("withoutShelf")}</option>
              {shelves.map((shelf) => (
                <option key={shelf.id} value={shelf.id}>
                  {shelf.name || shelf.id}
                </option>
              ))}
            </select>
          </div>

          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t("saving")
              : editingProductId
                ? t("saveChanges")
                : t("addProduct")}
          </button>
          {editingProductId && (
            <button
              className="button button-secondary"
              type="button"
              onClick={handleCancelEdit}
            >
              {t("cancel")}
            </button>
          )}
        </form>
        {errorMessage && <p className="form-error">{errorMessage}</p>}
      </section>

      <section className="card">
        <h2>{t("allProducts")}</h2>
        <div className="product-toolbar">
          <div>
            <label htmlFor="productSearch">{t("search")}</label>
            <input
              id="productSearch"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("searchProducts")}
            />
          </div>

          <div>
            <label htmlFor="statusFilter">{t("status")}</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="ALL">{t("allStatuses")}</option>
              <option value="FRESH">{t("statusFRESH")}</option>
              <option value="EXPIRING">{t("statusEXPIRING")}</option>
              <option value="EXPIRED">{t("statusEXPIRED")}</option>
              <option value="RISK">{t("statusRISK")}</option>
            </select>
          </div>

          <div>
            <label htmlFor="fridgeFilter">{t("fridge")}</label>
            <select
              id="fridgeFilter"
              value={fridgeFilter}
              onChange={(event) => setFridgeFilter(event.target.value)}
            >
              <option value="ALL">{t("allFridges")}</option>
              {fridges.map((fridge) => (
                <option key={fridge.id} value={fridge.id}>
                  {fridge.name || fridge.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sortBy">{t("sortBy")}</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
            >
              <option value="status">{t("sortByStatus")}</option>
              <option value="expirationDate">{t("sortByExpiration")}</option>
              <option value="freshness">{t("sortByFreshness")}</option>
            </select>
          </div>
        </div>

        {productsError && <p className="form-error">{productsError}</p>}

        {isProductsLoading ? (
          <div className="empty-state">{t("loading")}</div>
        ) : products.length === 0 ? (
          <div className="empty-state">{t("noProducts")}</div>
        ) : visibleProducts.length === 0 ? (
          <div className="empty-state">{t("noMatchingProducts")}</div>
        ) : (
          <div className="product-grid">
            {visibleProducts.map((product) => renderProductCard(product))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>{t("expiringSoon")}</h2>
        {expiringProducts.length === 0 ? (
          <div className="empty-state">{t("noProducts")}</div>
        ) : (
          <div className="product-grid">
            {expiringProducts.map((product) => renderProductCard(product, true))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Products;
