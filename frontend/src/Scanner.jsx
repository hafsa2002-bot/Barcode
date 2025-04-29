import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { ScanBarcode } from "lucide-react";

let html5QrCode;

function Scanner() {
  const [scannedCode, setScannedCode] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [shouldStart, setShouldStart] = useState(false);
  const readerRef = useRef(null);

  useEffect(() => {
    if (shouldStart && readerRef.current) {
      html5QrCode = new Html5Qrcode("reader_1");
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

      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            html5QrCode.stop().then(() => {
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
    if (scanning) return;
    setScanning(true);
    setShouldStart(true); // triggers useEffect
  };

  const fetchProductInfo = async (barcode) => {
    try {
      const response = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`
      );
      const data = await response.json();
      if (data.items?.length > 0) {
        setProductInfo(data.items[0]);
      } else {
        setProductInfo(null);
        console.log("No product info found.");
      }
    } catch (error) {
      console.error("Error fetching product info:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div>
      <button onClick={startScanner}>
        <ScanBarcode className="text-green-300" size={70} />
      </button>

      {scanning && (
        <>
          <div
            id="reader_1"
            ref={readerRef}
            style={{ width: "300px", marginTop: "10px" }}
          ></div>
          <button
            onClick={async () => {
              if (html5QrCode) {
                await html5QrCode.stop();
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
          <h2 className="font-bold text-lg">{productInfo.title}</h2>
          <p>Brand: {productInfo.brand}</p>
          {productInfo.images && productInfo.images[0] && (
            <img
              src={productInfo.images[0]}
              alt="product"
              className="w-32 mt-2"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Scanner;
