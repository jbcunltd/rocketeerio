import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

try {
  console.log("Starting final USD pricing migration...");

  // Delete old plans
  await sql.unsafe(`DELETE FROM "subscription_plans"`);
  console.log("OK: Deleted old plans");

  // Insert final USD plans
  const plans = [
    {
      name: "Free",
      slug: "free",
      price: "0.00",
      currency: "USD",
      interval: "monthly",
      features: JSON.stringify([
        "100 active leads",
        "50 AI conversations/mo",
        "1 Facebook Page",
        "1 seat",
        "Rocketeer branding on messages",
        "Basic AI auto-reply",
        "1 pre-built qualification flow",
        "Simple lead inbox",
        "Basic analytics"
      ]),
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Growth",
      slug: "growth",
      price: "29.00",
      currency: "USD",
      interval: "monthly",
      features: JSON.stringify([
        "1,000 active leads",
        "500 AI conversations/mo",
        "1 Facebook Page",
        "2 seats",
        "No Rocketeer branding",
        "Unlimited custom flows",
        "AI lead scoring",
        "Conversion-push CTAs",
        "CRM-style pipeline",
        "Zapier/Sheets integration",
        "Monthly analytics report",
        "Overage: $5/100 leads, $3/100 conversations"
      ]),
      sortOrder: 2,
      isActive: true,
    },
    {
      name: "Pro",
      slug: "pro",
      price: "69.00",
      currency: "USD",
      interval: "monthly",
      features: JSON.stringify([
        "5,000 active leads",
        "2,500 AI conversations/mo",
        "3 Facebook Pages",
        "5 seats",
        "Custom AI persona/voice",
        "Follow-up sequences",
        "Priority lead routing",
        "Webhook + API access",
        "A/B testing",
        "Advanced analytics dashboard",
        "Overage: $4/100 leads, $2.50/100 conversations"
      ]),
      sortOrder: 3,
      isActive: true,
    },
    {
      name: "Scale",
      slug: "scale",
      price: "149.00",
      currency: "USD",
      interval: "monthly",
      features: JSON.stringify([
        "20,000 active leads",
        "10,000 AI conversations/mo",
        "10 Facebook Pages",
        "Unlimited seats",
        "White-label option",
        "Client reporting",
        "Dedicated onboarding call",
        "Slack/chat support",
        "4-hour SLA",
        "Early access to new features",
        "Overage: $3/100 leads, $2/100 conversations"
      ]),
      sortOrder: 4,
      isActive: true,
    },
    {
      name: "Custom",
      slug: "custom",
      price: "0.00",
      currency: "USD",
      interval: "monthly",
      features: JSON.stringify([
        "Unlimited everything",
        "Custom AI model fine-tuning",
        "Dedicated Customer Success Manager",
        "SSO/SAML",
        "Custom SLA",
        "Contact sales for pricing"
      ]),
      sortOrder: 5,
      isActive: true,
    }
  ];

  for (const plan of plans) {
    await sql.unsafe(
      `INSERT INTO "subscription_plans" ("name", "slug", "price", "currency", "interval", "features", "sortOrder", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
      [plan.name, plan.slug, plan.price, plan.currency, plan.interval, plan.features, plan.sortOrder, plan.isActive]
    );
    console.log(`OK: Inserted ${plan.name} plan`);
  }

  console.log("✅ Final USD pricing migration complete!");
} catch (err) {
  console.error("❌ Migration failed:", err);
  process.exit(1);
} finally {
  await sql.end();
}
