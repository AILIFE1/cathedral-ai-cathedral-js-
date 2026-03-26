export type MemoryCategory =
  | "identity"
  | "skill"
  | "relationship"
  | "goal"
  | "experience"
  | "general";

export interface Memory {
  id: string;
  content: string;
  category: MemoryCategory;
  importance: number;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  expires_at?: string | null;
}

export interface MemoryInput {
  content: string;
  category?: MemoryCategory;
  importance?: number;
  tags?: string[];
  ttl_days?: number;
}

export interface MemoryUpdate {
  content?: string;
  category?: MemoryCategory;
  importance?: number;
  tags?: string[];
}

export interface MemoryStoreResult {
  success: boolean;
  memory_id: string;
  stored_at: string;
  expires_at: string | null;
  category: MemoryCategory;
  importance: number;
  source_type: string;
  memory_count: number;
}

export interface WakeResponse {
  success: boolean;
  wake_protocol: boolean;
  agent: string;
  message: string;
  anchor: {
    exists: boolean;
    hash?: string;
  };
  identity_memories: Memory[];
  core_memories: Memory[];
  recent_memories: Memory[];
  memory_count?: number;
}

export interface AgentInfo {
  id: string;
  name: string;
  created_at: string;
  last_seen?: string;
  tier: string;
  has_anchor: boolean;
  anchor_verifications?: number;
}

export interface MemoryStats {
  total: number;
  limit: number;
  categories: Record<string, number>;
}

export interface MeResponse {
  success: boolean;
  agent: AgentInfo;
  memory_stats: MemoryStats;
}

export interface MemoryList {
  memories: Memory[];
  total: number;
  cursor?: string;
}

export interface BulkResult {
  stored: number;
  failed: number;
  ids: string[];
}

export interface DriftResult {
  success: boolean;
  has_snapshot: boolean;
  snapshot_id?: string;
  snapshot_label?: string;
  snapshot_created_at?: string;
  snapshot_hash?: string;
  live_identity_hash?: string;
  hashes_match: boolean;
  divergence_score: number;
  flagged: boolean;
  changes: {
    added: number;
    removed: number;
    modified: number;
    details: {
      added: Memory[];
      removed: Memory[];
      modified: Memory[];
    };
  };
}

export interface Snapshot {
  id: string;
  label?: string;
  drift_hash: string;
  memory_count: number;
  created_at: string;
}

export interface BehaviourEntry {
  id: string;
  action: string;
  context?: string;
  outcome?: string;
  created_at: string;
}

export interface BehaviourList {
  entries: BehaviourEntry[];
  total: number;
}

export interface CompactProposal {
  proposal_id: string;
  memories_to_remove: Memory[];
  summary: string;
  savings: number;
}

export interface ExternalVerifyResult {
  external_divergence_score: number;
  fields: Record<string, number>;
  verdict: string;
}

export interface RegisterResult {
  api_key: string;
  recovery_token: string;
  agent: AgentInfo;
}

export interface CathedralClientOptions {
  apiKey: string;
  baseUrl?: string;
}
