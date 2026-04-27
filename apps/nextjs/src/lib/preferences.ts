export type PreferenceKey = "sosAlerts" | "locationUpdates"

export function getBooleanPreference(
  key: PreferenceKey,
  defaultValue: boolean,
): boolean {
  if (typeof window === "undefined") return defaultValue

  try {
    const saved = localStorage.getItem(key)
    return saved === null ? defaultValue : saved === "true"
  } catch {
    return defaultValue
  }
}

export function setBooleanPreference(key: PreferenceKey, value: boolean): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, String(value))
  } catch {
    // ignore
  }
}
