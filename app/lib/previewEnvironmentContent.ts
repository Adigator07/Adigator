import type { GeneratedEnvironment } from "@/app/lib/preview-engine/types";

export type EditorialArticle = {
  category: string;
  categoryColor: string;
  headline: string;
  byline: string;
  excerpt: string;
  readTime: string;
};

export type SocialFeedPost = {
  avatar: string;
  username: string;
  handle: string;
  verified: boolean;
  time: string;
  content: string;
  image: string | null;
  likes: string;
  comments: string;
  shares: string;
  tag: string;
};

export type NativePromoCopy = {
  headline: string;
  description: string;
  cta: string;
  sponsorLabel: string;
};

const CATEGORY_COLORS = [
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
];

const AVATAR_GRADIENTS = [
  "bg-gradient-to-br from-violet-400 to-indigo-500",
  "bg-gradient-to-br from-cyan-400 to-blue-500",
  "bg-gradient-to-br from-emerald-400 to-teal-500",
  "bg-gradient-to-br from-amber-400 to-orange-500",
  "bg-gradient-to-br from-pink-400 to-rose-500",
];

export function labelVertical(vertical: string): string {
  if (!vertical || vertical === "general" || vertical === "unknown") return "Industry";
  return vertical
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function landing(content: GeneratedEnvironment) {
  return content.landingPage ?? null;
}

function defaultArticles(vertical: string, publisherName: string): EditorialArticle[] {
  const label = labelVertical(vertical);
  return [
    {
      category: label.toUpperCase(),
      categoryColor: CATEGORY_COLORS[0],
      headline: `Latest ${label.toLowerCase()} insights for decision-makers`,
      byline: `${publisherName} · ${label} Desk`,
      excerpt: `Coverage aligned to your ${label.toLowerCase()} campaign focus and audience intent.`,
      readTime: "4 min read",
    },
    {
      category: "GUIDE",
      categoryColor: CATEGORY_COLORS[1],
      headline: `What buyers in ${label.toLowerCase()} evaluate before they convert`,
      byline: `${publisherName} · Research`,
      excerpt: "Practical guidance shaped by current market expectations and offer clarity.",
      readTime: "5 min read",
    },
    {
      category: "TREND",
      categoryColor: CATEGORY_COLORS[2],
      headline: `${label} brands sharpen messaging for higher-intent audiences`,
      byline: `${publisherName} · Market Watch`,
      excerpt: "Editorial context designed to surround your display placement naturally.",
      readTime: "3 min read",
    },
  ];
}

export function deriveEditorialArticles(
  content: GeneratedEnvironment,
  vertical: string,
): EditorialArticle[] {
  const lp = landing(content);
  const publisherName = content.publisherName || `${labelVertical(vertical)} Journal`;
  if (!lp) return defaultArticles(vertical, publisherName);

  const articles: EditorialArticle[] = [
    {
      category: labelVertical(vertical).toUpperCase(),
      categoryColor: CATEGORY_COLORS[0],
      headline: lp.hero.headline,
      byline: `${publisherName} · ${labelVertical(vertical)} Desk`,
      excerpt: lp.hero.subheadline,
      readTime: "4 min read",
    },
  ];

  lp.valueProposition.features.forEach((feature, index) => {
    articles.push({
      category: index === 0 ? "FEATURE" : "INSIGHT",
      categoryColor: CATEGORY_COLORS[(index + 1) % CATEGORY_COLORS.length],
      headline: feature.title,
      byline: `${publisherName} · Contributors`,
      excerpt: feature.description,
      readTime: `${4 + index} min read`,
    });
  });

  if (lp.offerPromotion.headline) {
    articles.push({
      category: "MARKET",
      categoryColor: CATEGORY_COLORS[3],
      headline: lp.offerPromotion.headline,
      byline: `${publisherName} · Business`,
      excerpt: lp.offerPromotion.explanation,
      readTime: "3 min read",
    });
  }

  if (articles.length < 3) {
    return [...articles, ...defaultArticles(vertical, publisherName)].slice(0, 4);
  }

  return articles.slice(0, 4);
}

export function deriveTrendingItems(content: GeneratedEnvironment, vertical: string): string[] {
  const lp = landing(content);
  const items = uniqueContentStrings([
    ...(lp?.benefits || []),
    ...(lp?.hero.trustIndicators || []),
    ...(lp?.howItWorks?.map((step) => step.title) || []),
    ...(lp?.valueProposition.features.map((feature) => feature.title) || []),
  ]);

  if (items.length >= 3) return items.slice(0, 6);

  const label = labelVertical(vertical);
  return [
    `${label} buyers compare top offers`,
    `New ${label.toLowerCase()} market outlook`,
    "Campaign messaging best practices",
    "Trust signals that improve conversion",
    "How brands match creative to landing pages",
    `${label} category roundup`,
  ].slice(0, 6);
}

function uniqueContentStrings(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const text = String(item || "").trim();
    if (!text) return false;
    const key = text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function deriveSocialFeedPosts(
  content: GeneratedEnvironment,
  vertical: string,
): SocialFeedPost[] {
  const lp = landing(content);
  const publisherSlug = (content.publisherName || labelVertical(vertical))
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 14) || "brand";

  if (!lp) {
    return defaultArticles(vertical, content.publisherName || "Publisher").map((article, index) => ({
      avatar: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
      username: content.publisherName || `${labelVertical(vertical)} Official`,
      handle: `@${publisherSlug}`,
      verified: index === 0,
      time: index === 0 ? "Just now" : `${index * 18}m ago`,
      content: `${article.headline} — ${article.excerpt}`,
      image: index === 1 ? "bg-gradient-to-br from-slate-200 to-slate-300" : null,
      likes: `${1.2 + index}K`,
      comments: `${120 + index * 40}`,
      shares: `${240 + index * 60}`,
      tag: `#${labelVertical(vertical).replace(/\s/g, "")}`,
    }));
  }

  const posts: SocialFeedPost[] = [
    {
      avatar: AVATAR_GRADIENTS[0],
      username: content.publisherName || `${labelVertical(vertical)} Official`,
      handle: `@${publisherSlug}`,
      verified: true,
      time: "Just now",
      content: `${lp.hero.headline} — ${lp.hero.subheadline}`,
      image: null,
      likes: "3.1K",
      comments: "214",
      shares: "518",
      tag: `#${labelVertical(vertical).replace(/\s/g, "")}`,
    },
  ];

  lp.socialProof.testimonials.forEach((testimonial, index) => {
    posts.push({
      avatar: AVATAR_GRADIENTS[(index + 1) % AVATAR_GRADIENTS.length],
      username: testimonial.name,
      handle: `@${testimonial.name.split(" ")[0]?.toLowerCase() || "voice"}`,
      verified: false,
      time: `${(index + 1) * 14}m ago`,
      content: testimonial.quote,
      image: index % 2 === 0 ? "bg-gradient-to-br from-slate-200 to-slate-300" : null,
      likes: `${1.4 + index * 0.6}K`,
      comments: `${90 + index * 35}`,
      shares: `${180 + index * 50}`,
      tag: `#${labelVertical(vertical).replace(/\s/g, "")}Insights`,
    });
  });

  lp.howItWorks.forEach((step, index) => {
    if (posts.length >= 4) return;
    posts.push({
      avatar: AVATAR_GRADIENTS[(index + 2) % AVATAR_GRADIENTS.length],
      username: `${labelVertical(vertical)} Guide`,
      handle: `@${publisherSlug}tips`,
      verified: true,
      time: `${(index + 2) * 22}m ago`,
      content: `${step.title}: ${step.description}`,
      image: null,
      likes: `${0.9 + index * 0.4}K`,
      comments: `${60 + index * 20}`,
      shares: `${110 + index * 30}`,
      tag: `#HowItWorks`,
    });
  });

  return posts.slice(0, 4);
}

export function deriveNativePromo(
  content: GeneratedEnvironment,
  brandName = "",
): NativePromoCopy {
  const lp = landing(content);
  const sponsor = brandName || content.publisherName || "Sponsored";

  return {
    headline: lp?.hero.headline || lp?.offerPromotion.headline || "Recommended for you",
    description: lp?.hero.subheadline || lp?.offerPromotion.explanation || "",
    cta: lp?.hero.primaryCta || lp?.offerPromotion.ctaText || "Learn More",
    sponsorLabel: sponsor,
  };
}

export function deriveBreakingTicker(content: GeneratedEnvironment, vertical: string): string {
  const items = deriveTrendingItems(content, vertical);
  return items.join(" · ");
}

export function deriveSuggestedAccounts(content: GeneratedEnvironment, vertical: string) {
  const lp = landing(content);
  const testimonials = lp?.socialProof.testimonials || [];
  if (testimonials.length) {
    return testimonials.slice(0, 3).map((item, index) => ({
      name: item.name,
      handle: `@${item.name.split(" ")[0]?.toLowerCase() || "expert"}`,
      avatar: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
      followers: item.role || labelVertical(vertical),
    }));
  }

  const label = labelVertical(vertical);
  return [
    { name: `${label} Insights`, handle: `@${label.replace(/\s/g, "").toLowerCase()}`, avatar: AVATAR_GRADIENTS[0], followers: "Expert voices" },
    { name: `${label} Reviews`, handle: `@${label.replace(/\s/g, "").toLowerCase()}reviews`, avatar: AVATAR_GRADIENTS[1], followers: "Buyer guides" },
    { name: `${label} Trends`, handle: `@${label.replace(/\s/g, "").toLowerCase()}trends`, avatar: AVATAR_GRADIENTS[2], followers: "Market updates" },
  ];
}
