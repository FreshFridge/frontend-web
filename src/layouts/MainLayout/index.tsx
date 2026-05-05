import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { isAdmin } from "../../api/token";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useAuth } from "../../store/AuthContext";

function MainLayout() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">FF</span>
          <span>FreshFridge</span>
        </div>

        <nav className="nav-list">
          <NavLink className="nav-link" to="/">
            {t("dashboard")}
          </NavLink>
          <NavLink className="nav-link" to="/products">
            {t("products")}
          </NavLink>
          <NavLink className="nav-link" to="/fridges">
            {t("fridges")}
          </NavLink>
          {isAdmin() && (
            <NavLink className="nav-link" to="/admin/users">
              {t("admin")}
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="button button-secondary" type="button" onClick={handleLogout}>
            {t("logout")}
          </button>
        </div>
      </aside>

      <main className="content-shell">
        <header className="topbar">
          <div className="topbar-actions">
            <LanguageSwitcher />
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
