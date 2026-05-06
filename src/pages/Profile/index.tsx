import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  changePassword,
  getProfile,
  updateProfile,
  type ProfilePayload,
} from "../../api/auth";
import { isAdmin } from "../../api/token";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";
import SectionHeader from "../../components/ui/SectionHeader";
import {
  countryCodes,
  getCountryOptions,
  getCountrySettings,
  getInitialCountry,
} from "../../utils/countries";

type ProfileData = {
  id: string;
  email: string;
  fullName?: string;
  full_name?: string;
  locale: string;
  timezone: string;
  role: string;
};

const getProfileName = (profile: ProfileData | null) => {
  return profile?.fullName ?? profile?.full_name ?? "";
};

const getCountryFromProfile = (profile: ProfileData | null) => {
  if (!profile) {
    return getInitialCountry();
  }

  const matchedCountry = countryCodes.find((countryCode) => {
    const settings = getCountrySettings(countryCode);
    return (
      settings.locale === profile.locale &&
      settings.timezone === profile.timezone
    );
  });

  return matchedCountry ?? getInitialCountry();
};

function Profile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState(getInitialCountry);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ fullName: "" });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    form: "",
  });
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const countryOptions = useMemo(
    () => getCountryOptions(t("intlLocale")),
    [t],
  );

  const fillForm = (nextProfile: ProfileData) => {
    setFullName(getProfileName(nextProfile));
    setCountry(getCountryFromProfile(nextProfile));
  };

  const loadProfile = async () => {
    try {
      setProfileError("");
      const data = await getProfile();
      setProfile(data);
      fillForm(data);
    } catch (error) {
      console.log(error);
      setProfileError(t("profileLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const resetProfileForm = () => {
    if (profile) {
      fillForm(profile);
    }
    setIsEditing(false);
    setProfileError("");
    setProfileSuccess("");
    setFieldErrors({ fullName: "" });
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSuccess("");

    if (!fullName.trim()) {
      setFieldErrors({ fullName: t("fullNameRequired") });
      return;
    }

    if (!profile) {
      return;
    }

    const payload: ProfilePayload = {};
    const countrySettings = getCountrySettings(country);

    if (fullName.trim() !== getProfileName(profile)) {
      payload.fullName = fullName.trim();
    }

    if (
      countrySettings.locale !== profile.locale ||
      countrySettings.timezone !== profile.timezone
    ) {
      payload.locale = countrySettings.locale;
      payload.timezone = countrySettings.timezone;
    }

    if (Object.keys(payload).length === 0) {
      setProfileSuccess(t("profileNoChanges"));
      setIsEditing(false);
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileError("");
      setFieldErrors({ fullName: "" });
      const data = await updateProfile(payload);
      setProfile(data);
      fillForm(data);
      setIsEditing(false);
      setProfileSuccess(t("profileUpdated"));
    } catch (error) {
      console.log(error);
      setProfileError(t("profileUpdateFailed"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      oldPassword: oldPassword ? "" : t("oldPasswordRequired"),
      newPassword: newPassword ? "" : t("passwordRequired"),
      confirmPassword: confirmPassword ? "" : t("confirmPasswordRequired"),
      form: "",
    };

    if (newPassword && newPassword.length < 6) {
      nextErrors.newPassword = t("passwordMinLength");
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      nextErrors.confirmPassword = t("passwordsDoNotMatch");
    }

    setPasswordErrors(nextErrors);
    setPasswordSuccess("");

    if (
      nextErrors.oldPassword ||
      nextErrors.newPassword ||
      nextErrors.confirmPassword
    ) {
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword({ oldPassword, newPassword });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(t("passwordUpdated"));
    } catch (error) {
      console.log(error);
      setPasswordErrors((current) => ({
        ...current,
        form: t("passwordUpdateFailed"),
      }));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderPasswordToggle = (
    field: keyof typeof visiblePasswords,
    isVisible: boolean,
  ) => (
    <button
      aria-label={isVisible ? t("hidePassword") : t("showPassword")}
      className="password-icon-button"
      onClick={() =>
        setVisiblePasswords((current) => ({
          ...current,
          [field]: !current[field],
        }))
      }
      type="button"
    >
      {isVisible ? (
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
  );

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t("profile")}</h1>
        <p>{t("profileSubtitle")}</p>
      </header>

      {isLoading ? (
        <Card>
          <div className="empty-state">{t("loading")}</div>
        </Card>
      ) : profile ? (
        <div className="profile-layout">
          <Card>
            <SectionHeader
              actions={
                !isEditing ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(true);
                      setProfileSuccess("");
                    }}
                  >
                    {t("editProfile")}
                  </Button>
                ) : null
              }
              subtitle={t("profileInfoSubtitle")}
              title={t("profileInfo")}
            />

            <form className="form-stack" onSubmit={handleProfileSubmit}>
              <div className="profile-summary profile-summary-clean">
                <div>
                  <span className="muted">{t("email")}</span>
                  <strong>{profile.email}</strong>
                </div>
                {isAdmin() && (
                  <div>
                    <span className="muted">{t("role")}</span>
                    <Badge tone="primary">{profile.role}</Badge>
                  </div>
                )}
              </div>

              <FormField
                error={fieldErrors.fullName}
                htmlFor="profileFullName"
                label={t("fullName")}
              >
                <input
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  disabled={!isEditing || isSavingProfile}
                  id="profileFullName"
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setFieldErrors({ fullName: "" });
                    setProfileError("");
                    setProfileSuccess("");
                  }}
                  type="text"
                  value={fullName}
                />
              </FormField>

              <FormField htmlFor="profileCountry" label={t("country")}>
                <select
                  disabled={!isEditing || isSavingProfile}
                  id="profileCountry"
                  onChange={(event) => {
                    setCountry(event.target.value);
                    setProfileSuccess("");
                  }}
                  value={country}
                >
                  {countryOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </FormField>

              {profileError && <p className="form-error">{profileError}</p>}
              {profileSuccess && (
                <p className="form-success">{profileSuccess}</p>
              )}

              {isEditing && (
                <div className="button-row">
                  <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? t("saving") : t("saveChanges")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetProfileForm}
                    disabled={isSavingProfile}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              )}
            </form>
          </Card>

          <Card>
            <SectionHeader
              subtitle={t("changePasswordSubtitle")}
              title={t("changePassword")}
            />

            <form className="form-stack" onSubmit={handlePasswordSubmit}>
              <FormField
                error={passwordErrors.oldPassword}
                htmlFor="oldPassword"
                label={t("oldPassword")}
              >
                <div className="password-field">
                  <input
                    aria-invalid={Boolean(passwordErrors.oldPassword)}
                    id="oldPassword"
                    onChange={(event) => {
                      setOldPassword(event.target.value);
                      setPasswordErrors((current) => ({
                        ...current,
                        oldPassword: "",
                        form: "",
                      }));
                      setPasswordSuccess("");
                    }}
                    type={visiblePasswords.oldPassword ? "text" : "password"}
                    value={oldPassword}
                  />
                  {renderPasswordToggle(
                    "oldPassword",
                    visiblePasswords.oldPassword,
                  )}
                </div>
              </FormField>

              <FormField
                error={passwordErrors.newPassword}
                htmlFor="newPassword"
                label={t("newPassword")}
              >
                <div className="password-field">
                  <input
                    aria-invalid={Boolean(passwordErrors.newPassword)}
                    id="newPassword"
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setPasswordErrors((current) => ({
                        ...current,
                        newPassword: "",
                        confirmPassword: "",
                        form: "",
                      }));
                      setPasswordSuccess("");
                    }}
                    type={visiblePasswords.newPassword ? "text" : "password"}
                    value={newPassword}
                  />
                  {renderPasswordToggle(
                    "newPassword",
                    visiblePasswords.newPassword,
                  )}
                </div>
              </FormField>

              <FormField
                error={passwordErrors.confirmPassword}
                htmlFor="profileConfirmPassword"
                label={t("confirmPassword")}
              >
                <div className="password-field">
                  <input
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                    id="profileConfirmPassword"
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setPasswordErrors((current) => ({
                        ...current,
                        confirmPassword: "",
                        form: "",
                      }));
                      setPasswordSuccess("");
                    }}
                    type={
                      visiblePasswords.confirmPassword ? "text" : "password"
                    }
                    value={confirmPassword}
                  />
                  {renderPasswordToggle(
                    "confirmPassword",
                    visiblePasswords.confirmPassword,
                  )}
                </div>
              </FormField>

              {passwordErrors.form && (
                <p className="form-error">{passwordErrors.form}</p>
              )}
              {passwordSuccess && (
                <p className="form-success">{passwordSuccess}</p>
              )}

              <div className="button-row">
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? t("saving") : t("changePassword")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="empty-state">{t("profileLoadFailed")}</div>
        </Card>
      )}
    </main>
  );
}

export default Profile;
