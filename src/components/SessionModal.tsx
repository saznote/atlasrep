import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  FolderPlus,
  Trash2,
  Edit2,
  Copy,
  Download,
  Upload,
  X,
  Check,
  Calendar,
} from 'lucide-react';
import { AtlasSession } from '../types';
import { exportSessionToAtlasJson, importAtlasJson, downloadFile } from '../utils/markdownGenerator';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AtlasSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: (name: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newName: string) => void;
  onImportSession: (session: AtlasSession) => void;
  onNotify: (msg: string) => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onImportSession,
  onNotify,
}) => {
  const [newSessionName, setNewSessionName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    onCreateSession(newSessionName.trim());
    setNewSessionName('');
    onClose();
  };

  const startRename = (session: AtlasSession) => {
    setEditingId(session.id);
    setEditNameValue(session.name);
  };

  const saveRename = (id: string) => {
    if (editNameValue.trim()) {
      onRenameSession(id, editNameValue.trim());
    }
    setEditingId(null);
  };

  const handleExport = (session: AtlasSession) => {
    const json = exportSessionToAtlasJson(session);
    const filename = `interface_atlas_${session.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.json`;
    downloadFile(json, filename, 'application/json');
    onNotify(`Session exportée : ${filename}`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importAtlasJson(text, file.name.replace(/\.[^/.]+$/, ''));
      onImportSession(imported);
      onNotify(`Session importée avec succès (${imported.screens.length} écrans).`);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Format JSON invalide';
      onNotify(`Erreur d’import JSON : ${message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Gestion des sessions</h3>
            <p className="text-xs text-slate-400">
              Ouvrez, créez, renommez ou exportez vos dossiers de cartographie
            </p>
          </div>
        </div>

        {/* Create new session form */}
        <form onSubmit={handleCreate} className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="Nom de la nouvelle session..."
            className="flex-1 text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Créer</span>
          </button>
        </form>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sessions.map((sess) => {
            const isCurrent = sess.id === currentSessionId;
            const isEditing = editingId === sess.id;

            return (
              <div
                key={sess.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-indigo-950/30 border-indigo-500/60 text-white'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        autoFocus
                        className="text-xs bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-white focus:outline-none"
                      />
                      <button
                        onClick={() => saveRename(sess.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold truncate">{sess.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-600 text-white font-medium">
                          Actif
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                    <span>{sess.screens.length} écrans</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(sess.updatedAt || sess.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{sess.executable || 'sans exécutable'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isCurrent && (
                    <button
                      onClick={() => {
                        onSelectSession(sess.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      Ouvrir
                    </button>
                  )}

                  <button
                    onClick={() => startRename(sess)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Renommer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleExport(sess)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800"
                    title="Exporter JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {sessions.length > 1 && (
                    <button
                      onClick={() => onDeleteSession(sess.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                      title="Supprimer la session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with import option */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importer interface_atlas.json</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
