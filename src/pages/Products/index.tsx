import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { getFridges, getShelves } from "../../api/fridges";
import {
  createProduct,
  deleteProduct,
  getExpiringProducts,
  getProducts,
  updateProduct,
} from "../../api/products";

type Product = {
  id: string | number;
  name: string;
  fridgeId?: string | null;
  shelfId?: string | null;
  expirationDate?: string;
  status?: "active" | "consumed" | "expired" | "removed" | string;
};

type Fridge = {
  id: string | number;
  name?: string;
};

type Shelf = {
  id: string | number;
  name?: string;
};

type ProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
};

const DEFAULT_CATEGORY_ID = "9AAEC0A6-DB5F-4CDC-8589-185D12F9E159";

const getItems = <T,>(data: T[] | { items?: T[] }) => {
  return Array.isArray(data) ? data : data.items ?? [];
};

const getProductStatus = (product: Product) => {
  if (product.status && product.status !== "active") {
    return product.status;
  }

  if (!product.expirationDate) {
    return "fresh";
  }

  const today = new Date();
  const expirationDate = new Date(product.expirationDate);
  const diffMs = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "expired";
  }

  if (diffDays <= 3) {
    return "expiring";
  }

  return "fresh";
};

const getStatusClass = (status: string) => {
  if (status === "expired") {
    return "badge badge-danger";
  }

  if (status === "expiring") {
    return "badge badge-warning";
  }

  return "badge badge-success";
};

function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [name, setName] = useState("");
  const [selectedFridgeId, setSelectedFridgeId] = useState("");
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | number | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = async () => {
    try {
      const data: ProductsResponse = await getProducts();
      setProducts(data.items);
    } catch (error) {
      console.error(error);
    }
  };

  const loadExpiringProducts = async () => {
    try {
      const data = await getExpiringProducts();
      setExpiringProducts(Array.isArray(data) ? data : data.items ?? []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadFridges = async () => {
    try {
      const data = await getFridges();
      setFridges(getItems<Fridge>(data));
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
    await Promise.all([loadProducts(), loadExpiringProducts()]);
  };

  useEffect(() => {
    refreshProducts();
    loadFridges();
  }, []);

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
    try {
      setErrorMessage("");
      await deleteProduct(productId);
      await refreshProducts();
    } catch (error) {
      console.error(error);
      setErrorMessage(t("productDeleteFailed"));
    }
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
        {products.length === 0 ? (
          <div className="empty-state">{t("noProducts")}</div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article className="item-card" key={product.id}>
                <h3>{product.name}</h3>
                <p className="muted">
                  {t("expirationDate")}: {product.expirationDate ?? "-"}
                </p>
                <p className="muted">
                  {t("storagePlace")}:{" "}
                  {product.shelfId
                    ? `${t("shelf")} ${product.shelfId}`
                    : product.fridgeId
                      ? `${t("fridge")} ${product.fridgeId}`
                      : t("notAssigned")}
                </p>
                <span className={getStatusClass(getProductStatus(product))}>
                  {t(getProductStatus(product))}
                </span>
                <div className="button-row">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => handleEditProduct(product)}
                  >
                    {t("editProduct")}
                  </button>
                  <button
                    className="button button-danger"
                    type="button"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    {t("deleteProduct")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>{t("expiringSoon")}</h2>
        {expiringProducts.length === 0 ? (
          <div className="empty-state">{t("noProducts")}</div>
        ) : (
          <div className="product-grid">
            {expiringProducts.map((product) => (
              <article className="item-card" key={product.id}>
                <h3>{product.name}</h3>
                <p className="muted">
                  {t("expirationDate")}: {product.expirationDate ?? "-"}
                </p>
                <p className="muted">
                  {t("storagePlace")}:{" "}
                  {product.shelfId
                    ? `${t("shelf")} ${product.shelfId}`
                    : product.fridgeId
                      ? `${t("fridge")} ${product.fridgeId}`
                      : t("notAssigned")}
                </p>
                <span className="badge badge-warning">{t("expiring")}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Products;
