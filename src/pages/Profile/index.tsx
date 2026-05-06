import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  getProfile,
  updateProfile,
  type ProfilePayload,
} from "../../api/auth";
import {
  countryCodes,
  getCountryOptions,
  getCountrySettings,
  getInitialCountry,
} from "../../utils/countries";
import Badge from "../../components/ui/Badge";

type ProfileData = {
  id: string;
  email: string;
  fullName?: string;
  full_name?: string;
  locale: string;
  timezone: string;
  role: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const countryOptions = useMemo(
    () => getCountryOptions(t("intlLocale")),
    [t],
  );

  const fillForm = (nextProfile: ProfileData) => {
    setFullName(nextProfile.fullName ?? nextProfile.full_name ?? "");
    setCountry(getCountryFromProfile(nextProfile));
  };

  const loadProfile = async () => {
    try {
      setErrorMessage("");
      const data = await getProfile();
      setProfile(data);
      fillForm(data);
    } catch (error) {
      console.log(error);
      setErrorMessage(t("profileLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleCancel = () => {
    if (profile) {
      fillForm(profile);
    }
    setIsEditing(false);
    setErrorMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim()) {
      setErrorMessage(t("fullNameRequired"));
      return;
    }

    const countrySettings = getCountrySettings(country);
    const payload: ProfilePayload = {
      fullName: fullName.trim(),
      locale: countrySettings.locale,
      timezone: countrySettings.timezone,
    };

    try {
      setIsSaving(true);
      setErrorMessage("");
      const data = await updateProfile(payload);
      setProfile(data);
      fillForm(data);
      setIsEditing(false);
    } catch (error) {
      console.log(error);
      setErrorMessage(t("profileUpdateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t("profile")}</h1>
        <p>{t("profileSubtitle")}</p>
      </header>

      <section className="card profile-card">
        {isLoading ? (
          <div className="empty-state">{t("loading")}</div>
        ) : profile ? (
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="profile-summary">
              <div>
                <span className="muted">{t("email")}</span>
                <strong>{profile.email}</strong>
              </div>
              <div>
                <span className="muted">{t("role")}</span>
                <Badge tone="primary">{profile.role}</Badge>
              </div>
            </div>

            <div>
              <label htmlFor="profileFullName">{t("fullName")}</label>
              <input
                id="profileFullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={!isEditing || isSaving}
                required
              />
            </div>

            <div>
              <label htmlFor="profileCountry">{t("country")}</label>
              <select
                id="profileCountry"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                disabled={!isEditing || isSaving}
              >
                {countryOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {errorMessage && <p className="form-error">{errorMessage}</p>}

            <div className="button-row">
              {isEditing ? (
                <>
                  <button className="button" type="submit" disabled={isSaving}>
                    {isSaving ? t("saving") : t("saveChanges")}
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    {t("cancel")}
                  </button>
                </>
              ) : (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setIsEditing(true)}
                >
                  {t("editProfile")}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="empty-state">{t("profileLoadFailed")}</div>
        )}
      </section>
    </main>
  );
}

export default Profile;
