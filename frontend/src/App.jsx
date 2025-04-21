import { useState } from "react";
// import { Html5Qrcode } from "html5-qrcode";
import { Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { ScanBarcode } from "lucide-react";

function App() {
  const [scannedCode, setScannedCode] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [scanning, setScanning] = useState(false);

  const startScanner = async () => {
    setScanning(true);

    const html5QrCode = new Html5Qrcode("reader");

    // const config = { fps: 10, qrbox: 250 };
    const config = {
      fps: 10,
      // qrbox: 250,
      qrbox: { width: 250, height: 150 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ],
    };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText, decodedResult) => {
      html5QrCode.stop().then(() => {
        setScannedCode(decodedText);
        fetchProductInfo(decodedText);
        setScanning(false);
      });
    },
    (errorMessage) => {
      console.warn("Scanning error:", errorMessage);
    }
  ).then(() => {
    // Set camera to normal view (not mirrored)
    const videoElement = document.querySelector("#reader video");
    if (videoElement) {
      videoElement.style.transform = "scaleX(1)";
    }
  })
  .catch((err) => {
    console.error("Camera error:", err);
    setScanning(false);
  });
}

const fetchProductInfo = async (barcode) => {
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      setProductInfo(data.items[0]);
    } else {
      setProductInfo(null);
      console.log("No product info found.");
    }
  } catch (error) {
    console.error("Error fetching product info:", error);
  }
};


  return (
    <div>
      <button onClick={() => startScanner()}>
        <ScanBarcode size={40} />
      </button>

      {scanning && <div id="reader" style={{ width: "300px" }}></div>}

      {scannedCode && (
        <p className="text-green-600 mt-4">Scanned Code: {scannedCode}</p>
      )}

      {productInfo && (
        <div className="mt-4 bg-gray-100 p-4 rounded">
          <h2 className="font-bold text-lg">{productInfo.title}</h2>
          <p>Brand: {productInfo.brand}</p>
          {productInfo.images && productInfo.images[0] && (
            <img src={productInfo.images[0]} alt="product" className="w-32 mt-2" />
          )}
        </div>
      )}
    </div>
  )
}

export default App
