import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

/**
 * Searches upward from startDir to find the monorepo root directory.
 * Looks for pnpm-workspace.yaml or pnpm-lock.yaml.
 */
function findProjectRoot(startDir: string = process.cwd()): string {
  let current = startDir;
  while (true) {
    if (
      fs.existsSync(path.join(current, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(current, 'pnpm-lock.yaml'))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return startDir;
}

const isDocker = (process.env.DOCKER_ENV || 'false').toLowerCase() === 'true';
dotenv.config({ path: '.env', override: !isDocker });

export const PROJECT_ROOT_PATH = process.env.PROJECT_ROOT_PATH || findProjectRoot();
export const DATA_DIR_PATH = path.resolve(PROJECT_ROOT_PATH, 'data');
export const LOCAL_DB_LOGS_PATH = path.resolve(
  PROJECT_ROOT_PATH,
  process.env.PROJECT_LOGS_SUBDIR || 'data/logs'
);
