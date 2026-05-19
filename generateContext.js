const fs = require("fs");
const path = require("path");

// Configuration: Folders and files to IGNORE
const IGNORED_DIRS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".vscode",
  ".idea",
];

const IGNORED_FILES = [
  "package-lock.json",
  "yarn.lock",
  ".DS_Store",
  ".env", // IMPORTANT: Don't share secrets
  ".env.local",
  "generateContext.js", // Don't include this script itself
  "project_context.txt", // Don't include the output file
];

// File extensions to include (add more if needed)
const INCLUDED_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".scss",
  ".html",
  ".json",
  ".md",
  ".prisma",
  ".sql",
  ".py",
];

const outputFile = "project_context.txt";

function getFileTree(dir, prefix = "") {
  let output = "";
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // Filter out ignored entries
  const filteredEntries = entries.filter((entry) => {
    if (entry.isDirectory()) return !IGNORED_DIRS.includes(entry.name);
    return !IGNORED_FILES.includes(entry.name);
  });

  filteredEntries.forEach((entry, index) => {
    const isLast = index === filteredEntries.length - 1;
    const marker = isLast ? "└── " : "├── ";
    output += `${prefix}${marker}${entry.name}\n`;

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      output += getFileTree(path.join(dir, entry.name), newPrefix);
    }
  });

  return output;
}

function getFileContents(dir) {
  let output = "";
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);

    // Skip ignored directories
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.includes(entry.name)) {
        output += getFileContents(fullPath);
      }
      return;
    }

    // Skip ignored files
    if (IGNORED_FILES.includes(entry.name)) return;

    // Only include specific extensions (or text files)
    const ext = path.extname(entry.name);
    if (INCLUDED_EXTENSIONS.includes(ext)) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        output += `\n\n================================================================================\n`;
        output += `FILE PATH: ${fullPath}\n`;
        output += `================================================================================\n\n`;
        output += content;
      } catch (err) {
        console.error(`Error reading ${fullPath}: ${err.message}`);
      }
    }
  });

  return output;
}

// Execution
try {
  console.log("Generating project context...");

  let finalOutput = "PROJECT DIRECTORY STRUCTURE:\n";
  finalOutput += "============================\n";
  finalOutput += getFileTree(process.cwd());

  finalOutput += "\n\nPROJECT FILE CONTENTS:\n";
  finalOutput += getFileContents(process.cwd());

  fs.writeFileSync(outputFile, finalOutput);
  console.log(`\n✅ Success! Context saved to: ${outputFile}`);
  console.log(
    `   (Size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB)`,
  );
} catch (err) {
  console.error("Error generating context:", err);
}
