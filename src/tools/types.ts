export interface ReadFileArgs {
  filePath: string;
}

export interface SearchFileArgs {
  pattern: string;
  filePath: string;
}

export interface ListDirectoryArgs {
  dirPath?: string;
}

export interface ListAllFilesArgs {
  dirPath?: string;
}

export interface WriteFileArgs {
  filePath: string;
  content: string;
}

export interface CreateDirectoryArgs {
  dirPath: string;
}

export interface CreateFileArgs {
  filePath: string;
}

export interface DeleteFileArgs {
  filePath: string;
}

export interface DeleteDirectoryArgs {
  dirPath: string;
}

export interface ShellArgs {
  command: string;
}

export interface ToolHandlerMap {
  [key: string]: (args: any) => Promise<string>;
}
