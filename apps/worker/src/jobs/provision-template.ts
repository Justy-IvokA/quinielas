/**
 * Worker Job: Provision Template
 * 
 * Processes TenantTemplateAssignment records in QUEUED status
 * and provisions pools from templates asynchronously
 */

import { prisma } from "@qp/db";
import { provisionTemplateToTenant } from "@qp/api/services/templateProvision.service";

interface ProvisionTemplateJobInput {
  assignmentId: string;
}

/**
 * Process a single template assignment
 */
export async function provisionTemplateJob(input: ProvisionTemplateJobInput) {
  const { assignmentId } = input;

  console.log(`[ProvisionTemplateJob] Processing assignment: ${assignmentId}`);

  // Fetch assignment
  const assignment = await prisma.tenantTemplateAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      template: true,
      tenant: true
    }
  });

  if (!assignment) {
    console.error(`[ProvisionTemplateJob] Assignment not found: ${assignmentId}`);
    return;
  }

  if (assignment.status !== "QUEUED") {
    console.log(`[ProvisionTemplateJob] Assignment ${assignmentId} already processed (status: ${assignment.status})`);
    return;
  }

  // Update status to RUNNING
  await prisma.tenantTemplateAssignment.update({
    where: { id: assignmentId },
    data: { status: "RUNNING" }
  });

  try {
    console.log(`[ProvisionTemplateJob] Provisioning template ${assignment.template.slug} to tenant ${assignment.tenant.slug}`);

    // Provision the template
    const result = await provisionTemplateToTenant({
      templateId: assignment.templateId,
      tenantId: assignment.tenantId
    });

    // Update assignment with success
    await prisma.tenantTemplateAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "DONE",
        result: result as any
      }
    });

    console.log(`[ProvisionTemplateJob] Successfully provisioned template ${assignment.template.slug} to tenant ${assignment.tenant.slug}`);
    console.log(`[ProvisionTemplateJob] Created pool: ${result.poolSlug} with ${result.imported.teams} teams and ${result.imported.matches} matches`);

    return result;
  } catch (error) {
    console.error(`[ProvisionTemplateJob] Error provisioning template:`, error);

    // Update assignment with failure
    await prisma.tenantTemplateAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "FAILED",
        result: {
          error: error instanceof Error ? error.message : "Unknown error"
        } as any
      }
    });

    throw error;
  }
}

/**
 * Process all QUEUED template assignments
 * This can be called by a cron job or manually
 */
export async function processQueuedTemplateAssignments() {
  console.log(`[ProvisionTemplateJob] Processing queued template assignments`);

  const queuedAssignments = await prisma.tenantTemplateAssignment.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: 10 // Process in batches
  });

  console.log(`[ProvisionTemplateJob] Found ${queuedAssignments.length} queued assignments`);

  const results = [];

  for (const assignment of queuedAssignments) {
    try {
      const result = await provisionTemplateJob({ assignmentId: assignment.id });
      results.push({ assignmentId: assignment.id, status: "success", result });
    } catch (error) {
      results.push({
        assignmentId: assignment.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  console.log(`[ProvisionTemplateJob] Processed ${results.length} assignments`);
  console.log(`[ProvisionTemplateJob] Success: ${results.filter(r => r.status === "success").length}`);
  console.log(`[ProvisionTemplateJob] Failed: ${results.filter(r => r.status === "failed").length}`);

  return results;
}

/**
 * Retry failed template assignments
 */
export async function retryFailedTemplateAssignments() {
  console.log(`[ProvisionTemplateJob] Retrying failed template assignments`);

  const failedAssignments = await prisma.tenantTemplateAssignment.findMany({
    where: { status: "FAILED" },
    orderBy: { updatedAt: "desc" },
    take: 5 // Retry in small batches
  });

  console.log(`[ProvisionTemplateJob] Found ${failedAssignments.length} failed assignments to retry`);

  // Reset to QUEUED
  await prisma.tenantTemplateAssignment.updateMany({
    where: {
      id: { in: failedAssignments.map(a => a.id) }
    },
    data: { status: "QUEUED" }
  });

  // Process them
  return await processQueuedTemplateAssignments();
}
