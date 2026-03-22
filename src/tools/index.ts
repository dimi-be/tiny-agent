import {
  CreateDirectoryArgs,
  createDirectoryTool,
} from "./create-directory-tool.js";
import { CreateFileArgs, createFileTool } from "./create-file-tool.js";
import {
  DeleteDirectoryArgs,
  deleteDirectoryTool,
} from "./delete-directory-tool.js";
import { DeleteFileArgs, deleteFileTool } from "./delete-file-tool.js";
import { ListAllFilesArgs, listAllFilesTool } from "./list-all-files-tool.js";
import { ListDirectoryArgs, listDirectoryTool } from "./list-directory-tool.js";
import { ReadFileArgs, readFileTool } from "./read-file-tool.js";
import { SearchFileArgs, searchFileTool } from "./search-file-tool.js";
import { ShellArgs, shellTool } from "./shell-tool.js";
import { WriteFileArgs, writeFileTool } from "./write-file-tool.js";
import * as state from "../utils/state.js";
import { ChatCompletionFunctionTool } from "openai/resources";
import { SearchFilesArgs, searchFilesTool } from "./search-files-tool.js";

export function setYolo(yolo: boolean): void {
  state.setYolo(yolo);
}

export function setPlainText(plainText: boolean): void {
  state.setPlainText(plainText);
}

export const schemas: ChatCompletionFunctionTool[] = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Returns the full text content of a file.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" },
        },
        required: ["filePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_file",
      description:
        "Searches for a string in and returns matches with line numbers.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string" },
          filePath: { type: "string" },
        },
        required: ["pattern", "filePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_files",
      description:
        "Search for a text pattern across multiple files in the workspace. Returns file paths, line numbers, and matching snippets. Respecting .gitignore or if no .gitignore is present hides hidden files, node_modules, dist, buid and package-lock.json",
      parameters: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description:
              "The regex or text string to search for (e.g., 'function login').",
          },
          include: {
            type: "string",
            description:
              "Optional glob pattern to limit the search (e.g., 'src/**/*.ts'). Defaults to all files.",
          },
        },
        required: ["pattern"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "Lists files and directories in a specific directory.",
      parameters: {
        type: "object",
        properties: {
          dirPath: {
            type: "string",
            description:
              "The directory to list. Defaults to '.' (current directory).",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_all_files",
      description:
        "Lists directory structure recursively, respecting .gitignore and hiding hidden files/node_modules.",
      parameters: {
        type: "object",
        properties: {
          dirPath: {
            type: "string",
            description:
              "The directory to list. Defaults to '.' (current directory).",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Writes a new file or overwrites an existing one. Automatically creates directories. If the file already exists, it MUST be read first using the 'read_file' tool.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" },
          content: { type: "string" },
        },
        required: ["filePath", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_directory",
      description: "Creates a new directory.",
      parameters: {
        type: "object",
        properties: {
          dirPath: { type: "string" },
        },
        required: ["dirPath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_file",
      description: "Creates an empty file or updates the timestamp.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" },
        },
        required: ["filePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Deletes a file.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string" },
        },
        required: ["filePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_directory",
      description: "Deletes a directory recursively.",
      parameters: {
        type: "object",
        properties: {
          dirPath: { type: "string" },
        },
        required: ["dirPath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "shell",
      description: "Runs a whitelisted shell command (npm or npx).",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
        },
        required: ["command"],
      },
    },
  },
];

export interface ToolHandlerMap {
  [key: string]: (args: any) => Promise<string>;
}

export const handlers: ToolHandlerMap = {
  read_file: async (args: ReadFileArgs) => await readFileTool(args),
  search_file: async (args: SearchFileArgs) => await searchFileTool(args),
  search_files: async (args: SearchFilesArgs) => await searchFilesTool(args),
  list_directory: async (args: ListDirectoryArgs) =>
    await listDirectoryTool(args),
  list_all_files: async (args: ListAllFilesArgs) =>
    await listAllFilesTool(args),
  write_file: async (args: WriteFileArgs) => await writeFileTool(args),
  create_directory: async (args: CreateDirectoryArgs) =>
    await createDirectoryTool(args),
  create_file: async (args: CreateFileArgs) => await createFileTool(args),
  delete_file: async (args: DeleteFileArgs) => await deleteFileTool(args),
  delete_directory: async (args: DeleteDirectoryArgs) =>
    await deleteDirectoryTool(args),
  shell: async (args: ShellArgs) => await shellTool(args),
};
