import * as assert from 'assert';
import { extractPath, parseClipboard } from '../src/core/parser';

describe('Parser Unit Tests - Comprehensive Suite', () => {
    describe('extractPath() - Edge Cases', () => {
        it('should strip Markdown headers and bullet points', () => {
            assert.strictEqual(extractPath('# src/index.ts'), 'src/index.ts');
            assert.strictEqual(extractPath('### `src/utils/math.ts`'), 'src/utils/math.ts');
            assert.strictEqual(extractPath('- src/services/auth.ts'), 'src/services/auth.ts');
            assert.strictEqual(extractPath('* config/app.json'), 'config/app.json');
        });

        it('should strip HTML tags commonly emitted by web chat wrappers', () => {
            assert.strictEqual(extractPath('<filepath>src/components/Hero.tsx</filepath>'), 'src/components/Hero.tsx');
            assert.strictEqual(extractPath('<b>src/api/client.ts</b>'), 'src/api/client.ts');
        });

        it('should strip conversational line prefixes', () => {
            assert.strictEqual(extractPath('File: src/app.ts'), 'src/app.ts');
            assert.strictEqual(extractPath('Path: config/db.json'), 'config/db.json');
            assert.strictEqual(extractPath('Ruta: main.go'), 'main.go');
            assert.strictEqual(extractPath('Source: lib/crypto.rs'), 'lib/crypto.rs');
        });

        it('should isolate double and single quoted paths with whitespace', () => {
            assert.strictEqual(extractPath('"src/my components/Header Bar.tsx"'), 'src/my components/Header Bar.tsx');
            assert.strictEqual(extractPath("'scripts/run migration test.py'"), 'scripts/run migration test.py');
        });

        it('should handle Windows backslash paths correctly', () => {
            assert.strictEqual(extractPath('src\\core\\engine.ts'), 'src\\core\\engine.ts');
        });

        it('should support extensionless and hidden configuration files', () => {
            assert.strictEqual(extractPath('Makefile'), 'Makefile');
            assert.strictEqual(extractPath('Dockerfile'), 'Dockerfile');
            assert.strictEqual(extractPath('.env'), '.env');
            assert.strictEqual(extractPath('.env.local'), '.env.local');
            assert.strictEqual(extractPath('.gitignore'), '.gitignore');
        });
    });

    describe('parseClipboard() - Mode & Payload Demarcation', () => {
        it('should parse Touch mode for single isolated path', () => {
            const result = parseClipboard('src/core/empty.ts');
            assert.ok(result);
            assert.strictEqual(result.mode, 'TOUCH');
            assert.strictEqual(result.relativePath, 'src/core/empty.ts');
            assert.strictEqual(result.content, '');
        });

        it('should treat path with only whitespace lines below as Touch mode', () => {
            const result = parseClipboard('src/core/empty.ts\n   \n\n\t  ');
            assert.ok(result);
            assert.strictEqual(result.mode, 'TOUCH');
        });

        it('should parse standard Markdown code fence with language tag', () => {
            const input = 'src/logger.ts\n```typescript\nexport const log = () => {};\n```';
            const result = parseClipboard(input);
            assert.ok(result);
            assert.strictEqual(result.mode, 'CONTENT');
            assert.strictEqual(result.relativePath, 'src/logger.ts');
            assert.strictEqual(result.content, 'export const log = () => {};\n');
        });

        it('should parse Markdown code fence without language tag', () => {
            const input = 'config/schema.json\n```\n{"active": true}\n```';
            const result = parseClipboard(input);
            assert.ok(result);
            assert.strictEqual(result.mode, 'CONTENT');
            assert.strictEqual(result.content, '{"active": true}\n');
        });

        it('should strip conversational trailing text after closing code fence', () => {
            const input = 'src/index.ts\n```ts\nconst port = 8080;\n```\nHope this helps! Let me know if you need more.';
            const result = parseClipboard(input);
            assert.ok(result);
            assert.strictEqual(result.content, 'const port = 8080;\n');
        });

        it('should filter Gemini web interface artifacts', () => {
            const input = 'src/store.ts\ncode\nTypeScript\nexport const store = {};';
            const result = parseClipboard(input);
            assert.ok(result);
            assert.strictEqual(result.mode, 'CONTENT');
            assert.strictEqual(result.content, 'export const store = {};\n');
        });

        it('should parse unfenced direct code output (ChatGPT style)', () => {
            const input = 'src/types.ts\nexport interface User {\n  id: string;\n}';
            const result = parseClipboard(input);
            assert.ok(result);
            assert.strictEqual(result.mode, 'CONTENT');
            assert.strictEqual(result.content, 'export interface User {\n  id: string;\n}\n');
        });

        it('should preserve tab characters byte-for-byte in Makefiles', () => {
            const input = 'Makefile\nbuild:\n\t@go build -o app main.go';
            const result = parseClipboard(input);
            assert.ok(result);
            assert.strictEqual(result.content, 'build:\n\t@go build -o app main.go\n');
        });

        it('should return null for empty, whitespace, or invalid inputs', () => {
            assert.strictEqual(parseClipboard(''), null);
            assert.strictEqual(parseClipboard('   \n  \t '), null);
        });
    });
    
    describe('Stress & Advanced Edge Cases', () => {
        it('should handle relative paths starting with dot slash', () => {
            const input = './src/components/Header.tsx\nexport const H = 1;';
            const result = parseClipboard(input);
            assert.ok(result);
            assert.strictEqual(result.relativePath, './src/components/Header.tsx');
        });

        it('should handle nested backticks inside string literals correctly', () => {
            const input = [
                'src/docGenerator.ts',
                '```typescript',
                'export const md = `',
                '```bash',
                'npm install',
                '```',
                '`;',
                '```'
            ].join('\n');

            const result = parseClipboard(input);
            assert.ok(result);
            assert.strictEqual(result.mode, 'CONTENT');
            // Debe preservar el contenido completo hasta la última triple tilde
            assert.ok(result.content.includes('npm install'));
        });

        it('should handle deeply nested directories without truncation', () => {
            const path = 'src/modules/billing/domain/events/handlers/invoiceGenerated.handler.ts';
            const input = `${path}\nexport class Handler {}`;
            const result = parseClipboard(input);
            assert.ok(result);
            assert.strictEqual(result.relativePath, path);
        });
    });
});
