// Random utility function
function getRandomElements(arr: any[], num: number) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

function getRandomElement(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CONTENT_BANKS = {
  newspaper: {
    heroHeadlines: [
      "The Next Generation of Web Rendering Has Arrived",
      "Global Markets Surge Amid Unprecedented Tech Growth",
      "Climate Summit Reaches Historic Agreement on Emissions",
      "New Breakthrough in Quantum Computing Announced",
    ],
    heroSubtitles: [
      "How modern frameworks are fundamentally changing the way developers build interactive applications for millions of users worldwide.",
      "Analysts remain optimistic as major tech conglomerates post record-breaking quarterly earnings.",
      "World leaders finalize a comprehensive framework to accelerate the transition to renewable energy.",
      "Researchers at major universities have successfully stabilized a 1000-qubit processor for the first time.",
    ],
    heroImages: [
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    ],
    trendingTitles: [
      "Markets rally as inflation cools faster than expected",
      "Director's cut of sci-fi epic shatters box office records",
      "Electric vehicle sales hit major milestone in Europe",
      "Startup unveils promising new battery technology",
      "Major security vulnerability patched in popular software",
    ],
    articleHeadlines: [
      "The rise of generative AI in enterprise workflows",
      "Global chip shortage finally shows signs of easing",
      "Future of remote work: Hybrid models become the norm",
      "Space exploration: Next mission to Mars detailed",
    ],
    articleImages: [
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80",
    ]
  },
  ecommerce: {
    heroHeadlines: [
      "Summer Tech Sale",
      "Back to School Essentials",
      "Holiday Mega Deals",
      "New Arrivals in Gadgets",
    ],
    heroSubtitles: [
      "Up to 40% off on premium electronics.",
      "Get ready for the semester with top-rated laptops and accessories.",
      "Massive discounts on the gifts they actually want.",
      "Be the first to experience the latest innovations.",
    ],
    productNames: [
      "Premium Wireless Noise-Cancelling Headphones Pro",
      "Ultra-Slim 4K OLED Smart Monitor 27\"",
      "Mechanical Gaming Keyboard with RGB Switches",
      "Ergonomic Optical Wireless Mouse",
      "Smart Home Assistant Speaker Hub",
      "Pro Mirrorless Digital Camera Body",
      "1TB NVMe Solid State Drive Gen4",
      "Next-Gen Gaming Console Premium Edition",
    ],
    productImages: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1572569432755-90f5eb0d4734?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
    ]
  },
  gaming: {
    heroHeadlines: [
      "Championship Finals: Team Liquid Takes the Crown",
      "First Look: Next-Gen Engine Shows Photorealistic Graphics",
      "Major Patch Drops: Weapon Balancing Shakes the Meta",
      "Speedrunner Breaks 5-Year World Record",
    ],
    heroSubtitles: [
      "In an incredible 5-game series, the underdogs clutched the final round to secure the global trophy.",
      "Developers showcase new ray-tracing technology that blurs the line between reality and rendering.",
      "Assault rifles nerfed, SMGs buffed in the latest competitive update for Season 4.",
      "Using a newly discovered glitch, the runner bypassed the entire third act.",
    ],
    heroImages: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
    ],
    trendingTitles: [
      "Upcoming RPG delayed to next Spring",
      "Interview with the lead designer of 'Neon Protocol'",
      "Top 10 loadouts for the current competitive season",
      "Esports organization announces new roster",
      "Indie darling surpasses 2 million copies sold",
    ],
    gameNames: [
      "Neon Protocol: Vengeance",
      "Apex Chronicles II",
      "Shadow Tactics: Horizon",
      "Battleforge Arena",
      "Stellar Odyssey",
      "Cyber Ops: Tactics",
    ],
    gameImages: [
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1493711662062-fa541fae0ffe?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=400&q=80",
    ]
  },
  health: {
    heroHeadlines: [
      "Understanding the Science of Deep Sleep",
      "5 Superfoods That Boost Your Immune System",
      "The Mental Health Benefits of Daily Meditation",
      "Breakthrough in Non-Invasive Cardiovascular Screening",
    ],
    heroSubtitles: [
      "Why REM cycles are critical for cognitive recovery and how to optimize your nightly routine.",
      "Nutritionists agree that adding these simple ingredients to your diet can drastically improve long-term health.",
      "Studies show just 10 minutes a day can lower cortisol levels and improve overall focus.",
      "New medical devices are making preventative heart care more accessible than ever.",
    ],
    heroImages: [
      "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
    ],
    trendingTitles: [
      "The truth about intermittent fasting",
      "How to set up an ergonomic home office",
      "Hydration myths debunked by medical professionals",
      "Beginner's guide to mindful breathing",
      "Latest guidelines on adult vaccination schedules",
    ],
    articleHeadlines: [
      "Yoga routines for lower back pain relief",
      "Plant-based diets: A cardiologist's perspective",
      "Managing screen time for better eye health",
      "The hidden benefits of strength training",
    ],
    articleImages: [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80",
    ]
  },
  food: {
    heroHeadlines: [
      "15 Comfort Food Recipes for Rainy Days",
      "The Ultimate Guide to Sourdough Baking",
      "Quick & Easy Weeknight Dinners",
      "Decadent Desserts You Can Make in 30 Minutes",
    ],
    heroSubtitles: [
      "Warm up with these hearty, soul-soothing dishes perfect for cozy evenings indoors.",
      "Master the art of natural fermentation with our step-by-step beginner's tutorial.",
      "Save time without sacrificing flavor with these minimal-prep family favorites.",
      "Satisfy your sweet tooth instantly with these rich and simple dessert recipes.",
    ],
    heroImages: [
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=1200&q=80",
    ],
    recipeNames: [
      "Classic Margherita Pizza",
      "Creamy Garlic Tuscan Salmon",
      "Avocado Toast with Poached Egg",
      "Homemade Chocolate Chip Cookies",
      "Spicy Thai Basil Chicken",
      "Roasted Butternut Squash Soup",
      "Berry Antioxidant Smoothie Bowl",
      "Rustic Lemon Herb Roast Chicken"
    ],
    recipeImages: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1495147466023-ce5a4af967e8?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80"
    ]
  },
  technology: {
    heroHeadlines: [
      "The Next Generation of Web Rendering Has Arrived",
      "AI Models Break New Benchmarks in Reasoning Tasks",
      "Hands-On: The Flagship Smartphone that Changes Everything",
      "Cybersecurity Experts Warn of Sophisticated Phishing Wave"
    ],
    heroSubtitles: [
      "How modern frameworks are fundamentally changing the way developers build interactive applications for millions of users worldwide.",
      "The latest iteration of large language models demonstrates unprecedented capability in complex logic and mathematics.",
      "We spent a week with the most anticipated device of the year. Here is why it lives up to the hype.",
      "Security analysts have uncovered a massive campaign targeting enterprise credentials using AI-generated lures."
    ],
    heroImages: [
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
    ],
    trendingTitles: [
      "Tech giant acquires rising AI startup for $2B",
      "New European privacy regulations shake up ad tech",
      "Is the silicon shortage finally over?",
      "Top 10 VS Code extensions for productivity in 2026",
      "The death of the password: How passkeys are taking over"
    ],
    articleHeadlines: [
      "Review: The ultra-wide monitor that revolutionized my workflow",
      "Understanding WebAssembly and its impact on performance",
      "The rise of decentralized social networks",
      "Why developers are migrating away from legacy REST APIs",
      "The environmental cost of training massive AI models"
    ],
    articleImages: [
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1531297172864-f2ca321045aa?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80"
    ]
  },
  education: {
    heroHeadlines: [
      "Master Full-Stack Engineering in 12 Weeks",
      "Data Science Bootcamp: From Zero to Analyst",
      "The Complete UI/UX Design Masterclass",
      "Advanced Machine Learning Specialization"
    ],
    heroSubtitles: [
      "Join our intensive program designed to take you from fundamentals to building production-ready scalable applications.",
      "Learn Python, SQL, and predictive modeling from industry experts and jumpstart your career in data.",
      "Transform your creative process with our hands-on curriculum covering research, wireframing, and high-fidelity prototyping.",
      "Dive deep into neural networks, deep learning, and computer vision with our advanced certification program."
    ],
    heroImages: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
    ],
    courseNames: [
      "Python for Data Science",
      "React Native Mobile Development",
      "Digital Marketing Strategy",
      "Introduction to Cloud Computing",
      "Financial Modeling Basics",
      "Cybersecurity Fundamentals"
    ],
    courseImages: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80"
    ]
  },
  entertainment: {
    heroHeadlines: [
      "Stranger Worlds: The Epic Conclusion",
      "The Crown's Gambit: New Season Premiere",
      "Galactic Rebellion: Exclusive First Look",
      "Midnight Shadows: A Gripping New Thriller"
    ],
    heroSubtitles: [
      "The highly anticipated final season arrives this Friday. Get ready for a mind-bending finale.",
      "Betrayal, alliances, and power struggles. Watch the dramatic return of the acclaimed series.",
      "Go behind the scenes of the most ambitious sci-fi universe ever brought to the screen.",
      "A detective uncovers a conspiracy that spans generations in this dark new original movie."
    ],
    heroImages: [
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80"
    ],
    movieNames: [
      "Neon Horizon",
      "The Last Vanguard",
      "Echoes of Tomorrow",
      "Shattered Glass",
      "Crimson Tide Returns",
      "Into the Abyss",
      "Urban Legends",
      "The Forgotten Path",
      "Whispers in the Dark",
      "City of Angels"
    ],
    movieImages: [
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1535016120720-40c746a52c67?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80"
    ]
  },
  business: {
    heroHeadlines: [
      "Global Markets Surge on New Tech Policy",
      "The Future of Corporate Sustainability",
      "Mergers & Acquisitions Reach All-Time High",
      "How Startups Are Disrupting Traditional Finance"
    ],
    heroSubtitles: [
      "Investors are reacting positively as new regulatory frameworks encourage innovation across multiple sectors.",
      "Top CEOs agree that long-term profitability is now inextricably linked to environmental responsibility.",
      "Analysts break down the biggest deals of the quarter and what they mean for the global economy.",
      "A deep dive into the fintech solutions that are bypassing legacy banking systems."
    ],
    heroImages: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80"
    ],
    trendingTitles: [
      "Federal Reserve signals potential rate cuts",
      "Top 5 emerging markets to watch this year",
      "Oil prices stabilize after weeks of volatility",
      "The impact of remote work on commercial real estate",
      "Cryptocurrency regulations: What you need to know"
    ],
    articleHeadlines: [
      "Interview with the CEO: Navigating economic headwinds",
      "The gig economy is transforming the modern workforce",
      "Supply chain resilience in the post-pandemic era",
      "Venture capital funding shifts focus to green tech",
      "Understanding the new tax codes for small businesses",
      "Corporate governance in the age of social media"
    ],
    articleImages: [
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1554200876-56c2f25224fa?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1520607162513-3ac70ce3215d?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80"
    ]
  }
};

export function generateTemplateContent(type: string) {
  // Fallback to newspaper if type doesn't exist
  const bankType = type as keyof typeof CONTENT_BANKS;
  const bank = (CONTENT_BANKS as any)[bankType] || (CONTENT_BANKS as any).newspaper;
  
  if (type === "ecommerce") {
    const products = getRandomElements(bank.productNames, 12).map((name) => ({
      name,
      price: (Math.random() * 200 + 49).toFixed(2),
      oldPrice: (Math.random() * 100 + 300).toFixed(2),
      reviews: Math.floor(Math.random() * 1500) + 20,
      image: getRandomElement(bank.productImages)
    }));
    
    return {
      hero: {
        headline: getRandomElement(bank.heroHeadlines),
        subtitle: getRandomElement(bank.heroSubtitles)
      },
      products
    };
  }
  
  if (type === "gaming") {
    const games = getRandomElements(bank.gameNames, 6).map((title) => ({
      title,
      image: getRandomElement(bank.gameImages),
      viewers: Math.floor(Math.random() * 90) + 10 + "K"
    }));
    
    return {
      hero: {
        headline: getRandomElement(bank.heroHeadlines),
        subtitle: getRandomElement(bank.heroSubtitles),
        image: getRandomElement(bank.heroImages)
      },
      trending: getRandomElements(bank.trendingTitles, 5),
      games
    };
  }

  if (type === "food") {
    const recipes = getRandomElements(bank.recipeNames, 8).map((title) => ({
      title,
      image: getRandomElement(bank.recipeImages),
      time: Math.floor(Math.random() * 45) + 15 + " min",
      rating: (Math.random() * 1 + 4).toFixed(1)
    }));
    return {
      hero: {
        headline: getRandomElement(bank.heroHeadlines),
        subtitle: getRandomElement(bank.heroSubtitles),
        image: getRandomElement(bank.heroImages)
      },
      recipes
    };
  }

  if (type === "education") {
    const courses = getRandomElements(bank.courseNames, 6).map((title) => ({
      title,
      image: getRandomElement(bank.courseImages),
      instructor: ["Sarah Jenkins", "Dr. Alan Turing", "Michael Chen", "Elena Rodriguez"][Math.floor(Math.random() * 4)],
      students: Math.floor(Math.random() * 15000) + 1000
    }));
    return {
      hero: {
        headline: getRandomElement(bank.heroHeadlines),
        subtitle: getRandomElement(bank.heroSubtitles),
        image: getRandomElement(bank.heroImages)
      },
      courses
    };
  }

  if (type === "entertainment") {
    const movies = getRandomElements(bank.movieNames, 8).map((title) => ({
      title,
      image: getRandomElement(bank.movieImages),
      match: Math.floor(Math.random() * 15) + 85 + "% Match"
    }));
    return {
      hero: {
        headline: getRandomElement(bank.heroHeadlines),
        subtitle: getRandomElement(bank.heroSubtitles),
        image: getRandomElement(bank.heroImages)
      },
      movies
    };
  }

  // Default structure (Newspaper, Health, Technology, Business, etc)
  const articles = getRandomElements(bank.articleHeadlines || CONTENT_BANKS.newspaper.articleHeadlines, 8).map((title) => ({
    title,
    image: getRandomElement(bank.articleImages || CONTENT_BANKS.newspaper.articleImages),
    category: ["Tech", "World", "Business", "Health", "Science"][Math.floor(Math.random() * 5)],
    timeAgo: Math.floor(Math.random() * 12) + 1 + "h ago"
  }));

  return {
    hero: {
      headline: getRandomElement(bank.heroHeadlines),
      subtitle: getRandomElement(bank.heroSubtitles),
      image: getRandomElement(bank.heroImages)
    },
    trending: getRandomElements(bank.trendingTitles, 5),
    articles
  };
}
