import React, { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { ScanBarcode } from "lucide-react";

function NewScanWithZxing() {
  const [scannedCode, setScannedCode] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const streamRef = useRef(null);

  const initCamera = async () => {
    try {
      setErrorMessage("");
  
      const constraints = {
        video: {
          facingMode: "environment",
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
          frameRate: { ideal: 30 },
        },
      };
  
      let stream = await navigator.mediaDevices
        .getUserMedia(constraints)
        .catch(async () => {
          const fallbackConstraints = { video: { facingMode: "environment" } };
          return await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        });
  
      streamRef.current = stream;
  
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
  
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
  
        await videoRef.current.play();
        setCameraReady(true);
        return true; // ✅ indicate camera is ready
      }
      return false;
    } catch (err) {
      console.error("Camera initialization failed:", err);
      setErrorMessage(`Camera error: ${err.message || "Could not access camera"}`);
      setScanning(false);
      return false;
    }
  };
  

  const startScanner = async () => {
    if (scanning) return;
  
    setScanning(true);
    setScannedCode(null);
  
    try {
      if (!streamRef.current) {
        const isCameraReady = await initCamera(); // ✅ wait for camera
        if (!isCameraReady) {
          throw new Error("Camera not ready");
        }
      }
  
      codeReader.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
            if (result) {
                setScannedCode(result.text);
                stopScanner();
              }
              if (error && error.name !== "NotFoundException") {
                console.warn("Scanning warning:", error);
              }
        }
      );
    } catch (err) {
      console.error("Scanning failed:", err);
      setErrorMessage(`Scanning error: ${err.message}`);
      stopScanner();
    }
  };
  

  const stopScanner = () => {
    try {
      if (codeReader.current && codeReader.current.stopContinuousDecode) {
        codeReader.current.stopContinuousDecode();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setScanning(false);
      setCameraReady(false);
    } catch (error) {
      console.error("Error while stopping scanner:", error);
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={scanning ? stopScanner : startScanner}
          disabled={!!errorMessage}
          className={`p-4 rounded-lg flex flex-col items-center ${
            scanning ? "bg-red-100" : "bg-blue-100"
          } ${errorMessage ? "opacity-50" : ""}`}
        >
          <ScanBarcode
            className={scanning ? "text-red-500" : "text-blue-500"}
            size={48}
          />
          <span className="mt-2 font-medium">
            {scanning ? "Stop Scanning" : "Start Scanning"}
          </span>
        </button>

        {scanning && (
          <div className="relative w-full">
            <video
              ref={videoRef}
              className="w-full h-auto border-2 border-gray-300 rounded-lg"
              playsInline
              muted
              autoPlay
            />
            {!cameraReady && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <p className="text-white">Initializing camera...</p>
              </div>
            )}
          </div>
        )}

        {scannedCode && (
          <div className="w-full p-4 bg-green-100 rounded-lg">
            <p className="font-bold text-green-800">Scanned Code:</p>
            <p className="text-xl font-mono break-all">{scannedCode}</p>
          </div>
        )}

        {errorMessage && (
          <div className="w-full p-4 bg-red-100 rounded-lg">
            <p className="text-red-800">{errorMessage}</p>
            <button
              onClick={() => {
                setErrorMessage("");
                stopScanner();
              }}
              className="mt-2 text-sm text-blue-600"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewScanWithZxing;
