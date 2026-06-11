# Doujin Game Manager

<p align="center">
 <img src="https://cdn.mikn.dev/branding/mikan-vtube.png" width="100">
</p>

<p align="center">imple app to manage and play web-based RPG Maker (or any web-based) games within your browser</p>

- Simple game picker frontend
- Easy game management; just add the files and edit `games.json`
- Simple to host (Docker compose with no external dependencies)
- Fully static deployment (if you don't need the Cloud save API)
- Easy file-based export/import of local storage (game saves)
- Optional selfhostable Cloud Save API included for easy transfer of progress between devices

## Stack
### Frontend
- React
- Vite
- React Router 7 (Declarative mode)
- daisyUI

### Backend
- Elysia
- Bun
- Redis

Setup guide: https://docs.mikn.dev/solutions/selfhost-guides/doujin-game-manager