import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";

const SCANNER_ID = "pos-barcode-scanner-region";

// Ignore repeat reads of the same code within this window — the camera
// decodes ~10 frames/sec, so one scan would otherwise fire many times.
const DUPLICATE_WINDOW_MS = 1500;

export const BarcodeScanner = ({ open, onClose, onDetected }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);

  // Keep the latest callback without restarting the camera when it changes.
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let last = { code: null, at: 0 };

    const stop = (scanner) => {
      if (!scanner) return;
      const done = scanner.isScanning ? scanner.stop() : Promise.resolve();
      done.catch(() => {}).finally(() => {
        try {
          scanner.clear();
        } catch {
          // already cleared
        }
      });
    };

    const start = async () => {
      setError(null);
      setStarting(true);
      try {
        const html5QrCode = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = html5QrCode;

        // Get list of cameras
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          throw new Error("No camera found on this device.");
        }

        // Prefer rear/environment camera on mobile
        const rearCamera =
          cameras.find((c) => /back|rear|environment/i.test(c.label)) ??
          cameras[cameras.length - 1];

        if (cancelled) return;

        await html5QrCode.start(
          rearCamera.id,
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            const now = Date.now();
            if (decodedText === last.code && now - last.at < DUPLICATE_WINDOW_MS)
              return;
            last = { code: decodedText, at: now };
            onDetectedRef.current(decodedText);
          },
          () => {
            // per-frame "no result" — ignore, this fires constantly
          },
        );

        // Closed while the camera was still starting → stop it now,
        // otherwise the stream keeps running in the background.
        if (cancelled) {
          stop(html5QrCode);
          return;
        }
        setStarting(false);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Could not start camera.");
        setStarting(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      stop(scannerRef.current);
      scannerRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Camera size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">Scan barcode</p>
              <p className="text-xs text-gray-400">
                Point your camera at a product barcode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner area */}
        <div className="p-6 flex flex-col items-center gap-4">
          {error ? (
            <div className="w-full bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Camera unavailable
                </p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {starting && (
                <p className="text-xs text-gray-400">Starting camera...</p>
              )}
              <div
                id={SCANNER_ID}
                className="w-full aspect-3/2 rounded-xl overflow-hidden bg-gray-900"
              />
              <p className="text-xs text-gray-400 text-center">
                Center the barcode inside the box. Hold steady until detected.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
