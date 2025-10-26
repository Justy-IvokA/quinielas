import { Feature } from "@qp/db";
import type { PrismaClient, LicenseTier } from "@qp/db";

// Mapping of features to tiers
const TIER_FEATURES: Record<LicenseTier, Feature[]> = {
  GOLAZO: [], // base tier, no specific features
  GRAN_JUGADA: ['TRIVIA', 'REWARDS_CHALLENGES', 'NOTIFICATIONS_INTERMEDIATE'],
  COPA_DEL_MUNDO: ['TRIVIA', 'REWARDS_CHALLENGES', 'NOTIFICATIONS_INTERMEDIATE', 'ANALYTICS_ADVANCED', 'NOTIFICATIONS_ADVANCED'],
};

export class FeatureGuard {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if a feature is enabled for a tenant, considering overrides and tier
   */
  async isFeatureEnabled(tenantId: string, feature: Feature): Promise<boolean> {
    // First, check for active overrides
    const override = await this.prisma.tenantFeatureOverride.findFirst({
      where: {
        tenantId,
        feature,
        OR: [
          { expiresAt: null }, // no expiration
          { expiresAt: { gt: new Date() } } // not expired
        ]
      }
    });

    if (override) {
      return override.isEnabled;
    }

    // No override, check tenant's license tier
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { licenseTier: true }
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Check if feature is included in the tier
    return TIER_FEATURES[tenant.licenseTier].includes(feature);
  }

  /**
   * Get all effective feature statuses for a tenant
   */
  async getFeatureStatuses(tenantId: string): Promise<Record<Feature, boolean>> {
    const statuses: Partial<Record<Feature, boolean>> = {};

    // Get all features
    const allFeatures: Feature[] = Object.values(Feature);

    // Check each feature
    await Promise.all(
      allFeatures.map(async (feature) => {
        statuses[feature] = await this.isFeatureEnabled(tenantId, feature);
      })
    );

    return statuses as Record<Feature, boolean>;
  }
}

// Export a singleton instance function
export const createFeatureGuard = (prisma: PrismaClient) => new FeatureGuard(prisma);
