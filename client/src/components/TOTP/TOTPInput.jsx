import { useState, useRef, useEffect, useCallback } from 'react';
import { validateTOTPSecret, parseOTPAuthURI } from '../../utils/totp';

/**
 * Input component for TOTP secret with QR scanning
 * @param {Object} props
 * @param {string} props.value - Current secret value
 * @param {Function} props.onChange - Callback when secret changes
 */
export default function TOTPInput({ value, onChange }) {
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState('');
  const [scannerSupported, setScannerSupported] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);

  // Check if BarcodeDetector is supported
  useEffect(() => {
    setScannerSupported('BarcodeDetector' in window);
  }, []);

  const handleManualInput = (e) => {
    const input = e.target.value.toUpperCase().replace(/[^A-Z2-7]/g, '');
    onChange(input);
    if (input && !validateTOTPSecret(input)) {
      setError('Le secret doit contenir au moins 16 caracteres base32 valides (A-Z, 2-7)');
    } else {
      setError('');
    }
  };

  const stopScanner = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
  }, []);

  const scanQRCode = useCallback(async () => {
    if (!videoRef.current || !scanningRef.current) return;

    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

      const checkFrame = async () => {
        if (!videoRef.current || !streamRef.current || !scanningRef.current) return;

        try {
          const barcodes = await detector.detect(videoRef.current);

          for (const barcode of barcodes) {
            const parsed = parseOTPAuthURI(barcode.rawValue);
            if (parsed) {
              onChange(parsed.secret);
              setError('');
              stopScanner();
              return;
            }
          }
        } catch {
          // Detection failed, continue scanning
        }

        if (scanningRef.current) {
          requestAnimationFrame(checkFrame);
        }
      };

      requestAnimationFrame(checkFrame);
    } catch (err) {
      setError('Erreur de detection QR');
      stopScanner();
    }
  }, [onChange, stopScanner]);

  const startScanner = async () => {
    if (!scannerSupported) {
      setError('Scan QR non supporte par ce navigateur. Saisissez le secret manuellement.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = stream;
      scanningRef.current = true;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setShowScanner(true);
          scanQRCode();
        };
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Acces a la camera refuse');
      } else if (err.name === 'NotFoundError') {
        setError('Aucune camera disponible');
      } else {
        setError('Erreur d\'acces a la camera');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scanningRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={handleManualInput}
          placeholder="JBSWY3DPEHPK3PXP..."
          className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono text-sm focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey/50 uppercase tracking-wider"
        />

        {/* QR Scan button */}
        <button
          type="button"
          onClick={showScanner ? stopScanner : startScanner}
          className={`px-3 py-2 sm:px-4 sm:py-3 border-2 rounded transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
            showScanner
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 hover:border-red-400'
              : 'bg-cyan/20 hover:bg-cyan/30 text-cyan border-cyan/30 hover:border-cyan'
          }`}
          title={showScanner ? 'Arreter le scan' : 'Scanner un QR code'}
        >
          {showScanner ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          )}
          <span className="hidden sm:inline text-sm font-mono">
            {showScanner ? 'Stop' : 'QR'}
          </span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-xs font-mono flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </p>
      )}

      {/* QR Scanner */}
      {showScanner && (
        <div className="relative aspect-square max-w-xs mx-auto border-2 border-lime/30 rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Scan overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-lime" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-lime" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-lime" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-lime" />
            {/* Scanning line animation */}
            <div className="absolute left-4 right-4 h-0.5 bg-lime/50 animate-pulse" style={{ top: '50%' }} />
          </div>
          {/* Instructions */}
          <div className="absolute bottom-0 left-0 right-0 bg-dark-navy/80 p-2 text-center">
            <p className="text-xs text-grey font-mono">Placez le QR code dans le cadre</p>
          </div>
        </div>
      )}

      {/* Help text */}
      {!showScanner && (
        <p className="text-grey text-xs font-mono">
          <span className="text-cyan">▸</span> Saisissez le secret TOTP ou scannez un QR code
        </p>
      )}

      {/* Validation indicator */}
      {value && validateTOTPSecret(value) && (
        <p className="text-lime text-xs font-mono flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Secret valide ({value.length} caracteres)</span>
        </p>
      )}
    </div>
  );
}
