# Gym Frontend - Documentation Complete

Frontend Angular du projet Gym Tracker.

Ce document est volontairement detaille pour servir de reference technique pendant le developpement, les tests et la presentation du projet.

## 1. Objectif du frontend

Le frontend permet de:

- gerer l'authentification des utilisateurs
- afficher les programmes et seances
- permettre les inscriptions et annulations de reservations
- consulter les abonnements et plans
- fournir des espaces dedies selon les roles (admin, coach, membre)

Le frontend consomme les APIs REST exposees par le backend Spring Boot.

## 2. Stack technique

- Angular 19
- TypeScript
- RxJS
- Angular Router
- HTTP Interceptor JWT
- Nginx (serving en mode Docker)

## 3. Prerequis

- Node.js 20 ou plus
- npm 10 ou plus
- Backend accessible localement ou via Docker

## 4. Installation

Depuis le dossier frontend:

```bash
npm install
```

## 5. Lancement en mode developpement

### 5.1 Commande standard

```bash
npm start
```

Equivalent:

```bash
ng serve
```

URL locale par defaut:

- http://localhost:4200

### 5.2 Si le port 4200 est deja occupe

```bash
ng serve --port 4201
```

## 6. Build production

```bash
npm run build
```

Sortie build:

- dist/gym-frontend

Le build est consomme par Nginx dans le conteneur frontend.

## 7. Scripts npm disponibles

D apres package.json:

```bash
npm start        # ng serve
npm run build    # ng build
npm run watch    # ng build --watch --configuration development
npm test         # ng test
```

## 8. Configuration des environnements

Fichiers utilises:

- src/environments/environment.ts
- src/environments/environment.development.ts
- src/environments/environment.production.ts

Configuration observee:

- dev: apiUrl = http://localhost:8081/api
- production: apiUrl = /api

Important:

- en mode local hors Docker, verifier que l'URL backend correspond au port backend reel
- en mode Docker + Nginx proxy, la valeur /api est recommandee

## 9. Architecture applicative (frontend)

Structure principale sous src/app:

- components: composants partages (ex: header)
- pages: pages fonctionnelles
- core/services: services metier de consommation API
- services: services transverses (auth)
- guards: protection de routes
- interceptors: injection token JWT
- models: interfaces/types metier
- modules: modules fonctionnels (ex: members)

## 10. Routing principal

Routes configurees dans app-routing.module.ts:

- / -> Home
- /programmes
- /programmes/:id
- /plans
- /mes-inscriptions (auth)
- /mon-abonnement (auth)
- /login
- /register
- /admin (ROLE_ADMIN)
- /coach (ROLE_COACH)
- /members (lazy loaded)
- /forbidden

Fallback:

- wildcard redirige vers /

## 11. Securite frontend

### 11.1 Interceptor JWT

Le fichier src/app/interceptors/auth.interceptor.ts ajoute automatiquement:

- Authorization: Bearer <token>

sur les requetes HTTP quand un token est present en localStorage.

### 11.2 Guards

- AuthGuard: bloque les routes privees si utilisateur non connecte
- RoleGuard: verifie les roles requis et redirige vers /forbidden

### 11.3 Gestion du token

AuthService gere:

- login/logout
- stockage du JWT
- extraction des roles depuis le payload
- helpers isLoggedIn, hasRole, getPrimaryRoleLabel

## 12. Fonctionnalites couvertes

- Login/logout
- Gestion d'acces par role
- Consultation des cours et horaires
- Inscription a une seance
- Annulation d'inscription
- Consultation des plans et abonnements
- Dashboard admin
- Dashboard coach

## 13. Regles metier visibles cote frontend

Le frontend respecte les regles renvoyees par le backend, notamment:

- inscription a une seance reservee a un membre avec abonnement actif
- controles de role sur les espaces admin et coach

En cas de refus backend, le frontend doit afficher le message metier recu.

## 14. Execution Docker (frontend)

### 14.1 Build image frontend seule

```bash
docker build -t gym-frontend .
```

### 14.2 Run image frontend seule

```bash
docker run --rm -p 4200:4200 gym-frontend
```

### 14.3 Avec la stack compose globale

Depuis le dossier Desktop (compose a la racine):

```bash
docker-compose up -d --build
```

Dans la config actuelle, le frontend est publie sur:

- http://localhost:4201

## 15. Verification rapide apres demarrage

1. Ouvrir la page frontend (4200 local ou 4201 docker)
2. Ouvrir l'onglet Network du navigateur
3. Verifier que les appels API partent vers:
   - /api/... en prod/docker
   - ou l'URL dev configuree en local
4. Verifier les reponses 200/401/403/409 selon les cas metier

## 16. Depannage

### 16.1 Port 4200 deja utilise

Cause:

- un autre ng serve ou process node/java est deja actif

Actions:

- lancer sur un autre port: ng serve --port 4201
- ou arreter le process occupant 4200

### 16.2 Erreur CORS

Verifier:

- config CORS backend
- URL API frontend
- utilisation proxy /api en Docker

### 16.3 Donnees non affichees

Verifier:

- backend demarre
- endpoint API repond manuellement (browser/curl)
- token present si endpoint protege
- erreurs console frontend

### 16.4 Build Angular echoue

Verifier:

- version Node compatible
- npm install a jour
- erreurs TypeScript dans les composants/services modifies

## 17. Conventions de dev recommandees

- centraliser les appels API dans les services
- garder les composants concentrer sur la presentation et l'orchestration UI
- utiliser les models TypeScript pour typer les payloads
- traiter les erreurs backend de maniere explicite dans l'UI
- eviter les URLs hardcodees dans les composants

## 18. Commandes Angular utiles

```bash
ng generate component pages/nom-page
ng generate service core/services/nom-service
ng generate guard guards/nom-guard
ng generate module modules/nom-module
```

## 19. Notes presentation projet

Points forts a mettre en avant:

- architecture claire orientee roles
- securisation JWT + guards + interceptor
- parcours membre complet (plans, abonnement, reservation)
- support execution locale et Docker
- base evolutive pour futures fonctionnalites
