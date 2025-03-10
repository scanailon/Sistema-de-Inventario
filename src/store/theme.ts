import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => {
        set((state) => {
          const newIsDark = !state.isDark;
          // Actualizar la clase en el elemento HTML
          if (newIsDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { isDark: newIsDark };
        });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => {
        // Asegurarse de que la clase dark se aplique al recargar
        const theme = localStorage.getItem('theme-storage');
        if (theme) {
          const { state } = JSON.parse(theme);
          if (state.isDark) {
            document.documentElement.classList.add('dark');
          }
        }
      },
    }
  )
);