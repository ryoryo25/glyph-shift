import React, { useState } from 'react';
import { SimilarRule, isAsciiPrintable } from '../utils/transformer';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';

interface RuleDictionaryProps {
  rules: SimilarRule[];
  onToggleRule: (id: string) => void;
  onAddRule: (source: string, targets: string[], description: string) => void;
  onDeleteRule: (id: string) => void;
  onResetRules: () => void;
  onEnableAll: (enabled: boolean) => void;
}

export const RuleDictionary: React.FC<RuleDictionaryProps> = ({
  rules,
  onToggleRule,
  onAddRule,
  onDeleteRule,
  onResetRules,
  onEnableAll,
}) => {
  const [newSource, setNewSource] = useState('');
  const [newTargets, setNewTargets] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSource = newSource.trim();
    if (trimmedSource.length !== 1 || !isAsciiPrintable(trimmedSource)) {
      setErrorMsg('変換元の文字は半角アスキー文字1文字で入力してください（例: C）');
      return;
    }

    const parsedTargets = newTargets
      .split(/[,、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedTargets.length === 0) {
      setErrorMsg('変換先の類似文字を1つ以上入力してください（例: (, <, {）');
      return;
    }

    if (parsedTargets.some((t) => !isAsciiPrintable(t))) {
      setErrorMsg('変換先の候補は半角アスキー文字（英数字・半角記号）のみ指定できます。');
      return;
    }

    const desc =
      newDesc.trim() ||
      `${trimmedSource} → ${parsedTargets.join(', ')} (カスタムルール)`;

    onAddRule(trimmedSource, parsedTargets, desc);
    setNewSource('');
    setNewTargets('');
    setNewDesc('');
    setErrorMsg('');
  };

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <section
      id="dictionary"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            類似形状文字（Leet / ASCII）変換ルール辞書
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            「似ている形の文字に変換」で適用される半角アスキー文字の置換テーブルです。チェックを外すと特定の文字変換を除外できます。
            <span className="ml-2 font-mono text-xs text-slate-500">
              有効: {activeCount} / {rules.length} 件
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEnableAll(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            すべて有効化
          </button>
          <button
            type="button"
            onClick={() => onEnableAll(false)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            すべて無効化
          </button>
          <button
            type="button"
            onClick={onResetRules}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            初期設定に戻す
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rules.map((rule) => {
          const isCustom = rule.id.startsWith('custom-');
          return (
            <div
              key={rule.id}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border transition-colors ${
                rule.enabled
                  ? 'bg-slate-50/70 border-slate-200 text-slate-900'
                  : 'bg-white border-slate-200/60 text-slate-400'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => onToggleRule(rule.id)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-mono text-sm font-semibold">
                    <span className="text-slate-900">{rule.source}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-amber-700 truncate">
                      {rule.targets.join(', ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {rule.description}
                  </div>
                </div>
              </label>

              {isCustom && (
                <button
                  type="button"
                  onClick={() => onDeleteRule(rule.id)}
                  aria-label={`カスタムルール ${rule.source} を削除`}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Rule Form */}
      <form
        onSubmit={handleAddSubmit}
        className="pt-4 border-t border-slate-200 space-y-3"
      >
        <div className="text-xs font-semibold text-slate-700">
          カスタム類似文字ルールを追加（半角ASCII文字のみ）
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <div className="sm:col-span-2">
            <label
              htmlFor="custom-source-input"
              className="block text-xs text-slate-600 mb-1"
            >
              元の文字 (1文字)
            </label>
            <input
              id="custom-source-input"
              type="text"
              maxLength={1}
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="例: C"
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="sm:col-span-4">
            <label
              htmlFor="custom-targets-input"
              className="block text-xs text-slate-600 mb-1"
            >
              変換先ASCII文字 (カンマ区切り)
            </label>
            <input
              id="custom-targets-input"
              type="text"
              value={newTargets}
              onChange={(e) => setNewTargets(e.target.value)}
              placeholder="例: (, <, {"
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="sm:col-span-4">
            <label
              htmlFor="custom-desc-input"
              className="block text-xs text-slate-600 mb-1"
            >
              メモ (任意)
            </label>
            <input
              id="custom-desc-input"
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="例: Cを括弧や山括弧に変換"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="sm:col-span-2 sm:pt-5">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              ルール追加
            </button>
          </div>
        </div>
        {errorMsg && (
          <p className="text-xs text-red-600 font-medium" role="alert">
            {errorMsg}
          </p>
        )}
      </form>
    </section>
  );
};
