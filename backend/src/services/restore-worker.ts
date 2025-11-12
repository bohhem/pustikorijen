import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { spawn } from 'child_process';
import prisma from '../utils/prisma';
import { getErrorMessage } from '../utils/error.util';

const RESTORE_WORKER_ENABLED = (process.env.RESTORE_WORKER_ENABLED ?? 'true').toLowerCase() !== 'false';
const RESTORE_POLL_INTERVAL_MS = Number(process.env.RESTORE_WORKER_POLL_MS ?? '5000');
const STORAGE_ROOT = path.resolve(process.env.BACKUP_STORAGE_DIR ?? path.join(process.cwd(), '..', 'backups'));

type TargetMap = Record<string, string>;

function buildTargetMap(): TargetMap {
  return Object.entries(process.env).reduce<TargetMap>((acc, [key, value]) => {
    if (!value) {
      return acc;
    }
    const match = key.match(/^RESTORE_TARGET_([A-Z0-9_]+)_URL$/i);
    if (match) {
      acc[match[1].toUpperCase()] = value;
    }
    return acc;
  }, {});
}

const RESTORE_TARGETS = buildTargetMap();

function getTargetUrl(env: string): string | null {
  return RESTORE_TARGETS[env.toUpperCase()] ?? null;
}

async function resolveArchivePath(snapshot: { backup_id: string; storage_path: string | null }): Promise<string> {
  if (snapshot.storage_path) {
    return snapshot.storage_path;
  }
  const fallback = path.join(STORAGE_ROOT, snapshot.backup_id, 'database.sql.gz');
  await fsPromises.access(fallback, fs.constants.R_OK);
  return fallback;
}

async function executeRestore(archivePath: string, targetUrl: string) {
  const restoreProcess = spawn('psql', [targetUrl, '-v', 'ON_ERROR_STOP=1'], {
    stdio: ['pipe', 'ignore', 'pipe'],
  });

  let stderrBuffer = '';
  restoreProcess.stderr?.setEncoding('utf8');
  restoreProcess.stderr?.on('data', (chunk) => {
    stderrBuffer += chunk;
  });

  const input = fs.createReadStream(archivePath);
  const gunzip = zlib.createGunzip();

  await Promise.all([
    pipeline(input, gunzip, restoreProcess.stdin!),
    new Promise<void>((resolve, reject) => {
      restoreProcess.on('error', reject);
      restoreProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderrBuffer.trim() || `psql exited with code ${code}`));
        }
      });
    }),
  ]);
}

let isProcessing = false;
let intervalId: NodeJS.Timeout | null = null;

async function processPendingRestore() {
  if (isProcessing) {
    return;
  }
  isProcessing = true;

  try {
    const pending = await prisma.backup_restores.findFirst({
      where: { status: { in: ['QUEUED', 'RUNNING'] } },
      orderBy: { started_at: 'asc' },
      include: {
        snapshot: {
          select: {
            backup_id: true,
            label: true,
            storage_path: true,
          },
        },
      },
    });

    if (!pending) {
      return;
    }

    const targetUrl = getTargetUrl(pending.target_env);
    if (!targetUrl) {
      await prisma.backup_restores.update({
        where: { restore_id: pending.restore_id },
        data: {
          status: 'FAILED',
          failure_message: `Target ${pending.target_env} is not configured`,
        },
      });
      return;
    }

    if (pending.status === 'QUEUED') {
      await prisma.backup_restores.update({
        where: { restore_id: pending.restore_id },
        data: {
          status: 'RUNNING',
          metadata: {
            ...(pending.metadata as Record<string, unknown> | null),
            workerStartedAt: new Date().toISOString(),
            targetEnv: pending.target_env,
          },
        },
      });
      console.log(`[RestoreWorker] ${pending.restore_id}: moved to RUNNING`);
    }

    try {
      const archivePath = await resolveArchivePath(pending.snapshot);
      if (pending.dry_run) {
        await prisma.backup_restores.update({
          where: { restore_id: pending.restore_id },
          data: {
            status: 'COMPLETED',
            completed_at: new Date(),
            logs: [
              `Dry-run acknowledged on ${pending.target_env}. No changes applied.`,
              `Archive validated at ${archivePath}`,
            ],
          },
        });
        console.log(`[RestoreWorker] ${pending.restore_id}: dry-run completed`);
        return;
      }

      await executeRestore(archivePath, targetUrl);
      await prisma.backup_restores.update({
        where: { restore_id: pending.restore_id },
        data: {
          status: 'COMPLETED',
          completed_at: new Date(),
          logs: [
            `Restore applied to ${pending.target_env} from ${archivePath}`,
            `psql target: ${targetUrl}`,
          ],
        },
      });
      console.log(`[RestoreWorker] ${pending.restore_id}: completed`);
    } catch (error) {
      const message = getErrorMessage(error) ?? 'Restore failed';
      console.error(`[RestoreWorker] ${pending.restore_id}: failed - ${message}`);
      await prisma.backup_restores.update({
        where: { restore_id: pending.restore_id },
        data: {
          status: 'FAILED',
          failure_message: message,
          logs: [
            `Restore failed at ${new Date().toISOString()}`,
            message,
          ],
          metadata: {
            ...(pending.metadata as Record<string, unknown> | null),
            failedAt: new Date().toISOString(),
          },
        },
      });
    }
  } catch (error) {
    console.error('[RestoreWorker] Failed to process restore:', error);
  } finally {
    isProcessing = false;
  }
}

export function startRestoreWorker(): void {
  if (!RESTORE_WORKER_ENABLED) {
    console.log('[RestoreWorker] Disabled via RESTORE_WORKER_ENABLED=false');
    return;
  }

  if (Object.keys(RESTORE_TARGETS).length === 0) {
    console.warn('[RestoreWorker] No restore targets configured. Worker will remain idle.');
  }

  if (intervalId) {
    return;
  }

  console.log(
    `[RestoreWorker] Starting with poll interval ${RESTORE_POLL_INTERVAL_MS}ms. Storage root: ${STORAGE_ROOT}`
  );
  intervalId = setInterval(() => {
    processPendingRestore().catch((err) => {
      console.error('[RestoreWorker] Unexpected error:', err);
    });
  }, RESTORE_POLL_INTERVAL_MS);
}
