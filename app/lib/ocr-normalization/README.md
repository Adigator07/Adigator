# OCR Normalization Engine

This layer converts raw OCR provider output into deterministic creative-intelligence signals.
It does not run OCR itself and does not call GPT.

## Pipeline

```txt
RawOcrInput
-> clean text
-> build text blocks
-> normalize coordinates
-> infer hierarchy and reading order
-> classify text block roles
-> detect CTA state and confidence
-> build normalized schema
```

## Registry Integration

The engine requires `campaignGoal` and `vertical`. These are normalized through the
Intelligence Registry and used to tune CTA expectations, emotional signals, scoring
preferences, and design psychology rules.

```ts
import { normalizeOcr } from "@/app/lib/ocr-normalization";

const result = normalizeOcr(rawOcr, {
  campaignGoal: "conversion",
  vertical: "gaming",
});

result.ctaDetection;
result.schema.headline;
result.schema.offerText;
```

## CTA States

The CTA detector is intentionally conservative:

- `explicit`: phrase evidence plus button-like/layout evidence.
- `implicit`: soft action or emotional action language with enough context.
- `none`: no candidate passes deterministic confidence thresholds.

This prevents creatives with emotional copy such as "Feel confident today" from being
incorrectly treated as having a real CTA button.

## Normalized Schema

The output groups blocks into:

- `headline`
- `cta`
- `emotionalCopy`
- `offerText`
- `supportingText`
- `disclaimers`
- `brandingText`

Each block keeps normalized coordinates, hierarchy score, role confidence, OCR confidence,
tokens, and deterministic feature flags.
