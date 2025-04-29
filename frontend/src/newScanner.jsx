import React from 'react'
import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { ScanBarcode } from "lucide-react";
import axios from 'axios';

function newScanner() {
    const [scannedCode, setScannedCode] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [shouldStart, setShouldStart] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(true);

  const readerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
    

  // Warm-up camera on initial load
  useEffect(() => {
    const warmUpCamera = async () => {
      const testQrCode = new Html5Qrcode("reader_1");
      try {
        await testQrCode.start(
          { facingMode: "environment" },
          { fps: 5, qrbox: { width: 50, height: 50 } },
          () => {},
          () => {}
        );
        await testQrCode.stop();
        testQrCode.clear();
        setCameraInitializing(false);
      } catch (e) {
        console.warn("Warm-up failed:", e);
        setCameraInitializing(false);
      }
    };

    warmUpCamera();
  }, []);

  // Start scanner when needed
  useEffect(() => {
    if (shouldStart && readerRef.current) {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader_1");
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      };

      html5QrCodeRef.current
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            html5QrCodeRef.current.stop().then(() => {
              setScannedCode(decodedText);
              fetchProductInfo(decodedText);
              setScanning(false);
              setShouldStart(false);
            });
          },
          (errorMessage) => {
            console.warn("Scanning error:", errorMessage);
          }
        )
        .then(() => {
          const videoElement = document.querySelector("#reader_1 video");
          if (videoElement) {
            videoElement.style.transform = "scaleX(1)";
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
          setScanning(false);
          setShouldStart(false);
        });
    }
  }, [shouldStart]);

  const startScanner = () => {
    if (scanning || cameraInitializing) return;
    setScanning(true);
    setShouldStart(true);
  };

  const fetchProductInfo = (barcode) => {
    axios.get(`https://world.openfoodfacts.org/api/v3/product/${barcode}`)
      .then(response => {
        setProductInfo(response.data.product);
      })
      .catch(error => console.log("Failed to get data from Open Food API:", error));
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div>
    <button onClick={startScanner} disabled={cameraInitializing}>
      <ScanBarcode className="text-green-300" size={70} />
    </button>

    {cameraInitializing && (
      <p className="text-gray-500 mt-2">Initializing camera...</p>
    )}

    {scanning && (
      <>
        <div
          id="reader_1"
          ref={readerRef}
          style={{ width: "300px", marginTop: "10px" }}
        ></div>
        <button
          onClick={async () => {
            if (html5QrCodeRef.current) {
              await html5QrCodeRef.current.stop();
              setScanning(false);
              setShouldStart(false);
            }
          }}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
        >
          Stop Scanning
        </button>
      </>
    )}

    {scannedCode && (
      <p className="text-green-600 mt-4">Scanned Code: {scannedCode}</p>
    )}

    {productInfo && (
      <div className="text-black mt-4 bg-gray-100 p-4 rounded">
        <h2 className="font-bold text-lg">
          {productInfo?.product_name ||
            productInfo?.product_name_fr ||
            productInfo?.ecoscore_data?.agribalyse?.name_fr ||
            "Unnamed Product"}
        </h2>
        <p>Brand: {productInfo?.brands}</p>
        {productInfo.image_front_url && (
          <img
            src={productInfo.image_front_url}
            alt="product"
            className="w-32 mt-2"
          />
        )}
      </div>
    )}
  </div>
  )
}

export default newScanner
