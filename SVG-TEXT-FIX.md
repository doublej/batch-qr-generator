# SVG Text Rendering Fix

## Problem

Text elements were not showing in SVGs generated through the UI route (`src/lib/qr-generation.ts`), but worked correctly in headless generation (`scripts/generate-headless.mjs`).

## Root Cause

The `applySVGPadding()` function in `src/lib/qr-generation.ts` was using non-anchored regex patterns to remove SVG tags:

```typescript
// OLD (BROKEN)
const innerSvg = svgString
  .replace(/<svg[^>]*>/, '')  // Matches FIRST <svg> tag (removes outer)
  .replace('</svg>', '')       // Matches FIRST </svg> tag (removes INNER!)
```

### Why This Failed

Given this structure:
```xml
<svg>              <!-- Outer container -->
  <rect/>
  <svg>            <!-- Inner QR code -->
    <path/>
  </svg>           <!-- First </svg> closing tag -->
  <text>Label</text>
</svg>             <!-- Outer closing tag -->
```

The old logic would:
1. Remove the outer opening `<svg>` ✓
2. Remove the **inner** closing `</svg>` ✗ (wrong one!)

Result:
```xml
<rect/>
  <svg>
    <path/>

  <text>Label</text>
</svg>
```

This left the `<text>` element orphaned **outside** the proper SVG structure after wrapping with `<g transform>`, causing it to not render.

## Solution

Use **anchored regex patterns** to match only the outermost tags:

```typescript
// NEW (FIXED)
const innerSvg = svgString
  .replace(/^<svg[^>]*>/, '')   // ^ = match at START of string
  .replace(/<\/svg>\s*$/, '')    // $ = match at END of string
```

### File Changed

**`src/lib/qr-generation.ts:244-248`**

### Verification

**Test with identical config values:**

| Parameter | Value |
|-----------|-------|
| text.size | 32 |
| text.position | "top" |
| text.offsetY | -24 |
| qr.size | 300 |

**Calculated values (both implementations):**
- offsetBuffer: 24
- textSpace: 75.6
- textY: 32 ✓

**Headless output:**
```xml
<text x="150" y="32" ... >Test Label</text>
```

**UI route output (after fix):**
```xml
<text x="150" y="32" ... >Test Label</text>
```

## Text Positioning Logic

Both implementations now use **identical** calculations:

```typescript
const textHeight = textSize * 1.3
const isAbove = position === 'top'
const offsetBuffer = isAbove ? Math.max(0, -offsetY) : Math.max(0, offsetY)
const textSpace = textHeight + textSpacing + offsetBuffer

if (position === 'top') {
  textY = textSize + offsetBuffer + offsetY
}
```

## Build Status

✅ Build successful: `npm run build` (6.41s)
✅ No TypeScript errors
✅ Dev server running: `http://localhost:5175/`

## Files Modified

1. **`src/lib/qr-generation.ts:244-248`** - Fixed regex anchoring in `applySVGPadding()`

## Testing

To verify the fix works:

1. Open browser to `http://localhost:5175/`
2. Enable text labels with position "top" and negative offsetY
3. Download SVG and inspect `<text>` element
4. Compare with headless: `node scripts/generate-headless.mjs config.json "url" "label" test.svg`

Both should now produce identical text positioning.
