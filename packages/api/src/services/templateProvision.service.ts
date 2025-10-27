/**
 * Template Provision Service
 * 
 * Handles the provisioning of pool templates to tenants:
 * - Creates Pool with template configuration
 * - Creates AccessPolicy from template defaults
 * - Creates Prizes from template defaults
 * - Imports fixtures using the template scope
 */

import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";
import { getSportsProvider } from "@qp/utils/sports";
import type { ExtendedSportsProvider, SportsProvider } from "@qp/utils/sports";

export interface ProvisionTemplateInput {
  templateId: string;
  tenantId: string;
  brandId?: string;
}

export interface ProvisionResult {
  poolId: string;
  poolSlug: string;
  imported: {
    teams: number;
    matches: number;
  };
}

/**
 * Provisions a pool template to a tenant
 * Creates Pool, AccessPolicy, Prizes, and imports fixtures
 */
export async function provisionTemplateToTenant(
  input: ProvisionTemplateInput
): Promise<ProvisionResult> {
  const { templateId, tenantId, brandId } = input;

  // console.log(`[TemplateProvision] 🚀 Iniciando provisión: template=${templateId}, tenant=${tenantId}, brand=${brandId}`);

  // Fetch template
  // console.log(`[TemplateProvision] 📋 Obteniendo plantilla: ${templateId}`);
  const template = await prisma.poolTemplate.findUnique({
    where: { id: templateId },
    include: { sport: true }
  });

  if (!template) {
    // console.error(`[TemplateProvision] ❌ Plantilla no encontrada: ${templateId}`);
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Plantilla no encontrada"
    });
  }

  // console.log(`[TemplateProvision] ✅ Plantilla encontrada: ${template.slug} (${template.title})`);

  if (template.status !== "PUBLISHED") {
    // console.error(`[TemplateProvision] ❌ Plantilla no publicada: status=${template.status}`);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only PUBLISHED templates can be provisioned"
    });
  }

  // Validate tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    // console.error(`[TemplateProvision] ❌ Tenant no encontrado: ${tenantId}`);
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Tenant no encontrado"
    });
  }

  // Generate unique slug for the pool
  let poolSlug = template.slug;
  let slugSuffix = 1;
  
  while (true) {
    const existing = await prisma.pool.findFirst({
      where: {
        tenantId,
        slug: poolSlug
      }
    });
    
    if (!existing) break;
    
    poolSlug = `${template.slug}-${slugSuffix}`;
    slugSuffix++;
  }

  // Get or create Sport (default to football)
  let sport = template.sport;
  
  if (!sport) {
    sport = await prisma.sport.findFirst({
      where: { slug: "football" }
    });

    if (!sport) {
      sport = await prisma.sport.create({
        data: {
          slug: "football",
          name: "Football"
        }
      });
    }
  }

  // Get provider
  const provider = getSportsProvider({
    provider: "api-football",
    apiKey: process.env.SPORTS_API_KEY
  }) as unknown as SportsProvider & ExtendedSportsProvider;

  // Get external source
  let externalSource = await prisma.externalSource.findFirst({
    where: { slug: "api-football" }
  });

  if (!externalSource) {
    externalSource = await prisma.externalSource.create({
      data: {
        slug: "api-football",
        name: "API-Football"
      }
    });
  }

  try {
    // Fetch season data from provider
    let seasonData: Awaited<ReturnType<typeof provider.fetchSeason>>;

    if (!template.competitionExternalId || !template.seasonYear) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "La plantilla debe tener competitionExternalId y seasonYear"
      });
    }

    // ✅ IMPORTANT: Log template configuration for debugging
    // console.log(`[TemplateProvision] Configuración de la plantilla: competitionExternalId=${template.competitionExternalId}, seasonYear=${template.seasonYear}, stageLabel=${template.stageLabel}, roundLabel=${template.roundLabel}`);
    // console.log(`[TemplateProvision] Reglas de la plantilla: ${JSON.stringify(template.rules, null, 2)}`);

    if (template.stageLabel || template.roundLabel) {
      // console.log(`[TemplateProvision] Obteniendo temporada filtrada: stage=${template.stageLabel}, round=${template.roundLabel}`);
      // Check if provider supports fetchSeasonRound
      if ('fetchSeasonRound' in provider && typeof provider.fetchSeasonRound === 'function') {
        seasonData = await provider.fetchSeasonRound({
          competitionExternalId: template.competitionExternalId,
          year: template.seasonYear,
          stageLabel: template.stageLabel ?? undefined,
          roundLabel: template.roundLabel ?? undefined
        });
      } else {
        // Fallback to full season fetch
        // console.warn(`[TemplateProvision] Proveedor no soporta fetchSeasonRound, obteniendo temporada completa`);
        seasonData = await provider.fetchSeason({
          competitionExternalId: template.competitionExternalId,
          year: template.seasonYear
        });
      }
    } else {
      // console.log(`[TemplateProvision] ✅ Obteniendo temporada completa (roundLabel es undefined - importar todos los partidos)`);
      seasonData = await provider.fetchSeason({
        competitionExternalId: template.competitionExternalId,
        year: template.seasonYear
      });
    }

    if (!seasonData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Datos de la temporada no encontrados del proveedor(API)"
      });
    }

    // console.log(`[TemplateProvision] Obtenidos ${seasonData.teams.length} equipos y ${seasonData.matches.length} partidos`);

    // ✅ Use competitionName if available, otherwise fallback to title
    const competitionName = (template.meta as any)?.competitionName || template.title;
    const competitionSlug = competitionName.toLowerCase().replace(/\s+/g, "-");

    // ✅ IMPORTANT: Search by competitionExternalId first (most reliable)
    // Workaround: ExternalMap doesn't have direct relation to Competition
    // So we search ExternalMap first, then fetch Competition by entityId
    let competition: any = null;
    
    const externalMapForCompetition = await prisma.externalMap.findFirst({
      where: {
        externalId: template.competitionExternalId,
        entityType: "COMPETITION"
      }
    });

    if (externalMapForCompetition) {
      // Found external mapping - fetch the Competition
      competition = await prisma.competition.findUnique({
        where: { id: externalMapForCompetition.entityId }
      });
      
      if (competition) {
        // console.log(`[TemplateProvision] ✅ Competencia Encontrada via ExternalMap: ${competition.id} (${competition.name})`);
      }
    }

    // Fallback: search by name if not found by externalId
    if (!competition) {
      competition = await prisma.competition.findFirst({
        where: {
          sportId: sport.id,
          name: competitionName
        }
      });
      
      if (competition) {
        // console.log(`[TemplateProvision] ✅ Competencia Encontrada por nombre: ${competition.id} (${competition.name})`);
      }
    }

    // Crear si aún no se encontró
    if (!competition) {
      // console.log(`[TemplateProvision] Creando nueva competencia: name=${competitionName}, slug=${competitionSlug}`);
      competition = await prisma.competition.create({
        data: {
          sportId: sport.id,
          slug: competitionSlug,
          name: competitionName,
          logoUrl: seasonData.competitionLogoUrl || undefined
        }
      });
    } else if (!competition.logoUrl && seasonData.competitionLogoUrl) {
      // Update existing competition with logoUrl if it doesn't have one
      competition = await prisma.competition.update({
        where: { id: competition.id },
        data: {
          logoUrl: seasonData.competitionLogoUrl
        }
      });
    }

    // Ensure external mapping exists for competition (even if competition already existed)
    await prisma.externalMap.upsert({
      where: {
        sourceId_entityType_externalId: {
          sourceId: externalSource.id,
          entityType: "COMPETITION",
          externalId: template.competitionExternalId
        }
      },
      create: {
        sourceId: externalSource.id,
        entityType: "COMPETITION",
        entityId: competition.id,
        externalId: template.competitionExternalId
      },
      update: {
        entityId: competition.id
      }
    });

    // Create or get Season
    let season = await prisma.season.findFirst({
      where: {
        competitionId: competition.id,
        year: template.seasonYear
      }
    });

    if (!season) {
      // console.log(`[TemplateProvision] Creando nueva temporada: año=${template.seasonYear}, competitionId=${competition.id}`);
      season = await prisma.season.create({
        data: {
          competitionId: competition.id,
          name: `${(template.meta as any)?.competitionName || template.title}`,
          year: template.seasonYear
        }
      });
    } else {
      console.log(`[TemplateProvision] ✅ Reutilizando temporada existente: ${season.id} (${season.name})`);
    }

    // Import teams
    const teamIdMap = new Map<string, string>();

    for (const teamDTO of seasonData.teams) {
      let team = await prisma.team.findFirst({
        where: {
          sportId: sport.id,
          slug: teamDTO.name.toLowerCase().replace(/\s+/g, "-")
        }
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            sportId: sport.id,
            slug: teamDTO.name.toLowerCase().replace(/\s+/g, "-"),
            name: teamDTO.name,
            shortName: teamDTO.shortName,
            logoUrl: teamDTO.logoUrl,
            countryCode: teamDTO.countryCode
          }
        });
      }

      // Create external mapping
      await prisma.externalMap.upsert({
        where: {
          sourceId_entityType_externalId: {
            sourceId: externalSource.id,
            entityType: "TEAM",
            externalId: teamDTO.externalId
          }
        },
        create: {
          sourceId: externalSource.id,
          entityType: "TEAM",
          entityId: team.id,
          externalId: teamDTO.externalId
        },
        update: {
          entityId: team.id
        }
      });

      // Associate team with season
      await prisma.teamSeason.upsert({
        where: {
          teamId_seasonId: {
            teamId: team.id,
            seasonId: season.id
          }
        },
        create: {
          teamId: team.id,
          seasonId: season.id
        },
        update: {}
      });

      teamIdMap.set(teamDTO.externalId, team.id);
    }

    // Import matches
    let importedMatches = 0;
    // console.log(`[TemplateProvision] Iniciando importación de partidos: ${seasonData.matches.length} partidos para procesar`);

    for (const matchDTO of seasonData.matches) {
      const homeTeamId = teamIdMap.get(matchDTO.homeTeamExternalId);
      const awayTeamId = teamIdMap.get(matchDTO.awayTeamExternalId);

      if (!homeTeamId || !awayTeamId) {
        // console.warn(`[TemplateProvision] Omitiendo partido: mapeo de equipos no encontrado para ${matchDTO.homeTeamExternalId} vs ${matchDTO.awayTeamExternalId}`);
        continue;
      }

      const match = await prisma.match.upsert({
        where: {
          seasonId_round_homeTeamId_awayTeamId: {
            seasonId: season.id,
            round: matchDTO.round ?? 0,
            homeTeamId,
            awayTeamId
          }
        },
        create: {
          seasonId: season.id,
          round: matchDTO.round ?? 0,
          homeTeamId,
          awayTeamId,
          kickoffTime: matchDTO.kickoffTime,
          venue: matchDTO.venue,
          status: matchDTO.status,
          homeScore: matchDTO.homeScore,
          awayScore: matchDTO.awayScore,
          finishedAt: matchDTO.finishedAt
        },
        update: {
          kickoffTime: matchDTO.kickoffTime,
          venue: matchDTO.venue,
          status: matchDTO.status,
          homeScore: matchDTO.homeScore,
          awayScore: matchDTO.awayScore,
          finishedAt: matchDTO.finishedAt
        }
      });

      // Create external mapping for match
      await prisma.externalMap.upsert({
        where: {
          sourceId_entityType_externalId: {
            sourceId: externalSource.id,
            entityType: "MATCH",
            externalId: matchDTO.externalId
          }
        },
        create: {
          sourceId: externalSource.id,
          entityType: "MATCH",
          entityId: match.id,
          externalId: matchDTO.externalId
        },
        update: {
          entityId: match.id
        }
      });

      importedMatches++;
    }

    // Parse rules from template (with defaults)
    const rules = template.rules as any || {
      exactScore: 5,
      correctSign: 3,
      goalDiffBonus: 1,
      tieBreakers: ["EXACT_SCORES", "CORRECT_SIGNS"]
    };

    // ✅ IMPORTANT: Log rules including round filtering
    // console.log(`[TemplateProvision] Creando quiniela con reglas: ${JSON.stringify(rules, null, 2)}`);
    if (rules.rounds) {
      // console.log(`[TemplateProvision] ✅ Quiniela filtrará partidos por rondas: ${rules.rounds.start}-${rules.rounds.end}`);
    }

    // Create Pool
    const pool = await prisma.pool.create({
      data: {
        tenantId,
        brandId: brandId || null,
        seasonId: season.id,
        name: template.title,
        slug: poolSlug,
        description: template.description,
        isActive: true,
        isPublic: false, // Will be set by access policy
        ruleSet: rules
      }
    });

    // console.log(`[TemplateProvision] ✅ Quiniela creada: ${pool.id} (${pool.slug}) con ${importedMatches} partidos`);

    // Parse access defaults from template
    const accessDefaults = template.accessDefaults as any || {};
    
    // Create Access Policy
    await prisma.accessPolicy.create({
      data: {
        poolId: pool.id,
        tenantId,
        accessType: accessDefaults.accessType || "PUBLIC",
        requireCaptcha: accessDefaults.requireCaptcha ?? false,
        requireEmailVerification: accessDefaults.requireEmailVerification ?? false,
        domainAllowList: accessDefaults.emailDomains || [],
        maxRegistrations: accessDefaults.maxUsers,
        registrationStartDate: accessDefaults.startAt ? new Date(accessDefaults.startAt) : null,
        registrationEndDate: accessDefaults.endAt ? new Date(accessDefaults.endAt) : null,
        windowStart: accessDefaults.startAt ? new Date(accessDefaults.startAt) : null,
        windowEnd: accessDefaults.endAt ? new Date(accessDefaults.endAt) : null
      }
    });

    // Parse prizes defaults from template
    const prizesDefaults = template.prizesDefaults as any[] || [];

    // Create Prizes
    if (prizesDefaults.length > 0) {
      // console.log(`[TemplateProvision] Creando ${prizesDefaults.length} premios para la quiniela ${pool.id}`);
      await prisma.prize.createMany({
        data: prizesDefaults.map((prize, index) => ({
          poolId: pool.id,
          tenantId,
          position: index + 1,
          rankFrom: prize.rankFrom,
          rankTo: prize.rankTo,
          type: prize.type,
          title: prize.title,
          description: prize.description || undefined,
          value: prize.value || undefined,
          metadata: prize.metadata || undefined
        }))
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "TEMPLATE_PROVISION",
        resourceType: "POOL",
        resourceId: pool.id,
        metadata: {
          templateId: template.id,
          templateSlug: template.slug,
          poolId: pool.id,
          poolSlug: pool.slug,
          imported: {
            teams: teamIdMap.size,
            matches: importedMatches
          }
        }
      }
    });

    // console.log(`[TemplateProvision] ✅ Se completó la provisión exitosamente`);
    // console.log(`[TemplateProvision] Resultado: poolId=${pool.id}, equipos=${teamIdMap.size}, partidos=${importedMatches}`);

    return {
      poolId: pool.id,
      poolSlug: pool.slug,
      imported: {
        teams: teamIdMap.size,
        matches: importedMatches
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // console.error(`[TemplateProvision] ❌ Provision falló para template=${templateId}, tenant=${tenantId}`);
    // console.error(`[TemplateProvision] Mensaje de error: ${errorMessage}`);
    // if (errorStack) {
    //   console.error(`[TemplateProvision] Stack trace:`, errorStack);
    // }
    
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: errorMessage
    });
  }
}

/**
 * Preview import for a template (without creating anything)
 * Returns estimated counts of teams and matches
 */
export async function previewTemplateImport(templateId: string) {
  const template = await prisma.poolTemplate.findUnique({
    where: { id: templateId }
  });

  if (!template) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Plantilla no encontrada"
    });
  }

  if (!template.competitionExternalId || !template.seasonYear) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Plantilla debe tener competitionExternalId y seasonYear"
    });
  }

  const provider = getSportsProvider({
    provider: "api-football",
    apiKey: process.env.SPORTS_API_KEY
  }) as unknown as ExtendedSportsProvider;

  try {
    const preview = await provider.previewFixtures({
      competitionExternalId: template.competitionExternalId,
      seasonYear: template.seasonYear,
      stageLabel: template.stageLabel || undefined,
      roundLabel: template.roundLabel || undefined
    });

    return preview;
  } catch (error) {
    // console.error("[TemplateProvision] Error al previsualizar la plantilla:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error instanceof Error ? error.message : "Error al previsualizar la plantilla"
    });
  }
}
