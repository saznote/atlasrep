export interface ScreenItem {
  id: string;
  name: string;
  image?: string; // Data URL or URL path
  imageName?: string;
  purpose: string;
  visual_description: string;
  controls: string;
  interactions: string;
  flow_notes: string;
  observations: string;
  createdAt: number;
}

export interface AtlasSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  executable: string;
  arguments: string;
  screens: ScreenItem[];
}

export interface FieldDefinition {
  key: keyof Pick<
    ScreenItem,
    | 'purpose'
    | 'visual_description'
    | 'controls'
    | 'interactions'
    | 'flow_notes'
    | 'observations'
  >;
  label: string;
  placeholder: string;
  tooltip: string;
}

export const FIELDS: FieldDefinition[] = [
  {
    key: 'purpose',
    label: 'Objectif de l’écran',
    placeholder: 'Ex: Permettre à l’utilisateur de configurer ses identifiants de session et choisir le dossier cible...',
    tooltip: 'Rôle fonctionnel principal de cet écran dans le flux applicatif.',
  },
  {
    key: 'visual_description',
    label: 'Description visuelle détaillée',
    placeholder: 'Ex: En-tête sombre avec logo à gauche, corps divisé en 2 colonnes avec formulaire gris clair...',
    tooltip: 'Disposition, palette de couleurs, typographie, espacements et structure générale.',
  },
  {
    key: 'controls',
    label: 'Éléments et contrôles (libellé, type, état)',
    placeholder: 'Ex:\n- Bouton "Lancer" (primaire, actif)\n- Champ "Exécutable" (texte, requis, validé)\n- Sélecteur déroulant "Environnement" (sélectionné: Production)',
    tooltip: 'Inventaire des boutons, champs, cases à cocher, tableaux avec leurs libellés exacts.',
  },
  {
    key: 'interactions',
    label: 'Actions possibles et résultats observés',
    placeholder: 'Ex:\n- Clic sur "Parcourir" ouvre le sélecteur de fichier de l’OS.\n- La touche Entrée dans le champ valide et lance la capture.\n- Survol du bouton affiche un infobulle.',
    tooltip: 'Comportements interactifs observés lors des clics, raccourcis ou saisies.',
  },
  {
    key: 'flow_notes',
    label: 'Écran précédent / suivant et conditions',
    placeholder: 'Ex: Précédent: Écran d’accueil. Suivant: Tableau de bord après validation des identifiants.',
    tooltip: 'Navigation entrante et sortante, embranchements conditionnels.',
  },
  {
    key: 'observations',
    label: 'États, validations, erreurs, responsive, inconnues',
    placeholder: 'Ex:\n- Si le champ est vide, bordure rouge avec texte "Champ obligatoire".\n- Inconnue : comportement si la connexion réseau est coupée.',
    tooltip: 'Cas limites, alertes, comportement au redimensionnement et questions en suspens.',
  },
];
