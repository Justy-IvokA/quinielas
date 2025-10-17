/**
 * User Metadata Type Definitions
 * 
 * This file defines the structure of the User.metadata JSON field.
 * Use this to maintain type safety when working with user metadata.
 * 
 * @example
 * ```ts
 * const metadata: UserMetadata = {
 *   preferences: {
 *     notifications: { email: true, push: false },
 *     theme: 'dark',
 *     language: 'es-MX'
 *   },
 *   limits: {
 *     profileChanges: { used: 2, max: 3 }
 *   }
 * };
 * ```
 */

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  marketing?: boolean;
}

/**
 * User preferences
 */
export interface UserPreferences {
  notifications?: NotificationPreferences;
  theme?: "light" | "dark" | "system";
  language?: string;
  timezone?: string;
  dateFormat?: string;
}

/**
 * Usage limits and quotas
 */
export interface UsageLimits {
  profileChanges?: {
    used: number;
    max: number;
    resetDate?: string; // ISO date string
  };
  predictions?: {
    used: number;
    max: number;
    period?: "daily" | "weekly" | "monthly";
  };
  poolCreations?: {
    used: number;
    max: number;
  };
}

/**
 * Feature flags for A/B testing or gradual rollouts
 */
export interface FeatureFlags {
  betaFeatures?: boolean;
  advancedStats?: boolean;
  socialSharing?: boolean;
  customThemes?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * User verification status
 */
export interface VerificationStatus {
  email?: {
    verified: boolean;
    verifiedAt?: string; // ISO date string
  };
  phone?: {
    verified: boolean;
    verifiedAt?: string; // ISO date string
  };
  identity?: {
    verified: boolean;
    verifiedAt?: string; // ISO date string
    provider?: string;
  };
}

/**
 * User onboarding progress
 */
export interface OnboardingProgress {
  completed: boolean;
  steps?: {
    profileSetup?: boolean;
    firstPrediction?: boolean;
    firstPoolJoin?: boolean;
    tutorialViewed?: boolean;
  };
  completedAt?: string; // ISO date string
}

/**
 * User metadata structure
 * This is stored in the User.metadata JSON field
 */
export interface UserMetadata {
  preferences?: UserPreferences;
  limits?: UsageLimits;
  flags?: FeatureFlags;
  verification?: VerificationStatus;
  onboarding?: OnboardingProgress;
  customData?: Record<string, unknown>; // For tenant-specific or future extensions
}

/**
 * Type guard to check if metadata is valid
 */
export function isValidUserMetadata(data: unknown): data is UserMetadata {
  if (!data || typeof data !== "object") return false;
  
  const metadata = data as Partial<UserMetadata>;
  
  // Basic validation - can be extended
  if (metadata.preferences && typeof metadata.preferences !== "object") return false;
  if (metadata.limits && typeof metadata.limits !== "object") return false;
  if (metadata.flags && typeof metadata.flags !== "object") return false;
  
  return true;
}

/**
 * Helper to safely parse metadata from database
 */
export function parseUserMetadata(metadata: unknown): UserMetadata | null {
  if (!metadata) return null;
  if (isValidUserMetadata(metadata)) return metadata;
  return null;
}

/**
 * Helper to merge metadata updates
 */
export function mergeUserMetadata(
  current: UserMetadata | null,
  updates: Partial<UserMetadata>
): UserMetadata {
  const base = current || {};
  
  return {
    preferences: updates.preferences 
      ? {
          ...base.preferences,
          ...updates.preferences,
        }
      : base.preferences,
    limits: updates.limits
      ? {
          ...base.limits,
          ...updates.limits,
        }
      : base.limits,
    flags: updates.flags
      ? {
          ...base.flags,
          ...updates.flags,
        }
      : base.flags,
    verification: updates.verification
      ? {
          ...base.verification,
          ...updates.verification,
        }
      : base.verification,
    onboarding: updates.onboarding
      ? {
          ...base.onboarding,
          ...updates.onboarding,
        }
      : base.onboarding,
    customData: updates.customData
      ? {
          ...base.customData,
          ...updates.customData,
        }
      : base.customData,
  };
}

/**
 * Default metadata for new users
 */
export const DEFAULT_USER_METADATA: UserMetadata = {
  preferences: {
    notifications: {
      email: true,
      push: false,
      sms: false,
      marketing: false,
    },
    theme: "system",
  },
  limits: {
    profileChanges: {
      used: 0,
      max: 3,
    },
  },
  flags: {
    betaFeatures: false,
  },
  onboarding: {
    completed: false,
    steps: {
      profileSetup: false,
      firstPrediction: false,
      firstPoolJoin: false,
      tutorialViewed: false,
    },
  },
};
