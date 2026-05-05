import { Outlet } from "react-router-dom";
import LanguageSwitcher from "../../components/LanguageSwitcher";

function PublicLayout() {
  return (
    <div className="public-shell">
      <header className="public-topbar">
        <LanguageSwitcher />
      </header>
      <Outlet />
    </div>
  );
}

export default PublicLayout;
