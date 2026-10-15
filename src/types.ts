export type SurveyTransactionType =
  | 'تحديث صك عقاري'
  | 'فرز أراضي'
  | 'دمج أراضي'
  | 'فرز وحدات عقارية';

export type SurveyStepKey =
  | 'step1_site_survey'     // أولاً: زيارة الموقع لعمل الرفع المساحي
  | 'step2_krooki'          // ثانياً: عمل الكروكي
  | 'step3_geo_explorer'    // ثالثاً: رفع المعاملة على المستكشف الجغرافي
  | 'step4_balady'          // رابعاً: رفع المعاملة على بلدي
  | 'step5_re_exchange';    // خامساً: رفع على البورصة العقارية

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'returned';

export type TransactionHealth = 'on_track' | 'warning' | 'overdue' | 'completed';

export interface StepData {
  key: SurveyStepKey;
  stepNumber: number;
  name: string;
  shortName: string;
  description: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  referenceNumber?: string; // رقم الرفع المساحي، رقم الكروكي، رقم طلب المستكشف، رقم بلدي، رقم طلب البورصة
  notes?: string;
  files: {
    id: string;
    name: string;
    size?: string;
    date: string;
  }[];
}

export interface InspectorFeedback {
  id: string;
  stepKey: SurveyStepKey;
  stepName: string;
  source: 'المستكشف الجغرافي' | 'منصة بلدي' | 'البورصة العقارية' | 'الفاحص المساحي الميداني';
  date: string;
  comment: string;
  engineerResponse?: string;
  resolved: boolean;
}

export interface SurveyEngineer {
  id: string;
  name: string;
  phone: string;
  sceNo: string; // رقم هيئة المهندسين
  title: string;
  activeTransactionsCount: number;
  completedCount: number;
  monthlyTarget: number; // المستهدف الشهري لإنجاز المعاملات
}

export interface SurveyingTransaction {
  id: string;
  referenceCode: string; // e.g. SURV-26-101
  type: SurveyTransactionType;
  title: string;
  clientName: string;
  clientPhone: string;
  clientNationalId: string;
  deedNumber: string; // رقم الصك (أو الصكوك في حالة الدمج)
  deedDate?: string;
  plotNumber: string; // رقم القطعة
  blockNumber?: string; // رقم البلك
  planNumber: string; // رقم المخطط
  municipality: string; // البلدية (بلدية الهفوف، بلدية العمران، بلدية المبرز، بلدية العيون، بلدية الجفر)
  district: string; // الحي
  city: string; // المدينة
  landAreaSqm: number;
  surveyAreaSqm?: number;
  
  // Specific metadata depending on survey type:
  unitsCount?: number; // لفرز الوحدات العقارية
  subdividedPlotsCount?: number; // لفرز ودمج الأراضي
  
  currentStepKey: SurveyStepKey;
  health: TransactionHealth;
  receivedDate: string; // تاريخ الاستلام
  targetCompletionDate: string;
  daysActive: number;
  
  // مهندس مساحة واحد فقط مسؤول عن متابعة كامل مسار المعاملة من الاستلام حتى البورصة
  assignedEngineer: {
    id: string;
    name: string;
    phone: string;
    sceNo: string;
    title: string;
  };

  steps: Record<SurveyStepKey, StepData>;
  inspectorFeedbacks: InspectorFeedback[];
  
  contractValueSAR: number;
  collectedAmountSAR: number;
  
  activityLog: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  engineerName: string;
  action: string;
  category?: string;
}

export const SURVEY_STEPS_CONFIG: Record<SurveyStepKey, { order: number; name: string; shortName: string; defaultDays: number; desc: string }> = {
  step1_site_survey: {
    order: 1,
    name: 'أولاً: زيارة الموقع وعمل الرفع المساحي',
    shortName: 'الرفع المساحي',
    defaultDays: 3,
    desc: 'معاينة الموقع ميدانياً ورصد إحداثيات الأركان والحدود الطبيعية بأجهزة GPS/Total Station ومطابقتها مع الصك',
  },
  step2_krooki: {
    order: 2,
    name: 'ثانياً: إعداد الكروكي المساحي والتنظيمي',
    shortName: 'عمل الكروكي',
    defaultDays: 2,
    desc: 'رسم أضلاع ومساحة الأرض/الوحدات وتوضيح الشوارع والارتدادات، وإصدار الكروكي المعتمد بصيغة CAD و PDF',
  },
  step3_geo_explorer: {
    order: 3,
    name: 'ثالثاً: رفع المعاملة على المستكشف الجغرافي',
    shortName: 'المستكشف الجغرافي',
    defaultDays: 3,
    desc: 'إسقاط طبقة المضلع الجغرافي (Shapefile) على الخريطة الرقمية للأمانة ومطابقة استخدامات الأراضي والمخطط المعتمد',
  },
  step4_balady: {
    order: 4,
    name: 'رابعاً: رفع المعاملة على منصة بلدي',
    shortName: 'منصة بلدي',
    defaultDays: 4,
    desc: 'تقديم الطلب (تحديث صك / قرار مساحي / محضر فرز) عبر بلدي ومتابعة تدقيق واعتماد فاحص البلدية الفرعية',
  },
  step5_re_exchange: {
    order: 5,
    name: 'خامساً: الرفع على البورصة العقارية',
    shortName: 'البورصة العقارية',
    defaultDays: 3,
    desc: 'إحالة المعاملة المعتمدة إلى منصة البورصة العقارية (وزارة العدل) لإصدار وتوثيق الصك الإلكتروني المحدث أو صكوك الفرز',
  },
};
