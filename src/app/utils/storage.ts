// LocalStorage keys
const KEYS = {
  AUTH_TOKEN: 'kcp_token',
  CURRENT_USER: 'kcp_user'
};

export const storage = {
  // Auth
  setToken: (token: string) => localStorage.setItem(KEYS.AUTH_TOKEN, token),
  getToken: () => localStorage.getItem(KEYS.AUTH_TOKEN),
  removeToken: () => localStorage.removeItem(KEYS.AUTH_TOKEN),

  setUser: (user: any) => localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem(KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => localStorage.removeItem(KEYS.CURRENT_USER)
};
