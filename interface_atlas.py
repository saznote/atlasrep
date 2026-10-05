#!/usr/bin/env python3
"""Interface Atlas: local screen-capture and interface-mapping companion."""

from __future__ import annotations

import json
import os
import shlex
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk

try:
    import mss
    from PIL import Image, ImageTk
except ImportError as exc:
    raise SystemExit(
        "Dépendances manquantes. Installez-les avec : "
        f"{sys.executable} -m pip install -r requirements.txt"
    ) from exc


FIELDS = [
    ("purpose", "Objectif de l’écran"),
    ("visual_description", "Description visuelle détaillée"),
    ("controls", "Éléments et contrôles (libellé, type, état)"),
    ("interactions", "Actions possibles et résultats observés"),
    ("flow_notes", "Écran précédent / suivant et conditions"),
    ("observations", "États, validations, erreurs, responsive, inconnues"),
]


class InterfaceAtlas:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Interface Atlas — cartographie d’interfaces")
        self.root.geometry("1320x900")
        self.root.minsize(1050, 720)

        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        default_dir = Path.home() / "InterfaceAtlas" / f"Session_{stamp}"
        default_dir.mkdir(parents=True, exist_ok=True)
        self.session_dir = default_dir
        self.capture_dir = self.session_dir / "captures"
        self.capture_dir.mkdir(parents=True, exist_ok=True)
        self.data = {"executable": "", "arguments": "", "screens": []}
        self.process: subprocess.Popen | None = None
        self.current_id: str | None = None
        self._loading = False
        self._preview_image = None
        self._capture_pending_name = None

        self.exe_var = tk.StringVar()
        self.args_var = tk.StringVar()
        self.project_var = tk.StringVar(value=str(self.session_dir))
        self.status_var = tk.StringVar(value="Choisissez l’application, lancez-la, puis capturez les écrans.")

        self._build_ui()
        self._load_project()
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _build_ui(self):
        top = ttk.Frame(self.root, padding=(10, 8))
        top.pack(fill="x")

        project_row = ttk.Frame(top)
        project_row.pack(fill="x", pady=(0, 6))
        ttk.Label(project_row, text="Session :").pack(side="left")
        ttk.Label(project_row, textvariable=self.project_var).pack(side="left", padx=6)
        ttk.Button(project_row, text="Nouvelle session", command=self._new_project).pack(side="right", padx=(5, 0))
        ttk.Button(project_row, text="Ouvrir session", command=self._open_project).pack(side="right")

        app_row = ttk.Frame(top)
        app_row.pack(fill="x")
        ttk.Label(app_row, text="Exécutable :").pack(side="left")
        ttk.Entry(app_row, textvariable=self.exe_var).pack(side="left", fill="x", expand=True, padx=6)
        ttk.Button(app_row, text="Parcourir…", command=self._choose_executable).pack(side="left")
        ttk.Label(app_row, text="Arguments :").pack(side="left", padx=(12, 0))
        ttk.Entry(app_row, textvariable=self.args_var, width=22).pack(side="left", padx=6)
        ttk.Button(app_row, text="Lancer", command=self._launch).pack(side="left")
        ttk.Button(app_row, text="Capturer l’écran", command=self._capture_screen).pack(side="left", padx=(6, 0))

        ttk.Separator(self.root).pack(fill="x")
        body = ttk.Panedwindow(self.root, orient="horizontal")
        body.pack(fill="both", expand=True, padx=10, pady=10)

        left = ttk.Frame(body, padding=(0, 0, 8, 0))
        body.add(left, weight=1)
        ttk.Label(left, text="Écrans capturés", font=("", 11, "bold")).pack(anchor="w", pady=(0, 6))
        columns = ("name", "capture")
        self.screen_tree = ttk.Treeview(left, columns=columns, show="headings", selectmode="browse")
        self.screen_tree.heading("name", text="Écran")
        self.screen_tree.heading("capture", text="Image")
        self.screen_tree.column("name", width=175)
        self.screen_tree.column("capture", width=55, anchor="center")
        self.screen_tree.pack(fill="both", expand=True)
        self.screen_tree.bind("<<TreeviewSelect>>", self._select_screen)
        buttons = ttk.Frame(left)
        buttons.pack(fill="x", pady=6)
        ttk.Button(buttons, text="Ajouter sans capture", command=self._add_blank_screen).pack(fill="x", pady=2)
        ttk.Button(buttons, text="Supprimer l’écran", command=self._delete_screen).pack(fill="x", pady=2)

        right = ttk.Frame(body)
        body.add(right, weight=4)
        self.tabs = ttk.Notebook(right)
        self.tabs.pack(fill="both", expand=True)

        self.capture_tab = ttk.Frame(self.tabs, padding=8)
        self.prompt_tab = ttk.Frame(self.tabs, padding=8)
        self.tabs.add(self.capture_tab, text="Capture et description")
        self.tabs.add(self.prompt_tab, text="Prompt et plan")

        self.preview_frame = ttk.LabelFrame(self.capture_tab, text="Capture de l’écran sélectionné", padding=6)
        self.preview_frame.pack(fill="x", pady=(0, 8))
        self.preview_label = ttk.Label(self.preview_frame, text="Aucune capture pour cet écran", anchor="center")
        self.preview_label.pack(fill="both", expand=True)
        self.preview_frame.configure(height=250)
        self.preview_frame.pack_propagate(False)

        form_outer = ttk.Frame(self.capture_tab)
        form_outer.pack(fill="both", expand=True)
        self.form_canvas = tk.Canvas(form_outer, highlightthickness=0)
        form_scroll = ttk.Scrollbar(form_outer, orient="vertical", command=self.form_canvas.yview)
        self.form_canvas.configure(yscrollcommand=form_scroll.set)
        form_scroll.pack(side="right", fill="y")
        self.form_canvas.pack(side="left", fill="both", expand=True)
        self.form = ttk.Frame(self.form_canvas)
        self.form_window = self.form_canvas.create_window((0, 0), window=self.form, anchor="nw")
        self.form.bind("<Configure>", lambda _e: self.form_canvas.configure(scrollregion=self.form_canvas.bbox("all")))
        self.form_canvas.bind("<Configure>", lambda e: self.form_canvas.itemconfigure(self.form_window, width=e.width))

        self.name_var = tk.StringVar()
        ttk.Label(self.form, text="Nom de l’écran").pack(anchor="w")
        self.name_entry = ttk.Entry(self.form, textvariable=self.name_var)
        self.name_entry.pack(fill="x", pady=(2, 8))
        self.name_var.trace_add("write", self._field_changed)
        self.field_widgets: dict[str, tk.Text] = {}
        for key, label in FIELDS:
            ttk.Label(self.form, text=label).pack(anchor="w")
            widget = tk.Text(self.form, height=3, wrap="word", undo=True)
            widget.pack(fill="x", pady=(2, 8))
            widget.bind("<<Modified>>", self._text_modified)
            self.field_widgets[key] = widget

        prompt_bar = ttk.Frame(self.prompt_tab)
        prompt_bar.pack(fill="x", pady=(0, 8))
        ttk.Button(prompt_bar, text="Générer le prompt et le plan", command=self._generate_prompt).pack(side="left")
        ttk.Button(prompt_bar, text="Exporter en Markdown…", command=self._export_prompt).pack(side="left", padx=6)
        self.prompt_text = tk.Text(self.prompt_tab, wrap="word", undo=False)
        self.prompt_text.pack(fill="both", expand=True)

        status = ttk.Label(self.root, textvariable=self.status_var, anchor="w", relief="sunken", padding=(8, 4))
        status.pack(fill="x", side="bottom")

    def _project_file(self) -> Path:
        return self.session_dir / "interface_atlas.json"

    def _load_project(self):
        path = self._project_file()
        if path.exists():
            try:
                self.data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                messagebox.showerror("Session illisible", f"Impossible de lire {path} :\n{exc}")
                self.data = {"executable": "", "arguments": "", "screens": []}
        self.exe_var.set(self.data.get("executable", ""))
        self.args_var.set(self.data.get("arguments", ""))
        self._refresh_tree()

    def _save_project(self):
        self.data["executable"] = self.exe_var.get().strip()
        self.data["arguments"] = self.args_var.get().strip()
        try:
            self.session_dir.mkdir(parents=True, exist_ok=True)
            self.capture_dir.mkdir(parents=True, exist_ok=True)
            self._project_file().write_text(json.dumps(self.data, ensure_ascii=False, indent=2), encoding="utf-8")
            return True
        except OSError as exc:
            messagebox.showerror("Enregistrement impossible", str(exc))
            return False

    def _choose_executable(self):
        path = filedialog.askopenfilename(title="Choisir un exécutable")
        if path:
            self.exe_var.set(path)
            self._save_project()

    def _launch(self):
        executable = self.exe_var.get().strip()
        if not executable:
            messagebox.showinfo("Exécutable requis", "Choisissez d’abord le programme à analyser.")
            return
        path = Path(executable).expanduser()
        if not path.exists():
            messagebox.showerror("Fichier introuvable", f"Ce chemin n’existe pas :\n{path}")
            return
        try:
            args = shlex.split(self.args_var.get(), posix=(os.name != "nt"))
            self.process = subprocess.Popen([str(path), *args], cwd=str(path.parent))
            self._save_project()
            self.status_var.set(f"Programme lancé (PID {self.process.pid}). Parcourez-le, puis capturez chaque écran.")
        except (OSError, ValueError) as exc:
            messagebox.showerror("Lancement impossible", str(exc))

    def _capture_screen(self):
        name = simpledialog.askstring("Nommer l’écran", "Ex. : Tableau de bord, Paramètres > Profil")
        if not name or not name.strip():
            return
        if not self.session_dir:
            return
        self._capture_pending_name = name.strip()
        self.status_var.set("Capture dans une seconde : placez l’application cible au premier plan.")
        self.root.iconify()
        self.root.after(1100, self._take_capture)

    def _take_capture(self):
        name = self._capture_pending_name or "Écran"
        screen_id = f"screen_{int(time.time() * 1000)}"
        filename = f"{screen_id}.png"
        try:
            with mss.mss() as sct:
                monitor = sct.monitors[0]
                shot = sct.grab(monitor)
                image = Image.frombytes("RGB", shot.size, shot.rgb)
                image.save(self.capture_dir / filename)
            item = self._empty_screen(screen_id, name, filename)
            self.data.setdefault("screens", []).append(item)
            self._save_project()
            self.root.deiconify()
            self._refresh_tree(select_id=screen_id)
            self.status_var.set(f"Capture enregistrée : {name}")
        except Exception as exc:
            self.root.deiconify()
            messagebox.showerror(
                "Capture impossible",
                "La capture du bureau a échoué.\n\n"
                "Sous Linux, vérifiez les permissions de capture d’écran; "
                "certaines sessions Wayland ne l’autorisent pas.\n\n"
                f"Détail : {exc}",
            )
            self.status_var.set("Capture échouée.")

    @staticmethod
    def _empty_screen(screen_id: str, name: str, image: str = ""):
        item = {"id": screen_id, "name": name, "image": image}
        item.update({key: "" for key, _label in FIELDS})
        return item

    def _add_blank_screen(self):
        name = simpledialog.askstring("Ajouter un écran", "Nom de l’écran :")
        if not name or not name.strip():
            return
        screen_id = f"screen_{int(time.time() * 1000)}"
        self.data.setdefault("screens", []).append(self._empty_screen(screen_id, name.strip()))
        self._save_project()
        self._refresh_tree(select_id=screen_id)

    def _refresh_tree(self, select_id=None):
        for row in self.screen_tree.get_children():
            self.screen_tree.delete(row)
        for item in self.data.get("screens", []):
            mark = "✓" if item.get("image") and (self.capture_dir / item["image"]).exists() else "—"
            self.screen_tree.insert("", "end", iid=item["id"], values=(item.get("name", "Écran"), mark))
        target = select_id or self.current_id
        if target and self.screen_tree.exists(target):
            self.screen_tree.selection_set(target)
            self.screen_tree.focus(target)
            self._show_screen(target)
        elif not self.data.get("screens"):
            self.current_id = None
            self._show_screen(None)

    def _select_screen(self, _event=None):
        selected = self.screen_tree.selection()
        if not selected:
            return
        new_id = selected[0]
        if new_id != self.current_id:
            self._commit_current()
            self._show_screen(new_id)

    def _show_screen(self, screen_id):
        self.current_id = screen_id
        item = next((s for s in self.data.get("screens", []) if s["id"] == screen_id), None)
        self._loading = True
        self.name_var.set(item.get("name", "") if item else "")
        for key, widget in self.field_widgets.items():
            widget.delete("1.0", "end")
            if item:
                widget.insert("1.0", item.get(key, ""))
            widget.edit_modified(False)
        self._loading = False
        self._show_preview(item)

    def _show_preview(self, item):
        self._preview_image = None
        image_name = item.get("image") if item else None
        image_path = self.capture_dir / image_name if image_name else None
        if not image_path or not image_path.exists():
            self.preview_label.configure(image="", text="Aucune capture pour cet écran")
            return
        try:
            image = Image.open(image_path)
            image.thumbnail((850, 225))
            self._preview_image = ImageTk.PhotoImage(image)
            self.preview_label.configure(image=self._preview_image, text="")
        except OSError as exc:
            self.preview_label.configure(image="", text=f"Image indisponible : {exc}")

    def _field_changed(self, *_args):
        if not self._loading:
            self.root.after_idle(self._commit_current)

    def _text_modified(self, event):
        widget = event.widget
        if widget.edit_modified():
            widget.edit_modified(False)
            if not self._loading:
                self.root.after_idle(self._commit_current)

    def _commit_current(self):
        if self._loading or not self.current_id:
            return
        item = next((s for s in self.data.get("screens", []) if s["id"] == self.current_id), None)
        if not item:
            return
        item["name"] = self.name_var.get().strip() or "Écran sans nom"
        for key, widget in self.field_widgets.items():
            item[key] = widget.get("1.0", "end-1c").strip()
        self._save_project()
        if self.screen_tree.exists(self.current_id):
            self.screen_tree.item(self.current_id, values=(item["name"], "✓" if item.get("image") else "—"))

    def _delete_screen(self):
        if not self.current_id:
            return
        item = next((s for s in self.data.get("screens", []) if s["id"] == self.current_id), None)
        if not item:
            return
        if not messagebox.askyesno("Supprimer", f"Supprimer « {item.get('name', 'Écran')} » et sa capture ?"):
            return
        image = item.get("image")
        self.data["screens"] = [s for s in self.data["screens"] if s["id"] != self.current_id]
        if image:
            try:
                (self.capture_dir / image).unlink(missing_ok=True)
            except OSError:
                pass
        self.current_id = None
        self._save_project()
        self._refresh_tree()

    def _new_project(self):
        folder = filedialog.askdirectory(title="Choisir le dossier de la nouvelle session")
        if not folder:
            return
        self._commit_current()
        self.session_dir = Path(folder)
        self.capture_dir = self.session_dir / "captures"
        self.capture_dir.mkdir(parents=True, exist_ok=True)
        self.data = {"executable": "", "arguments": "", "screens": []}
        self.current_id = None
        self.exe_var.set("")
        self.args_var.set("")
        self.project_var.set(str(self.session_dir))
        self._save_project()
        self._refresh_tree()

    def _open_project(self):
        folder = filedialog.askdirectory(title="Choisir un dossier de session Interface Atlas")
        if not folder:
            return
        self._commit_current()
        self.session_dir = Path(folder)
        self.capture_dir = self.session_dir / "captures"
        self.capture_dir.mkdir(parents=True, exist_ok=True)
        self.project_var.set(str(self.session_dir))
        self.current_id = None
        self.data = {"executable": "", "arguments": "", "screens": []}
        self._load_project()
        self.current_id = None
        self._refresh_tree()

    def _generate_prompt(self):
        self._commit_current()
        screens = self.data.get("screens", [])
        lines = [
            "# Prompt de reconstruction d’interface",
            "",
            "## Mission",
            "Construire une application qui reproduit l’interface et les comportements décrits ci-dessous. "
            "Utiliser les captures comme références visuelles. Ne pas inventer les éléments marqués comme inconnus; "
            "les signaler comme questions à résoudre.",
            "",
            "## Application de référence",
            f"- Exécutable observé : {self.data.get('executable') or 'non renseigné'}",
            f"- Arguments : {self.data.get('arguments') or 'aucun'}",
            f"- Nombre d’écrans cartographiés : {len(screens)}",
            "",
            "## Écrans et comportements observés",
        ]
        if not screens:
            lines.append("Aucun écran n’a encore été décrit.")
        for index, item in enumerate(screens, 1):
            lines.extend(["", f"### {index}. {item.get('name') or 'Écran sans nom'}"])
            if item.get("image"):
                lines.append(f"- Capture locale : `captures/{item['image']}`")
            for key, label in FIELDS:
                value = item.get(key, "").strip()
                lines.append(f"- **{label} :** {value or 'À documenter / non observé.'}")
        lines.extend([
            "",
            "## Exigences de réalisation",
            "- Reproduire la hiérarchie, les espacements, la typographie, les couleurs, les icônes et les états visibles dans les captures.",
            "- Implémenter les contrôles et transitions décrits; conserver les libellés observés.",
            "- Prévoir les états de chargement, vide, erreur, validation et succès lorsqu’ils sont documentés.",
            "- Séparer les composants réutilisables des écrans et rendre l’interface accessible au clavier.",
            "- Documenter explicitement les décisions prises pour les informations manquantes.",
            "",
            "## Plan de travail de développement",
            "1. **Consolider les exigences** — compléter les inconnues et confirmer les parcours observés.",
            "2. **Poser la structure** — choisir la pile technique, définir les routes, le modèle de données et les composants partagés.",
            "3. **Construire les écrans** — implémenter chaque écran décrit et rapprocher le rendu des captures.",
            "4. **Relier les interactions** — réaliser formulaires, contrôles, validations et transitions documentés.",
            "5. **Vérifier** — comparer chaque écran aux captures, tester les chemins heureux et les cas d’erreur relevés, corriger les écarts.",
            "6. **Livrer** — fournir instructions de lancement, limites connues et liste des hypothèses restant à valider.",
            "",
            "## Règle de fidélité",
            "Distinguer les faits observés des hypothèses. Si une capture ou une description ne permet pas de trancher, "
            "ne pas présenter une supposition comme un comportement confirmé.",
        ])
        result = "\n".join(lines)
        self.prompt_text.delete("1.0", "end")
        self.prompt_text.insert("1.0", result)
        self.tabs.select(self.prompt_tab)
        self.status_var.set("Prompt généré à partir des notes enregistrées.")

    def _export_prompt(self):
        content = self.prompt_text.get("1.0", "end-1c").strip()
        if not content:
            self._generate_prompt()
            content = self.prompt_text.get("1.0", "end-1c").strip()
        path = filedialog.asksaveasfilename(
            title="Exporter le prompt et le plan",
            initialdir=str(self.session_dir),
            initialfile="prompt_clone_et_plan.md",
            defaultextension=".md",
            filetypes=[("Markdown", "*.md"), ("Tous les fichiers", "*.*")],
        )
        if path:
            Path(path).write_text(content + "\n", encoding="utf-8")
            self.status_var.set(f"Prompt exporté : {path}")

    def _on_close(self):
        self._commit_current()
        self._save_project()
        self.root.destroy()


def main():
    root = tk.Tk()
    InterfaceAtlas(root)
    root.mainloop()


if __name__ == "__main__":
    main()
