// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import fs from 'node:fs';
import path from 'node:path';


const PERF_BUDGETS = {
  bundle: {
    maxSizeMB: 50,
    warningSizeMB: 40,
  },
  startup: {
    maxMs: 3000,
    warningMs: 2000,
  },
  memory: {
    maxMB: 200,
    warningMB: 150,
  },
  renderer: {
    maxSizeMB: 10,
    warningSizeMB: 8,
  },
};

function getDirSize(dirPath) {
  let totalSize = 0;
  try {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += getDirSize(fullPath);
      } else {
        totalSize += fs.statSync(fullPath).size;
      }
    }
  } catch {}
  return totalSize;
}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function checkBudget(name, actual, budget) {
  
  const status = actual > budget.maxSizeMB * 1024 * 1024 ? 'FAIL' : actual > budget.warningSizeMB * 1024 * 1024 ? 'WARN' : 'PASS';
  console.log(`${status} ${name}: ${formatBytes(actual)} (max: ${budget.maxSizeMB} MB, warn: ${budget.warningSizeMB} MB)`);
  return status !== 'FAIL';
}





function main() {
  console.log('=== Performance Budget Check ===\n');
  
  let allPassed = true;
  
  // Check dist bundle size
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    const distSize = getDirSize(distPath);
    allPassed = checkBudget('Total dist/', distSize, PERF_BUDGETS.bundle) && allPassed;
  } else {
    console.log('SKIP dist/ (not built)');
  }
  
  // Check renderer resources
  const rendererPath = path.join(process.cwd(), 'src', 'renderer');
  if (fs.existsSync(rendererPath)) {
    const rendererSize = getDirSize(rendererPath);
    allPassed = checkBudget('src/renderer/', rendererSize, PERF_BUDGETS.renderer) && allPassed;
  }
  
  // Check node_modules size (warning only)
  const modulesPath = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(modulesPath)) {
    const modulesSize = getDirSize(modulesPath);
    console.log(`INFO node_modules/: ${formatBytes(modulesSize)}`);
  }
  
  // Check for large files
  console.log('\n=== Large Files (>1MB) ===');
  function findLargeFiles(dir, prefix = '') {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'dist-mac', '.wrangler'].includes(entry.name)) {
          findLargeFiles(fullPath, prefix + entry.name + '/');
        } else if (entry.isFile()) {
          const size = fs.statSync(fullPath).size;
          if (size > 1024 * 1024) {
            console.log(`  ${prefix}${entry.name}: ${formatBytes(size)}`);
          }
        }
      }
    } catch {}
  }
  findLargeFiles(process.cwd());
  
  console.log('\n=== Summary ===');
  if (allPassed) {
    console.log('✓ All performance budgets passed');
    process.exit(0);
  } else {
    console.log('✗ Some performance budgets exceeded');
    process.exit(1);
  }
}

main();