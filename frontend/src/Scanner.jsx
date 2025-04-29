import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { ScanBarcode } from "lucide-react";
import axios from 'axios'

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
                // fetchProductInfo("6111017047873");
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

  const fetchProductInfo = (barcode) => {
      axios.get(`https://world.openfoodfacts.org/api/v3/product/${barcode}`)
          .then(response => {
                  console.log(response.data)
                //   setProductQty(response.data.product.quantity)
                    setProductInfo(response.data.product);
                    console.log("name: ", response.data.product?.ecoscore_data?.agribalyse?.name_fr)
                //   console.log("nutriscore_grade: ", response.data?.nutriscore_grade)
          })
          .catch(error => console.log("Failed to get data from Open Food API:", error));
  }

  useEffect(() => {
    return () => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, []);
  /*
  useEffect(() => {
    fetchProductInfo("6111017047873")
  }, [])
  */

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
            <h2 className="font-bold text-lg">
                {productInfo?.product_name ||
                    productInfo?.product_name_fr ||
                    productInfo.ecoscore_data?.agribalyse?.name_fr ||
                    "Unnamed Product"
                }            
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
  );
}

export default Scanner;
