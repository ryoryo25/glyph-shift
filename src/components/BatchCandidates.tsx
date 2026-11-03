import React from 'react';
import { TransformResult } from '../utils/transformer';
import { Check, Copy, RefreshCw, SlidersHorizontal } from 'lucide-react';

interface BatchCandidatesProps {
  candidates: TransformResult[];
  selectedIndex: number;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onInspectCandidate: (index: number) => void;
  onRegenerateBatch: () => void;
}

export const BatchCandidates: React.FC<BatchCandidatesProps> = ({
  candidates,
  selectedIndex,
  copiedId,
  onCopy,
  onInspectCandidate,
  onRegenerateBatch,
}) => {
  return (
    <section
      id="results"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900">
              3. 変換結果リスト
            </h2>
            <span className="text-xs font-mono text-slate-500">
              {candidates.length} 件生成
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            生成された文字列をワンクリックでコピーできます。「微調整」を押すと下のインスペクタで1文字ずつ変換を切り替えられます。
          </p>
        </div>

        <button
          type="button"
          disabled={candidates.length === 0}
          onClick={onRegenerateBatch}
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          リストを再生成
        </button>
      </div>

      {candidates.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          上の入力欄に英数字を入力すると、変換結果リストがここに表示されます。
        </div>
      ) : (
        <div
          className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden"
          role="list"
          aria-label="変換結果リスト"
        >
          {candidates.map((item, idx) => {
            const isCopied = copiedId === item.id;
            const isSelected = selectedIndex === idx;
            const numLabel = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={item.id}
                role="listitem"
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 transition-colors ${
                  isSelected
                    ? 'bg-slate-50'
                    : 'bg-white hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="text-xs font-mono font-semibold text-slate-400 w-6 shrink-0">
                    {numLabel}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      data-testid={`result-item-${idx}`}
                      className="font-mono text-lg sm:text-xl font-bold text-slate-900 break-all select-all"
                    >
                      {item.output}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono">
                      <span>そのまま {item.stats.noneCount}</span>
                      <span aria-hidden="true">·</span>
                      <span>大小 {item.stats.caseCount}</span>
                      <span aria-hidden="true">·</span>
                      <span>Leet {item.stats.similarCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onInspectCandidate(idx)}
                    aria-label={`結果 ${idx + 1} (${item.output}) をインスペクタで微調整`}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-200/80 text-slate-900 border-slate-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    微調整
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopy(item.output, item.id)}
                    aria-label={`結果 ${idx + 1} (${item.output}) をコピー`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
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
                        コピー
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
