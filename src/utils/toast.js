import { useNotificationStore } from '../store/useNotificationStore'

export const toast = {
  success: (title, message = '', duration = 3000) => {
    useNotificationStore.getState().addNotification({ type: 'success', title, message, duration })
  },
  error: (title, message = '', duration = 4000) => {
    useNotificationStore.getState().addNotification({ type: 'error', title, message, duration })
  },
  info: (title, message = '', duration = 3000) => {
    useNotificationStore.getState().addNotification({ type: 'info', title, message, duration })
  },
  warning: (title, message = '', duration = 3000) => {
    useNotificationStore.getState().addNotification({ type: 'warning', title, message, duration })
  },
}
