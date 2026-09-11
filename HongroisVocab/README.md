# Vocabulaire Hongrois

Application Android (Kotlin + Jetpack Compose) pour apprendre du vocabulaire
hongrois par catégorie.

## Fonctionnement

1. L'écran d'accueil affiche la liste des catégories : Adverbes, Adjectifs,
   Sports, Animaux, Végétation, Nourriture.
2. En sélectionnant une catégorie, la liste des mots s'affiche **uniquement
   en hongrois**.
3. Appuyer sur un mot le traduit et l'affiche **uniquement en français**.
   Appuyer à nouveau dessus le fait revenir en hongrois. Chaque mot bascule
   indépendamment des autres.

## Ajouter des catégories ou des mots

Le vocabulaire est défini dans
`app/src/main/java/com/vocabhu/app/VocabData.kt`. Il suffit d'ajouter une
entrée à `vocabCategories` (ou des `VocabWord(hu, fr)` à une catégorie
existante) pour enrichir l'application.

## Ouvrir et lancer le projet

1. Ouvrir ce dossier (`HongroisVocab`) dans Android Studio (Koala ou plus
   récent recommandé).
2. Laisser Android Studio synchroniser Gradle (le wrapper est déjà inclus).
3. Lancer l'application sur un émulateur ou un appareil (minSdk 24).

Le projet peut aussi être compilé en ligne de commande si le SDK Android est
installé et `ANDROID_HOME`/`ANDROID_SDK_ROOT` configuré :

```sh
./gradlew assembleDebug
```
