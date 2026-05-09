# Behavioral Intelligence Dataset Schema

Production-grade intelligence structure for Creative Intelligence Platform.

---

## Profile Structure

Each `goal + vertical` combination generates a normalized intelligence profile.

### Required Fields Per Profile

```
{
  goal: "awareness" | "consideration" | "conversion"
  vertical: VerticalKey
  
  // Emotional Psychology
  emotionalTriggers: string[]
  expectedEmotions: { emotion: string, confidence: 0-1, priority: "high"|"medium"|"low" }[]
  
  // CTA Intelligence
  ctaExpectations: {
    required: boolean
    strength: "soft" | "medium" | "strong" | "direct"
    aggressionLevel: "low" | "medium" | "high" | "critical"
    examples: string[]
  }
  
  // Layout Intelligence
  layoutExpectations: {
    density: "minimal" | "balanced" | "information-rich" | "direct-response"
    whitespaceMin: number (%)
    whitespaceMax: number (%)
    hierarchy: "clear" | "nested" | "distributed"
    mobileReadabilityPriority: "low" | "medium" | "high" | "critical"
    preferredZones: string[]
  }
  
  // Visual Psychology
  visualPsychology: {
    energy: "low" | "medium" | "high"
    colorPalette: {
      primary: string[]
      secondary: string[]
      avoid: string[]
    }
    typographyStyle: "minimal" | "moderate" | "bold"
    brandingProminence: "subtle" | "balanced" | "dominant"
  }
  
  // Trust & Credibility
  trustExpectations: {
    trustSignalsRequired: boolean
    credibilityIndicators: string[]
    averageConfidence: 0-1
  }
  
  // Conversion Psychology
  conversionPressure: "low" | "medium" | "high" | "critical"
  
  // Scoring Weights (normalized to sum to 1.0)
  scoringWeights: {
    visualClarity: number
    ctaClarity: number
    trustSignals: number
    offerClarity: number
    brandRecall: number
  }
  
  // Deterministic Rules
  recommendationRules: {
    cta: Rule[]
    layout: Rule[]
    emotion: Rule[]
    copy: Rule[]
  }
  
  // Anti-Patterns
  avoidPatterns: {
    visual: string[]
    layout: string[]
    cta: string[]
    copy: string[]
  }
}
```

### Rule Structure

```
Rule: {
  id: string
  trigger: string (condition)
  severity: "low" | "medium" | "high" | "critical"
  recommendation: string
  expectedImpact: number (0-100, estimated score delta)
}
```

---

## Vertical Keys

```
"automotive"
"banking"
"ecommerce"
"education"
"entertainment"
"finance"
"food"
"gaming"
"healthcare"
"hotels"
"luxury"
"news_media"
"real_estate"
"sports"
"technology"
"travel"
```

---

## Goal-Specific Characteristics

### Awareness
- **Purpose**: Attention, recall, discovery
- **CTA Style**: Soft
- **Pressure**: Low
- **Trust**: Moderate
- **Emotional**: High priority
- **Conversion Pressure**: Critical LOW

### Consideration
- **Purpose**: Evaluation, comparison, research
- **CTA Style**: Medium
- **Pressure**: Medium
- **Trust**: High priority
- **Information**: High priority
- **Conversion Pressure**: Moderate

### Conversion
- **Purpose**: Action, commitment, purchase
- **CTA Style**: Strong to Direct
- **Pressure**: High
- **Urgency**: High
- **Trust**: Critical
- **Conversion Pressure**: Critical HIGH

---

## Scoring Weight Defaults

### By Goal

**Awareness** (emotional-first):
```
visualClarity:  0.25
ctaClarity:     0.10
trustSignals:   0.15
offerClarity:   0.10
brandRecall:    0.40
```

**Consideration** (information-balanced):
```
visualClarity:  0.20
ctaClarity:     0.25
trustSignals:   0.30
offerClarity:   0.15
brandRecall:    0.10
```

**Conversion** (action-focused):
```
visualClarity:  0.15
ctaClarity:     0.35
trustSignals:   0.20
offerClarity:   0.25
brandRecall:    0.05
```

---

## Normalization Rules

### Emotional Triggers
- Use lowercase, hyphen-separated for consistency
- Examples: `urgency`, `family-care`, `social-connection`
- Maximum 10 per profile
- Confidence ranges 0.6-1.0 for primary, 0.3-0.6 for secondary

### CTA Examples
- Minimum 10 examples per profile
- Maximum 15 examples
- Must reflect goal + vertical combination
- Should vary in length (3-6 words each)
- Use imperative verbs: Discover, Explore, Learn, Watch, Join, Compare, etc.

### Layout Expectations
- Whitespace: 15-50% range for most profiles
- Density: Must be one of four standard values
- Hierarchy: Clear (distinct heading, single focal point), Nested (progressive disclosure), or Distributed (equal visual weight)

### Color Palettes
- Primary: 2-4 colors
- Secondary: 1-2 accent colors
- Avoid: 1-3 colors
- Reason: Brief psychology explanation

### Avoidance Patterns
- Visual: flashing, aggressive effects, unclear contrast
- Layout: extreme clutter, insufficient whitespace, poor hierarchy
- CTA: misaligned aggression, unclear action, vague language
- Copy: generic messaging, lack of benefit, fear-based (unless conversion)

---

## Machine Parsing Notes

- Use consistent delimiters for section parsing
- All arrays use `|` separator when written inline
- Boolean values: `true` | `false` (lowercase)
- Numeric values: integers or decimals as appropriate
- Enums: lowercase, hyphen-separated

---

## Integration Points

### Intelligence Registry
- Datasets feed directly into registry profiles
- No transformation required beyond parsing
- Profile lookup: `goal + vertical → profile object`

### Scoring Engine
- Uses `scoringWeights` for dimension calculation
- Uses `trustExpectations` for credibility signals
- Uses `conversionPressure` for goal alignment penalties

### Recommendation Engine
- Uses `recommendationRules` for deterministic suggestions
- Uses `avoidPatterns` for severity detection
- Uses `ctaExpectations` for CTA alignment checks

### OCR Analysis
- Uses `layoutExpectations` for hierarchy interpretation
- Uses `typographyStyle` for text analysis expectations
- Uses `colorPalette` for color-based emotion inference

### CTA Intelligence
- Uses `ctaExpectations` for strength detection
- Uses `emotionalTriggers` for emotional alignment
- Uses `ctaExamples` for matching/scoring

### Layout Intelligence
- Uses `layoutExpectations` for readability scoring
- Uses `visualPsychology` for hierarchy analysis
- Uses `whitespaceExpectations` for clutter detection

---

## Version Control

- Schema Version: 1.0.0-phase1
- Last Updated: 2026-05-09
- Stability: Production
- Breaking Changes: None planned
