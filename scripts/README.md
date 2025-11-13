# Headless QR Generator

Generate QR codes from the command line using config files.

## Usage

```bash
npm run generate <config.json> <text> [label] [output.png]
```

Or directly with Node.js:

```bash
node scripts/generate-headless.mjs <config.json> <text> [label] [output.png]
```

## Example

```bash
npm run generate configs/test-config.json "https://example.com" "Example Label" output.png
```

## Config Format

See `configs/test-config.json` and `configs/test-above.json` for examples. The config should match the `QRDesignOptions` interface from `src/lib/config.ts`.

### Config Structure

```json
{
  "qr": {
    "size": 300,
    "padding": { "top": 16, "right": 16, "bottom": 16, "left": 16 },
    "errorCorrection": "M",
    "dpi": 300
  },
  "logo": {
    "enabled": false,
    "dataURL": "",
    "size": 60,
    "fit": "contain",
    "placement": "center"
  },
  "text": {
    "enabled": true,
    "size": 16,
    "position": "bottom",
    "offsetX": 0,
    "offsetY": 10,
    "align": "center",
    "font": "Arial",
    "weight": "normal",
    "color": "#000000",
    "rotation": 0
  },
  "colors": {
    "background": "#FFFFFF",
    "foreground": "#000000",
    "border": "#000000",
    "borderWidth": 0,
    "eyeColor": "#000000",
    "dataModuleColor": "#000000"
  },
  "gradient": {
    "enabled": false,
    "type": "linear",
    "start": "#000000",
    "end": "#666666",
    "angle": 0
  }
}
```

## Testing Text Positioning

Test text above QR:
```bash
npm run generate configs/test-above.json "https://example.com" "Above Text" test-above.png
```

Test text below QR:
```bash
npm run generate configs/test-config.json "https://example.com" "Below Text" test-below.png
```

## Notes

- Uses pure Node.js ESM (`.mjs`) for compatibility with the qrcode library
- Implements the same text positioning logic as the browser version
- Text above QR: negative offsetY expands canvas upward
- Text below QR: positive offsetY expands canvas downward
