# elCartable

Plateforme SaaS de commande de fournitures scolaires et manuels avec
livraison à domicile et paiement à la livraison (Maroc).

- Frontend : React 19, Vite, TailwindCSS 4, TanStack Query, React Hook Form, Zod
- Backend : NestJS, Prisma, PostgreSQL (Neon), JWT/Passport, Swagger
- Architecture : monorepo (`/apps/backend`, `/apps/frontend`, `/packages/shared`)

Voir [`ARCHITECTURE.md`](ARCHITECTURE.md) pour l'analyse complète, les
décisions de conception et la feuille de route de développement.

## Statut

🚧 En développement — voir la section "État actuel" dans `ARCHITECTURE.md`.

## Installation & démarrage

```bash
# 1. Dépendances (monorepo)
npm install

# 2. Backend : variables d'environnement
cp apps/backend/.env.example apps/backend/.env
#   → renseigner DATABASE_URL (Neon), les secrets JWT, et (optionnel) Cloudflare R2

# 3. Prisma (client + schéma)
cd apps/backend
npx prisma generate
npx prisma db push        # applique le schéma à la base Neon
cd ../..

# 4. Démarrage (deux terminaux)
npm run dev:backend       # http://localhost:3000  (Swagger: /api/docs)
npm run dev:frontend      # http://localhost:5173
```

Le frontend appelle l'API via `VITE_API_URL` (proxy Vite en dev). Voir
`apps/frontend/.env.example` si présent, sinon les valeurs par défaut
conviennent en local.

### Variables d'environnement — frontend

Coordonnées publiques de l'équipe commerciale (actions sensibles → WhatsApp /
appel). Aucune clé secrète côté frontend.

| Variable | Rôle | Défaut |
| --- | --- | --- |
| `VITE_API_URL` | Base de l'API | `/api/v1/v1` |
| `VITE_WHATSAPP_NUMBER` | Numéro WhatsApp (format international sans `+`) | `212600000000` |
| `VITE_SUPPORT_PHONE` | Numéro d'appel affiché | `+212600000000` |
| `VITE_SUPPORT_EMAIL` | Email de contact | `contact@elcartable.ma` |

## Stockage des fichiers — Cloudflare R2

Les fichiers (images produits `products/`, logos écoles `schools/`, avatars
`avatars/`, PDF/QR de commandes `orders/`, listes envoyées par les acheteurs
`lists/`) sont stockés sur **Cloudflare R2** (compatible S3). **Aucun binaire
n'est stocké en base** : seule l'URL publique est persistée dans Neon.

Les noms de fichiers sont uniques (UUID) ; les PDF/QR de commande utilisent le
numéro de commande pour une régénération idempotente. Les clés R2 sont
**strictement côté serveur** et ne sont jamais exposées au frontend.

### Fallback local (dev)

Si les variables R2 ne sont pas renseignées, l'application retombe
automatiquement sur le disque local (`UPLOAD_DIR`, servi sur `/uploads`). Pratique
pour développer sans compte R2.

### Mise en place d'un bucket R2

1. Cloudflare Dashboard → **R2** → *Create bucket* (ex : `elcartable`).
2. **R2 → Manage API Tokens → Create API Token** : permissions **Object
   Read & Write**, limitées au bucket créé. Notez `Access Key ID` et
   `Secret Access Key` (le secret n'est affiché qu'une fois).
3. Récupérez votre **Account ID** (barre latérale R2).
4. Exposez le bucket publiquement : activez le domaine **r2.dev** du bucket,
   ou rattachez un **domaine personnalisé** (ex : `cdn.elcartable.ma`). Cette
   URL devient `R2_PUBLIC_URL`.

### Variables d'environnement — backend (R2)

| Variable | Rôle |
| --- | --- |
| `R2_ACCOUNT_ID` | Identifiant de compte Cloudflare |
| `R2_ACCESS_KEY_ID` | Clé d'accès R2 (serveur) |
| `R2_SECRET_ACCESS_KEY` | Secret R2 (serveur) |
| `R2_BUCKET` | Nom du bucket (ex : `elcartable`) |
| `R2_ENDPOINT` | *(optionnel)* défaut `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | URL publique du bucket (r2.dev ou domaine perso) |

> Configuration « tout ou rien » : dès qu'une variable R2 est renseignée, les
> quatre credentials cœur **et** `R2_PUBLIC_URL` sont exigés au démarrage (échec
> immédiat sinon). En production, la configuration doit être complète.
