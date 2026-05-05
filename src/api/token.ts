const TOKEN_KEY = "token";

type TokenPayload = {
  role?: string;
  user?: {
    role?: string;
  };
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = () => Boolean(getToken());

export const getTokenPayload = (): TokenPayload | null => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(json);
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getUserRole = () => {
  const payload = getTokenPayload();
  return payload?.role ?? payload?.user?.role ?? null;
};

export const isAdmin = () => getUserRole() === "admin";
