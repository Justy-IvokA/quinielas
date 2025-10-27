# 📋 Flujo Completo: Creación de Plantilla de Quiniela

## 🎯 Objetivo

Crear una plantilla de quiniela que:
1. ✅ Valida si la competencia/temporada ya existe en `externalMap`
2. ✅ Si existe: reutiliza los datos existentes
3. ✅ Si NO existe: obtiene datos de football-api y los almacena en `externalMap`
4. ✅ Permite asignar la plantilla a múltiples tenants
5. ✅ Cada asignación crea un pool con todos los fixtures importados

## 📊 Flujo Paso a Paso

### Paso 1: Usuario Crea Plantilla
**Archivo:** `apps/admin/app/[locale]/(authenticated)/superadmin/templates/new/components/steps/StepReview.tsx`

```typescript
// Usuario llena el formulario con:
{
  sportId: "football-id",
  competitionExternalId: "39",  // ID de API-Football
  competitionName: "Liga MX 2025",
  seasonYear: 2025,
  stageLabel: undefined,
  selectedRounds: ["J14", "J15", "J16"],
  roundsRange: { start: 14, end: 16 },
  template: {
    title: "Liga MX Jornada 14-16",
    slug: "liga-mx-j14-16",
    status: "DRAFT"
  },
  rules: {
    exactScore: 5,
    correctSign: 3,
    goalDiffBonus: 1
  },
  accessDefaults: {
    accessType: "PUBLIC",
    requireCaptcha: false,
    requireEmailVerification: false
  }
}
```

### Paso 2: Crear Plantilla
**Endpoint:** `trpc.superadmin.templates.create`
**Archivo:** `packages/api/src/routers/superadmin/templates.ts`

```typescript
// Validaciones:
1. ✅ Slug único
2. ✅ Sport existe
3. ✅ competitionExternalId y seasonYear proporcionados

// Importante: roundLabel = undefined
// Razón: Importar TODA la temporada, no solo jornadas específicas
// Filtrado ocurre en frontend con ruleSet.rounds.start/end

// Resultado: PoolTemplate creada en BD
{
  id: "template-123",
  slug: "liga-mx-j14-16",
  title: "Liga MX Jornada 14-16",
  competitionExternalId: "39",
  seasonYear: 2025,
  roundLabel: undefined,  // ✅ CRÍTICO: undefined para importar todo
  rules: {
    exactScore: 5,
    correctSign: 3,
    goalDiffBonus: 1,
    rounds: { start: 14, end: 16 }  // Filtrado en frontend
  }
}
```

### Paso 3: Publicar Plantilla (Opcional)
**Endpoint:** `trpc.superadmin.templates.publish`

Cambiar status de DRAFT → PUBLISHED

### Paso 4: Asignar Plantilla a Tenant
**Endpoint:** `trpc.superadmin.templates.assignToTenant`
**Archivo:** `packages/api/src/routers/superadmin/templates.ts`

```typescript
// Input:
{
  templateId: "template-123",
  tenantId: "tenant-456",
  brandId: "brand-789"  // opcional
}
```

### Paso 5: Provisionar Plantilla (Sincronización con ExternalMap)
**Función:** `provisionTemplateToTenant()`
**Archivo:** `packages/api/src/services/templateProvision.service.ts`

Este es el paso CRÍTICO donde ocurre la validación y sincronización:

#### 5.1: Buscar Competencia en ExternalMap

```typescript
// PRIMERO: Buscar por competitionExternalId en ExternalMap
const externalMapForCompetition = await prisma.externalMap.findFirst({
  where: {
    externalId: "39",  // competitionExternalId
    entityType: "COMPETITION"
  }
});

if (externalMapForCompetition) {
  // ✅ ENCONTRADO: Reutilizar competencia existente
  competition = await prisma.competition.findUnique({
    where: { id: externalMapForCompetition.entityId }
  });
  console.log(`✅ Found Competition via ExternalMap: ${competition.id}`);
} else {
  // FALLBACK: Buscar por nombre
  competition = await prisma.competition.findFirst({
    where: {
      sportId: sport.id,
      name: "Liga MX 2025"
    }
  });
  
  if (!competition) {
    // ❌ NO EXISTE: Crear nueva competencia
    competition = await prisma.competition.create({
      data: {
        sportId: sport.id,
        slug: "liga-mx-2025",
        name: "Liga MX 2025"
      }
    });
  }
}
```

#### 5.2: Garantizar ExternalMap para Competencia

```typescript
// IMPORTANTE: Siempre crear/actualizar ExternalMap
// Incluso si la competencia ya existía
await prisma.externalMap.upsert({
  where: {
    sourceId_entityType_externalId: {
      sourceId: externalSource.id,  // api-football
      entityType: "COMPETITION",
      externalId: "39"
    }
  },
  create: {
    sourceId: externalSource.id,
    entityType: "COMPETITION",
    entityId: competition.id,
    externalId: "39"
  },
  update: {
    entityId: competition.id
  }
});
```

#### 5.3: Buscar o Crear Temporada

```typescript
let season = await prisma.season.findFirst({
  where: {
    competitionId: competition.id,
    year: 2025
  }
});

if (!season) {
  // Crear nueva temporada
  season = await prisma.season.create({
    data: {
      competitionId: competition.id,
      name: "Liga MX Jornada 14-16",
      year: 2025
    }
  });
} else {
  console.log(`✅ Reusing existing Season: ${season.id}`);
}
```

#### 5.4: Obtener Datos de API-Football

```typescript
// Fetch FULL season (roundLabel = undefined)
const seasonData = await provider.fetchSeason({
  competitionExternalId: "39",
  year: 2025
});

// Resultado:
{
  teams: [
    { externalId: "1", name: "Team A", ... },
    { externalId: "2", name: "Team B", ... },
    ...
  ],
  matches: [
    { externalId: "m1", round: 14, homeTeamExternalId: "1", awayTeamExternalId: "2", ... },
    { externalId: "m2", round: 15, homeTeamExternalId: "2", awayTeamExternalId: "3", ... },
    ...
  ]
}
```

#### 5.5: Importar Equipos y Crear ExternalMap

```typescript
for (const teamDTO of seasonData.teams) {
  // Buscar o crear equipo
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
  
  // Crear ExternalMap para equipo
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
}
```

#### 5.6: Importar Partidos y Crear ExternalMap

```typescript
for (const matchDTO of seasonData.matches) {
  const homeTeamId = teamIdMap.get(matchDTO.homeTeamExternalId);
  const awayTeamId = teamIdMap.get(matchDTO.awayTeamExternalId);
  
  if (!homeTeamId || !awayTeamId) {
    console.warn(`Skipping match: team mapping not found`);
    continue;
  }
  
  // Crear o actualizar partido
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
  
  // Crear ExternalMap para partido
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
}
```

#### 5.7: Crear Pool con Reglas

```typescript
const pool = await prisma.pool.create({
  data: {
    tenantId: "tenant-456",
    brandId: "brand-789",
    seasonId: season.id,
    name: "Liga MX Jornada 14-16",
    slug: "liga-mx-j14-16",
    description: template.description,
    isActive: true,
    isPublic: false,
    ruleSet: {
      exactScore: 5,
      correctSign: 3,
      goalDiffBonus: 1,
      tieBreakers: ["EXACT_SCORES", "CORRECT_SIGNS"],
      rounds: { start: 14, end: 16 }  // Filtrado en frontend
    }
  }
});
```

#### 5.8: Crear AccessPolicy

```typescript
await prisma.accessPolicy.create({
  data: {
    poolId: pool.id,
    tenantId: "tenant-456",
    accessType: "PUBLIC",
    requireCaptcha: false,
    requireEmailVerification: false,
    domainAllowList: [],
    maxRegistrations: null,
    registrationStartDate: null,
    registrationEndDate: null
  }
});
```

#### 5.9: Crear Premios (si existen)

```typescript
if (template.prizesDefaults && template.prizesDefaults.length > 0) {
  await prisma.prize.createMany({
    data: template.prizesDefaults.map((prize, index) => ({
      poolId: pool.id,
      tenantId: "tenant-456",
      position: index + 1,
      rankFrom: prize.rankFrom,
      rankTo: prize.rankTo,
      type: prize.type,
      title: prize.title,
      description: prize.description,
      value: prize.value
    }))
  });
}
```

#### 5.10: Crear Audit Log

```typescript
await prisma.auditLog.create({
  data: {
    tenantId: "tenant-456",
    action: "TEMPLATE_PROVISION",
    resourceType: "POOL",
    resourceId: pool.id,
    metadata: {
      templateId: "template-123",
      templateSlug: "liga-mx-j14-16",
      poolId: pool.id,
      poolSlug: "liga-mx-j14-16",
      imported: {
        teams: 18,
        matches: 380
      }
    }
  }
});
```

## 📈 Resultado Final

```
✅ Template creada
   ├─ Competencia: Liga MX 2025 (externalId: 39)
   ├─ Temporada: 2025
   ├─ Reglas: exactScore=5, correctSign=3, goalDiffBonus=1
   └─ ExternalMap: COMPETITION → Liga MX 2025

✅ Pool creada para Tenant
   ├─ 18 equipos importados
   ├─ 380 partidos importados
   ├─ Todos con ExternalMap registrado
   ├─ AccessPolicy: PUBLIC
   └─ Reglas: Filtrar jornadas 14-16 en frontend

✅ Datos reutilizables
   └─ Si otro tenant usa la misma plantilla:
      ├─ Reutiliza competencia existente
      ├─ Reutiliza temporada existente
      ├─ Reutiliza equipos existentes
      ├─ Reutiliza partidos existentes
      └─ Solo crea nuevo Pool + AccessPolicy + Prizes
```

## 🔍 Validaciones Críticas

### 1. ExternalMap como Fuente de Verdad

```typescript
// SIEMPRE buscar por externalId primero
const externalMap = await prisma.externalMap.findFirst({
  where: {
    externalId: competitionExternalId,
    entityType: "COMPETITION"
  }
});

// Si existe → reutilizar
// Si NO existe → crear nuevo
```

### 2. Importar TODA la Temporada

```typescript
// ✅ CORRECTO: roundLabel = undefined
const seasonData = await provider.fetchSeason({
  competitionExternalId: "39",
  year: 2025
  // roundLabel: undefined  ← Importar TODO
});

// ❌ INCORRECTO: roundLabel = "J14"
// Solo importaría jornada 14, no 15 ni 16
```

### 3. Filtrado en Frontend

```typescript
// Filtrado ocurre en ruleSet.rounds
{
  exactScore: 5,
  correctSign: 3,
  goalDiffBonus: 1,
  rounds: { start: 14, end: 16 }  // ← Filtro en frontend
}

// Cuando se muestran partidos:
const filteredMatches = allMatches.filter(
  m => m.round >= 14 && m.round <= 16
);
```

## 🚀 Flujo Resumido

```
1. Usuario crea Template
   ↓
2. Sistema valida competitionExternalId
   ↓
3. Buscar en ExternalMap
   ├─ SI EXISTE: reutilizar
   └─ NO EXISTE: obtener de API-Football
   ↓
4. Crear/actualizar ExternalMap
   ├─ COMPETITION
   ├─ TEAM (x18)
   └─ MATCH (x380)
   ↓
5. Crear Pool con todos los datos
   ├─ AccessPolicy
   ├─ Prizes
   └─ Audit Log
   ↓
6. Pool listo para que usuarios se registren
```

## ✅ Checklist de Validación

- [ ] ExternalMap para competencia existe
- [ ] ExternalMap para todos los equipos existe
- [ ] ExternalMap para todos los partidos existe
- [ ] Pool tiene todos los partidos importados
- [ ] ruleSet.rounds filtra correctamente
- [ ] AccessPolicy está configurada
- [ ] Audit log registra la provisión
- [ ] Siguiente asignación reutiliza datos existentes
