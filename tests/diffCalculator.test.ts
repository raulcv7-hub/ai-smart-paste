import * as assert from 'assert';
import { calculateDiffStats } from '../src/core/diffCalculator';

describe('DiffCalculator Unit Tests - Edge Cases', () => {
    it('should detect pure line additions', () => {
        const oldText = 'line1\nline2';
        const newText = 'line1\nline2\nline3\nline4';
        const stats = calculateDiffStats(oldText, newText);

        assert.strictEqual(stats.added, 2);
        assert.strictEqual(stats.removed, 0);
        assert.strictEqual(stats.firstChangedLine, 2);
    });

    it('should detect pure line deletions', () => {
        const oldText = 'line1\nline2\nline3\nline4';
        const newText = 'line1\nline2';
        const stats = calculateDiffStats(oldText, newText);

        assert.strictEqual(stats.added, 0);
        assert.strictEqual(stats.removed, 2);
        assert.strictEqual(stats.firstChangedLine, 2);
    });

    it('should detect modification at line 0 (first line replacement)', () => {
        const oldText = 'import React from "react";';
        const newText = 'import * as React from "react";';
        const stats = calculateDiffStats(oldText, newText);

        assert.strictEqual(stats.firstChangedLine, 0);
    });

    it('should handle transition from empty document to full content', () => {
        const stats = calculateDiffStats('', 'line1\nline2\nline3\n');
        assert.strictEqual(stats.added, 4);
        assert.strictEqual(stats.firstChangedLine, 0);
    });

    it('should return zero metrics for identical multi-line content', () => {
        const content = 'def test():\n    pass\n';
        const stats = calculateDiffStats(content, content);

        assert.strictEqual(stats.added, 0);
        assert.strictEqual(stats.removed, 0);
    });
});