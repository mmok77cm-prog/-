import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Users,
  Banknote,
  MessageSquareWarning,
  Layers,
  Compass,
  RotateCcw,
  Building2,
  MapPin,
  Globe2,
  ArrowLeft,
  Printer,
  ChevronDown,
  Sparkles,
  Trash2,
  Database,
  UserCheck,
} from 'lucide-react';
import {
  SurveyingTransaction,
  SurveyStepKey,
  SurveyTransactionType,
  SURVEY_STEPS_CONFIG,
} from './types';
import {
  INITIAL_SURVEY_TRANSACTIONS,
  SURVEY_ENGINEERS,
  MUNICIPALITIES_LIST,
  MUNICIPALITY_DISTRICTS,
} from './data/mockTransactions';
import {
  loadSavedTransactions,
  saveTransactions,
  ACTIVE_TAB_STORAGE_KEY,
  LAST_SAVED_STORAGE_KEY,
} from './utils/storage';
import { getLiveDateOnly, getLiveTimestamp } from './utils/dateUtils';
import { SurveyDetailDrawer } from './components/SurveyDetailDrawer';
import { NewSurveyModal } from './components/NewSurveyModal';
import { SurveyClientLookupModal } from './components/SurveyClientLookupModal';
import { TransactionProgressBar } from './components/TransactionProgressBar';
import { DataManagementModal } from './components/DataManagementModal';

type WorkspaceTab =
  | 'table_view'
  | 'deed_pipeline_view'
  | 'notes_view'
  | 'engineers_view'
  | 'financial_view';

const DEED_STEP_KEYS: SurveyStepKey[] = [
  'step1_site_survey',
  'step2_krooki',
  'step3_geo_explorer',
  'step4_balady',
  'step5_re_exchange',
];

export default function App() {
  // Load persisted transactions on initialization
  const [transactions, setTransactions] = useState<SurveyingTransaction[]>(() =>
    loadSavedTransactions()
  );

  // Restore previous active tab or default to table_view
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as WorkspaceTab;
      if (
        saved &&
        [
          'table_view',
          'deed_pipeline_view',
          'notes_view',
          'engineers_view',
          'financial_view',
        ].includes(saved)
      ) {
        return saved;
      }
    }
    return 'table_view';
  });

  // Track last saved timestamp for user feedback
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LAST_SAVED_STORAGE_KEY);
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return new Date();
  });

  // Automatically save transactions to localStorage whenever changed
  useEffect(() => {
    saveTransactions(transactions);
    setLastSavedTime(new Date());
  }, [transactions]);

  // Persist current active tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
      } catch (e) {
        console.warn('Could not save active tab preference:', e);
      }
    }
  }, [activeTab]);

  // Filters
  const [typeFilter, setTypeFilter] = useState<SurveyTransactionType | 'all'>('all');
  const [municipalityFilter, setMunicipalityFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stepFilter, setStepFilter] = useState<SurveyStepKey | 'all'>('all');
  const [engineerFilter, setEngineerFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'overdue' | 'on_track' | 'completed'>('all');

  // Modals & Selected
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<SurveyingTransaction | null>(null);

  const selectedTransaction = useMemo(
    () => transactions.find((t) => t.id === selectedTxId) || null,
    [transactions, selectedTxId]
  );

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        tx.deedNumber.toLowerCase().includes(q) ||
        tx.referenceCode.toLowerCase().includes(q) ||
        tx.clientName.toLowerCase().includes(q) ||
        tx.title.toLowerCase().includes(q) ||
        tx.district.toLowerCase().includes(q) ||
        tx.municipality.toLowerCase().includes(q) ||
        (tx.blockNumber && tx.blockNumber.toLowerCase().includes(q)) ||
        tx.plotNumber.toLowerCase().includes(q) ||
        tx.planNumber.toLowerCase().includes(q) ||
        tx.assignedEngineer.name.toLowerCase().includes(q);

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesMunicipality = municipalityFilter === 'all' || tx.municipality === municipalityFilter;
      const matchesDistrict = districtFilter === 'all' || tx.district === districtFilter;
      const matchesStep = stepFilter === 'all' || tx.currentStepKey === stepFilter;
      const matchesEngineer = engineerFilter === 'all' || tx.assignedEngineer.id === engineerFilter;
      const matchesHealth = healthFilter === 'all' || tx.health === healthFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesMunicipality &&
        matchesDistrict &&
        matchesStep &&
        matchesEngineer &&
        matchesHealth
      );
    });
  }, [
    transactions,
    searchQuery,
    typeFilter,
    municipalityFilter,
    districtFilter,
    stepFilter,
    engineerFilter,
    healthFilter,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const active = transactions.filter((t) => t.steps.step5_re_exchange.status !== 'completed').length;
    const completed = transactions.filter((t) => t.steps.step5_re_exchange.status === 'completed').length;
    const deedCount = transactions.filter((t) => t.type === 'تحديث صك عقاري').length;
    const landSubCount = transactions.filter((t) => t.type === 'فرز أراضي' || t.type === 'دمج أراضي').length;
    const unitsSubCount = transactions.filter((t) => t.type === 'فرز وحدات عقارية').length;
    const openFeedbacks = transactions.reduce(
      (acc, t) => acc + t.inspectorFeedbacks.filter((f) => !f.resolved).length,
      0
    );
    const totalContractSAR = transactions.reduce((acc, t) => acc + t.contractValueSAR, 0);
    const totalCollectedSAR = transactions.reduce((acc, t) => acc + t.collectedAmountSAR, 0);

    return {
      active,
      completed,
      deedCount,
      landSubCount,
      unitsSubCount,
      openFeedbacks,
      totalContractSAR,
      totalCollectedSAR,
      pendingSAR: totalContractSAR - totalCollectedSAR,
    };
  }, [transactions]);

  // Handlers
  const handleAdvanceStep = (
    transactionId: string,
    stepKey: SurveyStepKey,
    referenceNumber?: string,
    notes?: string
  ) => {
    const todayStr = getLiveDateOnly();
    const liveTimestamp = getLiveTimestamp();

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== transactionId) return tx;
        const currentIdx = DEED_STEP_KEYS.indexOf(stepKey);
        const isLastStep = currentIdx === DEED_STEP_KEYS.length - 1;
        const nextStepKey = !isLastStep ? DEED_STEP_KEYS[currentIdx + 1] : stepKey;

        const updatedSteps = { ...tx.steps };

        updatedSteps[stepKey] = {
          ...updatedSteps[stepKey],
          status: 'completed',
          completedAt: todayStr,
          referenceNumber: referenceNumber || updatedSteps[stepKey].referenceNumber,
          notes: notes || updatedSteps[stepKey].notes,
        };

        if (!isLastStep) {
          updatedSteps[nextStepKey] = {
            ...updatedSteps[nextStepKey],
            status: 'in_progress',
            startedAt: todayStr,
          };
        }

        const newHealth = isLastStep ? 'completed' : 'on_track';

        return {
          ...tx,
          currentStepKey: nextStepKey,
          health: newHealth,
          steps: updatedSteps,
          activityLog: [
            {
              id: `act-${Date.now()}`,
              timestamp: liveTimestamp,
              engineerName: tx.assignedEngineer.name,
              category: 'توثيق',
              action: `إتمام مرحلة (${SURVEY_STEPS_CONFIG[stepKey].name}) ${
                !isLastStep ? `والانتقال إلى (${SURVEY_STEPS_CONFIG[nextStepKey].name})` : 'وإتمام المعاملة بنجاح'
              }`,
            },
            ...tx.activityLog,
          ],
        };
      })
    );
  };

  const handleReturnStep = (
    transactionId: string,
    stepKey: SurveyStepKey,
    source: 'المستكشف الجغرافي' | 'منصة بلدي' | 'البورصة العقارية' | 'الفاحص المساحي الميداني',
    comment: string
  ) => {
    const todayStr = getLiveDateOnly();
    const liveTimestamp = getLiveTimestamp();

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== transactionId) return tx;

        const updatedSteps = { ...tx.steps };
        updatedSteps[stepKey] = {
          ...updatedSteps[stepKey],
          status: 'returned',
          notes: `ملاحظة إرجاع من ${source}: ${comment}`,
        };

        return {
          ...tx,
          health: 'overdue',
          steps: updatedSteps,
          inspectorFeedbacks: [
            {
              id: `inf-${Date.now()}`,
              stepKey,
              stepName: SURVEY_STEPS_CONFIG[stepKey].shortName,
              source,
              date: todayStr,
              comment,
              resolved: false,
            },
            ...tx.inspectorFeedbacks,
          ],
          activityLog: [
            {
              id: `act-${Date.now()}`,
              timestamp: liveTimestamp,
              engineerName: tx.assignedEngineer.name,
              category: 'بلدي',
              action: `تسجيل ملاحظة فاحص من ${source} على مرحلة (${SURVEY_STEPS_CONFIG[stepKey].shortName}): ${comment}`,
            },
            ...tx.activityLog,
          ],
        };
      })
    );
  };

  const handleResolveFeedback = (
    transactionId: string,
    feedbackId: string,
    response: string
  ) => {
    const liveTimestamp = getLiveTimestamp();

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== transactionId) return tx;

        const updatedFeedbacks = tx.inspectorFeedbacks.map((f) =>
          f.id === feedbackId ? { ...f, resolved: true, engineerResponse: response } : f
        );

        const currentStep = tx.steps[tx.currentStepKey];
        const updatedSteps = { ...tx.steps };
        if (currentStep.status === 'returned') {
          updatedSteps[tx.currentStepKey] = {
            ...currentStep,
            status: 'in_progress',
          };
        }

        return {
          ...tx,
          health: 'on_track',
          steps: updatedSteps,
          inspectorFeedbacks: updatedFeedbacks,
          activityLog: [
            {
              id: `act-${Date.now()}`,
              timestamp: liveTimestamp,
              engineerName: tx.assignedEngineer.name,
              category: 'توثيق',
              action: `معالجة ملاحظة الفاحص وإعادة رفع الملفات المعتمدة: ${response}`,
            },
            ...tx.activityLog,
          ],
        };
      })
    );
  };

  const handleReassignEngineer = (transactionId: string, engineerId: string) => {
    const newEng = SURVEY_ENGINEERS.find((e) => e.id === engineerId);
    if (!newEng) return;
    const liveTimestamp = getLiveTimestamp();

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== transactionId) return tx;
        return {
          ...tx,
          assignedEngineer: newEng,
          activityLog: [
            {
              id: `act-${Date.now()}`,
              timestamp: liveTimestamp,
              engineerName: newEng.name,
              category: 'إداري',
              action: `إسناد مسؤولية متابعة كامل مسار المعاملة إلى مهندس المساحة ${newEng.name}`,
            },
            ...tx.activityLog,
          ],
        };
      })
    );
  };

  const handleAddActivityLog = (
    transactionId: string,
    action: string,
    category?: string,
    customTimestamp?: string
  ) => {
    const timestamp = customTimestamp?.trim() || getLiveTimestamp();
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== transactionId) return tx;
        return {
          ...tx,
          activityLog: [
            {
              id: `act-${Date.now()}`,
              timestamp,
              engineerName: tx.assignedEngineer.name,
              category: category || 'ميداني',
              action: action.trim(),
            },
            ...tx.activityLog,
          ],
        };
      })
    );
  };

  const handleEditActivityLog = (
    transactionId: string,
    logId: string,
    newAction: string,
    newTimestamp: string
  ) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== transactionId) return tx;
        return {
          ...tx,
          activityLog: tx.activityLog.map((log) =>
            log.id === logId
              ? { ...log, action: newAction.trim(), timestamp: newTimestamp.trim() }
              : log
          ),
        };
      })
    );
  };

  const handleDeleteActivityLog = (transactionId: string, logId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== transactionId) return tx;
        return {
          ...tx,
          activityLog: tx.activityLog.filter((log) => log.id !== logId),
        };
      })
    );
  };

  const handleCreateSurvey = (newTx: SurveyingTransaction) => {
    setTransactions((prev) => [newTx, ...prev]);
    setSelectedTxId(newTx.id);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    if (selectedTxId === transactionId) {
      setSelectedTxId(null);
    }
    setTxToDelete(null);
  };

  const handleUpdatePayment = (
    transactionId: string,
    newContractValue: number,
    newCollectedAmount: number
  ) => {
    const liveTimestamp = getLiveTimestamp();
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== transactionId) return tx;
        const diff = newCollectedAmount - tx.collectedAmountSAR;
        const diffNote =
          diff !== 0
            ? diff > 0
              ? `تسجيل تحصيل دفعة نقدية بقيمة ${diff.toLocaleString('en-US')} ر.س (إجمالي المحصل: ${newCollectedAmount.toLocaleString('en-US')} ر.س)`
              : `تعديل المبلغ المحصل ليصبح ${newCollectedAmount.toLocaleString('en-US')} ر.س`
            : `تحديث إجمالي الأتعاب إلى ${newContractValue.toLocaleString('en-US')} ر.س`;

        return {
          ...tx,
          contractValueSAR: newContractValue,
          collectedAmountSAR: newCollectedAmount,
          activityLog: [
            {
              id: `act-${Date.now()}`,
              timestamp: liveTimestamp,
              engineerName: tx.assignedEngineer.name,
              category: 'مالي',
              action: diffNote,
            },
            ...tx.activityLog,
          ],
        };
      })
    );
  };

  const handleExportCSV = () => {
    const headers = [
      'رقم المعاملة',
      'نوع المعاملة المساحية',
      'رقم الصك',
      'اسم المالك',
      'رقم الجوال',
      'البلدية',
      'الحي',
      'رقم البلك',
      'رقم القطعة',
      'رقم المخطط',
      'المساحة م²',
      'المرحلة الحالية',
      'مهندس المساحة المسؤول',
      'أتعاب المعاملة',
      'المحصل',
    ];
    const rows = filteredTransactions.map((t) => [
      t.referenceCode,
      `"${t.type}"`,
      `'${t.deedNumber}`,
      `"${t.clientName}"`,
      t.clientPhone,
      `"${t.municipality}"`,
      `"${t.district}"`,
      `"${t.blockNumber || '—'}"`,
      t.plotNumber,
      t.planNumber,
      t.landAreaSqm,
      `"${SURVEY_STEPS_CONFIG[t.currentStepKey].name}"`,
      `"${t.assignedEngineer.name}"`,
      t.contractValueSAR,
      t.collectedAmountSAR,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `surveying-transactions-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setMunicipalityFilter('all');
    setDistrictFilter('all');
    setSearchQuery('');
    setStepFilter('all');
    setEngineerFilter('all');
    setHealthFilter('all');
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]" dir="rtl">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-l border-slate-200 shrink-0 hidden lg:flex flex-col justify-between no-print">
        <div>
          {/* Brand */}
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="text-base font-bold tracking-tight text-slate-900">
              EngiTrack — قسم المساحة
            </div>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              محافظة الأحساء (الهفوف · المبرز · العيون · الجفر)
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('table_view')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'table_view'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 shrink-0" />
                <span>سجل معاملات المساحة</span>
              </span>
              <span className="font-mono-num text-[11px] opacity-80">{transactions.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('deed_pipeline_view')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'deed_pipeline_view'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span>مسار تتبع تحديث الصكوك (الخطوات الـ 5)</span>
              </span>
              <span className="font-mono-num text-[11px] opacity-80">{stats.deedCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes_view')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'notes_view'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MessageSquareWarning className="w-4 h-4 shrink-0" />
                <span>ملاحظات الفاحص والجهات</span>
              </span>
              <span className="font-mono-num text-[11px] opacity-80">{stats.openFeedbacks}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('engineers_view')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'engineers_view'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>مهندسو المساحة (متابعة شاملة)</span>
              </span>
              <span className="font-mono-num text-[11px] opacity-80">{SURVEY_ENGINEERS.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('financial_view')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'financial_view'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Banknote className="w-4 h-4 shrink-0" />
                <span>أتعاب المعاملات والتحصيل</span>
              </span>
            </button>
          </nav>

          {/* Department Specialties Quick Switch */}
          <div className="px-5 py-4 mt-2 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-900 block mb-2.5">
              تخصصات قسم المساحة:
            </span>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTypeFilter(typeFilter === 'تحديث صك عقاري' ? 'all' : 'تحديث صك عقاري');
                  setActiveTab('table_view');
                }}
                className={`w-full flex items-center justify-between py-1 transition-colors cursor-pointer ${
                  typeFilter === 'تحديث صك عقاري' ? 'font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>تحديث الصكوك العقارية</span>
                <span className="font-mono-num font-bold text-slate-900">{stats.deedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTypeFilter(typeFilter === 'فرز أراضي' ? 'all' : 'فرز أراضي');
                  setActiveTab('table_view');
                }}
                className={`w-full flex items-center justify-between py-1 transition-colors cursor-pointer ${
                  typeFilter === 'فرز أراضي' ? 'font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>فرز ودمج الأراضي</span>
                <span className="font-mono-num font-bold text-slate-900">{stats.landSubCount}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTypeFilter(typeFilter === 'فرز وحدات عقارية' ? 'all' : 'فرز وحدات عقارية');
                  setActiveTab('table_view');
                }}
                className={`w-full flex items-center justify-between py-1 transition-colors cursor-pointer ${
                  typeFilter === 'فرز وحدات عقارية' ? 'font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>فرز الوحدات العقارية</span>
                <span className="font-mono-num font-bold text-slate-900">{stats.unitsSubCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Survey Policy Note */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 text-xs text-slate-600 space-y-1">
          <div className="font-bold text-slate-900">سياسة مهندس المعاملة الواحد</div>
          <p className="text-[11px] leading-relaxed">
            كل معاملة مساحية يُعيَّن لها مهندس مساحة واحد مسؤول بالكامل عن تتبع مسارها من الرفع الميداني وحتى الإفراغ بالبورصة العقارية.
          </p>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-6 no-print">
          <div className="flex items-center gap-2 text-sm whitespace-nowrap shrink-0">
            <span className="font-bold text-slate-900">قسم المساحة — محافظة الأحساء</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">
              {activeTab === 'table_view' && 'سجل معاملات المساحة'}
              {activeTab === 'deed_pipeline_view' && 'مسار تتبع تحديث الصكوك (المراحل الـ 5)'}
              {activeTab === 'notes_view' && 'ملاحظات الفاحص والجهات'}
              {activeTab === 'engineers_view' && 'مهندسو المساحة المسؤولون'}
              {activeTab === 'financial_view' && 'الأتعاب والتحصيل المالي'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Auto-save Status Badge */}
            <button
              type="button"
              onClick={() => setIsDataModalOpen(true)}
              title="البيانات تُحفظ تلقائياً في المتصفح، انقر لفتح إدارة التخزين والنسخ الاحتياطي"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>حفظ تلقائي مفعّل</span>
              {lastSavedTime && (
                <span className="text-[11px] text-emerald-700/80 font-mono-num border-r border-emerald-200 pr-1.5 mr-0.5">
                  {lastSavedTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDataModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="إدارة بيانات المعاملات، النسخ الاحتياطي، والاستعادة"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">إدارة البيانات والنسخ</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLookupModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="استعلام فوري برقم الهوية الوطنية أو اسم المالك أو رقم الصك"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>استعلام برقم الهوية أو اسم المالك</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>فتح معاملة مساحية</span>
            </button>
          </div>
        </header>

        {/* 4-Item KPI Strip */}
        <section className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-slate-500">معاملات المساحة الجارية بالمكتب</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono-num text-slate-900">
                  {stats.active}
                </span>
                <span className="text-xs text-slate-500">
                  من إجمالي <span className="font-mono-num font-semibold">{transactions.length}</span> معاملة
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">معاملات تحديث الصكوك المسجلة</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono-num text-slate-900">
                  {stats.deedCount}
                </span>
                <span className="text-xs text-slate-500">تتبع الخطوات الـ 5</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">فرز ودمج الأراضي والوحدات العقارية</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono-num text-slate-900">
                  {stats.landSubCount + stats.unitsSubCount}
                </span>
                <span className="text-xs text-slate-500">
                  (أراضي: {stats.landSubCount} · وحدات: {stats.unitsSubCount})
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">ملاحظات الفاحص المفتوحة</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono-num text-red-600">
                  {stats.openFeedbacks}
                </span>
                <span className="text-xs text-slate-500">المستكشف / بلدي / البورصة</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace Views */}
        <main className="p-6 flex-1 space-y-6">
          {/* TAB 1: DATA TABLE VIEW */}
          {activeTab === 'table_view' && (
            <div className="space-y-4">
              {/* Filter Strip */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث برقم الصك، اسم المالك، رقم القطعة، أو مهندس المساحة المسؤول..."
                      className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Survey Type Selector */}
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as SurveyTransactionType | 'all')}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-slate-900"
                    >
                      <option value="all">كافة اختصاصات قسم المساحة</option>
                      <option value="تحديث صك عقاري">تحديث صك عقاري</option>
                      <option value="فرز أراضي">فرز أراضي</option>
                      <option value="دمج أراضي">دمج أراضي</option>
                      <option value="فرز وحدات عقارية">فرز وحدات عقارية</option>
                    </select>

                    {/* Municipality Selector */}
                    <select
                      value={municipalityFilter}
                      onChange={(e) => {
                        setMunicipalityFilter(e.target.value);
                        setDistrictFilter('all');
                      }}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-slate-900"
                    >
                      <option value="all">كافة البلديات</option>
                      {MUNICIPALITIES_LIST.map((muni) => (
                        <option key={muni} value={muni}>
                          {muni}
                        </option>
                      ))}
                    </select>

                    {/* District Dropdown Selector */}
                    <select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-slate-900 max-w-[190px] truncate"
                    >
                      <option value="all">كافة الأحياء التابعة</option>
                      {municipalityFilter !== 'all' ? (
                        (MUNICIPALITY_DISTRICTS[municipalityFilter] || []).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))
                      ) : (
                        Object.entries(MUNICIPALITY_DISTRICTS).map(([muni, dists]) => (
                          <optgroup key={muni} label={muni}>
                            {dists.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </optgroup>
                        ))
                      )}
                    </select>

                    {/* Engineer Selector */}
                    <select
                      value={engineerFilter}
                      onChange={(e) => setEngineerFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-900"
                    >
                      <option value="all">كافة مهندسي المساحة</option>
                      {SURVEY_ENGINEERS.map((eng) => (
                        <option key={eng.id} value={eng.id}>
                          {eng.name}
                        </option>
                      ))}
                    </select>

                    {/* Health Filter */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setHealthFilter('all')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          healthFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        الكل ({transactions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setHealthFilter('overdue')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          healthFilter === 'overdue'
                            ? 'bg-white text-red-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        معادة بملاحظات
                      </button>
                      <button
                        type="button"
                        onClick={() => setHealthFilter('on_track')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          healthFilter === 'on_track'
                            ? 'bg-white text-emerald-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        قيد العمل
                      </button>
                      <button
                        type="button"
                        onClick={() => setHealthFilter('completed')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          healthFilter === 'completed'
                            ? 'bg-white text-emerald-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        مكتملة بالبورصة
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step Filter Tabs */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
                  <span className="text-xs text-slate-400 ml-2 shrink-0">المرحلة الحالية:</span>
                  <button
                    type="button"
                    onClick={() => setStepFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      stepFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    كل المراحل
                  </button>
                  {DEED_STEP_KEYS.map((k) => {
                    const cfg = SURVEY_STEPS_CONFIG[k];
                    const count = transactions.filter((t) => t.currentStepKey === k).length;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setStepFilter(k)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          stepFilter === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        0{cfg.order}. {cfg.shortName} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transactions Table */}
              {filteredTransactions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                  <p className="text-sm font-semibold text-slate-900">
                    لا توجد معاملات مساحية مطابقة لبحثك
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    جرب البحث برقم صك آخر أو إعادة ضبط الفلاتر.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة ضبط الفلاتر</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-3.5 px-4 font-medium whitespace-nowrap">رقم المعاملة / الصك</th>
                        <th className="py-3.5 px-4 font-medium">نوع المعاملة والمالك</th>
                        <th className="py-3.5 px-4 font-medium min-w-[220px] whitespace-nowrap">شريط تقدم المعاملة (المراحل الـ 5)</th>
                        <th className="py-3.5 px-4 font-medium whitespace-nowrap">مهندس المساحة المسؤول</th>
                        <th className="py-3.5 px-4 font-medium whitespace-nowrap">حالة المعاملة</th>
                        <th className="py-3.5 px-4 font-medium whitespace-nowrap">الأتعاب والتحصيل</th>
                        <th className="py-3.5 px-4 font-medium text-left whitespace-nowrap">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredTransactions.map((tx) => {
                        const stepCfg = SURVEY_STEPS_CONFIG[tx.currentStepKey];
                        const stepData = tx.steps[tx.currentStepKey];
                        const openNotes = tx.inspectorFeedbacks.filter((f) => !f.resolved).length;

                        return (
                          <tr
                            key={tx.id}
                            onClick={() => setSelectedTxId(tx.id)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-mono-num font-bold text-slate-900">
                                {tx.referenceCode}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                صك: <strong className="font-mono-num text-slate-800">{tx.deedNumber}</strong>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 max-w-sm">
                              <div className="font-bold text-slate-900">{tx.type}</div>
                              <div className="text-[11px] text-slate-800 font-medium mt-0.5">
                                {tx.clientName}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  {tx.municipality} · {tx.district} · ق {tx.plotNumber}
                                  {tx.blockNumber ? ` (بلك ${tx.blockNumber})` : ''} · م {tx.planNumber}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 min-w-[220px]">
                              <TransactionProgressBar transaction={tx} size="sm" />
                              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                                <span className="truncate">0{stepCfg.order}. {stepCfg.name}</span>
                                {stepData.referenceNumber && (
                                  <span className="font-mono-num text-[10px] text-slate-400 shrink-0">
                                    #{stepData.referenceNumber}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-semibold text-slate-900">
                                {tx.assignedEngineer.name}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {tx.assignedEngineer.sceNo} · {tx.assignedEngineer.phone}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {tx.health === 'overdue' && (
                                <div className="text-red-700 font-semibold flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>معادة بملاحظات ({openNotes} ملاحظة)</span>
                                </div>
                              )}
                              {tx.health === 'on_track' && (
                                <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span>قيد المتابعة والتنفيذ</span>
                                </div>
                              )}
                              {tx.health === 'completed' && (
                                <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>مكتملة بالبورصة العقارية</span>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap font-mono-num">
                              <div className="font-semibold text-slate-900">
                                {tx.collectedAmountSAR.toLocaleString('en-US')} / {tx.contractValueSAR.toLocaleString('en-US')} ر.س
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                متبقي: {(tx.contractValueSAR - tx.collectedAmountSAR).toLocaleString('en-US')} ر.س
                              </div>
                            </td>

                            <td
                              className="py-3.5 px-4 text-left whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTxId(tx.id)}
                                  className="px-3 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors cursor-pointer"
                                >
                                  فتح المعاملة
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTxToDelete(tx)}
                                  title="حذف المعاملة"
                                  aria-label="حذف المعاملة"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEED MODERNIZATION 5-STEP PIPELINE */}
          {activeTab === 'deed_pipeline_view' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    مسار تتبع تحديث الصكوك العقارية (المراحل الـ 5 المعتمدة)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    1. بعد الاستلام: زيارة الموقع لعمل رفع مساحي ➔ 2. عمل الكروكي ➔ 3. المستكشف الجغرافي ➔ 4. بلدي ➔ 5. البورصة العقارية
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {DEED_STEP_KEYS.map((sKey) => {
                  const cfg = SURVEY_STEPS_CONFIG[sKey];
                  // Filter specifically for deed update transactions
                  const deedTxs = transactions.filter(
                    (t) => t.type === 'تحديث صك عقاري' && t.currentStepKey === sKey
                  );

                  return (
                    <div
                      key={sKey}
                      className="bg-white border border-slate-200 rounded-lg flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              0{cfg.order}. {cfg.shortName}
                            </span>
                            <span className="text-[11px] text-slate-500">{cfg.defaultDays} أيام قياسية</span>
                          </div>
                          <span className="font-mono-num text-xs font-bold text-slate-700">
                            ({deedTxs.length})
                          </span>
                        </div>

                        {/* Cards */}
                        <div className="divide-y divide-slate-100">
                          {deedTxs.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">
                              لا توجد صكوك بهذه المرحلة
                            </div>
                          ) : (
                            deedTxs.map((tx) => (
                              <div
                                key={tx.id}
                                className="p-3.5 hover:bg-slate-50 transition-colors space-y-2"
                              >
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span className="font-mono-num font-bold text-slate-900">{tx.referenceCode}</span>
                                  <span>ق {tx.plotNumber}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedTxId(tx.id)}
                                  className="text-right block w-full text-xs font-bold text-slate-900 hover:underline cursor-pointer"
                                >
                                  {tx.clientName}
                                </button>

                                <div className="text-[11px] text-slate-600 font-mono-num">
                                  صك: {tx.deedNumber}
                                </div>

                                <div className="text-[11px] text-slate-700 bg-slate-100/80 px-2 py-1 rounded">
                                  المهندس: <strong className="text-slate-900">{tx.assignedEngineer.name}</strong>
                                </div>

                                <div className="pt-0.5">
                                  <TransactionProgressBar transaction={tx} size="sm" />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                  {tx.health === 'overdue' ? (
                                    <span className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      ملاحظة فاحص
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      منتظمة
                                    </span>
                                  )}

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTxId(tx.id)}
                                      className="px-2 py-1 text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                                    >
                                      تحديث المسار
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTxToDelete(tx);
                                      }}
                                      title="حذف المعاملة"
                                      aria-label="حذف المعاملة"
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: INSPECTOR FEEDBACK & NOTES */}
          {activeTab === 'notes_view' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900">
                  سجل ملاحظات الفاحصين والجهات (المستكشف الجغرافي · منصة بلدي · البورصة العقارية)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  متابعة الملاحظات الفنية والإرجاعات، مع توجيه الردود مباشرة لمهندس المساحة المسؤول
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {transactions
                  .flatMap((tx) =>
                    tx.inspectorFeedbacks.map((f) => ({ tx, feedback: f }))
                  )
                  .map(({ tx, feedback }) => (
                    <div
                      key={feedback.id}
                      className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70"
                    >
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono-num font-bold text-slate-900">{tx.referenceCode}</span>
                          <span>·</span>
                          <span className="font-bold text-slate-900">{tx.type}</span>
                          <span>·</span>
                          <span>صك: <strong className="font-mono-num text-slate-900">{tx.deedNumber}</strong></span>
                          <span>·</span>
                          <span>المالك: {tx.clientName}</span>
                          <span>·</span>
                          <span className="font-bold text-slate-800">{feedback.source}</span>
                          <span>·</span>
                          <span className="font-mono-num">{feedback.date}</span>
                        </div>

                        <p className="text-sm font-bold text-slate-900">{feedback.comment}</p>

                        <div className="text-xs text-slate-600">
                          مهندس المساحة المسؤول: <strong className="text-slate-900">{tx.assignedEngineer.name}</strong> ({tx.assignedEngineer.phone})
                        </div>

                        {feedback.engineerResponse && (
                          <div className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                            <span className="font-bold text-slate-900 block mb-0.5">رد المهندس المعتمد:</span>
                            {feedback.engineerResponse}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedTxId(tx.id)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          معالجة بالمعاملة
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: SURVEY ENGINEERS WORKLOAD */}
          {activeTab === 'engineers_view' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900">
                  توزيع معاملات قسم المساحة على المهندسين المسؤولين
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  مهندس مساحة واحد مسؤول بالكامل عن ملف العميل حتى صدور الصك الإلكتروني المحدث
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4 font-medium">مهندس المساحة</th>
                      <th className="py-3.5 px-4 font-medium">رقم هيئة المهندسين (SCE)</th>
                      <th className="py-3.5 px-4 font-medium">المعاملات النشطة تحت إشرافه</th>
                      <th className="py-3.5 px-4 font-medium">معاملات مكتملة بالبورصة</th>
                      <th className="py-3.5 px-4 font-medium">رقم الجوال</th>
                      <th className="py-3.5 px-4 font-medium text-left">تصفية المعاملات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {SURVEY_ENGINEERS.map((eng) => {
                      const engTxs = transactions.filter((t) => t.assignedEngineer.id === eng.id);
                      const activeCount = engTxs.filter((t) => t.steps.step5_re_exchange.status !== 'completed').length;
                      const completedCount = engTxs.filter((t) => t.steps.step5_re_exchange.status === 'completed').length;

                      return (
                        <tr key={eng.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{eng.name}</div>
                            <div className="text-[11px] text-slate-500">{eng.title}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono-num text-slate-700">{eng.sceNo}</td>
                          <td className="py-3.5 px-4 font-mono-num font-bold text-slate-900">
                            {activeCount} معاملات جارية
                          </td>
                          <td className="py-3.5 px-4 font-mono-num font-bold text-emerald-700">
                            {completedCount} معاملة منجزة
                          </td>
                          <td className="py-3.5 px-4 font-mono-num text-slate-600">{eng.phone}</td>
                          <td className="py-3.5 px-4 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setEngineerFilter(eng.id);
                                setActiveTab('table_view');
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                            >
                              عرض معاملات المهندس
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FINANCIAL VIEW */}
          {activeTab === 'financial_view' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    أتعاب ومستخلصات قسم المساحة
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    متابعة التحصيل المالي المرتبط بمراحل الرفع المساحي وإصدار الصكوك
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4 font-medium">رقم المعاملة</th>
                      <th className="py-3.5 px-4 font-medium">نوع المعاملة والمالك</th>
                      <th className="py-3.5 px-4 font-medium">إجمالي الأتعاب</th>
                      <th className="py-3.5 px-4 font-medium">المحصل</th>
                      <th className="py-3.5 px-4 font-medium">المتبقي</th>
                      <th className="py-3.5 px-4 font-medium">المرحلة الحالية</th>
                      <th className="py-3.5 px-4 font-medium text-left">الإجراء المالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono-num">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{tx.referenceCode}</td>
                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-semibold text-slate-900">{tx.title}</div>
                          <div className="text-[11px] text-slate-500">{tx.clientName} · صك: {tx.deedNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {tx.contractValueSAR.toLocaleString('en-US')} ر.س
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          {tx.collectedAmountSAR.toLocaleString('en-US')} ر.س
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-700">
                          {(tx.contractValueSAR - tx.collectedAmountSAR).toLocaleString('en-US')} ر.س
                        </td>
                        <td className="py-3.5 px-4 font-sans font-medium text-slate-700">
                          {SURVEY_STEPS_CONFIG[tx.currentStepKey].shortName}
                        </td>
                        <td className="py-3.5 px-4 text-left font-sans">
                          <button
                            type="button"
                            onClick={() => setSelectedTxId(tx.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            تسجيل دفعة / تعديل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Drawer for Survey Transaction Details & Step Advancement */}
      <SurveyDetailDrawer
        transaction={selectedTransaction}
        onClose={() => setSelectedTxId(null)}
        onAdvanceStep={handleAdvanceStep}
        onReturnStep={handleReturnStep}
        onResolveFeedback={handleResolveFeedback}
        onReassignEngineer={handleReassignEngineer}
        onUpdatePayment={handleUpdatePayment}
        onAddActivityLog={handleAddActivityLog}
        onEditActivityLog={handleEditActivityLog}
        onDeleteActivityLog={handleDeleteActivityLog}
        onDeleteTransaction={(id) => {
          const target = transactions.find((t) => t.id === id);
          if (target) setTxToDelete(target);
        }}
      />

      {/* New Survey Transaction Modal */}
      <NewSurveyModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateSurvey}
        existingCount={transactions.length}
      />

      {/* Client Quick Search Modal */}
      <SurveyClientLookupModal
        isOpen={isLookupModalOpen}
        transactions={transactions}
        onClose={() => setIsLookupModalOpen(false)}
        onSelectTransaction={(tx) => setSelectedTxId(tx.id)}
      />

      {/* Data Management & Persistence Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        transactions={transactions}
        onTransactionsUpdate={(newTxs) => {
          setTransactions(newTxs);
          setSelectedTxId(null);
        }}
        lastSavedTime={lastSavedTime}
      />

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4"
            dir="rtl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تأكيد حذف المعاملة المساحية
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  هل أنت متأكد من رغبتك في حذف هذا الملف نهائياً من سجل قسم المساحة؟
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">رقم المعاملة:</span>
                <span className="font-mono-num font-bold text-slate-900">{txToDelete.referenceCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">رقم الصك:</span>
                <span className="font-mono-num font-bold text-slate-900">{txToDelete.deedNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">اسم المالك:</span>
                <span className="font-semibold text-slate-900">{txToDelete.clientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">الموقع:</span>
                <span className="text-slate-800 font-medium">
                  {txToDelete.municipality} · {txToDelete.district} (قطعة {txToDelete.plotNumber}
                  {txToDelete.blockNumber ? ` · بلك ${txToDelete.blockNumber}` : ''})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">المرحلة الحالية:</span>
                <span className="font-bold text-slate-800">
                  {SURVEY_STEPS_CONFIG[txToDelete.currentStepKey].name}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2.5 rounded border border-red-100">
              تحذير: سيتم حذف كافة بيانات الرفع المساحي الميداني، الكروكيات، ملفات الـ GIS، وملاحظات الفاحص المسجلة المرتبطة بهذه المعاملة بشكل نهائي.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTransaction(txToDelete.id)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>نعم، حذف المعاملة نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
