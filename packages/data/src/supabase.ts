import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthPort, DataPorts, LibraryPort, ListeningProgressRow, Profile, SubscriptionState, SubscriptionStatus } from "./types";

type QueryError = { message: string } | null;
type QueryResult<T> = { data: T | null; error: QueryError };

export type SupabaseQuery = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<QueryResult<Record<string, unknown>>>;
        then<TResult>(onfulfilled: (value: QueryResult<Record<string, unknown>[]>) => TResult): Promise<TResult>;
      };
    };
    upsert(row: Record<string, unknown>): Promise<QueryResult<null>>;
  };
  auth: {
    getSession(): Promise<{ data: { session: { user: { id: string } } | null } }>;
  };
};

function exigir(error: QueryError): void {
  if (error) throw new Error(error.message);
}

function filaProgreso(row: Record<string, unknown>): ListeningProgressRow {
  return {
    userId: String(row.user_id),
    episodeId: String(row.episode_id),
    positionSeconds: Number(row.position_seconds),
    completed: Boolean(row.completed),
    updatedAt: String(row.updated_at),
  };
}

export function createSupabasePortsFromClient(client: SupabaseQuery): DataPorts {
  const auth: AuthPort = {
    async getSession() {
      const { data } = await client.auth.getSession();
      const userId = data.session?.user.id;
      return userId ? { userId } : null;
    },
  };

  const library: LibraryPort = {
    async getProfile(userId) {
      const { data, error } = await client.from("profiles").select("id, display_name").eq("id", userId).maybeSingle();
      exigir(error);
      if (!data) return null;
      const profile: Profile = { id: String(data.id), displayName: data.display_name == null ? null : String(data.display_name) };
      return profile;
    },
    async getProgress(userId) {
      const { data, error } = await client.from("listening_progress").select("user_id, episode_id, position_seconds, completed, updated_at").eq("user_id", userId);
      exigir(error);
      return (data ?? []).map(filaProgreso);
    },
    async saveProgress(row) {
      const { error } = await client.from("listening_progress").upsert({
        user_id: row.userId,
        episode_id: row.episodeId,
        position_seconds: row.positionSeconds,
        completed: row.completed,
        updated_at: row.updatedAt,
      });
      exigir(error);
    },
    async getListeningDays(userId) {
      const { data, error } = await client.from("listening_days").select("day").eq("user_id", userId);
      exigir(error);
      return (data ?? []).map((row) => String(row.day)).sort();
    },
    async recordListeningDay(userId, day) {
      const { error } = await client.from("listening_days").upsert({ user_id: userId, day });
      exigir(error);
    },
    async getSubscription(userId) {
      const { data, error } = await client.from("subscription_status").select("user_id, status, updated_at").eq("user_id", userId).maybeSingle();
      exigir(error);
      if (!data) return null;
      const status: SubscriptionStatus = {
        userId: String(data.user_id),
        status: String(data.status) as SubscriptionState,
        updatedAt: String(data.updated_at),
      };
      return status;
    },
  };

  return { auth, library };
}

export function createSupabasePorts(env: { url?: string | null; anonKey?: string | null }): DataPorts {
  const url = env.url?.trim() ?? "";
  const anonKey = env.anonKey?.trim() ?? "";
  if (!url || !anonKey) {
    throw new Error("Supabase no está configurado. No hay proyecto conectado.");
  }
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return createSupabasePortsFromClient(client as unknown as SupabaseQuery);
}

export type { SupabaseClient };
