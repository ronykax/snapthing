import { useGoogleLogin } from "@react-oauth/google";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  findOrCreateFolder,
  getUserEmail,
  uploadImage,
} from "../services/drive";

interface PhotoEditorProps {
  imageSrc: string;
  onCancel: () => void;
}

export function PhotoEditor({ imageSrc, onCancel }: PhotoEditorProps) {
  const [text, setText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || e.target === imageRef.current) {
      setShowInput(true);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      setShowInput(true);
    }
  }, []);

  const generateFinalImage = useCallback(
    (): Promise<Blob> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject("No canvas context");
          }

          ctx.drawImage(img, 0, 0);

          if (text) {
            const fontSize = canvas.height * 0.04;
            ctx.font = `normal ${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const textHeight = fontSize * 1.4;
            const bgHeight = textHeight * 1.5;
            const bgY = canvas.height / 2 - bgHeight / 2;

            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, bgY, canvas.width, bgHeight);

            ctx.fillStyle = "white";
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject("Canvas toBlob failed");
              }
            },
            "image/jpeg",
            0.9
          );
        };
        img.src = imageSrc;
      }),
    [imageSrc, text]
  );

  const doUpload = useCallback(
    async (token: string, fromCache = false) => {
      setIsUploading(true);
      try {
        const blob = await generateFinalImage();
        const folderId = await findOrCreateFolder(token, "SnapThing");
        await uploadImage(token, folderId, blob);
        setUploadSuccess(true);
        setTimeout(() => {
          setUploadSuccess(false);
          onCancel();
        }, 2000);
      } catch (err: unknown) {
        console.error("Failed to upload:", err);
        if (fromCache) {
          localStorage.removeItem("snapthing_access_token");
          localStorage.removeItem("snapthing_token_expires");
          console.error(
            "Session expired or token revoked. Please log in again."
          );
        } else {
          console.error("Upload failed. Check console for details.");
        }
      } finally {
        setIsUploading(false);
      }
    },
    [generateFinalImage, onCancel]
  );

  const login = useGoogleLogin({
    hint: localStorage.getItem("snapthing_user_email") || undefined,
    onError: () => {
      console.error("Google Login Failed");
    },
    onSuccess: async (tokenResponse) => {
      try {
        const token = tokenResponse.access_token;
        const expiresIn = tokenResponse.expires_in || 3599;
        const expiresAt = Date.now() + expiresIn * 1000;

        localStorage.setItem("snapthing_access_token", token);
        localStorage.setItem("snapthing_token_expires", expiresAt.toString());

        try {
          const email = await getUserEmail(token);
          if (email) {
            localStorage.setItem("snapthing_user_email", email);
          }
        } catch (emailErr) {
          console.error("Could not fetch user email for hint", emailErr);
        }

        await doUpload(token, false);
      } catch (err) {
        console.error("Error in login success handler:", err);
      }
    },
    scope:
      "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
  });

  const handleSaveToDrive = useCallback(async () => {
    const savedToken = localStorage.getItem("snapthing_access_token");
    const expiresAt = localStorage.getItem("snapthing_token_expires");

    if (
      savedToken &&
      expiresAt &&
      Date.now() < Number.parseInt(expiresAt, 10)
    ) {
      await doUpload(savedToken, true);
    } else {
      login();
    }
  }, [doUpload, login]);

  const handleBlur = useCallback(() => {
    if (!text.trim()) {
      setShowInput(false);
    }
  }, [text]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <button
      className="relative block h-full w-full select-none overflow-hidden border-none bg-black text-left outline-none"
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      type="button"
    >
      <img
        alt="Captured"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        height={1080}
        ref={imageRef}
        src={imageSrc}
        width={1920}
      />

      {!!showInput && (
        <div className="pointer-events-auto absolute top-1/2 left-0 w-full -translate-y-1/2 bg-black/50 py-3">
          <input
            className="w-full bg-transparent text-center font-normal text-3xl text-white placeholder-white/50 outline-none"
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder="Type something..."
            ref={inputRef}
            type="text"
            value={text}
          />
        </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-6 left-6 z-10">
        <button
          className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
          onClick={onCancel}
          type="button"
        >
          <svg
            className="h-8 w-8 drop-shadow-md"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Cancel</title>
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
            />
          </svg>
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute right-6 bottom-10 z-10">
        <button
          className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-50"
          disabled={isUploading || uploadSuccess}
          onClick={handleSaveToDrive}
          type="button"
        >
          {isUploading ? <span>Saving...</span> : null}
          {!isUploading && uploadSuccess ? <span>Saved! ✓</span> : null}
          {isUploading || uploadSuccess ? null : (
            <>
              <span>Save to Drive</span>
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Save</title>
                <path
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </button>
  );
}
