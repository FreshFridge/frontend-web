import { useState } from "react";
import { useTranslation } from "react-i18next";

function AuthSupport() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="auth-support">
      <button type="button" onClick={() => setIsOpen((value) => !value)}>
        {t("support")}
      </button>
      {isOpen && (
        <p>
          {t("supportDetails")}{" "}
          <a href="mailto:admin@test.com">admin@test.com</a>
        </p>
      )}
    </div>
  );
}

export default AuthSupport;
