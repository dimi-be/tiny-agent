import { createDirectoryTool } from "./create-directory-tool.js";
import { createFileTool } from "./create-file-tool.js";
import { deleteDirectoryTool } from "./delete-directory-tool.js";
import { deleteFileTool } from "./delete-file-tool.js";
import { listAllFilesTool } from "./list-all-files-tool.js";
import { listDirectoryTool } from "./list-directory-tool.js";
import { readFileTool } from "./read-file-tool.js";
import { searchFileTool } from "./search-file-tool.js";
import { shellTool } from "./shell-tool.js";
import { writeFileTool } from "./write-file-tool.js";
import * as state from "../utils/state.js";

import {
  ReadFileArgs,
  SearchFileArgs,
  ListDirectoryArgs,
  ListAllFilesArgs,
  WriteFileArgs,
  CreateDirectoryArgs,
  CreateFileArgs,
  DeleteFileArgs,
  DeleteDirectoryArgs,
  ShellArgs,
  ToolHandlerMap,
} from "./types.js";
import OpenAI from "openai";

export function setYolo(yolo: boolean): void {
  state.setYolo(yolo);
}

export function setPlainText(plainText: boolean): void {
  state.setPlainText(plainText);
}

export const schemas: OpenAI.Chat.Completions.ChatCompletionFunctionTool[] = [
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
        "Searches for a string and returns matches with line numbers.",
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

export const handlers: ToolHandlerMap = {
  read_file: async (args: ReadFileArgs) => await readFileTool(args.filePath),
  search_file: async (args: SearchFileArgs) =>
    await searchFileTool(args.pattern, args.filePath),
  list_directory: async (args: ListDirectoryArgs) =>
    await listDirectoryTool(args.dirPath),
  list_all_files: async (args: ListAllFilesArgs) =>
    await listAllFilesTool(args.dirPath),
  write_file: async (args: WriteFileArgs) =>
    await writeFileTool(args.filePath, args.content),
  create_directory: async (args: CreateDirectoryArgs) =>
    await createDirectoryTool(args.dirPath),
  create_file: async (args: CreateFileArgs) =>
    await createFileTool(args.filePath),
  delete_file: async (args: DeleteFileArgs) =>
    await deleteFileTool(args.filePath),
  delete_directory: async (args: DeleteDirectoryArgs) =>
    await deleteDirectoryTool(args.dirPath),
  shell: async (args: ShellArgs) => await shellTool(args.command),
};
