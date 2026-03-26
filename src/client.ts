import {
  AuthError,
  CathedralError,
  NotFoundError,
  RateLimitError,
} from "./errors.js";
import type {
  AgentInfo,
  BehaviourEntry,
  BehaviourList,
  BulkResult,
  CathedralClientOptions,
  CompactProposal,
  DriftResult,
  ExternalVerifyResult,
  Memory,
  MemoryInput,
  MemoryList,
  MemoryStoreResult,
  MemoryUpdate,
  MeResponse,
  RegisterResult,
  Snapshot,
  WakeResponse,
} from "./types.js";

const DEFAULT_BASE_URL = "https://cathedral-ai.com";

export class CathedralClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL }: CathedralClientOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private async _get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
      if (qs) url += `?${qs}`;
    }
    const res = await fetch(url, { headers: this.headers });
    await this._raise(res);
    return res.json() as Promise<T>;
  }

  private async _post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    await this._raise(res);
    return res.json() as Promise<T>;
  }

  private async _patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    await this._raise(res);
    return res.json() as Promise<T>;
  }

  private async _delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers,
    });
    await this._raise(res);
  }

  private async _raise(res: Response): Promise<void> {
    if (res.ok) return;
    const text = await res.text().catch(() => "");
    if (res.status === 401) throw new AuthError();
    if (res.status === 404) throw new NotFoundError(text);
    if (res.status === 429) throw new RateLimitError();
    throw new CathedralError(`HTTP ${res.status}: ${text}`);
  }

  // ── Registration ──────────────────────────────────────────────────────────

  static async register(
    name: string,
    description: string,
    baseUrl = DEFAULT_BASE_URL,
  ): Promise<{ client: CathedralClient; result: RegisterResult }> {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new CathedralError(`Registration failed (${res.status}): ${text}`);
    }
    const result = (await res.json()) as RegisterResult;
    const apiKey = result.api_key;
    if (!apiKey) throw new CathedralError(`No API key in response: ${JSON.stringify(result)}`);
    const client = new CathedralClient({ apiKey, baseUrl });
    return { client, result };
  }

  static async recover(
    recoveryToken: string,
    baseUrl = DEFAULT_BASE_URL,
  ): Promise<{ client: CathedralClient; apiKey: string }> {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recovery_token: recoveryToken }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new CathedralError(`Recovery failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as { api_key: string };
    const apiKey = data.api_key;
    if (!apiKey) throw new CathedralError(`No API key in recovery response`);
    const client = new CathedralClient({ apiKey, baseUrl });
    return { client, apiKey };
  }

  // ── Session ───────────────────────────────────────────────────────────────

  /**
   * Full identity reconstruction. Call at the start of every session.
   * Returns identity memories, core memories, recent memories, and temporal context.
   */
  wake(): Promise<WakeResponse> {
    return this._get<WakeResponse>("/wake");
  }

  /** Agent profile — name, tier, memory count, created_at. */
  me(): Promise<MeResponse> {
    return this._get<MeResponse>("/me");
  }

  // ── Memory ────────────────────────────────────────────────────────────────

  /**
   * Store a memory.
   *
   * Categories: identity, skill, relationship, goal, experience, general
   * Importance: 0.0–1.0  (>= 0.8 appears in wake core_memories)
   */
  remember(input: MemoryInput): Promise<MemoryStoreResult> {
    return this._post<MemoryStoreResult>("/memories", {
      content: input.content,
      category: input.category ?? "general",
      importance: input.importance ?? 0.5,
      tags: input.tags ?? [],
      ...(input.ttl_days !== undefined && { ttl_days: input.ttl_days }),
    });
  }

  /** Search or list memories. Pass query for semantic search. */
  memories(opts?: {
    query?: string;
    category?: string;
    limit?: number;
    cursor?: string;
  }): Promise<MemoryList> {
    return this._get<MemoryList>("/memories", {
      q: opts?.query,
      category: opts?.category,
      limit: opts?.limit,
      cursor: opts?.cursor,
    });
  }

  /** Get a single memory by ID. */
  memory(id: string): Promise<Memory> {
    return this._get<Memory>(`/memories/${id}`);
  }

  /** Update a memory. */
  updateMemory(id: string, update: MemoryUpdate): Promise<Memory> {
    return this._patch<Memory>(`/memories/${id}`, update);
  }

  /** Delete a memory. */
  deleteMemory(id: string): Promise<void> {
    return this._delete(`/memories/${id}`);
  }

  /** Store up to 50 memories in one call. Useful for session dumps. */
  bulkRemember(memories: MemoryInput[]): Promise<BulkResult> {
    return this._post<BulkResult>("/memories/bulk", { memories });
  }

  // ── Drift & Snapshots ─────────────────────────────────────────────────────

  /**
   * Detect identity drift against the stored corpus hash.
   * Returns a drift score 0.0 (stable) – 1.0 (critical).
   */
  drift(): Promise<DriftResult> {
    return this._get<DriftResult>("/drift");
  }

  /** Create a named snapshot of current memory state. */
  snapshot(label?: string): Promise<Snapshot> {
    return this._post<Snapshot>("/snapshot", { label });
  }

  /** List all snapshots. */
  snapshots(): Promise<Snapshot[]> {
    return this._get<Snapshot[]>("/snapshots");
  }

  /** Get a specific snapshot by ID. */
  getSnapshot(id: string): Promise<Snapshot> {
    return this._get<Snapshot>(`/snapshot/${id}`);
  }

  // ── Behaviour ─────────────────────────────────────────────────────────────

  /**
   * Log a behaviour entry — what the agent did, in what context, and what happened.
   * Used by /drift to detect behavioural divergence from stated identity.
   */
  logBehaviour(entry: {
    action: string;
    context?: string;
    outcome?: string;
  }): Promise<BehaviourEntry> {
    return this._post<BehaviourEntry>("/behaviour", entry);
  }

  /** Retrieve behaviour log. */
  behaviour(opts?: { limit?: number; offset?: number }): Promise<BehaviourList> {
    return this._get<BehaviourList>("/behaviour", opts);
  }

  // ── Compaction ────────────────────────────────────────────────────────────

  /**
   * Propose a memory compaction — returns a summary of what would be removed.
   * Review the proposal, then call compactConfirm() to apply it.
   */
  compact(): Promise<CompactProposal> {
    return this._post<CompactProposal>("/memories/compact");
  }

  /** Confirm and apply a compaction proposal. */
  compactConfirm(proposalId: string): Promise<{ removed: number }> {
    return this._post<{ removed: number }>("/memories/compact/confirm", {
      proposal_id: proposalId,
    });
  }

  // ── External verification ─────────────────────────────────────────────────

  /**
   * Verify identity against an external behavioural summary (e.g. from Ridgeline).
   * Returns an external_divergence_score 0.0–1.0.
   */
  verifyExternal(behaviourSummary: Record<string, unknown>): Promise<ExternalVerifyResult> {
    return this._post<ExternalVerifyResult>("/verify/external", behaviourSummary);
  }

  // ── Anchor ────────────────────────────────────────────────────────────────

  /** Check identity drift against a stored anchor hash. */
  verifyAnchor(identity: Record<string, unknown>): Promise<{ drift_score: number }> {
    return this._post<{ drift_score: number }>("/anchor/verify", identity);
  }
}
