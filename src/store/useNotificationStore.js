import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7)
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }))
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))
