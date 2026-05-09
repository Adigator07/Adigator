# Layout Intelligence Engine

Deterministic geometry engine for creative layout scoring. This module does not call GPT.

## Input

Consumes `NormalizedOcrResult` from `app/lib/ocr-normalization`.

```ts
import { analyzeLayout } from "@/app/lib/layout-intelligence";

const layout = analyzeLayout({ ocr: normalizedOcr });

layout.scores.ctaVisibility;
layout.scores.layoutClarity;
layout.viewportSimulations;
```

## Metrics

The engine computes normalized 0-100 scores for:

- CTA visibility
- Text density
- Whitespace
- Clutter, where higher means less clutter
- Visual hierarchy
- Brand dominance
- Mobile readability
- Alignment
- Contrast readability
- Visual balance
- Layout clarity
- Attention distribution

## Registry Awareness

The engine uses the Intelligence Registry profile already attached to normalized OCR.

Examples:

- Luxury awareness increases whitespace and balance weighting.
- Gaming conversion increases CTA prominence and attention weighting.
- Healthcare profiles reward calmer spacing and lower clutter.

## Deterministic Signals

Signals are based on:

- normalized bounding-box area
- block overlap
- block gaps
- zone density
- hierarchy score
- attention rank
- CTA geometry
- 390px mobile viewport simulation
- OCR confidence as a proxy for contrast readability

Pixel-level contrast can be added later by passing vision/color metrics, but the current
engine remains provider-independent and OCR-geometry-first.
