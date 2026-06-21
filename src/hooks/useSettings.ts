import { useCallback, useEffect, useState } from "react";
import { getInflationRate, setInflationRate } from "../lib/storage";
import { DEFAULT_INFLATION_RATE } from "../config";
import { useAuth } from "./AuthContext";

export function useSettings() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [inflationRate, setRate] = useState<number>(DEFAULT_INFLATION_RATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setLoading(true);
    getInflationRate(userId)
      .then((r) => {
        if (active) setRate(r);
      })
      .catch(() => {
        if (active) setRate(DEFAULT_INFLATION_RATE);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, authLoading]);

  const updateRate = useCallback(
    async (rate: number) => {
      await setInflationRate(userId, rate);
      setRate(rate);
    },
    [userId]
  );

  return { inflationRate, updateRate, loading };
}
