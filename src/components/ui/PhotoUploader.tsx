'use client';

import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface PhotoUploaderProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

export default function PhotoUploader({ urls = [], onChange, disabled = false }: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    setError(null);

    const newUrls = [...urls];
    const files = Array.from(e.target.files);

    for (const file of files) {
      try {
        // Compress the image to a max of 1MB / 1920px
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        // Generate a unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('inspection_photos')
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        // Get the public URL for the newly uploaded photo
        const { data: publicUrlData } = supabase.storage
          .from('inspection_photos')
          .getPublicUrl(data.path);

        newUrls.push(publicUrlData.publicUrl);
      } catch (err: any) {
        console.error('Upload failed:', err);
        setError('Failed to upload one or more images.');
      }
    }

    onChange(newUrls);
    setIsUploading(false);
    e.target.value = ''; // Reset input so the same files can be selected again if needed
  };

  const handleRemove = (indexToRemove: number) => {
    if (disabled) return;
    onChange(urls.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {urls.map((url, idx) => (
          <div key={idx} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group shadow-sm">
            <Image src={url} alt={`Evidence ${idx + 1}`} fill className="object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSelectedImage(url)} />
            {!disabled && (
              <button type="button" onClick={() => handleRemove(idx)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
        ))}

        {!disabled && (
          <label className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isUploading ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-blue-300 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 text-blue-600'}`}>
            {isUploading ? (
              <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
            <span className="text-[10px] font-bold mt-1">{isUploading ? 'Uploading...' : 'Add Photo'}</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={isUploading} className="hidden" />
          </label>
        )}
      </div>

      {/* Full Screen Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedImage(null)}>
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity" />
          <div className="relative w-full max-w-4xl max-h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={selectedImage} alt="Full screen evidence" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}