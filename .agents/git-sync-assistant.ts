/**
 * git-sync-assistant
 *
 * Agente que automatiza el flujo de trabajo con Git:
 * 1. Ejecuta git status para ver el estado.
 * 2. Si hay cambios sin commit, ejecuta git add ..
 * 3. Lee los cambios con git diff --cached.
 * 4. Analiza los cambios y genera un mensaje de commit breve, descriptivo y en español.
 * 5. Ejecuta git commit -m "mensaje_generado".
 * 6. Ejecuta git push para subir los cambios.
 *
 * Soporte para submódulos: detecta cambios dentro de submódulos
 * (como tasa-del-dia) y sincroniza primero el submódulo, luego
 * actualiza la referencia en el repo padre.
 *
 * @model openai/gpt-5-nano
 * @tools [read_files, run_terminal_command, end_turn, bash]
 */

// ─── Interfaces ───

interface SubmoduleInfo {
  path: string;
  name: string;
}

interface CommitAnalysis {
  type: "feature" | "fix" | "refactor" | "docs" | "config" | "chore";
  description: string;
  files: string[];
}

interface SyncResult {
  submoduleResults: string[];
  parentResults: string[];
  totalCommits: number;
}

// ─── Flujo principal ───

export default async function run() {
  // ─── Paso 1: Verificar estado de Git en el repo padre ───
  const statusOutput = await run_terminal_command("git status --porcelain");

  if (!statusOutput || statusOutput.trim() === "") {
    await end_turn("No se detectaron cambios para sincronizar.");
    return;
  }

  const changedLines = statusOutput.trim().split("\n").filter(Boolean);

  // ─── Paso 2: Detectar submódulos ───
  const submodules = await detectSubmodules();

  // ─── Paso 3: Sincronizar submódulos primero ───
  const result: SyncResult = {
    submoduleResults: [],
    parentResults: [],
    totalCommits: 0,
  };

  if (submodules.length > 0) {
    for (const sm of submodules) {
      const smResult = await syncSubmodule(sm);
      if (smResult) {
        result.submoduleResults.push(smResult);
        result.totalCommits++;
      }
    }
  }

  // ─── Paso 4: Sincronizar repo padre ───
  const parentResult = await syncParentRepo(changedLines);
  if (parentResult) {
    result.parentResults.push(parentResult);
    result.totalCommits++;
  }

  // ─── Paso 5: Mostrar resumen final ───
  if (result.totalCommits === 0) {
    await end_turn("No se detectaron cambios para sincronizar.");
    return;
  }

  const summaryLines: string[] = [
    `✅ Sincronización completada — ${result.totalCommits} commit(s)`,
    "",
  ];

  if (result.submoduleResults.length > 0) {
    summaryLines.push("**Submódulos:**");
    for (const r of result.submoduleResults) {
      summaryLines.push(`  • ${r}`);
    }
    summaryLines.push("");
  }

  if (result.parentResults.length > 0) {
    summaryLines.push("**Repo padre:**");
    for (const r of result.parentResults) {
      summaryLines.push(`  • ${r}`);
    }
  }

  await end_turn(summaryLines.join("\n"));
}

// ─── Detección de submódulos ───

async function detectSubmodules(): Promise<SubmoduleInfo[]> {
  // Buscar submódulos registrados en .gitmodules
  const gitmodulesOutput = await run_terminal_command("cat .gitmodules 2>/dev/null || echo \"\"");

  const submodules: SubmoduleInfo[] = [];

  if (gitmodulesOutput && gitmodulesOutput.trim()) {
    // Parsear .gitmodules para extraer paths
    const lines = gitmodulesOutput.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*path\s*=\s*(.+)$/);
      if (match) {
        submodules.push({
          path: match[1].trim(),
          name: match[1].trim().split("/").pop() || match[1].trim(),
        });
      }
    }
  } else {
    // Fallback: buscar directorios con .git propio (submódulos sin .gitmodules)
    const findOutput = await run_terminal_command(
      "ls -d */ 2>/dev/null | xargs -I{} sh -c \"test -d '{}.git' -o -f '{}.git' && echo '{}'\" 2>/dev/null || echo ''"
    );
    if (findOutput && findOutput.trim() && findOutput.trim() !== "") {
      for (const dir of findOutput.trim().split("\n")) {
        const path = dir.replace(/\/$/, "").trim();
        if (path) {
          submodules.push({
            path: path,
            name: path.split("/").pop() || path,
          });
        }
      }
    }
  }

  return submodules;
}

// ─── Sincronización de submódulo ───

async function syncSubmodule(sm: SubmoduleInfo): Promise<string | null> {
  // Verificar si el submódulo tiene cambios
  const smStatus = await run_terminal_command(`cd "${sm.path}" && git status --porcelain`);

  if (!smStatus || smStatus.trim() === "") {
    return null; // Sin cambios en este submódulo
  }

  const changedLines = smStatus.trim().split("\n").filter(Boolean);

  // Obtener diff para análisis
  const smDiff = await run_terminal_command(`cd "${sm.path}" && git diff --cached`);

  // Si no hay staged changes, hacer add
  if (!smDiff || smDiff.trim() === "") {
    // Verificar si hay cambios unstaged
    await run_terminal_command(`cd "${sm.path}" && git add .`);
  }

  // Obtener diff actualizado
  const smDiffFinal = await run_terminal_command(`cd "${sm.path}" && git diff --cached`);

  // Analizar cambios y generar mensaje
  const analysis = analyzeChanges(smDiffFinal || "", changedLines);
  const commitMessage = buildCommitMessage(analysis);

  // Commit en el submódulo
  const safeMsg = commitMessage.replace(/"/g, '\\"');
  await run_terminal_command(`cd "${sm.path}" && git commit -m "${safeMsg}"`);

  // Push del submódulo
  const pushResult = await run_terminal_command(`cd "${sm.path}" && git push`);

  return `📦 **${sm.name}**: ${commitMessage} (push: ${isPushSuccessful(pushResult) ? "✅" : "⚠️ falló"})`;
}

// ─── Sincronización del repo padre ───

async function syncParentRepo(changedLines: string[]): Promise<string | null> {
  // Hacer git add .
  await run_terminal_command("git add .");

  // Obtener diff para analizar
  const diffOutput = await run_terminal_command("git diff --cached");

  if (!diffOutput || diffOutput.trim() === "") {
    return null; // Sin cambios para commitear en el padre
  }

  // Analizar cambios
  const analysis = analyzeChanges(diffOutput, changedLines);
  const commitMessage = buildCommitMessage(analysis);

  // Hacer commit
  const safeMsg = commitMessage.replace(/"/g, '\\"');
  await run_terminal_command(`git commit -m "${safeMsg}"`);

  // Hacer push
  const pushResult = await run_terminal_command("git push");
  const pushOk = isPushSuccessful(pushResult);

  return `${pushOk ? "✅" : "⚠️"} **Repo padre**: ${commitMessage} (push: ${pushOk ? "✅" : "⚠️ falló"})`;
}

// ─── Utilidad para verificar push ───

function isPushSuccessful(output: string): boolean {
  if (!output || output.trim() === "") return false;
  const lower = output.toLowerCase();
  return !(
    lower.includes("fatal:") ||
    lower.includes("error:") ||
    lower.includes("could not read") ||
    lower.includes("failed to push") ||
    lower.includes("rejected")
  );
}

// ─── Analizador de cambios ───

function analyzeChanges(diff: string, statusLines: string[]): CommitAnalysis {
  const files: string[] = [];
  const added: string[] = [];
  const deleted: string[] = [];
  const modified: string[] = [];
  const renamed: string[] = [];

  // Extraer archivos del diff
  for (const line of diff.split("\n")) {
    const match = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
    if (match) {
      const fileA = match[1];
      const fileB = match[2];
      files.push(fileB);
      if (fileA !== fileB) {
        renamed.push(`${fileA} → ${fileB}`);
      }
    }
  }

  // Extraer estado de git status --porcelain
  for (const line of statusLines) {
    const status = line.substring(0, 2).trim();
    const filePath = line.substring(3).trim();
    if (status === "A" || status === "?") {
      added.push(filePath);
    } else if (status === "D") {
      deleted.push(filePath);
    } else if (status === "M" || status === "R") {
      modified.push(filePath);
    }
  }

  // Determinar el tipo de cambio
  const type = determineChangeType(diff, files);
  const description = buildDescription(added, deleted, modified, renamed);
  const uniqueFiles = [...new Set(files)];

  return { type, description, files: uniqueFiles };
}

function determineChangeType(diff: string, files: string[]): CommitAnalysis["type"] {
  const allPaths = files.join(" ").toLowerCase();

  // Docs
  if (allPaths.includes("readme") || allPaths.includes(".md") || allPaths.includes("doc")) {
    return "docs";
  }

  // Config
  if (allPaths.includes("config") || allPaths.includes(".env") || allPaths.includes("package.json")
    || allPaths.includes(".yml") || allPaths.includes(".yaml") || allPaths.includes(".json")) {
    return "chore";
  }

  // Fix
  if (diff.toLowerCase().includes("fix") || diff.toLowerCase().includes("bug")
    || diff.toLowerCase().includes("error") || diff.toLowerCase().includes("issue")
    || diff.toLowerCase().includes("hotfix")) {
    return "fix";
  }

  // Feature
  if (allPaths.includes("feature") || allPaths.includes("nuev") || diff.toLowerCase().includes("add")
    || allPaths.includes("create")) {
    return "feature";
  }

  // Refactor
  if (allPaths.includes("refactor") || allPaths.includes("clean") || allPaths.includes("optimiz")
    || allPaths.includes("rename") || diff.toLowerCase().includes("refactor")) {
    return "refactor";
  }

  return "chore";
}

function buildDescription(
  added: string[],
  deleted: string[],
  modified: string[],
  renamed: string[]
): string {
  const parts: string[] = [];

  if (added.length > 0) {
    const names = added.map(f => f.split("/").pop()).join(", ");
    parts.push(`Agregar ${names}`);
  }

  if (modified.length > 0) {
    const names = modified.map(f => f.split("/").pop()).join(", ");
    if (parts.length === 0) {
      parts.push(`Actualizar ${names}`);
    } else {
      parts.push(`actualizar ${names}`);
    }
  }

  if (deleted.length > 0) {
    const names = deleted.map(f => f.split("/").pop()).join(", ");
    if (parts.length === 0) {
      parts.push(`Eliminar ${names}`);
    } else {
      parts.push(`eliminar ${names}`);
    }
  }

  if (renamed.length > 0) {
    if (parts.length === 0) {
      parts.push(`Renombrar ${renamed.join(", ")}`);
    } else {
      parts.push(`renombrar ${renamed.join(", ")}`);
    }
  }

  return parts.join(", ");
}

function buildCommitMessage(analysis: CommitAnalysis): string {
  const prefixMap: Record<string, string> = {
    feature: "✨",
    fix: "🐛",
    refactor: "♻️",
    docs: "📝",
    chore: "🔧",
  };

  const emoji = prefixMap[analysis.type] ?? "📦";
  return `${emoji} ${analysis.type}: ${analysis.description}`;
}
