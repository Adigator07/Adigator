# Awareness Campaign Behavioral Intelligence Dataset

Production-grade intelligence dataset for awareness-stage creatives.

**Goal**: Attention, recall, discovery, emotional association

---

## Awareness Campaign Characteristics

| Dimension | Value |
|-----------|-------|
| **Primary Focus** | Emotional engagement + Brand recall |
| **CTA Pressure** | Low (soft CTAs only) |
| **Trust Priority** | Moderate |
| **Conversion Pressure** | Critical LOW |
| **Visual Energy** | High to Medium-High |
| **Information Load** | Minimal |
| **Urgency** | None |

---

## AUTOMOTIVE — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: automotive
- **Emotional Priority**: HIGH
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`speed | power | luxury | adventure | freedom | confidence | precision | control | lifestyle-identity | aspiration | status | performance`

### Expected Emotions
- `adventure`: confidence 0.95
- `freedom`: confidence 0.90
- `power`: confidence 0.85
- `status`: confidence 0.80
- `precision`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Discover the Drive
  2. Feel the Power
  3. Experience Performance
  4. Drive the Future
  5. Explore New Roads
  6. Redefine Adventure
  7. Built for the Journey
  8. See What Moves You
  9. Experience Freedom
  10. Start Your Next Journey
  11. Precision in Motion
  12. Engineered for Life
  13. Explore the Road Ahead
  14. Drive Innovation
  15. Feel Every Moment

### Layout Intelligence
- **Density**: balanced
- **Whitespace**: 25-40%
- **Hierarchy**: clear
- **Mobile Priority**: high
- **Preferred Zones**: top (hero), bottom (CTA)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: black, gray, metallic, white
- **Secondary Colors**: dark-blue, matte-silver, accent-red
- **Avoid**: pastel, pale, low-contrast
- **Typography**: bold, modern, confidence-driven
- **Branding**: balanced (not dominant on awareness stage)

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: engineering precision, safety stats
- **Average Confidence**: 0.70

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.25
ctaClarity:     0.08
trustSignals:   0.12
offerClarity:   0.05
brandRecall:    0.50
```

### Recommendation Rules

**CTA Rules**:
- id: `cta_too_aggressive` | trigger: strength >= 3 | severity: high | recommendation: Use softer action verb | impact: +12

**Layout Rules**:
- id: `hierarchy_unclear` | trigger: visualHierarchy < 60 | severity: high | recommendation: Strengthen focal point with motion or contrast | impact: +18
- id: `motion_missing` | trigger: !has_motion && energy_score < 50 | severity: medium | recommendation: Add cinematic transition or motion effect | impact: +15

**Emotion Rules**:
- id: `emotion_weak` | trigger: emotionalWords < 2 || benefitWords < 1 | severity: medium | recommendation: Add aspirational language | impact: +10

### Avoidance Patterns

**Visual**:
- Static, static-heavy layouts without motion
- Unclear car positioning or feature confusion
- Low contrast or poor readability at viewport
- Bland, corporate aesthetic (should feel aspirational)

**Layout**:
- Overcrowded feature lists (keep < 3 visual elements)
- CTA too prominent (soft stage means less aggressive placement)
- Text-heavy (visual > copy on awareness)

**CTA**:
- "Buy Now" or "Get Deal" (too conversion-focused)
- Generic "Learn More" without context
- Vague action verbs

**Copy**:
- Feature-only messaging (need aspiration + emotion)
- Aggressive selling language
- Pricing information (off-limits on awareness)

---

## BANKING / FINTECH — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: banking
- **Emotional Priority**: MEDIUM
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`security | stability | confidence | financial-freedom | growth | trust | convenience | control | reliability | simplicity`

### Expected Emotions
- `financial-freedom`: confidence 0.90
- `trust`: confidence 0.85
- `confidence`: confidence 0.80
- `stability`: confidence 0.80
- `growth`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Discover Smarter Banking
  2. Explore Financial Freedom
  3. Bank Smarter
  4. Experience Modern Banking
  5. Discover Better Finance
  6. Explore Smarter Payments
  7. Manage Money Better
  8. Experience Seamless Banking
  9. Discover Financial Simplicity
  10. Explore Secure Banking
  11. Stay in Control
  12. Experience Smart Finance
  13. Discover Easy Banking
  14. Explore Digital Banking
  15. Build Financial Confidence

### Layout Intelligence
- **Density**: minimal
- **Whitespace**: 30-50%
- **Hierarchy**: clear
- **Mobile Priority**: critical
- **Preferred Zones**: center (dashboard visual), bottom (CTA)

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: blue, dark-blue, white, black
- **Secondary Colors**: green, teal, silver
- **Avoid**: red, orange, chaotic patterns
- **Typography**: clean, modern, minimal
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: security badges, privacy mention, modern UI
- **Average Confidence**: 0.85

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.20
ctaClarity:     0.10
trustSignals:   0.35
offerClarity:   0.10
brandRecall:    0.25
```

### Recommendation Rules

**Trust Rules**:
- id: `trust_low` | trigger: trustWords < 2 || !securityBadge | severity: high | recommendation: Add trust signals or security mention | impact: +20

**Layout Rules**:
- id: `clutter_high` | trigger: textDensity > 50 | severity: medium | recommendation: Reduce text, emphasize dashboard visuals | impact: +12

### Avoidance Patterns

**Visual**:
- Excessive data visualization (confuses awareness stage)
- Aggressive marketing angles
- Complex UI screenshots (use simplified mockups)
- Unclear security/privacy

**Layout**:
- Text-dense layouts
- Multiple competing focal points
- Small UI elements (hard to read on mobile)

**CTA**:
- "Sign Up Now" (can use, but soft version preferred)
- "Get Your Account" (too transactional)

**Copy**:
- Feature-heavy (need emotional benefit)
- Technical jargon
- No mention of simplicity/ease

---

## ECOMMERCE — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: ecommerce
- **Emotional Priority**: HIGH
- **Brand Recall Priority**: MEDIUM

### Emotional Triggers
`craving | desire | discovery | curiosity | excitement | luxury | confidence | social-proof | trend | lifestyle`

### Expected Emotions
- `discovery`: confidence 0.90
- `desire`: confidence 0.85
- `excitement`: confidence 0.80
- `confidence`: confidence 0.75
- `lifestyle`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Discover New Styles
  2. Explore Collections
  3. Find Your Look
  4. See What's Trending
  5. Discover Perfect Pieces
  6. Shop the Look
  7. Explore Inspiration
  8. See New Arrivals
  9. Discover Your Style
  10. Explore the Collection
  11. Find What You Love
  12. See Designer Picks
  13. Explore Curated Items
  14. Discover Hidden Gems
  15. Experience the Brand

### Layout Intelligence
- **Density**: information-rich
- **Whitespace**: 20-35%
- **Hierarchy**: distributed
- **Mobile Priority**: critical
- **Preferred Zones**: hero (product showcase), grid (collection), bottom (CTA)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: varies by brand (generally bold)
- **Secondary Colors**: brand-specific accents
- **Avoid**: muddy colors, poor contrast
- **Typography**: modern, lifestyle-driven
- **Branding**: prominent (brand recall critical)

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: customer reviews, fast shipping mention
- **Average Confidence**: 0.70

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.30
ctaClarity:     0.10
trustSignals:   0.15
offerClarity:   0.10
brandRecall:    0.35
```

### Recommendation Rules

**Visual Rules**:
- id: `product_unclear` | trigger: !clear_product_image || contrast < 60 | severity: high | recommendation: Use clear, high-contrast product photography | impact: +20

**Layout Rules**:
- id: `hierarchy_weak` | trigger: visualHierarchy < 55 | severity: medium | recommendation: Strengthen hero product image and brand placement | impact: +15

### Avoidance Patterns

**Visual**:
- Low-quality product images
- Unclear product presentation
- Poor lifestyle integration
- Weak brand visibility

**Layout**:
- Cluttered grid (too many items, confuses)
- Weak hierarchy (hero product unclear)
- Mobile readability issues on product cards

**CTA**:
- "Buy Now" (too strong for awareness)
- Vague "Shop" (needs context)

**Copy**:
- No lifestyle context
- Feature-only (need emotional context)
- Weak brand voice

---

## EDUCATION / EDTECH — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: education
- **Emotional Priority**: HIGH
- **Brand Recall Priority**: MEDIUM

### Emotional Triggers
`achievement | curiosity | ambition | confidence | success | growth | inspiration | learning | empowerment | opportunity | future`

### Expected Emotions
- `empowerment`: confidence 0.90
- `growth`: confidence 0.85
- `confidence`: confidence 0.85
- `achievement`: confidence 0.80
- `opportunity`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Start Learning Today
  2. Discover New Skills
  3. Explore Better Learning
  4. Learn Without Limits
  5. Discover Your Potential
  6. Experience Smarter Education
  7. Explore New Opportunities
  8. Build Your Future
  9. Learn Something New
  10. Discover Career Growth
  11. Experience Interactive Learning
  12. Explore Online Education
  13. Discover Educational Excellence
  14. Experience Learning Innovation
  15. Build Knowledge Daily

### Layout Intelligence
- **Density**: balanced
- **Whitespace**: 25-40%
- **Hierarchy**: clear
- **Mobile Priority**: high
- **Preferred Zones**: hero (aspirational imagery), middle (course/skill showcase), bottom (CTA)

### Visual Psychology
- **Energy**: medium-high
- **Primary Colors**: blue, green, white, bright-accent
- **Secondary Colors**: orange, teal, gold
- **Avoid**: dark, dreary, uninspiring
- **Typography**: modern, confident, approachable
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: instructor credentials, student success stories, course completion rates
- **Average Confidence**: 0.75

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.25
ctaClarity:     0.10
trustSignals:   0.20
offerClarity:   0.10
brandRecall:    0.35
```

### Recommendation Rules

**Emotion Rules**:
- id: `inspiration_low` | trigger: inspirationalWords < 2 || !student_success_visual | severity: medium | recommendation: Add student success imagery or testimonial | impact: +14

**Visual Rules**:
- id: `energy_low` | trigger: visualEnergy < 50 | severity: medium | recommendation: Add bright colors, confident imagery, or motion | impact: +12

### Avoidance Patterns

**Visual**:
- Boring classroom stereotypes
- Unclear value proposition
- Weak instructor/student imagery
- Dark or uninspiring color schemes

**Layout**:
- Text-heavy course descriptions
- Unclear course structure
- No clear pathway or progression visual

**CTA**:
- "Enroll Now" (too conversion-focused)
- "Learn More" without course context

**Copy**:
- Feature-only (curriculum details off-limits)
- No career benefit messaging
- Vague learning outcomes

---

## ENTERTAINMENT / OTT / STREAMING — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: entertainment
- **Emotional Priority**: CRITICAL
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`curiosity | suspense | excitement | entertainment | emotion | escape | fomo | humor | drama | thrill | community | anticipation`

### Expected Emotions
- `excitement`: confidence 0.95
- `curiosity`: confidence 0.90
- `entertainment`: confidence 0.85
- `thrill`: confidence 0.80
- `escape`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Watch the Story
  2. Stream the Experience
  3. Discover New Entertainment
  4. Experience the Drama
  5. Watch What Everyone's Talking About
  6. Explore New Stories
  7. Discover Epic Entertainment
  8. Experience Cinematic Storytelling
  9. Watch the Adventure
  10. Stream the Excitement
  11. Discover Award-Winning Stories
  12. Experience Entertainment Differently
  13. Watch Every Moment
  14. Explore Trending Shows
  15. Discover Powerful Stories

### Layout Intelligence
- **Density**: information-rich
- **Whitespace**: 15-30%
- **Hierarchy**: distributed
- **Mobile Priority**: high
- **Preferred Zones**: hero (trailer/scene), grid (content showcase)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: black, dark-navy, bold-red, white
- **Secondary Colors**: gold, dramatic-purple, accent-colors-by-genre
- **Avoid**: washed-out, low-contrast
- **Typography**: dramatic, bold, cinematic
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: award badges, critical acclaim, viewer counts
- **Average Confidence**: 0.75

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.35
ctaClarity:     0.08
trustSignals:   0.10
offerClarity:   0.07
brandRecall:    0.40
```

### Recommendation Rules

**Emotion Rules**:
- id: `excitement_low` | trigger: emotionalWords < 3 || !dramatic_visuals | severity: high | recommendation: Add dramatic imagery, trailer-style editing, or suspenseful copy | impact: +18

**Layout Rules**:
- id: `content_unclear` | trigger: !clear_show_positioning || visual_hierarchy < 60 | severity: high | recommendation: Highlight featured show/movie prominently | impact: +15

### Avoidance Patterns

**Visual**:
- Generic, non-cinematic imagery
- Unclear show/movie positioning
- Low-quality screenshots or artwork
- Poor contrast or small text

**Layout**:
- Overwhelming content grid without focal point
- Weak hero image
- Unclear call-to-action

**CTA**:
- "Subscribe Now" (too strong for awareness)
- Vague "Watch" (needs context)

**Copy**:
- No content description
- Generic "Great shows" messaging
- No genre or mood communication

---

## FINANCE / INVESTMENT — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: finance
- **Emotional Priority**: MEDIUM
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`confidence | growth | security | opportunity | wealth | achievement | control | intelligence | future | empowerment | stability`

### Expected Emotions
- `growth`: confidence 0.90
- `confidence`: confidence 0.85
- `opportunity`: confidence 0.80
- `intelligence`: confidence 0.75
- `empowerment`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Discover Smarter Growth
  2. Explore Investment Opportunities
  3. Build with Confidence
  4. Learn About Growth
  5. Explore Financial Intelligence
  6. Discover Better Opportunities
  7. Experience Smart Investing
  8. Explore Investment Solutions
  9. Learn About Wealth Building
  10. Discover Financial Growth
  11. Explore Investment Strategies
  12. Build Long-Term Success
  13. Learn About Better Returns
  14. Discover Investment Potential
  15. Experience Financial Freedom

### Layout Intelligence
- **Density**: balanced
- **Whitespace**: 30-45%
- **Hierarchy**: clear
- **Mobile Priority**: high
- **Preferred Zones**: top (value proposition), middle (chart/metric), bottom (CTA)

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: blue, dark-green, white, black
- **Secondary Colors**: gold, teal, silver
- **Avoid**: red, chaotic patterns, overly-complex charts
- **Typography**: modern, professional, trustworthy
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: financial expertise mention, compliance badges, performance data
- **Average Confidence**: 0.85

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.22
ctaClarity:     0.10
trustSignals:   0.33
offerClarity:   0.12
brandRecall:    0.23
```

### Recommendation Rules

**Trust Rules**:
- id: `trust_missing` | trigger: trustWords < 2 || !credibility_signal | severity: high | recommendation: Add expertise mention, compliance badge, or performance transparency | impact: +22

**Copy Rules**:
- id: `benefit_unclear` | trigger: benefitWords < 2 || !value_statement | severity: medium | recommendation: Highlight financial growth benefit or ROI clarity | impact: +14

### Avoidance Patterns

**Visual**:
- Overly-complex financial charts
- Aggressive sales imagery
- Unclear value proposition
- Weak credibility signals

**Layout**:
- Text-dense layouts
- Confusing navigation or multiple CTAs
- No clear growth/returns visual

**CTA**:
- "Start Investing" (implies immediate action)
- "Get Rich" (aggressive, unrealistic)

**Copy**:
- Guaranteed returns (compliance violation)
- Overly-complex financial jargon
- Missing simplicity/accessibility messaging

---

## FOOD / RESTAURANTS — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: food
- **Emotional Priority**: CRITICAL
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`hunger | craving | comfort | happiness | excitement | indulgence | togetherness | freshness | satisfaction | luxury | curiosity | warmth`

### Expected Emotions
- `craving`: confidence 0.95
- `excitement`: confidence 0.90
- `comfort`: confidence 0.85
- `happiness`: confidence 0.80
- `indulgence`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Taste the Experience
  2. Discover Delicious Moments
  3. Savor Every Bite
  4. Experience Culinary Excellence
  5. Explore New Flavors
  6. Taste Something Extraordinary
  7. Discover Gourmet Dining
  8. Experience Food Differently
  9. Enjoy Every Flavor
  10. Discover Signature Dishes
  11. Experience the Art of Dining
  12. Taste Pure Perfection
  13. Discover Flavorful Experiences
  14. Enjoy Culinary Creativity
  15. Experience Delicious Luxury

### Layout Intelligence
- **Density**: information-rich
- **Whitespace**: 20-35%
- **Hierarchy**: clear (food hero prominent)
- **Mobile Priority**: critical
- **Preferred Zones**: hero (food close-up), grid (dish showcase), bottom (CTA or reservation)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: warm-oranges, reds, browns, whites
- **Secondary Colors**: golds, warm-creams, garnish-greens
- **Avoid**: cool-grays, clinical looks, poor food photography
- **Typography**: warm, inviting, confident
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: chef reputation, ratings/reviews, fresh ingredient mention
- **Average Confidence**: 0.70

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.40
ctaClarity:     0.08
trustSignals:   0.12
offerClarity:   0.08
brandRecall:    0.32
```

### Recommendation Rules

**Visual Rules**:
- id: `food_photography_weak` | trigger: !appetizing_food_image || bad_lighting | severity: critical | recommendation: Use high-quality, well-lit food photography with professional plating | impact: +25

**Emotion Rules**:
- id: `craving_missing` | trigger: !mouthwatering_visuals || emotionalWords < 2 | severity: high | recommendation: Add appetite-triggering visuals (steam, sizzle, garnish) | impact: +20

**Layout Rules**:
- id: `food_not_focal` | trigger: !clear_food_focus || hierarchy < 65 | severity: high | recommendation: Make food image the clear focal point | impact: +18

### Avoidance Patterns

**Visual**:
- Poor food photography (undersaturated, bad lighting)
- Unclear dish or ingredient
- Sterile, clinical presentation
- Low-quality plating visuals

**Layout**:
- Text-heavy menu descriptions
- Multiple competing food images (confusing)
- Weak food hierarchy

**CTA**:
- "Order Now" (too conversion-focused for awareness)
- "Make Reservation" (too direct)

**Copy**:
- Ingredient lists only (need emotional context)
- No chef or restaurant story
- Missing cuisine/flavor description

---

## GAMING — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: gaming
- **Emotional Priority**: CRITICAL
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`adrenaline | competition | victory | curiosity | fun | power | achievement | exploration | social-connection | excitement | energy | progression`

### Expected Emotions
- `excitement`: confidence 0.95
- `adrenaline`: confidence 0.90
- `competition`: confidence 0.85
- `victory`: confidence 0.80
- `progression`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Play the Adventure
  2. Experience the Action
  3. Discover Epic Gameplay
  4. Join the Battle
  5. Explore New Worlds
  6. Experience Ultimate Gaming
  7. Discover Endless Action
  8. Play Without Limits
  9. Experience the Competition
  10. Explore the Game
  11. Join the Action
  12. Discover Powerful Gameplay
  13. Experience Nonstop Excitement
  14. Explore Epic Challenges
  15. Discover New Adventures

### Layout Intelligence
- **Density**: high
- **Whitespace**: 10-25%
- **Hierarchy**: distributed with hero accent
- **Mobile Priority**: high
- **Preferred Zones**: hero (hero character/scene), grid (gameplay showcase)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: neon-accents, dark-background, bold-secondary
- **Secondary Colors**: electric-blues, purples, flame-reds
- **Avoid**: muted, washed-out, low-contrast
- **Typography**: bold, aggressive, energetic
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: player count, tournament mentions, streaming popularity
- **Average Confidence**: 0.65

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.35
ctaClarity:     0.08
trustSignals:   0.08
offerClarity:   0.07
brandRecall:    0.42
```

### Recommendation Rules

**Energy Rules**:
- id: `energy_low` | trigger: visualEnergy < 60 || !motion_effect | severity: high | recommendation: Add motion graphics, dynamic effects, or high-energy visual | impact: +20

**Visual Rules**:
- id: `character_unclear` | trigger: !clear_protagonist || character_positioning < 50 | severity: medium | recommendation: Highlight hero character prominently and clearly | impact: +15

### Avoidance Patterns

**Visual**:
- Generic game screenshots (no hero focus)
- Low-quality graphics or UI
- Static, motion-lacking visuals
- Unclear game appeal

**Layout**:
- Overwhelming gameplay showcase (too many elements)
- Weak character/hero positioning
- No clear gameplay flow visual

**CTA**:
- "Download Now" (conversion, not awareness)
- "Start Playing" (too direct)

**Copy**:
- Mechanic lists only (need emotional excitement)
- No community/multiplayer mention
- Vague game description

---

## HEALTHCARE — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: healthcare
- **Emotional Priority**: HIGH
- **Brand Recall Priority**: MEDIUM

### Emotional Triggers
`safety | hope | relief | protection | trust | recovery | wellness | family-care | prevention | comfort | care | empowerment`

### Expected Emotions
- `hope`: confidence 0.90
- `safety`: confidence 0.85
- `trust`: confidence 0.85
- `wellness`: confidence 0.80
- `relief`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Learn More
  2. Discover Wellness
  3. Start Your Health Journey
  4. Explore Better Living
  5. Prioritize Your Health
  6. Feel Better Daily
  7. Take Care Today
  8. Your Wellness Matters
  9. Stay Informed
  10. See Healthy Living
  11. Explore Care Options
  12. Begin Wellness
  13. Discover Relief
  14. Live Healthier
  15. Move Better

### Layout Intelligence
- **Density**: minimal
- **Whitespace**: 35-50%
- **Hierarchy**: clear
- **Mobile Priority**: critical
- **Preferred Zones**: top (trust visual), middle (wellness imagery), bottom (CTA)

### Visual Psychology
- **Energy**: low-medium
- **Primary Colors**: blue, green, white, light-gray
- **Secondary Colors**: teal, calm-blue, soft-green
- **Avoid**: harsh-reds, aggressive-blacks, clinical-white-overuse
- **Typography**: calm, professional, approachable
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: medical professional mention, certification badge, safety assurance
- **Average Confidence**: 0.85

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.22
ctaClarity:     0.12
trustSignals:   0.35
offerClarity:   0.08
brandRecall:    0.23
```

### Recommendation Rules

**Trust Rules**:
- id: `trust_missing` | trigger: trustWords < 2 || !healthcare_credential | severity: critical | recommendation: Add healthcare professional credibility, medical certification, or safety assurance | impact: +25

**Emotion Rules**:
- id: `emotion_clinical` | trigger: !human_imagery || emotionalWords < 2 | severity: high | recommendation: Add human/family imagery or emotional wellness language | impact: +16

### Avoidance Patterns

**Visual**:
- Overly-clinical or sterile imagery
- Lack of human/family connection
- Weak trust signals or credibility
- Aggressive health messaging (fear-based)

**Layout**:
- Cold, institutional aesthetic
- Unclear wellness benefit
- No clear pathway or trust anchor

**CTA**:
- "Schedule Now" (too direct for awareness)
- "Get Tested" (too clinical)

**Copy**:
- Medical jargon overuse
- Fear-based messaging (belongs in consideration)
- Missing emotional wellness focus
- No accessibility/inclusivity mention

---

## HOTELS — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: hotels
- **Emotional Priority**: HIGH
- **Brand Recall Priority**: MEDIUM

### Emotional Triggers
`relaxation | escape | comfort | luxury | peace | warmth | hospitality | convenience | exclusivity | happiness | serenity | indulgence`

### Expected Emotions
- `relaxation`: confidence 0.95
- `escape`: confidence 0.90
- `comfort`: confidence 0.85
- `luxury`: confidence 0.80
- `happiness`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Experience Luxury Stay
  2. Discover Comfort Redefined
  3. Relax in Style
  4. Your Perfect Escape Awaits
  5. Experience World-Class Hospitality
  6. Discover Premium Comfort
  7. Stay Beyond Expectations
  8. Experience Timeless Hospitality
  9. Relax Like Never Before
  10. Discover Elegant Living
  11. Experience Unforgettable Stays
  12. Escape Into Comfort
  13. Discover Luxury Accommodation
  14. Stay Inspired
  15. Experience Pure Relaxation

### Layout Intelligence
- **Density**: balanced
- **Whitespace**: 30-45%
- **Hierarchy**: clear
- **Mobile Priority**: high
- **Preferred Zones**: hero (luxury room/pool), grid (room showcase), bottom (CTA)

### Visual Psychology
- **Energy**: low-medium
- **Primary Colors**: beige, white, warm-gold, soft-blue
- **Secondary Colors**: champagne, light-gray, accent-navy
- **Avoid**: bright, jarring, low-contrast
- **Typography**: elegant, warm, inviting
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: luxury award badges, guest reviews, premium positioning
- **Average Confidence**: 0.75

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.25
ctaClarity:     0.08
trustSignals:   0.18
offerClarity:   0.08
brandRecall:    0.41
```

### Recommendation Rules

**Visual Rules**:
- id: `luxury_missing` | trigger: !premium_room_visuals || !ambient_lighting | severity: high | recommendation: Use luxury room photography with warm, ambient lighting | impact: +18

**Emotion Rules**:
- id: `escape_weak` | trigger: !lifestyle_imagery || emotionalWords < 2 | severity: medium | recommendation: Add lifestyle/escape imagery (pool, spa, sunset views) | impact: +14

### Avoidance Patterns

**Visual**:
- Poor hotel room photography
- Sterile, institutional aesthetic
- Low lighting or harsh shadows
- Unclear luxury positioning

**Layout**:
- Overwhelming room grid
- Weak hero visual (should be luxury room or signature amenity)
- No escape/relaxation context

**CTA**:
- "Book Now" (too conversion-focused)
- "Reserve" (too transactional)

**Copy**:
- Amenity lists only (need emotional escape context)
- No hospitality story or experience
- Missing relaxation/wellness messaging

---

## LUXURY — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: luxury
- **Emotional Priority**: CRITICAL
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`elegance | exclusivity | desire | prestige | sophistication | status | refinement | artistic-admiration | luxury-lifestyle | perfection | aspiration | beauty`

### Expected Emotions
- `elegance`: confidence 0.95
- `prestige`: confidence 0.90
- `aspiration`: confidence 0.85
- `exclusivity`: confidence 0.80
- `sophistication`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Experience Elegance
  2. Discover Timeless Luxury
  3. Elevate Your Lifestyle
  4. Crafted for Excellence
  5. Experience Prestige
  6. Indulge in Sophistication
  7. Define Your Style
  8. Luxury Redefined
  9. Discover Exclusivity
  10. Inspired by Perfection
  11. Explore Premium Living
  12. Experience Distinction
  13. The Art of Luxury
  14. Designed for the Exceptional
  15. Experience Timeless Design

### Layout Intelligence
- **Density**: minimal
- **Whitespace**: 40-60%
- **Hierarchy**: clear (single focal point)
- **Mobile Priority**: medium
- **Preferred Zones**: center (luxury product/lifestyle), large negative space

### Visual Psychology
- **Energy**: low
- **Primary Colors**: black, white, gold, navy
- **Secondary Colors**: silver, champagne, jewel-tones
- **Avoid**: bright, busy, low-contrast
- **Typography**: elegant, minimal, sophisticated
- **Branding**: prominent but refined

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: heritage/craftsmanship mention, exclusivity cues, premium positioning
- **Average Confidence**: 0.80

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.30
ctaClarity:     0.05
trustSignals:   0.15
offerClarity:   0.03
brandRecall:    0.47
```

### Recommendation Rules

**Elegance Rules**:
- id: `clutter_excessive` | trigger: textDensity > 30 || elements > 4 | severity: critical | recommendation: Reduce elements, maximize whitespace, keep composition minimal | impact: +22

**Visual Rules**:
- id: `premium_missing` | trigger: !cinematic_visuals || !premium_aesthetic | severity: high | recommendation: Use cinematic photography, premium lighting, artistic composition | impact: +20

### Avoidance Patterns

**Visual**:
- Busy, cluttered compositions
- Low-quality photography
- Bright, flashy aesthetics (contradicts elegance)
- Unclear luxury positioning

**Layout**:
- Text-dense layouts (luxury = less copy)
- Multiple competing focal points
- Small, cramped visuals

**CTA**:
- "Buy Now" (destroys elegance)
- "Get Yours" (too casual, transactional)
- Any urgent language

**Copy**:
- Aggressive selling language
- Features instead of aspiration
- Price mention (off-limits on awareness)
- Generic "luxury" claims

---

## NEWS / MEDIA — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: news_media
- **Emotional Priority**: HIGH
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`curiosity | fomo | urgency | awareness | discovery | concern | importance | insight | connection | knowledge | relevance | credibility`

### Expected Emotions
- `curiosity`: confidence 0.95
- `importance`: confidence 0.90
- `discovery`: confidence 0.85
- `awareness`: confidence 0.80
- `urgency`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Stay Updated
  2. Discover Today's Stories
  3. Explore Breaking News
  4. Know What Matters
  5. Stay Informed
  6. Watch the Latest
  7. Discover New Perspectives
  8. Follow the Story
  9. Explore Global Events
  10. See What's Happening
  11. Stay Ahead of the Headlines
  12. Watch Live Updates
  13. Learn More Today
  14. Understand the World
  15. Stay Connected

### Layout Intelligence
- **Density**: high
- **Whitespace**: 15-30%
- **Hierarchy**: distributed with headline hierarchy
- **Mobile Priority**: critical
- **Preferred Zones**: hero (breaking headline + image), grid (story grid)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: red, white, black, bold-accent
- **Secondary Colors**: dark-blue, gray, brand-accent
- **Avoid**: muted, unclear contrast, visual confusion
- **Typography**: bold, authoritative, clear
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: publication credibility, journalist byline, fact-checked badge
- **Average Confidence**: 0.80

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.30
ctaClarity:     0.10
trustSignals:   0.30
offerClarity:   0.08
brandRecall:    0.22
```

### Recommendation Rules

**Headline Rules**:
- id: `headline_weak` | trigger: !compelling_headline || wordCount > 15 | severity: high | recommendation: Use compelling, concise headline (7-12 words max) | impact: +18

**Trust Rules**:
- id: `credibility_low` | trigger: !journalist_byline && !credibility_indicator | severity: medium | recommendation: Add journalist credentials, publication logo, or fact-check badge | impact: +14

### Avoidance Patterns

**Visual**:
- Unclear or generic news imagery
- Poor image quality or low contrast
- Weak headline hierarchy
- Unclear story positioning

**Layout**:
- Overwhelming news grid without focal point
- Weak breaking news indication
- No clear publication identity

**CTA**:
- "Subscribe Now" (too strong for awareness)
- Vague "Read" without context

**Copy**:
- No story summary or hook
- Unclear relevance or importance
- Missing credibility signals
- Generic "important story" language

---

## REAL ESTATE — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: real_estate
- **Emotional Priority**: HIGH
- **Brand Recall Priority**: MEDIUM

### Emotional Triggers
`comfort | family | stability | luxury | success | security | achievement | belonging | pride | peace | aspiration | home-connection`

### Expected Emotions
- `dream-home`: confidence 0.95
- `belonging`: confidence 0.90
- `security`: confidence 0.85
- `comfort`: confidence 0.80
- `aspiration`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Discover Your Dream Home
  2. Explore Beautiful Living
  3. Find Your Perfect Space
  4. Experience Modern Living
  5. Explore Luxury Homes
  6. Discover Inspired Living
  7. Experience Elegant Spaces
  8. Find a Place You Love
  9. Explore Dream Properties
  10. Discover Comfortable Living
  11. Experience Premium Real Estate
  12. Explore Better Living
  13. Discover Beautiful Homes
  14. Experience Luxury Living
  15. Explore Modern Spaces

### Layout Intelligence
- **Density**: balanced
- **Whitespace**: 25-40%
- **Hierarchy**: clear
- **Mobile Priority**: high
- **Preferred Zones**: hero (luxury home exterior/interior), grid (property showcase)

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: warm-white, warm-brown, warm-beige, cream
- **Secondary Colors**: warm-gold, soft-green, light-blue
- **Avoid**: cold, sterile, institutional-white
- **Typography**: warm, inviting, confident
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: location prestige, agent credentials, move-in readiness
- **Average Confidence**: 0.70

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.28
ctaClarity:     0.10
trustSignals:   0.15
offerClarity:   0.07
brandRecall:    0.40
```

### Recommendation Rules

**Visual Rules**:
- id: `home_imagery_weak` | trigger: !warm_inviting_visuals || !clear_property_positioning | severity: high | recommendation: Use warm, inviting home photography showcasing key features | impact: +18

**Emotion Rules**:
- id: `lifestyle_missing` | trigger: !family_imagery && !lifestyle_context | severity: medium | recommendation: Add lifestyle imagery showing family moments or community | impact: +14

### Avoidance Patterns

**Visual**:
- Cold, sterile property photos
- Poor lighting or staging
- Unclear home appeal or key features
- Weak neighborhood/community context

**Layout**:
- Too many property listings (confuses on awareness stage)
- Weak hero home positioning
- No clear lifestyle benefit

**CTA**:
- "Buy Now" (way too strong)
- "Schedule Tour" (too direct for awareness)

**Copy**:
- Feature lists only (need emotional benefit)
- No community or lifestyle mention
- Missing location context
- Pricing information (off-limits on awareness)

---

## SPORTS — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: sports
- **Emotional Priority**: CRITICAL
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`adrenaline | victory | competition | pride | inspiration | belonging | excitement | intensity | passion | celebration | energy | anticipation`

### Expected Emotions
- `excitement`: confidence 0.95
- `competition`: confidence 0.90
- `pride`: confidence 0.85
- `passion`: confidence 0.80
- `adrenaline`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Feel the Energy
  2. Watch the Action
  3. Join the Excitement
  4. Experience the Game
  5. See Every Moment
  6. Discover Greatness
  7. Live the Passion
  8. Watch Champions Rise
  9. Feel Every Victory
  10. Experience the Competition
  11. Explore the Action
  12. Witness the Intensity
  13. Join the Movement
  14. Celebrate Every Win
  15. Stay in the Game

### Layout Intelligence
- **Density**: high
- **Whitespace**: 15-25%
- **Hierarchy**: distributed with hero athlete
- **Mobile Priority**: high
- **Preferred Zones**: hero (action shot), grid (match/athlete showcase)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: bold-reds, blacks, team-colors
- **Secondary Colors**: gold, bright-accents, high-contrast
- **Avoid**: muted, washed-out, low-energy
- **Typography**: bold, aggressive, energetic
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: athlete credentials, tournament prestige, viewership numbers
- **Average Confidence**: 0.70

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.32
ctaClarity:     0.08
trustSignals:   0.10
offerClarity:   0.08
brandRecall:    0.42
```

### Recommendation Rules

**Energy Rules**:
- id: `energy_low` | trigger: visualEnergy < 65 || !motion_visual | severity: high | recommendation: Add motion graphics, dynamic cuts, or high-energy action shots | impact: +20

**Emotion Rules**:
- id: `passion_missing` | trigger: emotionalWords < 2 || !athlete_emotion | severity: high | recommendation: Add athlete emotion, crowd energy, or celebration visuals | impact: +17

### Avoidance Patterns

**Visual**:
- Static sports imagery (no motion feel)
- Low-quality action shots
- Unclear athlete or team positioning
- Poor contrast or visibility

**Layout**:
- Overwhelming game grid without focal point
- Weak hero athlete/action positioning
- No clear match/event context

**CTA**:
- "Get Tickets" (too direct, conversion focus)
- "Join Now" (too strong for awareness)

**Copy**:
- Game mechanic details only (need emotion)
- No community or team identity
- Missing competition/rivalry context
- No player personality or story

---

## TECHNOLOGY — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: technology
- **Emotional Priority**: HIGH
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`innovation | efficiency | productivity | simplicity | speed | confidence | control | intelligence | scalability | optimization | future | capability`

### Expected Emotions
- `innovation`: confidence 0.95
- `efficiency`: confidence 0.90
- `confidence`: confidence 0.85
- `future-ready`: confidence 0.80
- `simplicity`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Explore Innovation
  2. Discover the Future
  3. Experience Smarter Technology
  4. See What's Possible
  5. Reimagine Productivity
  6. Power Your Ideas
  7. Discover AI
  8. Build Faster
  9. Explore New Possibilities
  10. See Technology Differently
  11. Experience the Future
  12. Unlock Innovation
  13. Stay Ahead
  14. Discover Smart Solutions
  15. Think Beyond

### Layout Intelligence
- **Density**: balanced
- **Whitespace**: 25-40%
- **Hierarchy**: clear
- **Mobile Priority**: high
- **Preferred Zones**: hero (product visual/demo), middle (feature showcase), bottom (CTA)

### Visual Psychology
- **Energy**: medium-high
- **Primary Colors**: dark-navy, black, white, tech-blue
- **Secondary Colors**: bright-cyan, electric-blue, tech-accents
- **Avoid**: bland, dated, low-contrast
- **Typography**: modern, minimal, tech-forward
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: innovation mention, technology awards, user/enterprise adoption
- **Average Confidence**: 0.75

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.28
ctaClarity:     0.10
trustSignals:   0.18
offerClarity:   0.10
brandRecall:    0.34
```

### Recommendation Rules

**Innovation Rules**:
- id: `future_missing` | trigger: !innovation_visual || !futuristic_aesthetic | severity: medium | recommendation: Add innovation cues, future visuals, or tech aesthetic | impact: +15

**Simplicity Rules**:
- id: `complexity_high` | trigger: visualElements > 5 || text_density > 40 | severity: medium | recommendation: Simplify visuals, emphasize key product feature | impact: +13

### Avoidance Patterns

**Visual**:
- Outdated or dated-looking technology visuals
- Overly-complex product screenshots
- Weak product positioning
- Unclear use case or benefit

**Layout**:
- Text-heavy technical descriptions
- Multiple competing product visuals
- Weak hero product showcasing

**CTA**:
- "Sign Up Now" (too direct)
- "Get Access" (conversion-focused)

**Copy**:
- Feature lists only (need emotional benefit)
- Excessive technical jargon
- Missing simplicity or ease messaging
- No use case or outcome clarity

---

## TRAVEL — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: travel
- **Emotional Priority**: CRITICAL
- **Brand Recall Priority**: HIGH

### Emotional Triggers
`freedom | adventure | curiosity | relaxation | discovery | excitement | escape | inspiration | luxury | happiness | nature-connection | exploration | wanderlust`

### Expected Emotions
- `wanderlust`: confidence 0.95
- `adventure`: confidence 0.90
- `escape`: confidence 0.85
- `discovery`: confidence 0.80
- `relaxation`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: low
- **Examples** (15):
  1. Explore the World
  2. Start Your Journey
  3. Discover New Destinations
  4. Travel Beyond Ordinary
  5. Experience the Adventure
  6. Find Your Next Escape
  7. Explore Hidden Gems
  8. See the World Differently
  9. Your Journey Starts Here
  10. Discover Paradise
  11. Explore Beautiful Places
  12. Experience Wanderlust
  13. Travel Without Limits
  14. Begin Your Adventure
  15. Escape the Everyday

### Layout Intelligence
- **Density**: balanced
- **Whitespace**: 25-40%
- **Hierarchy**: clear
- **Mobile Priority**: high
- **Preferred Zones**: hero (cinematic destination), grid (destination showcase), bottom (CTA)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: blue, turquoise, sunset-orange, white
- **Secondary Colors**: tropical-greens, sandy-beige, sky-pastels
- **Avoid**: harsh, grayish, uninspiring
- **Typography**: modern, inviting, adventure-driven
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false
- **Credibility Signals**: destination prestige, travel experience mention, reviews/ratings
- **Average Confidence**: 0.70

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.32
ctaClarity:     0.08
trustSignals:   0.12
offerClarity:   0.08
brandRecall:    0.40
```

### Recommendation Rules

**Wanderlust Rules**:
- id: `destination_unclear` | trigger: !cinematic_landscape || !destination_clarity | severity: high | recommendation: Use stunning destination photography, clear location identification | impact: +18

**Inspiration Rules**:
- id: `inspiration_low` | trigger: emotionalWords < 2 || !aspirational_visual | severity: medium | recommendation: Add aspirational lifestyle imagery or wanderlust trigger | impact: +14

### Avoidance Patterns

**Visual**:
- Generic or stock travel imagery
- Unclear destination identity
- Poor landscape photography
- Low quality or unflattering visuals

**Layout**:
- Overwhelming destination grid
- Weak hero destination visual
- No escape/inspiration context

**CTA**:
- "Book Now" (too conversion-focused)
- "Reserve" (transactional, not awareness)

**Copy**:
- Itinerary details only (need emotional escape)
- No destination story or character
- Missing adventure/discovery messaging
- Pricing information (off-limits on awareness)
