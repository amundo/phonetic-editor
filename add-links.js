import { DOMParser } from "jsr:@b-fuze/deno-dom";
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

async function processHtmlFile(filePath) {
  try {
    const content = await Deno.readTextFile(filePath);
    const doc = new DOMParser().parseFromString(content, "text/html");
    if (!doc) return;

    const moduleScripts = doc.querySelectorAll("script[type=module]");
    const scriptLinks = new Set();

    moduleScripts.forEach((script) => {
      const importMatches = script.textContent.matchAll(
        /import\s+.*?['"](\.\/?[^'";]+)['"]/g
      );
      for (const match of importMatches) {
        scriptLinks.add(match[1]);
      }
    });

    if (scriptLinks.size === 0) return; // No module imports, no changes needed

    const footer = doc.createElement("footer");
    footer.classList.add('script-links');
    scriptLinks.forEach((scriptPath) => {
      const a = doc.createElement("a");
      a.setAttribute("href", scriptPath)
      a.textContent = scriptPath;
      footer.appendChild(a);
      footer.appendChild(doc.createTextNode(" "));
    });
    doc.body.appendChild(footer);

    await Deno.writeTextFile(filePath, `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`);
    console.log(`Updated: ${filePath}`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

async function processDirectory(rootDir) {
  for await (const entry of walk(rootDir, { exts: ["html"] })) {
    if (entry.isFile) {
      await processHtmlFile(entry.path);
    }
  }
}

if (import.meta.main) {
  const rootDir = Deno.args[0];
  if (!rootDir) {
    console.error("Usage: deno run --allow-read --allow-write script.js <root-directory>");
    Deno.exit(1);
  }
  await processDirectory(rootDir);
}
