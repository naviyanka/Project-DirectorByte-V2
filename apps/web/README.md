# DirectorByte Web

The frontend application for DirectorByte. A modern, high-performance React application built with Vite.

## Architecture

- **Vite**: Ultra-fast build tool and dev server.
- **Zustand**: Lightweight, predictable state management.
- **React Query**: Powerful server-state management and caching.
- **Framer Motion**: Production-grade animation library.
- **CSS Modules**: Scoped styling using vanilla CSS.

## Feature-Based Structure

The application is organized by features in `src/features/`. Each feature contains its own:
- `/components`: Local UI components.
- `/hooks`: Feature-specific hooks.
- `/services`: API interaction logic.
- `/store`: Feature-specific Zustand stores (if needed).

## Development

### 1. Install dependencies
```bash
npm install
```

### 2. Run dev server
```bash
npm run dev
```

### 3. Build for production
```bash
npm run build
```

## Design System
Refer to `src/design-system/` for global tokens, theme definitions, and reusable atomic components.
