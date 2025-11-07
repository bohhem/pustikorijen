import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { spawn } from 'child_process';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { createHash } from 'crypto';
import prisma from '../utils/prisma';
import { getErrorMessage } from '../utils/error.util';

const WORKER_ENABLED = (process.env.BACKUP_WORKER_ENABLED ?? 'true').toLowerCase() !== 'false';
const POLL_INTERVAL_MS = Number(process.env.BACKUP_WORKER_POLL_MS ?? '5000');
const STORAGE_ROOT = path.resolve(process.env.BACKUP_STORAGE_DIR ?? path.join(process.cwd(), '..', 'backups'));

function normalizeDatabaseUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }
  const [base] = url.split('?');
  return base ?? null;
}

const BACKUP_DATABASE_URL = normalizeDatabaseUrl(process.env.BACKUP_DATABASE_URL ?? process.env.DATABASE_URL);

let isProcessing = false;
let intervalId: NodeJS.Timeout | null = null;

async function ensureStorageRoot() {
  await fsPromises.mkdir(STORAGE_ROOT, { recursive: true });
}

async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function createDatabaseArchive(snapshotId: string) {
  if (!BACKUP_DATABASE_URL) {
    throw new Error('BACKUP_DATABASE_URL is not configured');
  }

  await ensureStorageRoot();
  const backupDir = path.join(STORAGE_ROOT, snapshotId);
  await fsPromises.mkdir(backupDir, { recursive: true });

  const gzipPath = path.join(backupDir, 'database.sql.gz');
  await fsPromises.rm(gzipPath, { force: true });

  let stderrBuffer = '';
  const dumpProcess = spawn('pg_dump', ['--no-owner', '--no-acl', `--dbname=${BACKUP_DATABASE_URL}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  dumpProcess.stderr?.setEncoding('utf8');
  dumpProcess.stderr?.on('data', (chunk) => {
    stderrBuffer += chunk;
  });

  const gzip = zlib.createGzip();
  const writeStream = fs.createWriteStream(gzipPath);

  const stdout = dumpProcess.stdout;
  if (!stdout) {
    throw new Error('Unable to read pg_dump output stream');
  }

  await Promise.all([
    pipeline(stdout, gzip, writeStream),
    new Promise<void>((resolve, reject) => {
      dumpProcess.on('error', reject);
      dumpProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderrBuffer.trim() || `pg_dump exited with code ${code}`));
        }
      });
    }),
  ]);

  const stats = await fsPromises.stat(gzipPath);
  const checksum = await hashFile(gzipPath);

  return {
    path: gzipPath,
    sizeBytes: stats.size,
    checksum,
  };
}

function buildManifest({
  snapshotId,
  includeMedia,
  archivePath,
  sizeBytes,
  checksum,
}: {
  snapshotId: string;
  includeMedia: boolean;
  archivePath: string;
  sizeBytes: number;
  checksum: string;
}) {
  return {
    version: '1.0',
    backupId: snapshotId,
    generatedAt: new Date().toISOString(),
    includeMedia,
    database: {
      file: path.basename(archivePath),
      storagePath: archivePath,
      sizeBytes,
      checksum,
    },
    media: includeMedia
      ? [
          {
            note: 'Media backup requested but not implemented in this environment.',
          },
        ]
      : [],
  };
}

async function processPendingBackup() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;
  try {
    const pending = await prisma.backup_snapshots.findFirst({
      where: { status: { in: ['QUEUED', 'RUNNING'] } },
      orderBy: { started_at: 'asc' },
    });

    if (!pending) {
      return;
    }

    const baseMetadata = ((pending.metadata as Record<string, unknown>) ?? {});

    if (pending.status === 'QUEUED') {
      await prisma.backup_snapshots.update({
        where: { backup_id: pending.backup_id },
        data: {
          status: 'RUNNING',
          started_at: new Date(),
          metadata: {
            ...baseMetadata,
            workerStartedAt: new Date().toISOString(),
          },
        },
      });
      console.log(`[BackupWorker] ${pending.backup_id}: moved to RUNNING`);
    }

    try {
      const archive = await createDatabaseArchive(pending.backup_id);
      const completedAt = new Date();
      const manifest = buildManifest({
        snapshotId: pending.backup_id,
        includeMedia: pending.include_media,
        archivePath: archive.path,
        sizeBytes: archive.sizeBytes,
        checksum: archive.checksum,
      });

      await prisma.backup_snapshots.update({
        where: { backup_id: pending.backup_id },
        data: {
          status: 'COMPLETED',
          completed_at: completedAt,
          size_bytes: BigInt(archive.sizeBytes),
          storage_path: archive.path,
          metadata: {
            ...baseMetadata,
            manifest,
          },
        },
      });

      console.log(`[BackupWorker] ${pending.backup_id}: completed`);
    } catch (error) {
      const message = getErrorMessage(error) ?? 'Backup failed';
      console.error(`[BackupWorker] ${pending.backup_id}: failed - ${message}`);
      await prisma.backup_snapshots.update({
        where: { backup_id: pending.backup_id },
        data: {
          status: 'FAILED',
          metadata: {
            ...baseMetadata,
            errorMessage: message,
            failedAt: new Date().toISOString(),
          },
        },
      });
    }
  } catch (error) {
    console.error('[BackupWorker] Failed to process backup:', error);
  } finally {
    isProcessing = false;
  }
}

export function startBackupWorker(): void {
  if (!WORKER_ENABLED) {
    console.log('[BackupWorker] Disabled via BACKUP_WORKER_ENABLED=false');
    return;
  }

  if (!BACKUP_DATABASE_URL) {
    console.warn('[BackupWorker] BACKUP_DATABASE_URL missing. Worker will not start.');
    return;
  }

  if (intervalId) {
    return;
  }

  console.log(
    `[BackupWorker] Starting with poll interval ${POLL_INTERVAL_MS}ms. Storage root: ${STORAGE_ROOT}`
  );
  intervalId = setInterval(() => {
    processPendingBackup().catch((err) => {
      console.error('[BackupWorker] Unexpected error:', err);
    });
  }, POLL_INTERVAL_MS);
}
