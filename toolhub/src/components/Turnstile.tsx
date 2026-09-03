import { useEffect, useRef, useState } from "react";

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Loads the widget script once per page, no matter how many forms use it.
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Turnstile failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(script);
  });
}

interface Props {
  siteKey: string;
  onToken: (token: string) => void;
  theme?: "dark" | "light" | "auto";
}

// Cloudflare Turnstile. A token is single use, so the widget resets itself
// after it expires and hands the form a fresh one.
export function Turnstile({ siteKey, onToken, theme = "dark" }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const callback = useRef(onToken);
  const [failed, setFailed] = useState(false);
  callback.current = onToken;

  useEffect(() => {
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !holder.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(holder.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => callback.current(token),
          "expired-callback": () => callback.current(""),
          "error-callback": () => {
            callback.current("");
            setFailed(true);
          }
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, theme]);

  return (
    <div className="turnstile-field">
      <div ref={holder} />
      {failed ? (
        <em className="field-error">
          The bot check could not load. Disable your blocker for this page, or try again.
        </em>
      ) : null}
    </div>
  );
}
