import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Hash, Layers, FileText } from 'lucide-react';
import { SurveyingTransaction, SurveyTransactionType } from '../types';
import {
  SURVEY_ENGINEERS,
  MUNICIPALITIES_LIST,
  MUNICIPALITY_DISTRICTS,
} from '../data/mockTransactions';
import { getLiveDateOnly, getLiveTimestamp } from '../utils/dateUtils';

interface NewSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (tx: SurveyingTransaction) => void;
  existingCount: number;
}

export const NewSurveyModal: React.FC<NewSurveyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  existingCount,
}) => {
  const defaultRefNumber = `SURV-26-${100 + existingCount + 1}`;
  const [referenceCode, setReferenceCode] = useState(defaultRefNumber);
  const [type, setType] = useState<SurveyTransactionType>('تحديث صك عقاري');
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNationalId, setClientNationalId] = useState('');
  const [deedNumber, setDeedNumber] = useState('');
  const [plotNumber, setPlotNumber] = useState('');
  const [blockNumber, setBlockNumber] = useState('');
  const [planNumber, setPlanNumber] = useState('');

  // Sync default reference number when modal opens
  useEffect(() => {
    if (isOpen) {
      setReferenceCode(`SURV-26-${100 + existingCount + 1}`);
    }
  }, [isOpen, existingCount]);
  
  // Municipality & District selection
  const [municipality, setMunicipality] = useState<string>('بلدية الهفوف');
  const [district, setDistrict] = useState<string>('حي الخالدية');
  const [isCustomDistrict, setIsCustomDistrict] = useState<boolean>(false);
  const [customDistrictText, setCustomDistrictText] = useState<string>('');

  const [landAreaSqm, setLandAreaSqm] = useState('600');
  const [unitsCount, setUnitsCount] = useState('10');
  const [subdividedPlotsCount, setSubdividedPlotsCount] = useState('2');
  const [assignedEngineerId, setAssignedEngineerId] = useState(SURVEY_ENGINEERS[0].id);
  const [contractValueSAR, setContractValueSAR] = useState('4500');
  const [collectedAmountSAR, setCollectedAmountSAR] = useState('2500');

  if (!isOpen) return null;

  // Available districts for the selected municipality
  const availableDistricts = MUNICIPALITY_DISTRICTS[municipality] || [];

  const handleMunicipalityChange = (newMuni: string) => {
    setMunicipality(newMuni);
    const newDistricts = MUNICIPALITY_DISTRICTS[newMuni] || [];
    if (newDistricts.length > 0) {
      setDistrict(newDistricts[0]);
      setIsCustomDistrict(false);
      setCustomDistrictText('');
    }
  };

  const handleDistrictSelectChange = (val: string) => {
    if (val === '__custom__') {
      setIsCustomDistrict(true);
      setDistrict('');
    } else {
      setIsCustomDistrict(false);
      setDistrict(val);
      setCustomDistrictText('');
    }
  };

  const finalDistrict = isCustomDistrict ? (customDistrictText.trim() || 'حي غير محدد') : district;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !deedNumber.trim() || !plotNumber.trim()) return;

    const engineer =
      SURVEY_ENGINEERS.find((e) => e.id === assignedEngineerId) ||
      SURVEY_ENGINEERS[0];

    const todayStr = getLiveDateOnly();
    const liveTimestamp = getLiveTimestamp();
    const nextNum = 100 + existingCount + 1;
    const finalRefCode = referenceCode.trim() || `SURV-26-${nextNum}`;

    const blockText = blockNumber.trim() ? ` بلك ${blockNumber.trim()}` : '';
    const generatedTitle =
      title.trim() ||
      `${type} — قطعة ${plotNumber.trim()}${blockText} (${finalDistrict} · ${municipality})`;

    const derivedCity = municipality.replace('بلدية ', '') || 'الأحساء';

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 21);
    const targetDateStr = getLiveDateOnly(targetDate);

    const newTx: SurveyingTransaction = {
      id: `trx-${nextNum}-${Date.now()}`,
      referenceCode: finalRefCode,
      type,
      title: generatedTitle,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || '0500000000',
      clientNationalId: clientNationalId.trim() || '1000000000',
      deedNumber: deedNumber.trim(),
      plotNumber: plotNumber.trim(),
      blockNumber: blockNumber.trim() || undefined,
      planNumber: planNumber.trim() || '2500',
      municipality: municipality.trim(),
      district: finalDistrict,
      city: derivedCity,
      landAreaSqm: Number(landAreaSqm) || 500,
      unitsCount: type === 'فرز وحدات عقارية' ? Number(unitsCount) || 1 : undefined,
      subdividedPlotsCount:
        type === 'فرز أراضي' || type === 'دمج أراضي'
          ? Number(subdividedPlotsCount) || 2
          : undefined,
      currentStepKey: 'step1_site_survey',
      health: 'on_track',
      receivedDate: todayStr,
      targetCompletionDate: targetDateStr,
      daysActive: 0,
      assignedEngineer: engineer,
      steps: {
        step1_site_survey: {
          key: 'step1_site_survey',
          stepNumber: 1,
          name: 'أولاً: زيارة الموقع وعمل الرفع المساحي',
          shortName: 'الرفع المساحي',
          description: `تحديد موعد المعاينة الميدانية ورصد النقاط المساحية بـ ${municipality} (${finalDistrict})`,
          status: 'in_progress',
          startedAt: todayStr,
          notes: 'تم استلام المعاملة وتعيين مهندس المساحة لبدء المعاينة والرفع الميداني',
          files: [],
        },
        step2_krooki: {
          key: 'step2_krooki',
          stepNumber: 2,
          name: 'ثانياً: إعداد الكروكي المساحي والتنظيمي',
          shortName: 'عمل الكروكي',
          description: 'رسم الكروكي وتحديد عروض الشوارع والارتدادات',
          status: 'pending',
          files: [],
        },
        step3_geo_explorer: {
          key: 'step3_geo_explorer',
          stepNumber: 3,
          name: 'ثالثاً: رفع المعاملة على المستكشف الجغرافي',
          shortName: 'المستكشف الجغرافي',
          description: 'إسقاط المضلع الجغرافي على خريطة الأمانة الرقمية',
          status: 'pending',
          files: [],
        },
        step4_balady: {
          key: 'step4_balady',
          stepNumber: 4,
          name: 'رابعاً: رفع المعاملة على منصة بلدي',
          shortName: 'منصة بلدي',
          description: 'رفع الطلب وإصدار القرار المساحي ومحاضر الفرز',
          status: 'pending',
          files: [],
        },
        step5_re_exchange: {
          key: 'step5_re_exchange',
          stepNumber: 5,
          name: 'خامساً: الرفع على البورصة العقارية',
          shortName: 'البورصة العقارية',
          description: 'إصدار وتوثيق الصكوك الإلكترونية عبر البورصة العقارية',
          status: 'pending',
          files: [],
        },
      },
      inspectorFeedbacks: [],
      contractValueSAR: Number(contractValueSAR) || 4500,
      collectedAmountSAR: Number(collectedAmountSAR) || 2500,
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: liveTimestamp,
          engineerName: engineer.name,
          category: 'إداري',
          action: `فتح ملف معاملة (${type}) برقم (${finalRefCode}) وصك (${deedNumber.trim()}) في ${municipality} (${finalDistrict}) وإسنادها للمهندس المسؤول`,
        },
      ],
    };

    onCreate(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-700" />
              <span>فتح ملف معاملة مساحية جديدة</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              قسم المساحة — تحديث الصكوك · فرز ودمج الأراضي · فرز الوحدات العقارية (محافظة الأحساء)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              نوع المعاملة المساحية *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['تحديث صك عقاري', 'فرز أراضي', 'دمج أراضي', 'فرز وحدات عقارية'] as SurveyTransactionType[]).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-2.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      type === t
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Transaction Reference Number & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                رقم المعاملة بالمكتب *
              </label>
              <input
                type="text"
                required
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="مثال: SURV-26-106 أو 1447/85"
                className="w-full px-3 py-2 text-xs font-mono-num font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                كود المرجع التعريفي المعتمد للمعاملة
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                مسمى المعاملة (اختياري — يتم التوليد تلقائياً إذا تُرك فارغاً)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تحديث صك ورقي قديم — قطعة 412..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                وصف مختصر يوضح المعاملة والموقع
              </span>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                اسم المالك أو المستفيد *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="الاسم الرباعي أو اسم الشركة"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                رقم جوال المالك
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono-num focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                رقم الهوية / السجل التجاري
              </label>
              <input
                type="text"
                value={clientNationalId}
                onChange={(e) => setClientNationalId(e.target.value)}
                placeholder="10XXXXXXXX"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono-num focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Location and Deed Coordinates */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-slate-700" />
              <span>بيانات الموقع والبلدية والصك</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Municipality Select Box */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  البلدية *
                </label>
                <div className="relative">
                  <select
                    value={municipality}
                    onChange={(e) => handleMunicipalityChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white cursor-pointer"
                  >
                    {MUNICIPALITIES_LIST.map((muni) => (
                      <option key={muni} value={muni}>
                        {muni}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  يتوفر: بلدية الهفوف، بلدية العمران، بلدية المبرز، بلدية العيون، بلدية الجفر، بلدية جواثا
                </span>
              </div>

              {/* District Dropdown with All Neighborhoods */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  الحي (الأحياء التابعة للبلدية) *
                </label>
                <select
                  value={isCustomDistrict ? '__custom__' : district}
                  onChange={(e) => handleDistrictSelectChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white cursor-pointer"
                >
                  <optgroup label={`أحياء ومناطق ${municipality} (${availableDistricts.length} حي وبلدة)`}>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="خيارات أخرى">
                    <option value="__custom__">كتابة حي آخر يدويًا...</option>
                  </optgroup>
                </select>

                {isCustomDistrict && (
                  <input
                    type="text"
                    required
                    value={customDistrictText}
                    onChange={(e) => setCustomDistrictText(e.target.value)}
                    placeholder="اكتب اسم الحي يدويًا هنا..."
                    className="w-full mt-2 px-3 py-1.5 text-xs border border-amber-300 bg-amber-50/50 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                )}
                <span className="text-[11px] text-slate-500 mt-1 block">
                  قائمة منسدلة تضم كل أحياء {municipality} لسهولة وسرعة الاختيار
                </span>
              </div>
            </div>

            {/* Plot, Block, Plan, and Deed Number */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  رقم الصك *
                </label>
                <input
                  type="text"
                  required
                  value={deedNumber}
                  onChange={(e) => setDeedNumber(e.target.value)}
                  placeholder="رقم الصك الورقي أو الإلكتروني"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  رقم القطعة *
                </label>
                <input
                  type="text"
                  required
                  value={plotNumber}
                  onChange={(e) => setPlotNumber(e.target.value)}
                  placeholder="مثال: 412"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-600" />
                  <span>رقم البلك</span>
                </label>
                <input
                  type="text"
                  value={blockNumber}
                  onChange={(e) => setBlockNumber(e.target.value)}
                  placeholder="مثال: 15 أو 04"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono-num focus:outline-none focus:border-slate-900 bg-slate-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  رقم المخطط
                </label>
                <input
                  type="text"
                  value={planNumber}
                  onChange={(e) => setPlanNumber(e.target.value)}
                  placeholder="مثال: 2450 / أ"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Area and Subdivided units */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المساحة الإجمالية للصك (م²) *
                </label>
                <input
                  type="number"
                  required
                  value={landAreaSqm}
                  onChange={(e) => setLandAreaSqm(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-slate-900"
                />
              </div>

              {type === 'فرز وحدات عقارية' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    عدد الوحدات المراد فرزها
                  </label>
                  <input
                    type="number"
                    value={unitsCount}
                    onChange={(e) => setUnitsCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-slate-900"
                  />
                </div>
              )}

              {(type === 'فرز أراضي' || type === 'دمج أراضي') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {type === 'فرز أراضي' ? 'عدد القطع الناتجة عن الفرز' : 'عدد القطع المدمجة'}
                  </label>
                  <input
                    type="number"
                    value={subdividedPlotsCount}
                    onChange={(e) => setSubdividedPlotsCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-slate-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Engineer Assignment */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <label className="block text-xs font-bold text-slate-900 mb-1">
              مهندس المساحة المسؤول عن المعاملة (متابعة كامل المسار) *
            </label>
            <select
              value={assignedEngineerId}
              onChange={(e) => setAssignedEngineerId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              {SURVEY_ENGINEERS.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name} — {eng.title} (جوال: {eng.phone})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              مبدأ قسم المساحة: مهندس مساحة واحد يتولى المعاملة من الاستلام والرفع الميداني وحتى الصك الإلكتروني بالبورصة العقارية
            </p>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">أتعاب المعاملة (ر.س)</label>
              <input
                type="number"
                value={contractValueSAR}
                onChange={(e) => setContractValueSAR(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الدفعة المحصلة (ر.س)</label>
              <input
                type="number"
                value={collectedAmountSAR}
                onChange={(e) => setCollectedAmountSAR(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-num focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm cursor-pointer"
            >
              فتح ملف المعاملة وبدء الرفع المساحي
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
