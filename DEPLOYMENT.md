# Deployment

## Quick Deploy

```bash
npm run deploy
```

## Setup

1. Ensure Caddy volume mounted: `ls /Volumes/Container/caddy/www/`
2. Add import to main Caddy config: `import /www/data-driven-qr-generator.jurrejan.com/Caddyfile`
3. Reload Caddy: `docker exec caddy caddy reload`

## Verify

Visit https://data-driven-qr-generator.jurrejan.com

## Path Mapping

| Location | Path |
|----------|------|
| Host machine (macOS) | `/Volumes/Container/caddy/www/data-driven-qr-generator.jurrejan.com/` |
| Inside container | `/www/data-driven-qr-generator.jurrejan.com/` |

## Next Steps

1. Run deployment: `npm run deploy` (copies build files + Caddyfile)
2. Import Caddyfile in your main Caddy config: `import /www/data-driven-qr-generator.jurrejan.com/Caddyfile`
3. Reload Caddy: `docker exec caddy caddy reload`
4. Visit: https://data-driven-qr-generator.jurrejan.com

## Troubleshooting

**Volume not mounted:**
```bash
docker ps
ls /Volumes/Container/caddy/www/
```

**Site not loading:**
- Verify Caddyfile added to Caddy config
- Reload Caddy: `docker exec caddy caddy reload`
- Check logs: `docker logs caddy`
