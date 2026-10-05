# Interface Atlas

Compagnon de bureau local pour documenter une application Windows ou Linux :

- choisit et lance un exécutable sur votre ordinateur;
- vous laisse parcourir l’application vous-même;
- capture le bureau à la demande et rattache chaque capture à une fiche d’écran;
- enregistre les descriptions, contrôles, interactions et transitions;
- génère un prompt de reconstruction et un plan de développement en Markdown.

## Installation

Python 3.10 ou supérieur est requis. Depuis ce dossier, ouvrez un terminal et exécutez :

```bash
python -m pip install -r requirements.txt
python interface_atlas.py
```

Sur certains Linux, remplacez `python` par `python3`. Tkinter doit aussi être installé
(souvent fourni avec Python; sur Debian/Ubuntu, le paquet système est `python3-tk`).

## Utilisation

1. Choisissez l’exécutable à analyser et cliquez sur **Lancer**.
2. Parcourez l’application de référence comme vous le feriez normalement.
3. Revenez à Interface Atlas et cliquez sur **Capturer l’écran**. Donnez un nom à l’écran;
   la fenêtre se réduit pendant la capture afin de photographier l’application cible.
4. Décrivez l’objectif, les éléments visibles, les actions et les transitions. Les fiches
   sont enregistrées automatiquement dans le dossier de session.
5. Cliquez sur **Générer le prompt et le plan**, puis exportez le Markdown. Les images
   restent dans le sous-dossier `captures`.

Les captures sont enregistrées localement; aucune image ni description n’est téléversée.
La navigation reste manuelle : l’outil ne clique pas dans une application inconnue et ne
peut pas garantir qu’il a découvert tous ses écrans. Le prompt est assemblé à partir des
observations saisies; ce n’est pas une analyse visuelle automatique par modèle IA.

## Notes de compatibilité

- **Windows :** sélectionner le fichier `.exe`.
- **Linux :** sélectionner un binaire exécutable ou un AppImage. Pour un AppImage, il doit
  avoir le droit d’exécution.
- Certaines sessions Linux sous Wayland restreignent la capture globale du bureau. Si la
  capture échoue, autorisez-la dans l’environnement de bureau ou essayez une session X11.
- Des arguments de lancement optionnels peuvent être saisis dans le champ **Arguments**.

Les fichiers de session sont `interface_atlas.json` et `captures/`. Conservez le dossier
complet pour rouvrir ou partager la cartographie.

## Créer une version distribuable

La compilation doit se faire **sur le système cible** : PyInstaller ne produit pas
fiablement un exécutable Windows depuis Linux, ni un binaire Linux depuis Windows.
Une connexion Internet est nécessaire la première fois pour installer les outils de build.

### Windows

1. Installez Python 3.10+ et Inno Setup 6.
2. Double-cliquez sur `build_windows.bat` (ou lancez-le depuis l’invite de commandes).
3. Le dossier portable sera créé sous `dist/InterfaceAtlas/`. Si Inno Setup est installé,
   l’installateur par utilisateur sera `dist/InterfaceAtlas-Setup.exe`.

Si Inno Setup n’est pas présent, le script crée quand même l’application portable et affiche
où récupérer l’installateur requis.

### Linux (Ubuntu, Debian, openKylin 3.0)

openKylin utilise APT et des paquets `.deb`, donc le même script Linux convient. Le service
de build openKylin publie aussi son propre paquet `apt`.

Sur Ubuntu/Debian/openKylin, installez d’abord Python, Tkinter et les outils de paquet :

```bash
sudo apt update
sudo apt install python3 python3-tk python3-venv dpkg-dev
```

Vérifiez que `python3` est en version 3.10 ou supérieure et que `python3-tk` existe dans
vos sources avec `apt-cache policy python3-tk`. Si plusieurs versions de Python sont
installées, Tkinter doit correspondre à l’interpréteur utilisé.

```bash
chmod +x build_linux.sh
./build_linux.sh
```

Le script crée `dist/InterfaceAtlas/` et une archive `.tar.gz`. Si `dpkg-deb` est installé,
il crée également un paquet `.deb` adapté à l’architecture de la machine de compilation.
Installez-le avec `sudo apt install ./dist/interface-atlas_*.deb`.
La compilation n’inclut pas les bibliothèques système de l’OS; une distribution Linux
compatible avec la machine de build est recommandée.

Les répertoires `.venv-build/`, `build/` et `dist/` contiennent des fichiers générés par la
compilation et ne doivent pas être inclus dans l’archive source.
