import React from 'react';
import {
  FolderPlus,
  FolderOpen,
  Play,
  Camera,
  Plus,
  FileCode2,
  Download,
  Upload,
  Layers,
} from 'lucide-react';
import { AtlasSession } from '../types';

interface HeaderProps {
  session: AtlasSession;
  onUpdateSessionMeta: (executable: string, args: string) => void;
  onOpenNewSessionModal: () => void;
  onOpenSessionManager: () => void;
  onOpenLaunchModal: () => void;
  onInitiateCapture: () => void;
  onAddBlankScreen: () => void;
  onExportJson: () => void;
  onImportJsonClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onUpdateSessionMeta,
  onOpenNewSessionModal,
  onOpenSessionManager,
  onOpenLaunchModal,
  onInitiateCapture,
  onAddBlankScreen,
  onExportJson,
  onImportJsonClick,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 py-2.5 shadow-sm">
      <div className="flex flex-col gap-2.5">
        {/* Top line: Brand & Sessions */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-slate-100 text-sm tracking-tight">
                  Interface Atlas
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                  v1.2 Web Companion
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Cartographie d’interfaces, documentation d’écrans & génération de prompts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
              <span className="text-slate-500 mr-1.5 font-medium">Session :</span>
              <span className="font-semibold text-indigo-400 max-w-[140px] truncate" title={session.name}>
                {session.name}
              </span>
            </div>

            <button
              onClick={onOpenNewSessionModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 transition-colors"
              title="Créer une nouvelle session de cartographie"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Nouvelle session</span>
            </button>

            <button
              onClick={onOpenSessionManager}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 transition-colors"
              title="Ouvrir ou changer de session"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Ouvrir session</span>
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="Exporter le fichier interface_atlas.json"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">JSON</span>
            </button>

            <button
              onClick={onImportJsonClick}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="Importer un fichier interface_atlas.json"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Importer</span>
            </button>
          </div>
        </div>

        {/* Second line: App target, Arguments & Launch / Capture bar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap pl-1.5">
              Exécutable / Cible :
            </span>
            <input
              type="text"
              value={session.executable}
              onChange={(e) => onUpdateSessionMeta(e.target.value, session.arguments)}
              placeholder="ex: InterfaceAtlas.exe, Spotify, https://app.example.com"
              className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-2.5 py-1.5 text-slate-200 placeholder:text-slate-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-[150px] max-w-[260px]">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Arguments :
            </span>
            <input
              type="text"
              value={session.arguments}
              onChange={(e) => onUpdateSessionMeta(session.executable, e.target.value)}
              placeholder="ex: --session test -v"
              className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-2 py-1.5 text-slate-200 placeholder:text-slate-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenLaunchModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/30 transition-all active:scale-95"
              title="Lancer ou simuler l'application cible"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Lancer</span>
            </button>

            <button
              onClick={onInitiateCapture}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-700/30 transition-all active:scale-95"
              title="Capturer une fenêtre ou tout l'écran"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capturer l’écran</span>
            </button>

            <button
              onClick={onAddBlankScreen}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
              title="Ajouter une fiche d'écran vide sans capture"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Ajouter sans capture</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
