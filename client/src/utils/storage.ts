const KEYS = {
  USER_NAME: 'medstudy_user_name',
  THEME: 'medstudy_theme',
  LAST_WORKSPACE: 'medstudy_last_workspace_id'
};

export const storage = {
  getUserName: (): string | null => {
    return localStorage.getItem(KEYS.USER_NAME);
  },
  setUserName: (name: string): void => {
    localStorage.setItem(KEYS.USER_NAME, name.trim());
  },
  clearUserName: (): void => {
    localStorage.removeItem(KEYS.USER_NAME);
  },

  getTheme: (): 'light' | 'dark' | 'system' => {
    return (localStorage.getItem(KEYS.THEME) as 'light' | 'dark' | 'system') || 'dark';
  },
  setTheme: (theme: 'light' | 'dark' | 'system'): void => {
    localStorage.setItem(KEYS.THEME, theme);
  },

  getLastWorkspace: (): string | null => {
    return localStorage.getItem(KEYS.LAST_WORKSPACE);
  },
  setLastWorkspace: (id: string): void => {
    localStorage.setItem(KEYS.LAST_WORKSPACE, id);
  },
  clearLastWorkspace: (): void => {
    localStorage.removeItem(KEYS.LAST_WORKSPACE);
  }
};
