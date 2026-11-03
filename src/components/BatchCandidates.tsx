import React from 'react';
import { TransformResult } from '../utils/transformer';
import { Check, Copy, RefreshCw, ArrowUpRight } from 'lucide-react';

interface BatchCandidatesProps {
  candidates: TransformResult[];
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onSelectCandidate: (candidate: TransformResult) => void;
  onRegenerateBatch: () => void;
}

export const BatchCandidates: React.FC<BatchCandidatesProps> = ({
  candidates,
  copiedId,
  onCopy,
  onSelectCandidate,
  onRegenerateBatch,
}) => {
  return (
    <section
      id="candidates"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">
            一括ランダム候補比較 (6パターン同時生成)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            同じ変換設定から複数のランダム候補を同時生成します。気に入った候補を直接コピーするか、メイン画面に読み込んで1文字ずつ微調整できます。
          </p>
        </div>

        <button
          type="button"
          onClick={onRegenerateBatch}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          6候補を再抽選
        </button>
      </div>

      {candidates.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          変換元の文字列を入力すると、複数候補が一覧表示されます。
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
          {candidates.map((item, idx) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-mono text-slate-400 w-6 shrink-0">
                    0{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-base font-semibold text-slate-900 break-all">
                      {item.output}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono">
                      <span>維持 {item.stats.noneCount}</span>
                      <span aria-hidden="true">·</span>
                      <span>大小 {item.stats.caseCount}</span>
                      <span aria-hidden="true">·</span>
                      <span>類似 {item.stats.similarCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectCandidate(item)}
                    aria-label={`候補 ${idx + 1} (${item.output}) をメイン画面で編集`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    詳細・微調整
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopy(item.output, item.id)}
                    aria-label={`候補 ${idx + 1} (${item.output}) をコピー`}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
