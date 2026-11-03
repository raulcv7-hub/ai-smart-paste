import { ParseMode, ParseResult } from './types';

/**
 * Comprehensive set of web chat UI artifacts, language badges, and copy labels.
 */
const COMMON_UI_LABELS = new Set([
    // --- Web Chat & UI Action Artifacts (EN / ES) ---
    'code', 'copy code', 'copy', 'copied', 'copied!', 'copiar', 'copiar código',
    'código', 'show output', 'output', 'preview', 'edit', 'run', 'terminal',
    'console', 'result', 'snippet', 'diff', 'patch', 'raw', 'view raw', 'file',
    'salida', 'resultado',

    // --- C / C++ / C# / Native Systems ---
    'c', 'c++', 'cpp', 'cxx', 'cc', 'cplusplus', 'h', 'hpp', 'hxx', 'hh', 'inl',
    'c#', 'csharp', 'cs', 'dotnet', '.net',
    'cuda', 'cu', 'cuh', 'opencl', 'cl',

    // --- Build Systems & Compilers ---
    'cmake', 'cmakelists', 'cmakelists.txt', 'make', 'makefile', 'mk',
    'ninja', 'meson', 'bazel', 'bzl', 'gradle', 'maven', 'pom', 'ant',
    'nix', 'just', 'justfile', 'procfile',

    // --- Systems & Modern Compiled Languages ---
    'rust', 'rs', 'rlib',
    'go', 'golang',
    'zig', 'nim', 'd', 'dlang', 'v', 'vlang', 'odin',
    'assembly', 'asm', 'nasm', 'masm', 'gas', 's',

    // --- Web Frontend & Full-Stack ---
    'javascript', 'js', 'mjs', 'cjs', 'jsx',
    'typescript', 'ts', 'mts', 'cts', 'tsx',
    'html', 'htm', 'xhtml', 'svg', 'xml', 'xslt', 'dtd',
    'css', 'scss', 'sass', 'less', 'stylus', 'styl', 'postcss',
    'vue', 'svelte', 'astro', 'angular',
    'wasm', 'wat',

    // --- Backend & Enterprise Languages ---
    'python', 'py', 'py3', 'pyw', 'pyx', 'ipynb',
    'java', 'kotlin', 'kt', 'kts', 'scala', 'sc', 'groovy', 'gvy',
    'php', 'phtml', 'php8', 'hack',
    'ruby', 'rb', 'erb', 'rake', 'gemspec',
    'swift', 'dart', 'objective-c', 'objc', 'obj-c', 'm', 'mm',
    'visualbasic', 'vb', 'vbnet', 'vba', 'vbs',

    // --- Functional & Concurrent Languages ---
    'elixir', 'ex', 'exs', 'erlang', 'erl', 'hrl',
    'haskell', 'hs', 'lhs', 'ocaml', 'ml', 'mli', 'reason', 're',
    'clojure', 'clj', 'cljs', 'cljc', 'edn',
    'f#', 'fsharp', 'fs', 'fsi', 'fsx',
    'lisp', 'common-lisp', 'scheme', 'scm', 'racket', 'rkt',

    // --- Scientific, Math & Data ---
    'r', 'rscript', 'julia', 'jl', 'matlab', 'octave',
    'fortran', 'f', 'f90', 'f95', 'f03',
    'cobol', 'cbl', 'ada', 'adb', 'ads',
    'pascal', 'pas', 'delphi', 'prolog', 'pl', 'tcl',
    'lua', 'luau', 'perl', 'pm',

    // --- DevOps, Cloud & Containers ---
    'docker', 'dockerfile', 'containerfile',
    'vagrant', 'vagrantfile',
    'terraform', 'tf', 'tfvars', 'hcl', 'terragrunt',
    'ansible', 'puppet', 'chef', 'salt',
    'kubernetes', 'k8s', 'helm',

    // --- Shells & Scripting ---
    'shell', 'bash', 'sh', 'zsh', 'fish', 'ksh', 'csh', 'tcsh',
    'powershell', 'pwsh', 'ps1', 'psm1', 'psd1',
    'batch', 'bat', 'cmd',
    'awk', 'sed',

    // --- Data Serialization & Configuration ---
    'json', 'jsonc', 'json5', 'jsonl', 'ndjson', 'geojson',
    'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'config',
    'env', 'dotenv', 'properties', 'props',
    'csv', 'tsv',
    'protobuf', 'proto', 'proto3', 'thrift', 'avro',

    // --- Database & Query Languages ---
    'sql', 'mysql', 'postgresql', 'postgres', 'psql', 'sqlite', 'sqlite3',
    'tsql', 'plsql', 'plpgsql', 'mariadb', 'mssql', 'nosql', 'mongo', 'mongodb',
    'graphql', 'gql', 'prisma',
    'sparql', 'cypher', 'datalog', 'redis',

    // --- Hardware, Shaders & Web3 ---
    'verilog', 'systemverilog', 'sv', 'vhdl', 'vhd',
    'glsl', 'hlsl', 'wgsl', 'shader', 'metal',
    'solidity', 'sol', 'vyper', 'yul', 'move',

    // --- Documentation & Markup ---
    'markdown', 'md', 'mdx', 'rmd',
    'plaintext', 'text', 'txt', 'none',
    'asciidoc', 'adoc', 'rst', 'restructuredtext',
    'latex', 'tex', 'bibtex', 'bib', 'typst'
]);


/**
 * Extracts and sanitizes the target file path from the initial line.
 * Supports standard paths, dotfiles (.env), extensionless files (Makefile), and quoted spaces.
 *
 * @param line - Raw line containing the candidate path.
 * @returns Cleaned relative or absolute path.
 */
export function extractPath(line: string): string {
    let sanitized = line.trim();
    sanitized = sanitized.replace(/^[#\-*]+\s*/, '');
    sanitized = sanitized.replace(/<[^>]+>/g, '');
    sanitized = sanitized.replace(/^(File|Ruta|Path|Archivo|Source):\s*/i, '');

    const quotedMatch = sanitized.match(/["'`]([^"'`]+)["'`]/);
    if (quotedMatch) {
        return quotedMatch[1].trim();
    }

    return sanitized.split(/[\s()]/)[0].trim();
}

/**
 * Parses raw clipboard text according to strict isolated path directives and code fences.
 *
 * @param rawText - Raw text directly extracted from clipboard.
 * @returns Parsed result indicating operation mode and sanitized content.
 */
export function parseClipboard(rawText: string): ParseResult | null {
    if (!rawText || rawText.trim().length === 0) {
        return null;
    }

    const lines = rawText.trim().split(/\r?\n/);
    const targetPath = extractPath(lines[0]);

    if (!targetPath) {
        return null;
    }

    // Si solo hay una línea, o las líneas siguientes están vacías -> MODO TOUCH
    const remainingText = lines.slice(1).join('\n').trim();
    if (remainingText.length === 0) {
        return { mode: 'TOUCH', relativePath: targetPath, content: '' };
    }

    let codeStartIndex = 1;

    // 1. Saltar líneas en blanco iniciales tras la ruta
    while (codeStartIndex < lines.length && lines[codeStartIndex].trim().length === 0) {
        codeStartIndex++;
    }

    // 2. Si hay delimitador markdown ```, saltarlo
    if (codeStartIndex < lines.length && lines[codeStartIndex].trim().startsWith('```')) {
        codeStartIndex++;
    } else {
        // 3. Absorber en bucle cualquier etiqueta de lenguaje o palabra UI (ej: 'code', 'C++', 'CMake')
        while (
            codeStartIndex < lines.length &&
            (COMMON_UI_LABELS.has(lines[codeStartIndex].trim().toLowerCase()) ||
             lines[codeStartIndex].trim().length === 0)
        ) {
            codeStartIndex++;
        }
    }

    let codeEndIndex = lines.length;

    // Buscar delimitador de cierre ``` si existía
    for (let i = lines.length - 1; i >= codeStartIndex; i--) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('```')) {
            codeEndIndex = i;
            break;
        }
    }

    const contentLines = lines.slice(codeStartIndex, codeEndIndex);
    const rawContent = contentLines.join('\n').trim();

    if (rawContent.length === 0) {
        return { mode: 'TOUCH', relativePath: targetPath, content: '' };
    }

    return {
        mode: 'CONTENT',
        relativePath: targetPath,
        content: rawContent + '\n'
    };
}