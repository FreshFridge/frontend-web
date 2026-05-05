import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <label className="language-switcher">
      <span>{t("language")}</span>
      <select
        value={i18n.language}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
      >
        <option value="uk">UA</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}

export default LanguageSwitcher;
