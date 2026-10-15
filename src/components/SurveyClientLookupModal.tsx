import React, { useState, useMemo } from 'react';
import { X, Search, ArrowLeft, UserCheck, CreditCard, FileText, Phone, MapPin } from 'lucide-react';
import { SurveyingTransaction } from '../types';
import { TransactionProgressBar } from './TransactionProgressBar';

interface SurveyClientLookupModalProps {
  isOpen: boolean;
  transactions: SurveyingTransaction[];
  onClose: () => void;
  onSelectTransaction: (tx: SurveyingTransaction) => void;
}

export const SurveyClientLookupModal: React.FC<SurveyClientLookupModalProps> = ({
  isOpen,
  transactions,
  onClose,
  onSelectTransaction,
}) => {
  const [query, setQuery] = useState('');

  // Initial suggestion queries
  const sampleClients = useMemo(() => {
    const unique = new Map<string, { name: string; nationalId: string }>();
    for (const t of transactions) {
      if (!unique.has(t.clientNationalId)) {
        unique.set(t.clientNationalId, { name: t.clientName, nationalId: t.clientNationalId });
      }
    }
    return Array.from(unique.values()).slice(0, 4);
  }, [transactions]);

  const matchedTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If query is empty, show all or top 4 latest transactions
      return transactions.slice(0, 4);
    }

    return transactions.filter((t) => {
      return (
        t.clientNationalId.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        t.deedNumber.toLowerCase().includes(q) ||
        t.referenceCode.toLowerCase().includes(q) ||
        t.clientPhone.includes(q)
      );
    });
  }, [transactions, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
      <div
        className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                الاستعلام برقم الهوية أو اسم المالك
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                استعلام فوري عن ملفات وقرارات المساحة برقم الهوية الوطنية، اسم المستفيد، أو رقم الصك
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              ابحث برقم الهوية الوطنية أو اسم المالك أو رقم الصك
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="أدخل رقم الهوية (10 أرقام) أو اسم المالك (مثال: عبد العزيز الراجحي)..."
                className="w-full pr-10 pl-9 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-400 font-medium">اقتراحات سريعة:</span>
              {sampleClients.map((sample) => (
                <button
                  key={sample.nationalId}
                  type="button"
                  onClick={() => setQuery(sample.nationalId)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3 text-slate-500" />
                  <span>{sample.name.split(' ')[0]} ({sample.nationalId})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              {query
                ? `نتائج البحث المطابقة: (${matchedTransactions.length} معاملة)`
                : 'أحدث المعاملات المسجلة بالمكتب:'}
            </span>
          </div>

          {/* Results List */}
          {matchedTransactions.length > 0 ? (
            <div className="space-y-3">
              {matchedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="border border-slate-200 hover:border-slate-400 rounded-lg p-4 bg-slate-50/50 hover:bg-white transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono-num font-bold text-slate-900 px-1.5 py-0.5 bg-slate-200 rounded">
                          {tx.referenceCode}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-slate-800">{tx.type}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>الهوية:</span>
                          <strong className="font-mono-num text-slate-900">{tx.clientNationalId}</strong>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {tx.clientName}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span>صك: <strong className="font-mono-num text-slate-800">{tx.deedNumber}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {tx.municipality} — {tx.district} (قطعة {tx.plotNumber})
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono-num">{tx.clientPhone}</span>
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 pt-0.5">
                        مهندس المساحة المسؤول: <strong className="text-slate-800">{tx.assignedEngineer.name}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectTransaction(tx);
                      }}
                      className="px-3.5 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>عرض تفاصيل المعاملة</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="pt-2 border-t border-slate-100">
                    <TransactionProgressBar transaction={tx} size="sm" showLabels={true} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">لم يتم العثور على أي معاملة تطابق بحثك</p>
              <p className="text-[11px] text-slate-400">
                تأكد من كتابة رقم الهوية الوطنية (10 أرقام) أو اسم المالك بشكل صحيح.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>نظام الاستعلام السريع — قسم المساحة</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded-md cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
