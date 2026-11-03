import * as assert from 'assert';
import { EOL_CRLF, EOL_LF, normalizeLineEndings } from '../src/core/normalizer';

describe('Normalizer Unit Tests', () => {
    it('should normalize CRLF to LF', () => {
        const input = 'line1\r\nline2\r\nline3';
        const result = normalizeLineEndings(input, EOL_LF);
        assert.strictEqual(result, 'line1\nline2\nline3');
    });

    it('should normalize LF to CRLF', () => {
        const input = 'line1\nline2\nline3';
        const result = normalizeLineEndings(input, EOL_CRLF);
        assert.strictEqual(result, 'line1\r\nline2\r\nline3');
    });

    it('should handle mixed newlines consistently', () => {
        const input = 'line1\r\nline2\nline3\r\n';
        const result = normalizeLineEndings(input, EOL_LF);
        assert.strictEqual(result, 'line1\nline2\nline3\n');
    });
});