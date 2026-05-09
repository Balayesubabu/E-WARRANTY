import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2, Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const SCAN_CONFIG = { fps: 10, qrbox: { width: 250, height: 250 } };

/**
 * Extracts activation token from QR text. Supports:
 * - https://example.com/activate/TOKEN
 * - /activate/TOKEN
 * - Full URL with pathname /activate/TOKEN
 * - Query: ?activation_token= or ?token= (when present)
 */
function extractActivationToken(decodedText) {
  if (!decodedText || typeof decodedText !== 'string') return null;
  const trimmed = decodedText.trim();

  const fromPath = trimmed.match(/\/activate\/([^/?&#]+)/i);
  if (fromPath) return decodeURIComponent(fromPath[1]);

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(trimmed, base);
    const pathMatch = u.pathname.match(/\/activate\/([^/?]+)/i);
    if (pathMatch) return decodeURIComponent(pathMatch[1]);
    const q =
      u.searchParams.get('activation_token') ||
      u.searchParams.get('token');
    if (q) return q.trim();
  } catch {
    /* not parseable as URL */
  }

  return null;
}

/** Only nudge user when QR clearly looked like a URL but wasn’t an activation link */
function looksLikeUrlWithoutActivation(s) {
  const t = s.trim();
  return /^https?:\/\//i.test(t) || (t.startsWith('/') && t.length > 1);
}

/**
 * Starts camera with fallbacks: rear → front → first enumerated device (desktop).
 */
async function startCameraWithFallback(scanner, onDecoded, onScanFailure) {
  const tryStart = (cameraIdOrConfig) =>
    scanner.start(cameraIdOrConfig, SCAN_CONFIG, onDecoded, onScanFailure);

  try {
    await tryStart({ facingMode: 'environment' });
    return;
  } catch (e1) {
    console.warn('[QR] environment camera failed:', e1?.message || e1);
  }

  try {
    await tryStart({ facingMode: 'user' });
    return;
  } catch (e2) {
    console.warn('[QR] user camera failed:', e2?.message || e2);
  }

  const cameras = await Html5Qrcode.getCameras();
  if (cameras && cameras.length > 0) {
    await tryStart(cameras[0].id);
    return;
  }

  throw new Error('No camera available');
}

export function QRScannerModal({ open, onClose, onScanSuccess }) {
  const [status, setStatus] = useState('idle'); // idle | starting | scanning | error | success
  const [errorMessage, setErrorMessage] = useState('');
  const scannerRef = useRef(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);
  const unknownQrToastAt = useRef(0);
  const containerId = 'qr-scanner-container';

  onScanSuccessRef.current = onScanSuccess;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
      setStatus('idle');
      setErrorMessage('');
      return;
    }

    let mounted = true;
    setStatus('starting');
    setErrorMessage('');

    const startScanner = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!mounted) return;
        const el = document.getElementById(containerId);
        if (!el) throw new Error('Scanner container not found');
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        const onDecoded = (decodedText) => {
          if (!mounted || !scannerRef.current) return;
          const token = extractActivationToken(decodedText);
          if (token) {
            setStatus('success');
            scanner.stop().catch(() => {}).finally(() => {
              scannerRef.current = null;
              onScanSuccessRef.current(token);
              onCloseRef.current();
            });
            return;
          }
          if (looksLikeUrlWithoutActivation(decodedText)) {
            const now = Date.now();
            if (now - unknownQrToastAt.current > 4000) {
              unknownQrToastAt.current = now;
              toast.message('Unrecognized QR', {
                description:
                  'This QR is not an activation link. Use the warranty QR from your label, or enter the code manually.',
              });
            }
          }
        };

        const onScanFailure = () => {
          /* no QR in frame — library keeps scanning */
        };

        await startCameraWithFallback(scanner, onDecoded, onScanFailure);

        if (mounted) setStatus('scanning');
      } catch (err) {
        if (!mounted) return;
        console.error('QR Scanner error:', err);
        scannerRef.current = null;
        const msg = err?.message || String(err);
        let userMsg = 'Could not start camera.';
        if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('permission')) {
          userMsg =
            'Camera not found or permission denied. Use warranty code or product search instead.';
        } else if (msg.toLowerCase().includes('secure')) {
          userMsg = 'Camera requires HTTPS. Use warranty code or product search instead.';
        } else if (msg.toLowerCase().includes('no camera')) {
          userMsg = 'No camera detected. Use warranty code or product search instead.';
        }
        setErrorMessage(userMsg);
        setStatus('error');
        toast.error(userMsg);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#1A7FC1]" />
            Scan QR code
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {(status === 'starting' || status === 'scanning') && (
            <div className="relative">
              <div id={containerId} className="rounded-xl overflow-hidden min-h-[250px] bg-slate-900" />
              {status === 'starting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 rounded-xl gap-3">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                  <p className="text-white text-sm">Starting camera...</p>
                </div>
              )}
              {status === 'scanning' && (
                <p className="text-slate-500 text-sm text-center mt-3">
                  Point your camera at the QR code on the product label
                </p>
              )}
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-slate-700 text-sm text-center">{errorMessage}</p>
              <Button variant="outline" onClick={onClose} className="border-slate-200">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
