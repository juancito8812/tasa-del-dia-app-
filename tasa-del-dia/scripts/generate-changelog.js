/**
 * generate-changelog.js
 * Genera un changelog markdown a partir de los commits desde el último tag.
 * Uso: node scripts/generate-changelog.js [--from <tag>] [--to <ref>]
 *
 * ponytail: sin dependencias externas, solo git log + procesamiento básico.
 */

const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const toIdx = args.indexOf('--to');
const fromTag = fromIdx >= 0 ? args[fromIdx + 1] : null;
const toRef = toIdx >= 0 ? args[toIdx + 1] : 'HEAD';

function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }).trim();
  } catch {
    return '';
  }
}

function getLastTag() {
  if (fromTag) return fromTag;
  const tag = exec('git describe --tags --abbrev=0 2>/dev/null');
  return tag || '';
}

function getCommits(since, to) {
  if (!since) return [];
  const range = `${since}..${to}`;
  const log = exec(`git log ${range} --oneline --no-decorate 2>/dev/null`);
  if (!log) return [];
  return log.split('\n').filter(Boolean).map(line => {
    const match = line.match(/^([a-f0-9]+)\s+(.+)/);
    if (!match) return { hash: '', message: line, type: 'other', description: line };
    const hash = match[1];
    const msg = match[2];
    const conv = msg.match(/^(feat|fix|chore|docs|refactor|test|style|perf|ci|build|revert)(\(.+\))?!?:\s*(.+)/i);
    const isBreaking = conv && msg.includes('!:');
    return {
      hash: hash.substring(0, 7),
      message: msg,
      type: conv ? conv[1].toLowerCase() : 'other',
      scope: conv ? (conv[2] || '').replace(/[()]/g, '') : '',
      description: conv ? conv[3] : msg,
      breaking: isBreaking,
    };
  });
}

function categorizeCommits(commits) {
  const categories = {
    feat: [],
    fix: [],
    refactor: [],
    test: [],
    docs: [],
    chore: [],
    perf: [],
    style: [],
    ci: [],
    build: [],
    revert: [],
    other: [],
  };
  for (const c of commits) {
    if (categories[c.type]) categories[c.type].push(c);
    else categories.other.push(c);
  }
  return categories;
}

function formatChangelog(categories, version, lastTag) {
  const labels = {
    feat: '🚀 Nuevas funcionalidades',
    fix: '🐛 Correcciones',
    refactor: '♻️ Refactorización',
    perf: '⚡ Mejoras de rendimiento',
    test: '✅ Tests',
    docs: '📖 Documentación',
    chore: '🔧 Mantenimiento',
    style: '🎨 Estilo',
    ci: '🔁 CI/CD',
    build: '📦 Build',
    revert: '⏪ Reversiones',
    other: '🔹 Otros',
  };

  let md = `## ${version}\n\n`;
  if (lastTag) {
    const commitCount = Object.values(categories).reduce((s, arr) => s + arr.length, 0);
    md += `> **${commitCount} cambios** desde ${lastTag}\n\n`;
  }

  for (const [type, commits] of Object.entries(categories)) {
    if (commits.length === 0) continue;
    md += `### ${labels[type] || 'Otros'}\n\n`;
    for (const c of commits) {
      const scope = c.scope ? `**${c.scope}**: ` : '';
      const prefix = c.breaking ? '⚠️  ' : '';
      md += `- ${prefix}${scope}${c.description} (${c.hash})\n`;
    }
    md += '\n';
  }

  return md.trim() + '\n';
}

// ─── Main ───

const tag = getLastTag();
const commits = getCommits(tag, toRef);
const categories = categorizeCommits(commits);

const version = process.env.RELEASE_VERSION || tag.replace(/^v/i, '') || '0.0.0';
const changelog = formatChangelog(categories, version, tag);

console.log(changelog);
