// Quick smoke test — hits the real API
import { CathedralClient } from "./dist/index.js";

const API_KEY = "cathedral_d7e231f58b028e2ec3d916cc54202b696c8d991e3758fac9";

const c = new CathedralClient({ apiKey: API_KEY });

async function run() {
  console.log("1. wake()");
  const ctx = await c.wake();
  console.log(`   agent: ${ctx.agent}, memories: ${ctx.identity_memories.length} identity, ${ctx.core_memories?.length ?? 0} core`);

  console.log("2. remember()");
  const mem = await c.remember({
    content: "JS SDK smoke test — first memory stored via cathedral-memory npm package",
    category: "experience",
    importance: 0.6,
    tags: ["sdk", "js", "test"],
  });
  console.log(`   stored: ${mem.memory_id}, total now: ${mem.memory_count}`);

  console.log("3. memories()");
  const list = await c.memories({ query: "JS SDK", limit: 5 });
  console.log(`   found: ${list.memories.length}`);

  console.log("4. drift()");
  const d = await c.drift();
  console.log(`   score: ${d.divergence_score}, match: ${d.hashes_match}, flagged: ${d.flagged}`);

  console.log("5. me()");
  const me = await c.me();
  console.log(`   name: ${me.agent.name}, tier: ${me.agent.tier}, memories: ${me.memory_stats.total}`);

  console.log("\nAll good.");
}

run().catch(err => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
