import { useState } from "react";
// import { Html5Qrcode } from "html5-qrcode";
import { Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { ScanBarcode } from "lucide-react";

function App() {
  const [scannedCode, setScannedCode] = useState(null);
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
      console.log("Scanned Barcode:", decodedText);
      setScannedCode(decodedText)
      // Do something with the decodedText (ISBN or product code)
    },
    (errorMessage) => {
      console.warn("Scanning error:", errorMessage);
    }
  );
}



  return (
    <div>
      <button onClick={() => startScanner()}>
        <ScanBarcode size={40} />
      </button>

      {scanning && <div id="reader" style={{ width: "300px" }}></div>}

      {scannedCode && (
        <p className="text-green-600 mt-4">Scanned Code: {scannedCode}</p>
      )}
    </div>
  )
}

export default App
