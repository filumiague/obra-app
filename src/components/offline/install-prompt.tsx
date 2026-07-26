"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

function isStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // iOS Safari has no beforeinstallprompt event — the only path is the
    // manual Share > Add to Home Screen flow, so just point at it. This is a
    // one-time read of a static platform capability (not reactive state), and
    // isIos()/isStandalone() touch `window`, so it can't be a lazy useState
    // initializer without breaking SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIos()) setShowIosHint(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  if (dismissed) return null;

  if (deferredPrompt) {
    return (
      <div className="flex items-center justify-between gap-2 bg-muted px-3 py-2 text-xs">
        <span>Instale o Controle de Obra na tela inicial para acesso rápido.</span>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            onClick={async () => {
              await deferredPrompt.prompt();
              await deferredPrompt.userChoice;
              setDeferredPrompt(null);
            }}
          >
            Instalar
          </Button>
          <button
            type="button"
            className="text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            Agora não
          </button>
        </div>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div className="flex items-center justify-between gap-2 bg-muted px-3 py-2 text-xs">
        <span>
          Para instalar: toque em Compartilhar e depois em &quot;Adicionar à Tela
          de Início&quot;.
        </span>
        <button
          type="button"
          className="shrink-0 text-muted-foreground"
          onClick={() => setShowIosHint(false)}
        >
          Ok
        </button>
      </div>
    );
  }

  return null;
}
