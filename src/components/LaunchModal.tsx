import React, { useState } from 'react';
import {
  Play,
  Terminal,
  ExternalLink,
  X,
  CheckCircle2,
  Copy,
  Info,
} from 'lucide-react';
import { AtlasSession } from '../types';

interface LaunchModalProps {
  session: AtlasSession;
  isOpen: boolean;
  onClose: () => void;
  onLaunched: (msg: string) => void;
}

export const LaunchModal: React.FC<LaunchModalProps> = ({
  session,
  isOpen,
  onClose,
  onLaunched,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [simulatedPid, setSimulatedPid] = useState<number | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const isWebUrl = session.executable.startsWith('http://') || session.executable.startsWith('https://');
  const commandLine = `${session.executable || 'mon_application.exe'} ${session.arguments || ''}`.trim();

  const handleSimulateLaunch = () => {
    const pid = Math.floor(Math.random() * 8000) + 1200;
    setSimulatedPid(pid);
    setIsRunning(true);
    onLaunched(`Programme lancé (PID ${pid}). Parcourez-le, puis capturez chaque écran.`);
  };

  const handleStop = () => {
    setIsRunning(false);
    setSimulatedPid(null);
    onLaunched('Programme arrêté.');
  };

  const handleOpenWeb = () => {
    if (isWebUrl) {
      window.open(session.executable, '_blank');
      onLaunched(`Application web ouverte dans un nouvel onglet : ${session.executable}`);
    }
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(commandLine);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Lancer l’application cible</h3>
            <p className="text-xs text-slate-400">
              Préparez le programme de référence avant de réaliser les captures
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Status banner */}
          {isRunning ? (
            <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">
                  Processus actif simulé (PID {simulatedPid})
                </p>
                <p className="text-emerald-400/80 text-[11px] mt-0.5">
                  L’application est prête. Vous pouvez basculer dessus, explorer ses fenêtres, puis cliquer sur « Capturer l’écran ».
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-slate-300">
              <div className="flex items-center gap-2 font-mono text-[11px] text-indigo-300 mb-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Ligne de commande à exécuter localement :</span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-200">
                <code className="truncate">{commandLine}</code>
                <button
                  onClick={handleCopyCommand}
                  className="text-slate-400 hover:text-white transition-colors shrink-0"
                  title="Copier la commande"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {copiedCmd && <span className="text-[10px] text-emerald-400 mt-1 block">Commande copiée !</span>}
            </div>
          )}

          {/* Web target shortcut if applicable */}
          {isWebUrl && (
            <div className="bg-indigo-950/30 border border-indigo-700/30 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-indigo-300">Cible web détectée</p>
                <p className="text-slate-400 text-[11px] truncate max-w-xs">{session.executable}</p>
              </div>
              <button
                onClick={handleOpenWeb}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                <span>Ouvrir l’URL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Dans l’environnement Web AI Studio, ouvrez votre application locale sur votre poste. L’outil de capture vous permettra ensuite de sélectionner la fenêtre de votre application pour la photographier directement.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            >
              Arrêter le suivi
            </button>
          ) : (
            <button
              onClick={handleSimulateLaunch}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Démarrer la session de test</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
