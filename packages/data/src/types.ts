export type Session = { userId: string } | null;

export type Profile = {
  id: string;
  displayName: string | null;
};

export type ListeningProgressRow = {
  userId: string;
  episodeId: string;
  positionSeconds: number;
  completed: boolean;
  updatedAt: string;
};

export type SubscriptionState = "none" | "pending" | "active" | "inactive";

export type SubscriptionStatus = {
  userId: string;
  status: SubscriptionState;
  updatedAt: string;
};

export interface AuthPort {
  getSession(): Promise<Session>;
}

export interface LibraryPort {
  getProfile(userId: string): Promise<Profile | null>;
  getProgress(userId: string): Promise<ListeningProgressRow[]>;
  saveProgress(row: ListeningProgressRow): Promise<void>;
  getListeningDays(userId: string): Promise<string[]>;
  recordListeningDay(userId: string, day: string): Promise<void>;
  getSubscription(userId: string): Promise<SubscriptionStatus | null>;
}

export interface DataPorts {
  auth: AuthPort;
  library: LibraryPort;
}
