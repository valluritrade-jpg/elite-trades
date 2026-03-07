/**
 * Elite Trades LLC — Automated X Post Engine
 * Reads asset config from config/assets.json (managed via Admin Dashboard)
 * Runs via GitHub Actions on a daily/weekly schedule
 */

import { TwitterApi } from "twitter-api-v2";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, "..", "config", "assets.json");

const POST_TYPE = process.env.POST_TYPE || "daily";

// ─── Load Admin Config ────────────────────────────────────────────────────────

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.warn("⚠ No config/assets.json found — using built-in defaults.");
    console.warn("  → Go to your Admin Dashboard, configure assets, export & commit assets.json\n");
    return {
      daily: [
        { symbol: "BTC/USD", name: "Bitcoin",     type: "Crypto" },
        { symbol: "ETH/USD", name: "Ethereum",    type: "Crypto" },
        { symbol: "SPY",     name: "S&P 500 ETF", type: "ETF"    },
        { symbol: "GOLD",    name: "Gold",        type: "Commodity" },
        { symbol: "NVDA",    name: "NVIDIA",      type: "Stock"  },
      ],
      weekly: [
        { symbol: "BTC/USD", name: "Bitcoin",     type: "Crypto" },
        { symbol: "ETH/USD", name: "Ethereum",    type: "Crypto" },
        { symbol: "SPY",     name: "S&P 500 ETF", type: "ETF"    },
        { symbol: "GOLD",    name: "Gold",        type: "Commodity" },
        { symbol: "EUR/USD", name: "Euro/Dollar", type: "Forex"  },
      ],
    };
  }

  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    const cfg = JSON.parse(raw);

    console.log(`✅ Loaded admin config from config/assets.json`);
    if (cfg.lastUpdated) console.log(`   Last updated: ${new Date(cfg.lastUpdated).toLocaleString()}`);
    if (cfg.updatedBy)   console.log(`   Updated by:   ${cfg.updatedBy}`);
    console.log(`   Daily assets:  ${cfg.daily?.length ?? 0}`);
    console.log(`   Weekly assets: ${cfg.weekly?.length ?? 0}\n`);

    return cfg;
  } catch (err) {
    throw new Error(`Failed to parse config/assets.json: ${err.message}`);
  }
}

// ─── Asset Selection ──────────────────────────────────────────────────────────

function pickDailyAsset(assets) {
  if (!assets || assets.length === 0) throw new Error("No active daily assets configured.");
  // Rotate deterministically by day-of-year
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const asset = assets[dayOfYear % assets.length];
  console.log(`🎯 Today's pick: ${asset.symbol} — ${asset.name} (slot ${(dayOfYear % assets.length) + 1}/${assets.length})`);
  return asset;
}

// ─── Claude API ───────────────────────────────────────────────────────────────

async function callClaude(prompt, maxTokens = 600) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.map((b) => b.text || "").join("") || "";
}

// ─── Post Generators ──────────────────────────────────────────────────────────

async function generateDailyPost(asset) {
  console.log(`📊 Generating daily analysis for ${asset.symbol}...`);
  const prompt = `You are the social media voice for Elite Trades LLC, an AI trading education company.
Write a SHORT engaging X (Twitter) post — DAILY ASSET SPOTLIGHT.

Asset: ${asset.symbol} (${asset.name}) — ${asset.type}
Date: ${new Date().toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric", year:"numeric" })}

Rules:
- Under 250 characters (we add hashtags separately)
- Lead with asset symbol + bias emoji: 📈 Bullish / 📉 Bearish / ➡️ Neutral
- One key educational insight (trend, level, or pattern)
- End with a question or takeaway for followers
- No buy/sell calls. Educational tone. No hype.
- Return ONLY the post text.`;

  const text = (await callClaude(prompt, 280)).trim().replace(/^["']|["']$/g, "");
  const tags = buildHashtags(asset);
  return truncate(text, 250) + "\n\n" + tags;
}

async function generateWeeklyThread(assets) {
  console.log("📅 Generating weekly thread...");
  const week = getWeekRange();

  const hookPrompt = `Write an engaging OPENING tweet for Elite Trades LLC's weekly market thread (${week}).
This kicks off a ${assets.length + 2}-tweet thread.
Rules: Under 230 chars. Hook the reader. Include 🧵. Professional, educational.
Return ONLY the tweet text.`;

  const hookTweet = (await callClaude(hookPrompt, 200)).trim().replace(/^["']|["']$/g, "");
  const assetTweets = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const prompt = `Write a SHORT weekly market education tweet for Elite Trades LLC.
Asset: ${asset.symbol} (${asset.name}) — ${asset.type}
Week: ${week}
Rules: Under 240 chars. Format: [${i+1}/${assets.length}] $SYMBOL | [Bias emoji] [Bias word] then 1-2 educational observations. End with a takeaway.
No buy/sell. Return ONLY the tweet text.`;

    const tweet = (await callClaude(prompt, 250)).trim().replace(/^["']|["']$/g, "");
    assetTweets.push(tweet);
    if (i < assets.length - 1) await sleep(1000);
  }

  const closingTweet =
    `📚 That's our weekly wrap for ${week}!\n\n` +
    `All analysis is educational only — not financial advice.\n\n` +
    `🔗 Run your own AI analysis FREE → elitetrades.com\n\n` +
    `⚠️ #NotFinancialAdvice #EliteTrades #TradingEducation`;

  return [
    hookTweet + "\n\n🧵 Weekly Market Thread ↓",
    ...assetTweets,
    closingTweet,
  ];
}

// ─── X Poster ─────────────────────────────────────────────────────────────────

async function postToX(content) {
  const client = new TwitterApi({
    appKey:      process.env.X_API_KEY,
    appSecret:   process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });
  const rw = client.readWrite;

  if (Array.isArray(content)) {
    console.log(`🐦 Posting thread — ${content.length} tweets...`);
    let lastId = null;
    for (let i = 0; i < content.length; i++) {
      const params = { text: content[i] };
      if (lastId) params.reply = { in_reply_to_tweet_id: lastId };
      const r = await rw.v2.tweet(params);
      lastId = r.data.id;
      console.log(`  ✓ Tweet ${i + 1}/${content.length} posted (id: ${lastId})`);
      if (i < content.length - 1) await sleep(2000);
    }
  } else {
    console.log(`🐦 Posting single tweet...`);
    const r = await rw.v2.tweet({ text: content });
    console.log(`  ✓ Tweet posted (id: ${r.data.id})`);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function buildHashtags(asset) {
  const base = ["#NotFinancialAdvice", "#EliteTrades", "#TradingEducation"];
  const extra = {
    Crypto:    ["#Crypto"],
    Stock:     ["#Stocks"],
    ETF:       ["#ETF"],
    Forex:     ["#Forex"],
    Commodity: ["#Commodities"],
    Index:     ["#MarketWatch"],
  };
  return [...base, ...(extra[asset.type] || [])].slice(0, 4).join(" ");
}

function getWeekRange() {
  const now  = new Date();
  const mon  = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
  const fri  = new Date(mon); fri.setDate(mon.getDate() + 4);
  const fmt  = d => d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  return `${fmt(mon)} – ${fmt(fri)}`;
}

function truncate(str, max = 250) {
  return str.length <= max ? str : str.slice(0, max - 3) + "...";
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function validateEnv() {
  const required = ["ANTHROPIC_API_KEY","X_API_KEY","X_API_SECRET","X_ACCESS_TOKEN","X_ACCESS_TOKEN_SECRET"];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Elite Trades LLC — Auto Post Engine      ");
  console.log(`  Mode: ${POST_TYPE.toUpperCase()} | ${new Date().toDateString()}`);
  console.log("═══════════════════════════════════════════\n");

  validateEnv();
  const config = loadConfig();

  try {
    if (POST_TYPE === "weekly") {
      if (!config.weekly?.length) throw new Error("No active weekly assets. Configure them in the Admin Dashboard.");
      const thread = await generateWeeklyThread(config.weekly);
      console.log("\n📋 Thread preview:");
      thread.forEach((t, i) => console.log(`\n[${i+1}] ${t}\n`));
      await postToX(thread);
    } else {
      if (!config.daily?.length) throw new Error("No active daily assets. Configure them in the Admin Dashboard.");
      const asset = pickDailyAsset(config.daily);
      const post  = await generateDailyPost(asset);
      console.log("\n📋 Post preview:\n");
      console.log(post);
      console.log(`\n📏 Characters: ${post.length}/280`);
      await postToX(post);
    }
    console.log("\n✅ Done! Post is live on X.");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
}

main();
