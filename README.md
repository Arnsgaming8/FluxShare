# FluxShare

A physics-driven, no-signup file sharing platform with unique mechanics.

## Features

- **Gravity Rooms** - Files float and fall with physics simulation (Normal, Zero-G, Reverse gravity)
- **Quantum Links** - State-changing URLs that evolve on each access (Full → Partial → Collapsed)
- **Directional Sharing** - N/E/S/W permission links (Full, View, Download, Metadata)
- **Cryo-Storage** - Freeze files immutably with a passphrase
- **Puzzle-Unlock** - Micro-puzzles (Slide, Rotate, Match, Logic) instead of passwords
- **Mirror-Mode** - Download requires uploading a file first
- **File DNA Trails** - Visual representation of file metadata

## Tech Stack

- Frontend: Vanilla JavaScript, CSS (static for GitHub Pages)
- Backend: Node.js + Express + SQLite
- Deployment: Docker

## Deployment

### Backend (Render/Railway/Fly.io)

1. Deploy using docker-compose or Dockerfile
2. Set environment variable `API_BASE_URL` to your backend URL

### Frontend (GitHub Pages)

1. Push to GitHub
2. Go to Settings → Pages
3. Source: Deploy from a branch
4. Branch: main, folder: docs
5. Update `API_BASE_URL` in `docs/api.js` to point to your backend

## Docker Deployment

```bash
# Build and run
docker-compose up -d

# Backend runs on port 8080
```

## API Endpoints

- `POST /api/rooms` - Create room
- `GET /api/rooms/:id` - Get room
- `POST /api/rooms/:id/gravity` - Set gravity mode
- `POST /api/rooms/:id/mirror-mode` - Toggle mirror mode
- `POST /api/rooms/:id/directional-links` - Generate directional links
- `POST /api/rooms/:id/files` - Upload file
- `GET /api/files/:id` - Get file info
- `GET /api/files/:id/download` - Download file
- `POST /api/files/:id/freeze` - Freeze file
- `POST /api/files/:id/thaw` - Thaw file
- `POST /api/quantum-links` - Create quantum link
- `POST /api/quantum-links/:id/access` - Access quantum link
- `POST /api/puzzle-locks` - Create puzzle lock
- `POST /api/puzzle-locks/:id/solve` - Solve puzzle
