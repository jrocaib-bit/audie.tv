import type { AuthPort, DataPorts, LibraryPort, ListeningProgressRow, Profile, Session, SubscriptionStatus } from "./types";

export function createMemoryPorts(session: Session = null): DataPorts & {
  seedProfile(profile: Profile): void;
  seedSubscription(status: SubscriptionStatus): void;
} {
  const profiles = new Map<string, Profile>();
  const progress = new Map<string, ListeningProgressRow>();
  const days = new Set<string>();
  const subscriptions = new Map<string, SubscriptionStatus>();

  const auth: AuthPort = {
    async getSession() {
      return session;
    },
  };

  const library: LibraryPort = {
    async getProfile(userId) {
      return profiles.get(userId) ?? null;
    },
    async getProgress(userId) {
      return [...progress.values()].filter((row) => row.userId === userId);
    },
    async saveProgress(row) {
      progress.set(`${row.userId}:${row.episodeId}`, row);
    },
    async getListeningDays(userId) {
      return [...days]
        .filter((key) => key.startsWith(`${userId}:`))
        .map((key) => key.slice(userId.length + 1))
        .sort();
    },
    async recordListeningDay(userId, day) {
      days.add(`${userId}:${day}`);
    },
    async getSubscription(userId) {
      return subscriptions.get(userId) ?? null;
    },
  };

  return {
    auth,
    library,
    seedProfile(profile) {
      profiles.set(profile.id, profile);
    },
    seedSubscription(status) {
      subscriptions.set(status.userId, status);
    },
  };
}
