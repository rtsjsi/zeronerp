/**
 * PWA Install Prompt
 * 
 * Shows a banner prompting the user to install the app on their device.
 * Only shows once per session, listens for the beforeinstallprompt event.
 */

"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user already dismissed or installed
    const hasDismissed = localStorage.getItem("pwa_prompt_dismissed");
    if (hasDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-card border border-border shadow-lg rounded-xl p-4 z-50 animate-slide-up flex gap-4">
      <div className="flex-1">
        <h3 className="font-semibold text-foreground text-sm">Install ZeronERP</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Add to your home screen for faster access and offline capabilities.
        </p>
      </div>
      <div className="flex flex-col gap-2 shrink-0 justify-center">
        <Button size="sm" className="h-8 text-xs" onClick={handleInstall}>
          <Download className="w-3.5 h-3.5 mr-1" />
          Install
        </Button>
        <button 
          onClick={handleDismiss}
          className="text-[10px] text-muted-foreground hover:text-foreground text-center"
        >
          Not now
        </button>
      </div>
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
