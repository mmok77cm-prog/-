import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { SurveyingTransaction, SurveyStepKey, SURVEY_STEPS_CONFIG } from '../types';

export const SURVEY_STEPS_KEYS: SurveyStepKey[] = [
  'step1_site_survey',
  'step2_krooki',
  'step3_geo_explorer',
  'step4_balady',
  'step5_re_exchange',
];

export interface TransactionProgressInfo {
  completedCount: number;
  totalSteps: number;
  percentage: number;
  isFullyCompleted: boolean;
  hasReturnedStep: boolean;
  currentStepKey: SurveyStepKey;
  currentStepTitle: string;
}

export function getTransactionProgress(tx: SurveyingTransaction): TransactionProgressInfo {
  let completedCount = 0;
  let hasReturned = false;

  SURVEY_STEPS_KEYS.forEach((key) => {
    const status = tx.steps[key]?.status;
    if (status === 'completed') {
      completedCount++;
    }
    if (status === 'returned') {
      hasReturned = true;
    }
  });

  const isFullyCompleted = tx.steps.step5_re_exchange?.status === 'completed';

  let percentage = completedCount * 20;
  if (!isFullyCompleted) {
    const curStatus = tx.steps[tx.currentStepKey]?.status;
    if (curStatus === 'in_progress') {
      percentage = Math.min(95, percentage + 10);
    }
  } else {
    percentage = 100;
  }

  const currentStepTitle = isFullyCompleted
    ? 'مكتملة بالبورصة العقارية'
    : SURVEY_STEPS_CONFIG[tx.currentStepKey]?.shortName || 'قيد الإجراء';

  return {
    completedCount,
    totalSteps: 5,
    percentage,
    isFullyCompleted,
    hasReturnedStep: hasReturned || tx.health === 'overdue',
    currentStepKey: tx.currentStepKey,
    currentStepTitle,
  };
}

interface TransactionProgressBarProps {
  transaction: SurveyingTransaction;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  interactive?: boolean;
}

export const TransactionProgressBar: React.FC<TransactionProgressBarProps> = ({
  transaction,
  size = 'md',
  showLabels = true,
}) => {
  const progress = getTransactionProgress(transaction);

  if (size === 'sm') {
    // Compact version for Table Rows and Kanban Cards
    return (
      <div className="w-full space-y-1.5" dir="rtl">
        <div className="flex items-center justify-between text-[11px] gap-2">
          <span className="font-semibold text-slate-800 truncate flex items-center gap-1">
            {progress.isFullyCompleted ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>مكتملة (5 من 5)</span>
              </span>
            ) : progress.hasReturnedStep ? (
              <span className="text-red-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span>{progress.currentStepTitle} (ملاحظة)</span>
              </span>
            ) : (
              <span className="text-slate-700">
                {progress.currentStepTitle} ({progress.completedCount}/5)
              </span>
            )}
          </span>

          <span
            className={`font-mono-num font-bold text-[10px] px-1.5 py-0.5 rounded ${
              progress.isFullyCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : progress.hasReturnedStep
                ? 'bg-red-50 text-red-700 border border-red-200'
                : progress.percentage >= 60
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {progress.percentage}%
          </span>
        </div>

        {/* 5-Segment Progress Bar */}
        <div className="grid grid-cols-5 gap-1 w-full h-1.5 bg-slate-100 p-0.5 rounded-full border border-slate-200/80">
          {SURVEY_STEPS_KEYS.map((key, idx) => {
            const step = transaction.steps[key];
            const isCompleted = step?.status === 'completed';
            const isCurrent = transaction.currentStepKey === key && !isCompleted;
            const isReturned = step?.status === 'returned';

            let segColor = 'bg-slate-200';
            if (isCompleted) {
              segColor = 'bg-emerald-500';
            } else if (isReturned) {
              segColor = 'bg-red-500 animate-pulse';
            } else if (isCurrent) {
              segColor = 'bg-blue-500 animate-pulse';
            }

            return (
              <div
                key={key}
                title={`مرحلة ${idx + 1}: ${SURVEY_STEPS_CONFIG[key].shortName} (${
                  isCompleted ? 'مكتملة' : isReturned ? 'معادة بملاحظة' : isCurrent ? 'قيد العمل' : 'معلقة'
                })`}
                className={`h-full rounded-full transition-all duration-300 ${segColor}`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Medium and Large versions for Drawer, Header, and Lookup Modal
  return (
    <div className="w-full bg-slate-50 border border-slate-200/90 rounded-lg p-3 space-y-2.5" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">
            شريط تقدم المعاملة:
          </span>
          <span className="text-xs text-slate-600">
            {progress.isFullyCompleted
              ? 'أُنجزت كافة المراحل المساحية الـ 5 وصدر الصك الإلكتروني'
              : `تم إنجاز ${progress.completedCount} من أصل 5 مراحل مساحية`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`font-mono-num font-bold text-xs px-2.5 py-0.5 rounded-full ${
              progress.isFullyCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : progress.hasReturnedStep
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            نسبة الإنجاز: {progress.percentage}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            progress.isFullyCompleted
              ? 'bg-gradient-to-l from-emerald-600 to-teal-500'
              : progress.hasReturnedStep
              ? 'bg-gradient-to-l from-red-600 to-amber-500'
              : 'bg-gradient-to-l from-blue-600 to-indigo-500'
          }`}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Step Indicators */}
      {showLabels && (
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {SURVEY_STEPS_KEYS.map((key, idx) => {
            const step = transaction.steps[key];
            const cfg = SURVEY_STEPS_CONFIG[key];
            const isCompleted = step?.status === 'completed';
            const isCurrent = transaction.currentStepKey === key && !isCompleted;
            const isReturned = step?.status === 'returned';

            return (
              <div
                key={key}
                className={`text-center p-1.5 rounded border text-[11px] transition-colors ${
                  isCompleted
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                    : isReturned
                    ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                    : isCurrent
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="font-mono-num text-[10px]">0{idx + 1}</span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                  {isCurrent && <Clock className="w-3 h-3 text-blue-600 shrink-0 animate-spin" />}
                  {isReturned && <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />}
                </div>
                <div className="truncate text-[10px] leading-tight" title={cfg.name}>
                  {cfg.shortName}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
