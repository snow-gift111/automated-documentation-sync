export type DocumentationKind =
  | 'readme'
  | 'docs'
  | 'api'
  | 'architecture'
  | 'changelog'
  | 'other';

export type RepositoryFileKind = 'source' | 'documentation' | 'metadata';

export interface ScannedFile {
  path: string;
  relativePath: string;
  kind: RepositoryFileKind;
  documentationKind?: DocumentationKind;
  extension: string;
  contentHash?: string;
}

export interface RepositoryModel {
  rootPath: string;
  sourceFiles: ScannedFile[];
  documentationFiles: ScannedFile[];
  metadataFiles: ScannedFile[];
  summary: {
    sourceCount: number;
    documentationCount: number;
    metadataCount: number;
    totalFiles: number;
  };
}
