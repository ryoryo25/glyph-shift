/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_SIMILAR_RULES,
  TRANSFORM_PRESETS,
  SimilarRule,
  TransformWeights,
  TransformResult,
  CharacterStep,
  transformString,
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
  RefreshCw,
  Trash2,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

interface HistoryEntry {
  id: string;
  input: string;
  output: string;
  timestamp: string;
  statsSummary: string;
}

const SAMPLE_INPUTS = [
  { label: 'SolarisOliS2026', value: 'SolarisOliS2026' },
  { label: 'HelloWorld108', value: 'HelloWorld108' },
  { label: 'PasswordGuard99', value: 'PasswordGuard99' },
  { label: 'TokyoStation2026', value: 'TokyoStation2026' },
];

const STORAGE_KEY_RULES = 'glyphshift_rules_v2';
const STORAGE_KEY_HISTORY = 'glyphshift_history_v1';

export default function App() {
  const [inputText, setInputText] = useState<string>('SolarisOliS2026');
  const [activePresetId, setActivePresetId] = useState<string>('balanced');
  const [weights, setWeights] = useState<TransformWeights>({
    none: 35,
    case: 35,
    similar: 30,
  });

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

  const [currentResult, setCurrentResult] = useState<TransformResult>(() =>
    transformString('SolarisOliS2026', { none: 35, case: 35, similar: 30 }, DEFAULT_SIMILAR_RULES)
  );

  const [batchCandidates, setBatchCandidates] = useState<TransformResult[]>(() =>
    generateBatchCandidates('SolarisOliS2026', 6, { none: 35, case: 35, similar: 30 }, DEFAULT_SIMILAR_RULES)
  );

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
    } catch {
      // ignore storage errors
    }
  }, [rules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // ignore storage errors
    }
  }, [history]);

  const runConversion = useCallback(
    (text: string, w: TransformWeights, r: SimilarRule[]) => {
      if (!text) {
        setCurrentResult({
          id: 'empty',
          input: '',
          output: '',
          steps: [],
          stats: { totalChars: 0, noneCount: 0, caseCount: 0, similarCount: 0 },
          timestamp: Date.now(),
        });
        setBatchCandidates([]);
        return;
      }
      const nextMain = transformString(text, w, r);
      const nextBatch = generateBatchCandidates(text, 6, w, r);
      setCurrentResult(nextMain);
      setBatchCandidates(nextBatch);
    },
    []
  );

  const handleInputChange = (newText: string) => {
    setInputText(newText);
    runConversion(newText, weights, rules);
  };

  const handleRegenerateAll = () => {
    runConversion(inputText, weights, rules);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = TRANSFORM_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    const nextWeights = { ...preset.weights };
    setWeights(nextWeights);
    runConversion(inputText, nextWeights, rules);
  };

  const handleWeightChange = (key: keyof TransformWeights, val: number) => {
    const nextWeights = { ...weights, [key]: val };
    // Ensure at least one weight is positive
    if (
      nextWeights.none === 0 &&
      nextWeights.case === 0 &&
      nextWeights.similar === 0
    ) {
      nextWeights.none = 10;
    }
    setActivePresetId('custom');
    setWeights(nextWeights);
    runConversion(inputText, nextWeights, rules);
  };

  const handleCycleCharacter = (charIndex: number) => {
    setCurrentResult((prev) => {
      const targetStep = prev.steps[charIndex];
      if (!targetStep) return prev;

      const orig = targetStep.original;
      const canFlipCase = canChangeCase(orig);
      const similarList = getSimilarTargets(orig, rules);

      // Determine next action in cycle: none -> case -> similar -> none
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

      const nextSteps = prev.steps.map((s, idx) =>
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

      return {
        ...prev,
        output: nextOutput,
        steps: nextSteps,
        stats: {
          totalChars: nextSteps.length,
          noneCount,
          caseCount,
          similarCount,
        },
      };
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

    // Record in history
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.output !== textToCopy);
      return [
        {
          id: `hist-${Date.now()}`,
          input: inputText,
          output: textToCopy,
          timestamp: timeStr,
          statsSummary: `${textToCopy.length}文字`,
        },
        ...filtered,
      ].slice(0, 15);
    });
  };

  const handleToggleRule = (id: string) => {
    const nextRules = rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setRules(nextRules);
    runConversion(inputText, weights, nextRules);
  };

  const handleEnableAllRules = (enabled: boolean) => {
    const nextRules = rules.map((r) => ({ ...r, enabled }));
    setRules(nextRules);
    runConversion(inputText, weights, nextRules);
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
    runConversion(inputText, weights, nextRules);
  };

  const handleDeleteRule = (id: string) => {
    const nextRules = rules.filter((r) => r.id !== id);
    setRules(nextRules);
    runConversion(inputText, weights, nextRules);
  };

  const handleResetRules = () => {
    setRules(DEFAULT_SIMILAR_RULES);
    runConversion(inputText, weights, DEFAULT_SIMILAR_RULES);
  };

  const totalWeight = weights.none + weights.case + weights.similar || 1;
  const pctNone = Math.round((weights.none / totalWeight) * 100);
  const pctCase = Math.round((weights.case / totalWeight) * 100);
  const pctSimilar = Math.max(0, 100 - pctNone - pctCase);

  const isMainCopied = copiedId === 'main-output';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
        <a
          href="#workspace"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          GlyphShift
        </a>

        <nav
          aria-label="メインナビゲーション"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#workspace"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            変換ワークスペース
          </a>
          <a
            href="#breakdown"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            文字別内訳
          </a>
          <a
            href="#candidates"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            一括候補比較
          </a>
          <a
            href="#dictionary"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            類似文字辞書
          </a>
          <a
            href="#history"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            コピー履歴
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRegenerateAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ランダム再変換
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Intro Header */}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              英数字ランダム変換・類似文字ジェネレーター
            </h1>
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>ブラウザ内ローカル完結処理（外部通信なし）</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            入力した英数字列の1文字ずつに対して「何もしない」「大文字・小文字変換」「似ている形の文字に変換（O→0, l→1, S→5, i→! など）」をランダムに適用し、変換結果を即座に表示・クリップボードへコピーできます。
          </p>
        </section>

        {/* Primary Two-Column Workspace */}
        <section
          id="workspace"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        >
          {/* Left Column: Input + Probability Settings */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="source-string-input"
                  className="text-sm font-bold text-slate-900"
                >
                  1. 変換元の英数字列を入力
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
                rows={3}
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="変換したい英数字を入力してください (例: SolarisOliS2026)"
                className="w-full px-4 py-3 text-lg font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors resize-y"
              />

              {/* Quick Sample Presets */}
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
            </div>

            {/* Mode Presets & Probability Sliders */}
            <div className="pt-5 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Sliders className="w-4 h-4 text-slate-700" />
                  <span>2. 変換モード・出現比率の設定</span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  維持 {pctNone}% / 大小 {pctCase}% / 類似 {pctSimilar}%
                </span>
              </div>

              {/* Segmented Preset Buttons */}
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
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activePresetId === preset.id
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* 3 Weight Sliders */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label
                      htmlFor="weight-none"
                      className="font-medium text-slate-700"
                    >
                      何もしない（原形維持）
                    </label>
                    <span className="font-mono text-slate-600">
                      重み: {weights.none} ({pctNone}%)
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

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label
                      htmlFor="weight-case"
                      className="font-medium text-sky-800"
                    >
                      大文字・小文字変換 (A ↔ a)
                    </label>
                    <span className="font-mono text-sky-800">
                      重み: {weights.case} ({pctCase}%)
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

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label
                      htmlFor="weight-similar"
                      className="font-medium text-amber-800"
                    >
                      似ている形の文字に変換 (O→0, l→1, S→5, i→! など)
                    </label>
                    <span className="font-mono text-amber-800">
                      重み: {weights.similar} ({pctSimilar}%)
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
            </div>
          </div>

          {/* Right Column: Primary Output & Copy Action */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">
                  3. 変換結果（メイン出力）
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>そのまま: {currentResult.stats.noneCount}</span>
                  <span aria-hidden="true">·</span>
                  <span>大小変換: {currentResult.stats.caseCount}</span>
                  <span aria-hidden="true">·</span>
                  <span>類似文字: {currentResult.stats.similarCount}</span>
                </div>
              </div>

              {/* Output Box */}
              <div
                data-testid="primary-output-box"
                className="min-h-[120px] p-5 rounded-lg bg-slate-900 text-white flex flex-col justify-center break-all select-all"
              >
                {currentResult.output ? (
                  <p
                    data-testid="primary-output-text"
                    className="font-mono text-2xl sm:text-3xl font-bold tracking-wide leading-snug"
                  >
                    {currentResult.output}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    左側の入力欄に英数字を入力すると、変換された文字列がここに表示されます。
                  </p>
                )}
              </div>

              {/* Action Buttons: Copy & Re-roll */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <button
                  type="button"
                  disabled={!currentResult.output}
                  onClick={() =>
                    handleCopy(currentResult.output, 'main-output')
                  }
                  className={`sm:col-span-8 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isMainCopied
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isMainCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      クリップボードにコピーしました
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      変換結果をコピーする
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!inputText}
                  onClick={handleRegenerateAll}
                  className="sm:col-span-4 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className="w-4 h-4" />
                  再変換
                </button>
              </div>
            </div>

            {/* Applied Rules Summary List */}
            <div className="pt-5 border-t border-slate-200 space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                今回の変換で適用されたルール内訳
              </div>
              {currentResult.steps.filter((s) => s.action !== 'none').length ===
              0 ? (
                <p className="text-xs text-slate-500">
                  変更された文字はありません（すべて原形維持）。「再変換」を押すか比率スライダーを調整してください。
                </p>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-mono text-slate-700 max-h-28 overflow-y-auto">
                  {currentResult.steps
                    .filter((s) => s.action !== 'none')
                    .map((s) => (
                      <span
                        key={s.index}
                        className="inline-flex items-center gap-1"
                      >
                        <span className="text-slate-400">#{s.index + 1}</span>
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
          </div>
        </section>

        {/* Per-Character Interactive Breakdown */}
        <section
          id="breakdown"
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              1文字ごとの変換インスペクター（個別クリックで微調整）
            </h2>
          </div>
          <CharacterBreakdown
            steps={currentResult.steps}
            onCycleChar={handleCycleCharacter}
          />
        </section>

        {/* Multi-Candidate Batch Generator */}
        <BatchCandidates
          candidates={batchCandidates}
          copiedId={copiedId}
          onCopy={handleCopy}
          onSelectCandidate={(cand) => setCurrentResult(cand)}
          onRegenerateBatch={() =>
            setBatchCandidates(
              generateBatchCandidates(inputText, 6, weights, rules)
            )
          }
        />

        {/* Customizable Similar Character Rule Dictionary */}
        <RuleDictionary
          rules={rules}
          onToggleRule={handleToggleRule}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
          onResetRules={handleResetRules}
          onEnableAll={handleEnableAllRules}
        />

        {/* Copy History Section */}
        <section
          id="history"
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                コピー履歴（ローカル保存）
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                コピーした変換結果はブラウザ内に自動記録され、いつでも再コピーできます。
              </p>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                履歴をクリア
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              まだコピーされた文字列はありません。メイン出力または候補一覧のコピーボタンを押すとここに履歴が残ります。
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
              {history.map((item) => {
                const isCopied = copiedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-bold text-slate-900 break-all">
                        {item.output}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                        <span>元: {item.input}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.statsSummary}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.output, item.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          コピー完了
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          再コピー
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        GlyphShift — ローカル完結型 英数字ランダム変換・類似文字ジェネレーター
      </footer>
    </div>
  );
}
