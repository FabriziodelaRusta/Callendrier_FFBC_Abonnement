# Instructions de Déploiement sur GitHub Pages

Ce projet est prêt pour être déployé gratuitement sur **GitHub Pages**.

---

## Méthode 1 : Déploiement Automatique via GitHub Actions (Recommandée)

Un fichier de workflow automatisé a été créé dans `.github/workflows/deploy.yml`.

### Étape 1 : Pousser votre code sur votre dépôt GitHub
Si ce n'est pas déjà fait, connectez votre dossier local à votre dépôt GitHub :

```bash
# 1. Initialiser git si nécessaire
git init

# 2. Ajouter tous les fichiers
git add .

# 3. Créer un commit
git commit -m "Déploiement Calendrier FFBC Abonnement"

# 4. Lier à votre dépôt GitHub (remplacez par votre URL de dépôt)
git remote add origin https://github.com/FabriziodelaRusta/Calendrier_FFBC_OSM.git

# 5. Pousser sur la branche main
git branch -M main
git push -u origin main --force
```

### Étape 2 : Activer GitHub Pages dans les réglages GitHub
1. Allez sur votre dépôt GitHub : `https://github.com/FabriziodelaRusta/<votre-depot>`
2. Cliquez sur l'onglet **Settings** (en haut à droite).
3. Dans le menu de gauche, cliquez sur **Pages**.
4. Sous **Build and deployment** > **Source**, sélectionnez :
   👉 **GitHub Actions** (au lieu de *Deploy from a branch*).
5. C'est tout ! À chaque `git push`, le workflow `.github/workflows/deploy.yml` compile automatiquement le site et publie votre application.

---

## Méthode 2 : Déploiement Manuel en ligne de commande

Si vous préférez compiler manuellement sur votre machine et envoyer le dossier compilé `dist` :

```bash
# 1. Compiler le site et générer tous les fichiers .ics statiques
npm run build

# 2. Les fichiers prêts à être hébergés se trouvent dans le dossier /dist
```

---

## Ce qui a été préparé et configuré :

1. **`base: './'` dans `vite.config.ts`** :
   Permet aux scripts CSS et JavaScript d'être chargés correctement quel que soit le nom de votre sous-dossier GitHub Pages (ex: `https://fabriziodelarusta.github.io/Calendrier_FFBC_OSM/`).

2. **Génération automatique des fichiers `.ics` dans `dist/api/calendar/`** :
   À chaque compilation (`npm run build`), le script `scripts/generate-static-feeds.js` génère tous les fichiers iCalendar statiques :
   - `route.ics`
   - `gravel.ics`
   - `vtt.ics`
   - `marche.ics`
   - `tout.ics`
   - `saison.ics`
   - et par province (`hainaut.ics`, `namur.ics`, `liege.ics`, `luxembourg.ics`, `brabant-wallon.ics`).
   Cela permet d'avoir des liens d'abonnement universels `https://` et `webcal://` fonctionnels même sur un simple hébergement statique comme GitHub Pages !

3. **Fichier `dist/.nojekyll`** :
   Empêche GitHub Pages d'ignorer les répertoires ou fichiers techniques.

4. **Fichier `dist/404.html`** :
   Redirige automatiquement vers `index.html` pour éviter les erreurs 404 lors des rafraîchissements de page.
