import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { InvitationStatus } from "@qp/db";

import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import { withAuth, withTenant } from "../../middleware/with-tenant";
import { listUserPoolsSchema } from "./schema";

export const userPoolsRouter = router({
  /**
   * List pools for the current user within the current tenant
   * Includes:
   * - Pools where user has a Registration
   * - Pools where user has a pending Invitation (EMAIL_INVITE)
   */
  list: publicProcedure
    .use(withTenant)
    .use(withAuth)
    .input(listUserPoolsSchema)
    .query(async ({ ctx, input }) => {
      const { filter, search, page, pageSize, sort } = input;
      const userId = ctx.session.user.id;
      
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Tenant context required"
        });
      }
      
      const tenantId = ctx.tenant.id;

      // Build where clause for search
      const searchWhere = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { season: { name: { contains: search, mode: "insensitive" as const } } },
              { season: { competition: { name: { contains: search, mode: "insensitive" as const } } } }
            ]
          }
        : {};

      // Get user's registrations
      const registrations = await prisma.registration.findMany({
        where: {
          userId,
          tenantId,
          pool: {
            tenantId,
            ...searchWhere
          }
        },
        include: {
          pool: {
            include: {
              brand: {
                select: {
                  name: true,
                  slug: true,
                  logoUrl: true
                }
              },
              season: {
                select: {
                  name: true,
                  year: true,
                  competition: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              accessPolicy: {
                select: {
                  accessType: true
                }
              },
              _count: {
                select: {
                  registrations: true
                }
              }
            }
          },
          inviteCode: {
            select: {
              code: true
            }
          },
          invitation: {
            select: {
              email: true,
              status: true
            }
          }
        }
      });

      // Get pending invitations (not yet registered)
      const registeredPoolIds = registrations.map((r: any) => r.poolId);
      const pendingInvitations = await prisma.invitation.findMany({
        where: {
          tenantId,
          email: ctx.session.user.email!,
          status: { in: ["PENDING"] },
          poolId: { notIn: registeredPoolIds },
          pool: {
            tenantId,
            isActive: true,
            ...searchWhere
          }
        },
        include: {
          pool: {
            include: {
              brand: {
                select: {
                  name: true,
                  slug: true,
                  logoUrl: true
                }
              },
              season: {
                select: {
                  name: true,
                  year: true,
                  competition: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              accessPolicy: {
                select: {
                  accessType: true
                }
              },
              _count: {
                select: {
                  registrations: true
                }
              }
            }
          }
        }
      });

      // Get next kickoff for each pool
      const allPoolIds = [
        ...registrations.map((r: any) => r.poolId),
        ...pendingInvitations.map((inv: any) => inv.poolId)
      ];

      const nextKickoffs = await prisma.match.groupBy({
        by: ["seasonId"],
        where: {
          seasonId: {
            in: [
              ...registrations.map((r: any) => r.pool.seasonId),
              ...pendingInvitations.map((inv: any) => inv.pool.seasonId)
            ]
          },
          status: "SCHEDULED",
          kickoffTime: {
            gte: new Date()
          }
        },
        _min: {
          kickoffTime: true
        }
      });

      const nextKickoffMap = new Map<string, Date>(
        nextKickoffs.map((nk: any) => [nk.seasonId, nk._min.kickoffTime])
      );

      // Transform registrations to UserPoolItem
      const registeredItems = registrations.map((reg: any) => {
        const pool = reg.pool;
        const now = new Date();
        const isFinalized = pool.endDate ? pool.endDate < now : false;
        const nextKickoff = nextKickoffMap.get(pool.seasonId);

        // Determine registration method
        let registrationMethod: "PUBLIC" | "CODE" | "EMAIL_INVITE" = "PUBLIC";
        if (reg.invitationId) {
          registrationMethod = "EMAIL_INVITE";
        } else if (reg.inviteCodeId) {
          registrationMethod = "CODE";
        }

        return {
          poolId: pool.id,
          poolSlug: pool.slug,
          title: pool.name,
          brand: {
            name: pool.brand?.name || "Default",
            logoUrl: pool.brand?.logoUrl || null
          },
          seasonLabel: `${pool.season.competition.name} ${pool.season.year}`,
          status: isFinalized ? ("FINALIZED" as const) : ("ACTIVE" as const),
          accessType: pool.accessPolicy?.accessType || "PUBLIC",
          nextKickoff: nextKickoff?.toISOString() || null,
          myRegistration: {
            method: registrationMethod,
            joinedAt: reg.joinedAt.toISOString()
          },
          myInviteStatus: null,
          createdAt: pool.createdAt.toISOString(),
          participantCount: pool._count.registrations
        };
      });

      // Transform pending invitations to UserPoolItem
      const pendingItems = pendingInvitations.map((inv: any) => {
        const pool = inv.pool;
        const nextKickoff = nextKickoffMap.get(pool.seasonId);

        return {
          poolId: pool.id,
          poolSlug: pool.slug,
          title: pool.name,
          brand: {
            name: pool.brand?.name || "Default",
            logoUrl: pool.brand?.logoUrl || null
          },
          seasonLabel: `${pool.season.competition.name} ${pool.season.year}`,
          status: "ACTIVE" as const,
          accessType: pool.accessPolicy?.accessType || "EMAIL_INVITE",
          nextKickoff: nextKickoff?.toISOString() || null,
          myRegistration: null,
          myInviteStatus: inv.status,
          createdAt: pool.createdAt.toISOString(),
          participantCount: pool._count.registrations
        };
      });

      // Combine and filter
      let allItems = [...registeredItems, ...pendingItems];

      // Apply filter
      if (filter === "ACTIVE") {
        allItems = allItems.filter((item) => item.status === "ACTIVE");
      } else if (filter === "FINALIZED") {
        allItems = allItems.filter((item) => item.status === "FINALIZED");
      } else if (filter === "PENDING") {
        allItems = allItems.filter((item) => item.myInviteStatus === "PENDING");
      }

      // Apply sort
      if (sort === "NEXT_KICKOFF") {
        allItems.sort((a, b) => {
          if (!a.nextKickoff && !b.nextKickoff) return 0;
          if (!a.nextKickoff) return 1;
          if (!b.nextKickoff) return -1;
          return new Date(a.nextKickoff).getTime() - new Date(b.nextKickoff).getTime();
        });
      } else if (sort === "FINALIZED_RECENT") {
        allItems = allItems.filter((item) => item.status === "FINALIZED");
        allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        // RECENT: sort by registration date or invitation date
        allItems.sort((a, b) => {
          const aDate = a.myRegistration?.joinedAt || a.createdAt;
          const bDate = b.myRegistration?.joinedAt || b.createdAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });
      }

      // Paginate
      const total = allItems.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const items = allItems.slice(startIndex, endIndex);

      return {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      };
    })
});
