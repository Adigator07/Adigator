# Behavioral Intelligence Dataset Normalization Mapping

Standardization reference for all 48 profiles across awareness, consideration, and conversion datasets.

**Purpose**: Enable deterministic parsing, validation, and consistent interpretation across all three goal-stage datasets.

---

## CTA Type Classification

### Canonical CTA Categories

All CTA types must map to one of these canonical categories:

```
EDUCATIONAL:
  - Learn More
  - Explore
  - Discover
  - Read More
  - View Details
  - See More
  - Browse
  - Check Out

ENGAGEMENT:
  - Get More Info
  - Request Information
  - Contact Us
  - Schedule Consultation
  - Book Demo
  - Watch Demo
  - View Demo
  - Join Webinar

TRIAL / FREEMIUM:
  - Start Free Trial
  - Get Free Trial
  - Try Free
  - Claim Free Month
  - Begin Free Trial
  - Access Free Version

SIGNUP / REGISTRATION:
  - Sign Up
  - Register
  - Create Account
  - Join Now
  - Get Started
  - Start Now

PURCHASE / TRANSACTION:
  - Buy Now
  - Purchase Now
  - Order Now
  - Add to Cart
  - Checkout
  - Complete Purchase

BOOKING / SCHEDULING:
  - Book Now
  - Reserve Now
  - Schedule
  - Schedule Appointment
  - Schedule Call
  - Book Consultation
  - Reserve Table
  - Make Reservation

APPLICATION / ENROLLMENT:
  - Apply Now
  - Apply Today
  - Enroll Now
  - Get Approved
  - Submit Application
  - Apply for Approval

URGENCY / LIMITED-TIME:
  - Claim Deal
  - Claim Offer
  - Get Offer Now
  - Claim Limited Offer
  - Act Now
  - Claim Now
  - Limited Time - [ACTION]

DIRECT ACTION (IMMEDIATE):
  - Download Now
  - Get Instant Access
  - Unlock Access
  - Get Access Now
  - Activate Now
  - Start Playing
  - View Now
```

### CTA Mapping Table

| Canonical | Strength | Stage | Examples |
|-----------|----------|-------|----------|
| Learn More | soft | awareness | Explore, Discover, Read More, View Details |
| Engagement | soft-medium | awareness/consideration | Schedule Consultation, Watch Demo, Request Info |
| Trial / Freemium | medium | awareness/consideration | Start Free Trial, Try Free, Get Free Month |
| Signup | medium | awareness/consideration | Sign Up, Register, Get Started |
| Purchase | high | conversion | Buy Now, Order Now, Add to Cart |
| Booking | high | conversion | Book Now, Reserve, Schedule |
| Application | medium-high | consideration/conversion | Apply Now, Enroll Now, Get Approved |
| Urgency | high | conversion | Claim Deal, Act Now, Limited Time |
| Direct Action | high | conversion | Download Now, Unlock Access, Start Playing |

---

## Emotional Trigger Taxonomy

### Primary Emotion Categories

All emotional triggers must be parseable into one of these psychological driver categories:

```
ACHIEVEMENT & CONFIDENCE
  - confidence
  - capability
  - mastery
  - competence
  - intelligence
  - control
  - empowerment
  - power
  - strength

SECURITY & TRUST
  - security
  - trust
  - reliability
  - safety
  - stability
  - protection
  - assurance
  - guarantee
  - credibility

EXCLUSIVITY & STATUS
  - exclusivity
  - prestige
  - luxury
  - status
  - distinction
  - heritage
  - craftsmanship
  - premium
  - elite

DESIRE & MOTIVATION
  - desire
  - aspiration
  - passion
  - enthusiasm
  - excitement
  - adventure
  - discovery
  - innovation

FINANCIAL & VALUE
  - value
  - savings
  - investment-opportunity
  - financial-freedom
  - financial-security
  - deal-value
  - opportunity
  - growth

SOCIAL & COMMUNITY
  - community
  - belonging
  - social-connection
  - family
  - friendship
  - collaboration
  - inclusion
  - fomo

EMOTION & EXPERIENCE
  - relief
  - happiness
  - joy
  - comfort
  - care
  - compassion
  - emotional-connection
  - escape
  - peace

URGENCY & PRESSURE
  - urgency
  - scarcity
  - limited-time
  - fomo
  - competitive-edge
  - market-window
  - now-or-never

QUALITY & PERFORMANCE
  - quality
  - reliability
  - performance
  - capability
  - innovation
  - excellence
  - precision
  - accuracy

AUTHENTICITY & CLARITY
  - authenticity
  - transparency
  - clarity
  - honesty
  - simplicity
  - straightforwardness
```

### Emotional Mapping Rules

- Each trigger string must be lowercased, hyphen-separated
- Each dataset should include 8-15 relevant emotional triggers per profile
- Triggers should be grouped by stage: awareness (broad) → consideration (specific) → conversion (action-oriented)
- Primary emotions per profile should emphasize goal-stage psychology

---

## Layout Expectation Standardization

### Density Classification

```
MINIMAL
  - Whitespace: 50-70%
  - Information: 30-50%
  - Use: Luxury, premium, high-end
  - Max Elements: 3-5 per screen

BALANCED
  - Whitespace: 30-45%
  - Information: 55-70%
  - Use: Standard SaaS, banking, healthcare
  - Max Elements: 8-12 per screen

HIGH
  - Whitespace: 20-35%
  - Information: 65-80%
  - Use: Ecommerce, comparison, education
  - Max Elements: 15-25 per screen

INFORMATION-RICH
  - Whitespace: 10-25%
  - Information: 75-90%
  - Use: Direct response, dense features, specs
  - Max Elements: 25-40 per screen

DIRECT-RESPONSE
  - Whitespace: 5-15%
  - Information: 85-95%
  - Use: Conversion-focused, urgency-driven
  - Max Elements: 40+ per screen
```

### Reading Pattern Classification

```
LINEAR
  - Top-to-bottom flow
  - Hero → Content → CTA
  - Use: News, blogs, articles
  - Mobile Friendly: YES

F-PATTERN
  - Eye path: Top-left → Top-right → Down-left → Bottom
  - Sidebar emphasis on left
  - Use: Dashboard, analytics, tools
  - Mobile Friendly: PARTIAL

Z-PATTERN
  - Eye path: Top-left → Top-right → Center → Bottom-left → Bottom-right
  - Used for balanced layouts
  - Use: Landing pages, product showcases
  - Mobile Friendly: YES

GRID
  - Multi-column product/content display
  - Hierarchical nesting
  - Use: Ecommerce, gallery, marketplace
  - Mobile Friendly: YES (responsive)

COMPARISON
  - Side-by-side feature/plan display
  - Row-by-row attribute comparison
  - Use: SaaS pricing, automotive, tech specs
  - Mobile Friendly: PARTIAL (scroll horizontal or stack)

NESTED
  - Collapsed sections, accordion pattern
  - Progressive disclosure
  - Use: Complex products, FAQ, specifications
  - Mobile Friendly: YES

CTA-FOCUSED
  - CTA positioned top-left, hero-center, bottom-repeat
  - All paths lead to CTA
  - Use: Conversion, sales, urgency
  - Mobile Friendly: YES
```

### Hierarchy Classification

```
CLEAR
  - Single dominant focal point
  - Secondary elements clearly subordinate
  - Tertiary details minimal
  - Use: Luxury, premium, simplicity-focused
  - Complexity: LOW

NESTED
  - Primary sections with subsections
  - Progressive detail revelation
  - Multi-level hierarchy
  - Use: Technical, comparison, educational
  - Complexity: MEDIUM

DISTRIBUTED
  - Multiple equal-weight sections
  - Category-based organization
  - Balanced emphasis
  - Use: Gallery, marketplace, dashboard
  - Complexity: HIGH

CTA-FOCUSED
  - CTA is visual anchor
  - Everything supports CTA
  - Non-negotiable hierarchy
  - Use: Conversion, sales, directness
  - Complexity: MEDIUM
```

### Mobile Priority Classification

```
CRITICAL
  - Must work perfectly on mobile
  - Conversion depends on mobile performance
  - Mobile traffic: 70%+
  - Responsive breakpoints: Essential
  - Examples: Ecommerce, booking, apps

HIGH
  - Mobile experience important
  - Can support some desktop-specific features
  - Mobile traffic: 50-70%
  - Responsive breakpoints: Recommended
  - Examples: SaaS, news, education

MEDIUM
  - Desktop-primary, mobile-secondary
  - Mobile scaling acceptable
  - Mobile traffic: 30-50%
  - Responsive breakpoints: Nice-to-have
  - Examples: B2B tools, luxury, specialized

LOWER
  - Desktop-primary
  - Mobile traffic: <30%
  - Responsive breakpoints: Optional
  - Examples: Enterprise software, niche B2B
```

---

## Whitespace Expectation Standardization

### Whitespace Ranges (% of screen)

```
MINIMAL: 5-15%
  - Action-oriented
  - Urgency-focused
  - Direct response style
  - Conversion-stage creatives

GENEROUS: 10-25%
  - Information-rich but breathing room
  - Balanced layouts
  - Professional, clear presentation
  - Awareness-stage tech/SaaS

BALANCED: 25-40%
  - Professional, trustworthy
  - Clear hierarchy
  - Standard SaaS/banking standard
  - Consideration-stage layouts

AMPLE: 40-60%
  - Luxury positioning
  - Premium feel
  - Refined typography focus
  - Minimal content approach

EXTREME: 60%+
  - Ultra-premium luxury
  - Single focal point only
  - Bespoke, exclusive feel
  - Rarely used outside ultra-luxury
```

### Whitespace Rules

- Mobile: Whitespace ranges may compress 5-15% but should maintain visual breathing room
- Sidebars: Count as whitespace if not content-filled
- Margins/padding: Always included in calculation
- Gutter spacing: Between elements, counted as whitespace
- CTA area: Should have dedicated whitespace (not squeezed)

---

## Scoring Weight Standardization

### Scoring Dimensions

All datasets use exactly 5 scoring dimensions:

```
1. VISUAL CLARITY (visualClarity)
   - Image quality, product visibility
   - Layout hierarchy, focal points
   - Typography legibility
   - Design polish
   - Range: 0.00-1.00 (represents confidence)

2. CTA CLARITY (ctaClarity)
   - Button prominence, size, color contrast
   - CTA copy clarity (verb + object)
   - CTA placement prominence
   - CTA repetition (conversion stages)
   - Range: 0.00-1.00

3. TRUST SIGNALS (trustSignals)
   - Credibility indicators, badges, certifications
   - Social proof, testimonials, reviews
   - Security/compliance display
   - Brand prominence
   - Range: 0.00-1.00

4. OFFER CLARITY (offerClarity)
   - Price transparency, savings visibility
   - Terms clarity, no-hidden-fees message
   - Deal/promotion explanation
   - Value articulation
   - Range: 0.00-1.00

5. BRAND RECALL (brandRecall)
   - Logo placement, size, visibility
   - Brand color usage consistency
   - Typography brand alignment
   - Brand identity strength
   - Range: 0.00-1.00
```

### Weight Distribution Rules

**Awareness Stage** (emphasis: visual + brand):
- visualClarity: 0.25-0.35 (high)
- ctaClarity: 0.15-0.20 (low-medium)
- trustSignals: 0.15-0.25 (low-medium)
- offerClarity: 0.10-0.20 (low)
- brandRecall: 0.15-0.25 (medium)

**Consideration Stage** (emphasis: trust + clarity):
- visualClarity: 0.15-0.25 (medium)
- ctaClarity: 0.18-0.25 (medium)
- trustSignals: 0.25-0.45 (high)
- offerClarity: 0.12-0.20 (low-medium)
- brandRecall: 0.08-0.15 (low)

**Conversion Stage** (emphasis: CTA + urgency):
- visualClarity: 0.05-0.08 (very low)
- ctaClarity: 0.28-0.35 (high)
- trustSignals: 0.12-0.35 (medium-high)
- offerClarity: 0.20-0.28 (medium-high)
- brandRecall: 0.05-0.12 (low)

### Weight Validation Rules

1. All weights must sum to exactly 1.00
2. Each dimension must be 0.00-1.00
3. Stage-appropriate ranges must be respected
4. Round to 0.01 precision (two decimal places)

---

## Recommendation Rule Standardization

### Rule Structure

All recommendation rules follow identical structure:

```json
{
  "id": "snake_case_rule_id",
  "trigger": "condition_to_check",
  "severity": "critical|high|medium|low",
  "recommendation": "actionable_text",
  "impact": "+value (0-40)"
}
```

### Severity Classification

```
CRITICAL (35-40 point impact)
  - Missing element causing conversion loss
  - Safety/trust/legal requirement
  - Examples: Security badge missing (banking), CTA missing, HIPAA missing (healthcare)

HIGH (18-32 point impact)
  - Element significantly improves performance
  - Conversion stage missing elements
  - Examples: Scarcity missing (sales), reviews missing (ecommerce), specs missing

MEDIUM (10-17 point impact)
  - Element meaningfully improves performance
  - Consideration/awareness stage gaps
  - Examples: Comparison missing, sizing unclear, features incomplete

LOW (5-9 point impact)
  - Nice-to-have optimization
  - Minor clarity improvements
  - Examples: Related content missing, testimonial missing
```

### Impact Score Mapping

```
40: Maximum possible impact (prevents conversion entirely)
35: Critical missing element (requires immediate action)
30: High missing element (significant conversion loss)
25: High missing element (material conversion impact)
20: Meaningful missing element (measurable impact)
18: Meaningful missing element (noticeable impact)
15: Moderate improvement (visible but not critical)
12: Moderate improvement (helpful but not essential)
10: Minor improvement (quality enhancement)

Impact calculation: Severity weight × element criticality for stage
```

### Recommendation Phrasing Rules

All recommendations must be:
1. **Actionable**: Specify what to add/change, not just "improve"
2. **Specific**: Reference actual element names (e.g., "security badge", not "trust")
3. **Non-prescriptive**: Suggest options, not single solution
4. **Concise**: Fit in 1-2 sentences
5. **Quantified**: Include amounts where possible ("Add 3-5 testimonials")

### Recommendation Categories

```
TRUST RULES
  - Security/compliance/badges
  - Credentials/certifications
  - Social proof
  - Transparency/clarity

URGENCY RULES
  - Limited-time offers
  - Scarcity/inventory alerts
  - Countdown timers
  - Deadline messaging

CLARITY RULES
  - Pricing transparency
  - Feature/benefit clarity
  - Process transparency
  - Terms clarity

COMPARISON RULES
  - Side-by-side comparisons
  - Feature matrices
  - Differentiation
  - Alternative options

CTA RULES
  - CTA prominence
  - CTA copy clarity
  - CTA placement
  - CTA repetition

CONTENT RULES
  - Social proof/reviews
  - Specifications
  - Use cases
  - Educational content
```

---

## Avoidance Pattern Standardization

### Pattern Categories

All patterns organized by dimension:

```
VISUAL PATTERNS
  - Low quality images/design
  - Unclear product presentation
  - Weak credibility signals
  - Poor visual hierarchy

LAYOUT PATTERNS
  - Overwhelming information density
  - No section organization
  - Missing expected sections
  - Weak mobile adaptation

CTA PATTERNS
  - Vague CTA verbs
  - Weak CTA positioning
  - Missing CTA
  - Conflicting CTAs

COPY PATTERNS
  - Incomplete information
  - Missing credibility mentions
  - Vague differentiation
  - Technical jargon overuse
```

### Pattern Phrasing Rules

1. **What to Avoid**: Start with descriptive phrase (e.g., "Unclear vehicle features")
2. **Why**: Explain conversion impact
3. **Alternative**: Suggest better approach

### Pattern Impact

Patterns are grouped by severity:
- **Critical**: Prevents conversion (must fix)
- **Major**: Significantly reduces performance (should fix)
- **Minor**: Reduces optimization (nice to fix)

---

## CTA Aggression Level Classification

```
SOFT
  - Non-pushy, exploratory language
  - "Learn More", "Explore", "Discover"
  - Use: Awareness stage, luxury, educational
  - Tone: Curiosity-driven
  - Examples: Automotive (awareness), Education (awareness)

MEDIUM (BALANCED)
  - Balanced language, action without pressure
  - "Get More Info", "Schedule", "Compare"
  - Use: Consideration stage, comparison, research
  - Tone: Informative-encouraging
  - Examples: Banking (consideration), Ecommerce (consideration)

DIRECT
  - Action-oriented, direct language
  - "Buy Now", "Claim Deal", "Apply"
  - Use: Conversion stage, sales, urgency
  - Tone: Action-commanding
  - Examples: All conversion-stage creatives
```

### Aggression Level by Stage

```
AWARENESS
  - Soft: 70-80%
  - Medium: 20-30%
  - Direct: 0-5%

CONSIDERATION
  - Soft: 10-20%
  - Medium: 60-80%
  - Direct: 10-25%

CONVERSION
  - Soft: 0-5%
  - Medium: 10-25%
  - Direct: 70-90%
```

---

## Trust Signal Standardization

### Credibility Signal Categories

```
REGULATORY / COMPLIANCE
  - HIPAA (healthcare)
  - SOC 2, ISO (SaaS)
  - SEC, FINRA (finance)
  - PCI-DSS (payments)

SECURITY INDICATORS
  - SSL/TLS badge
  - Encryption mention
  - Data privacy commitment
  - Security certification

SOCIAL PROOF
  - Customer testimonials
  - User reviews (with rating)
  - Customer logos
  - User count

EXPERTISE CREDENTIALS
  - Doctor credentials (healthcare)
  - Expert credentials (education)
  - Instructor background (edtech)
  - Team credentials (SaaS)

INSTITUTIONAL AFFILIATION
  - Hospital affiliations (healthcare)
  - University association (education)
  - League association (sports)
  - Marketplace platform membership

AWARDS / RECOGNITION
  - Industry awards
  - Media mentions
  - Analyst recognition
  - Customer satisfaction awards

PERFORMANCE PROOF
  - ROI case studies
  - Success metrics
  - Performance data
  - Track record

GUARANTEE / ASSURANCE
  - Money-back guarantee
  - Price-match guarantee
  - Quality guarantee
  - Performance guarantee
```

### Trust Signal Strength Scale

```
CRITICAL TRUST (must have):
  - Regulatory compliance (banking, healthcare)
  - Security certification (SaaS, finance)
  - Doctor/expert credentials (healthcare, education)
  - Approved status (financial products)

HIGH TRUST (strongly recommended):
  - Customer testimonials/reviews
  - Social proof (user logos, count)
  - Guarantee/assurance
  - Professional credentials

MEDIUM TRUST (recommended):
  - Awards/recognition
  - Performance data
  - Media mentions
  - Institutional affiliation

LOW TRUST (nice to have):
  - Social media following
  - Blog/content credibility
  - Thought leadership
  - Community engagement
```

---

## Validation Checklist

### Pre-Publication Validation

For each of 48 profiles (16 verticals × 3 goals):

**Structure Validation**:
- [ ] Metadata section complete (goal, vertical, priority levels)
- [ ] Emotional triggers: 8-15 items, relevant to stage + vertical
- [ ] Expected emotions: 3-5 items with confidence scores (0.70-0.95)
- [ ] CTA intelligence: strength, aggression level, 12 examples
- [ ] Layout intelligence: all 5 fields populated
- [ ] Visual psychology: all 4 color fields populated
- [ ] Trust expectations: required status, signals, average confidence
- [ ] Conversion pressure: low/medium/high appropriate to stage
- [ ] Scoring weights: 5 dimensions, sum = 1.00, stage-aligned
- [ ] Recommendation rules: 3-5 rules, each with id/trigger/severity/recommendation/impact
- [ ] Avoidance patterns: 4 categories, 2-4 items per category

**Content Validation**:
- [ ] Emotional triggers use lowercase, hyphen-separated format
- [ ] CTA examples are concrete, not generic
- [ ] Scoring weights follow stage ranges (awareness/consideration/conversion)
- [ ] Impact scores appropriate to severity (critical: 35-40, high: 18-32, etc.)
- [ ] Recommendations are actionable and specific
- [ ] Avoidance patterns provide guidance, not just criticism

**Cross-Profile Consistency**:
- [ ] All 16 verticals present in each goal dataset
- [ ] CTA examples map to canonical CTA categories
- [ ] Emotional triggers map to taxonomy categories
- [ ] Layout expectations use standardized terminology
- [ ] Scoring weights align with stage guidelines
- [ ] Trust signals use standard categories

**Stage Progression Validation**:
- [ ] Awareness CTAs are soft
- [ ] Consideration CTAs are medium
- [ ] Conversion CTAs are direct
- [ ] Trust priority increases awareness → consideration → conversion (mostly)
- [ ] Information priority decreases awareness → consideration → conversion
- [ ] Visual energy increases awareness → conversion
- [ ] CTA pressure increases awareness → conversion

---

## Integration Points

### Intelligence Registry Integration

These datasets feed the Intelligence Registry (`app/lib/intelligence-registry/profile-data.ts`):

1. **GOAL_BASELINES**: Maps goal (awareness/consideration/conversion) to global defaults
2. **VERTICAL_BASELINES**: Maps vertical (16 types) to vertical-specific defaults
3. **PROFILE_OVERRIDES**: Combines goal + vertical → specific intelligence profile

### Engine Integration

Intelligence profiles drive these engines:

1. **Scoring Engine** (`scoring-engine.ts`)
   - Uses scoring weights per profile
   - Applies dimension definitions
   - Returns 0.00-1.00 score per dimension

2. **Recommendation Engine** (`recommendation-engine.ts`)
   - Uses recommendation rules from each profile
   - Evaluates triggers against creative analysis
   - Returns actionable recommendations with impact scores

3. **CTA Engine** (`cta-engine.ts`)
   - Uses CTA expectations and examples from profile
   - Validates detected CTAs against canonical categories
   - Scores CTA strength and clarity

4. **Layout Engine** (`layout-intelligence/engine.ts`)
   - Uses layout expectations from profile
   - Evaluates density, hierarchy, reading pattern
   - Assesses mobile readability

5. **OCR Normalization** (`ocr-normalization/pipeline.ts`)
   - Uses profile context to guide OCR interpretation
   - Applies profile-specific terminology for text matching
   - Improves accuracy of AI vision calls

### Deterministic Processing Flow

```
1. Load creative image + goal + vertical
2. Look up profile via Intelligence Registry (goal + vertical)
3. Load profile intelligence from this dataset
4. OCR: Use profile context for text extraction
5. CTA Detect: Use profile CTA examples + canonical categories
6. Layout Analyze: Use profile layout expectations
7. Score: Apply profile-specific weights and dimension definitions
8. Recommend: Apply profile-specific recommendation rules
9. Return: Comprehensive analysis with profile-driven insights
```

---

## Maintenance & Updates

### When to Update Profiles

- **New vertical added**: Create 3 new profiles (awareness/consideration/conversion)
- **New goal added**: Create 16 new profiles (one per vertical)
- **CTA landscape changes**: Review canonical CTA categories, update mappings
- **Emotional triggers evolve**: Review taxonomy, add new categories if needed
- **Platform aesthetic changes**: Review visual psychology rules

### Update Process

1. Identify what changed (vertical/goal/dimension/rule)
2. Create updated profile in appropriate dataset
3. Validate against standardization rules
4. Test with Intelligence Registry
5. Verify impact on recommendation rules
6. Deploy and monitor scoring/recommendation impact

### Versioning

- Each dataset has implicit version (goal + datasets published date)
- Schema changes require coordination across all 48 profiles
- Breaking changes should increment version explicitly

---

## Reference Examples

### Example Profile: Automotive - Awareness

```markdown
## AUTOMOTIVE — Awareness Intelligence

### Metadata
- **Goal**: awareness
- **Vertical**: automotive
- **Information Priority**: MEDIUM
- **Trust Priority**: MEDIUM

### Emotional Triggers
`performance | power | style | control | innovation | reliability | luxury | aspiration | capability | freedom | confidence`

### Expected Emotions
- `performance`: confidence 0.95
- `style`: confidence 0.85
- `innovation`: confidence 0.80
- `freedom`: confidence 0.75
- `capability`: confidence 0.70

### CTA Intelligence
- **Required**: false
- **Strength**: soft
- **Aggression Level**: soft
- **Examples** (12): Explore Models, Learn More, View Gallery, See Details, Watch Video, Discover More, Check It Out, Browse Gallery, See Features, View Details, Explore Options, Learn About Features

### Scoring Weights
- visualClarity: 0.32
- ctaClarity: 0.15
- trustSignals: 0.15
- offerClarity: 0.08
- brandRecall: 0.30
```

**Rules Derived from Mapping**:
- CTA "Explore Models" maps to canonical category: EDUCATIONAL
- Emotional triggers map to: DESIRE, CONFIDENCE, EXCLUSIVITY, QUALITY
- Layout: information-rich (80%), reading-pattern: Z-PATTERN (automotive showcase)
- Visual energy: medium (performance/style emphasis)
- Weight distribution: High visualClarity (0.32) + high brandRecall (0.30) = 62% emphasis on visual/brand in awareness
- Trust priority low (0.15): awareness stage doesn't require trust yet

---

End of Normalization Mapping Document
