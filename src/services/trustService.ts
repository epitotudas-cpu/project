import { supabase } from '../lib/supabase';

export interface UserTrustProfile {
  userId: string;
  trustScore: number;
  isTrusted: boolean;
  autoApprovalEnabled: boolean;
}

const STORAGE_KEY = 'epitotudas_trust_profiles_v1';
const IN_MEMORY_TRUST_STORE: Map<string, UserTrustProfile> = new Map();

function getStoredProfiles(): Record<string, UserTrustProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Hiba a bizalmi profilok betöltésekor:', err);
  }
  return {};
}

function saveStoredProfiles(profiles: Record<string, UserTrustProfile>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    window.dispatchEvent(new Event('trust-score-changed'));
  } catch (err) {
    console.error('Hiba a bizalmi profilok mentésekor:', err);
  }
}

export async function getUserTrustProfile(userId: string): Promise<UserTrustProfile> {
  // 1. Check in-memory store
  if (IN_MEMORY_TRUST_STORE.has(userId)) {
    return IN_MEMORY_TRUST_STORE.get(userId)!;
  }

  // 2. Check localStorage
  const storedMap = getStoredProfiles();
  if (storedMap[userId]) {
    const profile = storedMap[userId];
    profile.autoApprovalEnabled = profile.isTrusted || profile.trustScore >= 50;
    IN_MEMORY_TRUST_STORE.set(userId, profile);
    return profile;
  }

  // 3. Check Supabase database fallback
  try {
    const { data } = await supabase
      .from('contributors')
      .select('trust_score, verified')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      const trustScore = data.trust_score ?? 10;
      const isTrusted = data.verified || trustScore >= 50;
      const profile: UserTrustProfile = {
        userId,
        trustScore,
        isTrusted,
        autoApprovalEnabled: isTrusted || trustScore >= 50,
      };
      IN_MEMORY_TRUST_STORE.set(userId, profile);
      storedMap[userId] = profile;
      saveStoredProfiles(storedMap);
      return profile;
    }
  } catch (err) {
    void err;
  }

  // Default fallback for new users
  const defaultProfile: UserTrustProfile = {
    userId,
    trustScore: 10,
    isTrusted: false,
    autoApprovalEnabled: false,
  };
  IN_MEMORY_TRUST_STORE.set(userId, defaultProfile);
  storedMap[userId] = defaultProfile;
  saveStoredProfiles(storedMap);
  return defaultProfile;
}

export async function incrementTrustScore(userId: string, points: number): Promise<UserTrustProfile> {
  const current = await getUserTrustProfile(userId);
  const newScore = Math.max(0, current.trustScore + points);
  const updated: UserTrustProfile = {
    ...current,
    trustScore: newScore,
    isTrusted: current.isTrusted || newScore >= 50,
    autoApprovalEnabled: current.isTrusted || newScore >= 50,
  };

  IN_MEMORY_TRUST_STORE.set(userId, updated);
  const storedMap = getStoredProfiles();
  storedMap[userId] = updated;
  saveStoredProfiles(storedMap);
  return updated;
}

export async function setTrustScore(userId: string, newScore: number): Promise<UserTrustProfile> {
  const current = await getUserTrustProfile(userId);
  const clampedScore = Math.max(0, newScore);
  const isTrusted = current.isTrusted || clampedScore >= 50;
  const updated: UserTrustProfile = {
    ...current,
    trustScore: clampedScore,
    isTrusted,
    autoApprovalEnabled: isTrusted || clampedScore >= 50,
  };

  IN_MEMORY_TRUST_STORE.set(userId, updated);
  const storedMap = getStoredProfiles();
  storedMap[userId] = updated;
  saveStoredProfiles(storedMap);
  return updated;
}

export async function setTrustedContributorStatus(
  userId: string,
  isTrusted: boolean
): Promise<UserTrustProfile> {
  const current = await getUserTrustProfile(userId);
  const updated: UserTrustProfile = {
    ...current,
    isTrusted,
    autoApprovalEnabled: isTrusted || current.trustScore >= 50,
  };

  IN_MEMORY_TRUST_STORE.set(userId, updated);
  const storedMap = getStoredProfiles();
  storedMap[userId] = updated;
  saveStoredProfiles(storedMap);
  return updated;
}

export async function evaluateAutoApproval(userId: string): Promise<boolean> {
  const profile = await getUserTrustProfile(userId);
  return profile.autoApprovalEnabled;
}
