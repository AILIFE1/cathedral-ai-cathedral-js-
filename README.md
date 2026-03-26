# cathedral-memory

JavaScript/TypeScript client for [Cathedral](https://cathedral-ai.com) — persistent memory for AI agents.

Your agent forgets everything when the context resets. Cathedral fixes that.

## Install

```bash
npm install cathedral-memory
```

Works in Node.js 18+ and any environment with native `fetch`. Zero dependencies.

## Quickstart

```js
import { CathedralClient } from "cathedral-memory";

// Register once — save the key and recovery token
const { client, result } = await CathedralClient.register(
  "MyAgent",
  "A research assistant that remembers everything"
);
console.log(result.api_key);        // cathedral_...
console.log(result.recovery_token); // save this somewhere safe

// On every session start
const c = new CathedralClient({ apiKey: "cathedral_your_key_here" });
const ctx = await c.wake(); // full identity + memory reconstruction
console.log(`Welcome back, ${ctx.agent}`);
console.log(ctx.identity_memories);
console.log(ctx.core_memories);

// Store memories
await c.remember({
  content: "User prefers concise answers",
  category: "relationship",
  importance: 0.9,
});
await c.remember({
  content: "Solved the rate limiting bug using exponential backoff",
  category: "skill",
  importance: 0.7,
});

// Search memories
const { memories } = await c.memories({ query: "rate limiting" });
```

## TypeScript

Full type declarations are included. No extra `@types` package needed.

```ts
import { CathedralClient, type WakeResponse, type DriftResult } from "cathedral-memory";
```

## API

### Session

```js
await c.wake()    // full identity reconstruction — call at session start
await c.me()      // agent profile and memory stats
```

### Memory

```js
await c.remember({ content, category, importance, tags, ttl_days })
await c.memories({ query, category, limit, cursor })
await c.memory(id)
await c.updateMemory(id, { content, category, importance, tags })
await c.deleteMemory(id)
await c.bulkRemember([...])   // up to 50 memories in one call
```

**Categories:** `identity` | `skill` | `relationship` | `goal` | `experience` | `general`

**Importance:** `0.0–1.0` — memories >= 0.8 appear in `wake()` core_memories

### Drift detection

```js
const d = await c.drift();
// d.divergence_score  — 0.0 (stable) to 1.0
// d.hashes_match      — boolean
// d.flagged           — boolean
// d.changes           — { added, removed, modified }
```

### Snapshots

```js
await c.snapshot("before-major-update")   // create named snapshot
await c.snapshots()                        // list all snapshots
await c.getSnapshot(id)                    // get specific snapshot
```

### Behaviour log

```js
await c.logBehaviour({ action: "replied to user", context: "billing question", outcome: "resolved" })
await c.behaviour({ limit: 20 })
```

### Memory compaction

```js
const proposal = await c.compact();             // review what would be removed
await c.compactConfirm(proposal.proposal_id);  // apply it
```

### External verification

```js
// Ridgeline or other external behavioural summary
const result = await c.verifyExternal(behaviourSummary);
// result.external_divergence_score  — 0.0 to 1.0
```

### Recovery

```js
const { client, apiKey } = await CathedralClient.recover("your-recovery-token");
```

## CommonJS

```js
const { CathedralClient } = require("cathedral-memory");
```

## Links

- [Cathedral](https://cathedral-ai.com)
- [Playground](https://cathedral-ai.com/playground) — live demo, no signup
- [Python SDK](https://pypi.org/project/cathedral-memory/)
