/**
 * AI Tool Definitions for File Manipulation
 * 
 * These tools allow the AI to interact with project files.
 * Compatible with both OpenAI and Anthropic tool calling formats.
 * 
 * @author DEV-C (AI Integration)
 * @status COMPLETE - All tools defined per specs
 */

export interface ParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ParameterSchema;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required: string[];
  };
}

/**
 * Core file manipulation tools for the AI
 */
export const AI_FILE_TOOLS: ToolDefinition[] = [
  {
    name: 'list_files',
    description: `List all files in the project or a specific directory.
Returns file names, paths, sizes, and types.
Use this to understand the project structure before making changes.`,
    parameters: {
      type: 'object',
      properties: {
        path: { 
          type: 'string', 
          description: 'Directory path to list (optional, defaults to project root "/")' 
        }
      },
      required: []
    }
  },
  {
    name: 'read_file',
    description: `Read the complete contents of a file.
Use this to understand existing code before making changes.
ALWAYS read a file before updating it to ensure you have the latest version.`,
    parameters: {
      type: 'object',
      properties: {
        path: { 
          type: 'string', 
          description: 'Absolute file path starting with "/" (e.g., "/App.tsx", "/components/Header.tsx")' 
        }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: `Create a new file or completely replace an existing file with new content.
Use this for creating new files or complete rewrites.
Always provide the COMPLETE file content - never use placeholders.
Prefer update_file for modifications to existing files.`,
    parameters: {
      type: 'object',
      properties: {
        path: { 
          type: 'string', 
          description: 'Absolute file path starting with "/" (e.g., "/App.tsx")' 
        },
        content: { 
          type: 'string', 
          description: 'The complete file content to write' 
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'update_file',
    description: `Update an existing file with new content.
IMPORTANT: Provide the COMPLETE new file content, not just the changes.
Always read the file first to get the current content, then modify and return the full updated file.
Do not use placeholders like "// ... rest of the code".`,
    parameters: {
      type: 'object',
      properties: {
        path: { 
          type: 'string', 
          description: 'Path to the file to update' 
        },
        content: { 
          type: 'string', 
          description: 'Complete new file content (replaces entire file)' 
        },
        message: {
          type: 'string',
          description: 'Brief description of changes (e.g., "Added authentication check")'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'delete_file',
    description: `Delete a file from the project.
Use with caution - only delete files that are truly no longer needed.
The file can be recovered from version history if needed.`,
    parameters: {
      type: 'object',
      properties: {
        path: { 
          type: 'string', 
          description: 'Absolute file path to delete' 
        }
      },
      required: ['path']
    }
  },
  {
    name: 'move_file',
    description: `Rename or move a file to a new location.
Use this for refactoring, renaming components, or reorganizing project structure.
The file content is preserved, only the path changes.`,
    parameters: {
      type: 'object',
      properties: {
        from: { 
          type: 'string', 
          description: 'Current file path' 
        },
        to: {
          type: 'string',
          description: 'New file path'
        }
      },
      required: ['from', 'to']
    }
  },
  {
    name: 'search_files',
    description: `Search for text or patterns across all project files.
Returns matching files with line numbers and context.
Useful for finding where something is defined or used.`,
    parameters: {
      type: 'object',
      properties: {
        query: { 
          type: 'string', 
          description: 'Text or regex pattern to search for' 
        },
        glob: { 
          type: 'string', 
          description: 'File pattern to limit search (e.g., "*.tsx", "components/*.ts")' 
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_project_info',
    description: `Get project metadata including name, type, framework, and statistics.
Use this to understand the project context before suggesting changes.`,
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

/**
 * Convert our tool definitions to OpenAI function format
 */
export function toOpenAITools(tools: ToolDefinition[] = AI_FILE_TOOLS) {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }
  }));
}

/**
 * Convert our tool definitions to Anthropic tool format
 */
export function toAnthropicTools(tools: ToolDefinition[] = AI_FILE_TOOLS) {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

/**
 * Get tool by name
 */
export function getToolDefinition(name: string): ToolDefinition | undefined {
  return AI_FILE_TOOLS.find(t => t.name === name);
}

/**
 * Tool names for TypeScript typing
 */
export type ToolName = 
  | 'list_files'
  | 'read_file'
  | 'write_file'
  | 'update_file'
  | 'delete_file'
  | 'move_file'
  | 'search_files'
  | 'get_project_info';
