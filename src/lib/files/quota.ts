/**
 * Storage Quota Management
 * 
 * Manages storage quotas per plan and tracks usage.
 * Uses the new v2 schema with storageUsedBytes/storageQuotaBytes on User.
 */

import { prisma } from '@/lib/prisma'
import { Plan } from '@prisma/client'

export type { Plan }

/**
 * Quota configuration per plan
 * Based on ARCHITECT-NOTES.md specifications
 * Updated with v2 limits from brainstorm
 */
export const PLAN_QUOTAS = {
  FREE: {
    maxProjects: 3,
    storageBytes: 100 * 1024 * 1024,        // 100 MB
    monthlyCredits: 1000,
    maxFileSize: 5 * 1024 * 1024,           // 5 MB per file
    canDeploy: false,
    canCustomDomain: false,
    maxTeamMembers: 1,
    // v2 additions
    maxFilesPerProject: 100,                // Évite spam
    maxAIRequestsPerHour: 20,               // Rate limiting AI
    allowedProjectTypes: ['NEXTJS', 'REACT', 'VUE', 'SVELTE', 'STATIC', 'EXPRESS', 'API'],
  },
  STARTER: {
    // Legacy plan - same as FREE
    maxProjects: 3,
    storageBytes: 100 * 1024 * 1024,
    monthlyCredits: 1000,
    maxFileSize: 5 * 1024 * 1024,
    canDeploy: false,
    canCustomDomain: false,
    maxTeamMembers: 1,
    maxFilesPerProject: 100,
    maxAIRequestsPerHour: 20,
    allowedProjectTypes: ['NEXTJS', 'REACT', 'VUE', 'SVELTE', 'STATIC', 'EXPRESS', 'API'],
  },
  PRO: {
    maxProjects: 20,
    storageBytes: 5 * 1024 * 1024 * 1024,   // 5 GB
    monthlyCredits: 10000,
    maxFileSize: 50 * 1024 * 1024,          // 50 MB per file
    canDeploy: true,
    canCustomDomain: true,
    maxTeamMembers: 1,
    // v2 additions
    maxFilesPerProject: 1000,
    maxAIRequestsPerHour: 100,
    allowedProjectTypes: ['NEXTJS', 'REACT', 'VUE', 'SVELTE', 'STATIC', 'EXPRESS', 'API', 
                          'PYTHON', 'FASTAPI', 'FLASK', 'DJANGO', 'REACT_NATIVE'],
  },
  TEAM: {
    maxProjects: 100,
    storageBytes: 50 * 1024 * 1024 * 1024,  // 50 GB
    monthlyCredits: 50000,
    maxFileSize: 100 * 1024 * 1024,         // 100 MB per file
    canDeploy: true,
    canCustomDomain: true,
    maxTeamMembers: 10,
    // v2 additions
    maxFilesPerProject: 5000,
    maxAIRequestsPerHour: 500,
    allowedProjectTypes: '*' as const,      // All types
  },
  ENTERPRISE: {
    maxProjects: Infinity,
    storageBytes: Infinity,
    monthlyCredits: Infinity,
    maxFileSize: Infinity,
    canDeploy: true,
    canCustomDomain: true,
    maxTeamMembers: Infinity,
    // v2 additions
    maxFilesPerProject: Infinity,
    maxAIRequestsPerHour: Infinity,
    allowedProjectTypes: '*' as const,
  },
} as const

export type PlanQuota = typeof PLAN_QUOTAS[Plan]

/**
 * Get quota configuration for a plan
 */
export function getPlanQuota(plan: Plan): PlanQuota {
  return PLAN_QUOTAS[plan]
}

/**
 * Quota check result
 */
export interface QuotaCheckResult {
  allowed: boolean
  currentUsage: bigint
  quota: bigint
  remaining: bigint
  percentUsed: number
  plan: Plan
}

/**
 * Check if user can add additional bytes to their storage
 */
export async function checkStorageQuota(
  userId: string,
  additionalBytes: number
): Promise<QuotaCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      plan: true,
      storageUsedBytes: true,
      storageQuotaBytes: true,
    },
  })
  
  if (!user) {
    throw new UserNotFoundError(userId)
  }
  
  const plan = user.plan
  const currentUsage = user.storageUsedBytes
  const quota = user.storageQuotaBytes
  
  const newTotal = currentUsage + BigInt(additionalBytes)
  const allowed = newTotal <= quota
  const remaining = quota - currentUsage
  const percentUsed = quota > BigInt(0)
    ? Number((currentUsage * BigInt(100)) / quota)
    : 0
  
  return {
    allowed,
    currentUsage,
    quota,
    remaining: remaining > BigInt(0) ? remaining : BigInt(0),
    percentUsed,
    plan,
  }
}

/**
 * Check if a single file exceeds the plan's max file size
 */
export async function checkFileSizeLimit(
  userId: string,
  fileSize: number
): Promise<{ allowed: boolean; maxSize: number; plan: Plan }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })
  
  if (!user) {
    throw new UserNotFoundError(userId)
  }
  
  const plan = user.plan
  const planQuota = getPlanQuota(plan)
  
  return {
    allowed: planQuota.maxFileSize === Infinity || fileSize <= planQuota.maxFileSize,
    maxSize: planQuota.maxFileSize === Infinity ? Number.MAX_SAFE_INTEGER : planQuota.maxFileSize,
    plan,
  }
}

/**
 * Check if user can create more projects
 */
export async function checkProjectLimit(
  userId: string
): Promise<{ allowed: boolean; current: number; max: number; plan: Plan }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })
  
  if (!user) {
    throw new UserNotFoundError(userId)
  }
  
  const plan = user.plan
  const planQuota = getPlanQuota(plan)
  
  // Count projects for this user
  const currentProjects = await prisma.project.count({
    where: { userId },
  })
  
  return {
    allowed: planQuota.maxProjects === Infinity || currentProjects < planQuota.maxProjects,
    current: currentProjects,
    max: planQuota.maxProjects === Infinity ? Number.MAX_SAFE_INTEGER : planQuota.maxProjects,
    plan,
  }
}

/**
 * Calculate total storage usage for a user from files
 */
async function calculateUserStorageUsage(userId: string): Promise<bigint> {
  const result = await prisma.file.aggregate({
    where: { project: { userId } },
    _sum: { sizeBytes: true },
  })
  
  return BigInt(result._sum.sizeBytes || 0)
}

/**
 * Update cached storage usage for a user
 * Called after file operations to keep the cached value in sync
 */
export async function updateStorageUsage(userId: string): Promise<bigint> {
  const totalSize = await calculateUserStorageUsage(userId)
  
  await prisma.user.update({
    where: { id: userId },
    data: { storageUsedBytes: totalSize },
  })
  
  return totalSize
}

/**
 * Get detailed storage usage breakdown for a user
 */
export async function getStorageBreakdown(userId: string): Promise<{
  total: bigint
  quota: bigint
  percentUsed: number
  plan: Plan
  byProject: Array<{ projectId: string; projectName: string; bytes: bigint }>
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      plan: true,
      storageUsedBytes: true,
      storageQuotaBytes: true,
    },
  })
  
  if (!user) {
    throw new UserNotFoundError(userId)
  }
  
  // Get per-project breakdown
  const projects = await prisma.project.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      totalSizeBytes: true,
    },
  })
  
  const byProject = projects.map(p => ({
    projectId: p.id,
    projectName: p.name,
    bytes: p.totalSizeBytes,
  }))
  
  const percentUsed = user.storageQuotaBytes > BigInt(0)
    ? Number((user.storageUsedBytes * BigInt(100)) / user.storageQuotaBytes)
    : 0
  
  return {
    total: user.storageUsedBytes,
    quota: user.storageQuotaBytes,
    percentUsed,
    plan: user.plan,
    byProject,
  }
}

/**
 * Update user's quota based on their plan
 * Should be called when user upgrades/downgrades
 */
export async function syncUserQuotaWithPlan(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })
  
  if (!user) {
    throw new UserNotFoundError(userId)
  }
  
  const planQuota = getPlanQuota(user.plan)
  const quotaBytes = planQuota.storageBytes === Infinity
    ? BigInt(Number.MAX_SAFE_INTEGER)
    : BigInt(planQuota.storageBytes)
  
  await prisma.user.update({
    where: { id: userId },
    data: { storageQuotaBytes: quotaBytes },
  })
}

// ============ Custom Errors ============

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`)
    this.name = 'UserNotFoundError'
  }
}

export class QuotaExceededError extends Error {
  result: QuotaCheckResult
  
  constructor(result: QuotaCheckResult) {
    const usedMB = Number(result.currentUsage) / (1024 * 1024)
    const quotaMB = Number(result.quota) / (1024 * 1024)
    super(`Storage quota exceeded: ${usedMB.toFixed(1)}MB / ${quotaMB.toFixed(1)}MB (${result.percentUsed}%)`)
    this.name = 'QuotaExceededError'
    this.result = result
  }
}

export class FileSizeExceededError extends Error {
  fileSize: number
  maxSize: number
  
  constructor(fileSize: number, maxSize: number) {
    const fileMB = fileSize / (1024 * 1024)
    const maxMB = maxSize / (1024 * 1024)
    super(`File size ${fileMB.toFixed(1)}MB exceeds limit of ${maxMB.toFixed(1)}MB`)
    this.name = 'FileSizeExceededError'
    this.fileSize = fileSize
    this.maxSize = maxSize
  }
}

export class ProjectLimitExceededError extends Error {
  current: number
  max: number
  
  constructor(current: number, max: number) {
    super(`Project limit reached: ${current}/${max} projects`)
    this.name = 'ProjectLimitExceededError'
    this.current = current
    this.max = max
  }
}

export class ProjectTypeNotAllowedError extends Error {
  projectType: string
  plan: Plan
  
  constructor(projectType: string, plan: Plan) {
    super(`Project type "${projectType}" is not allowed on plan "${plan}". Upgrade to access this feature.`)
    this.name = 'ProjectTypeNotAllowedError'
    this.projectType = projectType
    this.plan = plan
  }
}

/**
 * Check if a project type is allowed for a user's plan
 */
export async function checkProjectTypeAllowed(
  userId: string,
  projectType: string
): Promise<{ allowed: boolean; plan: Plan; allowedTypes: readonly string[] | '*' }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })
  
  if (!user) {
    throw new UserNotFoundError(userId)
  }
  
  const plan = user.plan
  const planQuota = getPlanQuota(plan)
  const allowedTypes = planQuota.allowedProjectTypes
  
  const allowed = allowedTypes === '*' || 
    (Array.isArray(allowedTypes) && allowedTypes.includes(projectType))
  
  return {
    allowed,
    plan,
    allowedTypes,
  }
}

/**
 * Check if user can add more files to a project
 */
export async function checkFileCountLimit(
  userId: string,
  projectId: string
): Promise<{ allowed: boolean; current: number; max: number; plan: Plan }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })
  
  if (!user) {
    throw new UserNotFoundError(userId)
  }
  
  const plan = user.plan
  const planQuota = getPlanQuota(plan)
  
  // Count files in this project
  const currentFiles = await prisma.file.count({
    where: { projectId },
  })
  
  const maxFiles = planQuota.maxFilesPerProject === Infinity 
    ? Number.MAX_SAFE_INTEGER 
    : planQuota.maxFilesPerProject
  
  return {
    allowed: planQuota.maxFilesPerProject === Infinity || currentFiles < planQuota.maxFilesPerProject,
    current: currentFiles,
    max: maxFiles,
    plan,
  }
}
