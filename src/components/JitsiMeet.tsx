"use client";

import { useEffect, useRef, useState } from "react";

interface JitsiMeetProps {
  roomName: string;
  displayName?: string;
  onReady?: () => void;
}

interface JitsiAPI {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  addListener: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface JitsiMeetExternalAPIConstructor {
  new (
    domain: string,
    options: {
      roomName: string;
      parentNode: HTMLElement;
      width?: string | number;
      height?: string | number;
      configOverwrite?: Record<string, unknown>;
      interfaceConfigOverwrite?: Record<string, unknown>;
      userInfo?: {
        displayName?: string;
      };
    }
  ): JitsiAPI;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiMeetExternalAPIConstructor;
  }
}

export function JitsiMeet({ roomName, displayName, onReady }: JitsiMeetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initAttemptedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    // Clean room name - remove spaces and special characters
    const cleanRoomName = roomName.replace(/[^a-zA-Z0-9]/g, "");

    const loadJitsiScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        // Check if script is already in DOM
        const existingScript = document.querySelector(
          'script[src="https://meet.jit.si/external_api.js"]'
        );
        if (existingScript) {
          // Wait for it to load
          const checkAPI = setInterval(() => {
            if (window.JitsiMeetExternalAPI) {
              clearInterval(checkAPI);
              resolve();
            }
          }, 100);
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkAPI);
            if (!window.JitsiMeetExternalAPI) {
              reject(new Error("Jitsi script load timeout"));
            }
          }, 10000);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => {
          // Small delay to ensure API is fully initialized
          setTimeout(() => {
            if (window.JitsiMeetExternalAPI) {
              resolve();
            } else {
              reject(new Error("Jitsi API not available after script load"));
            }
          }, 100);
        };
        script.onerror = () => reject(new Error("Failed to load Jitsi script"));
        document.head.appendChild(script);
      });
    };

    const initJitsi = async () => {
      try {
        console.log("Loading Jitsi script...");
        await loadJitsiScript();
        console.log("Jitsi script loaded, API available:", !!window.JitsiMeetExternalAPI);

        if (!containerRef.current) {
          console.error("Container ref not available");
          setError("Failed to initialize video container");
          setIsLoading(false);
          return;
        }

        if (!window.JitsiMeetExternalAPI) {
          console.error("JitsiMeetExternalAPI not available");
          setError("Failed to load video conference library");
          setIsLoading(false);
          return;
        }

        console.log("Initializing Jitsi with room:", cleanRoomName, "displayName:", displayName);

        const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName: cleanRoomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            defaultLanguage: "en",
            toolbarButtons: [
              "camera",
              "chat",
              "closedcaptions",
              "desktop",
              "fullscreen",
              "hangup",
              "microphone",
              "participants-pane",
              "raisehand",
              "settings",
              "tileview",
              "toggle-camera",
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: "",
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            MOBILE_APP_PROMO: false,
            HIDE_INVITE_MORE_HEADER: true,
            TOOLBAR_ALWAYS_VISIBLE: true,
            FILM_STRIP_MAX_HEIGHT: 120,
            VIDEO_QUALITY_LABEL_DISABLED: true,
          },
          userInfo: {
            displayName: displayName || "Guest",
          },
        });

        apiRef.current = api;

        // Listen for conference joined
        api.addListener("videoConferenceJoined", () => {
          console.log("Video conference joined!");
          setIsLoading(false);
          onReady?.();
        });

        // Listen for iframe ready - this fires when the iframe loads
        api.addListener("browserSupport", () => {
          console.log("Browser support check complete");
        });

        // Fallback: Hide loading after timeout (iframe might be ready even if event doesn't fire)
        const loadingTimeout = setTimeout(() => {
          console.log("Loading timeout reached, hiding loader");
          setIsLoading(false);
        }, 8000);

        // Clear timeout if we join successfully
        api.addListener("videoConferenceJoined", () => {
          clearTimeout(loadingTimeout);
        });

        // Handle errors
        api.addListener("errorOccurred", (error: unknown) => {
          console.error("Jitsi error:", error);
        });

      } catch (err) {
        console.error("Failed to initialize Jitsi:", err);
        setError("Failed to load the video conference. Please refresh the page.");
        setIsLoading(false);
      }
    };

    initJitsi();

    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (e) {
          console.error("Error disposing Jitsi:", e);
        }
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, onReady]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-charcoal/10 rounded-2xl">
        <div className="text-center p-8">
          <svg
            className="w-16 h-16 text-terracotta mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-charcoal font-medium mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-terracotta hover:text-terracotta-dark font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-forest z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Connecting to video conference...</p>
            <p className="text-white/60 text-sm mt-2">This may take a few seconds</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}
