import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Date.now().toString()
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }))
    
    // Auto-remove after duration (default 3000ms)
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
    }, notification.duration || 3000)
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))
