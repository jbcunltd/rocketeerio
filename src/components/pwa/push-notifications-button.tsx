"use client";

import { useEffect, useState } from "react";

type PushNotificationsButtonProps = {
  pageId: string | null;
  pageName: string;
};

type NotificationStatus = "checking" | "unsupported" | "disabled" | "ready" | "enabled" | "blocked" | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;

  const existingRegistration = await navigator.serviceWorker.getRegistration("/");
  if (existingRegistration) return existingRegistration;

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export function PushNotificationsButton({ pageId, pageName }: PushNotificationsButtonProps) {
  const [status, setStatus] = useState<NotificationStatus>("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!pageId) {
        setStatus("disabled");
        setMessage("Connect a Facebook Page before enabling notifications.");
        return;
      }

      if (!("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) {
        setStatus("unsupported");
        setMessage("Push notifications are not supported on this browser.");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("blocked");
        setMessage("Notifications are blocked in this browser. Enable them in browser settings to receive lead alerts.");
        return;
      }

      try {
        const registration = await getServiceWorkerRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        setStatus(subscription ? "enabled" : "ready");
        setMessage(subscription ? `Lead alerts are enabled for ${pageName}.` : null);
      } catch (error) {
        console.error("[push] Failed to inspect notification status", error);
        setStatus("error");
        setMessage("Could not check notification status. Please refresh and try again.");
      }
    };

    void checkStatus();
  }, [pageId, pageName]);

  const enableNotifications = async () => {
    if (!pageId || isBusy) return;

    setIsBusy(true);
    setMessage(null);

    try {
      if (!("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) {
        setStatus("unsupported");
        setMessage("Push notifications are not supported on this browser.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("blocked");
        setMessage("Notifications are blocked. Enable them in browser settings to receive lead alerts.");
        return;
      }

      if (permission !== "granted") {
        setStatus("ready");
        setMessage("Notification permission was not granted.");
        return;
      }

      const keyResponse = await fetch("/api/push/vapid-public-key", { cache: "no-store" });
      if (!keyResponse.ok) {
        throw new Error("Push notifications are not configured yet.");
      }

      const { publicKey } = (await keyResponse.json()) as { publicKey: string };
      const registration = await getServiceWorkerRegistration();
      if (!registration) throw new Error("Service worker registration failed.");

      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const saveResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, subscription: subscription.toJSON() }),
      });

      if (!saveResponse.ok) {
        const errorPayload = (await saveResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Could not save push subscription.");
      }

      setStatus("enabled");
      setMessage(`Lead alerts are enabled for ${pageName}.`);
    } catch (error) {
      console.error("[push] Failed to enable notifications", error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not enable notifications. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const isEnabled = status === "enabled";
  const isDisabled = isBusy || status === "unsupported" || status === "blocked" || status === "disabled";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Hot lead notifications</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Get a browser push alert when a hot or qualified lead messages, or when a new conversation starts.
          </p>
          {message ? <p className="mt-2 text-xs leading-5 text-slate-500">{message}</p> : null}
        </div>
        <button
          type="button"
          onClick={enableNotifications}
          disabled={isDisabled || isEnabled}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#0084FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006fd6] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isBusy ? "Enabling..." : isEnabled ? "Notifications Enabled" : "Enable Notifications"}
        </button>
      </div>
    </div>
  );
}
