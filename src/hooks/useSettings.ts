import { useCallback, useEffect, useState } from "react";
import {
  getAppSettings,
  setAppSettings,
  DEFAULT_SETTINGS,
  type AppSettings,
} from "../lib/storage";

// Global app settings (inflation rate, rental share). Managed by superadmins;
// read everywhere the calculator runs.
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAppSettings()
      .then((s) => active && setSettings(s))
      .catch(() => active && setSettings(DEFAULT_SETTINGS))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback(async (next: AppSettings) => {
    await setAppSettings(next);
    setSettings(next);
  }, []);

  return { settings, update, loading };
}
