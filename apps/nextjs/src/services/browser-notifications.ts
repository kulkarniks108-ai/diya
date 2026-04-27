export type NotificationSupport = "supported" | "unsupported"

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported"
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!isNotificationSupported()) return "unsupported"
  return Notification.requestPermission()
}

export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions,
): boolean {
  if (!isNotificationSupported()) return false
  if (Notification.permission !== "granted") return false

  try {
    const notification = new Notification(title, options)
    void notification
    return true
  } catch {
    return false
  }
}
