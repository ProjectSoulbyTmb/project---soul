const path = require('node:path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  const { rcedit } = await import('rcedit');
  const executable = path.join(context.appOutDir, 'Eidovara.exe');
  const icon = path.resolve(context.packager.projectDir, 'assets', 'branding', 'eidovara.ico');
  await rcedit(executable, { icon });
};
