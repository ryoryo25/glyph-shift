import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canChangeCase,
  swapCase,
  isAsciiPrintable,
  getSimilarTargets,
  transformCharacter,
  transformString,
  generateBatchCandidates,
  DEFAULT_SIMILAR_RULES,
} from './transformer';

test('all DEFAULT_SIMILAR_RULES targets are strictly printable ASCII characters', () => {
  for (const rule of DEFAULT_SIMILAR_RULES) {
    assert.equal(isAsciiPrintable(rule.source), true, `Source ${rule.source} should be ASCII`);
    for (const target of rule.targets) {
      assert.equal(
        isAsciiPrintable(target),
        true,
        `Target "${target}" in rule ${rule.id} should be printable ASCII`
      );
    }
  }
  assert.equal(isAsciiPrintable('€'), false);
  assert.equal(isAsciiPrintable('Ø'), false);
  assert.equal(isAsciiPrintable('ß'), false);
});

test('canChangeCase and swapCase handle ASCII letters properly', () => {
  assert.equal(canChangeCase('a'), true);
  assert.equal(canChangeCase('Z'), true);
  assert.equal(canChangeCase('5'), false);
  assert.equal(canChangeCase('!'), false);

  assert.equal(swapCase('a'), 'A');
  assert.equal(swapCase('Z'), 'z');
  assert.equal(swapCase('0'), '0');
});

test('getSimilarTargets finds expected homoglyphs for O, l, S, i', () => {
  const oTargets = getSimilarTargets('O', DEFAULT_SIMILAR_RULES).map((t) => t.target);
  assert.ok(oTargets.includes('0'), 'O should map to 0');

  const lTargets = getSimilarTargets('l', DEFAULT_SIMILAR_RULES).map((t) => t.target);
  assert.ok(lTargets.includes('1'), 'l should map to 1');

  const sTargets = getSimilarTargets('S', DEFAULT_SIMILAR_RULES).map((t) => t.target);
  assert.ok(sTargets.includes('5'), 'S should map to 5');

  const iTargets = getSimilarTargets('i', DEFAULT_SIMILAR_RULES).map((t) => t.target);
  assert.ok(iTargets.includes('!'), 'i should map to !');

  const twoTargets = getSimilarTargets('2', DEFAULT_SIMILAR_RULES).map((t) => t.target);
  assert.deepEqual(twoTargets, ['z', 'Z'], '2 should map to z and Z');
});

test('transformCharacter respects 100% single-mode weights', () => {
  // 1. 100% none -> unchanged
  const stepNone = transformCharacter(
    'O',
    0,
    { none: 100, case: 0, similar: 0 },
    DEFAULT_SIMILAR_RULES,
    () => 0.5
  );
  assert.equal(stepNone.action, 'none');
  assert.equal(stepNone.transformed, 'O');

  // 2. 100% case -> flips case
  const stepCase = transformCharacter(
    'O',
    0,
    { none: 0, case: 100, similar: 0 },
    DEFAULT_SIMILAR_RULES,
    () => 0.5
  );
  assert.equal(stepCase.action, 'case');
  assert.equal(stepCase.transformed, 'o');

  // 3. 100% similar -> converts O to 0
  const stepSimilar = transformCharacter(
    'O',
    0,
    { none: 0, case: 0, similar: 100 },
    DEFAULT_SIMILAR_RULES,
    () => 0.0
  );
  assert.equal(stepSimilar.action, 'similar');
  assert.equal(stepSimilar.transformed, '0');
});

test('transformString produces accurate stats and step lengths', () => {
  const input = 'OliS2026';
  const result = transformString(
    input,
    { none: 0, case: 0, similar: 100 },
    DEFAULT_SIMILAR_RULES,
    () => 0.0 // always picks first target
  );

  assert.equal(result.steps.length, input.length);
  assert.equal(result.stats.totalChars, input.length);
  // O -> 0, l -> 1, i -> !, S -> 5, 2 -> z
  assert.equal(result.output.slice(0, 5), '01!5z');
  assert.ok(result.stats.similarCount >= 5);
});

test('generateBatchCandidates returns requested number of candidates clamped to 1..10', () => {
  let seed = 1;
  const pseudoRng = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const batch5 = generateBatchCandidates(
    'Solaris OliS 2026',
    5,
    { none: 30, case: 30, similar: 40 },
    DEFAULT_SIMILAR_RULES,
    pseudoRng
  );
  assert.equal(batch5.length, 5);

  const batchClamped = generateBatchCandidates(
    'Solaris OliS 2026',
    15,
    { none: 30, case: 30, similar: 40 },
    DEFAULT_SIMILAR_RULES,
    pseudoRng
  );
  assert.equal(batchClamped.length, 10);
});
