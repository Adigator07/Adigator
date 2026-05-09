# Conversion Campaign Behavioral Intelligence Dataset

Production-grade intelligence dataset for conversion-stage creatives.

**Goal**: Direct sale, transaction completion, friction reduction

---

## Conversion Campaign Characteristics

| Dimension | Value |
|-----------|-------|
| **Primary Focus** | Call-to-action clarity + Urgency + Friction reduction |
| **CTA Pressure** | High (direct action CTAs) |
| **Trust Priority** | High (final decision stage) |
| **Conversion Pressure** | High |
| **Visual Energy** | High |
| **Information Load** | Focused (only conversion-relevant) |
| **Urgency** | High |

---

## AUTOMOTIVE — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: automotive
- **Information Priority**: MEDIUM
- **Trust Priority**: HIGH

### Emotional Triggers
`urgency | scarcity | capability | confidence | ownership-excitement | deal-value | limited-time | power | control`

### Expected Emotions
- `confidence`: confidence 0.95
- `capability`: confidence 0.90
- `deal-value`: confidence 0.85
- `urgency`: confidence 0.80
- `ownership-excitement`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Claim This Deal
  2. Get Offer Now
  3. Reserve This Vehicle
  4. Secure Financing
  5. Get Pre-Approved
  6. Schedule Test Drive
  7. Take Advantage Today
  8. Claim Limited Offer
  9. Get Approved Now
  10. Reserve Today
  11. Get Your Offer
  12. Act Now

### Layout Intelligence
- **Density**: high
- **Whitespace**: 10-20%
- **Hierarchy**: CTA-focused
- **Mobile Priority**: critical
- **Preferred Zones**: hero (vehicle + CTA), offer banner (urgency), bottom (CTA repeat)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: brand-color, action-red, high-contrast
- **Secondary Colors**: urgency-orange, accent-gold, metallic
- **Avoid**: low-contrast, subtle
- **Typography**: bold, commanding, urgent
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: limited-time banner, inventory alert, financing pre-approval, safety ratings display
- **Average Confidence**: 0.90

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.35
urgencySignals: 0.25
offerClarity:   0.20
trustSignals:   0.15
visualClarity:  0.05
```

### Recommendation Rules

**Urgency Rules**:
- id: `urgency_missing` | trigger: !limited_time_banner && !inventory_alert | severity: critical | recommendation: Display limited-time offer, inventory count, or time-remaining urgency | impact: +30

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA larger, bolder, action-oriented (Get Offer Now, Claim Deal, etc.) | impact: +28

**Offer Clarity Rules**:
- id: `offer_terms_missing` | trigger: !offer_details && !savings_amount | severity: high | recommendation: Show exact offer terms, savings amount, deadline clearly | impact: +20

### Avoidance Patterns

**Visual**:
- Unclear call-to-action button
- Missing urgency/scarcity signals
- Weak offer positioning
- Low-contrast CTA elements

**Layout**:
- No urgency banner
- CTA not prominent enough
- No inventory alert
- Confusing offer structure

**CTA**:
- Weak verbs ("Learn More", "Explore", "Browse")
- No time sensitivity
- No action clarity

**Copy**:
- No offer terms clarity
- Missing urgency language
- No limited-time indicators
- Unclear financing options

---

## BANKING / FINTECH — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: banking
- **Information Priority**: LOW
- **Trust Priority**: CRITICAL

### Emotional Triggers
`urgency | security | confidence | financial-relief | control | trust | guarantee | limited-offer`

### Expected Emotions
- `trust`: confidence 0.95
- `security`: confidence 0.95
- `confidence`: confidence 0.90
- `financial-relief`: confidence 0.85
- `urgency`: confidence 0.70

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Open Account Now
  2. Apply Today
  3. Get Started
  4. Claim Bonus
  5. Sign Up Now
  6. Join Today
  7. Get Approved
  8. Activate Account
  9. Start Saving
  10. Apply Immediately
  11. Secure Your Rate
  12. Lock In Today

### Layout Intelligence
- **Density**: low-medium
- **Whitespace**: 30-50%
- **Hierarchy**: CTA-focused, trust-first
- **Mobile Priority**: critical
- **Preferred Zones**: security banner (top), offer details (hero), CTA (prominent), urgency (top/bottom)

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: trust-blue, action-green, white
- **Secondary Colors**: security-green, accent-blue, reassurance-color
- **Avoid**: warning-red, chaos, low-contrast
- **Typography**: professional, clear, commanding
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: security badges, compliance display, limited-time bonus offer, APY guarantee
- **Average Confidence**: 0.95

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.30
urgencySignals: 0.20
trustSignals:   0.35
offerClarity:   0.10
visualClarity:  0.05
```

### Recommendation Rules

**Trust Rules**:
- id: `security_missing` | trigger: !security_badge && !compliance_visible | severity: critical | recommendation: Display security badges, compliance status, guarantee prominently | impact: +35

**Urgency Rules**:
- id: `offer_expiration_missing` | trigger: !offer_deadline && !bonus_expiration | severity: high | recommendation: Show bonus expiration date, limited-time offer, time-remaining | impact: +22

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA prominent: "Open Account Now", "Claim Bonus Today", "Get Approved" | impact: +28

### Avoidance Patterns

**Visual**:
- Unclear call-to-action button
- Missing security/trust signals
- Weak offer positioning
- Low-contrast security badges

**Layout**:
- No security banner
- CTA not prominent enough
- No offer terms display
- No urgency section

**CTA**:
- Weak verbs ("Learn More", "Explore")
- No time sensitivity
- No action clarity

**Copy**:
- No APY/fee clarity
- Missing bonus offer details
- No compliance mention
- Unclear offer terms

---

## ECOMMERCE — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: ecommerce
- **Information Priority**: MEDIUM
- **Trust Priority**: MEDIUM

### Emotional Triggers
`urgency | scarcity | desire | exclusivity | deal-value | limited-inventory | fomo | social-proof | quick-decision`

### Expected Emotions
- `desire`: confidence 0.95
- `urgency`: confidence 0.90
- `exclusivity`: confidence 0.85
- `deal-value`: confidence 0.80
- `confidence`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Buy Now
  2. Add to Cart
  3. Claim Offer
  4. Get It Now
  5. Order Today
  6. Secure Yours
  7. Limited Stock - Buy
  8. Get Exclusive Deal
  9. Grab Deal
  10. Shop Now
  11. Complete Purchase
  12. Get It Today

### Layout Intelligence
- **Density**: high
- **Whitespace**: 10-25%
- **Hierarchy**: CTA-focused, urgency-driven
- **Mobile Priority**: critical
- **Preferred Zones**: hero (product + urgency), CTA (multiple placements), limited-stock banner

### Visual Psychology
- **Energy**: high
- **Primary Colors**: action-red, brand-accent, high-contrast
- **Secondary Colors**: urgency-orange, scarcity-red, deal-highlight
- **Avoid**: low-contrast, subtle
- **Typography**: bold, commanding, urgent
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: stock-count display, customer testimonials, return guarantee, payment security icons
- **Average Confidence**: 0.80

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.32
urgencySignals: 0.28
offerClarity:   0.22
trustSignals:   0.12
visualClarity:  0.06
```

### Recommendation Rules

**Urgency Rules**:
- id: `scarcity_missing` | trigger: !limited_stock && !time_remaining | severity: critical | recommendation: Display limited stock count, time-remaining on offer, or only-X-left alert | impact: +32

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA bold and action-oriented: "Buy Now", "Add to Cart", "Secure Yours" | impact: +30

**Deal Clarity Rules**:
- id: `offer_terms_missing` | trigger: !discount_percentage && !savings_amount | severity: high | recommendation: Show discount percentage, savings amount, original price clearly | impact: +20

### Avoidance Patterns

**Visual**:
- Unclear call-to-action button
- Missing stock/urgency indicators
- Weak price display
- Low-contrast deal presentation

**Layout**:
- No limited-stock banner
- CTA not prominent/repeatable
- No urgency section
- Confusing pricing display

**CTA**:
- Weak verbs ("Learn More", "View Details")
- No action clarity

**Copy**:
- Incomplete offer details
- No savings clarity
- No return guarantee mention
- Unclear payment/shipping terms

---

## EDUCATION / EDTECH — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: education
- **Information Priority**: LOW
- **Trust Priority**: HIGH

### Emotional Triggers
`urgency | limited-spots | achievement | confidence | career-readiness | fomo | early-bird-bonus | exclusivity`

### Expected Emotions
- `confidence`: confidence 0.95
- `career-readiness`: confidence 0.90
- `urgency`: confidence 0.85
- `achievement`: confidence 0.80
- `fomo`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Enroll Now
  2. Claim Spot
  3. Register Today
  4. Secure Your Seat
  5. Join Cohort
  6. Get Early Bird Bonus
  7. Enroll Before Deadline
  8. Start Learning
  9. Claim Limited Offer
  10. Lock In Price
  11. Reserve Spot Now
  12. Apply Today

### Layout Intelligence
- **Density**: medium
- **Whitespace**: 20-35%
- **Hierarchy**: CTA-focused, urgency-driven
- **Mobile Priority**: critical
- **Preferred Zones**: hero (program + urgency), offer banner (early-bird), CTA (prominent)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: action-blue, accent-green, high-contrast
- **Secondary Colors**: urgency-orange, success-green, early-bird-gold
- **Avoid**: boring, institutional, low-contrast
- **Typography**: bold, confident, urgent
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: instructor credentials again, limited-spots alert, deadline display, price-lock guarantee
- **Average Confidence**: 0.92

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.32
urgencySignals: 0.25
trustSignals:   0.25
offerClarity:   0.12
visualClarity:  0.06
```

### Recommendation Rules

**Urgency Rules**:
- id: `deadline_missing` | trigger: !enrollment_deadline && !early_bird_deadline | severity: critical | recommendation: Display enrollment deadline, early-bird offer deadline, spots-remaining | impact: +32

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA action-oriented: "Enroll Now", "Claim Spot", "Secure Your Seat" | impact: +30

**Offer Clarity Rules**:
- id: `offer_terms_missing` | trigger: !early_bird_price && !discount_clarity | severity: high | recommendation: Show early-bird price, price increase date, savings amount | impact: +22

### Avoidance Patterns

**Visual**:
- Unclear enrollment button
- Missing deadline/urgency signals
- Weak offer positioning
- Low-contrast urgency elements

**Layout**:
- No deadline banner
- CTA not prominent enough
- No early-bird offer section
- Vague limited-spots messaging

**CTA**:
- Weak verbs ("Learn More", "Explore")
- No action/deadline clarity

**Copy**:
- Incomplete offer terms
- Missing deadline information
- No price-lock guarantee
- Unclear course start date

---

## ENTERTAINMENT / OTT / STREAMING — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: entertainment
- **Information Priority**: LOW
- **Trust Priority**: MEDIUM

### Emotional Triggers
`urgency | fomo | exclusive-content | free-trial | limited-offer | excitement | access | membership-benefits`

### Expected Emotions
- `excitement`: confidence 0.95
- `fomo`: confidence 0.90
- `access-to-exclusivity`: confidence 0.85
- `confidence`: confidence 0.80
- `relief`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Start Free Trial
  2. Subscribe Now
  3. Unlock Access
  4. Join Today
  5. Get Instant Access
  6. Claim Free Month
  7. Start Streaming
  8. Activate Account
  9. Claim Your Trial
  10. Subscribe for Access
  11. Get Full Access
  12. Start Watching

### Layout Intelligence
- **Density**: medium
- **Whitespace**: 20-35%
- **Hierarchy**: CTA-focused, benefit-driven
- **Mobile Priority**: critical
- **Preferred Zones**: hero (featured content + CTA), free-trial banner, benefits section, CTA (prominent)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: action-primary, brand-accent, high-contrast
- **Secondary Colors**: free-offer-gold, highlight-color, urgency-orange
- **Avoid**: low-contrast, subtle, boring
- **Typography**: bold, exciting, urgent
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: free-trial guarantee, no-commitment offer, cancel-anytime message, content showcase
- **Average Confidence**: 0.80

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.30
urgencySignals: 0.22
offerClarity:   0.28
trustSignals:   0.12
visualClarity:  0.08
```

### Recommendation Rules

**Urgency Rules**:
- id: `trial_expiration_missing` | trigger: !free_trial_deadline | severity: critical | recommendation: Display free trial length, expiration deadline, or cancel-by date | impact: +28

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA prominent: "Start Free Trial", "Get Instant Access", "Subscribe Now" | impact: +32

**Offer Clarity Rules**:
- id: `trial_terms_missing` | trigger: !free_trial_terms && !cancel_message | severity: high | recommendation: Show free trial length, cancellation terms, or no-commitment guarantee | impact: +20

### Avoidance Patterns

**Visual**:
- Unclear call-to-action button
- Missing free-trial offer details
- Weak benefit positioning
- Low-contrast CTA elements

**Layout**:
- No free-trial banner
- CTA not prominent enough
- No cancel-anytime messaging
- Vague subscription terms

**CTA**:
- Weak verbs ("Explore", "Learn More")
- No action clarity

**Copy**:
- No free-trial terms clarity
- Missing cancellation terms
- No benefit clarity
- Vague subscription details

---

## FINANCE / INVESTMENT — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: finance
- **Information Priority**: LOW
- **Trust Priority**: CRITICAL

### Emotional Triggers
`urgency | opportunity | market-window | limited-offer | confidence | control | action | decision-time`

### Expected Emotions
- `confidence`: confidence 0.95
- `security`: confidence 0.95
- `opportunity`: confidence 0.90
- `urgency`: confidence 0.80
- `control`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Open Account Now
  2. Apply Today
  3. Get Started
  4. Invest Now
  5. Claim Offer
  6. Lock In Rate
  7. Start Investing
  8. Apply Immediately
  9. Get Approved
  10. Begin Investing
  11. Secure Rate Today
  12. Complete Application

### Layout Intelligence
- **Density**: low
- **Whitespace**: 35-50%
- **Hierarchy**: CTA-focused, trust-first
- **Mobile Priority**: critical
- **Preferred Zones**: security/trust banner (top), offer details (hero), CTA (prominent), urgency (top/bottom)

### Visual Psychology
- **Energy**: medium-high
- **Primary Colors**: trust-blue, action-green, white
- **Secondary Colors**: security-green, opportunity-gold, urgency-orange
- **Avoid**: warning-red, chaos, uncertainty
- **Typography**: professional, bold, commanding
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: regulatory compliance badge, security guarantee, rate-lock promise, compliance display
- **Average Confidence**: 0.96

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.25
urgencySignals: 0.15
trustSignals:   0.45
offerClarity:   0.10
visualClarity:  0.05
```

### Recommendation Rules

**Trust Rules**:
- id: `compliance_missing` | trigger: !regulatory_badge && !security_guarantee | severity: critical | recommendation: Display regulatory compliance, security guarantee, or compliance promise prominently | impact: +40

**Urgency Rules**:
- id: `rate_expiration_missing` | trigger: !rate_lock_deadline | severity: critical | recommendation: Show rate-lock deadline or limited-time offer terms | impact: +25

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA commanding: "Open Account Now", "Apply Today", "Lock In Rate" | impact: +32

### Avoidance Patterns

**Visual**:
- Unclear call-to-action button
- Missing regulatory/trust signals
- Weak offer positioning
- Low-contrast security elements

**Layout**:
- No security/compliance banner
- CTA not prominent enough
- No rate-lock/offer deadline
- Vague urgency messaging

**CTA**:
- Weak verbs ("Learn More", "Explore")
- No action/urgency clarity

**Copy**:
- Incomplete offer terms
- Missing regulatory/compliance mention
- No rate-lock guarantee
- Unclear application process

---

## FOOD / RESTAURANTS — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: food
- **Information Priority**: MEDIUM
- **Trust Priority**: MEDIUM

### Emotional Triggers
`urgency | hunger | desire | exclusivity | limited-availability | limited-time-offer | immediacy | action`

### Expected Emotions
- `desire`: confidence 0.95
- `urgency`: confidence 0.90
- `exclusivity`: confidence 0.80
- `confidence`: confidence 0.80
- `relief`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Order Now
  2. Reserve Table
  3. Claim Offer
  4. Book Table Now
  5. Get It Delivered
  6. Order Pickup
  7. Secure Reservation
  8. Order Today
  9. Get Exclusive Deal
  10. Book Now
  11. Order for Delivery
  12. Reserve Spot

### Layout Intelligence
- **Density**: high
- **Whitespace**: 10-25%
- **Hierarchy**: CTA-focused, offer-driven
- **Mobile Priority**: critical
- **Preferred Zones**: hero (food imagery + urgency), offer banner, CTA (multiple), special offer

### Visual Psychology
- **Energy**: high
- **Primary Colors**: appetite-colors by cuisine, action-accent, high-contrast
- **Secondary Colors**: urgency-orange, exclusivity-gold, action-red
- **Avoid**: clinical, sterile, uninviting
- **Typography**: bold, hungry, urgent
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: false (low-medium)
- **Credibility Signals**: limited-time offer, limited-availability alert, delivery guarantee, chef-special badge
- **Average Confidence**: 0.75

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.32
urgencySignals: 0.25
offerClarity:   0.25
trustSignals:   0.10
visualClarity:  0.08
```

### Recommendation Rules

**Urgency Rules**:
- id: `limited_offer_missing` | trigger: !time_limited_offer && !limited_availability | severity: critical | recommendation: Display limited-time offer, table availability, or delivery-today alert | impact: +30

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA action-oriented: "Order Now", "Reserve Table Now", "Get It Delivered" | impact: +32

**Deal Clarity Rules**:
- id: `offer_terms_missing` | trigger: !discount_details && !special_offer_terms | severity: high | recommendation: Show discount amount, offer expiration, or special offer details | impact: +20

### Avoidance Patterns

**Visual**:
- Unclear ordering button
- Missing limited-offer indicators
- Weak price/deal display
- Low-contrast CTA elements

**Layout**:
- No time-limited-offer banner
- CTA not prominent/repeatable
- No special-offer section
- Vague delivery/reservation terms

**CTA**:
- Weak verbs ("Explore", "Learn More")
- No immediacy in messaging

**Copy**:
- No offer details clarity
- Missing delivery/reservation info
- Vague special offer description
- Unclear ordering process

---

## GAMING — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: gaming
- **Information Priority**: LOW
- **Trust Priority**: MEDIUM

### Emotional Triggers
`urgency | fomo | exclusive-access | limited-spots | early-access | founder-status | community-access | immediate-play`

### Expected Emotions
- `fomo`: confidence 0.95
- `exclusivity`: confidence 0.90
- `urgency`: confidence 0.85
- `confidence`: confidence 0.80
- `excitement`: confidence 0.80

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Download Now
  2. Play Now
  3. Claim Beta Access
  4. Get Instant Access
  5. Join Community
  6. Start Playing
  7. Get Founder Status
  8. Unlock Early Access
  9. Begin Playing
  10. Claim Your Spot
  11. Download Free
  12. Play Immediately

### Layout Intelligence
- **Density**: high
- **Whitespace**: 10-25%
- **Hierarchy**: CTA-focused, urgency-driven
- **Mobile Priority**: critical
- **Preferred Zones**: hero (game showcase + CTA), beta/early-access banner, excitement section, CTA (prominent)

### Visual Psychology
- **Energy**: very high
- **Primary Colors**: action-primary, brand-accent, high-contrast, neon
- **Secondary Colors**: urgency-orange, exclusive-gold, community-highlight
- **Avoid**: low-contrast, dull, boring
- **Typography**: bold, energetic, urgent
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: beta-access limited, founder-badge, community-size, fair-play guarantee
- **Average Confidence**: 0.75

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.35
urgencySignals: 0.28
offerClarity:   0.20
trustSignals:   0.10
visualClarity:  0.07
```

### Recommendation Rules

**Urgency Rules**:
- id: `beta_limit_missing` | trigger: !limited_beta_spots && !exclusive_access_deadline | severity: critical | recommendation: Display limited beta spots, founder-status availability, or exclusive-access deadline | impact: +32

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA bold: "Download Now", "Play Immediately", "Claim Beta Access" | impact: +35

**Access Clarity Rules**:
- id: `access_terms_missing` | trigger: !early_access_details && !availability_info | severity: high | recommendation: Show early-access benefits, availability, or release date | impact: +22

### Avoidance Patterns

**Visual**:
- Unclear download/play button
- Missing beta/exclusive-access indicators
- Weak urgency positioning
- Low-contrast CTA elements

**Layout**:
- No beta-access/limited-spots banner
- CTA not prominent/repeatable
- No exclusive-access section
- Vague availability messaging

**CTA**:
- Weak verbs ("Learn More", "Explore")
- No action clarity

**Copy**:
- No early-access details
- Missing availability information
- Vague benefits explanation
- Unclear platform/system requirements

---

## HEALTHCARE — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: healthcare
- **Information Priority**: LOW
- **Trust Priority**: CRITICAL

### Emotional Triggers
`urgency | action | relief | trust | confidence | care | health-priority | decisive-action`

### Expected Emotions
- `trust`: confidence 0.95
- `confidence`: confidence 0.95
- `relief`: confidence 0.90
- `urgency`: confidence 0.80
- `action`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Schedule Now
  2. Book Appointment
  3. Get Started
  4. Apply Today
  5. Enroll Now
  6. Claim Coverage
  7. Join Plan
  8. Activate Coverage
  9. Schedule Consultation
  10. Book Your Visit
  11. Start Treatment
  12. Secure Your Plan

### Layout Intelligence
- **Density**: low
- **Whitespace**: 30-50%
- **Hierarchy**: CTA-focused, trust-first
- **Mobile Priority**: critical
- **Preferred Zones**: trust banner (top), appointment/enrollment CTA (hero), urgency (top), confirmation (bottom)

### Visual Psychology
- **Energy**: medium
- **Primary Colors**: trust-blue, action-green, calm-white
- **Secondary Colors**: care-teal, confidence-green, action-accent
- **Avoid**: clinical-sterile, emergency-red, fear-based
- **Typography**: professional, calming, commanding
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: HIPAA badge, provider credentials, guarantee, immediate-availability promise
- **Average Confidence**: 0.96

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.28
urgencySignals: 0.12
trustSignals:   0.45
offerClarity:   0.08
visualClarity:  0.07
```

### Recommendation Rules

**Trust Rules**:
- id: `hipaa_missing` | trigger: !hipaa_badge && !privacy_guarantee | severity: critical | recommendation: Display HIPAA compliance, privacy guarantee, or confidentiality commitment prominently | impact: +40

**Urgency Rules**:
- id: `availability_missing` | trigger: !appointment_availability && !waitlist_info | severity: high | recommendation: Show appointment availability, next-available date, or urgent-care notice | impact: +20

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA commanding: "Schedule Now", "Book Appointment", "Apply Today" | impact: +35

### Avoidance Patterns

**Visual**:
- Unclear scheduling/booking button
- Missing trust/HIPAA signals
- Weak provider credibility display
- Low-contrast security elements

**Layout**:
- No HIPAA/trust banner
- CTA not prominent enough
- No provider credentials section
- Vague appointment terms

**CTA**:
- Weak verbs ("Learn More", "Explore")
- No action clarity

**Copy**:
- Incomplete appointment/coverage details
- Missing HIPAA/privacy commitment
- No provider credibility mention
- Unclear enrollment process

---

## HOTELS — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: hotels
- **Information Priority**: MEDIUM
- **Trust Priority**: MEDIUM

### Emotional Triggers
`urgency | scarcity | deal-value | limited-availability | immediacy | booking-confidence | exclusive-offer`

### Expected Emotions
- `deal-value`: confidence 0.95
- `urgency`: confidence 0.90
- `exclusivity`: confidence 0.85
- `confidence`: confidence 0.80
- `relief`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Book Now
  2. Reserve Now
  3. Claim Deal
  4. Secure Reservation
  5. Book This Rate
  6. Get This Price
  7. Reserve Today
  8. Complete Booking
  9. Lock In Price
  10. Book Your Stay
  11. Secure Your Room
  12. Get Exclusive Rate

### Layout Intelligence
- **Density**: high
- **Whitespace**: 15-30%
- **Hierarchy**: CTA-focused, scarcity-driven
- **Mobile Priority**: critical
- **Preferred Zones**: booking widget (hero), limited-availability banner, price-lock section, CTA (prominent)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: action-primary, booking-accent, high-contrast
- **Secondary Colors**: urgency-orange, deal-gold, scarcity-red
- **Avoid**: low-contrast, unclear pricing
- **Typography**: bold, commanding, urgent
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: limited-availability alert, price-lock guarantee, secure-booking badge, best-price promise
- **Average Confidence**: 0.80

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.32
urgencySignals: 0.25
offerClarity:   0.25
trustSignals:   0.12
visualClarity:  0.06
```

### Recommendation Rules

**Urgency Rules**:
- id: `availability_missing` | trigger: !room_count_available && !limited_availability_alert | severity: critical | recommendation: Display available rooms count, limited-availability alert, or sold-out-soon warning | impact: +30

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA action-oriented: "Book Now", "Secure Reservation", "Lock In Price" | impact: +32

**Price Clarity Rules**:
- id: `price_unclear` | trigger: !clear_pricing && !all_fees_included | severity: high | recommendation: Show all-inclusive pricing, no-hidden-fees guarantee, or price-breakdown | impact: +20

### Avoidance Patterns

**Visual**:
- Unclear booking button
- Missing availability/scarcity signals
- Weak price display
- Low-contrast CTA elements

**Layout**:
- No limited-availability banner
- CTA not prominent enough
- No price-lock section
- Vague cancellation terms

**CTA**:
- Weak verbs ("Check Availability", "Learn More")
- No booking immediacy

**Copy**:
- Incomplete pricing details
- Missing cancellation/booking terms
- Vague special-offer description
- Unclear room-selection process

---

## LUXURY — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: luxury
- **Information Priority**: VERY LOW
- **Trust Priority**: HIGH

### Emotional Triggers
`exclusivity | scarcity | prestige | now-or-never | limited-edition | investment-decision | ownership-certainty | decision-moment`

### Expected Emotions
- `exclusivity`: confidence 0.95
- `prestige`: confidence 0.90
- `urgency`: confidence 0.80
- `confidence`: confidence 0.85
- `ownership`: confidence 0.80

### CTA Intelligence
- **Required**: true
- **Strength**: medium (subtle but commanding)
- **Aggression Level**: low-medium
- **Examples** (12):
  1. Secure Yours
  2. Claim Ownership
  3. Reserve Today
  4. Acquire Now
  5. Join Collectors
  6. Secure Your Piece
  7. Complete Your Collection
  8. Order Your Exclusive
  9. Claim Limited Edition
  10. Reserve Exclusive
  11. Secure Investment
  12. Finalize Purchase

### Layout Intelligence
- **Density**: minimal
- **Whitespace**: 50-70%
- **Hierarchy**: CTA subtle but clear, scarcity-essential
- **Mobile Priority**: medium
- **Preferred Zones**: scarcity indicator (top), hero (product), acquisition CTA (elegant bottom)

### Visual Psychology
- **Energy**: low
- **Primary Colors**: black, white, gold, jewel-tones
- **Secondary Colors**: exclusivity-accent, status-color, prestige-tone
- **Avoid**: bright, aggressive, mass-market
- **Typography**: elegant, refined, commanding (subtly)
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: true (medium)
- **Credibility Signals**: exclusivity-marker, limited-edition badge, authentication-guarantee, ownership-certificate
- **Average Confidence**: 0.85

### Conversion Pressure
high (but refined)

### Scoring Weights
```
ctaClarity:     0.20
urgencySignals: 0.20
trustSignals:   0.25
offerClarity:   0.05
visualClarity:  0.30
```

### Recommendation Rules

**Scarcity Rules**:
- id: `exclusivity_missing` | trigger: !limited_edition_badge && !only_X_available | severity: critical | recommendation: Display only-X-available, limited-edition status, or exclusive-to-collectors message | impact: +32

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "medium" | severity: high | recommendation: Make CTA clear but elegant: "Secure Yours", "Claim Your Piece", "Complete Your Collection" | impact: +24

**Authentication Rules**:
- id: `authenticity_missing` | trigger: !certificate_info && !authentication_guarantee | severity: critical | recommendation: Display authentication certificate, provenance, or ownership guarantee | impact: +28

### Avoidance Patterns

**Visual**:
- Unclear acquisition button
- Missing scarcity/exclusivity markers
- Weak authentication signals
- Generic presentation

**Layout**:
- No limited-edition badge
- CTA not clear enough
- No authentication/provenance section
- Missing exclusivity context

**CTA**:
- Weak verbs ("Shop", "Buy", "Add to Cart")
- No exclusivity/scarcity language

**Copy**:
- No authentication details
- Missing exclusivity messaging
- Vague limited-edition status
- Unclear ownership benefits

---

## NEWS / MEDIA — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: news_media
- **Information Priority**: LOW
- **Trust Priority**: CRITICAL

### Emotional Triggers
`urgency | fomo | news-importance | expert-insight | subscriber-exclusivity | limited-trial | subscription-value`

### Expected Emotions
- `credibility`: confidence 0.95
- `urgency`: confidence 0.90
- `fomo`: confidence 0.85
- `exclusivity`: confidence 0.80
- `confidence`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Subscribe Now
  2. Start Free Trial
  3. Unlock Full Access
  4. Claim Trial
  5. Join Subscribers
  6. Get Premium Access
  7. Subscribe Today
  8. Claim Exclusive Access
  9. Begin Subscription
  10. Get Full Coverage
  11. Activate Membership
  12. Subscribe for Insights

### Layout Intelligence
- **Density**: medium
- **Whitespace**: 25-40%
- **Hierarchy**: CTA-focused, publication-trust-driven
- **Mobile Priority**: critical
- **Preferred Zones**: trust banner (publication credibility), subscription offer, free-trial banner, CTA (prominent)

### Visual Psychology
- **Energy**: high
- **Primary Colors**: publication-brand, action-accent, high-contrast
- **Secondary Colors**: subscription-gold, urgency-orange, exclusivity-badge
- **Avoid**: low-contrast, journalistic-bias-appearance, unclear value
- **Typography**: bold, authoritative, urgent
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: publication-awards, editorial-integrity-badges, journalist-credentials, cancel-anytime promise
- **Average Confidence**: 0.95

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.28
urgencySignals: 0.20
trustSignals:   0.35
offerClarity:   0.12
visualClarity:  0.05
```

### Recommendation Rules

**Urgency Rules**:
- id: `trial_expiration_missing` | trigger: !free_trial_deadline | severity: critical | recommendation: Display free trial length, expiration deadline, or cancel-by date | impact: +28

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA prominent: "Subscribe Now", "Start Free Trial", "Unlock Full Access" | impact: +32

**Subscription Clarity Rules**:
- id: `subscription_terms_missing` | trigger: !price_clarity && !cancellation_terms | severity: high | recommendation: Show subscription price, cancellation policy, or no-commitment guarantee | impact: +20

### Avoidance Patterns

**Visual**:
- Unclear subscription button
- Missing publication-credibility signals
- Weak subscriber-benefit display
- Low-contrast CTA elements

**Layout**:
- No publication-credibility banner
- CTA not prominent enough
- No subscription-benefit section
- Vague trial/cancellation terms

**CTA**:
- Weak verbs ("Learn More", "Explore")
- No action clarity

**Copy**:
- Incomplete subscription details
- Missing publication-award/credibility mention
- Vague subscriber-benefit description
- Unclear cancellation/trial terms

---

## REAL ESTATE — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: real_estate
- **Information Priority**: MEDIUM
- **Trust Priority**: MEDIUM

### Emotional Triggers
`urgency | scarcity | investment-opportunity | market-window | limited-availability | immediate-action | ownership-excitement`

### Expected Emotions
- `investment-opportunity`: confidence 0.95
- `urgency`: confidence 0.90
- `confidence`: confidence 0.85
- `excitement`: confidence 0.80
- `relief`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Schedule Tour Now
  2. Make Offer
  3. Submit Application
  4. Start Process
  5. Secure Property
  6. Get Pre-Approved
  7. Book Showing
  8. Act Now
  9. Claim Opportunity
  10. Begin Buying Process
  11. Get Financing Pre-Approval
  12. Schedule Showing Today

### Layout Intelligence
- **Density**: high
- **Whitespace**: 15-30%
- **Hierarchy**: CTA-focused, scarcity-driven
- **Mobile Priority**: critical
- **Preferred Zones**: limited-availability banner, property hero, tour-scheduling CTA, urgency section

### Visual Psychology
- **Energy**: high
- **Primary Colors**: action-primary, real-estate-accent, high-contrast
- **Secondary Colors**: opportunity-gold, urgency-orange, investment-highlight
- **Avoid**: low-contrast, unclear property presentation
- **Typography**: bold, commanding, urgent
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: listed-days alert, market-action badge, agent-credentials, financing-pre-approval, best-price guarantee
- **Average Confidence**: 0.80

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.30
urgencySignals: 0.28
offerClarity:   0.22
trustSignals:   0.12
visualClarity:  0.08
```

### Recommendation Rules

**Urgency Rules**:
- id: `days_on_market_missing` | trigger: !listed_days && !market_action_alert | severity: critical | recommendation: Display days-on-market, market-activity alert, or competing-offer warning | impact: +32

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA action-oriented: "Schedule Tour Now", "Make Offer", "Start Process" | impact: +32

**Process Clarity Rules**:
- id: `next_steps_missing` | trigger: !next_step_clarity | severity: high | recommendation: Show next steps in buying process or financing pre-approval benefits | impact: +20

### Avoidance Patterns

**Visual**:
- Unclear tour-scheduling/offer button
- Missing market-urgency signals
- Weak price/investment display
- Low-contrast CTA elements

**Layout**:
- No market-action/competition banner
- CTA not prominent enough
- No pre-approval/next-steps section
- Vague financing terms

**CTA**:
- Weak verbs ("View Details", "Learn More")
- No action/immediacy clarity

**Copy**:
- Incomplete property details
- Missing market/urgency information
- Vague financing/buying-process description
- Unclear next-steps messaging

---

## SPORTS — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: sports
- **Information Priority**: LOW
- **Trust Priority**: MEDIUM

### Emotional Triggers
`urgency | fomo | event-scarcity | limited-seats | experience-value | community-inclusion | immediately-action`

### Expected Emotions
- `fomo`: confidence 0.95
- `urgency`: confidence 0.90
- `excitement`: confidence 0.90
- `community`: confidence 0.80
- `confidence`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Get Tickets Now
  2. Claim Seats
  3. Secure Your Spot
  4. Buy Now
  5. Reserve Seats
  6. Lock In Price
  7. Get Tickets Before Sold Out
  8. Claim VIP Access
  9. Secure Experience
  10. Join Event
  11. Get Premium Seats
  12. Buy Today

### Layout Intelligence
- **Density**: high
- **Whitespace**: 10-25%
- **Hierarchy**: CTA-focused, urgency-driven
- **Mobile Priority**: critical
- **Preferred Zones**: event hero (game/match showcase), limited-tickets banner, pricing/urgency, CTA (multiple placements)

### Visual Psychology
- **Energy**: very high
- **Primary Colors**: action-primary, team-accent, high-contrast, bold-highlight
- **Secondary Colors**: urgency-orange, scarcity-red, event-highlight
- **Avoid**: low-contrast, dull, unclear event positioning
- **Typography**: bold, exciting, commanding
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: false (low-medium)
- **Credibility Signals**: limited-tickets alert, sold-out-soon warning, team/league official-badge, refund-guarantee
- **Average Confidence**: 0.75

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.35
urgencySignals: 0.30
offerClarity:   0.18
trustSignals:   0.10
visualClarity:  0.07
```

### Recommendation Rules

**Scarcity Rules**:
- id: `tickets_remaining_missing` | trigger: !remaining_tickets && !soldout_warning | severity: critical | recommendation: Display tickets-remaining, sold-out-soon warning, or limited-availability alert | impact: +35

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA urgent: "Get Tickets Now", "Claim Seats", "Secure Your Spot" | impact: +35

**Pricing Clarity Rules**:
- id: `pricing_unclear` | trigger: !ticket_price && !price_increase_warning | severity: high | recommendation: Show ticket price, price-increase date, or early-bird discount | impact: +20

### Avoidance Patterns

**Visual**:
- Unclear ticket-purchase button
- Missing scarcity/urgency signals
- Weak event excitement display
- Low-contrast CTA elements

**Layout**:
- No limited-tickets/sold-out banner
- CTA not prominent/repeatable
- No pricing/urgency section
- Vague seating/experience details

**CTA**:
- Weak verbs ("Explore", "Learn More")
- No action urgency

**Copy**:
- Incomplete event details
- Missing scarcity messaging
- No ticket pricing clarity
- Unclear seating/experience options

---

## TECHNOLOGY — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: technology
- **Information Priority**: LOW
- **Trust Priority**: HIGH

### Emotional Triggers
`urgency | confidence | action-now | limited-offer | exclusive-pricing | time-sensitive | decision-confidence`

### Expected Emotions
- `confidence`: confidence 0.95
- `security`: confidence 0.90
- `urgency`: confidence 0.85
- `action`: confidence 0.80
- `relief`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Start Free Trial
  2. Get Started Now
  3. Claim Your License
  4. Activate Now
  5. Sign Up Today
  6. Get Enterprise Quote
  7. Begin Integration
  8. Activate Account
  9. Claim Special Pricing
  10. Start Using Today
  11. Get Your Setup
  12. Access Platform Now

### Layout Intelligence
- **Density**: medium
- **Whitespace**: 25-40%
- **Hierarchy**: CTA-focused, trust-driven
- **Mobile Priority**: high
- **Preferred Zones**: security/trust banner (top), trial/offer details (hero), CTA (prominent), urgency (top/bottom)

### Visual Psychology
- **Energy**: medium-high
- **Primary Colors**: tech-blue, action-accent, high-contrast
- **Secondary Colors**: security-green, urgency-orange, premium-gold
- **Avoid**: low-contrast, dated, uncertainty-inducing
- **Typography**: modern, bold, commanding
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: true
- **Credibility Signals**: security-certification, compliance-badge, trial-guarantee, cancel-anytime, enterprise-logos
- **Average Confidence**: 0.90

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.28
urgencySignals: 0.18
trustSignals:   0.35
offerClarity:   0.12
visualClarity:  0.07
```

### Recommendation Rules

**Trial Clarity Rules**:
- id: `trial_terms_missing` | trigger: !free_trial_terms && !no_credit_card | severity: critical | recommendation: Show free-trial length, no-credit-card guarantee, or cancel-anytime promise | impact: +28

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA commanding: "Start Free Trial", "Get Started Now", "Claim Your License" | impact: +32

**Security Rules**:
- id: `security_missing` | trigger: !security_certification && !compliance_badge | severity: high | recommendation: Display security certifications or compliance status prominently | impact: +24

### Avoidance Patterns

**Visual**:
- Unclear sign-up/trial button
- Missing security/trust signals
- Weak offer positioning
- Low-contrast CTA elements

**Layout**:
- No security/compliance banner
- CTA not prominent enough
- No trial/offer terms section
- Vague pricing/upgrade messaging

**CTA**:
- Weak verbs ("Learn More", "Explore")
- No action clarity

**Copy**:
- Incomplete trial/offer terms
- Missing security/compliance information
- Vague pricing or upgrade path
- Unclear integration/setup process

---

## TRAVEL — Conversion Intelligence

### Metadata
- **Goal**: conversion
- **Vertical**: travel
- **Information Priority**: MEDIUM
- **Trust Priority**: MEDIUM

### Emotional Triggers
`urgency | scarcity | deal-value | limited-availability | fomo | immediate-booking | experience-excitement`

### Expected Emotions
- `deal-value`: confidence 0.95
- `urgency`: confidence 0.90
- `excitement`: confidence 0.85
- `confidence`: confidence 0.80
- `relief`: confidence 0.75

### CTA Intelligence
- **Required**: true
- **Strength**: high
- **Aggression Level**: direct
- **Examples** (12):
  1. Book Now
  2. Claim Deal
  3. Reserve Trip
  4. Secure Booking
  5. Get This Price
  6. Book Before Price Increases
  7. Lock In Rate
  8. Complete Booking
  9. Secure Your Spot
  10. Book Your Adventure
  11. Claim Limited Offer
  12. Reserve Today

### Layout Intelligence
- **Density**: high
- **Whitespace**: 15-30%
- **Hierarchy**: CTA-focused, scarcity-driven
- **Mobile Priority**: critical
- **Preferred Zones**: limited-availability banner, destination hero, booking CTA, price-lock section

### Visual Psychology
- **Energy**: high
- **Primary Colors**: action-primary, destination-accent, high-contrast
- **Secondary Colors**: deal-gold, urgency-orange, travel-excitement-highlight
- **Avoid**: low-contrast, unclear destination, uninspiring
- **Typography**: bold, exciting, commanding
- **Branding**: very prominent

### Trust Expectations
- **Trust Required**: false (medium)
- **Credibility Signals**: limited-availability alert, price-lock guarantee, traveler-reviews, money-back-guarantee
- **Average Confidence**: 0.80

### Conversion Pressure
high

### Scoring Weights
```
ctaClarity:     0.30
urgencySignals: 0.28
offerClarity:   0.25
trustSignals:   0.12
visualClarity:  0.05
```

### Recommendation Rules

**Scarcity Rules**:
- id: `availability_missing` | trigger: !seats_remaining && !booking_deadline | severity: critical | recommendation: Display seats/spaces remaining, booking deadline, or limited-availability alert | impact: +32

**CTA Clarity Rules**:
- id: `cta_weak` | trigger: cta_strength < "high" | severity: critical | recommendation: Make CTA urgent: "Book Now", "Claim Deal", "Secure Booking" | impact: +32

**Deal Clarity Rules**:
- id: `offer_terms_missing` | trigger: !price_clarity && !price_increase_date | severity: high | recommendation: Show current price, price-increase date, or savings amount | impact: +22

### Avoidance Patterns

**Visual**:
- Unclear booking button
- Missing scarcity/urgency signals
- Weak price/deal display
- Low-contrast CTA elements

**Layout**:
- No limited-availability banner
- CTA not prominent/repeatable
- No price-lock section
- Vague cancellation/booking terms

**CTA**:
- Weak verbs ("Explore", "Learn More")
- No booking immediacy

**Copy**:
- Incomplete itinerary details
- Missing special-offer details
- No price-lock guarantee
- Vague cancellation/booking policy
