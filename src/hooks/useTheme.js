import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useTheme = create(
  persist(
    (set) => ({
      theme: 'light',
      toggle: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (newTheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        return { theme: newTheme };
      }),
      initTheme: () => set((state) => {
        if (state.theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        return { theme: state.theme };
      })
    }),
    {
      name: 'theme-storage', // se guarda en localStorage
    }
  )
)
