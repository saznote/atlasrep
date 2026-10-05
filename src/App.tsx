import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Camera,
  Layers,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { AtlasSession, ScreenItem } from './types';
import {
  loadSessions,
  saveSessions,
  getActiveSessionId,
  setActiveSessionId,
  createDefaultSession,
  exportSessionToAtlasJson,
  importAtlasJson,
} from './utils/storage';
import { downloadFile } from './utils/markdownGenerator';
import { Header } from './components/Header';
import { ScreenList } from './components/ScreenList';
import { ScreenEditor } from './components/ScreenEditor';
import { PromptViewer } from './components/PromptViewer';
import { StoryboardView } from './components/StoryboardView';
import { LaunchModal } from './components/LaunchModal';
import { CaptureModal } from './components/CaptureModal';
import { SessionModal } from './components/SessionModal';
import { ImageModal } from './components/ImageModal';
import { StatusBar } from './components/StatusBar';

export const App: React.FC = () => {
  const [sessions, setSessions] = useState<AtlasSession[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const saved = getActiveSessionId();
    const all = loadSessions();
    if (saved && all.some((s) => s.id === saved)) return saved;
    return all[0]?.id || '';
  });

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(() => {
    return currentSession?.screens[0]?.id || null;
  });

  const [activeTab, setActiveTab] = useState<'capture' | 'prompt' | 'storyboard'>('capture');
  const [statusText, setStatusText] = useState<string>(
    'Choisissez l’application, lancez-la, puis capturez les écrans.'
  );

  // Modals state
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [imageModalData, setImageModalData] = useState<{ src: string; title: string } | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Sync session changes to storage
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  // Keep active session ID stored
  useEffect(() => {
    if (currentSessionId) {
      setActiveSessionId(currentSessionId);
    }
  }, [currentSessionId]);

  // Keep selected screen valid
  useEffect(() => {
    if (!currentSession) return;
    if (
      !selectedScreenId ||
      !currentSession.screens.some((s) => s.id === selectedScreenId)
    ) {
      setSelectedScreenId(currentSession.screens[0]?.id || null);
    }
  }, [currentSession, selectedScreenId]);

  const updateCurrentSession = (updater: (prev: AtlasSession) => AtlasSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? updater(s) : s))
    );
  };

  const handleUpdateSessionMeta = (executable: string, args: string) => {
    updateCurrentSession((prev) => ({
      ...prev,
      executable,
      arguments: args,
      updatedAt: Date.now(),
    }));
  };

  const handleUpdateScreen = (updatedScreen: ScreenItem) => {
    updateCurrentSession((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      screens: prev.screens.map((s) => (s.id === updatedScreen.id ? updatedScreen : s)),
    }));
  };

  const handleAddBlankScreen = () => {
    const screenIndex = (currentSession?.screens.length || 0) + 1;
    const newScreen: ScreenItem = {
      id: `screen_${Date.now()}`,
      name: `Écran ${screenIndex}`,
      image: '',
      purpose: '',
      visual_description: '',
      controls: '',
      interactions: '',
      flow_notes: '',
      observations: '',
      createdAt: Date.now(),
    };

    updateCurrentSession((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      screens: [...prev.screens, newScreen],
    }));
    setSelectedScreenId(newScreen.id);
    setActiveTab('capture');
    setStatusText(`Nouvel écran ajouté : ${newScreen.name}`);
  };

  const handleConfirmCapture = (name: string, imageDataUrl: string, imageName: string) => {
    const newScreen: ScreenItem = {
      id: `screen_${Date.now()}`,
      name: name || `Écran ${(currentSession?.screens.length || 0) + 1}`,
      image: imageDataUrl,
      imageName: imageName,
      purpose: '',
      visual_description: '',
      controls: '',
      interactions: '',
      flow_notes: '',
      observations: '',
      createdAt: Date.now(),
    };

    updateCurrentSession((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      screens: [...prev.screens, newScreen],
    }));
    setSelectedScreenId(newScreen.id);
    setActiveTab('capture');
    setStatusText(`Capture enregistrée : ${newScreen.name}`);
  };

  const handleDeleteScreen = (id: string) => {
    const target = currentSession?.screens.find((s) => s.id === id);
    if (!target) return;
    if (!window.confirm(`Supprimer « ${target.name || 'Écran'} » et sa fiche ?`)) {
      return;
    }

    updateCurrentSession((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      screens: prev.screens.filter((s) => s.id !== id),
    }));

    if (selectedScreenId === id) {
      const remaining = currentSession.screens.filter((s) => s.id !== id);
      setSelectedScreenId(remaining[0]?.id || null);
    }
    setStatusText(`Écran « ${target.name} » supprimé.`);
  };

  const handleDuplicateScreen = (id: string) => {
    const target = currentSession?.screens.find((s) => s.id === id);
    if (!target) return;

    const duplicated: ScreenItem = {
      ...target,
      id: `screen_${Date.now()}`,
      name: `${target.name} (copie)`,
      createdAt: Date.now(),
    };

    const targetIndex = currentSession.screens.findIndex((s) => s.id === id);
    const newScreens = [...currentSession.screens];
    newScreens.splice(targetIndex + 1, 0, duplicated);

    updateCurrentSession((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      screens: newScreens,
    }));
    setSelectedScreenId(duplicated.id);
    setStatusText(`Fiche dupliquée : ${duplicated.name}`);
  };

  const handleMoveScreen = (id: string, direction: 'up' | 'down') => {
    if (!currentSession) return;
    const index = currentSession.screens.findIndex((s) => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentSession.screens.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedScreens = [...currentSession.screens];
    const [moved] = updatedScreens.splice(index, 1);
    updatedScreens.splice(targetIndex, 0, moved);

    updateCurrentSession((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      screens: updatedScreens,
    }));
  };

  // Session management handlers
  const handleCreateSession = (name: string) => {
    const newSess = createDefaultSession(name);
    setSessions((prev) => [newSess, ...prev]);
    setCurrentSessionId(newSess.id);
    setSelectedScreenId(newSess.screens[0]?.id || null);
    setStatusText(`Nouvelle session créée : ${newSess.name}`);
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      const next = sessions.find((s) => s.id !== id);
      if (next) {
        setCurrentSessionId(next.id);
        setSelectedScreenId(next.screens[0]?.id || null);
      }
    }
    setStatusText('Session supprimée.');
  };

  const handleRenameSession = (id: string, newName: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName, updatedAt: Date.now() } : s))
    );
    setStatusText(`Session renommée en « ${newName} »`);
  };

  const handleImportSession = (newSess: AtlasSession) => {
    setSessions((prev) => [newSess, ...prev]);
    setCurrentSessionId(newSess.id);
    setSelectedScreenId(newSess.screens[0]?.id || null);
    setStatusText(`Session importée : ${newSess.name}`);
  };

  const handleExportJson = () => {
    if (!currentSession) return;
    const json = exportSessionToAtlasJson(currentSession);
    const filename = `interface_atlas_${currentSession.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.json`;
    downloadFile(json, filename, 'application/json');
    setStatusText(`Session exportée dans ${filename}`);
  };

  const handleDirectImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importAtlasJson(text, file.name.replace(/\.[^/.]+$/, ''));
      handleImportSession(imported);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fichier non reconnu';
      setStatusText(`Erreur d'import : ${message}`);
    }
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const currentSelectedScreen =
    currentSession?.screens.find((s) => s.id === selectedScreenId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Hidden file input for header direct import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleDirectImportChange}
        className="hidden"
      />

      {/* Header bar */}
      {currentSession && (
        <Header
          session={currentSession}
          onUpdateSessionMeta={handleUpdateSessionMeta}
          onOpenNewSessionModal={() => setIsSessionModalOpen(true)}
          onOpenSessionManager={() => setIsSessionModalOpen(true)}
          onOpenLaunchModal={() => setIsLaunchModalOpen(true)}
          onInitiateCapture={() => setIsCaptureModalOpen(true)}
          onAddBlankScreen={handleAddBlankScreen}
          onExportJson={handleExportJson}
          onImportJsonClick={() => importInputRef.current?.click()}
        />
      )}

      {/* App Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: Tree/List of Screens */}
        {currentSession && (
          <ScreenList
            screens={currentSession.screens}
            selectedId={selectedScreenId}
            onSelectScreen={(id) => {
              setSelectedScreenId(id);
              if (activeTab === 'prompt') {
                // optionally stay on tab or show screen
              }
            }}
            onAddBlankScreen={handleAddBlankScreen}
            onInitiateCapture={() => setIsCaptureModalOpen(true)}
            onDeleteScreen={handleDeleteScreen}
            onDuplicateScreen={handleDuplicateScreen}
            onMoveScreen={handleMoveScreen}
          />
        )}

        {/* Right workspace: Navigation Tabs & Tab Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/30">
          {/* Tabs bar */}
          <div className="border-b border-slate-800 bg-slate-950/60 px-4 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('capture')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-colors ${
                  activeTab === 'capture'
                    ? 'bg-slate-900 border-slate-800 text-indigo-400 border-b-transparent shadow-xs'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture et description</span>
              </button>

              <button
                onClick={() => setActiveTab('prompt')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-colors ${
                  activeTab === 'prompt'
                    ? 'bg-slate-900 border-slate-800 text-indigo-400 border-b-transparent shadow-xs'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Prompt et plan</span>
              </button>

              <button
                onClick={() => setActiveTab('storyboard')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-colors ${
                  activeTab === 'storyboard'
                    ? 'bg-slate-900 border-slate-800 text-indigo-400 border-b-transparent shadow-xs'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Storyboard & Galerie</span>
              </button>
            </div>

            {currentSelectedScreen && activeTab === 'capture' && (
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-xs hidden md:inline">
                Édition : <strong className="text-slate-200">{currentSelectedScreen.name}</strong>
              </span>
            )}
          </div>

          {/* Active Tab View */}
          <div className="flex-1 flex overflow-hidden">
            {activeTab === 'capture' && (
              <ScreenEditor
                screen={currentSelectedScreen}
                onUpdateScreen={handleUpdateScreen}
                onInitiateCapture={() => setIsCaptureModalOpen(true)}
                onOpenImageModal={(src, title) => setImageModalData({ src, title })}
                onNotify={(msg) => setStatusText(msg)}
              />
            )}

            {activeTab === 'prompt' && currentSession && (
              <PromptViewer
                session={currentSession}
                onNotify={(msg) => setStatusText(msg)}
              />
            )}

            {activeTab === 'storyboard' && currentSession && (
              <StoryboardView
                session={currentSession}
                onSelectScreen={(id) => {
                  setSelectedScreenId(id);
                  setActiveTab('capture');
                }}
                onOpenImageModal={(src, title) => setImageModalData({ src, title })}
                onInitiateCapture={() => setIsCaptureModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Status Bar */}
      {currentSession && (
        <StatusBar
          statusText={statusText}
          sessionName={currentSession.name}
          totalScreens={currentSession.screens.length}
          activeScreenName={currentSelectedScreen?.name}
        />
      )}

      {/* Modals */}
      {currentSession && (
        <LaunchModal
          session={currentSession}
          isOpen={isLaunchModalOpen}
          onClose={() => setIsLaunchModalOpen(false)}
          onLaunched={(msg) => setStatusText(msg)}
        />
      )}

      <CaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onConfirmCapture={handleConfirmCapture}
        defaultName={
          currentSelectedScreen && !currentSelectedScreen.image
            ? currentSelectedScreen.name
            : `Écran ${(currentSession?.screens.length || 0) + 1}`
        }
        onNotify={(msg) => setStatusText(msg)}
      />

      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onImportSession={handleImportSession}
        onNotify={(msg) => setStatusText(msg)}
      />

      <ImageModal
        isOpen={Boolean(imageModalData)}
        onClose={() => setImageModalData(null)}
        imageSrc={imageModalData?.src || ''}
        title={imageModalData?.title || 'Capture d’écran'}
      />
    </div>
  );
};
