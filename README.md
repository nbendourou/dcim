# 🏢 DCIM Capacitaire - Guide d'Installation Complet

Application de gestion de capacité datacenter avec Google Sheets comme backend.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation du Backend (Google Sheets)](#1-installation-du-backend-google-sheets)
3. [Déploiement de l'API Apps Script](#2-déploiement-de-lapi-apps-script)
4. [Installation sur GitHub](#3-installation-sur-github)
5. [Déploiement sur Vercel](#4-déploiement-sur-vercel)
6. [Configuration de l'application](#5-configuration-de-lapplication)
7. [Utilisation](#6-utilisation)

---

## Prérequis

- Un compte Google (Gmail)
- Un compte GitHub (gratuit)
- Un compte Vercel (gratuit)

---

## 1. Installation du Backend (Google Sheets)

### Étape 1.1 : Importer le fichier Excel

1. Ouvrez [Google Drive](https://drive.google.com)
2. Cliquez sur **Nouveau** > **Import de fichiers**
3. Sélectionnez le fichier `DCIM_V3_Final.xlsx`
4. Une fois importé, double-cliquez dessus
5. Google vous proposera de l'ouvrir avec Google Sheets - acceptez

### Étape 1.2 : Convertir en Google Sheets

1. Dans le fichier ouvert, cliquez sur **Fichier** > **Enregistrer sous Google Sheets**
2. Un nouveau fichier Google Sheets sera créé
3. **Important** : Notez l'URL du fichier, vous en aurez besoin plus tard

L'URL ressemble à : `https://docs.google.com/spreadsheets/d/VOTRE_ID_ICI/edit`

---

## 2. Déploiement de l'API Apps Script

### Étape 2.1 : Ouvrir l'éditeur Apps Script

1. Dans votre Google Sheets, cliquez sur **Extensions** > **Apps Script**
2. Un nouvel onglet s'ouvre avec l'éditeur de code

### Étape 2.2 : Copier le code backend

1. Supprimez tout le contenu existant dans l'éditeur
2. Copiez **tout** le contenu du fichier `Code.gs` fourni
3. Collez-le dans l'éditeur Apps Script
4. Cliquez sur **Ctrl+S** (ou Cmd+S sur Mac) pour sauvegarder
5. Nommez le projet : `DCIM API`

### Étape 2.3 : Déployer l'application web

1. Cliquez sur **Déployer** > **Nouveau déploiement**
2. Cliquez sur l'icône ⚙️ à côté de "Sélectionner un type"
3. Choisissez **Application Web**
4. Configurez :
   - **Description** : `DCIM API v1`
   - **Exécuter en tant que** : `Moi`
   - **Qui peut accéder** : `Tout le monde`
5. Cliquez sur **Déployer**
6. **Autorisez** l'application quand Google le demande :
   - Cliquez sur "Examiner les autorisations"
   - Sélectionnez votre compte Google
   - Cliquez sur "Avancé" puis "Accéder à DCIM API (non sécurisé)"
   - Cliquez sur "Autoriser"
7. **COPIEZ L'URL** qui apparaît - c'est votre URL d'API !

L'URL ressemble à : `https://script.google.com/macros/s/AKfycbw.../exec`

**⚠️ IMPORTANT** : Gardez cette URL précieusement, vous en aurez besoin pour configurer l'application.

---

## 3. Installation sur GitHub

### Étape 3.1 : Créer un compte GitHub (si nécessaire)

1. Allez sur [github.com](https://github.com)
2. Cliquez sur **Sign up**
3. Suivez les instructions pour créer votre compte

### Étape 3.2 : Créer un nouveau repository

1. Connectez-vous à GitHub
2. Cliquez sur le bouton **+** en haut à droite > **New repository**
3. Configurez :
   - **Repository name** : `dcim-app`
   - **Description** : `Application DCIM Capacitaire`
   - **Public** (pour Vercel gratuit)
   - ✅ Cochez "Add a README file"
4. Cliquez sur **Create repository**

### Étape 3.3 : Uploader les fichiers

**Méthode simple (via l'interface web)** :

1. Dans votre repository, cliquez sur **Add file** > **Upload files**
2. Glissez-déposez les fichiers suivants :
   - `index.html`
   - `styles.css`
   - `app.js`
3. Dans "Commit changes", écrivez : `Initial commit - DCIM App`
4. Cliquez sur **Commit changes**

**Méthode alternative (via Git)** :

```bash
# Cloner le repository
git clone https://github.com/VOTRE_USERNAME/dcim-app.git
cd dcim-app

# Copier vos fichiers dans ce dossier
# index.html, styles.css, app.js

# Ajouter les fichiers
git add .

# Commit
git commit -m "Initial commit - DCIM App"

# Push
git push origin main
```

---

## 4. Déploiement sur Vercel

### Étape 4.1 : Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **Sign Up**
3. Choisissez **Continue with GitHub**
4. Autorisez Vercel à accéder à votre compte GitHub

### Étape 4.2 : Importer le projet

1. Sur le dashboard Vercel, cliquez sur **Add New** > **Project**
2. Trouvez votre repository `dcim-app` dans la liste
3. Cliquez sur **Import**

### Étape 4.3 : Configurer le déploiement

1. **Framework Preset** : Laissez sur `Other`
2. **Root Directory** : Laissez vide (`.`)
3. **Build Command** : Laissez vide
4. **Output Directory** : Laissez vide
5. Cliquez sur **Deploy**

### Étape 4.4 : Attendre le déploiement

1. Vercel va automatiquement déployer votre application
2. Après quelques secondes, vous verrez "Congratulations!"
3. Cliquez sur le lien pour voir votre application en ligne

Votre URL sera : `https://dcim-app-xxxxx.vercel.app`

---

## 5. Configuration de l'application

### Étape 5.1 : Accéder à la configuration

1. Ouvrez votre application sur Vercel
2. Cliquez sur **Configuration** dans le menu de gauche

### Étape 5.2 : Connecter Google Sheets

1. Dans le champ **ID de déploiement Apps Script**, collez l'URL de votre API Apps Script
   (celle que vous avez copiée à l'étape 2.3)
2. Cliquez sur **Tester la connexion**
3. Si tout est OK, vous verrez "Connexion réussie!"
4. Cliquez sur **Sauvegarder**

### Étape 5.3 : Configurer les seuils

1. **Seuil d'alerte (%)** : 70 (par défaut)
2. **Seuil critique (%)** : 85 (par défaut)
3. **Rafraîchissement auto** : 300 secondes (5 minutes)

---

## 6. Utilisation

### Switch Nominale/Réelle

En haut à droite de l'application, vous avez un switch :

- **NOMINALE** : Affiche les calculs basés sur la puissance maximale des équipements (capacity planning)
- **RÉELLE** : Affiche les calculs basés sur la puissance mesurée (suivi opérationnel)

### Pages disponibles

1. **Dashboard** : Vue d'ensemble avec KPIs et graphiques
2. **Chaînes Électriques** : Détail de chaque chaîne avec simulation de perte
3. **Racks** : Liste et détail des racks
4. **Équipements** : Inventaire avec puissances nominale et réelle
5. **Simulation** : Simuler la perte d'une chaîne électrique
6. **Configuration** : Paramètres de l'application

### Mettre à jour les données

1. Modifiez directement le Google Sheets
2. L'application se rafraîchit automatiquement (selon l'intervalle configuré)
3. Ou cliquez sur le bouton 🔄 pour forcer l'actualisation

---

## 🔧 Dépannage

### L'application affiche "Mode démo"

- Vérifiez que l'URL de l'API Apps Script est correcte
- Assurez-vous que le déploiement est bien configuré sur "Tout le monde"
- Redéployez l'Apps Script si nécessaire

### Les données ne s'affichent pas

- Vérifiez que les noms des onglets dans Google Sheets correspondent exactement à ceux du code
- Vérifiez que les colonnes ont les bons noms (première ligne)

### Erreur CORS

- Assurez-vous que l'Apps Script est déployé en tant qu'application web
- L'accès doit être configuré sur "Tout le monde"

---

## 📱 Accès mobile

L'application est responsive et fonctionne sur mobile :

1. Ouvrez l'URL Vercel sur votre téléphone
2. Pour un accès rapide, ajoutez à l'écran d'accueil :
   - **iOS** : Safari > Partager > Sur l'écran d'accueil
   - **Android** : Chrome > Menu > Ajouter à l'écran d'accueil

---

## 🔄 Mises à jour

Pour mettre à jour l'application :

1. Modifiez les fichiers sur GitHub
2. Vercel détecte automatiquement les changements
3. Un nouveau déploiement se lance automatiquement

---

## 📞 Support

En cas de problème :
1. Vérifiez ce guide étape par étape
2. Consultez les logs dans la console du navigateur (F12)
3. Vérifiez les logs Apps Script (Exécutions dans l'éditeur)

---

**Bonne utilisation de votre DCIM ! 🏢⚡**
