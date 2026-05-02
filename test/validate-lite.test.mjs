import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('validate-lite', () => {
  it('passes the repository validation suite', async () => {
    const { stdout } = await execFileAsync(process.execPath, ['tools/validate-lite.mjs'], {
      cwd: process.cwd(),
    });
    expect(stdout).toContain('gstack-lite validation passed');
  });
});
