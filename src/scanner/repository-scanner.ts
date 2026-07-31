import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  DocumentationKind,
  RepositoryModel,
  ScannedFile,
} from '../models/repository-model';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.next',
  'build',
]);

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.java',
  '.go',
  '.rs',
  '.cs',
  '.php',
  '.rb',
  '.swift',
  '.c',
  '.cpp',
  '.h',
  '.hpp',
  '.sh',
  '.yaml',
  '.yml',
]);

const METADATA_FILENAMES = new Set([
  'package.json',
  'tsconfig.json',
  'jsconfig.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.nvmrc',
  '.editorconfig',
]);

export class RepositoryScanner {
  constructor(private readonly rootPath: string) {}

  async scanRepository(): Promise<RepositoryModel> {
    const absoluteRoot = path.resolve(this.rootPath);
    const scannedFiles = await this.walkDirectory(absoluteRoot);

    const sourceFiles: ScannedFile[] = [];
    const documentationFiles: ScannedFile[] = [];
    const metadataFiles: ScannedFile[] = [];

    for (const scannedFile of scannedFiles) {
      if (scannedFile.kind === 'source') {
        sourceFiles.push(scannedFile);
      } else if (scannedFile.kind === 'documentation') {
        documentationFiles.push(scannedFile);
      } else {
        metadataFiles.push(scannedFile);
      }
    }

    return {
      rootPath: absoluteRoot,
      sourceFiles,
      documentationFiles,
      metadataFiles,
      summary: {
        sourceCount: sourceFiles.length,
        documentationCount: documentationFiles.length,
        metadataCount: metadataFiles.length,
        totalFiles: scannedFiles.length,
      },
    };
  }

  private async walkDirectory(currentDirectory: string): Promise<ScannedFile[]> {
    const entries = await fs.readdir(currentDirectory, { withFileTypes: true });
    const results: ScannedFile[] = [];

    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }

        const nestedFiles = await this.walkDirectory(entryPath);
        results.push(...nestedFiles);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const relativePath = path.relative(this.rootPath, entryPath).split(path.sep).join('/');
      const scannedFile = await this.classifyFile(entryPath, relativePath);
      results.push(scannedFile);
    }

    return results;
  }

  private async classifyFile(filePath: string, relativePath: string): Promise<ScannedFile> {
    const extension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();
    const contentHash = await this.computeFileHash(filePath);

    if (METADATA_FILENAMES.has(fileName)) {
      return {
        path: filePath,
        relativePath,
        kind: 'metadata',
        extension,
        contentHash,
      };
    }

    const documentationKind = this.getDocumentationKind(relativePath, fileName);
    if (documentationKind !== undefined) {
      return {
        path: filePath,
        relativePath,
        kind: 'documentation',
        documentationKind,
        extension,
        contentHash,
      };
    }

    if (SOURCE_EXTENSIONS.has(extension)) {
      return {
        path: filePath,
        relativePath,
        kind: 'source',
        extension,
        contentHash,
      };
    }

    return {
      path: filePath,
      relativePath,
      kind: 'metadata',
      extension,
      contentHash,
    };
  }

  private async computeFileHash(filePath: string): Promise<string> {
    const fileContents = await fs.readFile(filePath);
    return createHash('sha256').update(fileContents).digest('hex');
  }

  private getDocumentationKind(relativePath: string, fileName: string): DocumentationKind | undefined {
    const normalizedPath = relativePath.toLowerCase();

    if (fileName === 'readme.md') {
      return 'readme';
    }

    if (fileName === 'changelog.md') {
      return 'changelog';
    }

    if (normalizedPath.startsWith('architecture/') || normalizedPath.includes('/architecture/')) {
      return 'architecture';
    }

    if (normalizedPath.startsWith('docs/')) {
      if (normalizedPath.includes('/api/')) {
        return 'api';
      }

      return 'docs';
    }

    if (normalizedPath.includes('/docs/')) {
      return 'docs';
    }

    if (normalizedPath.includes('/api/') || normalizedPath.includes('api-')) {
      return 'api';
    }

    if (normalizedPath.includes('/design/')) {
      return 'architecture';
    }

    return undefined;
  }
}
