import React, { useState } from 'react';
import {
  Check,
  Search,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Monitor,
  Camera,
} from 'lucide-react';
import { ScreenItem } from '../types';

interface ScreenListProps {
  screens: ScreenItem[];
  selectedId: string | null;
  onSelectScreen: (id: string) => void;
  onAddBlankScreen: () => void;
  onInitiateCapture: () => void;
  onDeleteScreen: (id: string) => void;
  onDuplicateScreen: (id: string) => void;
  onMoveScreen: (id: string, direction: 'up' | 'down') => void;
}

export const ScreenList: React.FC<ScreenListProps> = ({
  screens,
  selectedId,
  onSelectScreen,
  onAddBlankScreen,
  onInitiateCapture,
  onDeleteScreen,
  onDuplicateScreen,
  onMoveScreen,
}) => {
  const [search, setSearch] = useState('');

  const filteredScreens = screens.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.purpose.toLowerCase().includes(q) ||
      s.visual_description.toLowerCase().includes(q)
    );
  });

  return (
    <aside className="w-80 shrink-0 border-r border-slate-800 bg-slate-900/60 flex flex-col h-full select-none">
      {/* List Header */}
      <div className="p-3 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Écrans capturés
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
            {screens.length} {screens.length > 1 ? 'écrans' : 'écran'}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer les écrans…"
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Screen Tree / List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 focus:outline-none">
        {filteredScreens.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 h-40">
            {search ? (
              <p>Aucun écran ne correspond à « {search} ».</p>
            ) : (
              <>
                <p>Aucun écran enregistré.</p>
                <button
                  onClick={onInitiateCapture}
                  className="mt-1 text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  Effectuer une première capture
                </button>
              </>
            )}
          </div>
        ) : (
          filteredScreens.map((screen, index) => {
            const isSelected = screen.id === selectedId;
            const originalIndex = screens.findIndex((s) => s.id === screen.id);
            const hasImage = Boolean(screen.image);

            return (
              <div
                key={screen.id}
                onClick={() => onSelectScreen(screen.id)}
                className={`group relative flex items-start gap-2.5 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-600/70 text-white shadow-sm shadow-indigo-950/50'
                    : 'bg-slate-950/40 hover:bg-slate-800/50 border-slate-800/70 text-slate-300'
                }`}
              >
                {/* Index / Thumbnail */}
                <div className="relative shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/60 flex items-center justify-center mt-0.5">
                  {hasImage ? (
                    <img
                      src={screen.image}
                      alt={screen.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      #{originalIndex + 1}
                    </span>
                  )}
                  {hasImage && (
                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-semibold truncate leading-tight">
                      <span className="text-slate-500 font-normal mr-1">
                        {originalIndex + 1}.
                      </span>
                      {screen.name || 'Écran sans nom'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {screen.purpose || 'Aucun objectif spécifié'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                    <span className="inline-flex items-center gap-1">
                      {hasImage ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <ImageIcon className="w-2.5 h-2.5" /> Image
                        </span>
                      ) : (
                        <span className="text-slate-600">— sans image</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Hover / Active Actions */}
                <div
                  className={`flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isSelected ? 'opacity-100' : ''
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onMoveScreen(screen.id, 'up')}
                      disabled={originalIndex === 0}
                      title="Monter"
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700/60"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onMoveScreen(screen.id, 'down')}
                      disabled={originalIndex === screens.length - 1}
                      title="Descendre"
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700/60"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onDuplicateScreen(screen.id)}
                      title="Dupliquer la fiche"
                      className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-700/60"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteScreen(screen.id)}
                      title="Supprimer l’écran"
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/60"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer buttons */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 space-y-1.5">
        <button
          onClick={onInitiateCapture}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Capturer un écran</span>
        </button>

        <button
          onClick={onAddBlankScreen}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter sans capture</span>
        </button>
      </div>
    </aside>
  );
};
