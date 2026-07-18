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
- [x] Modules Schools, Grades, SchoolLists, Uploads (scénarios 1 & 2)
- [x] Modules Categories, Products
- [x] Module Orders
- [ ] Frontend

### Modules Schools / Grades / SchoolLists / Uploads — détail

- `GET /schools` (public) — recherche libre par nom/ville, écoles actives
  uniquement. `GET /schools/admin` (Admin) liste tout, y compris inactives.
  CRUD complet réservé à Admin/SuperAdmin ; suppression = désactivation
  (`isActive: false`), jamais un vrai delete — écoles référencées par des
  commandes.
- `GET /grades` (public) même logique pour les niveaux scolaires.
- **Scénario 1** — `GET /school-lists?schoolId=&gradeId=` renvoie la liste
  officielle avec ses articles (produit catalogué ou libellé libre +
  quantité). 404 explicite si aucune liste n'existe pour ce couple
  école/niveau, pour orienter le front vers le scénario 2.
  `POST /school-lists/official` (Admin) crée/remplace la liste officielle.
- **Scénario 2** — `POST /school-lists/custom` (public) : le visiteur
  soumet une liste via photo, fichier ou texte libre quand son école
  n'existe pas. Validation conditionnelle (`fileUrl` requis pour
  photo/fichier, `rawText` requis pour saisie manuelle).
- `POST /uploads` (public, multipart) — upload générique utilisé pour la
  photo/fichier du scénario 2 ; restreint aux images et PDF, 5 Mo max,
  stockage disque en dev (à remplacer par un bucket S3-compatible en prod).
- Tests unitaires sur les trois services (recherche publique, 404,
  désactivation, scénario 1 vs 2 avec validation croisée des champs).

### Module Orders — détail

- `POST /orders` (public) — création sans compte. Pour chaque article : si
  `productId` est fourni, prix et libellé viennent du catalogue (le client
  ne peut pas falsifier le prix depuis le front) ; sinon l'article est
  "libre" (ex: issu d'une liste scolaire personnalisée non cataloguée) et
  le prix vient du client, ajustable ensuite par le commercial. Aucune
  entrée `OrderHistory` à la création : l'historique ne trace que les
  changements après coup.
- `orderNumber` humain (`ELC-2026-000123`) généré à partir du nombre de
  commandes de l'année en cours ; une collision (unique constraint, deux
  créations concurrentes) déclenche une régénération + retry côté service
  plutôt qu'une transaction dédiée — le volume attendu ne justifie pas un
  compteur séquentiel en base pour l'instant.
- `POST /orders/track` (public) — suivi par `orderNumber` + `customerPhone`
  combinés : un UUID/numéro seul ne suffit pas, pour empêcher qu'un tiers
  devine l'URL et consulte les coordonnées d'un autre client.
- `GET /orders` (Commercial/Admin/SuperAdmin) — liste filtrable (statut,
  école, niveau, commercial assigné, période, recherche libre nom/téléphone/
  numéro) : sert aux "commandes du jour" du back-office Commercial.
- `PATCH /orders/:id` — édition client/adresse/note ; chaque champ modifié
  génère sa propre entrée `OrderHistory` (`ADDRESS_UPDATED`, `NOTE_ADDED`,
  `OTHER`).
- `PATCH /orders/:id/status` — changement de statut avec garde-fou : aucune
  action sur une commande déjà `DELIVERED`/`CANCELLED` (états terminaux), et
  interdiction de revenir en arrière dans la séquence des statuts, sauf pour
  `CANCELLED` qui reste atteignable depuis n'importe quel statut non
  terminal. Le passage à `CONFIRMED` ajoute en plus une entrée
  `ORDER_CONFIRMED`.
- `PATCH /orders/:id/assign` — assignation/réassignation d'un commercial.
- `POST /orders/:id/items`, `PATCH /orders/:id/items/:itemId`,
  `DELETE /orders/:id/items/:itemId` — gestion des articles après création,
  chacun tracé (`PRODUCT_ADDED` / `QUANTITY_CHANGED` / `PRODUCT_REMOVED`) et
  recalcul du `totalAmount`. Impossible de retirer le dernier article d'une
  commande.
- Génération PDF + QR Code volontairement hors scope de ce module (`pdfUrl`/
  `qrCodeUrl` restent `null` pour l'instant) : portée par les modules `PDF`
  et `Uploads`/`QrCode` à venir dans la feuille de route.

Prochaine étape : modules `Visitors` / `Analytics` (tracking anonyme,
événements génériques, métriques dérivées).

### Modules Categories / Products — détail

- `GET /categories` (public) renvoie l'arborescence (catégories racines +
  enfants) pour les filtres du catalogue.
- Suppression de catégorie = vrai `delete` (pas de soft delete) mais
  seulement si elle est vide (pas d'enfants ni de produits) — sinon 400.
  Contrairement aux écoles/produits, une catégorie n'est jamais référencée
  par une commande historique.
- `GET /products` (public) recherche par nom/catégorie, produits actifs
  uniquement — utilisé quand le visiteur ajoute des fournitures en plus de
  la liste officielle.
- `PATCH /products/:id/stock` est un endpoint dédié (séparé de l'édition
  générale) pour que la gestion de stock puisse être auditée/tracée
  indépendamment plus tard (module Audit).
- Suppression produit = désactivation, jamais un vrai delete (référencé par
  `OrderItem` et `SchoolListItem`).
