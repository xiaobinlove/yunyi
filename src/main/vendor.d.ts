declare module "fs-extra" {
  const fsExtra: any;
  export default fsExtra;
}

declare module "tar" {
  export interface ExtractOptions {
    file: string;
    cwd: string;
    preservePaths?: boolean;
    unlink?: boolean;
    preserveOwner?: boolean;
    onwarn?: (warning: unknown) => void;
  }

  const tar: {
    extract(options: ExtractOptions): Promise<void>;
  };

  export default tar;
}
