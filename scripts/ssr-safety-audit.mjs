import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const offenders = [];
const files = execSync("find src -type f -name '*.tsx' -o -name '*.ts'", {encoding:'utf8'})
  .trim().split('\n').filter(Boolean);
for (const file of files) {
  const text = await readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/useState\([^\n]*\b(localStorage|sessionStorage)\b/.test(line) && !/typeof window/.test(line)) {
      offenders.push(`${file}:${i+1}: browser storage accessed during state initialization`);
    }
  });
}
if (offenders.length) {
  console.error(offenders.join('\n'));
  process.exit(1);
}
console.log('SSR safety audit passed: no unguarded browser-storage state initializers found.');
