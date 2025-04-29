import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { ScanBarcode } from "lucide-react";
import axios from "axios";

function Scan2() {
    const [scannedCode, setScannedCode] = useState(null);
    const [productInfo, setProductInfo] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [shouldStart, setShouldStart] = useState(false);
    const [cameraInitializing, setCameraInitializing] = useState(true);
  
    const readerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
  
    useEffect(() => {
      const warmUpCamera = async () => {
        const warmupElementId = "reader_warmup";
        const html5QrCode = new Html5Qrcode(warmupElementId);
  
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 5, qrbox: { width: 100, height: 100 } },
            () => {},
            () => {}
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await html5QrCode.stop();
        } catch (error) {
          console.warn("Warm-up failed:", error);
        } finally {
          const el = document.getElementById(warmupElementId);
          if (el) el.innerHTML = "";
          setCameraInitializing(false);
        }
      };
  
      warmUpCamera();
    }, []);
  
    useEffect(() => {
      if (shouldStart && readerRef.current) {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode("reader_2");
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
              if (!errorMessage.includes("NotFoundException")) {
                console.warn("Scanning error:", errorMessage);
              }
            }
          )
          .then(() => {
            const videoElement = document.querySelector("#reader_2 video");
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
      setScannedCode(null);
      setProductInfo(null);
      setScanning(true);
      setShouldStart(true);
    };
  
    const fetchProductInfo = (barcode) => {
      axios
        .get(`https://world.openfoodfacts.org/api/v3/product/${barcode}`)
        .then((response) => {
          setProductInfo(response.data.product);
        })
        .catch((error) =>
          console.log("Failed to get data from Open Food API:", error)
        );
    };
  
    useEffect(() => {
      return () => {
        if (html5QrCodeRef.current?.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
      };
    }, []);
  return (
    <div className="flex flex-col items-center p-4 text-center">
      <button
        onClick={startScanner}
        disabled={cameraInitializing}
        className={`p-4 rounded-full shadow-md transition duration-300 ${
          cameraInitializing
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-yellow-400 hover:bg-yellow-500"
        }`}
      >
        <ScanBarcode className="text-black" size={50} />
      </button>

      <div id="reader_warmup" style={{ display: "none" }}></div>

      {cameraInitializing && (
        <p className="text-gray-500 mt-4 animate-pulse">⏳ Initializing camera...</p>
      )}

      {scanning && (
        <div className="mt-4 w-full max-w-sm border border-gray-300 p-4 rounded shadow-md">
          <div id="reader_2" ref={readerRef}></div>
          <button
            onClick={async () => {
              if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.stop();
                setScanning(false);
                setShouldStart(false);
              }
            }}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full"
          >
            Stop Scanning
          </button>
        </div>
      )}

      {scannedCode && (
        <p className="text-orange-600 font-semibold mt-4">
          ✅ Scanned Code: {scannedCode}
        </p>
      )}

      {productInfo && (
        <div className="text-black mt-4 bg-gray-100 p-4 rounded shadow-sm w-full max-w-sm">
          <h2 className="font-bold text-lg mb-2">
            {productInfo?.product_name ||
              productInfo?.product_name_fr ||
              productInfo?.ecoscore_data?.agribalyse?.name_fr ||
              "Unnamed Product"}
          </h2>
          <p className="text-sm text-gray-700">Brand: {productInfo?.brands}</p>
          {productInfo.image_front_url && (
            <img
              src={productInfo.image_front_url}
              alt="product"
              className="w-32 mt-2 mx-auto rounded"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default Scan2
