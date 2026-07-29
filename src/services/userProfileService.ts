import { getUserTrustProfile, type UserTrustProfile } from './trustService';

export interface UserDetailedProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'admin' | 'editor' | 'user';
  specialization?: string;
  experienceYears?: number;
  companyName?: string;
  institutionName?: string;
  bio?: string;
  createdAt: string;
  trustProfile: UserTrustProfile;
}

const IN_MEMORY_DETAILED_PROFILES: Map<string, UserDetailedProfile> = new Map();

export async function getUserDetailedProfile(userId: string, email?: string, fullName?: string, role: 'admin' | 'editor' | 'user' = 'user'): Promise<UserDetailedProfile> {
  if (IN_MEMORY_DETAILED_PROFILES.has(userId)) {
    return IN_MEMORY_DETAILED_PROFILES.get(userId)!;
  }

  const trustProfile = await getUserTrustProfile(userId);

  const profile: UserDetailedProfile = {
    id: userId,
    email: email || 'felhasznalo@epitotudas.hu',
    fullName: fullName || 'Szakmai Felhasználó',
    role,
    specialization: role === 'admin' ? 'Platform Kezelő' : role === 'editor' ? 'Magasépítés & Szerkezetépítés' : 'Építőipari Szakember',
    experienceYears: role === 'admin' ? 10 : 5,
    companyName: 'ÉpítőTudás Partner Kft.',
    institutionName: 'BME Építőmérnöki Kar',
    bio: 'Elhivatott építőipari szakember és a hazai tudásmegosztás aktív támogatója.',
    createdAt: new Date().toISOString(),
    trustProfile,
  };

  IN_MEMORY_DETAILED_PROFILES.set(userId, profile);
  return profile;
}

export async function updateUserDetailedProfile(
  userId: string,
  payload: Partial<UserDetailedProfile>
): Promise<UserDetailedProfile> {
  const current = await getUserDetailedProfile(userId);
  const updated: UserDetailedProfile = {
    ...current,
    ...payload,
  };

  IN_MEMORY_DETAILED_PROFILES.set(userId, updated);
  return updated;
}
