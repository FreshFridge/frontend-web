import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  createFridge,
  createShelf,
  deleteFridge,
  deleteShelf,
  getFridges,
  getShelves,
  updateShelf,
} from "../../api/fridges";

type Fridge = {
  id: string | number;
  name?: string;
};

type Shelf = {
  id: string | number;
  name?: string;
};

const getItems = <T,>(data: T[] | { items?: T[] }) => {
  return Array.isArray(data) ? data : data.items ?? [];
};

function Fridges() {
  const { t } = useTranslation();
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedFridgeId, setSelectedFridgeId] = useState<string | number>("");
  const [fridgeName, setFridgeName] = useState("");
  const [shelfName, setShelfName] = useState("");
  const [fridgeError, setFridgeError] = useState("");
  const [shelfError, setShelfError] = useState("");
  const [editingShelfId, setEditingShelfId] = useState<string | number | null>(
    null,
  );
  const [editingShelfName, setEditingShelfName] = useState("");
  const [isAddingFridge, setIsAddingFridge] = useState(false);
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [isSavingShelf, setIsSavingShelf] = useState(false);

  const selectedFridge = fridges.find(
    (fridge) => String(fridge.id) === String(selectedFridgeId),
  );

  const loadFridges = async () => {
    try {
      const data = await getFridges();
      setFridges(getItems<Fridge>(data));
    } catch (error) {
      console.log(error);
    }
  };

  const loadShelves = async (fridgeId: string | number) => {
    if (!fridgeId) {
      setShelves([]);
      return;
    }

    try {
      const data = await getShelves(fridgeId);
      setShelves(getItems<Shelf>(data));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadFridges();
  }, []);

  const handleSelectFridge = async (fridgeId: string) => {
    setShelfError("");
    setEditingShelfId(null);
    setEditingShelfName("");
    setSelectedFridgeId(fridgeId);
    await loadShelves(fridgeId);
  };

  const handleAddFridge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAddingFridge(true);

    try {
      setFridgeError("");
      await createFridge({ name: fridgeName });
      setFridgeName("");
      await loadFridges();
    } catch (error) {
      console.log(error);
      setFridgeError(t("fridgeCreateFailed"));
    } finally {
      setIsAddingFridge(false);
    }
  };

  const handleDeleteFridge = async (fridgeId: string | number) => {
    if (!window.confirm(t("confirmDeleteFridge"))) {
      return;
    }

    try {
      setFridgeError("");
      setShelfError("");
      await deleteFridge(fridgeId);

      if (String(selectedFridgeId) === String(fridgeId)) {
        setSelectedFridgeId("");
        setShelves([]);
      }

      await loadFridges();
    } catch (error) {
      console.log(error);
      setFridgeError(t("fridgeDeleteFailed"));
    }
  };

  const handleAddShelf = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFridgeId) {
      return;
    }

    setIsAddingShelf(true);

    try {
      setShelfError("");
      await createShelf(selectedFridgeId, { name: shelfName });
      setShelfName("");
      await loadShelves(selectedFridgeId);
    } catch (error) {
      console.log(error);
      setShelfError(t("shelfCreateFailed"));
    } finally {
      setIsAddingShelf(false);
    }
  };

  const handleStartEditShelf = (shelf: Shelf) => {
    setShelfError("");
    setEditingShelfId(shelf.id);
    setEditingShelfName(shelf.name || "");
  };

  const handleCancelEditShelf = () => {
    setEditingShelfId(null);
    setEditingShelfName("");
    setShelfError("");
  };

  const handleUpdateShelf = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingShelfId || !selectedFridgeId) {
      return;
    }

    try {
      setIsSavingShelf(true);
      setShelfError("");
      await updateShelf(editingShelfId, { name: editingShelfName });
      setEditingShelfId(null);
      setEditingShelfName("");
      await loadShelves(selectedFridgeId);
    } catch (error) {
      console.log(error);
      setShelfError(t("shelfUpdateFailed"));
    } finally {
      setIsSavingShelf(false);
    }
  };

  const handleDeleteShelf = async (shelfId: string | number) => {
    if (!window.confirm(t("confirmDeleteShelf"))) {
      return;
    }

    try {
      setShelfError("");
      await deleteShelf(shelfId);
      if (String(editingShelfId) === String(shelfId)) {
        handleCancelEditShelf();
      }
      await loadShelves(selectedFridgeId);
    } catch (error) {
      console.log(error);
      setShelfError(t("shelfDeleteFailed"));
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t("fridges")}</h1>
        <p>{t("fridgesSubtitle")}</p>
      </header>

      <section className="card">
        <h2>{t("addFridge")}</h2>
        <form className="form-grid" onSubmit={handleAddFridge}>
          <div>
            <label htmlFor="fridgeName">{t("fridgeName")}</label>
            <input
              id="fridgeName"
              name="fridgeName"
              type="text"
              value={fridgeName}
              onChange={(event) => setFridgeName(event.target.value)}
              required
            />
          </div>

          <button className="button" type="submit" disabled={isAddingFridge}>
            {isAddingFridge ? t("adding") : t("addFridge")}
          </button>
        </form>
        {fridgeError && <p className="form-error">{fridgeError}</p>}
      </section>

      <div className="grid two-column">
        <section className="card">
          <h2>{t("allFridges")}</h2>
          {fridges.length === 0 ? (
            <div className="empty-state">{t("noFridges")}</div>
          ) : (
            <div className="fridge-grid">
              {fridges.map((fridge) => (
                <article
                  className={
                    String(selectedFridgeId) === String(fridge.id)
                      ? "item-card item-card-selected"
                      : "item-card"
                  }
                  key={fridge.id}
                >
                  <div className="item-card-header">
                    <h3>{fridge.name || fridge.id}</h3>
                    <button
                      className="icon-button icon-button-danger"
                      type="button"
                      onClick={() => handleDeleteFridge(fridge.id)}
                      aria-label={t("deleteFridge")}
                      title={t("deleteFridge")}
                    >
                      ×
                    </button>
                  </div>
                  <p className="muted">
                    {t("id")}: {fridge.id}
                  </p>
                  {String(selectedFridgeId) === String(fridge.id) && (
                    <span className="badge badge-primary">{t("selected")}</span>
                  )}
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => handleSelectFridge(String(fridge.id))}
                  >
                    {String(selectedFridgeId) === String(fridge.id)
                      ? t("selected")
                      : t("selectFridgeButton")}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>{t("shelves")}</h2>

          {!selectedFridgeId ? (
            <div className="empty-state">{t("selectFridge")}</div>
          ) : (
            <div className="grid">
              <p className="muted">
                {t("selectedFridge")}: {selectedFridge?.name || selectedFridgeId}
              </p>
              <form className="form-stack" onSubmit={handleAddShelf}>
                <div>
                  <label htmlFor="shelfName">{t("shelfName")}</label>
                  <input
                    id="shelfName"
                    name="shelfName"
                    type="text"
                    value={shelfName}
                    onChange={(event) => setShelfName(event.target.value)}
                    required
                  />
                </div>

                <button className="button" type="submit" disabled={isAddingShelf}>
                  {isAddingShelf ? t("adding") : t("addShelf")}
                </button>
              </form>
              {shelfError && <p className="form-error">{shelfError}</p>}

              {shelves.length === 0 ? (
                <div className="empty-state">{t("noShelves")}</div>
              ) : (
                <div className="grid">
                  {shelves.map((shelf) => (
                    <article className="item-card" key={shelf.id}>
                      <div className="item-card-header">
                        <h3>{shelf.name || shelf.id}</h3>
                        <div className="icon-actions">
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => handleStartEditShelf(shelf)}
                            aria-label={t("editShelf")}
                            title={t("editShelf")}
                          >
                            ✎
                          </button>
                          <button
                            className="icon-button icon-button-danger"
                            type="button"
                            onClick={() => handleDeleteShelf(shelf.id)}
                            aria-label={t("deleteShelf")}
                            title={t("deleteShelf")}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <p className="muted">
                        {t("id")}: {shelf.id}
                      </p>
                      {String(editingShelfId) === String(shelf.id) && (
                        <form
                          className="inline-edit-form"
                          onSubmit={handleUpdateShelf}
                        >
                          <input
                            type="text"
                            value={editingShelfName}
                            onChange={(event) =>
                              setEditingShelfName(event.target.value)
                            }
                            required
                          />
                          <div className="button-row">
                            <button
                              className="button"
                              type="submit"
                              disabled={isSavingShelf}
                            >
                              {isSavingShelf ? t("saving") : t("saveChanges")}
                            </button>
                            <button
                              className="button button-secondary"
                              type="button"
                              onClick={handleCancelEditShelf}
                              disabled={isSavingShelf}
                            >
                              {t("cancel")}
                            </button>
                          </div>
                        </form>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Fridges;
