import { useSyncExternalStore } from "react";

/** The date the records in this version were built (YYYY-MM-DD, build machine's local date). */
export const RECORDS_AS_OF: string = __BUILD_DATE__;

const BUILD_TIME = new Date(`${RECORDS_AS_OF}T12:00:00`).getTime();

/**
 * Registers the service worker that caches the app for use with no signal.
 * It never calls skipWaiting, so a new version installs in the background and
 * takes over the next time the app is launched.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
    console.error("Service worker registration failed", error);
  });
}

function subscribeToConnection(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Whether the phone currently reports a connection. Pages built ahead of time assume online. */
export function useOnline() {
  return useSyncExternalStore(
    subscribeToConnection,
    () => navigator.onLine,
    () => true,
  );
}

const subscribeToNothing = () => () => {};

/**
 * False while React is attaching to a page that was built ahead of time, true
 * after that and for every later render. Anything the built page could not
 * know (the URL's search, today's date) must wait for true, or React reports
 * a hydration mismatch.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

// Read once per launch, so date maths is stable across renders.
const LAUNCH_TIME = typeof window === "undefined" ? BUILD_TIME : Date.now();

/** The time for date maths in the UI: the build time until hydrated, then the launch time. */
export function useNow() {
  return useHydrated() ? LAUNCH_TIME : BUILD_TIME;
}
