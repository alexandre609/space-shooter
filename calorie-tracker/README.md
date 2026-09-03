# CalTrack

Application web progressive (PWA) pour noter les calories consommées chaque jour, installable sur Android.

## Fonctionnalités

- Ajout d'aliments avec nom, calories et repas (petit-déjeuner, déjeuner, dîner, collation)
- Objectif calorique quotidien personnalisable, avec anneau de progression
- Navigation entre les jours (précédent / suivant, jusqu'à aujourd'hui)
- Historique de tous les jours enregistrés, consultable et navigable
- Suppression d'un aliment ajouté par erreur
- Fonctionne hors-ligne et s'installe sur l'écran d'accueil Android (PWA avec Service Worker)
- Toutes les données restent en local sur l'appareil (`localStorage`), aucun compte ni serveur requis

## Lancer l'application

Servez le dossier avec un petit serveur HTTP local (un Service Worker nécessite HTTP, pas `file://`) :

```bash
cd calorie-tracker
python3 -m http.server 8080
```

Puis ouvrez `http://localhost:8080` dans Chrome sur votre téléphone Android (même réseau Wi-Fi, en remplaçant `localhost` par l'IP de votre ordinateur), ou sur votre ordinateur pour tester.

## Installer sur Android

1. Ouvrez le site dans Chrome sur votre téléphone Android.
2. Ouvrez le menu (⋮) puis choisissez **Installer l'application** (ou **Ajouter à l'écran d'accueil**).
3. L'application s'ouvre ensuite comme une app native, en plein écran, avec son icône dédiée.

## Structure

- `index.html` — structure de l'interface
- `style.css` — mise en page mobile-first, thème clair/sombre automatique
- `app.js` — logique de l'application (stockage, calculs, rendu)
- `manifest.json` — métadonnées PWA (nom, icônes, couleurs)
- `service-worker.js` — mise en cache pour le fonctionnement hors-ligne
- `icons/` — icônes de l'application
