# Consideration Campaign Behavioral Intelligence Dataset

Production-grade intelligence dataset for consideration-stage creatives.

**Goal**: Evaluation, comparison, research, trust building

---

## Consideration Campaign Characteristics

| Dimension | Value |
|-----------|-------|
| **Primary Focus** | Information clarity + Trust signals + Comparison support |
| **CTA Pressure** | Medium (balanced CTAs) |
| **Trust Priority** | High |
| **Conversion Pressure** | Moderate |
| **Visual Energy** | Medium |
| **Information Load** | High |
| **Urgency** | Moderate |

---

## AUTOMOTIVE — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: automotive
- **Information Priority**: HIGH
- **Trust Priority**: HIGH

### Emotional Triggers
`confidence | power | status | performance | reliability | safety | luxury | innovation | comparison | capability | precision | control`

### Expected Emotions
- `confidence`: confidence 0.90
- `performance`: confidence 0.85
- `reliability`: confidence 0.80
- `status`: confidence 0.75
- `safety`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Explore Models
  2. View Inventory
  3. Compare Vehicles
  4. Explore Features
  5. View Details
  6. See Pricing
  7. Browse Cars
  8. Explore SUVs
  9. View Offers
  10. Compare Models
  11. Explore Performance
  12. View Vehicle Details

### Layout Intelligence
- **Density**: information-rich
- **Whitespace**: 20-35%
- **Hierarchy**: nested
- **Mobile Priority**: critical
- **Preferred Zones**: hero (model showcase), comparison grid, specs section

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: black, silver, white, dark-gray
- **Secondary Colors**: metallic-accents, brand-colors, safety-blue
- **Avoid**: cartoon-like, overly-colorful
- **Typography**: professional, trustworthy, modern
- **Branding**: prominent (comparison context)

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: safety ratings, warranty info, spec transparency, owner reviews
- **Average Confidence**: 0.85

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.20
ctaClarity:     0.22
trustSignals:   0.28
offerClarity:   0.18
brandRecall:    0.12
```

### Recommendation Rules

**Comparison Rules**:
- id: `spec_missing` | trigger: !detailed_specifications || !trim_comparison | severity: high | recommendation: Include detailed spec comparison, trim levels, or side-by-side comparison | impact: +20

**Trust Rules**:
- id: `safety_missing` | trigger: !safety_rating && !warranty_mention | severity: high | recommendation: Add safety ratings, warranty details, or owner satisfaction scores | impact: +18

**Clarity Rules**:
- id: `pricing_unclear` | trigger: !pricing_visible || !transparent_cost | severity: medium | recommendation: Display pricing clearly, show value breakdown | impact: +15

### Avoidance Patterns

**Visual**:
- Unclear vehicle features or positioning
- Missing comparison context
- Weak specification visuals
- Unclear trim/option differences

**Layout**:
- Overwhelming feature lists without hierarchy
- No comparison visualization
- Poor mobile spec readability
- Weak pricing visibility

**CTA**:
- Vague "Learn More" (needs purpose)
- "Buy" (too conversion-focused)

**Copy**:
- Incomplete specifications
- Missing warranty/support info
- No comparison messaging
- Vague performance claims

---

## BANKING / FINTECH — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: banking
- **Information Priority**: CRITICAL
- **Trust Priority**: CRITICAL

### Emotional Triggers
`security | stability | confidence | financial-freedom | growth | trust | convenience | control | reliability | transparency`

### Expected Emotions
- `trust`: confidence 0.95
- `confidence`: confidence 0.90
- `security`: confidence 0.85
- `stability`: confidence 0.80
- `growth`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Learn More
  2. Explore Solutions
  3. Compare Plans
  4. View Pricing
  5. Get Quote
  6. Explore Services
  7. View Features
  8. Compare Options
  9. Learn About Benefits
  10. Explore Business Solutions
  11. View Details
  12. Compare Services

### Layout Intelligence
- **Density**: balanced
- **Whitespace**: 30-45%
- **Hierarchy**: clear
- **Mobile Priority**: critical
- **Preferred Zones**: top (trust intro), middle (feature comparison), bottom (CTA)

### Visual Psychology
- **Energy**: low-medium
- **Primary Colors**: blue, dark-blue, white, black
- **Secondary Colors**: green, teal, silver, gold
- **Avoid**: red (emergency), chaos, low-contrast
- **Typography**: professional, trustworthy, clear
- **Branding**: prominent (trust anchor)

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: security certifications, compliance badges, transparent fee structure, customer testimonials
- **Average Confidence**: 0.95

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.15
ctaClarity:     0.20
trustSignals:   0.45
offerClarity:   0.12
brandRecall:    0.08
```

### Recommendation Rules

**Trust Rules**:
- id: `security_missing` | trigger: !security_badge && !compliance_mention | severity: critical | recommendation: Display security certifications, compliance status, or privacy commitments | impact: +25

**Clarity Rules**:
- id: `fees_unclear` | trigger: !transparent_fee_structure | severity: high | recommendation: Show fees clearly, provide fee comparison vs competitors | impact: +20

**Comparison Rules**:
- id: `feature_comparison_missing` | trigger: !feature_matrix | severity: high | recommendation: Create feature comparison table or side-by-side plan comparison | impact: +18

### Avoidance Patterns

**Visual**:
- Complex, confusing UI mockups
- Weak security/trust signals
- Overly-technical displays
- Unclear product differentiation

**Layout**:
- Excessive technical details without hierarchy
- No clear plan comparison
- Missing compliance badges
- Weak credibility indicators

**CTA**:
- "Start Free Trial" without trust context
- Vague "Explore" (needs purpose)

**Copy**:
- Technical jargon overuse
- Missing transparency on fees
- No competitive differentiation
- Weak compliance/security messaging

---

## ECOMMERCE — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: ecommerce
- **Information Priority**: HIGH
- **Trust Priority**: MEDIUM

### Emotional Triggers
`desire | discovery | quality | value | style | confidence | social-proof | trend | luxury | lifestyle`

### Expected Emotions
- `quality`: confidence 0.90
- `value`: confidence 0.85
- `confidence`: confidence 0.80
- `discovery`: confidence 0.75
- `style`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Explore Collections
  2. View Details
  3. Compare Styles
  4. Read Reviews
  5. See Options
  6. Check Availability
  7. Explore Sizes
  8. View Similar Items
  9. See Pricing
  10. Explore Colors
  11. Compare Options
  12. View More Details

### Layout Intelligence
- **Density**: high
- **Whitespace**: 20-35%
- **Hierarchy**: distributed
- **Mobile Priority**: critical
- **Preferred Zones**: hero (product showcase), reviews/ratings, comparison section

### Visual Psychology
- **Energy**: medium-high
- **Primary Colors**: brand-specific, high-contrast, lifestyle-driven
- **Secondary Colors**: accent-colors, trust-badges, social-proof
- **Avoid**: unclear product presentation, low-quality images
- **Typography**: modern, confidence-driven, scannable
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: customer reviews, return policy, shipping info, social proof
- **Average Confidence**: 0.75

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.28
ctaClarity:     0.18
trustSignals:   0.20
offerClarity:   0.15
brandRecall:    0.19
```

### Recommendation Rules

**Review Rules**:
- id: `reviews_missing` | trigger: !customer_reviews && !rating_visible | severity: high | recommendation: Add customer reviews, ratings, or social proof | impact: +18

**Comparison Rules**:
- id: `sizing_unclear` | trigger: !size_guide && !comparison_available | severity: high | recommendation: Provide size guide, color options, or product comparison | impact: +16

**Trust Rules**:
- id: `shipping_policy_missing` | trigger: !shipping_info && !return_policy | severity: medium | recommendation: Display shipping options, delivery times, return policy | impact: +12

### Avoidance Patterns

**Visual**:
- Low-quality product images
- Unclear size/color options
- Missing lifestyle context
- Poor product positioning

**Layout**:
- No customer review section
- Unclear product specifications
- Missing size/return policy information
- Weak product comparison

**CTA**:
- "Buy Now" (too strong, not comparison stage)
- Vague "Shop" without context

**Copy**:
- No customer reviews or testimonials
- Missing sizing guidance
- No return/shipping clarity
- Weak product differentiation

---

## EDUCATION / EDTECH — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: education
- **Information Priority**: CRITICAL
- **Trust Priority**: HIGH

### Emotional Triggers
`achievement | confidence | growth | career-readiness | opportunity | success | learning | empowerment | credibility | outcome`

### Expected Emotions
- `career-readiness`: confidence 0.90
- `confidence`: confidence 0.85
- `credibility`: confidence 0.85
- `growth`: confidence 0.80
- `opportunity`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Learn More
  2. View Curriculum
  3. Compare Courses
  4. See Pricing
  5. Read Reviews
  6. Explore Program
  7. Check Prerequisites
  8. View Instructors
  9. Compare Options
  10. See Outcomes
  11. Explore Features
  12. Learn About Certification

### Layout Intelligence
- **Density**: high
- **Whitespace**: 20-35%
- **Hierarchy**: nested
- **Mobile Priority**: high
- **Preferred Zones**: curriculum section, instructor bios, outcomes/success section

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: blue, green, white, accent-orange
- **Secondary Colors**: gold, teal, brand-colors
- **Avoid**: boring, institutional, dull
- **Typography**: professional, clear, scannable
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: instructor credentials, course reviews, completion rates, employer recognition, certification
- **Average Confidence**: 0.85

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.18
ctaClarity:     0.20
trustSignals:   0.35
offerClarity:   0.18
brandRecall:    0.09
```

### Recommendation Rules

**Credibility Rules**:
- id: `instructor_unknown` | trigger: !instructor_credentials && !instructor_bio | severity: high | recommendation: Display instructor credentials, background, or industry experience | impact: +20

**Outcome Rules**:
- id: `outcomes_missing` | trigger: !career_outcomes && !success_metrics | severity: high | recommendation: Show job placement rates, salary outcomes, or employer recognition | impact: +22

**Review Rules**:
- id: `reviews_missing` | trigger: !student_reviews && !ratings | severity: medium | recommendation: Include student testimonials, completion rates, satisfaction scores | impact: +15

### Avoidance Patterns

**Visual**:
- Weak instructor credibility indicators
- Missing course outcome visuals
- Unclear curriculum structure
- No student success imagery

**Layout**:
- Vague curriculum description
- No instructor background info
- Missing course prerequisites
- No career outcome section

**CTA**:
- "Enroll Now" (too strong for consideration)
- Generic "Learn More" without course context

**Copy**:
- Incomplete curriculum details
- Missing instructor credentials
- No student outcome information
- Vague certification value

---

## ENTERTAINMENT / OTT / STREAMING — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: entertainment
- **Information Priority**: HIGH
- **Trust Priority**: MEDIUM

### Emotional Triggers
`curiosity | excitement | entertainment | emotional-connection | escape | fomo | cultural-importance | quality | value | community`

### Expected Emotions
- `quality`: confidence 0.90
- `excitement`: confidence 0.85
- `value`: confidence 0.80
- `community`: confidence 0.75
- `escape`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Watch More
  2. Explore Shows
  3. Compare Plans
  4. View Details
  5. See Full Catalog
  6. Read Reviews
  7. Check Availability
  8. View Original Content
  9. See Pricing
  10. Explore Genres
  11. View Recommendations
  12. Compare Features

### Layout Intelligence
- **Density**: high
- **Whitespace**: 15-30%
- **Hierarchy**: distributed with category organization
- **Mobile Priority**: critical
- **Preferred Zones**: hero (featured content), content grid, comparison section

### Visual Psychology
- **Energy**: high
- **Primary Colors**: black, dark-navy, brand-accent, bold-red
- **Secondary Colors**: gold, highlight-colors, genre-specific
- **Avoid**: washed-out, low-contrast, unclear content
- **Typography**: dramatic, scannable, bold
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: original content awards, critic scores, user ratings, content count
- **Average Confidence**: 0.75

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.25
ctaClarity:     0.18
trustSignals:   0.18
offerClarity:   0.20
brandRecall:    0.19
```

### Recommendation Rules

**Content Rules**:
- id: `content_unclear` | trigger: !content_description && !genre_clarity | severity: high | recommendation: Show content descriptions, genres, ratings, original indicators | impact: +18

**Comparison Rules**:
- id: `plan_comparison_missing` | trigger: !plan_feature_matrix | severity: high | recommendation: Display plan comparison (resolution, simultaneous streams, offline viewing) | impact: +18

**Social Rules**:
- id: `social_proof_missing` | trigger: !critic_score && !user_ratings | severity: medium | recommendation: Show critic/user ratings, top picks, trending indicators | impact: +14

### Avoidance Patterns

**Visual**:
- Unclear content positioning
- Low-quality promotional artwork
- Missing show/movie descriptions
- Weak content hierarchy

**Layout**:
- Overwhelming content grid without organization
- No content category grouping
- Missing plan comparison information
- Weak featured content section

**CTA**:
- "Subscribe Now" (too strong, not consideration)
- Vague "Watch" without show context

**Copy**:
- Incomplete show/movie descriptions
- Missing plan feature details
- No subscription value clarity
- Weak content differentiation

---

## FINANCE / INVESTMENT — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: finance
- **Information Priority**: CRITICAL
- **Trust Priority**: CRITICAL

### Emotional Triggers
`confidence | opportunity | growth | security | intelligence | control | success | transparency | reliability | empowerment`

### Expected Emotions
- `confidence`: confidence 0.95
- `transparency`: confidence 0.90
- `opportunity`: confidence 0.85
- `intelligence`: confidence 0.80
- `security`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Learn More
  2. Explore Solutions
  3. Compare Options
  4. View Pricing
  5. Get Quote
  6. See Performance
  7. Read Reviews
  8. Check Fees
  9. Explore Strategies
  10. View Tools
  11. Compare Services
  12. Learn About Investing

### Layout Intelligence
- **Density**: high
- **Whitespace**: 25-40%
- **Hierarchy**: clear
- **Mobile Priority**: high
- **Preferred Zones**: performance metrics section, fee comparison, credibility indicators

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: blue, dark-green, white, black
- **Secondary Colors**: gold, teal, chart-colors
- **Avoid**: red (loss signals), chaos, unclear charts
- **Typography**: professional, data-focused, clear
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: regulatory compliance, track record, fee transparency, expert credentials, performance data
- **Average Confidence**: 0.95

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.18
ctaClarity:     0.18
trustSignals:   0.45
offerClarity:   0.12
brandRecall:    0.07
```

### Recommendation Rules

**Trust Rules**:
- id: `compliance_missing` | trigger: !regulatory_badge && !compliance_mention | severity: critical | recommendation: Display regulatory compliance, licenses, or certifications | impact: +25

**Fee Rules**:
- id: `fees_unclear` | trigger: !transparent_fee_structure | severity: critical | recommendation: Show all fees clearly, provide fee comparison, explain fee structure | impact: +24

**Performance Rules**:
- id: `performance_missing` | trigger: !performance_data && !track_record | severity: high | recommendation: Display historical performance, returns, or track record | impact: +20

### Avoidance Patterns

**Visual**:
- Missing performance metrics
- Weak regulatory/compliance signals
- Unclear fee structure
- No expert/advisor credentials

**Layout**:
- Complex financial jargon without explanation
- No fee comparison section
- Missing compliance badges
- Weak performance visualization

**CTA**:
- "Invest Now" (too conversion-focused)
- Vague "Learn More" without purpose

**Copy**:
- Guaranteed returns claims (illegal)
- Missing regulatory compliance mention
- Unclear fee structure
- No expert credibility indicators

---

## FOOD / RESTAURANTS — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: food
- **Information Priority**: HIGH
- **Trust Priority**: MEDIUM

### Emotional Triggers
`quality | taste | experience | value | cleanliness | chef-reputation | authenticity | innovation | comfort | social-experience`

### Expected Emotions
- `quality`: confidence 0.95
- `value`: confidence 0.85
- `experience`: confidence 0.85
- `authenticity`: confidence 0.80
- `comfort`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. View Menu
  2. See Reviews
  3. Check Availability
  4. Make Reservation
  5. Explore Dishes
  6. Learn About Chef
  7. View Photos
  8. See Pricing
  9. Compare Restaurants
  10. Check Hours
  11. Read Testimonials
  12. View Locations

### Layout Intelligence
- **Density**: high
- **Whitespace**: 20-35%
- **Hierarchy**: nested
- **Mobile Priority**: critical
- **Preferred Zones**: menu section, reviews/ratings, chef/restaurant info

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: warm-colors by cuisine, gold, natural-tones
- **Secondary Colors**: brand-accent, garnish-colors, warmth
- **Avoid**: sterile, institutional, unclear dish presentation
- **Typography**: warm, inviting, clear
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: chef credentials, health ratings, customer reviews, ingredient transparency
- **Average Confidence**: 0.80

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.30
ctaClarity:     0.18
trustSignals:   0.22
offerClarity:   0.15
brandRecall:    0.15
```

### Recommendation Rules

**Review Rules**:
- id: `reviews_missing` | trigger: !customer_reviews && !ratings | severity: high | recommendation: Display customer reviews, ratings, or testimonials | impact: +18

**Menu Rules**:
- id: `menu_unclear` | trigger: !menu_details && !pricing | severity: high | recommendation: Show menu items, descriptions, prices, dietary information | impact: +16

**Chef Rules**:
- id: `chef_unknown` | trigger: !chef_credentials | severity: medium | recommendation: Highlight chef background, awards, or culinary expertise | impact: +12

### Avoidance Patterns

**Visual**:
- Low-quality menu photography
- Unclear ingredient sourcing
- Missing chef/restaurant story
- Weak health/cleanliness signals

**Layout**:
- Incomplete menu details
- No customer review section
- Missing pricing information
- Weak chef/restaurant credibility

**CTA**:
- "Order Now" (too strong for consideration)
- Vague "Reserve" without context

**Copy**:
- No menu descriptions
- Missing chef background
- No ingredient sourcing mention
- Weak customer testimonials

---

## GAMING — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: gaming
- **Information Priority**: HIGH
- **Trust Priority**: MEDIUM

### Emotional Triggers
`gameplay-depth | competition | community | progression | value | innovation | engagement | graphics-quality | fair-play | longevity`

### Expected Emotions
- `gameplay-depth`: confidence 0.90
- `community`: confidence 0.85
- `value`: confidence 0.80
- `progression`: confidence 0.75
- `fair-play`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Watch Gameplay
  2. Read Reviews
  3. Compare Features
  4. View System Requirements
  5. Check Platforms
  6. See Pricing
  7. Explore Game Modes
  8. Join Community
  9. View Screenshots
  10. Compare Games
  11. See Trailer
  12. Learn About Tournaments

### Layout Intelligence
- **Density**: high
- **Whitespace**: 15-30%
- **Hierarchy**: distributed with game showcase
- **Mobile Priority**: high
- **Preferred Zones**: gameplay video section, game mode showcase, community section

### Visual Psychology
- **Energy**: high
- **Primary Colors**: game-specific, neon-accents, bold-secondary
- **Secondary Colors**: team-colors, UI-colors, highlight-colors
- **Avoid**: dated graphics, low-quality screenshots
- **Typography**: bold, modern, energetic
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: false (low-medium)
- **Credibility Signals**: player count, tournament presence, streaming popularity, fair-play systems
- **Average Confidence**: 0.70

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.28
ctaClarity:     0.18
trustSignals:   0.15
offerClarity:   0.18
brandRecall:    0.21
```

### Recommendation Rules

**Gameplay Rules**:
- id: `gameplay_unclear` | trigger: !game_mode_details && !mechanic_explanation | severity: high | recommendation: Show game modes, mechanics explanation, or gameplay depth | impact: +18

**Community Rules**:
- id: `community_missing` | trigger: !player_count && !community_features | severity: medium | recommendation: Display active player count, community features, social elements | impact: +14

**System Rules**:
- id: `requirements_missing` | trigger: !system_requirements && !platform_info | severity: medium | recommendation: Show system requirements, compatible platforms, minimum specs | impact: +12

### Avoidance Patterns

**Visual**:
- Outdated or low-quality game screenshots
- Unclear game mode showcase
- Missing community indicators
- Weak protagonist/hero positioning

**Layout**:
- Vague game mechanic descriptions
- No system requirements information
- Missing community/multiplayer info
- Weak gameplay depth showcase

**CTA**:
- "Download Now" (too direct)
- Vague "Play" without context

**Copy**:
- No game mechanic explanation
- Missing player count or activity level
- Unclear game modes or depth
- No community or multiplayer context

---

## HEALTHCARE — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: healthcare
- **Information Priority**: CRITICAL
- **Trust Priority**: CRITICAL

### Emotional Triggers
`trust | relief | expertise | safety | clarity | care | empowerment | hope | credibility | transparency`

### Expected Emotions
- `trust`: confidence 0.95
- `expertise`: confidence 0.90
- `clarity`: confidence 0.85
- `care`: confidence 0.85
- `empowerment`: confidence 0.80

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Learn More
  2. Compare Plans
  3. Read Reviews
  4. View Providers
  5. Check Coverage
  6. See Pricing
  7. Schedule Consultation
  8. Explore Options
  9. View Specialists
  10. Learn About Treatment
  11. Compare Healthcare Providers
  12. Get More Information

### Layout Intelligence
- **Density**: high
- **Whitespace**: 25-40%
- **Hierarchy**: clear
- **Mobile Priority**: critical
- **Preferred Zones**: provider credentials section, treatment options, coverage information

### Visual Psychology
- **Energy**: low-medium
- **Primary Colors**: blue, green, white, calm-tones
- **Secondary Colors**: teal, trust-blue, healthcare-accents
- **Avoid**: clinical-white-overuse, aggressive-reds, confusing-charts
- **Typography**: professional, trustworthy, clear
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: doctor credentials, hospital affiliations, board certifications, patient testimonials, HIPAA compliance
- **Average Confidence**: 0.95

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.15
ctaClarity:     0.18
trustSignals:   0.45
offerClarity:   0.12
brandRecall:    0.10
```

### Recommendation Rules

**Credibility Rules**:
- id: `provider_credentials_missing` | trigger: !doctor_credentials && !board_certification | severity: critical | recommendation: Display doctor credentials, board certifications, or hospital affiliations | impact: +25

**Clarity Rules**:
- id: `treatment_unclear` | trigger: !treatment_description && !outcome_explanation | severity: high | recommendation: Explain treatment options, expected outcomes, or recovery timeline | impact: +20

**Coverage Rules**:
- id: `insurance_unclear` | trigger: !insurance_info && !coverage_details | severity: high | recommendation: Display accepted insurance, coverage details, or cost transparency | impact: +18

### Avoidance Patterns

**Visual**:
- Missing healthcare provider credentials
- Unclear treatment options
- No patient testimonials
- Weak compliance/HIPAA signals

**Layout**:
- Complex medical jargon without explanation
- No provider credibility section
- Missing insurance/coverage information
- Weak treatment outcome visualization

**CTA**:
- "Book Now" (too strong for consideration)
- Vague "Schedule" without appointment context

**Copy**:
- Incomplete treatment descriptions
- Missing provider credentials
- No patient outcome information
- Vague insurance/coverage details

---

## HOTELS — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: hotels
- **Information Priority**: HIGH
- **Trust Priority**: MEDIUM

### Emotional Triggers
`value | comfort | amenities | location | luxury | service-quality | convenience | safety | cleanliness | experience-quality`

### Expected Emotions
- `value`: confidence 0.90
- `comfort`: confidence 0.85
- `quality`: confidence 0.85
- `convenience`: confidence 0.80
- `safety`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. View Rooms
  2. Check Availability
  3. Compare Prices
  4. Read Reviews
  5. See Amenities
  6. View Photos
  7. Check Location
  8. View Rates
  9. See Special Offers
  10. Compare Hotels
  11. Check Policies
  12. Learn About Amenities

### Layout Intelligence
- **Density**: high
- **Whitespace**: 20-35%
- **Hierarchy**: nested
- **Mobile Priority**: critical
- **Preferred Zones**: room gallery, reviews/ratings, amenities section, pricing

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: warm-neutrals, whites, warm-golds
- **Secondary Colors**: brand-accent, amenity-colors, trust-blues
- **Avoid**: cold, institutional, unclear room presentation
- **Typography**: warm, inviting, clear
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: guest reviews, certification/awards, cleanliness guarantee, cancellation policy
- **Average Confidence**: 0.80

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.25
ctaClarity:     0.20
trustSignals:   0.20
offerClarity:   0.20
brandRecall:    0.15
```

### Recommendation Rules

**Room Rules**:
- id: `room_details_incomplete` | trigger: !room_specs && !bed_types | severity: high | recommendation: Show room types, bed configurations, amenities, square footage | impact: +18

**Review Rules**:
- id: `reviews_missing` | trigger: !guest_reviews && !ratings | severity: high | recommendation: Display guest reviews, ratings, cleanliness scores | impact: +16

**Amenity Rules**:
- id: `amenities_unclear` | trigger: !amenity_list && !facility_photos | severity: medium | recommendation: List amenities with icons/photos, highlight unique features | impact: +14

### Avoidance Patterns

**Visual**:
- Low-quality room photography
- Unclear room features or layout
- Missing amenity visuals
- Weak location context

**Layout**:
- Incomplete room descriptions
- No guest review section
- Missing amenity information
- Unclear pricing or availability

**CTA**:
- "Book Now" (too strong for consideration)
- Vague "Reserve" without room context

**Copy**:
- Incomplete room specifications
- Missing guest testimonials
- No amenity descriptions
- Unclear cancellation/booking policies

---

## LUXURY — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: luxury
- **Information Priority**: MEDIUM
- **Trust Priority**: MEDIUM

### Emotional Triggers
`exclusivity | craftsmanship | heritage | prestige | quality | exclusivity-verification | artistic-merit | investment-value | distinction`

### Expected Emotions
- `exclusivity`: confidence 0.90
- `craftsmanship`: confidence 0.85
- `heritage`: confidence 0.80
- `quality`: confidence 0.80
- `investment`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: medium (soft)
- **Aggression Level**: low
- **Examples** (12):
  1. Explore Collection
  2. View Details
  3. Learn More
  4. See Craftsmanship
  5. View Heritage
  6. Read Story
  7. See Authentication
  8. Compare Collections
  9. View Sizing
  10. Learn About Materials
  11. See Exclusivity Details
  12. View Waitlist Options

### Layout Intelligence
- **Density**: minimal
- **Whitespace**: 45-65%
- **Hierarchy**: clear (single focal point)
- **Mobile Priority**: medium
- **Preferred Zones**: hero (product/craftsmanship), story section, exclusivity indicator

### Visual Psychology
- **Energy**: low
- **Primary Colors**: black, white, gold, navy
- **Secondary Colors**: silver, jewel-tones, brand-accent
- **Avoid**: bright, busy, mass-market aesthetic
- **Typography**: elegant, minimal, bespoke
- **Branding**: prominent but refined

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: heritage mention, craftsmanship details, authentication, limited edition info, awards
- **Average Confidence**: 0.80

### Conversion Pressure
low

### Scoring Weights
```
visualClarity:  0.22
ctaClarity:     0.08
trustSignals:   0.20
offerClarity:   0.05
brandRecall:    0.45
```

### Recommendation Rules

**Authenticity Rules**:
- id: `authentication_missing` | trigger: !authenticity_info && !exclusivity_marker | severity: high | recommendation: Display authentication details, limited edition information, or exclusivity markers | impact: +18

**Heritage Rules**:
- id: `heritage_missing` | trigger: !craftsmanship_story | severity: medium | recommendation: Tell craftsmanship story, heritage background, or artisan details | impact: +14

**Exclusivity Rules**:
- id: `exclusivity_unclear` | trigger: !limited_edition && !availability_indicator | severity: medium | recommendation: Highlight limited availability, exclusivity level, or pre-order status | impact: +12

### Avoidance Patterns

**Visual**:
- Mass-market aesthetic
- Unclear product quality
- Missing craftsmanship details
- Weak exclusivity signals

**Layout**:
- Excessive text (luxury = visual)
- No craftsmanship/heritage section
- Missing authentication details
- Cluttered composition

**CTA**:
- "Add to Cart" (destroys luxury feel)
- "Buy Now" (too aggressive)

**Copy**:
- Aggressive selling language
- Feature lists instead of heritage
- No artisan/craftsmanship story
- Missing exclusivity context

---

## NEWS / MEDIA — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: news_media
- **Information Priority**: CRITICAL
- **Trust Priority**: CRITICAL

### Emotional Triggers
`credibility | importance | relevance | expertise | trusted-journalism | depth | multiple-perspectives | current-events-coverage`

### Expected Emotions
- `credibility`: confidence 0.95
- `expertise`: confidence 0.90
- `importance`: confidence 0.85
- `relevance`: confidence 0.80
- `depth`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Read Full Story
  2. View Coverage
  3. Explore Analysis
  4. Compare Coverage
  5. See Expert Views
  6. Watch Video
  7. Read Reportage
  8. Subscribe
  9. View Archives
  10. Read More from Journalists
  11. See Related Coverage
  12. Explore Investigative Series

### Layout Intelligence
- **Density**: high
- **Whitespace**: 20-35%
- **Hierarchy**: clear
- **Mobile Priority**: critical
- **Preferred Zones**: article hero, byline/credibility section, related coverage

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: publication-brand, red, white, black
- **Secondary Colors**: accent-colors, category-colors, secondary-brand
- **Avoid**: sensationalism, low-contrast, unclear credibility
- **Typography**: bold, authoritative, clear, scannable
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: journalist credentials, publication awards, editorial integrity, fact-checking
- **Average Confidence**: 0.95

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.22
ctaClarity:     0.15
trustSignals:   0.45
offerClarity:   0.10
brandRecall:    0.08
```

### Recommendation Rules

**Credibility Rules**:
- id: `byline_missing` | trigger: !journalist_byline && !journalist_credentials | severity: critical | recommendation: Display journalist name, credentials, or bio | impact: +22

**Coverage Rules**:
- id: `full_story_unclear` | trigger: !article_preview && !story_depth_indicator | severity: high | recommendation: Show article preview, depth indicators, or full story option | impact: +16

**Analysis Rules**:
- id: `context_missing` | trigger: !background_info && !related_coverage | severity: high | recommendation: Provide background context, related coverage, or expert analysis | impact: +15

### Avoidance Patterns

**Visual**:
- Missing journalist credentials
- Weak publication credibility
- No story depth indicator
- Unclear news importance

**Layout**:
- No byline or journalist info
- Missing background/context section
- No related coverage suggestions
- Weak editorial voice

**CTA**:
- "Subscribe Now" (too aggressive, not consideration)
- Vague "Read More" without context

**Copy**:
- Incomplete story information
- Missing journalist credentials
- No publication credibility mention
- Weak editorial context

---

## REAL ESTATE — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: real_estate
- **Information Priority**: HIGH
- **Trust Priority**: MEDIUM

### Emotional Triggers
`investment-value | location-quality | property-condition | neighborhood-appeal | lifestyle-fit | financial-security | ownership-pride`

### Expected Emotions
- `investment-value`: confidence 0.90
- `location-quality`: confidence 0.85
- `financial-security`: confidence 0.80
- `lifestyle-fit`: confidence 0.75
- `pride`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. View Details
  2. Schedule Tour
  3. Check Listing
  4. See Comparables
  5. View Neighborhood
  6. Get Appraisal
  7. Explore Location
  8. Check Financing Options
  9. View Multiple Listings
  10. Contact Agent
  11. Request More Info
  12. Compare Properties

### Layout Intelligence
- **Density**: high
- **Whitespace**: 25-40%
- **Hierarchy**: nested
- **Mobile Priority**: critical
- **Preferred Zones**: property gallery, property details, neighborhood info, market data

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: warm-neutrals, warm-browns, cream, white
- **Secondary Colors**: warm-gold, soft-green, trust-blue
- **Avoid**: cold, sterile, uninviting
- **Typography**: warm, professional, clear
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: agent credentials, market data, comparable properties, inspection reports, neighborhood data
- **Average Confidence**: 0.80

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.25
ctaClarity:     0.18
trustSignals:   0.22
offerClarity:   0.20
brandRecall:    0.15
```

### Recommendation Rules

**Property Rules**:
- id: `details_incomplete` | trigger: !property_specs && !room_count | severity: high | recommendation: Show square footage, room count, lot size, year built | impact: +18

**Neighborhood Rules**:
- id: `neighborhood_missing` | trigger: !neighborhood_info && !school_ratings | severity: high | recommendation: Display neighborhood amenities, school ratings, walkability scores | impact: +16

**Market Rules**:
- id: `market_data_missing` | trigger: !comparable_prices && !market_trend | severity: medium | recommendation: Show comparable properties, price trends, market analysis | impact: +14

### Avoidance Patterns

**Visual**:
- Low-quality property photography
- Unclear property layout or features
- Missing neighborhood context
- Weak location indicators

**Layout**:
- Incomplete property specifications
- No neighborhood information
- Missing market/comparable data
- Unclear pricing or financing

**CTA**:
- "Make Offer" (too strong for consideration)
- Vague "Schedule Tour" without property context

**Copy**:
- Incomplete property descriptions
- Missing neighborhood information
- No market data or comparables
- Unclear financing/pricing details

---

## SPORTS — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: sports
- **Information Priority**: HIGH
- **Trust Priority**: MEDIUM

### Emotional Triggers
`competition-level | player-talent | team-quality | entertainment-value | winning-culture | fan-engagement | live-experience | community`

### Expected Emotions
- `competition-level`: confidence 0.90
- `player-talent`: confidence 0.85
- `entertainment-value`: confidence 0.85
- `team-quality`: confidence 0.80
- `community`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. View Schedule
  2. Check Tickets
  3. Explore Players
  4. See Stats
  5. Watch Highlights
  6. Compare Teams
  7. View Rankings
  8. Join Community
  9. Check Scores
  10. Watch Full Game
  11. See Season Info
  12. Explore Events

### Layout Intelligence
- **Density**: high
- **Whitespace**: 15-30%
- **Hierarchy**: distributed with match/team showcase
- **Mobile Priority**: critical
- **Preferred Zones**: standings/scores, player stats, match schedule, ticket section

### Visual Psychology
- **Energy**: high
- **Primary Colors**: team-colors, bold-primary, high-contrast
- **Secondary Colors**: team-secondary, accent-colors, scoreboard-colors
- **Avoid**: generic, low-energy, unclear team positioning
- **Typography**: bold, confident, action-driven
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: player credentials, team credentials, league association, fan testimonials
- **Average Confidence**: 0.75

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.28
ctaClarity:     0.18
trustSignals:   0.15
offerClarity:   0.18
brandRecall:    0.21
```

### Recommendation Rules

**Stats Rules**:
- id: `stats_missing` | trigger: !player_stats && !team_statistics | severity: high | recommendation: Display player stats, team performance, win-loss records | impact: +18

**Schedule Rules**:
- id: `schedule_unclear` | trigger: !match_schedule && !upcoming_games | severity: high | recommendation: Show upcoming games, match schedule, ticket availability | impact: +16

**Community Rules**:
- id: `community_missing` | trigger: !fan_reviews && !team_community | severity: medium | recommendation: Highlight fan testimonials, community features, game day experience | impact: +12

### Avoidance Patterns

**Visual**:
- Low-quality player/team photos
- Unclear statistics or performance data
- Missing schedule information
- Weak team identity

**Layout**:
- Vague team/player descriptions
- No statistics or performance section
- Missing schedule/ticket information
- Weak community/fan engagement section

**CTA**:
- "Buy Tickets" (too direct for consideration)
- Vague "Join" without context

**Copy**:
- No player credentials or stats
- Missing team history or credentials
- No game day experience description
- Weak fan community messaging

---

## TECHNOLOGY — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: technology
- **Information Priority**: CRITICAL
- **Trust Priority**: MEDIUM

### Emotional Triggers
`capability | feature-depth | integrations | scalability | security | innovation | competitive-edge | reliability | vendor-credibility`

### Expected Emotions
- `capability`: confidence 0.95
- `feature-depth`: confidence 0.90
- `reliability`: confidence 0.85
- `security`: confidence 0.80
- `competitive-edge`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Watch Demo
  2. View Features
  3. Compare Plans
  4. See Pricing
  5. Read Case Studies
  6. Check Integrations
  7. View Documentation
  8. Get White Paper
  9. Schedule Demo
  10. Compare with Competitors
  11. View Customer Reviews
  12. Learn About Security

### Layout Intelligence
- **Density**: high
- **Whitespace**: 20-35%
- **Hierarchy**: nested
- **Mobile Priority**: high
- **Preferred Zones**: feature matrix, integration section, customer testimonial, pricing comparison

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: tech-blue, dark-navy, white, black
- **Secondary Colors**: bright-cyan, tech-accents, status-colors
- **Avoid**: dated, low-contrast, overly-complex
- **Typography**: modern, clean, scannable
- **Branding**: prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: enterprise customer logos, security certifications, industry awards, case studies
- **Average Confidence**: 0.80

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.22
ctaClarity:     0.20
trustSignals:   0.25
offerClarity:   0.18
brandRecall:    0.15
```

### Recommendation Rules

**Features Rules**:
- id: `features_unclear` | trigger: !feature_matrix && !integration_list | severity: high | recommendation: Create feature comparison matrix, show integrations, list key capabilities | impact: +18

**Security Rules**:
- id: `security_missing` | trigger: !security_certification && !compliance_badge | severity: high | recommendation: Display security certifications, compliance status, data protection measures | impact: +16

**Social Rules**:
- id: `customer_proof_missing` | trigger: !case_study && !customer_testimonials | severity: medium | recommendation: Include case studies, customer logos, or testimonials | impact: +14

### Avoidance Patterns

**Visual**:
- Complex, unclear product screenshots
- Missing feature comparison
- Weak security/compliance signals
- Vague integration capabilities

**Layout**:
- Overwhelming technical details without hierarchy
- No feature comparison matrix
- Missing customer proof section
- Unclear security/compliance badges

**CTA**:
- "Sign Up Now" (too strong for consideration)
- Vague "Try" without context

**Copy**:
- Incomplete feature descriptions
- Missing integration information
- No customer case studies
- Weak security/compliance messaging

---

## TRAVEL — Consideration Intelligence

### Metadata
- **Goal**: consideration
- **Vertical**: travel
- **Information Priority**: HIGH
- **Trust Priority**: MEDIUM

### Emotional Triggers
`destination-authenticity | value | experience-quality | safety | convenience | variety | unique-experiences | local-culture`

### Expected Emotions
- `destination-authenticity`: confidence 0.90
- `value`: confidence 0.85
- **experience-quality**: confidence 0.85
- `safety`: confidence 0.80
- `convenience`: confidence 0.75

### CTA Intelligence
- **Required**: false
- **Strength**: medium
- **Aggression Level**: medium
- **Examples** (12):
  1. Explore Packages
  2. View Itinerary
  3. Check Pricing
  4. Read Reviews
  5. See Photos
  6. View Map
  7. Compare Options
  8. Check Availability
  9. Learn About Destination
  10. See Travel Details
  11. Compare Packages
  12. Request Information

### Layout Intelligence
- **Density**: high
- **Whitespace**: 20-35%
- **Hierarchy**: nested
- **Mobile Priority**: critical
- **Preferred Zones**: destination gallery, itinerary section, reviews/ratings, pricing

### Visual Psychology
- **Energy**: medium-high
- **Primary Colors**: destination-specific, blues, warm-tones
- **Secondary Colors**: accent-colors, tropical-tones, travel-brand-colors
- **Avoid**: generic stock photos, unclear destination
- **Typography**: modern, inviting, clear
- **Branding**: balanced

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: traveler reviews, travel company credentials, destination ratings, safety info
- **Average Confidence**: 0.80

### Conversion Pressure
medium

### Scoring Weights
```
visualClarity:  0.28
ctaClarity:     0.18
trustSignals:   0.18
offerClarity:   0.20
brandRecall:    0.16
```

### Recommendation Rules

**Itinerary Rules**:
- id: `itinerary_unclear` | trigger: !day_breakdown && !activity_list | severity: high | recommendation: Provide detailed day-by-day itinerary, activity descriptions | impact: +18

**Review Rules**:
- id: `reviews_missing` | trigger: !traveler_reviews && !ratings | severity: high | recommendation: Display traveler reviews, destination ratings, testimonials | impact: +16

**Details Rules**:
- id: `travel_details_missing` | trigger: !duration_info && !included_services | severity: medium | recommendation: Show trip duration, included services, costs breakdown | impact: +14

### Avoidance Patterns

**Visual**:
- Generic or stock destination photos
- Unclear destination identity
- Low-quality photography
- Missing activity/experience context

**Layout**:
- No detailed itinerary section
- Missing traveler review/rating section
- Unclear pricing or included services
- Weak destination differentiation

**CTA**:
- "Book Now" (too strong for consideration)
- Vague "Explore" without trip context

**Copy**:
- Incomplete itinerary details
- Missing traveler testimonials
- No pricing/cost clarity
- Vague included services description
