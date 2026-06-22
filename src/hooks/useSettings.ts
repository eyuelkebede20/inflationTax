import { useCallback, useEffect, useState } from "react";
import {
  getSettings,
  setSettings as persistSettings,
  DEFAULT_SETTINGS,
  type AppSettings,
} from "../lib/storage";
import { useAuth } from "./AuthContext";

export function useSettings() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setLoading(true);
    getSettings(userId)
      .then((s) => {
        if (active) setSettings(s);
      })
      .catch(() => {
        if (active) setSettings(DEFAULT_SETTINGS);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, authLoading]);

  const update = useCallback(
    async (next: AppSettings) => {
      await persistSettings(userId, next);
      setSettings(next);
    },
    [userId]
  );

  return { settings, update, loading };
}
