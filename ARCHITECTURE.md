# elCartable — Analyse & Architecture

## 1. Résumé du besoin

Plateforme SaaS permettant aux familles marocaines de commander des fournitures
scolaires et manuels avec paiement à la livraison, doublée d'un back-office
pour les commerciaux et administrateurs.

## 2. Décisions d'architecture

### Monorepo
```
/apps
  /backend   -> NestJS (API REST)
  /frontend  -> React 19 + Vite
/packages
  /shared    -> types partagés (DTOs, enums) entre frontend et backend
```

### Modèle utilisateur unique avec rôles
Plutôt que 3 modèles séparés (Commercial / Admin / SuperAdmin), un seul modèle
`User` avec un enum `role` (`COMMERCIAL`, `ADMIN`, `SUPER_ADMIN`). Ça simplifie
l'auth (un seul flux JWT/Passport), les guards NestJS (`@Roles()`), et évite la
duplication de logique. Le flux d'invitation du commercial (`mustSetPassword`,
`invitationCode`, `invitationExpires`) est porté directement par ce modèle.

### Panier visiteur = état front, pas de modèle DB
Le panier avant validation n'existe que côté client (localStorage), conforme
au besoin ("le panier est stocké localement", "aucun compte n'est nécessaire").
Il n'entre en base qu'au moment de la création de la `Order` + `OrderItem[]`.

### Historique des commandes = append-only
`OrderHistory` ne stocke jamais de suppression : chaque changement (quantité,
adresse, statut, ajout/suppression produit) crée une nouvelle ligne avec
`oldValue`/`newValue`. Rien n'est écrasé ni supprimé, conformément à
l'exigence de traçabilité.

### Analytics générique par événements
Plutôt qu'une table par type de mesure (scroll, clic, vue produit...), un
modèle `AnalyticsEvent` avec un enum `type` + un champ `metadata: Json` libre.
Ça permet d'ajouter de nouveaux types d'événements sans migration, et de
calculer ensuite les métriques dérivées (panier moyen, taux d'abandon, temps
moyen avant validation) par agrégation.

### A/B testing prévu, pas branché
`ABTest` / `ABTestVariant` posent le schéma nécessaire (clé, variantes,
pondération) sans qu'aucune logique de assignment ne soit encore active côté
frontend — activable plus tard sans migration.

### Audit transverse
`AuditLog` est un modèle indépendant de `OrderHistory` : il couvre toutes les
actions systèmes (connexion, déconnexion, création, modification, suppression,
téléchargement PDF, consultation, export) sur n'importe quelle entité, pas
seulement les commandes.

## 3. Schéma de données

Voir [`apps/backend/prisma/schema.prisma`](apps/backend/prisma/schema.prisma) —
schéma complet : Users, Schools, Grades, SchoolLists, Products, Categories,
Orders, OrderItems, OrderHistory, Visitors, Analytics, ABTesting, AuditLogs,
Notifications, Settings.

## 4. Modules backend (NestJS) — ordre de développement

1. `Auth` — JWT, Passport, invitation flow commercial
2. `Users` / `Admins` / `Commercials` (contrôleurs dédiés au-dessus du modèle `User`)
3. `Schools`, `Grades`, `SchoolLists` (scénarios 1 & 2)
4. `Products`, `Categories`
5. `Orders`, `OrderItems`, `OrderHistory`
6. `Visitors`, `Analytics`
7. `Dashboard` (agrégations pour Admin/SuperAdmin)
8. `Audit`
9. `Uploads` (Multer — photos de listes scolaires scénario 2)
10. `PDF` (fiche de commande + QR Code)
11. `Notifications`
12. `Settings`

Chaque module suit le même cycle : schéma Prisma → DTOs + validation
(`class-validator`) → service (Repository pattern) → contrôleur → tests →
documentation Swagger — avant de passer au module suivant.

## 5. Frontend — ordre de développement

1. Setup Vite + Tailwind 4 + charte graphique (violet `#A090CC`, jaune
   `#F4C542`, turquoise `#74C8C6`, blanc)
2. Landing page + recherche école/niveau
3. Parcours panier (scénario 1 + scénario 2) + validation commande
4. Suivi de commande (timeline de statuts)
5. Back-office Commercial (commandes du jour, édition, PDF, statuts)
6. Back-office Admin / Super Admin (CRUD écoles/niveaux/produits, stats,
   gestion commerciaux/admins)

## 6. État actuel

- [x] Structure monorepo
- [x] Schéma Prisma complet
- [x] Module Auth (JWT + Passport + flux d'invitation commercial + tests)
- [ ] Modules métier (Schools, Grades, SchoolLists, Products, Categories...)
- [ ] Frontend

### Module Auth — détail de ce qui est livré

- Connexion email + mot de passe (`POST /api/v1/auth/login`) via stratégie
  Passport `local`, pour Commercial / Admin / Super Admin.
- Flux d'invitation Commercial :
  - `POST /api/v1/auth/invitations` (Admin/SuperAdmin uniquement, protégé par
    `JwtAuthGuard` + `RolesGuard`) crée le compte avec `mustSetPassword: true`
    et un code d'invitation à durée limitée.
  - `POST /api/v1/auth/invitations/accept` (email + code + nouveau mot de
    passe) active le compte et renvoie directement les tokens.
- `POST /api/v1/auth/refresh` pour renouveler l'access token via le refresh
  token, sans redemander les identifiants.
- Guards réutilisables par tous les futurs modules : `JwtAuthGuard`,
  `RolesGuard` + décorateur `@Roles(...)`, décorateur `@CurrentUser()`.
- Gestion d'erreurs centralisée (`AllExceptionsFilter`) qui traduit aussi les
  erreurs Prisma (contrainte unique, ressource introuvable) en réponses HTTP
  cohérentes.
- Script de seed (`prisma/seed.ts`) pour créer le tout premier Super Admin
  (bootstrap, sinon personne ne peut inviter personne).
- Tests unitaires du service (`auth.service.spec.ts`) : login, invitation,
  code invalide/expiré, activation du compte.
- Documentation Swagger sur chaque endpoint (`/docs`).

Prochaine étape : modules `Schools`, `Grades`, `SchoolLists` (scénarios 1 & 2
de commande) puis `Products`/`Categories`.
