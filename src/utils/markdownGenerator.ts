import { AtlasSession, FIELDS } from '../types';

export function generatePromptMarkdown(session: AtlasSession): string {
  const screens = session.screens || [];
  const lines: string[] = [
    '# Prompt de reconstruction d’interface',
    '',
    '## Mission',
    'Construire une application qui reproduit l’interface et les comportements décrits ci-dessous. ' +
      'Utiliser les captures comme références visuelles. Ne pas inventer les éléments marqués comme inconnus; ' +
      'les signaler comme questions à résoudre.',
    '',
    '## Application de référence',
    `- Exécutable / Cible observé : ${session.executable.trim() || 'non renseigné'}`,
    `- Arguments : ${session.arguments.trim() || 'aucun'}`,
    `- Session : ${session.name || 'Session'}`,
    `- Date de cartographie : ${new Date(session.updatedAt || session.createdAt).toLocaleString('fr-FR')}`,
    `- Nombre d’écrans cartographiés : ${screens.length}`,
    '',
    '## Écrans et comportements observés',
  ];

  if (screens.length === 0) {
    lines.push('Aucun écran n’a encore été décrit.');
  } else {
    screens.forEach((item, index) => {
      lines.push('');
      lines.push(`### ${index + 1}. ${item.name.trim() || 'Écran sans nom'}`);
      if (item.imageName || item.image) {
        lines.push(`- Capture de référence : \`${item.imageName || `screen_${index + 1}.png`}\``);
      }
      for (const field of FIELDS) {
        const val = (item[field.key] || '').trim();
        lines.push(`- **${field.label} :** ${val || 'À documenter / non observé.'}`);
      }
    });
  }

  lines.push(
    '',
    '## Exigences de réalisation',
    '- Reproduire la hiérarchie, les espacements, la typographie, les couleurs, les icônes et les états visibles dans les captures.',
    '- Implémenter les contrôles et transitions décrits; conserver les libellés observés.',
    '- Prévoir les états de chargement, vide, erreur, validation et succès lorsqu’ils sont documentés.',
    '- Séparer les composants réutilisables des écrans et rendre l’interface accessible au clavier.',
    '- Documenter explicitement les décisions prises pour les informations manquantes.',
    '',
    '## Plan de travail de développement',
    '1. **Consolider les exigences** — compléter les inconnues et confirmer les parcours observés.',
    '2. **Poser la structure** — choisir la pile technique, définir les routes, le modèle de données et les composants partagés.',
    '3. **Construire les écrans** — implémenter chaque écran décrit et rapprocher le rendu des captures.',
    '4. **Relier les interactions** — réaliser formulaires, contrôles, validations et transitions documentés.',
    '5. **Vérifier** — comparer chaque écran aux captures, tester les chemins heureux et les cas d’erreur relevés, corriger les écarts.',
    '6. **Livrer** — fournir instructions de lancement, limites connues et liste des hypothèses restant à valider.',
    '',
    '## Règle de fidélité',
    'Distinguer les faits observés des hypothèses. Si une capture ou une description ne permet pas de trancher, ' +
      'ne pas présenter une supposition comme un comportement confirmé.'
  );

  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/markdown') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
