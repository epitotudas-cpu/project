import { getUserTrustProfile, type UserTrustProfile } from './trustService';

export interface UserDetailedProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'admin' | 'editor' | 'user';
  userType?: 'tanulo' | 'szakember' | string;
  specialization?: string;
  experienceYears?: number;
  companyName?: string;
  institutionName?: string;
  bio?: string;
  createdAt: string;
  trustProfile: UserTrustProfile;
}

const IN_MEMORY_DETAILED_PROFILES: Map<string, UserDetailedProfile> = new Map();

export async function getUserDetailedProfile(
  userId: string,
  email?: string,
  fullName?: string,
  role: 'admin' | 'editor' | 'user' = 'user',
  userType?: 'tanulo' | 'szakember' | 'partner' | 'oktato' | string
): Promise<UserDetailedProfile> {
  if (IN_MEMORY_DETAILED_PROFILES.has(userId)) {
    const cached = IN_MEMORY_DETAILED_PROFILES.get(userId)!;
    if (fullName && fullName.trim() !== '' && fullName !== cached.fullName) {
      cached.fullName = fullName;
    }
    const effectiveType = userType || cached.userType;
    if (effectiveType) {
      cached.userType = effectiveType;
      if (role === 'user') {
        if (effectiveType === 'tanulo') {
          cached.specialization = 'Tanuló';
          cached.bio = 'Tanulni és fejlődni vágyó felhasználó.';
        } else if (effectiveType === 'partner' || effectiveType === 'oktato' || effectiveType === 'iskola') {
          if (cached.specialization === 'Tanuló') {
            cached.specialization = '';
          }
        } else if (effectiveType === 'szakember' && cached.specialization === 'Tanuló') {
          cached.specialization = 'Építőipari Szakember';
          cached.bio = 'Elhivatott építőipari szakember és a hazai tudásmegosztás aktív támogatója.';
        }
      }
    }
    return cached;
  }

  const trustProfile = await getUserTrustProfile(userId);

  const isTanuloUser = userType === 'tanulo';
  const isPartnerUser = userType === 'partner' || userType === 'oktato' || userType === 'iskola';

  const defaultSpecialization = role === 'admin'
    ? 'Platform Kezelő'
    : role === 'editor'
      ? 'Magasépítés & Szerkezetépítés'
      : isPartnerUser
        ? ''
        : isTanuloUser
          ? 'Tanuló'
          : 'Építőipari Szakember';

  const defaultBio = role === 'admin' || role === 'editor'
    ? 'Elhivatott építőipari szakember és a hazai tudásmegosztás aktív támogatója.'
    : isPartnerUser
      ? 'Hivatalos partneri kapcsolattartó és szakmai képviselő.'
      : isTanuloUser
        ? 'Tanulni és fejlődni vágyó felhasználó.'
        : 'Elhivatott építőipari szakember és a hazai tudásmegosztás aktív támogatója.';

  const profile: UserDetailedProfile = {
    id: userId,
    email: email || 'felhasznalo@epitotudas.hu',
    fullName: fullName || 'Szakmai Felhasználó',
    role,
    userType: userType || (isPartnerUser ? 'partner' : 'tanulo'),
    specialization: defaultSpecialization,
    experienceYears: role === 'admin' ? 10 : 5,
    companyName: 'ÉpítőTudás Partner Kft.',
    institutionName: 'BME Építőmérnöki Kar',
    bio: defaultBio,
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
  const current = await getUserDetailedProfile(userId, undefined, undefined, undefined, payload.userType);
  const effectiveUserType = payload.userType || current.userType;
  const isPartnerUser = effectiveUserType === 'partner' || effectiveUserType === 'oktato' || effectiveUserType === 'iskola';
  
  let finalSpecialization = payload.specialization !== undefined ? payload.specialization : current.specialization;
  if (effectiveUserType === 'tanulo' && (!finalSpecialization || finalSpecialization === 'Építőipari Szakember')) {
    finalSpecialization = 'Tanuló';
  } else if (isPartnerUser && finalSpecialization === 'Tanuló') {
    finalSpecialization = '';
  }

  let finalBio = payload.bio !== undefined ? payload.bio : current.bio;
  if (effectiveUserType === 'tanulo' && (!finalBio || finalBio === 'Elhivatott építőipari szakember és a hazai tudásmegosztás aktív támogatója.')) {
    finalBio = 'Tanulni és fejlődni vágyó felhasználó.';
  }

  const updated: UserDetailedProfile = {
    ...current,
    ...payload,
    userType: effectiveUserType,
    specialization: finalSpecialization,
    bio: finalBio,
  };

  IN_MEMORY_DETAILED_PROFILES.set(userId, updated);
  return updated;
}
