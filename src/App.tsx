/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DEFAULT_SIMILAR_RULES,
  TRANSFORM_PRESETS,
  SimilarRule,
  TransformWeights,
  TransformResult,
  CharacterStep,
  generateBatchCandidates,
  canChangeCase,
  swapCase,
  getSimilarTargets,
} from './utils/transformer';
import { CharacterBreakdown } from './components/CharacterBreakdown';
import { BatchCandidates } from './components/BatchCandidates';
import { RuleDictionary } from './components/RuleDictionary';
import {
  Copy,
  Check,
  Sliders,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

const SAMPLE_INPUTS = [
  { label: 'SolarisOliS2026', value: 'SolarisOliS2026' },
  { label: 'HelloWorld108', value: 'HelloWorld108' },
  { label: 'PasswordGuard99', value: 'PasswordGuard99' },
  { label: 'TokyoStation2026', value: 'TokyoStation2026' },
];

const STORAGE_KEY_RULES = 'glyphshift_rules_v4';
const DEFAULT_WEIGHTS: TransformWeights = {
  none: 30,
  case: 30,
  similar: 40,
};

export default function App() {
  const [inputText, setInputText] = useState<string>('SolarisOliS2026');
  const [activePresetId, setActivePresetId] = useState<string>('balanced');
  const [weights, setWeights] = useState<TransformWeights>(DEFAULT_WEIGHTS);
  const [candidateCount, setCandidateCount] = useState<number>(5);

  const [rules, setRules] = useState<SimilarRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RULES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore localStorage read errors
    }
    return DEFAULT_SIMILAR_RULES;
  });

  const [candidates, setCandidates] = useState<TransformResult[]>(() =>
    generateBatchCandidates('SolarisOliS2026', 5, DEFAULT_WEIGHTS, DEFAULT_SIMILAR_RULES)
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Accordions (both hidden by default per specification)
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState<boolean>(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inspectorSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
    } catch {
      // ignore storage errors
    }
  }, [rules]);

  const runConversion = useCallback(
    (text: string, count: number, w: TransformWeights, r: SimilarRule[]) => {
      if (!text) {
        setCandidates([]);
        setSelectedIndex(0);
        return;
      }
      const clampedCount = Math.max(1, Math.min(10, count));
      const nextBatch = generateBatchCandidates(text, clampedCount, w, r);
      setCandidates(nextBatch);
      setSelectedIndex((prev) => (prev < nextBatch.length ? prev : 0));
    },
    []
  );

  const handleInputChange = (newText: string) => {
    setInputText(newText);
    runConversion(newText, candidateCount, weights, rules);
  };

  const handleCountChange = (newCount: number) => {
    const safeCount = Math.max(1, Math.min(10, Math.floor(newCount) || 1));
    setCandidateCount(safeCount);
    runConversion(inputText, safeCount, weights, rules);
  };

  const handleRegenerateBatch = () => {
    runConversion(inputText, candidateCount, weights, rules);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = TRANSFORM_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    const nextWeights = { ...preset.weights };
    setWeights(nextWeights);
    runConversion(inputText, candidateCount, nextWeights, rules);
  };

  const handleWeightChange = (key: keyof TransformWeights, val: number) => {
    const nextWeights = { ...weights, [key]: val };
    if (
      nextWeights.none === 0 &&
      nextWeights.case === 0 &&
      nextWeights.similar === 0
    ) {
      nextWeights.none = 10;
    }
    setActivePresetId('custom');
    setWeights(nextWeights);
    runConversion(inputText, candidateCount, nextWeights, rules);
  };

  const handleInspectCandidate = (index: number) => {
    setSelectedIndex(index);
    setIsInspectorOpen(true);
    setTimeout(() => {
      inspectorSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  };

  const handleCycleCharacter = (charIndex: number) => {
    setCandidates((prevList) => {
      const targetItem = prevList[selectedIndex];
      if (!targetItem) return prevList;

      const targetStep = targetItem.steps[charIndex];
      if (!targetStep) return prevList;

      const orig = targetStep.original;
      const canFlipCase = canChangeCase(orig);
      const similarList = getSimilarTargets(orig, rules);

      const order: ('none' | 'case' | 'similar')[] = ['none'];
      if (canFlipCase) order.push('case');
      if (similarList.length > 0) order.push('similar');

      const currentOrderIdx = order.indexOf(targetStep.action);
      const nextAction = order[(currentOrderIdx + 1) % order.length];

      let nextStep: CharacterStep = {
        index: charIndex,
        original: orig,
        transformed: orig,
        action: 'none',
      };

      if (nextAction === 'case') {
        const flipped = swapCase(orig);
        nextStep = {
          index: charIndex,
          original: orig,
          transformed: flipped,
          action: 'case',
          ruleApplied: `${orig} → ${flipped} (大小変換)`,
        };
      } else if (nextAction === 'similar' && similarList.length > 0) {
        const pick =
          similarList[Math.floor(Math.random() * similarList.length)];
        nextStep = {
          index: charIndex,
          original: orig,
          transformed: pick.target,
          action: 'similar',
          ruleApplied: `${pick.ruleDesc} (類似文字)`,
        };
      }

      const nextSteps = targetItem.steps.map((s, idx) =>
        idx === charIndex ? nextStep : s
      );
      const nextOutput = nextSteps.map((s) => s.transformed).join('');

      let noneCount = 0;
      let caseCount = 0;
      let similarCount = 0;
      for (const s of nextSteps) {
        if (s.action === 'none') noneCount++;
        else if (s.action === 'case') caseCount++;
        else if (s.action === 'similar') similarCount++;
      }

      const updatedItem: TransformResult = {
        ...targetItem,
        output: nextOutput,
        steps: nextSteps,
        stats: {
          totalChars: nextSteps.length,
          noneCount,
          caseCount,
          similarCount,
        },
      };

      return prevList.map((item, idx) =>
        idx === selectedIndex ? updatedItem : item
      );
    });
  };

  const handleCopy = async (textToCopy: string, sourceId: string) => {
    if (!textToCopy) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      // Fallback handled silently
    }

    setCopiedId(sourceId);
    setTimeout(() => {
      setCopiedId((prev) => (prev === sourceId ? null : prev));
    }, 2000);
  };

  const handleToggleRule = (id: string) => {
    const nextRules = rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setRules(nextRules);
    runConversion(inputText, candidateCount, weights, nextRules);
  };

  const handleEnableAllRules = (enabled: boolean) => {
    const nextRules = rules.map((r) => ({ ...r, enabled }));
    setRules(nextRules);
    runConversion(inputText, candidateCount, weights, nextRules);
  };

  const handleAddRule = (
    source: string,
    targets: string[],
    description: string
  ) => {
    const newRule: SimilarRule = {
      id: `custom-${Date.now()}`,
      source,
      targets,
      description,
      enabled: true,
      caseSensitive: false,
    };
    const nextRules = [newRule, ...rules];
    setRules(nextRules);
    runConversion(inputText, candidateCount, weights, nextRules);
  };

  const handleDeleteRule = (id: string) => {
    const nextRules = rules.filter((r) => r.id !== id);
    setRules(nextRules);
    runConversion(inputText, candidateCount, weights, nextRules);
  };

  const handleResetRules = () => {
    setRules(DEFAULT_SIMILAR_RULES);
    runConversion(inputText, candidateCount, weights, DEFAULT_SIMILAR_RULES);
  };

  const totalWeight = weights.none + weights.case + weights.similar || 1;
  const pctNone = Math.round((weights.none / totalWeight) * 100);
  const pctCase = Math.round((weights.case / totalWeight) * 100);
  const pctSimilar = Math.max(0, 100 - pctNone - pctCase);

  const selectedCandidate = candidates[selectedIndex] || null;
  const isInspectorCopied =
    selectedCandidate && copiedId === `inspect-${selectedCandidate.id}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header without top-right regenerate button */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
        <a
          href="#input-section"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          GlyphShift
        </a>

        <nav
          aria-label="セクション移動"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#input-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            文字列入力
          </a>
          <a
            href="#config-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            モード・割合設定
          </a>
          <a
            href="#results"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            変換結果リスト
          </a>
          <a
            href="#inspector"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            インスペクタ
          </a>
          <a
            href="#dictionary"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            変換ルール一覧
          </a>
        </nav>

        <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>ローカル完結処理</span>
        </div>
      </header>

      {/* Main Single-Column Vertical Stack */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title & Summary */}
        <section className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            英数字ランダム変換・類似文字ジェネレーター
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            入力した英数字列に対して「そのまま維持」「大文字・小文字変換」「似ている形の文字に変換（O→0, l→1, S→5, i→!, 2→z/Z などのASCII文字）」をランダムに適用し、一覧表示・コピーします。
          </p>
        </section>

        {/* 1. 変換元文字列入力欄 */}
        <section
          id="input-section"
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="source-string-input"
              className="text-base font-bold text-slate-900"
            >
              1. 変換元文字列の入力
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>{inputText.length} 文字</span>
              {inputText && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('')}
                    className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    クリア
                  </button>
                </>
              )}
            </div>
          </div>

          <textarea
            id="source-string-input"
            rows={2}
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="変換したい英数字を入力してください (例: SolarisOliS2026)"
            className="w-full px-4 py-3 text-lg font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors resize-y"
          />

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 mr-1">サンプル入力:</span>
            {SAMPLE_INPUTS.map((sample) => (
              <button
                key={sample.value}
                type="button"
                onClick={() => handleInputChange(sample.value)}
                className={`px-2.5 py-1 font-mono rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  inputText === sample.value
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </section>

        {/* 2. 変換モード・割合指定・変換リスト生成数指定 (デフォルト5、max10) */}
        <section
          id="config-section"
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">
                2. 変換モード・割合指定・変換リスト生成数指定
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              そのまま {pctNone}% / 大小 {pctCase}% / Leet {pctSimilar}% · 生成数 {candidateCount}件
            </span>
          </div>

          {/* Mode Presets */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              変換モードプリセット
            </div>
            <div
              className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg"
              role="group"
              aria-label="変換モードプリセット"
            >
              {TRANSFORM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePresetId === preset.id
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Weight Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs">
                <label
                  htmlFor="weight-none"
                  className="font-semibold text-slate-700"
                >
                  そのまま（何もしない）
                </label>
                <span className="font-mono text-slate-600">
                  {weights.none} ({pctNone}%)
                </span>
              </div>
              <input
                id="weight-none"
                type="range"
                min={0}
                max={100}
                step={5}
                value={weights.none}
                onChange={(e) =>
                  handleWeightChange('none', Number(e.target.value))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-sky-50/50 border border-sky-200/80 space-y-2">
              <div className="flex justify-between text-xs">
                <label
                  htmlFor="weight-case"
                  className="font-semibold text-sky-900"
                >
                  大文字・小文字変換
                </label>
                <span className="font-mono text-sky-800">
                  {weights.case} ({pctCase}%)
                </span>
              </div>
              <input
                id="weight-case"
                type="range"
                min={0}
                max={100}
                step={5}
                value={weights.case}
                onChange={(e) =>
                  handleWeightChange('case', Number(e.target.value))
                }
                className="w-full accent-sky-700 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/80 space-y-2">
              <div className="flex justify-between text-xs">
                <label
                  htmlFor="weight-similar"
                  className="font-semibold text-amber-900"
                >
                  Leet（似ている文字に変換）
                </label>
                <span className="font-mono text-amber-800">
                  {weights.similar} ({pctSimilar}%)
                </span>
              </div>
              <input
                id="weight-similar"
                type="range"
                min={0}
                max={100}
                step={5}
                value={weights.similar}
                onChange={(e) =>
                  handleWeightChange('similar', Number(e.target.value))
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Candidate List Count Control (Default 5, Max 10) */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label
                htmlFor="candidate-count-slider"
                className="text-xs font-semibold text-slate-800 block"
              >
                変換リスト生成数の指定（デフォルト: 5 / 最大: 10）
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                一度に生成して並べるランダム変換候補の件数を1〜10件の間で指定します。
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <input
                id="candidate-count-slider"
                type="range"
                min={1}
                max={10}
                step={1}
                value={candidateCount}
                onChange={(e) => handleCountChange(Number(e.target.value))}
                className="w-36 accent-slate-900 cursor-pointer"
              />
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  aria-label="変換リスト生成数"
                  min={1}
                  max={10}
                  value={candidateCount}
                  onChange={(e) => handleCountChange(Number(e.target.value))}
                  className="w-16 px-2.5 py-1.5 text-sm font-bold text-center bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-600">件</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 変換結果リスト */}
        <BatchCandidates
          candidates={candidates}
          selectedIndex={selectedIndex}
          copiedId={copiedId}
          onCopy={handleCopy}
          onInspectCandidate={handleInspectCandidate}
          onRegenerateBatch={handleRegenerateBatch}
        />

        {/* 4. 変換ルール・インスペクタ (アコーディオンで初期状態では隠す) */}
        <section
          id="inspector"
          ref={inspectorSectionRef}
          className="scroll-mt-20 bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            aria-expanded={isInspectorOpen}
            aria-controls="inspector-panel-content"
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900">
                  4. 変換ルール・インスペクタ（1文字ごとの内訳・微調整）
                </h2>
                {selectedCandidate && (
                  <span className="text-xs font-mono text-slate-500 truncate max-w-xs">
                    選択中: #{String(selectedIndex + 1).padStart(2, '0')} ({selectedCandidate.output})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                各文字に適用された変換ルールの内訳確認と、1文字単位でのクリック個別変換を行えます。
              </p>
            </div>

            <ChevronDown
              className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-150 ${
                isInspectorOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isInspectorOpen && (
            <div
              id="inspector-panel-content"
              className="px-6 pb-6 pt-4 border-t border-slate-200 space-y-5"
            >
              {selectedCandidate ? (
                <>
                  {/* Selected item bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-900 text-white">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono text-slate-400">
                        候補 #{String(selectedIndex + 1).padStart(2, '0')} の微調整プレビュー
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-bold tracking-wide break-all mt-0.5">
                        {selectedCandidate.output}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          selectedCandidate.output,
                          `inspect-${selectedCandidate.id}`
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isInspectorCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isInspectorCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          コピー完了
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          この文字列をコピー
                        </>
                      )}
                    </button>
                  </div>

                  {/* Per-Character Interactive Breakdown */}
                  <CharacterBreakdown
                    steps={selectedCandidate.steps}
                    onCycleChar={handleCycleCharacter}
                  />

                  {/* Applied Rules Breakdown */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">
                      適用された変換ルール一覧
                    </div>
                    {selectedCandidate.steps.filter((s) => s.action !== 'none')
                      .length === 0 ? (
                      <p className="text-xs text-slate-500">
                        変更された文字はありません（すべて原形維持）。
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-mono text-slate-700">
                        {selectedCandidate.steps
                          .filter((s) => s.action !== 'none')
                          .map((s) => (
                            <span
                              key={s.index}
                              className="inline-flex items-center gap-1"
                            >
                              <span className="text-slate-400">
                                #{s.index + 1}
                              </span>
                              <span
                                className={
                                  s.action === 'similar'
                                    ? 'text-amber-800 font-semibold'
                                    : 'text-sky-800 font-semibold'
                                }
                              >
                                {s.ruleApplied}
                              </span>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-sm text-slate-500">
                  変換元の文字列を入力すると、インスペクタが利用可能になります。
                </div>
              )}
            </div>
          )}
        </section>

        {/* 5. 変換ルール一覧 (アコーディオン) */}
        <RuleDictionary
          rules={rules}
          isOpen={isDictionaryOpen}
          onToggleOpen={() => setIsDictionaryOpen((prev) => !prev)}
          onToggleRule={handleToggleRule}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
          onResetRules={handleResetRules}
          onEnableAll={handleEnableAllRules}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        GlyphShift — ローカル完結型 英数字ランダム変換・類似文字ジェネレーター
      </footer>
    </div>
  );
}
