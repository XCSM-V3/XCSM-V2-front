# StudTech - Frontend App

Frontend de l'application StudTech (XCSM), une plateforme pédagogique intelligente permettant la transformation de documents en granules d'apprentissage.

## Technologies

*   **Framework :** Next.js 15 (App Router)
*   **Langage :** TypeScript
*   **Style :** Tailwind CSS
*   **Composants :** Shadcn/UI (Radix UI)
*   **Icônes :** Lucide React

## Prérequis

*   Node.js 18+
*   npm ou pnpm
*   Le Backend XCSM doit être lancé localement sur le port `8000` (ou configurer `.env.local`).

## Installation

```bash
# Installer les dépendances
npm install
# ou
pnpm install
```

## Configuration

Créer un fichier `.env.local` à la racine si nécessaire pour surcharger l'URL de l'API :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Démarrage

```bash
# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

## Architecture

*   `app/` : Pages et routes de l'application (Next.js App Router).
*   `components/` : Composants réutilisables (UI, Header, Footer).
*   `lib/api.ts` : Client API centralisé pour communiquer avec le backend.
*   `contexts/` : Gestion d'état global (AuthContext).

## Fonctionnalités Principales

*   **Dashboard :** Vue d'ensemble des cours et statistiques.
*   **Upload :** Interface d'import de documents (PDF/DOCX).
*   **Cours :** Consultation et navigation dans les contenus granulaires.
*   **Éditeur :** (À venir/En cours) Édition de contenu riche.
