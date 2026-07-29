import { supabase } from '../lib/supabase';

export interface UserTrustProfile {
  userId: string;
  trustScore: number;
  isTrusted: boolean;
  autoApprovalEnabled: boolean;
}

const IN_MEMORY_TRUST_STORE: Map<string, UserTrustProfile> = new Map();

export async function getUserTrustProfile(userId: string): Promise<UserTrustProfile> {
  if (IN_MEMORY_TRUST_STORE.has(userId)) {
    return IN_MEMORY_TRUST_STORE.get(userId)!;
  }

  try {
    const { data } = await supabase
      .from('contributors')
      .select('trust_score, verified')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      const profile: UserTrustProfile = {
        userId,
        trustScore: data.trust_score,
        isTrusted: data.verified || data.trust_score >= 50,
        autoApprovalEnabled: data.verified || data.trust_score >= 50,
      };
      IN_MEMORY_TRUST_STORE.set(userId, profile);
      return profile;
    }
  } catch (err) {
    void err;
  }

  const defaultProfile: UserTrustProfile = {
    userId,
    trustScore: 10,
    isTrusted: false,
    autoApprovalEnabled: false,
  };
  IN_MEMORY_TRUST_STORE.set(userId, defaultProfile);
  return defaultProfile;
}

export async function incrementTrustScore(userId: string, points: number): Promise<UserTrustProfile> {
  const current = await getUserTrustProfile(userId);
  const updated: UserTrustProfile = {
    ...current,
    trustScore: current.trustScore + points,
    isTrusted: current.isTrusted || current.trustScore + points >= 50,
    autoApprovalEnabled: current.autoApprovalEnabled || current.trustScore + points >= 50,
  };

  IN_MEMORY_TRUST_STORE.set(userId, updated);
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
    autoApprovalEnabled: isTrusted,
  };

  IN_MEMORY_TRUST_STORE.set(userId, updated);
  return updated;
}

export async function evaluateAutoApproval(userId: string): Promise<boolean> {
  const profile = await getUserTrustProfile(userId);
  return profile.autoApprovalEnabled;
}
