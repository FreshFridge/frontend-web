import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import { useAuth } from "../../store/AuthContext";

function Login() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", form: "" });
  const [isLoading, setIsLoading] = useState(false);

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = {
      email: email.trim() ? "" : t("emailRequired"),
      password: password ? "" : t("passwordRequired"),
      form: "",
    };

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = t("emailInvalid");
    }

    if (password && password.length < 6) {
      nextErrors.password = t("passwordMinLength");
    }

    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await login(email, password);
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
      setErrors((current) => ({ ...current, form: t("loginFailed") }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="card login-card">
        <div className="login-brand">
          <span className="brand-mark">FF</span>
          <h1>FreshFridge</h1>
          <p className="muted">{t("loginSubtitle")}</p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">{t("email")}</label>
            <input
              id="email"
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
            <label htmlFor="password">{t("password")}</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    password: "",
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

          <button className="button" type="submit" disabled={isLoading}>
            {isLoading ? t("loggingIn") : t("login")}
          </button>
        </form>
        {errors.form && <p className="form-error">{errors.form}</p>}

        <p className="auth-link">
          {t("dontHaveAccount")} <Link to="/register">{t("register")}</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
