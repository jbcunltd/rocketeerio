export const SITE = {
  name: "Rocketeerio",
  url: "https://rocketeerio.com",
  tagline: "AI-Powered Facebook Lead Conversion System",
  email: "hello@rocketeerio.com",
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: string;
  category: string;
  keywords: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-facebook-leads-arent-converting",
    title: "Why Your Facebook Leads Aren't Converting (And How to Fix It)",
    description:
      "If your Facebook lead ads are filling your inbox but not your bank account, the problem usually isn't the leads. Here's exactly why they're going cold — and the seven fixes that turn them into customers.",
    date: "2026-04-22",
    readingTime: "9 min read",
    category: "Conversion",
    keywords: [
      "facebook leads not converting",
      "facebook lead ads conversion",
      "improve facebook lead quality",
    ],
  },
  {
    slug: "responding-to-leads-under-60-seconds",
    title: "The Magic of Responding to Leads in Under 60 Seconds",
    description:
      "There is a single number that predicts whether a Facebook lead becomes a customer: how long it takes you to reply. Here's the data, the psychology, and how to make 60-second responses your default.",
    date: "2026-04-15",
    readingTime: "8 min read",
    category: "Speed to Lead",
    keywords: [
      "respond to leads in 60 seconds",
      "speed to lead",
      "lead response time conversion",
    ],
  },
  {
    slug: "qualify-facebook-leads-without-lifting-a-finger",
    title: "How to Qualify Facebook Leads Without Lifting a Finger",
    description:
      "Most business owners burn hours every week on tire-kickers. Here's a practical, no-fluff system for qualifying Facebook leads automatically — so you only ever talk to people ready to buy.",
    date: "2026-04-08",
    readingTime: "8 min read",
    category: "Automation",
    keywords: [
      "qualify facebook leads",
      "messenger lead qualification",
      "auto reply facebook leads",
    ],
  },
  {
    slug: "facebook-lead-ads-vs-landing-pages",
    title: "Facebook Lead Ads vs. Landing Pages: Which Converts Better?",
    description:
      "Lead Ads or Landing Pages? It's the most common conversion question advertisers ask — and the honest answer depends on five variables. Here's how to pick the right one for your business.",
    date: "2026-04-01",
    readingTime: "10 min read",
    category: "Strategy",
    keywords: [
      "facebook lead ads vs landing pages",
      "facebook lead ads conversion",
      "facebook ads strategy",
    ],
  },
  {
    slug: "ultimate-guide-facebook-lead-automation-2025",
    title: "The Ultimate Guide to Facebook Lead Automation in 2025",
    description:
      "Everything you need to set up a Facebook lead automation system that actually closes deals — from instant replies to qualification flows to hot-lead alerts. Updated for 2025.",
    date: "2026-03-25",
    readingTime: "12 min read",
    category: "Guide",
    keywords: [
      "facebook lead automation",
      "facebook lead follow up automation",
      "automate facebook leads",
    ],
  },
];
