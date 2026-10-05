import React from 'react';
import {
  ArrowRight,
  Monitor,
  Camera,
  Layers,
  ZoomIn,
  Sparkles,
} from 'lucide-react';
import { AtlasSession } from '../types';

interface StoryboardViewProps {
  session: AtlasSession;
  onSelectScreen: (id: string) => void;
  onOpenImageModal: (imageSrc: string, title: string) => void;
  onInitiateCapture: () => void;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  session,
  onSelectScreen,
  onOpenImageModal,
  onInitiateCapture,
}) => {
  const screens = session.screens;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* Overview header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Storyboard & Cartographie de navigation
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualisez le flux complet des écrans, les transitions et les dépendances entre vues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onInitiateCapture}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Ajouter une capture</span>
          </button>
        </div>
      </div>

      {screens.length === 0 ? (
        <div className="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <Monitor className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">Aucun écran dans ce storyboard</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Capturez votre premier écran ou importez une session pour voir l’organigramme.
          </p>
          <button
            onClick={onInitiateCapture}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Commencer la capture
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {screens.map((screen, index) => {
            return (
              <div
                key={screen.id}
                className="group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer"
                onClick={() => onSelectScreen(screen.id)}
              >
                {/* Thumbnail area */}
                <div className="relative h-44 bg-slate-950 border-b border-slate-800 flex items-center justify-center overflow-hidden">
                  {screen.image ? (
                    <>
                      <img
                        src={screen.image}
                        alt={screen.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenImageModal(screen.image!, screen.name);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-slate-950/80 hover:bg-indigo-600 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                        title="Agrandir la capture"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600">
                      <Monitor className="w-8 h-8 mb-1.5 opacity-40" />
                      <span className="text-[11px]">Sans image</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-[10px] font-mono text-indigo-300 border border-slate-800">
                    Étape #{index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {screen.name || 'Écran sans nom'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {screen.purpose || 'Aucun objectif décrit pour cet écran.'}
                    </p>
                  </div>

                  {/* Flow footer */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-[10px]">
                    <div className="flex items-start gap-1.5 text-slate-400">
                      <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1 font-mono text-slate-300">
                        {screen.flow_notes || 'Flux séquentiel standard'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
