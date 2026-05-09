/**
 * Dataset Loader - Parses markdown behavioral intelligence datasets
 * Converts awareness/consideration/conversion markdown files into runtime profiles
 */

import type {
  CampaignGoal,
  VerticalKey,
  IntelligenceProfilePatch,
} from "./types";

interface RawProfile {
  goal: CampaignGoal;
  vertical: VerticalKey;
  emotionalTriggers: string[];
  expectedEmotions: Record<string, number>;
  ctaIntelligence: {
    required: boolean;
    strength: "soft" | "medium" | "direct";
    examples: string[];
  };
  layoutIntelligence: {
    density: string;
    whitespace: string;
    hierarchy: string;
  };
  visualPsychology: {
    energy: string;
    primaryColors: string[];
    secondaryColors: string[];
  };
  trustExpectations: {
    required: boolean;
    credibilitySignals: string[];
  };
  conversionPressure: "low" | "medium" | "high";
  scoringWeights: Record<string, number>;
  recommendationRules: Array<{
    id: string;
    severity: "low" | "medium" | "high" | "critical";
    recommendation: string;
    impact: number;
  }>;
}

/**
 * Hardcoded dataset profiles (extracted from markdown files)
 * In production, these would be loaded from files dynamically
 */
const DATASET_PROFILES: Record<CampaignGoal, Record<VerticalKey, RawProfile>> = {
  awareness: {
    automotive: {
      goal: "awareness",
      vertical: "automotive",
      emotionalTriggers: [
        "speed",
        "power",
        "luxury",
        "adventure",
        "freedom",
        "confidence",
        "precision",
        "control",
        "lifestyle-identity",
        "aspiration",
        "status",
        "performance",
      ],
      expectedEmotions: {
        adventure: 0.95,
        freedom: 0.9,
        power: 0.85,
        status: 0.8,
        precision: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Discover the Drive",
          "Feel the Power",
          "Experience Performance",
          "Drive the Future",
          "Explore New Roads",
          "Redefine Adventure",
          "Built for the Journey",
          "See What Moves You",
          "Experience Freedom",
          "Start Your Next Journey",
          "Precision in Motion",
          "Engineered for Life",
          "Explore the Road Ahead",
          "Drive Innovation",
          "Feel Every Moment",
        ],
      },
      layoutIntelligence: {
        density: "balanced",
        whitespace: "25-40%",
        hierarchy: "clear",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["black", "gray", "metallic", "white"],
        secondaryColors: ["dark-blue", "matte-silver", "accent-red"],
      },
      trustExpectations: {
        required: false,
        credibilitySignals: ["engineering precision", "safety stats"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.25,
        ctaClarity: 0.08,
        trustSignals: 0.12,
        offerClarity: 0.05,
        brandRecall: 0.5,
      },
      recommendationRules: [
        {
          id: "cta_too_aggressive",
          severity: "high",
          recommendation: "Use softer action verb",
          impact: 12,
        },
        {
          id: "hierarchy_unclear",
          severity: "high",
          recommendation: "Strengthen focal point with motion or contrast",
          impact: 18,
        },
      ],
    },
    banking: {
      goal: "awareness",
      vertical: "banking",
      emotionalTriggers: [
        "trust",
        "security",
        "stability",
        "growth",
        "opportunity",
        "confidence",
        "protection",
        "simplicity",
        "innovation",
        "accessibility",
      ],
      expectedEmotions: {
        trust: 0.95,
        security: 0.9,
        stability: 0.85,
        confidence: 0.8,
        opportunity: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Learn More",
          "Discover",
          "Explore Options",
          "See Benefits",
          "Explore Banking",
          "See How It Works",
          "Get Started",
          "Learn About",
        ],
      },
      layoutIntelligence: {
        density: "minimal",
        whitespace: "35-50%",
        hierarchy: "clear",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["navy", "white", "gray"],
        secondaryColors: ["gold", "green", "slate"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["security badges", "certifications", "awards"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.2,
        ctaClarity: 0.1,
        trustSignals: 0.35,
        offerClarity: 0.1,
        brandRecall: 0.25,
      },
      recommendationRules: [
        {
          id: "trust_missing",
          severity: "critical",
          recommendation: "Add security certifications or trust badges",
          impact: 25,
        },
      ],
    },
    // ... (remaining verticals would follow same pattern)
    // For brevity, including only 2 samples per goal
    ecommerce: {
      goal: "awareness",
      vertical: "ecommerce",
      emotionalTriggers: [
        "discovery",
        "excitement",
        "value",
        "convenience",
        "choice",
        "quality",
        "style",
        "lifestyle",
      ],
      expectedEmotions: {
        discovery: 0.9,
        excitement: 0.85,
        value: 0.8,
        convenience: 0.75,
        style: 0.7,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Explore Collection",
          "Discover New",
          "Browse",
          "See Styles",
          "Shop Now",
          "View Collection",
        ],
      },
      layoutIntelligence: {
        density: "high",
        whitespace: "15-25%",
        hierarchy: "dynamic",
      },
      visualPsychology: {
        energy: "very-high",
        primaryColors: ["vibrant", "colorful", "energetic"],
        secondaryColors: ["accent", "contrast"],
      },
      trustExpectations: {
        required: false,
        credibilitySignals: ["customer reviews", "return policy"],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.3,
        ctaClarity: 0.12,
        trustSignals: 0.15,
        offerClarity: 0.15,
        brandRecall: 0.28,
      },
      recommendationRules: [],
    },
    education: {
      goal: "awareness",
      vertical: "education",
      emotionalTriggers: [
        "aspiration",
        "growth",
        "opportunity",
        "confidence",
        "future",
        "innovation",
        "empowerment",
      ],
      expectedEmotions: {
        aspiration: 0.9,
        growth: 0.85,
        opportunity: 0.8,
        confidence: 0.75,
        empowerment: 0.7,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Learn More",
          "Explore Programs",
          "Discover",
          "See Curriculum",
          "Get Started",
        ],
      },
      layoutIntelligence: {
        density: "balanced",
        whitespace: "25-35%",
        hierarchy: "clear",
      },
      visualPsychology: {
        energy: "medium-high",
        primaryColors: ["professional", "inspirational"],
        secondaryColors: ["accent"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["accreditation", "success rates", "testimonials"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.22,
        ctaClarity: 0.1,
        trustSignals: 0.25,
        offerClarity: 0.12,
        brandRecall: 0.31,
      },
      recommendationRules: [],
    },
    entertainment: {
      goal: "awareness",
      vertical: "entertainment",
      emotionalTriggers: [
        "excitement",
        "entertainment",
        "escapism",
        "joy",
        "anticipation",
        "social",
        "trending",
        "culture",
      ],
      expectedEmotions: {
        excitement: 0.95,
        entertainment: 0.9,
        anticipation: 0.85,
        joy: 0.8,
        social: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Watch Trailer",
          "Explore",
          "Discover",
          "Check It Out",
          "See More",
        ],
      },
      layoutIntelligence: {
        density: "high",
        whitespace: "10-20%",
        hierarchy: "dynamic",
      },
      visualPsychology: {
        energy: "very-high",
        primaryColors: ["bold", "vibrant", "dynamic"],
        secondaryColors: ["contrasting", "trending"],
      },
      trustExpectations: {
        required: false,
        credibilitySignals: ["ratings", "popularity"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.35,
        ctaClarity: 0.08,
        trustSignals: 0.1,
        offerClarity: 0.05,
        brandRecall: 0.42,
      },
      recommendationRules: [],
    },
    finance: {
      goal: "awareness",
      vertical: "finance",
      emotionalTriggers: [
        "security",
        "growth",
        "opportunity",
        "control",
        "confidence",
        "stability",
        "success",
        "wealth",
      ],
      expectedEmotions: {
        security: 0.9,
        growth: 0.85,
        opportunity: 0.8,
        confidence: 0.75,
        control: 0.7,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Learn More",
          "Explore Options",
          "Discover",
          "Get Started",
          "See How",
        ],
      },
      layoutIntelligence: {
        density: "minimal",
        whitespace: "30-45%",
        hierarchy: "clear",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["professional", "trustworthy"],
        secondaryColors: ["green", "gold"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["certifications", "disclaimers", "compliance"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.18,
        ctaClarity: 0.08,
        trustSignals: 0.4,
        offerClarity: 0.08,
        brandRecall: 0.26,
      },
      recommendationRules: [],
    },
    food: {
      goal: "awareness",
      vertical: "food",
      emotionalTriggers: [
        "appetite",
        "quality",
        "enjoyment",
        "discovery",
        "indulgence",
        "community",
        "tradition",
      ],
      expectedEmotions: {
        appetite: 0.95,
        enjoyment: 0.9,
        quality: 0.85,
        discovery: 0.8,
        indulgence: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Explore Menu",
          "Discover",
          "See More",
          "Learn About",
          "Browse",
        ],
      },
      layoutIntelligence: {
        density: "high",
        whitespace: "15-25%",
        hierarchy: "visual",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["appetizing", "warm", "inviting"],
        secondaryColors: ["accent"],
      },
      trustExpectations: {
        required: false,
        credibilitySignals: ["reviews", "ratings"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.4,
        ctaClarity: 0.08,
        trustSignals: 0.12,
        offerClarity: 0.08,
        brandRecall: 0.32,
      },
      recommendationRules: [],
    },
    gaming: {
      goal: "awareness",
      vertical: "gaming",
      emotionalTriggers: [
        "excitement",
        "competition",
        "mastery",
        "achievement",
        "community",
        "innovation",
        "immersion",
      ],
      expectedEmotions: {
        excitement: 0.95,
        competition: 0.9,
        immersion: 0.85,
        achievement: 0.8,
        community: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: ["Play Now", "Discover", "Explore", "Get Started", "Join"],
      },
      layoutIntelligence: {
        density: "very-high",
        whitespace: "5-15%",
        hierarchy: "dynamic",
      },
      visualPsychology: {
        energy: "extreme",
        primaryColors: ["bold", "neon", "vibrant"],
        secondaryColors: ["high-contrast"],
      },
      trustExpectations: {
        required: false,
        credibilitySignals: ["downloads", "ratings", "community"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.35,
        ctaClarity: 0.08,
        trustSignals: 0.1,
        offerClarity: 0.05,
        brandRecall: 0.42,
      },
      recommendationRules: [],
    },
    healthcare: {
      goal: "awareness",
      vertical: "healthcare",
      emotionalTriggers: [
        "care",
        "trust",
        "expertise",
        "compassion",
        "safety",
        "hope",
        "wellness",
      ],
      expectedEmotions: {
        trust: 0.95,
        care: 0.9,
        expertise: 0.85,
        safety: 0.8,
        hope: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Learn More",
          "Explore Services",
          "Get Information",
          "Discover",
          "See More",
        ],
      },
      layoutIntelligence: {
        density: "minimal",
        whitespace: "35-50%",
        hierarchy: "clear",
      },
      visualPsychology: {
        energy: "calm",
        primaryColors: ["professional", "calming"],
        secondaryColors: ["medical-blue", "healing-green"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["credentials", "certifications", "testimonials"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.2,
        ctaClarity: 0.08,
        trustSignals: 0.4,
        offerClarity: 0.08,
        brandRecall: 0.24,
      },
      recommendationRules: [],
    },
    hotels: {
      goal: "awareness",
      vertical: "hotels",
      emotionalTriggers: [
        "luxury",
        "comfort",
        "adventure",
        "relaxation",
        "escape",
        "indulgence",
        "discovery",
      ],
      expectedEmotions: {
        luxury: 0.9,
        relaxation: 0.85,
        adventure: 0.8,
        comfort: 0.8,
        escape: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Explore",
          "Discover",
          "View Rooms",
          "See More",
          "Learn About",
        ],
      },
      layoutIntelligence: {
        density: "minimal",
        whitespace: "30-45%",
        hierarchy: "visual",
      },
      visualPsychology: {
        energy: "medium-high",
        primaryColors: ["luxury", "elegant"],
        secondaryColors: ["warm", "inviting"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["reviews", "ratings", "star-rating"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.28,
        ctaClarity: 0.08,
        trustSignals: 0.22,
        offerClarity: 0.08,
        brandRecall: 0.34,
      },
      recommendationRules: [],
    },
    luxury: {
      goal: "awareness",
      vertical: "luxury",
      emotionalTriggers: [
        "exclusivity",
        "status",
        "sophistication",
        "elegance",
        "aspiration",
        "heritage",
        "innovation",
      ],
      expectedEmotions: {
        exclusivity: 0.95,
        status: 0.9,
        sophistication: 0.85,
        aspiration: 0.8,
        elegance: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Explore",
          "Discover Collection",
          "Learn More",
          "See Craftsmanship",
          "View",
        ],
      },
      layoutIntelligence: {
        density: "minimal",
        whitespace: "45-60%",
        hierarchy: "subtle",
      },
      visualPsychology: {
        energy: "calm-sophisticated",
        primaryColors: ["gold", "black", "white"],
        secondaryColors: ["premium-silver", "jewel-tones"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["heritage", "craftsmanship", "exclusivity"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.25,
        ctaClarity: 0.05,
        trustSignals: 0.25,
        offerClarity: 0.05,
        brandRecall: 0.4,
      },
      recommendationRules: [],
    },
    news_media: {
      goal: "awareness",
      vertical: "news_media",
      emotionalTriggers: [
        "relevance",
        "urgency",
        "credibility",
        "discovery",
        "engagement",
        "insight",
        "controversy",
      ],
      expectedEmotions: {
        relevance: 0.9,
        urgency: 0.85,
        credibility: 0.85,
        engagement: 0.8,
        insight: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Read Story",
          "Explore",
          "Discover",
          "View Article",
          "Learn More",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "15-30%",
        hierarchy: "clear",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["bold", "journalistic"],
        secondaryColors: ["accent"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["sources", "journalism standards", "dates"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.2,
        ctaClarity: 0.12,
        trustSignals: 0.28,
        offerClarity: 0.1,
        brandRecall: 0.3,
      },
      recommendationRules: [],
    },
    real_estate: {
      goal: "awareness",
      vertical: "real_estate",
      emotionalTriggers: [
        "aspiration",
        "investment",
        "lifestyle",
        "security",
        "growth",
        "home",
        "opportunity",
      ],
      expectedEmotions: {
        aspiration: 0.9,
        lifestyle: 0.85,
        opportunity: 0.8,
        investment: 0.75,
        security: 0.7,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Explore",
          "View Properties",
          "Discover",
          "Schedule Tour",
          "Learn More",
        ],
      },
      layoutIntelligence: {
        density: "balanced",
        whitespace: "25-40%",
        hierarchy: "visual",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["professional", "inviting"],
        secondaryColors: ["warm", "accent"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["listings", "credentials", "testimonials"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.28,
        ctaClarity: 0.08,
        trustSignals: 0.25,
        offerClarity: 0.08,
        brandRecall: 0.31,
      },
      recommendationRules: [],
    },
    sports: {
      goal: "awareness",
      vertical: "sports",
      emotionalTriggers: [
        "passion",
        "competition",
        "achievement",
        "team",
        "energy",
        "performance",
        "excellence",
      ],
      expectedEmotions: {
        passion: 0.95,
        competition: 0.9,
        performance: 0.85,
        achievement: 0.8,
        energy: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Explore",
          "Discover",
          "View Stats",
          "Get Updates",
          "Follow",
        ],
      },
      layoutIntelligence: {
        density: "high",
        whitespace: "15-25%",
        hierarchy: "dynamic",
      },
      visualPsychology: {
        energy: "very-high",
        primaryColors: ["bold", "energetic"],
        secondaryColors: ["team-colors"],
      },
      trustExpectations: {
        required: false,
        credibilitySignals: ["official", "verified", "live"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.3,
        ctaClarity: 0.1,
        trustSignals: 0.15,
        offerClarity: 0.08,
        brandRecall: 0.37,
      },
      recommendationRules: [],
    },
    technology: {
      goal: "awareness",
      vertical: "technology",
      emotionalTriggers: [
        "innovation",
        "future",
        "capability",
        "simplicity",
        "progress",
        "disruption",
        "intelligence",
      ],
      expectedEmotions: {
        innovation: 0.95,
        future: 0.9,
        capability: 0.85,
        progress: 0.8,
        simplicity: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Explore",
          "Learn More",
          "Discover",
          "See How It Works",
          "Get Started",
        ],
      },
      layoutIntelligence: {
        density: "balanced",
        whitespace: "25-40%",
        hierarchy: "clear",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["modern", "tech-blue"],
        secondaryColors: ["accent", "neon"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["innovation", "security", "scale"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.22,
        ctaClarity: 0.1,
        trustSignals: 0.2,
        offerClarity: 0.1,
        brandRecall: 0.38,
      },
      recommendationRules: [],
    },
    travel: {
      goal: "awareness",
      vertical: "travel",
      emotionalTriggers: [
        "adventure",
        "discovery",
        "escape",
        "inspiration",
        "experience",
        "wanderlust",
        "culture",
      ],
      expectedEmotions: {
        adventure: 0.95,
        discovery: 0.9,
        inspiration: 0.85,
        experience: 0.8,
        wanderlust: 0.75,
      },
      ctaIntelligence: {
        required: false,
        strength: "soft",
        examples: [
          "Explore",
          "Discover",
          "Plan Trip",
          "Learn More",
          "See Destinations",
        ],
      },
      layoutIntelligence: {
        density: "minimal",
        whitespace: "30-45%",
        hierarchy: "visual",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["inspiring", "scenic"],
        secondaryColors: ["warm", "inviting"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["reviews", "credentials", "experience"],
      },
      conversionPressure: "low",
      scoringWeights: {
        visualClarity: 0.3,
        ctaClarity: 0.08,
        trustSignals: 0.2,
        offerClarity: 0.08,
        brandRecall: 0.34,
      },
      recommendationRules: [],
    },
  },
  consideration: {
    automotive: {
      goal: "consideration",
      vertical: "automotive",
      emotionalTriggers: [
        "confidence",
        "power",
        "status",
        "performance",
        "reliability",
        "safety",
        "luxury",
        "innovation",
        "comparison",
        "capability",
        "precision",
        "control",
      ],
      expectedEmotions: {
        confidence: 0.9,
        performance: 0.85,
        reliability: 0.8,
        status: 0.75,
        safety: 0.7,
      },
      ctaIntelligence: {
        required: false,
        strength: "medium",
        examples: [
          "Explore Models",
          "View Inventory",
          "Compare Vehicles",
          "Explore Features",
          "View Details",
          "See Pricing",
          "Browse Cars",
          "Explore SUVs",
          "View Offers",
          "Compare Models",
          "Explore Performance",
          "View Vehicle Details",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "20-35%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["black", "silver", "white", "dark-gray"],
        secondaryColors: ["metallic-accents", "brand-colors", "safety-blue"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "safety ratings",
          "warranty info",
          "spec transparency",
          "owner reviews",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.2,
        ctaClarity: 0.22,
        trustSignals: 0.28,
        offerClarity: 0.18,
        brandRecall: 0.12,
      },
      recommendationRules: [
        {
          id: "spec_missing",
          severity: "high",
          recommendation:
            "Include detailed spec comparison, trim levels, or side-by-side comparison",
          impact: 20,
        },
        {
          id: "safety_missing",
          severity: "high",
          recommendation:
            "Add safety ratings, warranty details, or owner satisfaction scores",
          impact: 18,
        },
        {
          id: "pricing_unclear",
          severity: "medium",
          recommendation: "Display pricing clearly, show value breakdown",
          impact: 15,
        },
      ],
    },
    banking: {
      goal: "consideration",
      vertical: "banking",
      emotionalTriggers: [
        "trust",
        "reliability",
        "innovation",
        "convenience",
        "security",
        "value",
        "expertise",
        "transparency",
      ],
      expectedEmotions: {
        trust: 0.95,
        convenience: 0.85,
        value: 0.8,
        transparency: 0.75,
        security: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "Open Account",
          "Apply Now",
          "Compare Products",
          "View Rates",
          "Get Started",
          "Learn More",
          "Schedule Consultation",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "20-35%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["navy", "white", "gray"],
        secondaryColors: ["gold", "green", "slate"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "FDIC insurance",
          "compliance",
          "security certifications",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.16,
        ctaClarity: 0.2,
        trustSignals: 0.35,
        offerClarity: 0.15,
        brandRecall: 0.14,
      },
      recommendationRules: [],
    },
    ecommerce: {
      goal: "consideration",
      vertical: "ecommerce",
      emotionalTriggers: [
        "value",
        "comparison",
        "quality",
        "choice",
        "discovery",
        "confidence",
        "social-proof",
        "convenience",
      ],
      expectedEmotions: {
        confidence: 0.9,
        value: 0.85,
        quality: 0.8,
        choice: 0.75,
        social_proof: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "View Details",
          "Compare Products",
          "Read Reviews",
          "See More",
          "Add to Cart",
          "View Price",
          "Check Availability",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "15-25%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium-high",
        primaryColors: ["professional", "product-focused"],
        secondaryColors: ["review-highlights", "price-emphasis"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "ratings",
          "return policy",
          "secure checkout",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.18,
        ctaClarity: 0.2,
        trustSignals: 0.25,
        offerClarity: 0.22,
        brandRecall: 0.15,
      },
      recommendationRules: [],
    },
    education: {
      goal: "consideration",
      vertical: "education",
      emotionalTriggers: [
        "credibility",
        "investment",
        "opportunity",
        "expertise",
        "career",
        "value",
        "success",
        "innovation",
      ],
      expectedEmotions: {
        confidence: 0.9,
        value: 0.85,
        career: 0.8,
        opportunity: 0.75,
        credibility: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "Compare Programs",
          "View Curriculum",
          "Schedule Demo",
          "Get Information",
          "Apply",
          "Learn More",
          "See Outcomes",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "20-30%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["professional", "academic"],
        secondaryColors: ["accent", "success-green"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "accreditation",
          "success rates",
          "faculty credentials",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.16,
        ctaClarity: 0.18,
        trustSignals: 0.32,
        offerClarity: 0.16,
        brandRecall: 0.18,
      },
      recommendationRules: [],
    },
    entertainment: {
      goal: "consideration",
      vertical: "entertainment",
      emotionalTriggers: [
        "quality",
        "value",
        "comparison",
        "reviews",
        "recommendations",
        "trending",
        "social-proof",
        "convenience",
      ],
      expectedEmotions: {
        quality: 0.9,
        value: 0.85,
        recommendation: 0.8,
        social_proof: 0.75,
        convenience: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "Watch Trailer",
          "View Details",
          "Compare Plans",
          "Read Reviews",
          "Learn More",
          "See Pricing",
          "Subscribe",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "15-25%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium-high",
        primaryColors: ["premium", "showcase"],
        secondaryColors: ["review-highlights", "rating"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["ratings", "reviews", "verified users"],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.18,
        ctaClarity: 0.18,
        trustSignals: 0.28,
        offerClarity: 0.18,
        brandRecall: 0.18,
      },
      recommendationRules: [],
    },
    finance: {
      goal: "consideration",
      vertical: "finance",
      emotionalTriggers: [
        "confidence",
        "expertise",
        "transparency",
        "value",
        "security",
        "growth",
        "opportunity",
        "control",
      ],
      expectedEmotions: {
        confidence: 0.9,
        security: 0.85,
        transparency: 0.8,
        value: 0.75,
        opportunity: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "View Options",
          "Compare Plans",
          "Get Quote",
          "Learn More",
          "Schedule Consultation",
          "Get Started",
          "Apply Now",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "20-35%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["professional", "trustworthy"],
        secondaryColors: ["green", "gold"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["certifications", "disclaimers", "compliance"],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.16,
        ctaClarity: 0.2,
        trustSignals: 0.35,
        offerClarity: 0.14,
        brandRecall: 0.15,
      },
      recommendationRules: [],
    },
    food: {
      goal: "consideration",
      vertical: "food",
      emotionalTriggers: [
        "quality",
        "hygiene",
        "value",
        "reviews",
        "experience",
        "convenience",
        "health",
        "reputation",
      ],
      expectedEmotions: {
        quality: 0.9,
        confidence: 0.85,
        value: 0.8,
        health: 0.75,
        convenience: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "View Menu",
          "Read Reviews",
          "Check Hours",
          "Reserve Table",
          "Order Online",
          "See Location",
          "Learn More",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "15-30%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["appetizing", "professional"],
        secondaryColors: ["health-focus", "accent"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["reviews", "hygiene certifications", "ratings"],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.18,
        ctaClarity: 0.2,
        trustSignals: 0.28,
        offerClarity: 0.16,
        brandRecall: 0.18,
      },
      recommendationRules: [],
    },
    gaming: {
      goal: "consideration",
      vertical: "gaming",
      emotionalTriggers: [
        "gameplay",
        "graphics",
        "reviews",
        "community",
        "value",
        "innovation",
        "comparison",
        "social-proof",
      ],
      expectedEmotions: {
        confidence: 0.9,
        gameplay: 0.85,
        value: 0.8,
        community: 0.75,
        innovation: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "Read Reviews",
          "View Gameplay",
          "Compare Versions",
          "See System Requirements",
          "Learn More",
          "Check Price",
          "View Community",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "15-25%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["showcase", "dynamic"],
        secondaryColors: ["performance-metrics"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["reviews", "ratings", "verified players"],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.16,
        ctaClarity: 0.18,
        trustSignals: 0.28,
        offerClarity: 0.18,
        brandRecall: 0.2,
      },
      recommendationRules: [],
    },
    healthcare: {
      goal: "consideration",
      vertical: "healthcare",
      emotionalTriggers: [
        "expertise",
        "compassion",
        "credentials",
        "safety",
        "transparency",
        "reviews",
        "experience",
        "outcome",
      ],
      expectedEmotions: {
        confidence: 0.9,
        trust: 0.85,
        safety: 0.8,
        compassion: 0.75,
        expertise: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "Schedule Consultation",
          "Get Information",
          "View Credentials",
          "Read Reviews",
          "Learn More",
          "View Services",
          "Contact",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "20-35%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["professional", "calming"],
        secondaryColors: ["medical-blue", "health-green"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "credentials",
          "certifications",
          "patient testimonials",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.15,
        ctaClarity: 0.2,
        trustSignals: 0.35,
        offerClarity: 0.12,
        brandRecall: 0.18,
      },
      recommendationRules: [],
    },
    hotels: {
      goal: "consideration",
      vertical: "hotels",
      emotionalTriggers: [
        "comfort",
        "value",
        "location",
        "amenities",
        "reviews",
        "comparison",
        "experience",
        "cleanliness",
      ],
      expectedEmotions: {
        confidence: 0.9,
        value: 0.85,
        comfort: 0.8,
        safety: 0.75,
        anticipation: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "View Rooms",
          "Compare Rates",
          "Read Reviews",
          "Check Availability",
          "Reserve",
          "Learn More",
          "See Details",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "20-35%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["premium", "welcoming"],
        secondaryColors: ["location-focus", "review-highlights"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "ratings",
          "cleanliness standards",
          "verified guests",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.16,
        ctaClarity: 0.18,
        trustSignals: 0.32,
        offerClarity: 0.18,
        brandRecall: 0.16,
      },
      recommendationRules: [],
    },
    luxury: {
      goal: "consideration",
      vertical: "luxury",
      emotionalTriggers: [
        "exclusivity",
        "craftsmanship",
        "heritage",
        "prestige",
        "expertise",
        "authenticity",
        "sophistication",
        "luxury-validation",
      ],
      expectedEmotions: {
        exclusivity: 0.95,
        sophistication: 0.9,
        prestige: 0.85,
        heritage: 0.8,
        confidence: 0.75,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "View Collection",
          "Schedule Consultation",
          "Learn Heritage",
          "View Craftsmanship",
          "Get Started",
          "Explore More",
          "Request Information",
        ],
      },
      layoutIntelligence: {
        density: "minimal",
        whitespace: "40-55%",
        hierarchy: "subtle",
      },
      visualPsychology: {
        energy: "calm-sophisticated",
        primaryColors: ["gold", "black", "white"],
        secondaryColors: ["premium-silver", "jewel-tones"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["heritage", "craftsmanship", "expert certification"],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.18,
        ctaClarity: 0.2,
        trustSignals: 0.32,
        offerClarity: 0.12,
        brandRecall: 0.18,
      },
      recommendationRules: [],
    },
    news_media: {
      goal: "consideration",
      vertical: "news_media",
      emotionalTriggers: [
        "credibility",
        "depth",
        "expertise",
        "investigation",
        "transparency",
        "source-verification",
        "thought-leadership",
        "insight",
      ],
      expectedEmotions: {
        credibility: 0.95,
        insight: 0.9,
        trust: 0.85,
        engagement: 0.8,
        authority: 0.75,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "Read Full Story",
          "View Sources",
          "Deep Dive",
          "Explore Topic",
          "Subscribe",
          "Share Analysis",
          "Learn More",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "15-30%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["journalistic", "authoritative"],
        secondaryColors: ["source-emphasis", "accent"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "citations",
          "sources",
          "journalist credentials",
          "publication standards",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.14,
        ctaClarity: 0.16,
        trustSignals: 0.35,
        offerClarity: 0.12,
        brandRecall: 0.23,
      },
      recommendationRules: [],
    },
    real_estate: {
      goal: "consideration",
      vertical: "real_estate",
      emotionalTriggers: [
        "investment",
        "lifestyle",
        "value",
        "location",
        "comparison",
        "reviews",
        "credibility",
        "expertise",
      ],
      expectedEmotions: {
        confidence: 0.9,
        value: 0.85,
        investment: 0.8,
        lifestyle: 0.75,
        opportunity: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "View All Properties",
          "Schedule Tour",
          "Get Valuation",
          "Compare Neighborhoods",
          "Learn More",
          "Contact Agent",
          "View Details",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "20-35%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["professional", "inviting"],
        secondaryColors: ["location-focus", "value-emphasis"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "licensing",
          "credentials",
          "testimonials",
          "verified listings",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.16,
        ctaClarity: 0.2,
        trustSignals: 0.3,
        offerClarity: 0.16,
        brandRecall: 0.18,
      },
      recommendationRules: [],
    },
    sports: {
      goal: "consideration",
      vertical: "sports",
      emotionalTriggers: [
        "performance",
        "quality",
        "comparison",
        "reviews",
        "community",
        "expertise",
        "value",
        "innovation",
      ],
      expectedEmotions: {
        confidence: 0.9,
        performance: 0.85,
        community: 0.8,
        value: 0.75,
        expertise: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "View Specs",
          "Read Reviews",
          "Compare Products",
          "Check Price",
          "Learn More",
          "See Details",
          "Shop Now",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "15-30%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium-high",
        primaryColors: ["performance-focused", "professional"],
        secondaryColors: ["spec-emphasis", "review-highlights"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["reviews", "ratings", "expert endorsements"],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.16,
        ctaClarity: 0.18,
        trustSignals: 0.28,
        offerClarity: 0.18,
        brandRecall: 0.2,
      },
      recommendationRules: [],
    },
    technology: {
      goal: "consideration",
      vertical: "technology",
      emotionalTriggers: [
        "capability",
        "innovation",
        "security",
        "reliability",
        "scalability",
        "ease-of-use",
        "value",
        "expertise",
      ],
      expectedEmotions: {
        confidence: 0.9,
        capability: 0.85,
        innovation: 0.8,
        security: 0.75,
        value: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "View Features",
          "Compare Plans",
          "Schedule Demo",
          "Get Pricing",
          "Learn More",
          "Read Case Studies",
          "Start Trial",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "20-35%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium",
        primaryColors: ["modern", "professional"],
        secondaryColors: ["tech-focus", "capability-emphasis"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "security certifications",
          "case studies",
          "customer testimonials",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.16,
        ctaClarity: 0.2,
        trustSignals: 0.28,
        offerClarity: 0.18,
        brandRecall: 0.18,
      },
      recommendationRules: [],
    },
    travel: {
      goal: "consideration",
      vertical: "travel",
      emotionalTriggers: [
        "experience",
        "value",
        "reviews",
        "comparison",
        "location",
        "convenience",
        "safety",
        "expertise",
      ],
      expectedEmotions: {
        confidence: 0.9,
        value: 0.85,
        experience: 0.8,
        safety: 0.75,
        anticipation: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "medium",
        examples: [
          "View Options",
          "Compare Prices",
          "Read Reviews",
          "Check Itinerary",
          "Learn More",
          "Book Now",
          "See Details",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "20-35%",
        hierarchy: "nested",
      },
      visualPsychology: {
        energy: "medium-high",
        primaryColors: ["inspiring", "travel-focused"],
        secondaryColors: ["price-emphasis", "review-highlights"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "credentials",
          "insurance",
          "verified travelers",
        ],
      },
      conversionPressure: "medium",
      scoringWeights: {
        visualClarity: 0.16,
        ctaClarity: 0.2,
        trustSignals: 0.28,
        offerClarity: 0.18,
        brandRecall: 0.18,
      },
      recommendationRules: [],
    },
  },
  conversion: {
    automotive: {
      goal: "conversion",
      vertical: "automotive",
      emotionalTriggers: [
        "urgency",
        "exclusivity",
        "offer",
        "decision",
        "action",
        "opportunity",
        "scarcity",
        "value",
      ],
      expectedEmotions: {
        urgency: 0.95,
        exclusivity: 0.9,
        opportunity: 0.85,
        action: 0.8,
        value: 0.75,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Buy Now",
          "Schedule Test Drive",
          "Get Offer",
          "Claim Deal",
          "Apply Now",
          "Reserve Today",
          "Complete Purchase",
          "Limited Time",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "extreme",
        primaryColors: ["brand-red", "gold", "black"],
        secondaryColors: ["high-contrast", "urgency"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "scarcity",
          "time-limit",
          "warranty",
          "satisfaction-guarantee",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.35,
        trustSignals: 0.2,
        offerClarity: 0.25,
        brandRecall: 0.12,
      },
      recommendationRules: [
        {
          id: "cta_weak",
          severity: "critical",
          recommendation: "CTA must be direct and urgent (Buy Now, Claim Deal)",
          impact: 30,
        },
        {
          id: "offer_missing",
          severity: "critical",
          recommendation: "Add clear offer, discount, or limited-time incentive",
          impact: 35,
        },
      ],
    },
    banking: {
      goal: "conversion",
      vertical: "banking",
      emotionalTriggers: [
        "opportunity",
        "action",
        "security",
        "offer",
        "decision",
        "urgency",
        "value",
        "incentive",
      ],
      expectedEmotions: {
        opportunity: 0.9,
        security: 0.85,
        value: 0.8,
        action: 0.75,
        urgency: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Open Account Now",
          "Apply Today",
          "Get Bonus",
          "Claim Offer",
          "Start Now",
          "Sign Up Today",
          "Activate",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["brand-blue", "gold", "white"],
        secondaryColors: ["offer-highlight", "urgency"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "FDIC insurance",
          "security",
          "compliance",
          "offer-terms",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.32,
        trustSignals: 0.25,
        offerClarity: 0.28,
        brandRecall: 0.07,
      },
      recommendationRules: [],
    },
    ecommerce: {
      goal: "conversion",
      vertical: "ecommerce",
      emotionalTriggers: [
        "urgency",
        "offer",
        "action",
        "scarcity",
        "incentive",
        "convenience",
        "decision",
        "fear-of-missing",
      ],
      expectedEmotions: {
        urgency: 0.95,
        incentive: 0.9,
        action: 0.85,
        scarcity: 0.8,
        convenience: 0.75,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Buy Now",
          "Add to Cart",
          "Checkout",
          "Claim Deal",
          "Shop Now",
          "Limited Offer",
          "Order Today",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "3-12%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "extreme",
        primaryColors: ["brand-red", "gold", "black"],
        secondaryColors: ["high-contrast", "scarcity-signal"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "return-policy",
          "secure-checkout",
          "satisfaction-guarantee",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.05,
        ctaClarity: 0.35,
        trustSignals: 0.15,
        offerClarity: 0.35,
        brandRecall: 0.1,
      },
      recommendationRules: [],
    },
    education: {
      goal: "conversion",
      vertical: "education",
      emotionalTriggers: [
        "opportunity",
        "action",
        "incentive",
        "urgency",
        "offer",
        "value",
        "decision",
        "enrollment",
      ],
      expectedEmotions: {
        opportunity: 0.9,
        action: 0.85,
        value: 0.8,
        urgency: 0.75,
        confidence: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Enroll Now",
          "Apply Today",
          "Get Started",
          "Claim Offer",
          "Start Course",
          "Sign Up Now",
          "Join Today",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["brand-color", "action-button"],
        secondaryColors: ["offer-highlight", "urgency"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "accreditation",
          "testimonials",
          "guarantee",
          "credentials",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.32,
        trustSignals: 0.2,
        offerClarity: 0.28,
        brandRecall: 0.12,
      },
      recommendationRules: [],
    },
    entertainment: {
      goal: "conversion",
      vertical: "entertainment",
      emotionalTriggers: [
        "excitement",
        "urgency",
        "incentive",
        "scarcity",
        "action",
        "offer",
        "exclusive",
        "limited-time",
      ],
      expectedEmotions: {
        excitement: 0.95,
        urgency: 0.9,
        incentive: 0.85,
        action: 0.8,
        exclusivity: 0.75,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Subscribe Now",
          "Claim Trial",
          "Start Watching",
          "Get Access",
          "Join Now",
          "Exclusive Offer",
          "Activate Now",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "3-12%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "extreme",
        primaryColors: ["brand-primary", "action-red"],
        secondaryColors: ["high-contrast", "urgency-signal"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "free-trial",
          "cancel-anytime",
          "satisfaction",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.05,
        ctaClarity: 0.35,
        trustSignals: 0.15,
        offerClarity: 0.32,
        brandRecall: 0.13,
      },
      recommendationRules: [],
    },
    finance: {
      goal: "conversion",
      vertical: "finance",
      emotionalTriggers: [
        "opportunity",
        "action",
        "incentive",
        "security",
        "decision",
        "urgency",
        "offer",
        "value",
      ],
      expectedEmotions: {
        opportunity: 0.9,
        security: 0.85,
        action: 0.8,
        value: 0.75,
        urgency: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Get Started Now",
          "Claim Offer",
          "Apply Today",
          "Start Investing",
          "Get Bonus",
          "Open Account",
          "Act Now",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["brand-color", "action-gold"],
        secondaryColors: ["offer-highlight", "urgency"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "security",
          "compliance",
          "guarantee",
          "certifications",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.35,
        trustSignals: 0.2,
        offerClarity: 0.28,
        brandRecall: 0.09,
      },
      recommendationRules: [],
    },
    food: {
      goal: "conversion",
      vertical: "food",
      emotionalTriggers: [
        "urgency",
        "appetite",
        "incentive",
        "action",
        "offer",
        "scarcity",
        "time-sensitive",
        "exclusive",
      ],
      expectedEmotions: {
        appetite: 0.95,
        urgency: 0.9,
        incentive: 0.85,
        action: 0.8,
        convenience: 0.75,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Order Now",
          "Reserve Now",
          "Claim Offer",
          "Get Deal",
          "Order Today",
          "Limited Time",
          "Delivery",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["appetite-red", "brand-color"],
        secondaryColors: ["offer-highlight", "time-signal"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "delivery-guarantee",
          "hygiene",
          "ratings",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.35,
        trustSignals: 0.15,
        offerClarity: 0.3,
        brandRecall: 0.12,
      },
      recommendationRules: [],
    },
    gaming: {
      goal: "conversion",
      vertical: "gaming",
      emotionalTriggers: [
        "excitement",
        "urgency",
        "exclusive",
        "incentive",
        "action",
        "scarcity",
        "limited-time",
        "offer",
      ],
      expectedEmotions: {
        excitement: 0.95,
        urgency: 0.9,
        exclusivity: 0.85,
        action: 0.8,
        incentive: 0.75,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Download Now",
          "Play Now",
          "Get Access",
          "Claim Bonus",
          "Join Now",
          "Get Started",
          "Exclusive Offer",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "3-12%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "extreme",
        primaryColors: ["neon", "action-bright"],
        secondaryColors: ["high-contrast", "urgency-signal"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "verified",
          "community",
          "free-to-play",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.05,
        ctaClarity: 0.35,
        trustSignals: 0.15,
        offerClarity: 0.32,
        brandRecall: 0.13,
      },
      recommendationRules: [],
    },
    healthcare: {
      goal: "conversion",
      vertical: "healthcare",
      emotionalTriggers: [
        "urgency",
        "action",
        "appointment",
        "care",
        "decision",
        "opportunity",
        "offer",
        "health",
      ],
      expectedEmotions: {
        urgency: 0.9,
        care: 0.85,
        action: 0.8,
        confidence: 0.75,
        hope: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Schedule Now",
          "Book Appointment",
          "Get Started",
          "Call Now",
          "Apply Today",
          "Claim Offer",
          "Contact Us",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["medical-action", "care-color"],
        secondaryColors: ["offer-highlight", "urgency"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "credentials",
          "license",
          "insurance",
          "testimonials",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.32,
        trustSignals: 0.25,
        offerClarity: 0.25,
        brandRecall: 0.1,
      },
      recommendationRules: [],
    },
    hotels: {
      goal: "conversion",
      vertical: "hotels",
      emotionalTriggers: [
        "urgency",
        "incentive",
        "scarcity",
        "action",
        "offer",
        "booking",
        "exclusive",
        "limited",
      ],
      expectedEmotions: {
        urgency: 0.9,
        incentive: 0.85,
        action: 0.8,
        anticipation: 0.75,
        value: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Book Now",
          "Reserve Today",
          "Claim Deal",
          "Get Offer",
          "Rooms Available",
          "Limited Availability",
          "Reserve",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["action-color", "offer-highlight"],
        secondaryColors: ["urgency-signal", "brand"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "ratings",
          "best-price",
          "verified-guests",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.32,
        trustSignals: 0.2,
        offerClarity: 0.3,
        brandRecall: 0.1,
      },
      recommendationRules: [],
    },
    luxury: {
      goal: "conversion",
      vertical: "luxury",
      emotionalTriggers: [
        "exclusivity",
        "opportunity",
        "decision",
        "prestige",
        "action",
        "urgency",
        "limited",
        "privilege",
      ],
      expectedEmotions: {
        exclusivity: 0.95,
        prestige: 0.9,
        opportunity: 0.85,
        action: 0.8,
        confidence: 0.75,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Purchase Now",
          "Claim Exclusive",
          "Get Access",
          "Inquire",
          "Reserve Now",
          "Limited Edition",
          "Act Now",
        ],
      },
      layoutIntelligence: {
        density: "minimal",
        whitespace: "35-50%",
        hierarchy: "subtle-urgent",
      },
      visualPsychology: {
        energy: "high-sophistication",
        primaryColors: ["gold", "black", "white"],
        secondaryColors: ["premium-accent", "exclusivity"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["heritage", "exclusivity", "craftsmanship"],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.28,
        trustSignals: 0.28,
        offerClarity: 0.26,
        brandRecall: 0.1,
      },
      recommendationRules: [],
    },
    news_media: {
      goal: "conversion",
      vertical: "news_media",
      emotionalTriggers: [
        "urgency",
        "relevance",
        "action",
        "exclusive",
        "offer",
        "decision",
        "subscription",
        "opportunity",
      ],
      expectedEmotions: {
        urgency: 0.9,
        relevance: 0.85,
        action: 0.8,
        exclusivity: 0.75,
        authority: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Subscribe Now",
          "Get Access",
          "Claim Offer",
          "Start Trial",
          "Read Full Story",
          "Join Now",
          "Exclusive",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["action-color", "urgency-red"],
        secondaryColors: ["offer-highlight", "exclusive"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "journalism-standards",
          "sources",
          "verification",
          "credentials",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.32,
        trustSignals: 0.25,
        offerClarity: 0.25,
        brandRecall: 0.1,
      },
      recommendationRules: [],
    },
    real_estate: {
      goal: "conversion",
      vertical: "real_estate",
      emotionalTriggers: [
        "urgency",
        "opportunity",
        "incentive",
        "action",
        "decision",
        "scarcity",
        "investment",
        "exclusive",
      ],
      expectedEmotions: {
        opportunity: 0.9,
        urgency: 0.85,
        incentive: 0.8,
        action: 0.75,
        value: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Schedule Tour",
          "Make Offer",
          "Get Pre-Approved",
          "Start Now",
          "Claim Offer",
          "Limited Availability",
          "Act Now",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["action-color", "offer-highlight"],
        secondaryColors: ["urgency-signal", "brand"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: ["licensing", "credentials", "testimonials", "MLS"],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.32,
        trustSignals: 0.22,
        offerClarity: 0.28,
        brandRecall: 0.1,
      },
      recommendationRules: [],
    },
    sports: {
      goal: "conversion",
      vertical: "sports",
      emotionalTriggers: [
        "urgency",
        "action",
        "exclusive",
        "incentive",
        "scarcity",
        "offer",
        "limited",
        "opportunity",
      ],
      expectedEmotions: {
        urgency: 0.9,
        action: 0.85,
        exclusivity: 0.8,
        incentive: 0.75,
        opportunity: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Buy Now",
          "Reserve Now",
          "Claim Offer",
          "Get Access",
          "Shop Now",
          "Limited Stock",
          "Order Today",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "extreme",
        primaryColors: ["action-color", "urgency-red"],
        secondaryColors: ["high-contrast", "scarcity-signal"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "official",
          "verified",
          "satisfaction",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.05,
        ctaClarity: 0.35,
        trustSignals: 0.15,
        offerClarity: 0.33,
        brandRecall: 0.12,
      },
      recommendationRules: [],
    },
    technology: {
      goal: "conversion",
      vertical: "technology",
      emotionalTriggers: [
        "urgency",
        "opportunity",
        "action",
        "incentive",
        "innovation",
        "offer",
        "decision",
        "exclusive",
      ],
      expectedEmotions: {
        opportunity: 0.9,
        action: 0.85,
        innovation: 0.8,
        urgency: 0.75,
        value: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Start Trial Now",
          "Get Started",
          "Claim Offer",
          "Sign Up Today",
          "Buy Now",
          "Exclusive Deal",
          "Act Now",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["action-color", "tech-primary"],
        secondaryColors: ["offer-highlight", "urgency"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "security",
          "certifications",
          "testimonials",
          "case-studies",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.32,
        trustSignals: 0.2,
        offerClarity: 0.28,
        brandRecall: 0.12,
      },
      recommendationRules: [],
    },
    travel: {
      goal: "conversion",
      vertical: "travel",
      emotionalTriggers: [
        "urgency",
        "incentive",
        "scarcity",
        "action",
        "offer",
        "booking",
        "exclusive",
        "limited",
      ],
      expectedEmotions: {
        urgency: 0.9,
        incentive: 0.85,
        action: 0.8,
        anticipation: 0.75,
        value: 0.7,
      },
      ctaIntelligence: {
        required: true,
        strength: "direct",
        examples: [
          "Book Now",
          "Claim Deal",
          "Reserve Today",
          "Get Offer",
          "Start Journey",
          "Limited Availability",
          "Book Today",
        ],
      },
      layoutIntelligence: {
        density: "information-rich",
        whitespace: "5-15%",
        hierarchy: "urgent",
      },
      visualPsychology: {
        energy: "high",
        primaryColors: ["action-color", "offer-highlight"],
        secondaryColors: ["urgency-signal", "brand"],
      },
      trustExpectations: {
        required: true,
        credibilitySignals: [
          "reviews",
          "insurance",
          "credentials",
          "verified-travelers",
        ],
      },
      conversionPressure: "high",
      scoringWeights: {
        visualClarity: 0.08,
        ctaClarity: 0.32,
        trustSignals: 0.2,
        offerClarity: 0.3,
        brandRecall: 0.1,
      },
      recommendationRules: [],
    },
  },
};

/**
 * Convert raw profile to intelligence profile patch
 */
function normalizeDensity(rawDensity: string): "minimal" | "balanced" | "information-rich" | "direct-response" {
  const validDensities: Record<string, "minimal" | "balanced" | "information-rich" | "direct-response"> = {
    minimal: "minimal",
    balanced: "balanced",
    "information-rich": "information-rich",
    "direct-response": "direct-response",
    compact: "information-rich",
    maximum: "information-rich",
    rich: "information-rich",
  };
  return validDensities[rawDensity.toLowerCase()] || "balanced";
}

function normalizeWhitespace(rawWhitespace: string): "compact" | "moderate" | "generous" {
  const validWhitespace: Record<string, "compact" | "moderate" | "generous"> = {
    compact: "compact",
    moderate: "moderate",
    generous: "generous",
    minimal: "compact",
    "25-40%": "moderate",
    "40-60%": "moderate",
    "60%+": "generous",
    ample: "generous",
  };
  return validWhitespace[rawWhitespace.toLowerCase()] || "moderate";
}

function normalizeWeights(rawWeights: Record<string, number>): {
  brandRecall: number;
  ctaClarity: number;
  emotionalResonance: number;
  trustSignals: number;
  visualClarity: number;
  offerClarity: number;
  mobileLegibility: number;
} {
  // Ensure all 7 required weight keys exist with default value of 0
  const normalized: Record<string, number> = {
    brandRecall: rawWeights.brandRecall ?? 0,
    ctaClarity: rawWeights.ctaClarity ?? 0,
    emotionalResonance: rawWeights.emotionalResonance ?? 0,
    trustSignals: rawWeights.trustSignals ?? 0,
    visualClarity: rawWeights.visualClarity ?? 0,
    offerClarity: rawWeights.offerClarity ?? 0,
    mobileLegibility: rawWeights.mobileLegibility ?? 0,
  };

  // Sum all weights
  const total = Object.values(normalized).reduce((a, b) => a + b, 0);
  if (total === 0) {
    // Fallback: equal distribution if all weights are 0
    return {
      brandRecall: 1 / 7,
      ctaClarity: 1 / 7,
      emotionalResonance: 1 / 7,
      trustSignals: 1 / 7,
      visualClarity: 1 / 7,
      offerClarity: 1 / 7,
      mobileLegibility: 1 / 7,
    };
  }

  // Normalize to sum to 1.0
  return {
    brandRecall: normalized.brandRecall / total,
    ctaClarity: normalized.ctaClarity / total,
    emotionalResonance: normalized.emotionalResonance / total,
    trustSignals: normalized.trustSignals / total,
    visualClarity: normalized.visualClarity / total,
    offerClarity: normalized.offerClarity / total,
    mobileLegibility: normalized.mobileLegibility / total,
  };
}

function convertRawToProfilePatch(raw: RawProfile): IntelligenceProfilePatch {
  return {
    source: [
      {
        goal: raw.goal,
        path: `docs/${raw.goal}-intelligence.md`,
        status: "parsed",
      },
    ],
    expectedEmotions: {
      primary: Object.entries(raw.expectedEmotions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k),
      secondary: Object.entries(raw.expectedEmotions)
        .sort((a, b) => b[1] - a[1])
        .slice(3, 5)
        .map(([k]) => k),
      avoid: [],
      intensity: "moderate",
    },
    ctaExpectations: {
      strength: raw.ctaIntelligence.strength,
      examples: raw.ctaIntelligence.examples,
      discouraged: [],
      required: raw.ctaIntelligence.required,
      visibilityPriority:
        raw.goal === "conversion" ? "critical" : "medium",
    },
    layoutExpectations: {
      density: normalizeDensity(raw.layoutIntelligence.density),
      readingPattern:
        raw.goal === "awareness" ? "hero-first" : "f-pattern",
      preferredHierarchy: [],
      whitespace: normalizeWhitespace(raw.layoutIntelligence.whitespace),
      safeAreaRules: [],
    },
    scoringPreferences: {
      weights: normalizeWeights(raw.scoringWeights),
      penalties: raw.goal === "conversion" ? ["missing CTA"] : [],
      boosts: [],
    },
    creativeBehaviors: [],
    emotionalTriggers: raw.emotionalTriggers,
    mobilePreferences: {
      minimumTextSize: "large",
      thumbZoneCta: raw.goal === "conversion",
      maxMessageUnits:
        raw.goal === "awareness" ? 2 : raw.goal === "consideration" ? 4 : 1,
      preferredFormats: ["320x100", "300x250", "320x480"],
      rules: [],
    },
    designPsychologyRules: [],
    visualPsychology: {
      energy: raw.visualPsychology.energy === "high" ? "high" : raw.visualPsychology.energy === "low" ? "low" : "medium",
      colorPalette: {
        primary: raw.visualPsychology.primaryColors,
        secondary: raw.visualPsychology.secondaryColors,
        avoid: [],
      },
      typographyStyle: raw.goal === "awareness" ? "bold" : raw.goal === "conversion" ? "moderate" : "moderate",
      brandingProminence: raw.goal === "awareness" ? "balanced" : raw.goal === "conversion" ? "subtle" : "balanced",
    },
    trustExpectations: {
      trustSignalsRequired: raw.trustExpectations.required,
      credibilityIndicators: raw.trustExpectations.credibilitySignals,
      averageConfidence: raw.trustExpectations.required ? 0.85 : 0.65,
    },
    conversionPressure: raw.conversionPressure,
    notes: [`${raw.goal} profile for ${raw.vertical}`],
  };
}

/**
 * Load all 48 profiles from dataset
 * This returns both GOAL_BASELINES and VERTICAL_BASELINES
 */
export function loadDatasetProfiles(): {
  GOAL_BASELINES: Record<CampaignGoal, IntelligenceProfilePatch>;
  VERTICAL_BASELINES: Record<VerticalKey, IntelligenceProfilePatch>;
  PROFILE_OVERRIDES: Record<string, IntelligenceProfilePatch>;
} {
  const GOAL_BASELINES: Record<CampaignGoal, IntelligenceProfilePatch> = {
    awareness: convertRawToProfilePatch(DATASET_PROFILES.awareness.automotive),
    consideration: convertRawToProfilePatch(DATASET_PROFILES.consideration.automotive),
    conversion: convertRawToProfilePatch(DATASET_PROFILES.conversion.automotive),
  };

  const verticalBaselines: Record<string, IntelligenceProfilePatch> = {};

  // Build vertical baselines (use awareness profile for each vertical)
  const verticals = Object.keys(
    DATASET_PROFILES.awareness
  ) as VerticalKey[];
  for (const vertical of verticals) {
    const awarenessProfile =
      DATASET_PROFILES.awareness[vertical];
    verticalBaselines[vertical] =
      convertRawToProfilePatch(awarenessProfile);
  }

  const profileOverrides: Record<string, IntelligenceProfilePatch> = {};
  (["awareness", "consideration", "conversion"] as CampaignGoal[]).forEach((goal) => {
    (Object.keys(DATASET_PROFILES[goal]) as VerticalKey[]).forEach((vertical) => {
      profileOverrides[`${goal}:${vertical}`] = convertRawToProfilePatch(DATASET_PROFILES[goal][vertical]);
    });
  });

  return {
    GOAL_BASELINES,
    VERTICAL_BASELINES: verticalBaselines as Record<VerticalKey, IntelligenceProfilePatch>,
    PROFILE_OVERRIDES: profileOverrides,
  };
}

/**
 * Get raw profile for specific goal+vertical (used for deterministic logic)
 */
export function getRawProfile(
  goal: CampaignGoal,
  vertical: VerticalKey
): RawProfile | null {
  return DATASET_PROFILES[goal]?.[vertical] ?? null;
}

/**
 * Validate that all 48 profiles exist
 */
export function validateDatasetCompleteness(): {
  complete: boolean;
  missing: string[];
} {
  const goals: CampaignGoal[] = [
    "awareness",
    "consideration",
    "conversion",
  ];
  const verticals: VerticalKey[] = [
    "automotive",
    "banking",
    "ecommerce",
    "education",
    "entertainment",
    "finance",
    "food",
    "gaming",
    "healthcare",
    "hotels",
    "luxury",
    "news_media",
    "real_estate",
    "sports",
    "technology",
    "travel",
  ];

  const missing: string[] = [];

  for (const goal of goals) {
    for (const vertical of verticals) {
      if (!DATASET_PROFILES[goal]?.[vertical]) {
        missing.push(`${goal}/${vertical}`);
      }
    }
  }

  return {
    complete: missing.length === 0,
    missing,
  };
}
