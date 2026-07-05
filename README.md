# XCSM V3 — Frontend StudTech

> Plateforme pédagogique intelligente de nouvelle génération.  
> Transforme des documents statiques en granules d'apprentissage interactifs, enrichis par l'IA et la collaboration sociale.

**Encadreur :** Pr BATCHAKUI Bernabé — ENSPY, Université de Yaoundé I  
**Déployé sur :** Vercel — https://xcsm-frontend-app.vercel.app

---

## 📋 Table des Matières

1. [Stack Technologique](#stack-technologique)
2. [Nouveautés V3](#nouveautés-v3)
3. [Prérequis](#prérequis)
4. [Installation](#installation)
5. [Configuration Environnement](#configuration-environnement)
6. [Architecture des Dossiers](#architecture-des-dossiers)
7. [Modules V3](#modules-v3)
8. [Sécurité Critique](#sécurité-critique)
9. [Scripts disponibles](#scripts-disponibles)
10. [Communication avec le Backend](#communication-avec-le-backend)
11. [Tests](#tests)
12. [Déploiement](#déploiement)

---

## 🛠️ Stack Technologique

| Technologie | Version | Usage |
|---|---|---|
| Next.js | 15 (App Router) | Framework principal |
| TypeScript | 5.x | Typage strict |
| Tailwind CSS | 3.x | Styles utilitaires |
| Shadcn/UI | Latest | Composants (Radix UI) |
| Lucide React | Latest | Icônes |
| DOMPurify | Latest | Sanitization XSS |
| @google/genai | Latest | SDK IA (usage serveur uniquement via proxy) |

---

## 🌟 Nouveautés V3

### 🤖 Module 1 — Assistant IA Conversationnel (Gemini)
Chatbot intégré au contexte du cours avec streaming SSE (mot par mot).  
L'IA connaît le granule actuellement consulté et répond uniquement sur son contenu.

### 📊 Module 2 — Dashboard Analytics Pédagogique
- Suivi anonymisé (RGPD) du temps passé par granule
- Détection automatique des zones de difficulté
- Génération de synthèses IA pour l'enseignant

### 💬 Module 3 — Espace de Collaboration
- Commentaires imbriqués (threads) sur chaque granule
- Système Upvote / Downvote
- Notifications par polling (toutes les 15s)

### 🧠 Module 4 — Fiches de Synthèse Intelligentes
Résumés et conseils de révision générés dynamiquement par ML.

---

## 📦 Prérequis

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0 ou **pnpm** ≥ 8.0
- **Backend XCSM Django** lancé sur `http://localhost:8000`

---

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-org/xcsm-frontend.git
cd xcsm-frontend

# 2. Installer les dépendances
npm install
# ou
pnpm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# 4. Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur **http://localhost:3000**

---

## ⚙️ Configuration Environnement

Créer `.env.local` à la racine (ne jamais committer ce fichier en clair) :

### 💾 Sauvegarde et Restauration (.env.local)

Pour éviter que votre clé API Gemini ne soit scannée sur le dépôt, le fichier `.env.local` a été encodé en Base64 et poussé sous le nom de `env_front_backup.txt`.

Pour le restaurer après avoir cloné le dépôt :
```bash
base64 -d env_front_backup.txt > .env.local
```

### Template de base

```bash
# ============================================
# BACKEND CONNECTION
# ============================================
# URL du backend Django (sans slash final)
DJANGO_API_URL=http://localhost:8000

# URL publique de l'API (accessible depuis le navigateur)
NEXT_PUBLIC_API_URL=http://localhost:8000

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_NAME=XCSM
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# ⛔ SÉCURITÉ — NE JAMAIS AJOUTER ICI :
# ⛔ NEXT_PUBLIC_GEMINI_API_KEY
# ⛔ GEMINI_API_KEY
# La clé Gemini est UNIQUEMENT côté Django
# ============================================
```

---

## 📁 Architecture des Dossiers
xcsm-frontend/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Groupe routes authentification
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/              # Dashboard enseignant/étudiant
│   │   ├── dashboard/page.tsx
│   │   ├── courses/page.tsx
│   │   └── analytics/page.tsx
│   ├── courses/[courseId]/       # Lecture de cours
│   │   ├── [granuleId]/page.tsx  # Vue granule avec assistant IA
│   │   └── layout.tsx
│   │
│   └── api/                      # Routes API Next.js (proxy vers Django)
│       └── ai/
│           └── chat/
│               └── stream/
│                   └── route.ts  # ⚠️ Proxy SSE — NE PAS appeler Gemini ici
│
├── components/                   # Composants réutilisables
│   ├── ui/                       # Composants Shadcn/UI de base
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── granule/
│   │   ├── GranuleViewer.tsx     # ⚠️ Utilise DOMPurify obligatoirement
│   │   ├── GranuleNavigation.tsx
│   │   └── GranuleActions.tsx
│   ├── ai/
│   │   ├── AIChat.tsx            # Interface chat IA
│   │   ├── AIChatMessage.tsx
│   │   └── AISynthesisPanel.tsx
│   ├── analytics/
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── DifficultyZones.tsx
│   │   └── ProgressChart.tsx
│   ├── comments/
│   │   ├── CommentThread.tsx
│   │   ├── CommentItem.tsx
│   │   └── VoteButtons.tsx
│   └── notifications/
│       └── NotificationBell.tsx
│
├── hooks/                        # Logique métier réutilisable
│   ├── useAIChat.ts              # Gestion streaming SSE IA
│   ├── useAnalytics.ts           # Tracking RGPD (anonymisé)
│   ├── useComments.ts            # CRUD + votes commentaires
│   ├── useNotifications.ts       # Polling 15s notifications
│   ├── useGranule.ts             # Lecture granule actuel
│   └── useAuth.ts                # Authentification JWT
│
├── lib/
│   ├── api.ts                    # ApiClient centralisé (avec JWT refresh)
│   └── sanitize.ts               # DOMPurify — sanitization HTML granules
│
├── types/                        # Interfaces TypeScript
│   ├── granule.ts
│   ├── course.ts
│   ├── comment.ts
│   ├── analytics.ts
│   ├── notification.ts
│   └── user.ts
│
├── contexts/
│   └── AuthContext.tsx           # État global d'authentification
│
├── public/                       # Assets statiques
│
├── .env.example                  # Template variables d'environnement
├── .env.local                    # ⛔ NON COMMITÉ — vos variables locales
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json                 # strict: true obligatoire

---

## 🔌 Modules V3

### Module IA — `hooks/useAIChat.ts`

```typescript
// Usage dans un composant
const { messages, sendMessage, isStreaming, error } = useAIChat({
  granuleId: 'mongodb_granule_id',
  granuleContext: granule.content,
});
```

Le hook appelle `/api/ai/chat/stream/` (route Next.js proxy) qui relaie vers Django. **La clé Gemini n'est jamais exposée côté client.**

### Module Analytics — `hooks/useAnalytics.ts`

```typescript
// Usage : tracker automatiquement le temps passé
useAnalytics({ granuleId, courseId }); // S'exécute en arrière-plan
```

Tracking anonymisé (hash RGPD de l'user_id). Aucun identifiant personnel n'est envoyé.

### Module Commentaires — `hooks/useComments.ts`

```typescript
const { comments, addComment, vote, isLoading } = useComments(granuleId);
```

### Module Notifications — `hooks/useNotifications.ts`

```typescript
const { notifications, unreadCount, markAsRead } = useNotifications();
// Polling automatique toutes les 15 secondes
```

---

## 🔒 Sécurité Critique

> ⛔ **RÈGLE ABSOLUE** : Jamais de clé API Gemini/OpenAI côté frontend.

### 1. Proxy SSE obligatoire
Navigateur → /api/ai/chat/stream/ (Next.js) → Django → Gemini
Le fichier `app/api/ai/chat/stream/route.ts` est un **proxypur**. Il ne contient aucune clé API.

### 2. Sanitization XSS
Tout contenu HTML affiché depuis MongoDB passe par `DOMPurify` via `lib/sanitize.ts`.

```typescript
import { sanitizeGranuleHTML } from '@/lib/sanitize';
// ✅ Toujours utiliser avant dangerouslySetInnerHTML
const safeHTML = sanitizeGranuleHTML(granule.content);
```

### 3. JWT Auto-refresh
`lib/api.ts` gère le renouvellement automatique du token (intercepteur sur 401).

### 4. Variables d'environnement
- `NEXT_PUBLIC_*` → visible dans le navigateur → uniquement valeurs non-sensibles
- Sans prefix → côté serveur seulement → pour les secrets

---

## 📜 Scripts disponibles

```bash
npm run dev          # Serveur développement (port 3000)
npm run build        # Build production
npm run start        # Démarrer en production
npm run lint         # ESLint
npm run type-check   # Vérification TypeScript (tsc --noEmit)
npm run test         # Tests Jest
npm run test:e2e     # Tests Playwright E2E
```

---

## 🔗 Communication avec le Backend

Tout passe par `lib/api.ts` :

```typescript
import { apiClient } from '@/lib/api';

// GET
const granule = await apiClient.get('/api/granules/123/');

// POST
const comment = await apiClient.post('/api/comments/', { content: '...', granule_id: '123' });

// Streaming IA (via hook useAIChat)
// → passe par app/api/ai/chat/stream/route.ts (proxy)
```

**Base URL :** `NEXT_PUBLIC_API_URL` (défaut: `http://localhost:8000`)

---

## 🧪 Tests

```bash
# Tests unitaires (Jest + Testing Library)
npm run test

# Tests E2E (Playwright)
npm run test:e2e

# Coverage
npm run test -- --coverage
```

**Couverture cible :** > 70% sur les hooks critiques (`useAIChat`, `useComments`, `useAnalytics`).

---

## 🚢 Déploiement

### Vercel (recommandé)

```bash
vercel --prod
```

Variables d'environnement à configurer dans le dashboard Vercel :
- `DJANGO_API_URL` → URL de votre backend Render
- `NEXT_PUBLIC_API_URL` → même URL
- `NEXT_PUBLIC_APP_NAME` → XCSM

### Docker

```bash
docker build -t xcsm-frontend .
docker run -p 3000:3000 --env-file .env.local xcsm-frontend
```