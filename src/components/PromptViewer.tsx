import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Download,
  Check,
  RefreshCw,
  Code2,
  Eye,
  Sparkles,
} from 'lucide-react';
import { AtlasSession } from '../types';
import { generatePromptMarkdown, downloadFile } from '../utils/markdownGenerator';

interface PromptViewerProps {
  session: AtlasSession;
  onNotify: (msg: string) => void;
}

export const PromptViewer: React.FC<PromptViewerProps> = ({ session, onNotify }) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'raw'>('preview');
  const [customMarkdown, setCustomMarkdown] = useState<string | null>(null);

  const markdown = customMarkdown !== null ? customMarkdown : generatePromptMarkdown(session);

  const handleRegenerate = () => {
    setCustomMarkdown(null);
    onNotify('Prompt et plan régénérés à partir des notes de session.');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      onNotify('Prompt copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify('Erreur de copie dans le presse-papier.');
    }
  };

  const handleExport = () => {
    const filename = `prompt_clone_et_plan_${session.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.md`;
    downloadFile(markdown, filename, 'text/markdown');
    onNotify(`Fichier ${filename} téléchargé.`);
  };

  // Basic markdown render helper
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-800">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-indigo-400 mt-6 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-semibold text-slate-200 mt-4 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ')) {
        const itemContent = line.replace('- ', '');
        // bold formatting
        const parts = itemContent.split(/(\*\*.*?\*\*|`.*?`)/g);
        return (
          <li key={idx} className="text-xs text-slate-300 ml-4 list-disc my-1">
            {parts.map((p, i) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return (
                  <strong key={i} className="text-white font-semibold">
                    {p.slice(2, -2)}
                  </strong>
                );
              }
              if (p.startsWith('`') && p.endsWith('`')) {
                return (
                  <code key={i} className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded text-[11px] font-mono">
                    {p.slice(1, -1)}
                  </code>
                );
              }
              return p;
            })}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="text-xs text-slate-300 ml-4 my-1 flex items-start gap-2">
            <span className="font-mono text-indigo-400 font-semibold">{line.slice(0, line.indexOf('.') + 1)}</span>
            <span>{line.slice(line.indexOf('.') + 1).trim()}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-300 my-1 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden max-w-5xl mx-auto w-full p-4 md:p-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Prompt de reconstruction & Plan d’action
            </h2>
            <p className="text-[11px] text-slate-400">
              Généré fidèlement d’après les {session.screens.length} écrans documentés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveView('preview')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeView === 'preview'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu</span>
            </button>
            <button
              onClick={() => setActiveView('raw')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeView === 'raw'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Markdown brut</span>
            </button>
          </div>

          <button
            onClick={handleRegenerate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            title="Régénérer depuis les fiches de session"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Régénérer</span>
          </button>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié !' : 'Copier le prompt'}</span>
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter en .md</span>
          </button>
        </div>
      </div>

      {/* Editor / Display panel */}
      <div className="flex-1 overflow-hidden bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col">
        {activeView === 'preview' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-1">
            {renderFormattedMarkdown(markdown)}
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4">
            <textarea
              value={markdown}
              onChange={(e) => setCustomMarkdown(e.target.value)}
              className="flex-1 w-full bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-lg border border-slate-800 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  );
};
