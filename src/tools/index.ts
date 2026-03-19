import * as filesystem from './filesystem/index.js';
import * as system from './system.js';
import * as state from '../utils/state.js';
import {
  ReadArgs,
  GrepArgs,
  LsArgs,
  TreeArgs,
  WriteArgs,
  MkdirArgs,
  TouchArgs,
  RmArgs,
  NpmArgs,
  ToolHandlerMap
} from './types.js';

export function setYolo(yolo: boolean): void {
  state.setYolo(yolo);
}

export function setPlainText(plainText: boolean): void {
  state.setPlainText(plainText);
}

export const schemas = [
  {
    type: "function",
    function: {
      name: "read",
      description: "Returns the full text content of a file.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" }
        },
        required: ["filePath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "grep",
      description: "Searches for a string and returns matches with line numbers.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string" },
          filePath: { type: "string" }
        },
        required: ["pattern", "filePath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ls",
      description: "Lists files and directories in a specific directory (one at a time).",
      parameters: {
        type: "object",
        properties: {
          dirPath: { type: "string", description: "The directory to list. Defaults to '.' (current directory)." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "tree",
      description: "Lists directory structure recursively, respecting .gitignore and hiding hidden files/node_modules.",
      parameters: {
        type: "object",
        properties: {
          dirPath: { type: "string", description: "The directory to list. Defaults to '.' (current directory)." }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write",
      description: "Writes a new file or overwrites an existing one. Automatically creates directories. If the file already exists, it MUST be read first using the 'read' tool.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" },
          content: { type: "string" }
        },
        required: ["filePath", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "mkdir",
      description: "Creates a new directory.",
      parameters: {
        type: "object",
        properties: {
          dirPath: { type: "string" }
        },
        required: ["dirPath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "touch",
      description: "Creates an empty file or updates the timestamp.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" }
        },
        required: ["filePath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "rm",
      description: "Deletes a file or directory.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" },
          recursive: { type: "boolean" }
        },
        required: ["filePath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "npm",
      description: "Runs an npm command.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" }
        },
        required: ["command"]
      }
    }
  }
];

export const handlers: ToolHandlerMap = {
  read: async (args: ReadArgs) => await filesystem.readFileTool(args.filePath),
  grep: async (args: GrepArgs) => await filesystem.grepTool(args.pattern, args.filePath),
  ls: async (args: LsArgs) => await filesystem.lsTool(args.dirPath),
  tree: async (args: TreeArgs) => await filesystem.treeTool(args.dirPath),
  write: async (args: WriteArgs) => await filesystem.writeTool(args.filePath, args.content),
  mkdir: async (args: MkdirArgs) => await filesystem.mkdirTool(args.dirPath),
  touch: async (args: TouchArgs) => await filesystem.touchTool(args.filePath),
  rm: async (args: RmArgs) => await filesystem.rmTool(args.filePath, args.recursive || false),
  npm: async (args: NpmArgs) => await system.npmTool(args.command)
};
