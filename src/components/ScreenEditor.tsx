import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  ZoomIn,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ScreenItem, FIELDS, FieldDefinition } from '../types';
import { readFileAsDataUrl, extractImageFromClipboardEvent } from '../utils/screenCapture';

interface ScreenEditorProps {
  screen: ScreenItem | null;
  onUpdateScreen: (updated: ScreenItem) => void;
  onInitiateCapture: () => void;
  onOpenImageModal: (imageSrc: string, title: string) => void;
  onNotify: (msg: string) => void;
}

export const ScreenEditor: React.FC<ScreenEditorProps> = ({
  screen,
  onUpdateScreen,
  onInitiateCapture,
  onOpenImageModal,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  if (!screen) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
        <Layers className="w-12 h-12 text-slate-700 mb-3" />
        <h3 className="text-base font-semibold text-slate-400">Aucun écran sélectionné</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Sélectionnez un écran dans la colonne de gauche ou capturez une nouvelle fenêtre pour commencer la documentation.
        </p>
        <button
          onClick={onInitiateCapture}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Camera className="w-4 h-4" />
          <span>Capturer un écran</span>
        </button>
      </div>
    );
  }

  const handleFieldChange = (key: keyof ScreenItem, value: string) => {
    onUpdateScreen({
      ...screen,
      [key]: value,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onUpdateScreen({
        ...screen,
        image: dataUrl,
        imageName: file.name,
      });
      onNotify(`Image « ${file.name} » rattachée à l'écran.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      onNotify(`Erreur d'import : ${message}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = () => {
    onUpdateScreen({
      ...screen,
      image: '',
      imageName: '',
    });
    onNotify('Capture retirée de la fiche.');
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const imageFile = extractImageFromClipboardEvent(e);
    if (imageFile) {
      e.preventDefault();
      try {
        const dataUrl = await readFileAsDataUrl(imageFile);
        onUpdateScreen({
          ...screen,
          image: dataUrl,
          imageName: `paste_${Date.now()}.png`,
        });
        onNotify('Image collée depuis le presse-papier !');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleQuickInsert = (fieldKey: FieldDefinition['key'], snippet: string) => {
    const current = (screen[fieldKey] || '') as string;
    const updated = current ? `${current}\n${snippet}` : snippet;
    handleFieldChange(fieldKey, updated);
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full focus:outline-none"
      onPaste={handlePaste}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Screen Name Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Nom de l’écran
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={screen.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Ex : Tableau de bord, Paramètres > Profil, Écran de connexion..."
            className="flex-1 text-sm font-semibold bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-white placeholder:text-slate-600 focus:outline-none transition-colors"
          />
          <button
            onClick={onInitiateCapture}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600/90 hover:bg-indigo-600 text-white shrink-0 transition-colors shadow-xs"
            title="Prendre une capture pour cet écran"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Remplacer capture</span>
          </button>
        </div>
      </div>

      {/* Image Preview & Capture Zone */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Capture de l’écran sélectionné
            </h3>
          </div>
          {screen.image && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenImageModal(screen.image!, screen.name)}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Agrandir</span>
              </button>
              <span className="text-slate-700">|</span>
              <button
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            </div>
          )}
        </div>

        {screen.image ? (
          <div className="relative group rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[360px]">
            <img
              src={screen.image}
              alt={screen.name}
              className="max-h-[360px] w-auto max-w-full object-contain cursor-zoom-in"
              onClick={() => onOpenImageModal(screen.image!, screen.name)}
            />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={() => onOpenImageModal(screen.image!, screen.name)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Voir en plein écran</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 shadow-md"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Changer l'image</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-8 text-center bg-slate-950/40 transition-colors flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              Aucune capture associée à cet écran
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1 mb-4">
              Capturez une fenêtre avec le navigateur, importez un fichier image ou collez directement une capture (Ctrl+V).
            </p>
            <div className="flex items-center gap-2.5 flex-wrap justify-center">
              <button
                onClick={onInitiateCapture}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capturer l'écran</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/70 text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importer un fichier image</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Structured Fields Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Fiche descriptive & Spécifications
          </h3>
          <span className="text-[11px] text-slate-500">
            Sauvegarde automatique en continu
          </span>
        </div>

        {FIELDS.map((field) => {
          const value = (screen[field.key] || '') as string;
          return (
            <div
              key={field.key}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 transition-all focus-within:border-indigo-600/70 focus-within:bg-slate-900"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-slate-200">
                    {field.label}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTooltip(activeTooltip === field.key ? null : field.key)
                    }
                    className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                    title={field.tooltip}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Snippets */}
                {field.key === 'controls' && (
                  <button
                    onClick={() =>
                      handleQuickInsert(
                        'controls',
                        '- Bouton [Action] (type: primaire, état: actif)\n- Champ [Nom] (type: texte, requis)'
                      )
                    }
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Modèle de contrôle</span>
                  </button>
                )}
                {field.key === 'observations' && (
                  <button
                    onClick={() =>
                      handleQuickInsert(
                        'observations',
                        '- Comportement en cas d’erreur :\n- Points d’interrogation / inconnues :'
                      )
                    }
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Modèle d'observations</span>
                  </button>
                )}
              </div>

              {activeTooltip === field.key && (
                <div className="mb-2 p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{field.tooltip}</span>
                </div>
              )}

              <textarea
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full text-xs font-normal leading-relaxed bg-slate-950 border border-slate-800/90 focus:border-indigo-500 rounded-lg p-3 text-slate-200 placeholder:text-slate-600 focus:outline-none resize-y min-h-[75px] transition-colors"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
