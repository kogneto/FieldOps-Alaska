import { useCallback, useEffect, useState } from "react";

function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    const onSync = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.key === key) setValue(d.value);
    };
    window.addEventListener("fo-store", onSync);
    return () => window.removeEventListener("fo-store", onSync);
  }, [key]);
  const set = useCallback(
    (next: T) => {
      setValue(next);
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("fo-store", { detail: { key, value: next } }));
    },
    [key],
  );
  return [value, set] as const;
}

export function useSaved() {
  const [saved, setSaved] = useLocal<string[]>("fo-saved", []);
  const toggle = (id: string) =>
    setSaved(saved.includes(id) ? saved.filter((s) => s !== id) : [...saved, id]);
  return { saved, isSaved: (id: string) => saved.includes(id), toggle };
}

export function useChecks() {
  const [checks, setChecks] = useLocal<Record<string, boolean>>("fo-checks", {});
  return {
    checks,
    toggle: (k: string) => setChecks({ ...checks, [k]: !checks[k] }),
    reset: (prefix: string) =>
      setChecks(Object.fromEntries(Object.entries(checks).filter(([k]) => !k.startsWith(prefix)))),
  };
}
