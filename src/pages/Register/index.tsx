import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { register } from "../../api/auth";
import AppIcon from "../../components/AppIcon";
import AuthSupport from "../../components/AuthSupport";
import { useAuth } from "../../store/AuthContext";
import {
  getCountryOptions,
  getCountrySettings,
  getInitialCountry,
} from "../../utils/countries";

function Register() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState(getInitialCountry);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    form: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const countryOptions = getCountryOptions(t("intlLocale"));
  const countrySettings = getCountrySettings(country);

  const isFormValid =
    Boolean(fullName.trim()) &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    password.length >= 6 &&
    confirmPassword === password &&
    Boolean(country);

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = {
      fullName: fullName.trim() ? "" : t("fullNameRequired"),
      email: email.trim() ? "" : t("emailRequired"),
      password: password ? "" : t("passwordRequired"),
      confirmPassword: confirmPassword ? "" : t("confirmPasswordRequired"),
      country: country ? "" : t("countryRequired"),
      form: "",
    };

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = t("emailInvalid");
    }

    if (password && password.length < 6) {
      nextErrors.password = t("passwordMinLength");
    }

    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = t("passwordsDoNotMatch");
    }

    setErrors(nextErrors);

    if (
      nextErrors.fullName ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword ||
      nextErrors.country
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await register({
        email,
        password,
        fullName,
        locale: countrySettings.locale,
        timezone: countrySettings.timezone,
      });
      const token = data.accessToken;

      if (!token) {
        setErrors((current) => ({
          ...current,
          form: t("invalidLoginResponse"),
        }));
        return;
      }

      auth.login(token);
      navigate("/", { replace: true });
    } catch (error) {
      console.log(error);
      setErrors((current) => ({ ...current, form: t("registerFailed") }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="card login-card">
        <div className="login-brand">
          <AppIcon className="app-icon-large" />
          <h1>{t("register")}</h1>
          <p className="muted">{t("registerSubtitle")}</p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="registerFullName">{t("fullName")}</label>
            <input
              id="registerFullName"
              name="fullName"
              type="text"
              placeholder={t("fullNamePlaceholder")}
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setErrors((current) => ({
                  ...current,
                  fullName: "",
                  form: "",
                }));
              }}
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName && (
              <p className="field-error">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="registerEmail">{t("email")}</label>
            <input
              id="registerEmail"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: "", form: "" }));
              }}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="registerPassword">{t("password")}</label>
            <div className="password-field">
              <input
                id="registerPassword"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    password: "",
                    confirmPassword: "",
                    form: "",
                  }));
                }}
                aria-invalid={Boolean(errors.password)}
              />
              <button
                className="password-icon-button"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.3 10.3a3 3 0 000 3.4C3.5 15.5 7 20 12 20s8.5-4.5 9.7-6.3a3 3 0 000-3.4C20.5 8.5 17 4 12 4s-8.5 4.5-9.7 6.3z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-.6" />
                    <path d="M9.9 4.2A9.7 9.7 0 0112 4c5 0 8.5 4.5 9.7 6.3a3 3 0 010 3.4 20 20 0 01-2.1 2.7" />
                    <path d="M6.7 6.7a19.2 19.2 0 00-4.4 3.6 3 3 0 000 3.4C3.5 15.5 7 20 12 20a9.8 9.8 0 004.2-.9" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword">{t("confirmPassword")}</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setErrors((current) => ({
                  ...current,
                  confirmPassword: "",
                  form: "",
                }));
              }}
              aria-invalid={Boolean(errors.confirmPassword)}
            />
            {errors.confirmPassword && (
              <p className="field-error">{errors.confirmPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="country">{t("country")}</label>
            <select
              id="country"
              name="country"
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                setErrors((current) => ({
                  ...current,
                  country: "",
                  form: "",
                }));
              }}
              aria-invalid={Boolean(errors.country)}
            >
              {countryOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
            {errors.country && <p className="field-error">{errors.country}</p>}
          </div>

          <button
            className="button"
            type="submit"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? t("registering") : t("register")}
          </button>
        </form>
        {errors.form && <p className="form-error">{errors.form}</p>}

        <p className="auth-link">
          {t("alreadyHaveAccount")} <Link to="/login">{t("login")}</Link>
        </p>
      </section>
      <AuthSupport />
    </main>
  );
}

export default Register;
