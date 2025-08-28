# Play Manager Backend

➡️ 🇫🇷 [French version](README.fr.md)

This is the backend of the [**Spotify Profile**](https://github.com/julienprr/spotify-profile-frontend) application. It is built with **NestJS** and interacts with the Spotify API to allow users to manage their playlists: favorites, auto-sorting, copying tracks, etc.

---

## Main Features

- Authentication via Spotify (Authorization Code Flow)
- Fetching the user's playlists
- Adding/Removing favorite playlists
- Enabling/Disabling automatic playlist sorting
- Sorting playlists by track release date

## Technologies Used

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Class Validator / Transformer](https://github.com/typestack/class-validator)

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database
- Spotify Developer credentials (client ID, client secret, and redirect URI)

---

### Installation

```bash
git clone https://github.com/your-username/play-manager-backend.git
cd play-manager-backend
npm install
```

### Environment Variables

Create a `.env` file at the root with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/playmanager
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
JWT_SECRET=your_jwt_secret
```

### Running the App

```bash
# development
npm run dev

# production
npm run build
npm run start:prod
```

Api will be available at [http://localhost:8000/doc](http://localhost:8000/doc).

### Database

```bash
npx prisma migrate dev
npx prisma studio
```

## Project Structure

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

The backend exposes REST endpoints for managing playlists. All endpoints are protected by JWT.

You can test the API with tools like Postman or directly through your frontend.

## Development Notes

- Code style follows ESLint rules.
- DTOs are validated using `class-validator`.
- Errors are thrown using `HttpException` with appropriate status codes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
