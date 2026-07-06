# wp-veritas

[![Test](https://github.com/epfl-si/wp-veritas/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/epfl-si/wp-veritas/actions/workflows/test.yml)
[![Build](https://github.com/epfl-si/wp-veritas/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/epfl-si/wp-veritas/actions/workflows/build.yml)

Cette application a pour but de stocker et permettre l'édition de la
**source de vérité** des sites WordPress de l'EPFL :

- la liste des sites, avec leurs attributs techniques et fonctionnels;
- la liste des **environnements OpenShift**, des unités techniques d'allocation
  des ressources et de routage dans lesquelles se classent les sites,
- et d'autres listes connexes (liste des professeurs, liste des *tags*).

---

## Stack technique

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (shadcn)
- [next-intl](https://next-intl.dev/) pour l'internationalisation (fr/en)
- [next-auth v5](https://authjs.dev/) avec **Microsoft Entra ID** (SSO EPFL)
- [Mongoose](https://mongoosejs.com/) (MongoDB) pour la persistance
- [ioredis](https://github.com/redis/ioredis) (Redis) pour le cache
- [@casl/ability](https://casl.js.org/) pour la gestion des permissions
- [@kubernetes/client-node](https://github.com/kubernetes-client/javascript) pour piloter les sites hébergés sur OpenShift
- [Biome](https://biomejs.dev/) pour le lint et le format (remplace ESLint + Prettier)
- [Bun](https://bun.sh/) comme runtime/gestionnaire de paquets

---

## Prérequis

- [Bun](https://bun.sh/) (voir `bun.lock`, dernière version stable recommandée)
- [Docker](https://www.docker.com/) et Docker Compose, pour lancer MongoDB et Redis en local
- Un accès à un client **Microsoft Entra ID** (app registration EPFL) pour l'authentification — voir [Authentification](#authentification)
- (Optionnel) un `kubeconfig` valide (`~/.kube/config`) pour interagir avec les sites hébergés sur Kubernetes/OpenShift en local

---

## Démarrage rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/epfl-si/wp-veritas.git
cd wp-veritas

# 2. Copier le fichier d'environnement et le compléter
cp .env.example .env

# 3. Démarrer MongoDB et Redis
docker compose up -d

# 4. Installer les dépendances
bun install

# 5. Lancer le serveur de développement
bun dev
```

L'application est ensuite accessible sur [http://localhost:3000](http://localhost:3000).

> `docker-compose.yml` ne fournit que MongoDB (`mongo:7.0`, port `27017`) et Redis
> (`redis:7.0`, port `6379`) — l'application Next.js elle-même tourne en dehors du
> conteneur via `bun dev` (voir `Dockerfile` pour l'image de production).

---

## Authentification

**Toutes les pages de l'application nécessitent d'être connecté** via le SSO EPFL
(Microsoft Entra ID) — il n'y a pas de mode "public" ou "sans connexion", y compris
en développement local. L'accès aux différentes sections dépend ensuite des groupes
Entra de l'utilisateur (`wp-veritas-admins_AppGrpU`, `wp-veritas-editors_AppGrpU`, ...).

Pour développer en local, il faut donc :

1. disposer d'une **app registration Entra ID** (client ID / secret / tenant ID),
   avec `http://localhost:3000/api/auth/callback/microsoft-entra-id` comme
   *redirect URI* autorisée;
2. renseigner `AUTH_ENTRA_CLIENT_ID`, `AUTH_ENTRA_CLIENT_SECRET`,
   `AUTH_ENTRA_TENANT_ID` et `AUTH_SECRET` dans `.env` (voir ci-dessous);
3. faire partie d'un des groupes Entra ci-dessus pour obtenir les permissions
   nécessaires (sinon seul le groupe `public` s'applique).

---

## Variables d'environnement

Voir `.env.example` pour le modèle. Détail des variables utilisées par l'application :

| Variable | Description |
|---|---|
| `MONGO_URI` | URL de connexion MongoDB (défaut : `mongodb://localhost:27017/wp-veritas`) |
| `REDIS_URI` | URL de connexion Redis (défaut : `redis://localhost:6379`) |
| `AUTH_ENTRA_CLIENT_ID` | Client ID de l'app registration Microsoft Entra ID |
| `AUTH_ENTRA_CLIENT_SECRET` | Secret de l'app registration Microsoft Entra ID |
| `AUTH_ENTRA_TENANT_ID` | Tenant ID Microsoft Entra ID (EPFL) |
| `AUTH_SECRET` | Secret utilisé par next-auth pour signer les sessions JWT |
| `AUTH_URL` | URL publique de l'application (utilisée par next-auth pour les callbacks) |
| `EPFL_API_URL` | URL de base de l'API EPFL (personnes, unités) |
| `EPFL_API_USERNAME` / `EPFL_API_PASSWORD` | Identifiants de service pour l'API EPFL |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_IDS` | Notifications Telegram (alertes) |

Variables supplémentaires, utilisées uniquement en production/OpenShift (non
nécessaires en développement local) : `PVC_NAME`, `K8S_NAMESPACE`, `ENV`,
`APP_PORTAL_URL`, `UMAMI_URL_SCRIPT`, `UMAMI_WEBSITE_ID`.

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `bun dev` | Démarre le serveur de développement Next.js |
| `bun run build` | Build de production (génère aussi `public/openapi.json`) |
| `bun run start` | Démarre le serveur en mode production (après `build`) |
| `bun run lint` | Vérifie le code avec Biome (`biome check`) |
| `bun run format` | Formate le code avec Biome (`biome format --write`) |

---

## Documentation API

La documentation Swagger de l'API (v1 interne, v2 publique) est disponible sur
`/api-docs` une fois l'application démarrée. Le fichier `openapi.json` est généré
à partir des JSDoc des routes (`src/app/api/**/route.ts`) via `scripts/generate-openapi.js`,
exécuté automatiquement au build.

---

## Docker (production)

L'image de production est construite avec [Bun](https://bun.sh/) (`oven/bun`) en
plusieurs étapes (dépendances → build Next.js standalone → image finale minimale) :

```bash
docker build -t wp-veritas .
docker run -p 3000:3000 --env-file .env wp-veritas
```

---

## Déploiement

Le déploiement se fait via Ansible (`ops/`), piloté par les inventaires
`ops/inventory/prod.yml` et `ops/inventory/test.yml` (URL, tag d'image, etc.).
Toute modification d'infrastructure passe par Ansible, pas par des étapes manuelles.

- **Production** : https://wp-veritas.epfl.ch
- **Test** : https://wp-veritas-test.epfl.ch (accès restreint)
- **Image Docker** : `quay-its.epfl.ch/svc0041/wp-veritas`

Chaque changement de version dans `package.json` sur `master` déclenche
automatiquement un build et une *release* GitHub (voir `.github/workflows/release.yaml`).
