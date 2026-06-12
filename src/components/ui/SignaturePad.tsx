'use client';

import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onChange: (signatureData: string | null) => void;
  initialValue?: string | null;
  disabled?: boolean;
}

export default function SignaturePad({ onChange, initialValue, disabled = false }: SignaturePadProps) {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Pre-fill the canvas if we are viewing an existing signature
  useEffect(() => {
    if (initialValue && sigPadRef.current) {
      sigPadRef.current.fromDataURL(initialValue);
      setIsEmpty(false);
      if (disabled) {
        sigPadRef.current.off(); // Disable drawing if read-only
      }
    }
  }, [initialValue, disabled]);

  const handleClear = () => {
    if (disabled) return;
    sigPadRef.current?.clear();
    setIsEmpty(true);
    onChange(null);
  };

  const handleEnd = () => {
    if (sigPadRef.current?.isEmpty()) {
      setIsEmpty(true);
      onChange(null);
    } else {
      setIsEmpty(false);
      onChange(sigPadRef.current?.toDataURL() || null);
    }
  };

  return (
    <div className="w-full">
      <div className={`relative border-2 border-dashed rounded-2xl overflow-hidden bg-slate-50 ${disabled ? 'border-slate-200 opacity-80 cursor-not-allowed' : 'border-slate-300 hover:border-blue-400 transition-colors'}`}>
        <SignatureCanvas
          ref={sigPadRef}
          penColor="black"
          canvasProps={{
            className: `w-full h-48 sm:h-64 ${disabled ? 'pointer-events-none' : 'cursor-crosshair'}`
          }}
          onEnd={handleEnd}
        />
      </div>
      {!disabled && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-red-600 transition-colors"
          >
            Clear Signature
          </button>
        </div>
      )}
    </div>
  );
}