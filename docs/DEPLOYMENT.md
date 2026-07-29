# Deployment

## Build

```bash
npm run build
```

Output is in `dist/` — a fully static site.

## Static Host Options

### Cloudflare Pages

1. Push repo to GitHub/GitLab
2. Connect to Cloudflare Pages
3. Build command: `npm run build`
4. Output directory: `dist`
5. No special routing needed (single-page app)

### Nginx

```nginx
server {
    listen 80;
    server_name echoes.example.com;
    root /var/www/echoes-below/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

## Local Preview

```bash
npm run preview
```

## Environment

No environment variables or API keys needed. The game runs entirely in the browser.

## Save Data

Saves are stored in `localStorage`. Clearing browser data will delete saves.

To back up saves manually:
1. Open browser DevTools → Application → Local Storage
2. Find key `echoes-below-save`
3. Export the JSON

## Performance Targets

- 60 FPS on modern mid-range desktop
- 30 FPS on integrated graphics
- ~600 KB initial download (compressed)

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 90+
- Safari 15+
- Opera 76+
