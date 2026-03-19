export interface ReadArgs {
  filePath: string;
}

export interface GrepArgs {
  pattern: string;
  filePath: string;
}

export interface LsArgs {
  dirPath?: string;
}

export interface TreeArgs {
  dirPath?: string;
}

export interface WriteArgs {
  filePath: string;
  content: string;
}

export interface MkdirArgs {
  dirPath: string;
}

export interface TouchArgs {
  filePath: string;
}

export interface RmArgs {
  filePath: string;
  recursive?: boolean;
}

export interface NpmArgs {
  command: string;
}

export interface ToolHandlerMap {
  [key: string]: (args: any) => Promise<string>;
}
