import React, { useState, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { ScanBarcode } from "lucide-react";

function NewScanWithZxing() {
  const [scannedCode, setScannedCode] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const streamRef = useRef(null);

  const startScanner = async () => {
    console.log("Start scanning clicked");
    if (scanning) return;

    setScanning(true);
    setErrorMessage("");
    setScannedCode(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      codeReader.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log("Scanned result:", result);
            setScannedCode(result.getText());
            stopScanner();
          }
          if (error) {
            // Skip logging NotFoundException as it's normal during scanning
            if (!error.message.includes("NotFoundException")) {
              console.log("Scanning error:", error);
              setErrorMessage("Scanning error: " + error.message);
            }
          }
        }
      );
    } catch (err) {
      console.error("Error starting scanner: ", err);
      setErrorMessage("Error accessing camera: " + err.message);
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  return (
    <div className="p-4">
      <button 
        onClick={scanning ? stopScanner : startScanner}
        className="flex flex-col items-center mb-4"
      >
        <ScanBarcode 
          className={scanning ? "text-red-500" : "text-blue-400"} 
          size={70} 
        />
        {scanning ? "Stop Scanning" : "Start Scanning"}
      </button>

      {scanning && (
        <div>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              maxHeight: "300px",
              border: "1px solid #ccc",
              marginBottom: "10px",
            }}
            playsInline
            muted
          ></video>
        </div>
      )}

      {scannedCode && (
        <p className="text-orange-600 mt-4 text-center font-bold">
          Scanned Code: {scannedCode}
        </p>
      )}

      {errorMessage && (
        <p className="text-red-500 mt-4 text-center">{errorMessage}</p>
      )}
    </div>
  );
}

export default NewScanWithZxing;