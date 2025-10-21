/**
 * Sports Router
 * 
 * Basic CRUD operations for sports
 */

import { prisma } from "@qp/db";
import { router, publicProcedure } from "../../trpc";

export const sportsRouter = router({
  /**
   * List all sports
   */
  list: publicProcedure.query(async () => {
    const sports = await prisma.sport.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return sports;
  })
});
