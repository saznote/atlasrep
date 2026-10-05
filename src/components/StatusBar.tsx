import React from 'react';
import { Info, CheckCircle2, Layers } from 'lucide-react';

interface StatusBarProps {
  statusText: string;
  sessionName: string;
  totalScreens: number;
  activeScreenName?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  statusText,
  sessionName,
  totalScreens,
  activeScreenName,
}) => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0">
      <div className="flex items-center gap-2 truncate max-w-xl">
        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span className="truncate text-slate-300 font-medium">
          {statusText || 'Choisissez l’application, lancez-la, puis capturez les écrans.'}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-slate-500 font-mono text-[10px]">
        {activeScreenName && (
          <span className="hidden md:inline truncate max-w-[150px] text-slate-400">
            Écran : {activeScreenName}
          </span>
        )}
        <span className="hidden sm:inline">|</span>
        <span className="flex items-center gap-1 text-slate-400">
          <Layers className="w-3 h-3 text-indigo-400" />
          <span>{totalScreens} écrans</span>
        </span>
        <span className="hidden sm:inline">|</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Session : {sessionName}</span>
        </span>
      </div>
    </footer>
  );
};
