import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Clipboard,
  X,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { captureScreenViaDisplayMedia, readFileAsDataUrl } from '../utils/screenCapture';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCapture: (name: string, imageDataUrl: string, imageName: string) => void;
  defaultName?: string;
  onNotify: (msg: string) => void;
}

export const CaptureModal: React.FC<CaptureModalProps> = ({
  isOpen,
  onClose,
  onConfirmCapture,
  defaultName = '',
  onNotify,
}) => {
  const [screenName, setScreenName] = useState(defaultName || '');
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resolvedName = screenName.trim() || `Écran ${new Date().toLocaleTimeString('fr-FR')}`;

  const handleDisplayMediaCapture = async () => {
    setIsCapturing(true);
    try {
      onNotify('Sélectionnez la fenêtre de l’application cible dans la boîte de dialogue...');
      const { dataUrl } = await captureScreenViaDisplayMedia();
      onConfirmCapture(resolvedName, dataUrl, `capture_${Date.now()}.png`);
      onNotify(`Capture enregistrée : ${resolvedName}`);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Capture annulée ou non autorisée';
      onNotify(`Capture annulée : ${message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onConfirmCapture(resolvedName, dataUrl, file.name);
      onNotify(`Capture importée : ${resolvedName}`);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de lecture';
      onNotify(`Erreur d'import : ${message}`);
    }
  };

  const handleUseDemoSample = () => {
    onConfirmCapture(resolvedName || 'Écran d’accueil — Démo', '/acceuil.png', 'acceuil.png');
    onNotify('Capture de démonstration ajoutée.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Capturer un écran</h3>
            <p className="text-xs text-slate-400">
              Photographie de l’application cible rattachée à une nouvelle fiche
            </p>
          </div>
        </div>

        {/* Screen Name Input */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Nom de l’écran
          </label>
          <input
            type="text"
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            placeholder="Ex : Tableau de bord, Paramètres > Profil, Modal de confirmation"
            autoFocus
            className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Capture modes */}
        <div className="space-y-2.5">
          <button
            onClick={handleDisplayMediaCapture}
            disabled={isCapturing}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-left transition-all active:scale-[0.98] shadow-sm disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-700/50 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold">
                {isCapturing ? 'Capture en cours…' : 'Capturer une fenêtre ou tout l’écran'}
              </p>
              <p className="text-[11px] text-indigo-200/80">
                Choix direct de l’application ouverte via l’outil système
              </p>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0 text-slate-300">
              <Upload className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium">Importer un fichier image</p>
              <p className="text-[11px] text-slate-400">
                Sélectionnez un fichier PNG, JPG ou WebP enregistré
              </p>
            </div>
          </button>

          <button
            onClick={handleUseDemoSample}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900 hover:bg-slate-800/60 text-slate-300 border border-slate-800 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium">Capture d’exemple (acceuil.png)</p>
              <p className="text-[11px] text-slate-500">
                Utilise la capture d’origine du référentiel
              </p>
            </div>
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clipboard className="w-3.5 h-3.5 text-slate-500" />
            <span>Collez aussi directement (Ctrl+V)</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
