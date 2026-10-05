import { AtlasSession, ScreenItem } from '../types';

const STORAGE_KEY = 'interface_atlas_sessions';
const ACTIVE_SESSION_ID_KEY = 'interface_atlas_active_id';

const INITIAL_DEMO_SCREEN: ScreenItem = {
  id: 'screen_initial_acceuil',
  name: 'Écran d’accueil — Interface Atlas',
  image: '/acceuil.png',
  imageName: 'acceuil.png',
  purpose:
    'Point d’entrée de l’application pour sélectionner une session, spécifier le chemin de l’exécutable cible et piloter les captures.',
  visual_description:
    'Barre supérieure compacte avec champs de session et bouton "Lancer". Deux volets principaux : arborescence des écrans à gauche et onglets d’édition/prompt à droite. Barre d’état inférieure.',
  controls:
    '- Bouton "Nouvelle session" (en-tête haut droit)\n- Bouton "Ouvrir session" (en-tête haut droit)\n- Champ "Exécutable" avec bouton "Parcourir…"\n- Champ "Arguments"\n- Bouton "Lancer"\n- Bouton "Capturer l’écran"\n- Arborescence "Écrans capturés" avec boutons "Ajouter sans capture" et "Supprimer l’écran"',
  interactions:
    '- Clic sur "Lancer" vérifie le chemin et démarre le processus en arrière-plan.\n- Clic sur "Capturer l’écran" invite à nommer l’écran, réduit brièvement la fenêtre et capture l’écran cible.\n- Clic sur un écran dans l’arborescence charge sa fiche technique.',
  flow_notes:
    'Écran principal actif en permanence pendant la session de documentation. Chaque capture génère une nouvelle fiche associée.',
  observations:
    '- Gestion des permissions Wayland requise sous Linux.\n- Enregistrement automatique sans nécessité d’action explicite.',
  createdAt: Date.now() - 3600000,
};

export function createDefaultSession(name?: string): AtlasSession {
  const stamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 15);
  return {
    id: `session_${Date.now()}`,
    name: name || `Session_${stamp}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    executable: 'InterfaceAtlas.exe',
    arguments: '--session default',
    screens: [INITIAL_DEMO_SCREEN],
  };
}

export function loadSessions(): AtlasSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = [createDefaultSession('Session_Demo_InterfaceAtlas')];
      saveSessions(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse stored sessions:', err);
  }
  const fallback = [createDefaultSession('Session_Demo_InterfaceAtlas')];
  saveSessions(fallback);
  return fallback;
}

export function saveSessions(sessions: AtlasSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('LocalStorage save failed, might exceed quota with high-res captures:', err);
  }
}

export function getActiveSessionId(): string {
  return localStorage.getItem(ACTIVE_SESSION_ID_KEY) || '';
}

export function setActiveSessionId(id: string): void {
  localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
}

/**
 * Converts session to the exact original interface_atlas.json format:
 * { "executable": "...", "arguments": "...", "screens": [...] }
 */
export function exportSessionToAtlasJson(session: AtlasSession): string {
  const legacyFormat = {
    executable: session.executable || '',
    arguments: session.arguments || '',
    screens: session.screens.map((s) => ({
      id: s.id,
      name: s.name,
      image: s.imageName || (s.image ? `${s.id}.png` : ''),
      purpose: s.purpose || '',
      visual_description: s.visual_description || '',
      controls: s.controls || '',
      interactions: s.interactions || '',
      flow_notes: s.flow_notes || '',
      observations: s.observations || '',
    })),
  };
  return JSON.stringify(legacyFormat, null, 2);
}

export function importAtlasJson(jsonString: string, sessionName: string): AtlasSession {
  const parsed = JSON.parse(jsonString);
  const screens: ScreenItem[] = [];

  if (Array.isArray(parsed.screens)) {
    parsed.screens.forEach((item: Record<string, string>, index: number) => {
      screens.push({
        id: item.id || `screen_${Date.now()}_${index}`,
        name: item.name || `Écran ${index + 1}`,
        image: item.image || '',
        imageName: item.image || '',
        purpose: item.purpose || '',
        visual_description: item.visual_description || '',
        controls: item.controls || '',
        interactions: item.interactions || '',
        flow_notes: item.flow_notes || '',
        observations: item.observations || '',
        createdAt: Date.now() - index * 1000,
      });
    });
  }

  return {
    id: `session_${Date.now()}`,
    name: sessionName || `Import_${new Date().toLocaleDateString('fr-FR')}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    executable: parsed.executable || '',
    arguments: parsed.arguments || '',
    screens,
  };
}
