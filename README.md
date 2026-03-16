# FluxShare

A minimal Next.js starter template for building modern web applications.

## Features

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with Server Components
- **Tailwind CSS v4** - Utility-first CSS framework
- **TypeScript** - Type-safe development
- **Static Export** - Deployable to any static hosting (GitHub Pages, Vercel, Netlify)
- **Google Fonts** - Geist Sans and Geist Mono fonts

## Tech Stack

- Next.js 16.1.3
- React 19.2.3
- Tailwind CSS 4.1.17
- TypeScript 5.9.3
- Bun (package manager)

## Deployment

This project is configured for GitHub Pages deployment in the `docs/` folder.

1. Push changes to GitHub
2. Go to Repository Settings → Pages
3. Source: Deploy from a branch
4. Branch: main, folder: docs
5. Save

## Project Structure

```
├── src/
│   └── app/
│       ├── layout.tsx    # Root layout
│       ├── page.tsx     # Home page
│       └── globals.css  # Global styles
├── docs/                # Static export (GitHub Pages)
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind configuration
└── package.json         # Dependencies
```
