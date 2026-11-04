import React from 'react';
import { CharacterStep, TransformAction } from '../utils/transformer';
import { RefreshCw } from 'lucide-react';

interface CharacterBreakdownProps {
  steps: CharacterStep[];
  onCycleChar: (index: number) => void;
}

const ACTION_LABELS: Record<TransformAction, string> = {
  none: 'そのまま',
  case: '大小変換',
  similar: '類似文字',
};

export const CharacterBreakdown: React.FC<CharacterBreakdownProps> = ({
  steps,
  onCycleChar,
}) => {
  if (steps.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        文字を入力すると、1文字ごとの変換内訳がここに表示されます。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">
          1文字ごとの変換セル（クリックで切り替え）
        </span>
        <div className="flex items-center gap-4 font-medium">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 border border-slate-300" />
            そのまま維持
          </span>
          <span className="inline-flex items-center gap-1.5 text-sky-700">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-100 border border-sky-300" />
            大小文字変換
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-800">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-100 border border-amber-300" />
            類似文字変換
          </span>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 pt-1"
        role="list"
        aria-label="文字ごとの変換内訳"
      >
        {steps.map((step) => {
          const isSpace = step.original === ' ';
          let cardStyle =
            'bg-white border-slate-200 text-slate-800 hover:border-slate-400';
          let subTextStyle = 'text-slate-400';

          if (step.action === 'case') {
            cardStyle =
              'bg-sky-50/70 border-sky-200 text-sky-950 hover:border-sky-400';
            subTextStyle = 'text-sky-700';
          } else if (step.action === 'similar') {
            cardStyle =
              'bg-amber-50/80 border-amber-300 text-amber-950 hover:border-amber-500';
            subTextStyle = 'text-amber-800';
          }

          return (
            <button
              key={step.index}
              type="button"
              onClick={() => onCycleChar(step.index)}
              title={`${step.index + 1}文字目: "${step.original}" → "${step.transformed}" (${ACTION_LABELS[step.action]}) — クリックして個別切替`}
              aria-label={`${step.index + 1}文字目 元の文字 ${isSpace ? '空白' : step.original} 変換後 ${isSpace ? '空白' : step.transformed} ${ACTION_LABELS[step.action]}`}
              className={`group relative flex flex-col items-center justify-between min-w-[54px] px-2.5 py-2 rounded-lg border transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${cardStyle}`}
            >
              <div className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400">
                <span>{isSpace ? '␣' : step.original}</span>
                <RefreshCw className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />
              </div>

              <div className="my-1 text-xl font-mono font-bold tracking-tight">
                {isSpace ? '␣' : step.transformed}
              </div>

              <div className={`text-[10px] font-medium whitespace-nowrap ${subTextStyle}`}>
                {ACTION_LABELS[step.action]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
