import { useCallback, useState } from "react";
import { CameraView } from "./components/camera-view";
import { PhotoEditor } from "./components/photo-editor";

export function App() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const handleCancel = useCallback(() => setCapturedImage(null), []);
  const handleCapture = useCallback((img: string) => setCapturedImage(img), []);

  return (
    <div className="h-full w-full">
      {capturedImage ? (
        <PhotoEditor imageSrc={capturedImage} onCancel={handleCancel} />
      ) : (
        <CameraView onCapture={handleCapture} />
      )}
    </div>
  );
}
