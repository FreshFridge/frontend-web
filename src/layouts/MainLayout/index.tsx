import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUserEmail, isAdmin } from "../../api/token";
import AppIcon from "../../components/AppIcon";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useAuth } from "../../store/AuthContext";

const navItems = [
  { icon: "⌂", key: "dashboard", to: "/" },
  { icon: "□", key: "products", to: "/products" },
  { icon: "▤", key: "fridges", to: "/fridges" },
  { icon: "○", key: "profile", to: "/profile" },
];

function MainLayout() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const userEmail = getUserEmail();

  const handleLogout = () => {
    if (!window.confirm(t("confirmLogout"))) {
      return;
    }

    auth.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <AppIcon />
          <span>FreshFridge</span>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink className="nav-link" key={item.to} to={item.to}>
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{t(item.key)}</span>
            </NavLink>
          ))}
          {isAdmin() && (
            <NavLink className="nav-link" to="/admin/users">
              <span className="nav-icon" aria-hidden="true">
                ◇
              </span>
              <span>{t("admin")}</span>
            </NavLink>
          )}
        </nav>
      </aside>

      <main className="content-shell">
        <header className="topbar">
          <div className="user-chip">
            <span className="user-avatar" aria-hidden="true">
              {(userEmail ?? "F").charAt(0).toUpperCase()}
            </span>
            <span>{userEmail ?? "FreshFridge"}</span>
          </div>
          <div className="topbar-actions">
            <LanguageSwitcher />
            <button
              className="button button-secondary topbar-logout"
              type="button"
              onClick={handleLogout}
            >
              {t("logout")}
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
