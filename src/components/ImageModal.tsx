import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  title,
}) => {
  if (!isOpen || !imageSrc) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'screen'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-200 truncate max-w-md">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger l’image</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
          <img
            src={imageSrc}
            alt={title}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};
