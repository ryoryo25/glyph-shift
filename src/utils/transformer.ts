export type TransformAction = 'none' | 'case' | 'similar';

export interface SimilarRule {
  id: string;
  source: string;
  targets: string[];
  description: string;
  enabled: boolean;
  caseSensitive?: boolean;
}

export interface TransformWeights {
  none: number;    // 何もしない (0 - 100)
  case: number;    // 大文字・小文字変換 (0 - 100)
  similar: number; // 似ている形の文字に変換 (0 - 100)
}

export interface CharacterStep {
  index: number;
  original: string;
  transformed: string;
  action: TransformAction;
  ruleApplied?: string;
}

export interface TransformResult {
  id: string;
  input: string;
  output: string;
  steps: CharacterStep[];
  stats: {
    totalChars: number;
    noneCount: number;
    caseCount: number;
    similarCount: number;
  };
  timestamp: number;
}

export const DEFAULT_SIMILAR_RULES: SimilarRule[] = [
  {
    id: 'rule-a-4',
    source: 'A',
    targets: ['4', '@'],
    description: 'A / a → 4, @ (エーを4やアットマークに)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-b-8',
    source: 'B',
    targets: ['8', '6'],
    description: 'B / b → 8, 6 (ビーを8や6に)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-c-paren',
    source: 'C',
    targets: ['(', '<', '{', '['],
    description: 'C / c → (, <, {, [ (シーを括弧類に)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-e-3',
    source: 'E',
    targets: ['3', '&'],
    description: 'E / e → 3, & (イーを3やアンパサンドに)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-g-6',
    source: 'G',
    targets: ['6', '9', '&'],
    description: 'G / g → 6, 9, & (ジーを6や9に)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-h-hash',
    source: 'H',
    targets: ['#'],
    description: 'H / h → # (エイチをシャープ記号に)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-i-excl',
    source: 'i',
    targets: ['!', '1', ':', '|'],
    description: 'i → !, 1, :, | (小文字アイを感嘆符や1に)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-I-1',
    source: 'I',
    targets: ['1', '|', '!'],
    description: 'I → 1, |, ! (大文字アイを1や縦棒に)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-l-1',
    source: 'l',
    targets: ['1', '|', '!'],
    description: 'l → 1, |, ! (小文字エルを1や縦棒に)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-L-1',
    source: 'L',
    targets: ['1', '|', '[', '7'],
    description: 'L → 1, |, [, 7 (大文字エルを1や縦棒・角括弧に)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-o-0',
    source: 'O',
    targets: ['0', '*'],
    description: 'O / o → 0, * (オーをゼロやアスタリスクに)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-p-9',
    source: 'P',
    targets: ['9', '?'],
    description: 'P / p → 9, ? (ピーを9や疑問符に)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-q-9',
    source: 'Q',
    targets: ['9', '0'],
    description: 'Q / q → 9, 0 (キューを9や0に)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-s-5',
    source: 'S',
    targets: ['5', '$', 'z'],
    description: 'S / s → 5, $, z (エスを5やドル記号に)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-t-7',
    source: 'T',
    targets: ['7', '+'],
    description: 'T / t → 7, + (ティーを7やプラスに)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-u-v',
    source: 'U',
    targets: ['v', 'V'],
    description: 'U / u → v, V (ユーをブイに)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-v-u',
    source: 'V',
    targets: ['u', 'U', '^'],
    description: 'V / v → u, U, ^ (ブイをユーやキャレットに)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-x-pct',
    source: 'X',
    targets: ['%', '*'],
    description: 'X / x → %, * (エックスをパーセントやアスタリスクに)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-y-7',
    source: 'Y',
    targets: ['7', 'v'],
    description: 'Y / y → 7, v (ワイを7やvに)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-z-2',
    source: 'Z',
    targets: ['2', '7', '%'],
    description: 'Z / z → 2, 7, % (ゼットを2や7に)',
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule-0-O',
    source: '0',
    targets: ['O', 'o'],
    description: '0 → O, o (数字の0を英字オーに)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-1-l',
    source: '1',
    targets: ['l', 'I', '!', '|'],
    description: '1 → l, I, !, | (数字の1をエルやアイ・縦棒に)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-2-z',
    source: '2',
    targets: ['z', 'Z'],
    description: '2 → z, Z (数字の2をゼットに)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-3-E',
    source: '3',
    targets: ['E', 'e'],
    description: '3 → E, e (数字の3をイーに)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-4-A',
    source: '4',
    targets: ['A', 'a'],
    description: '4 → A, a (数字の4をエーに)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-5-S',
    source: '5',
    targets: ['S', 's', '$'],
    description: '5 → S, s, $ (数字の5をエスやドルに)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-6-G',
    source: '6',
    targets: ['G', 'g', 'b'],
    description: '6 → G, g, b (数字の6をジーやビーに)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-7-T',
    source: '7',
    targets: ['T', 't', 'Z', 'Y'],
    description: '7 → T, t, Z, Y (数字の7をティーやゼットに)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-8-B',
    source: '8',
    targets: ['B', 'b', '&'],
    description: '8 → B, b, & (数字の8をビーやアンパサンドに)',
    enabled: true,
    caseSensitive: true,
  },
  {
    id: 'rule-9-g',
    source: '9',
    targets: ['g', 'q', 'P'],
    description: '9 → g, q, P (数字の9をgやqに)',
    enabled: true,
    caseSensitive: true,
  },
];

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  weights: TransformWeights;
}

export const TRANSFORM_PRESETS: PresetConfig[] = [
  {
    id: 'balanced',
    name: 'バランス',
    description: 'そのまま30%・大小30%・Leet40%の標準バランス',
    weights: { none: 30, case: 30, similar: 40 },
  },
  {
    id: 'leet-heavy',
    name: 'Leet強め',
    description: 'O→0, l→1, S→5, i→! などの類似形状変換を優先',
    weights: { none: 15, case: 20, similar: 65 },
  },
  {
    id: 'case-only',
    name: '大小変換のみ',
    description: '記号や数字への置換を行わず大文字・小文字をランダム反転',
    weights: { none: 45, case: 55, similar: 0 },
  },
  {
    id: 'similar-only',
    name: 'Leetのみ',
    description: '大文字小文字は維持し、似ている文字への変換のみ適用',
    weights: { none: 40, case: 0, similar: 60 },
  },
  {
    id: 'max-chaos',
    name: 'フル変換',
    description: '変換可能なすべての文字に対して大小変換またはLeet変換を実行',
    weights: { none: 0, case: 45, similar: 55 },
  },
];

/**
 * Checks whether a string consists strictly of printable ASCII characters (0x21 - 0x7E).
 */
export function isAsciiPrintable(str: string): boolean {
  return /^[\x21-\x7E]+$/.test(str);
}

/**
 * Checks whether a single character is an ASCII English letter that can change case.
 */
export function canChangeCase(char: string): boolean {
  return /^[a-zA-Z]$/.test(char);
}

/**
 * Flips the case of an ASCII alphabetic character, or randomly picks upper/lower.
 * To make "大文字、小文字変換" distinct from "何もしない", when 'case' is chosen,
 * it converts uppercase to lowercase and lowercase to uppercase.
 */
export function swapCase(char: string): string {
  if (!canChangeCase(char)) return char;
  return char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
}

/**
 * Finds all candidate similar replacement characters for a given input char
 * based on active SimilarRule entries. Strictly filters targets to printable ASCII.
 */
export function getSimilarTargets(char: string, rules: SimilarRule[]): { target: string; ruleDesc: string }[] {
  const candidates: { target: string; ruleDesc: string }[] = [];
  for (const rule of rules) {
    if (!rule.enabled || rule.targets.length === 0) continue;
    const matches = rule.caseSensitive
      ? rule.source === char
      : rule.source.toLowerCase() === char.toLowerCase();

    if (matches) {
      for (const target of rule.targets) {
        if (target && target !== char && isAsciiPrintable(target)) {
          candidates.push({
            target,
            ruleDesc: `${char} → ${target}`,
          });
        }
      }
    }
  }
  return candidates;
}

/**
 * Transforms a single character using weighted probabilities for:
 * - 'none': 何もしない
 * - 'case': 大文字、小文字変換
 * - 'similar': 似ている形の文字に変換
 */
export function transformCharacter(
  char: string,
  index: number,
  weights: TransformWeights,
  rules: SimilarRule[],
  rng: () => number = Math.random
): CharacterStep {
  const caseAvailable = canChangeCase(char) && weights.case > 0;
  const similarCandidates = weights.similar > 0 ? getSimilarTargets(char, rules) : [];
  const similarAvailable = similarCandidates.length > 0 && weights.similar > 0;

  const effectiveWeights: { action: TransformAction; weight: number }[] = [];

  if (weights.none > 0) {
    effectiveWeights.push({ action: 'none', weight: weights.none });
  }
  if (caseAvailable) {
    effectiveWeights.push({ action: 'case', weight: weights.case });
  }
  if (similarAvailable) {
    effectiveWeights.push({ action: 'similar', weight: weights.similar });
  }

  // If no weighted action applies for this character (e.g., symbol or weight=0), keep unchanged
  const totalWeight = effectiveWeights.reduce((acc, item) => acc + item.weight, 0);
  if (totalWeight <= 0) {
    return {
      index,
      original: char,
      transformed: char,
      action: 'none',
    };
  }

  const roll = rng() * totalWeight;
  let cumulative = 0;
  let chosenAction: TransformAction = 'none';

  for (const item of effectiveWeights) {
    cumulative += item.weight;
    if (roll < cumulative) {
      chosenAction = item.action;
      break;
    }
  }

  if (chosenAction === 'case') {
    const flipped = swapCase(char);
    return {
      index,
      original: char,
      transformed: flipped,
      action: 'case',
      ruleApplied: `${char} → ${flipped} (大小変換)`,
    };
  }

  if (chosenAction === 'similar' && similarCandidates.length > 0) {
    const pickIdx = Math.min(
      similarCandidates.length - 1,
      Math.floor(rng() * similarCandidates.length)
    );
    const chosen = similarCandidates[pickIdx];
    return {
      index,
      original: char,
      transformed: chosen.target,
      action: 'similar',
      ruleApplied: `${chosen.ruleDesc} (類似文字)`,
    };
  }

  return {
    index,
    original: char,
    transformed: char,
    action: 'none',
  };
}

/**
 * Transforms an entire string and returns rich step-by-step metadata and statistics.
 */
export function transformString(
  input: string,
  weights: TransformWeights,
  rules: SimilarRule[],
  rng: () => number = Math.random
): TransformResult {
  const chars = Array.from(input);
  const steps: CharacterStep[] = chars.map((ch, idx) =>
    transformCharacter(ch, idx, weights, rules, rng)
  );

  const output = steps.map((s) => s.transformed).join('');
  let noneCount = 0;
  let caseCount = 0;
  let similarCount = 0;

  for (const step of steps) {
    if (step.action === 'none') noneCount++;
    else if (step.action === 'case') caseCount++;
    else if (step.action === 'similar') similarCount++;
  }

  return {
    id: `tr-${Date.now()}-${Math.floor(rng() * 100000)}`,
    input,
    output,
    steps,
    stats: {
      totalChars: chars.length,
      noneCount,
      caseCount,
      similarCount,
    },
    timestamp: Date.now(),
  };
}

/**
 * Generates multiple distinct candidate strings in one batch.
 */
export function generateBatchCandidates(
  input: string,
  count: number,
  weights: TransformWeights,
  rules: SimilarRule[],
  rng: () => number = Math.random
): TransformResult[] {
  const safeCount = Math.max(1, Math.min(10, Math.floor(count) || 5));
  const results: TransformResult[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  const maxAttempts = safeCount * 6;

  while (results.length < safeCount && attempts < maxAttempts) {
    attempts++;
    const res = transformString(input, weights, rules, rng);
    if (!seen.has(res.output) || attempts >= safeCount * 3) {
      seen.add(res.output);
      results.push({
        ...res,
        id: `batch-${results.length}-${Math.floor(rng() * 1000000)}`,
      });
    }
  }

  return results;
}
