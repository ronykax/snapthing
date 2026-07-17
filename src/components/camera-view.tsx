import { useCallback, useEffect, useRef, useState } from "react";

interface CameraViewProps {
  onCapture: (imageSrc: string) => void;
}

export function CameraView({ onCapture }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function setupCamera() {
      if (currentStream) {
        for (const track of currentStream.getTracks()) {
          track.stop();
        }
      }
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode },
        });
        currentStream = newStream;
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }

    setupCamera();

    return () => {
      if (currentStream) {
        for (const track of currentStream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [facingMode]);

  const capture = useCallback(() => {
    if (!videoRef.current) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (facingMode === "user") {
        // mirror image if selfie
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      onCapture(dataUrl);
    }
  }, [facingMode, onCapture]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-end bg-black pb-10">
      <video
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
        playsInline
        ref={videoRef}
      >
        <track kind="captions" />
      </video>

      <div className="z-10 mb-8 flex items-center gap-12">
        <button
          className="rounded-full bg-gray-800/60 p-4 text-white backdrop-blur-md transition-colors hover:bg-gray-700/60"
          onClick={toggleCamera}
          type="button"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Toggle Camera</title>
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>

        <button
          className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white p-1 transition-transform active:scale-95"
          onClick={capture}
          type="button"
        >
          <div className="h-full w-full rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
}
