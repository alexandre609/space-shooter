# Nebula Runner

Un shoot'em up (space shooter) en vue de côté, jouable directement dans le navigateur, sans dépendance ni étape de build.

## Lancer le jeu

Ouvrez `index.html` dans un navigateur, ou servez le dossier avec un petit serveur HTTP local :

```bash
python3 -m http.server 8080
```

Puis rendez-vous sur `http://localhost:8080`.

## Commandes

- **Déplacement** : Flèches directionnelles ou ZQSD / WASD
- **Tirer** : Espace
- **Pause** : P

## Fonctionnalités

- Déplacement libre du vaisseau (haut/bas/gauche/droite) dans la zone de jeu
- Trois types d'ennemis (chasseur, onduleur, tank) avec patterns de mouvement et de tir différents
- Difficulté progressive (cadence d'apparition des ennemis qui augmente avec le temps)
- Effets de particules à la destruction des ennemis/du joueur
- Fond étoilé en parallaxe
- Effets sonores synthétisés (Web Audio API, aucun fichier audio externe)
- Score, vies, meilleur score sauvegardé en local (`localStorage`)
- Écrans de démarrage, pause et game over
