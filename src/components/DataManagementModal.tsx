import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { SurveyingTransaction } from '../types';
import {
  exportTransactionsAsJson,
  parseTransactionsBackup,
  resetTransactionsToDefault,
  saveTransactions,
  getStorageDiagnostics,
} from '../utils/storage';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: SurveyingTransaction[];
  onTransactionsUpdate: (newTransactions: SurveyingTransaction[]) => void;
  lastSavedTime: Date | null;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onTransactionsUpdate,
  lastSavedTime,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const diagnostics = getStorageDiagnostics();

  const handleExport = () => {
    try {
      exportTransactionsAsJson(transactions);
      setNotification({
        type: 'success',
        message: 'تم تصدير ملف النسخة الاحتياطية بنجاح إلى جهازك.',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'حدث خطأ أثناء تصدير النسخة الاحتياطية.',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = parseTransactionsBackup(content);
        saveTransactions(imported);
        onTransactionsUpdate(imported);
        setNotification({
          type: 'success',
          message: `تم استيراد ${imported.length} معاملة بنجاح وتحديث قاعدة البيانات المحلية!`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'فشل في قراءة ملف النسخة الاحتياطية.';
        setNotification({
          type: 'error',
          message: msg,
        });
      }
    };
    reader.readAsText(file);
    // Reset file input so user can re-import same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefault = () => {
    const defaults = resetTransactionsToDefault();
    onTransactionsUpdate(defaults);
    setShowResetConfirm(false);
    setNotification({
      type: 'success',
      message: 'تم استعادة البيانات الافتراضية بنجاح وحفظها محلياً.',
    });
  };

  const handleManualSave = () => {
    const success = saveTransactions(transactions);
    if (success) {
      setNotification({
        type: 'success',
        message: 'تم حفظ كافة المعاملات والتقدم الحالي في الذاكرة المحلية بنجاح.',
      });
    } else {
      setNotification({
        type: 'error',
        message: 'تعذر الحفظ في الذاكرة المحلية.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div
        className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                إدارة التخزين والحفظ التلقائي للبيانات
              </h2>
              <p className="text-[11px] text-slate-500">
                يتم حفظ جميع التعديلات والمراحل تلقائياً في المتصفح لضمان عدم فقدان التقدم عند تحديث الصفحة (Refresh)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Notification banner */}
          {notification && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center justify-between gap-3 ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-xs opacity-70 hover:opacity-100 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Storage Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>حالة الحفظ</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 block">
                مفعّل تلقائياً
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                تزامن فوري عند كل تعديل
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>المعاملات المحفوظة</span>
              </div>
              <span className="text-sm font-bold font-mono-num text-slate-900 block">
                {transactions.length} معاملة
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                مخزنة في متصفحك
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-600" />
                <span>آخر حفظ تلقائي</span>
              </div>
              <span className="text-xs font-semibold text-slate-800 font-mono-num block truncate">
                {lastSavedTime
                  ? lastSavedTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'الآن'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {(diagnostics.estimatedBytes / 1024).toFixed(1)} ك.ب مستهلكة
              </span>
            </div>
          </div>

          {/* Explain to user */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3.5 text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>التقدم محفوظ دائماً (Persistence Active)</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              يمكنك تحديث الصفحة (F5 / Refresh) أو إغلاق المتصفح في أي وقت؛ ستبقى جميع معاملاتك، المراحل المنجزة، ملاحظات الفاحص، وإسنادات المهندسين محفوظة بالكامل في هذا الجهاز والمتصفح.
            </p>
          </div>

          {/* Data Backup & Restore Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-900">
              النسخ الاحتياطي والاستعادة (Backup & Restore)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="p-3 border border-slate-200 hover:border-slate-300 rounded-lg bg-white hover:bg-slate-50 flex items-start gap-3 transition-colors text-right cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    تصدير نسخة احتياطية (JSON)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    تنزيل كافة المعاملات بملف خارجي لنقلها لجهاز آخر أو للاحتفاظ بأرشيف
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 border border-slate-200 hover:border-slate-300 rounded-lg bg-white hover:bg-slate-50 flex items-start gap-3 transition-colors text-right cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    استيراد نسخة احتياطية
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    رفع ملف JSON سابق لاستعادة جميع المعاملات وتحديث السجل
                  </span>
                </div>
              </button>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Reset & Manual Actions */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-900">
              إجراءات إضافية
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleManualSave}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>حفظ فوري يدوي الآن</span>
              </button>

              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط البيانات إلى الوضع الافتراضي</span>
                </button>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg w-full space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>تأكيد إعادة الضبط إلى بيانات المصنع الافتراضية؟</span>
                  </div>
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    سيتم مسح كافة التعديلات، المراحل المنجزة، والمعاملات الجديدة المضافة محلياً، وإرجاع المعاملات النموذجية الأولية لمحافظة الأحساء.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer"
                    >
                      نعم، استعادة الافتراضي
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            نظام EngiTrack لمكاتب المساحة الهندسية
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
