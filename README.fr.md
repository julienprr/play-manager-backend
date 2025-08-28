# Play Manager Backend

➡️ 🇬🇧 [Version anglaise](README.md)

Ceci est le backend de l’application [**Spotify Profile**](https://github.com/julienprr/spotify-profile-frontend). Il est développé avec **NestJS** et interagit avec l’API Spotify pour permettre aux utilisateurs de gérer leurs playlists : favoris, tri automatique, copie de titres, etc.

---

## Fonctionnalités principales

- Authentification via Spotify (Authorization Code Flow)
- Récupération des playlists de l'utilisateur
- Ajout/Suppression de playlists favorites
- Activation/Désactivation du tri automatique des playlists
- Tri des playlists selon la date de sortie des titres

## Technologies utilisées

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Class Validator / Transformer](https://github.com/typestack/class-validator)

---

## Pour commencer

### Prérequis

- Node.js >= 18
- Base de données PostgreSQL
- Identifiants développeur Spotify (client ID, client secret et URI de redirection)

---

### Installation

```bash
git clone https://github.com/your-username/play-manager-backend.git
cd play-manager-backend
npm install
```

### Variables d’environnement

Créez un fichier .env à la racine avec les variables suivantes :
```env
DATABASE_URL=postgresql://user:password@localhost:5432/playmanager
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
JWT_SECRET=your_jwt_secret
```

### Lancer l’application

```bash
# development
npm run dev

# production
npm run build
npm run start:prod
```

L’API sera disponible sur [http://localhost:8000/doc](http://localhost:8000/doc).

### Base de données

```bash
npx prisma migrate dev
npx prisma studio
```

## Structure du projet

```
src/
├── auth/              # Authentication (Spotify OAuth2)
├── playlists/         # Playlist management
├── users/             # User entity and logic
├── common/            # DTOs, interceptors, decorators
├── prisma.service.ts  # Prisma integration
├── main.ts            # App entrypoint
```

## API

Le backend expose des endpoints REST pour la gestion des playlists. Tous les endpoints sont protégés par JWT.

Vous pouvez tester l’API avec des outils comme Postman ou directement via le frontend.

## Development Notes

- Le code suit les règles ESLint.
- Les DTOs sont validés via class-validator.
- Les erreurs sont lancées via HttpException avec les bons codes HTTP.

## License

Le projet est sous licence MIT — voir le fichier [LICENSE](LICENSE) pour plus d’informations
