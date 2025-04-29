import React, { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { ScanBarcode } from "lucide-react";

function NewScanWithZxing() {
  const [scannedCode, setScannedCode] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const videoRef = useRef(null);
  const codeReader = useRef(null);

  useEffect(() => {
    // Initialize the video feed for scanning when the component mounts
    const initializeScanner = async () => {
      try {
        if (videoRef.current) {
          // Try to initialize the scanner and display the video feed
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          console.log("Camera feed initialized");
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setErrorMessage("Error accessing camera.");
      }
    };

    initializeScanner();

    return () => {
      // Cleanup when the component unmounts (stop the video stream)
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startScanner = () => {
    if (scanning) return; // Prevent starting if already scanning

    setScanning(true);
    setErrorMessage(""); // Reset any previous error messages

    // Initialize ZXing MultiFormatReader
    codeReader.current = new BrowserMultiFormatReader();

    // Start scanning from the camera once the video feed is ready
    codeReader.current
      .decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result) {
          console.log("Scanned result: ", result.getText()); // Debug log
          setScannedCode(result.getText()); // Store the scanned code
          setScanning(false); // Stop scanning once a code is found
        } else if (error) {
          setErrorMessage("Scanning error: " + error.message); // Display scanning error
        }
      })
      .catch((err) => {
        console.error("Error starting scanner: ", err);
        setErrorMessage("Error starting scanner: " + err.message);
        setScanning(false);
      });
  };

  const stopScanner = () => {
    if (codeReader.current) {
      codeReader.current.reset(); // Stop the scanner
    }
    setScanning(false);
  };

  return (
    <div>
      <button onClick={startScanner} disabled={scanning} className="mb-4">
        <ScanBarcode className="text-orange-300" size={70} />
        Start Scanning
      </button>

      {scanning && (
        <div>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "auto",
              border: "1px solid #ccc",
              marginBottom: "10px",
            }}
            autoPlay
            muted
          ></video>
          <button onClick={stopScanner} className="mt-2 bg-red-500 text-white px-4 py-2 rounded">
            Stop Scanning
          </button>
        </div>
      )}

      {scannedCode && (
        <p className="text-orange-600 mt-4">Scanned Code: {scannedCode}</p>
      )}

      {errorMessage && (
        <p className="text-red-500 mt-4">{errorMessage}</p>
      )}
    </div>
  );
}

export default NewScanWithZxing;
