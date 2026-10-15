import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Printer,
  FileText,
  User,
  MapPin,
  Layers,
  Building,
  Landmark,
  Plus,
  Send,
  Upload,
  Trash2,
  Banknote,
  Check,
  Edit3,
  Calendar,
  History,
  Radio,
} from 'lucide-react';
import {
  SurveyingTransaction,
  SurveyStepKey,
  SURVEY_STEPS_CONFIG,
} from '../types';
import { SURVEY_ENGINEERS } from '../data/mockTransactions';
import { TransactionProgressBar } from './TransactionProgressBar';
import { getLiveTimestamp, getLiveTimeString } from '../utils/dateUtils';

interface SurveyDetailDrawerProps {
  transaction: SurveyingTransaction | null;
  onClose: () => void;
  onAdvanceStep: (
    transactionId: string,
    stepKey: SurveyStepKey,
    referenceNumber?: string,
    notes?: string
  ) => void;
  onReturnStep: (
    transactionId: string,
    stepKey: SurveyStepKey,
    source: 'المستكشف الجغرافي' | 'منصة بلدي' | 'البورصة العقارية' | 'الفاحص المساحي الميداني',
    comment: string
  ) => void;
  onResolveFeedback: (
    transactionId: string,
    feedbackId: string,
    response: string
  ) => void;
  onReassignEngineer: (transactionId: string, engineerId: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  onUpdatePayment?: (
    transactionId: string,
    newContractValue: number,
    newCollectedAmount: number
  ) => void;
  onAddActivityLog?: (
    transactionId: string,
    action: string,
    category?: string,
    customTimestamp?: string
  ) => void;
  onEditActivityLog?: (
    transactionId: string,
    logId: string,
    newAction: string,
    newTimestamp: string
  ) => void;
  onDeleteActivityLog?: (
    transactionId: string,
    logId: string
  ) => void;
}

const STEP_KEYS: SurveyStepKey[] = [
  'step1_site_survey',
  'step2_krooki',
  'step3_geo_explorer',
  'step4_balady',
  'step5_re_exchange',
];

export const SurveyDetailDrawer: React.FC<SurveyDetailDrawerProps> = ({
  transaction,
  onClose,
  onAdvanceStep,
  onReturnStep,
  onResolveFeedback,
  onReassignEngineer,
  onDeleteTransaction,
  onUpdatePayment,
  onAddActivityLog,
  onEditActivityLog,
  onDeleteActivityLog,
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'feedback' | 'files' | 'history' | 'finance'>('steps');
  
  // Step advance inputs
  const [refInput, setRefInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  // Return feedback inputs
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnSource, setReturnSource] = useState<'المستكشف الجغرافي' | 'منصة بلدي' | 'البورصة العقارية' | 'الفاحص المساحي الميداني'>('المستكشف الجغرافي');
  const [returnComment, setReturnComment] = useState('');

  // Resolve comment input
  const [responseInputs, setResponseInputs] = useState<Record<string, string>>({});

  // Financial inputs
  const [contractInput, setContractInput] = useState('');
  const [collectedInput, setCollectedInput] = useState('');
  const [paymentSavedMsg, setPaymentSavedMsg] = useState(false);

  // Live ticking clock for actual real-time logging
  const [liveClock, setLiveClock] = useState(() => getLiveTimeString());
  React.useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(getLiveTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // New real-time action log form state
  const [newLogAction, setNewLogAction] = useState('');
  const [newLogCategory, setNewLogCategory] = useState('ميداني');
  const [isCustomTimestamp, setIsCustomTimestamp] = useState(false);
  const [customTimestampInput, setCustomTimestampInput] = useState('');
  const [logSuccessMsg, setLogSuccessMsg] = useState(false);

  // Editing existing log state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editActionInput, setEditActionInput] = useState('');
  const [editTimestampInput, setEditTimestampInput] = useState('');

  // Sync financial state when transaction opens/changes
  React.useEffect(() => {
    if (transaction) {
      setContractInput(transaction.contractValueSAR.toString());
      setCollectedInput(transaction.collectedAmountSAR.toString());
      setPaymentSavedMsg(false);
      setEditingLogId(null);
    }
  }, [transaction]);

  if (!transaction) return null;

  const currentStep = transaction.steps[transaction.currentStepKey];
  const isFinalStepCompleted = transaction.steps.step5_re_exchange.status === 'completed';

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdvanceStep(
      transaction.id,
      transaction.currentStepKey,
      refInput.trim() || undefined,
      noteInput.trim() || undefined
    );
    setRefInput('');
    setNoteInput('');
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnComment.trim()) return;
    onReturnStep(
      transaction.id,
      transaction.currentStepKey,
      returnSource,
      returnComment.trim()
    );
    setReturnComment('');
    setShowReturnForm(false);
  };

  const openFeedbackCount = transaction.inspectorFeedbacks.filter((f) => !f.resolved).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px] transition-opacity drawer-overlay">
      <div
        className="relative w-full max-w-4xl bg-white h-full overflow-y-auto border-r border-slate-200 flex flex-col justify-between drawer-content"
        dir="rtl"
      >
        {/* Sticky Header (Screen Only) */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 no-print">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-mono-num font-bold text-slate-900">{transaction.referenceCode}</span>
                <span>·</span>
                <span className="font-bold text-slate-900">{transaction.type}</span>
                <span>·</span>
                <span>رقم الصك: <strong className="font-mono-num text-slate-900">{transaction.deedNumber}</strong></span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{transaction.title}</h2>
            </div>

            <div className="flex items-center gap-2 shrink-0 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة ملف المعاملة</span>
              </button>
              {onDeleteTransaction && (
                <button
                  type="button"
                  onClick={() => onDeleteTransaction(transaction.id)}
                  title="حذف هذه المعاملة"
                  className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف المعاملة</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Survey Metadata Strip */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">المالك / المستفيد</span>
              <span className="font-semibold text-slate-900 block truncate">{transaction.clientName}</span>
              <span className="font-mono-num text-slate-500">{transaction.clientPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">بيانات الموقع والمخطط</span>
              <span className="font-mono-num font-semibold text-slate-900 block">
                ق {transaction.plotNumber} {transaction.blockNumber ? `· بلك ${transaction.blockNumber}` : ''} / م {transaction.planNumber}
              </span>
              <span className="text-slate-600 truncate block">
                {transaction.municipality} · {transaction.district}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">المساحة ومواصفات الفرز</span>
              <span className="font-mono-num font-semibold text-slate-900 block">
                مساحة الصك: {transaction.landAreaSqm} م²
              </span>
              <span className="text-slate-600 block">
                {transaction.surveyAreaSqm && (
                  <>الرفع الميداني: <strong className="font-mono-num text-emerald-800">{transaction.surveyAreaSqm} م²</strong></>
                )}
                {transaction.unitsCount && (
                  <> · عدد الوحدات: <strong className="font-mono-num text-slate-900">{transaction.unitsCount}</strong></>
                )}
                {transaction.subdividedPlotsCount && (
                  <> · القطع الناتجة: <strong className="font-mono-num text-slate-900">{transaction.subdividedPlotsCount}</strong></>
                )}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-semibold mb-0.5">
                المهندس المسؤول عن كامل المسار
              </span>
              <select
                value={transaction.assignedEngineer.id}
                onChange={(e) => onReassignEngineer(transaction.id, e.target.value)}
                className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-1 focus:outline-none"
              >
                {SURVEY_ENGINEERS.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name} ({eng.sceNo})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                {transaction.assignedEngineer.title}
              </span>
            </div>
          </div>

          {/* Visual Transaction Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 no-print">
            <TransactionProgressBar transaction={transaction} size="md" showLabels={true} />
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mt-4 pt-2 border-t border-slate-100 overflow-x-auto no-print">
            <button
              type="button"
              onClick={() => setActiveTab('steps')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'steps' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              مسار قسم المساحة (الخطوات الـ 5)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'feedback' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ملاحظات الفاحص والجهات ({openFeedbackCount} مفتوحة)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'files' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ملفات الرفع والكروكي والـ GIS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              سجل إجراءات مهندس المعاملة ({transaction.activityLog.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'finance' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              الأتعاب والتحصيل المالي ({transaction.contractValueSAR.toLocaleString('en-US')} ر.س)
            </button>
          </div>
        </div>

        {/* Tab Contents (Screen Only) */}
        <div className="p-6 space-y-6 flex-1 no-print">
          {activeTab === 'steps' && (
            <div className="space-y-6">
              {/* Step Advancement Control */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg no-print">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">المرحلة قيد الإجراء حالياً</span>
                    <span className="text-sm font-bold text-slate-900">
                      {SURVEY_STEPS_CONFIG[transaction.currentStepKey].name}
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      {SURVEY_STEPS_CONFIG[transaction.currentStepKey].desc}
                    </p>
                    <div className="text-xs text-slate-500 mt-1">
                      المهندس المسؤول المتابع: <strong className="text-slate-800">{transaction.assignedEngineer.name}</strong>
                    </div>
                  </div>

                  {!isFinalStepCompleted ? (
                    <div className="flex flex-col gap-2 shrink-0">
                      <form onSubmit={handleAdvanceSubmit} className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={refInput}
                          onChange={(e) => setRefInput(e.target.value)}
                          placeholder="رقم المرجع (رقم الكروكي/طلب GIS/بلدي/البورصة)..."
                          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg w-56 focus:outline-none focus:border-slate-900 font-mono-num"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                          <span>إتمام المرحلة والانتقال للخطوة التالية</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </form>
                      <button
                        type="button"
                        onClick={() => setShowReturnForm(!showReturnForm)}
                        className="px-3 py-1.5 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg self-end cursor-pointer"
                      >
                        تسجيل ملاحظة إرجاع من فاحص الجهة
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>اكتملت جميع المراحل وتم الإفراغ / التوثيق عبر البورصة العقارية</span>
                    </div>
                  )}
                </div>

                {/* Return Form */}
                {showReturnForm && (
                  <form
                    onSubmit={handleReturnSubmit}
                    className="mt-4 pt-4 border-t border-amber-200 bg-amber-50/60 p-3 rounded-lg space-y-3"
                  >
                    <div className="text-xs font-bold text-amber-900">
                      تسجيل ملاحظة إرجاع من الجهة المعنية (المستكشف الجغرافي / بلدي / البورصة العقارية)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={returnSource}
                        onChange={(e) =>
                          setReturnSource(
                            e.target.value as 'المستكشف الجغرافي' | 'منصة بلدي' | 'البورصة العقارية' | 'الفاحص المساحي الميداني'
                          )
                        }
                        className="px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none"
                      >
                        <option value="المستكشف الجغرافي">المستكشف الجغرافي</option>
                        <option value="منصة بلدي">منصة بلدي</option>
                        <option value="البورصة العقارية">البورصة العقارية</option>
                        <option value="الفاحص المساحي الميداني">الفاحص المساحي الميداني</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={returnComment}
                        onChange={(e) => setReturnComment(e.target.value)}
                        placeholder="نص ملاحظة الفاحص بالتفصيل..."
                        className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReturnForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-medium bg-amber-700 text-white rounded-md hover:bg-amber-800 cursor-pointer"
                      >
                        حفظ الملاحظة وإرجاع المرحلة
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* The 5 Steps Ordered Pipeline */}
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                {STEP_KEYS.map((stepKey, idx) => {
                  const step = transaction.steps[stepKey];
                  const cfg = SURVEY_STEPS_CONFIG[stepKey];
                  const isDone = step.status === 'completed';
                  const isCurrent = step.status === 'in_progress';
                  const isReturned = step.status === 'returned';

                  return (
                    <div
                      key={stepKey}
                      className={`p-5 flex items-start justify-between gap-4 ${
                        isCurrent
                          ? 'bg-slate-50/90'
                          : isReturned
                          ? 'bg-red-50/40'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : isReturned ? (
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                          ) : isCurrent ? (
                            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                          ) : (
                            <span className="w-5 h-5 inline-flex items-center justify-center text-xs font-mono-num text-slate-400">
                              0{idx + 1}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {cfg.name}
                            </span>
                            {step.referenceNumber && (
                              <span className="font-mono-num text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                مرجع: {step.referenceNumber}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {cfg.desc}
                          </p>

                          {step.notes && (
                            <p className="text-xs text-slate-800 bg-slate-100/80 p-2 rounded mt-1">
                              ملاحظات التنفيذ: {step.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                            {step.startedAt && <span>بدأت: <strong className="font-mono-num">{step.startedAt}</strong></span>}
                            {step.completedAt && (
                              <span>اكتملت: <strong className="font-mono-num text-emerald-700">{step.completedAt}</strong></span>
                            )}
                            {step.files && step.files.length > 0 && (
                              <span>المرفقات: <strong className="font-mono-num">{step.files.length}</strong> ملفات</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-semibold shrink-0">
                        {isDone && <span className="text-emerald-700">مكتملة</span>}
                        {isCurrent && <span className="text-amber-700">قيد الإجراء</span>}
                        {isReturned && <span className="text-red-700">معادة بملاحظات</span>}
                        {step.status === 'pending' && <span className="text-slate-400">بانتظار المرحلة السابقة</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-700">
                ملاحظات الفاحص والجهات الخارجية (المستكشف الجغرافي · منصة بلدي · البورصة العقارية)
              </div>

              {transaction.inspectorFeedbacks.length === 0 ? (
                <div className="p-8 text-center border border-slate-200 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-900">لا توجد ملاحظات أو إرجاعات مسجلة</p>
                  <p className="text-xs text-slate-500 mt-1">المعاملة مطابقة لكافة الاشتراطات المساحية والتنظيمية.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                  {transaction.inspectorFeedbacks.map((f) => (
                    <div key={f.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-bold text-slate-900">{f.source}</span>
                          <span>·</span>
                          <span>مرحلة: {f.stepName}</span>
                          <span>·</span>
                          <span className="font-mono-num">{f.date}</span>
                        </div>
                        <div>
                          {f.resolved ? (
                            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              تمت معالجة الملاحظة
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              تتطلب تعديل من مهندس المساحة
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-slate-900 leading-relaxed font-medium">{f.comment}</p>

                      {f.engineerResponse && (
                        <div className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-0.5">
                            رد المهندس ({transaction.assignedEngineer.name}):
                          </span>
                          {f.engineerResponse}
                        </div>
                      )}

                      {!f.resolved && (
                        <div className="flex items-center gap-2 pt-1 no-print">
                          <input
                            type="text"
                            value={responseInputs[f.id] || ''}
                            onChange={(e) =>
                              setResponseInputs({ ...responseInputs, [f.id]: e.target.value })
                            }
                            placeholder="اكتب رد المهندس وإجراء التصحيح..."
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onResolveFeedback(
                                transaction.id,
                                f.id,
                                responseInputs[f.id] || 'تم تصحيح الملاحظة وإعادة رفع الملفات المعتمدة'
                              )
                            }
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white rounded-md hover:bg-emerald-800 cursor-pointer whitespace-nowrap"
                          >
                            اعتماد التصحيح وإغلاق الملاحظة
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-700">
                الملفات والوثائق الفنية المرتبطة بمراحل قسم المساحة الـ 5
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-3 px-4 font-medium">المرحلة</th>
                      <th className="py-3 px-4 font-medium">اسم الملف الفني</th>
                      <th className="py-3 px-4 font-medium">الحجم</th>
                      <th className="py-3 px-4 font-medium">تاريخ الرفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {STEP_KEYS.flatMap((key) =>
                      transaction.steps[key].files.map((file) => ({
                        stepName: SURVEY_STEPS_CONFIG[key].shortName,
                        file,
                      }))
                    ).map(({ stepName, file }) => (
                      <tr key={file.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{stepName}</td>
                        <td className="py-3 px-4 text-slate-800 font-mono-num">{file.name}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono-num">{file.size || '—'}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono-num">{file.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-5">
              {/* Live Real-Time Banner */}
              <div className="p-3.5 bg-slate-900 text-white rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <div>
                    <span className="text-xs font-bold block">
                      التدوين بالوقت الفعلي المعتمد
                    </span>
                    <span className="text-[11px] text-slate-300">
                      مهندس المساحة المسؤول: <strong className="text-white">{transaction.assignedEngineer.name}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-mono-num font-bold text-emerald-400">
                    الوقت الفعلي المباشر: {liveClock}
                  </span>
                </div>
              </div>

              {/* Form to log new progress in real-time */}
              {onAddActivityLog && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-slate-700" />
                      <span>تدوين تقدم / إجراء جديد للمهندس</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono-num">
                      يتم التوثيق بتوقيت اللحظة تلقائياً
                    </span>
                  </div>

                  {logSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تم توثيق الإجراء المساحي بنجاح بالسجل وحفظه محلياً!</span>
                    </div>
                  )}

                  {/* Category Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-semibold">التصنيف:</span>
                    {[
                      { key: 'ميداني', label: '📍 رفع ميداني' },
                      { key: 'كروكي', label: '📐 كروكي' },
                      { key: 'جغرافي', label: '🌐 مستكشف جغرافي' },
                      { key: 'بلدي', label: '🏛️ منصة بلدي' },
                      { key: 'توثيق', label: '📜 بورصة عقارية' },
                      { key: 'تواصل', label: '📞 تواصل مع المالك' },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setNewLogCategory(c.key)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                          newLogCategory === c.key
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Action text input */}
                  <div>
                    <textarea
                      rows={2}
                      value={newLogAction}
                      onChange={(e) => {
                        setNewLogAction(e.target.value);
                        setLogSuccessMsg(false);
                      }}
                      placeholder="اكتب تفاصيل الإجراء المنفذ (مثال: تم إتمام رصد الحدود بجهاز GPS ومطابقة الأضلاع، أو تم إرفاق رد الفاحص)..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Quick Action Template Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">قوالب سريعة:</span>
                    {[
                      'معاينة الموقع ورصد النقاط المساحية بأجهزة GPS RTK',
                      'إعداد وتدقيق الكروكي المساحي ومطابقة الارتدادات والشوارع',
                      'إسقاط طبقة Shapefile على المستكشف الجغرافي لأمانة الأحساء',
                      'مراجعة وتحديث متطلبات فاحص منصة بلدي',
                      'التنسيق مع المالك لاستلام المتطلبات والوثائق المتبقية',
                      'إحالة المعاملة المعتمدة إلى منصة البورصة العقارية للتوثيق',
                    ].map((tpl) => (
                      <button
                        key={tpl}
                        type="button"
                        onClick={() => {
                          setNewLogAction(tpl);
                          setLogSuccessMsg(false);
                        }}
                        className="text-[10px] bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded cursor-pointer transition-colors truncate max-w-[280px]"
                        title={tpl}
                      >
                        + {tpl}
                      </button>
                    ))}
                  </div>

                  {/* Time Option Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-3 text-xs">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={isCustomTimestamp}
                          onChange={(e) => {
                            setIsCustomTimestamp(e.target.checked);
                            if (e.target.checked && !customTimestampInput) {
                              setCustomTimestampInput(getLiveTimestamp());
                            }
                          }}
                          className="rounded text-slate-900 focus:ring-0"
                        />
                        <span>تعديل التوقيت يدوياً (تاريخ ووقت مخصص)</span>
                      </label>

                      {isCustomTimestamp && (
                        <input
                          type="text"
                          value={customTimestampInput}
                          onChange={(e) => setCustomTimestampInput(e.target.value)}
                          placeholder="مثال: 2026-10-15 · 02:30 م"
                          className="px-2.5 py-1 text-xs font-mono-num border border-slate-300 rounded bg-white w-48 focus:outline-none focus:border-slate-900"
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!newLogAction.trim()}
                      onClick={() => {
                        if (!newLogAction.trim()) return;
                        const time = isCustomTimestamp ? customTimestampInput : undefined;
                        onAddActivityLog(transaction.id, newLogAction, newLogCategory, time);
                        setNewLogAction('');
                        setIsCustomTimestamp(false);
                        setCustomTimestampInput('');
                        setLogSuccessMsg(true);
                      }}
                      className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-end"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>توثيق الإجراء بالسجل بالوقت الفعلي</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Logs Timeline List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <span className="font-bold">
                    سجل كافة الإجراءات والتدوينات الزمنية ({transaction.activityLog.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    مرتبة من الأحدث إلى الأقدم حسب الوقت الفعلي
                  </span>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                  {transaction.activityLog.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      لا توجد إجراءات مدونة حتى الآن
                    </div>
                  ) : (
                    transaction.activityLog.map((log) => {
                      const isEditing = editingLogId === log.id;

                      if (isEditing) {
                        return (
                          <div key={log.id} className="p-4 bg-amber-50/70 space-y-3">
                            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل الإجراء والوقت الفعلي للتدوين</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  نص الإجراء المنفذ
                                </label>
                                <input
                                  type="text"
                                  value={editActionInput}
                                  onChange={(e) => setEditActionInput(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded focus:outline-none focus:border-amber-700"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  الوقت الفعلي (التاريخ والوقت)
                                </label>
                                <input
                                  type="text"
                                  value={editTimestampInput}
                                  onChange={(e) => setEditTimestampInput(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs font-mono-num bg-white border border-amber-300 rounded focus:outline-none focus:border-amber-700"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingLogId(null)}
                                className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900"
                              >
                                إلغاء
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onEditActivityLog && editActionInput.trim()) {
                                    onEditActivityLog(
                                      transaction.id,
                                      log.id,
                                      editActionInput.trim(),
                                      editTimestampInput.trim() || getLiveTimestamp()
                                    );
                                    setEditingLogId(null);
                                  }
                                }}
                                className="px-3.5 py-1 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white rounded cursor-pointer"
                              >
                                حفظ التعديل
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {log.category && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                                  {log.category}
                                </span>
                              )}
                              <p className="text-xs font-semibold text-slate-900 leading-snug">
                                {log.action}
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              بواسطة: <strong className="text-slate-700">{log.engineerName}</strong>
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs font-mono-num text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded font-medium">
                              {log.timestamp}
                            </span>
                            <div className="flex items-center gap-1.5 pt-1">
                              {onEditActivityLog && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLogId(log.id);
                                    setEditActionInput(log.action);
                                    setEditTimestampInput(log.timestamp);
                                  }}
                                  className="text-[11px] text-slate-500 hover:text-slate-900 hover:underline flex items-center gap-0.5 cursor-pointer"
                                  title="تعديل الإجراء أو الوقت"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>تعديل</span>
                                </button>
                              )}
                              {onDeleteActivityLog && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteActivityLog(transaction.id, log.id)}
                                  className="text-[11px] text-red-500 hover:text-red-700 hover:underline flex items-center gap-0.5 cursor-pointer mr-1"
                                  title="حذف هذا التدوين"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>حذف</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-500 block mb-1">إجمالي أتعاب المعاملة</span>
                  <span className="text-lg font-bold font-mono-num text-slate-900 block">
                    {transaction.contractValueSAR.toLocaleString('en-US')} ر.س
                  </span>
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                  <span className="text-xs text-emerald-800 block mb-1">المبلغ المحصل</span>
                  <span className="text-lg font-bold font-mono-num text-emerald-700 block">
                    {transaction.collectedAmountSAR.toLocaleString('en-US')} ر.س
                  </span>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg">
                  <span className="text-xs text-amber-800 block mb-1">المبلغ المتبقي</span>
                  <span className="text-lg font-bold font-mono-num text-amber-700 block">
                    {Math.max(0, transaction.contractValueSAR - transaction.collectedAmountSAR).toLocaleString('en-US')} ر.س
                  </span>
                </div>
              </div>

              {/* Edit Payment Form */}
              <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      تسجيل دفعة نقدية / تعديل الأتعاب المالية
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      يتم حفظ أي تعديل تلقائياً في المتصفح ويبقى ثابتاً حتى بعد عمل تحديث للصفحة (Refresh)
                    </p>
                  </div>
                  <Banknote className="w-4 h-4 text-slate-500" />
                </div>

                {paymentSavedMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>تم حفظ التعديل المالي بنجاح في قاعدة البيانات المحلية!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      إجمالي الأتعاب التعاقدية (ر.س)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={contractInput}
                      onChange={(e) => {
                        setContractInput(e.target.value);
                        setPaymentSavedMsg(false);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-mono-num"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      المبلغ المحصل فعلياً حتى الآن (ر.س)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={collectedInput}
                      onChange={(e) => {
                        setCollectedInput(e.target.value);
                        setPaymentSavedMsg(false);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-mono-num"
                    />
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[11px] text-slate-500 font-medium">إضافة دفعة سريعة:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(collectedInput) || 0;
                      setCollectedInput(String(cur + 500));
                      setPaymentSavedMsg(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                  >
                    +500 ر.س
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(collectedInput) || 0;
                      setCollectedInput(String(cur + 1000));
                      setPaymentSavedMsg(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                  >
                    +1,000 ر.س
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCollectedInput(contractInput);
                      setPaymentSavedMsg(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded cursor-pointer"
                  >
                    سداد كامل المبلغ
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdatePayment) {
                        const cVal = Math.max(0, Number(contractInput) || 0);
                        const colVal = Math.max(0, Number(collectedInput) || 0);
                        onUpdatePayment(transaction.id, cVal, colVal);
                        setPaymentSavedMsg(true);
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ وتحديث السجل المالي</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
