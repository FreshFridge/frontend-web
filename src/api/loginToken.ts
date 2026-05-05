type LoginResponse = {
  accessToken?: string;
  token?: string;
  access_token?: string;
};

export const getLoginToken = (data: LoginResponse) => {
  return data.accessToken ?? data.token ?? data.access_token ?? null;
};
