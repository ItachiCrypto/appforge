/**
 * AI Tool Executor
 * 
 * Executes tool calls from LLM responses.
 * Supports both:
 * - FileService for Projects (v2)
 * - LegacyFileAdapter for Apps (legacy)
 * 
 * @author DEV-C (AI Integration)
 * @updated IMPL-AI-TOOLS Agent - Added legacy App support
 */

import { getFileService, FileNotFoundError, FileAlreadyExistsError, InvalidPathError } from '@/lib/files/service'
import { getLegacyFileAdapter, LegacyFileNotFoundError, LegacyAppNotFoundError } from './legacy-adapter'
import { prisma } from '@/lib/prisma'

const fileService = getFileService()
const legacyAdapter = getLegacyFileAdapter()

// Context type to determine which backend to use
export type ToolContext = 
  | { type: 'project'; projectId: string }
  | { type: 'app'; appId: string }

// ============ Types ============

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  success: boolean;
  output?: unknown;
  error?: string;
}

export interface SearchMatch {
  line: number;
  content: string;
  matchText: string;
}

// ============ Tool Parsers ============

/**
 * Parse tool calls from Anthropic response content
 */
export function parseAnthropicToolCalls(content: unknown[]): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  
  for (const block of content) {
    if (typeof block === 'object' && block !== null && 'type' in block) {
      const typedBlock = block as { type: string; id?: string; name?: string; input?: Record<string, unknown> };
      if (typedBlock.type === 'tool_use') {
        toolCalls.push({
          id: typedBlock.id || `tool_${Date.now()}`,
          name: typedBlock.name || '',
          arguments: typedBlock.input || {},
        });
      }
    }
  }
  
  return toolCalls;
}

/**
 * Parse tool calls from OpenAI response
 */
export function parseOpenAIToolCalls(toolCalls: unknown[]): ToolCall[] {
  return toolCalls.map((call) => {
    const typedCall = call as { 
      id: string; 
      function: { name: string; arguments: string } 
    };
    return {
      id: typedCall.id,
      name: typedCall.function.name,
      arguments: JSON.parse(typedCall.function.arguments),
    };
  });
}

// ============ Tool Executor ============

/**
 * Execute a single tool call with context (Project or Legacy App)
 */
export async function executeTool(
  call: ToolCall,
  context: ToolContext
): Promise<ToolResult> {
  try {
    // Route to appropriate executor based on context type
    if (context.type === 'project') {
      return await executeToolForProject(call, context.projectId);
    } else {
      return await executeToolForLegacyApp(call, context.appId);
    }
  } catch (error) {
    // Handle specific error types
    if (error instanceof FileNotFoundError || error instanceof LegacyFileNotFoundError) {
      return {
        toolCallId: call.id,
        success: false,
        error: `File not found: ${(error as any).path}`,
      };
    }
    if (error instanceof FileAlreadyExistsError) {
      return {
        toolCallId: call.id,
        success: false,
        error: `File already exists: ${error.path}`,
      };
    }
    if (error instanceof InvalidPathError) {
      return {
        toolCallId: call.id,
        success: false,
        error: `Invalid path: ${error.reason}`,
      };
    }
    if (error instanceof LegacyAppNotFoundError) {
      return {
        toolCallId: call.id,
        success: false,
        error: `App not found: ${error.appId}`,
      };
    }
    
    return {
      toolCallId: call.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute tool for Project (v2) using FileService
 */
async function executeToolForProject(
  call: ToolCall,
  projectId: string
): Promise<ToolResult> {
  switch (call.name) {
    case 'list_files': {
      const path = (call.arguments.path as string) || '/';
      const files = await fileService.listFiles(projectId, path);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          files: files.map(f => ({
            name: f.filename,
            path: f.path,
            type: f.isDirectory ? 'directory' : 'file',
            size: f.sizeBytes,
            extension: f.extension,
          })),
          count: files.length,
        },
      };
    }

    case 'read_file': {
      const path = call.arguments.path as string;
      if (!path) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameter: path',
        };
      }
      const content = await fileService.readFile(projectId, path);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          path,
          content,
          size: Buffer.byteLength(content, 'utf8'),
        },
      };
    }

    case 'write_file': {
      const path = call.arguments.path as string;
      const content = call.arguments.content as string;
      if (!path || content === undefined) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameters: path and content',
        };
      }
      const file = await fileService.upsertFile(projectId, path, content);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          path: file.file.path,
          created: file.created,
          size: file.file.sizeBytes,
          message: file.created 
            ? `Created file: ${path}` 
            : `Updated file: ${path}`,
        },
      };
    }

    case 'update_file': {
      const path = call.arguments.path as string;
      const content = call.arguments.content as string;
      const message = call.arguments.message as string | undefined;
      if (!path || content === undefined) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameters: path and content',
        };
      }
      const file = await fileService.updateFile(projectId, path, content, { changeMessage: message });
      return {
        toolCallId: call.id,
        success: true,
        output: {
          path: file.path,
          size: file.sizeBytes,
          message: `Updated file: ${path}`,
        },
      };
    }

    case 'delete_file': {
      const path = call.arguments.path as string;
      if (!path) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameter: path',
        };
      }
      await fileService.deleteFile(projectId, path);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          path,
          message: `Deleted file: ${path}`,
        },
      };
    }

    case 'move_file': {
      const from = call.arguments.from as string;
      const to = call.arguments.to as string;
      if (!from || !to) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameters: from and to',
        };
      }
      const file = await fileService.renameFile(projectId, from, to);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          from,
          to: file.path,
          message: `Moved ${from} → ${to}`,
        },
      };
    }

    case 'search_files': {
      const query = call.arguments.query as string;
      const glob = call.arguments.glob as string | undefined;
      if (!query) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameter: query',
        };
      }
      const results = await fileService.searchFiles(projectId, query, glob);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          query,
          matches: results,
          totalFiles: results.length,
          totalMatches: results.reduce((acc, r) => acc + r.totalMatches, 0),
        },
      };
    }

    case 'get_project_info': {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          type: true,
          framework: true,
          status: true,
          fileCount: true,
          totalSizeBytes: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      if (!project) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Project not found',
        };
      }
      
      return {
        toolCallId: call.id,
        success: true,
        output: {
          ...project,
          totalSizeBytes: Number(project.totalSizeBytes),
        },
      };
    }

    default:
      return {
        toolCallId: call.id,
        success: false,
        error: `Unknown tool: ${call.name}`,
      };
  }
}

/**
 * Execute tool for Legacy App using LegacyFileAdapter
 */
async function executeToolForLegacyApp(
  call: ToolCall,
  appId: string
): Promise<ToolResult> {
  switch (call.name) {
    case 'list_files': {
      const path = (call.arguments.path as string) || '/';
      const files = await legacyAdapter.listFiles(appId, path);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          files: files.map(f => ({
            name: f.filename,
            path: f.path,
            type: f.isDirectory ? 'directory' : 'file',
            size: f.sizeBytes,
            extension: f.extension,
          })),
          count: files.length,
        },
      };
    }

    case 'read_file': {
      const path = call.arguments.path as string;
      if (!path) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameter: path',
        };
      }
      const content = await legacyAdapter.readFile(appId, path);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          path,
          content,
          size: Buffer.byteLength(content, 'utf8'),
        },
      };
    }

    case 'write_file': {
      // FIX BUG #11: Validate types before casting
      const rawPath = call.arguments.path
      const rawContent = call.arguments.content
      
      if (typeof rawPath !== 'string' || !rawPath.trim()) {
        return {
          toolCallId: call.id,
          success: false,
          error: `Invalid path: expected non-empty string, got ${typeof rawPath} (value: ${JSON.stringify(rawPath)?.substring(0, 100)})`,
        };
      }
      
      if (typeof rawContent !== 'string') {
        return {
          toolCallId: call.id,
          success: false,
          error: `Invalid content: expected string, got ${typeof rawContent}`,
        };
      }
      
      const path = rawPath.trim()
      const content = rawContent
      
      const result = await legacyAdapter.writeFile(appId, path, content);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          path,
          created: result.created,
          size: Buffer.byteLength(content, 'utf8'),
          message: result.created 
            ? `Created file: ${path}` 
            : `Updated file: ${path}`,
        },
      };
    }

    case 'update_file': {
      const path = call.arguments.path as string;
      const content = call.arguments.content as string;
      if (!path || content === undefined) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameters: path and content',
        };
      }
      await legacyAdapter.updateFile(appId, path, content);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          path,
          size: Buffer.byteLength(content, 'utf8'),
          message: `Updated file: ${path}`,
        },
      };
    }

    case 'delete_file': {
      const path = call.arguments.path as string;
      if (!path) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameter: path',
        };
      }
      await legacyAdapter.deleteFile(appId, path);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          path,
          message: `Deleted file: ${path}`,
        },
      };
    }

    case 'move_file': {
      const from = call.arguments.from as string;
      const to = call.arguments.to as string;
      if (!from || !to) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameters: from and to',
        };
      }
      await legacyAdapter.renameFile(appId, from, to);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          from,
          to,
          message: `Moved ${from} → ${to}`,
        },
      };
    }

    case 'search_files': {
      const query = call.arguments.query as string;
      const glob = call.arguments.glob as string | undefined;
      if (!query) {
        return {
          toolCallId: call.id,
          success: false,
          error: 'Missing required parameter: query',
        };
      }
      const results = await legacyAdapter.searchFiles(appId, query, glob);
      return {
        toolCallId: call.id,
        success: true,
        output: {
          query,
          matches: results,
          totalFiles: results.length,
          totalMatches: results.reduce((acc, r) => acc + r.totalMatches, 0),
        },
      };
    }

    case 'get_project_info': {
      const info = await legacyAdapter.getAppInfo(appId);
      return {
        toolCallId: call.id,
        success: true,
        output: info,
      };
    }

    default:
      return {
        toolCallId: call.id,
        success: false,
        error: `Unknown tool: ${call.name}`,
      };
  }
}

/**
 * Execute multiple tool calls SEQUENTIALLY
 * FIX BUG #10: Sequential execution prevents race conditions when multiple
 * write_file calls happen in parallel (each reads DB, modifies, writes back)
 */
export async function executeTools(
  calls: ToolCall[],
  context: ToolContext
): Promise<ToolResult[]> {
  const results: ToolResult[] = []
  for (const call of calls) {
    const result = await executeTool(call, context)
    results.push(result)
  }
  return results
}

/**
 * Helper to create context from projectId (backward compatibility)
 */
export function createProjectContext(projectId: string): ToolContext {
  return { type: 'project', projectId };
}

/**
 * Helper to create context from appId
 */
export function createAppContext(appId: string): ToolContext {
  return { type: 'app', appId };
}

// ============ Result Formatters ============

/**
 * Format tool results for sending back to Anthropic
 */
export function formatAnthropicToolResults(results: ToolResult[]) {
  return results.map(result => ({
    type: 'tool_result' as const,
    tool_use_id: result.toolCallId,
    content: result.success 
      ? JSON.stringify(result.output, null, 2)
      : `Error: ${result.error}`,
    is_error: !result.success,
  }));
}

/**
 * Format tool results for sending back to OpenAI
 */
export function formatOpenAIToolResults(results: ToolResult[]) {
  return results.map(result => ({
    role: 'tool' as const,
    tool_call_id: result.toolCallId,
    content: result.success 
      ? JSON.stringify(result.output, null, 2)
      : `Error: ${result.error}`,
  }));
}
