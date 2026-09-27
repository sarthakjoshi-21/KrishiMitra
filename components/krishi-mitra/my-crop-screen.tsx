'use client'

import { useState, useEffect, useMemo, FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Droplets,
  Leaf,
  Languages,
  Loader2,
  MapPin,
  Pencil,
  PlusCircle,
  Sparkles,
  Sprout,
  Sun,
  Trash2,
  Wheat,
} from 'lucide-react';
import { useLanguage } from './language-context';
import { t } from '@/lib/translations';
import { calculateHarvestDate, getCropStages, FarmerCrop } from '@/lib/crop-utils';
import { getMyCrops, addMyCrop, updateMyCrop, deleteMyCrop } from '@/lib/actions/crop-actions';

const cropOptions = ['Onion', 'Wheat', 'Rice', 'Tomato', 'Cotton', 'Soybean', 'Sugarcane', 'Other'];

const defaultCrop: FarmerCrop = {
  id: '',
  farmer_id: '',
  crop_name: 'Wheat',
  variety: 'Lokwan',
  sowing_date: new Date().toISOString().split('T')[0],
  area_acres: 2.0,
  expected_harvest_date: calculateHarvestDate('Wheat', new Date().toISOString().split('T')[0]),
  // UI aliases
  name: 'Wheat',
  plantedDate: new Date().toISOString().split('T')[0],
  area: 2.0,
  quantity: 240,
  unit: 'kg',
  soil: 'Black soil',
  irrigation: 'Drip irrigation',
  notes: '',
};

interface Props {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export default function MyCropScreen({ onNavigate }: Props) {
  const { language, setLanguage } = useLanguage();
  const [crops, setCrops] = useState<FarmerCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCropId, setEditingCropId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedCropId, setSelectedCropId] = useState<string>('');

  const [form, setForm] = useState<FarmerCrop>(defaultCrop);

  // Active selected crop
  const crop = useMemo(() => {
    if (crops.length === 0) return null;
    return crops.find((c) => c.id === selectedCropId) ?? crops[0];
  }, [crops, selectedCropId]);

  // Days elapsed since sowing (re-computes dynamically upon crop change or update)
  const daysGrowing = useMemo(() => {
    const dateStr = crop?.sowing_date || crop?.plantedDate;
    if (!dateStr) return 0;
    const sowTime = new Date(`${dateStr}T00:00:00`).getTime();
    if (isNaN(sowTime)) return 0;
    return Math.max(0, Math.floor((Date.now() - sowTime) / 86400000));
  }, [crop]);

  // Stage-wise guidance list
  const guidanceSteps = useMemo(() => {
    return getCropStages(crop?.crop_name || crop?.name);
  }, [crop]);

  // Expected harvest date
  const expectedHarvest = useMemo(() => {
    if (crop?.expected_harvest_date) return crop.expected_harvest_date;
    const cName = crop?.crop_name || crop?.name || 'Wheat';
    const sDate = crop?.sowing_date || crop?.plantedDate || '';
    return sDate ? calculateHarvestDate(cName, sDate) : '';
  }, [crop]);

  // Load crops strictly from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const response = await getMyCrops();
        const data = Array.isArray(response)
          ? response
          : (Array.isArray(response?.data) ? response.data : []);
        if (isMounted) {
          setCrops(data);
          if (data.length > 0) {
            setSelectedCropId(data[0].id);
          }
        }
      } catch (e) {
        console.warn('[MyCropScreen] Failed to load crops from database:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleStartAdd() {
    setForm({
      ...defaultCrop,
      sowing_date: new Date().toISOString().split('T')[0],
      expected_harvest_date: calculateHarvestDate('Wheat', new Date().toISOString().split('T')[0]),
    });
    setEditingCropId(null);
    setFormError(null);
    setIsEditing(true);
  }

  function handleStartEdit(targetCrop: FarmerCrop) {
    const cropName = targetCrop.crop_name || targetCrop.name || 'Wheat';
    const sowingDate = targetCrop.sowing_date || targetCrop.plantedDate || new Date().toISOString().split('T')[0];
    const harvestDate = targetCrop.expected_harvest_date || calculateHarvestDate(cropName, sowingDate);

    setForm({
      ...defaultCrop,
      ...targetCrop,
      crop_name: cropName,
      name: cropName,
      variety: targetCrop.variety || '',
      sowing_date: sowingDate,
      plantedDate: sowingDate,
      area_acres: Number(targetCrop.area_acres ?? targetCrop.area) || 1.0,
      area: Number(targetCrop.area_acres ?? targetCrop.area) || 1.0,
      expected_harvest_date: harvestDate,
    });
    setEditingCropId(targetCrop.id);
    setFormError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setForm(defaultCrop);
    setEditingCropId(null);
    setFormError(null);
    setIsEditing(false);
  }

  // Conditional Submit: Calls updateMyCrop if editingCropId exists, else addMyCrop
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const cropName = form.crop_name || form.name || 'Wheat';
    const sowingDate = form.sowing_date || form.plantedDate || new Date().toISOString().split('T')[0];
    const areaAcres = Number(form.area_acres ?? form.area) || 1.0;
    const variety = form.variety || '';
    const harvestDate = form.expected_harvest_date || calculateHarvestDate(cropName, sowingDate);

    try {
      let savedCropId: string | null = null;
      if (editingCropId) {
        const res = await updateMyCrop(editingCropId, {
          crop_name: cropName,
          variety: variety,
          sowing_date: sowingDate,
          area_acres: areaAcres,
          expected_harvest_date: harvestDate,
        });
        savedCropId = res?.data?.id || editingCropId;
      } else {
        const res = await addMyCrop({
          crop_name: cropName,
          variety: variety,
          sowing_date: sowingDate,
          area_acres: areaAcres,
          expected_harvest_date: harvestDate,
        });
        savedCropId = res?.data?.id || null;
      }

      // Re-fetch authentic persisted records from DB
      const response = await getMyCrops();
      const freshData = Array.isArray(response)
        ? response
        : (Array.isArray(response?.data) ? response.data : []);
      
      setCrops(freshData);
      if (savedCropId) {
        setSelectedCropId(savedCropId);
      } else if (freshData.length > 0) {
        setSelectedCropId(freshData[0].id);
      }

      // Reset state upon successful save
      setEditingCropId(null);
      setForm(defaultCrop);
      setIsEditing(false);
    } catch (err: any) {
      console.error('[MyCropScreen] Save crop failed:', err);
      setFormError(err?.message || 'Database operation failed. Please verify connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function updateField<K extends keyof FarmerCrop>(key: K, value: FarmerCrop[K]) {
    setForm((current) => {
      const updated = { ...current, [key]: value };
      if (key === 'crop_name' || key === 'sowing_date' || key === 'name' || key === 'plantedDate') {
        const cName = String(key === 'crop_name' || key === 'name' ? value : (updated.crop_name || updated.name || 'Wheat'));
        const sDate = String(key === 'sowing_date' || key === 'plantedDate' ? value : (updated.sowing_date || updated.plantedDate || ''));
        updated.expected_harvest_date = calculateHarvestDate(cName, sDate);
      }
      return updated;
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('common.confirmDelete', language, 'Are you sure you want to delete this crop record?'))) {
      return;
    }
    try {
      await deleteMyCrop(id);
      const response = await getMyCrops();
      const refreshed = Array.isArray(response)
        ? response
        : (Array.isArray(response?.data) ? response.data : []);
      setCrops(refreshed);
      if (refreshed.length > 0) {
        setSelectedCropId(refreshed[0].id);
      } else {
        setSelectedCropId('');
      }
    } catch (e: any) {
      console.error('[MyCropScreen] Delete failed:', e);
      alert(e?.message || 'Failed to delete crop from database.');
    }
  }

  // ─── Shared Header with Language Selector ─────────────────────────────────
  const renderHeader = (actionButtons?: React.ReactNode) => (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onNavigate('Overview')} className="secondary-button">
          <ArrowLeft className="size-4" /> {t('schemes.topbar.dashboard', language, 'Dashboard')}
        </button>
        <div>
          <p className="font-serif text-lg font-bold">{t('myCrop.title', language, 'My Crop')}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">
            {t('myCrop.farmRecords', language, 'Active Farm Records')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Selector UI Component (matches Mandi / Marketplace) */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
          <Languages className="size-4 text-primary" />
          <select
            id="my-crop-language-selector"
            aria-label="Choose website language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'mr')}
            className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>

        {actionButtons}
      </div>
    </header>
  );

  // ─── 1. Form View (Add / Edit) ──────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="crop-page min-h-screen bg-background">
        {renderHeader(
          <button type="button" onClick={handleCancel} className="secondary-button">
            {t('common.cancel', language, 'Cancel')}
          </button>
        )}

        <main className="dashboard-main mx-auto max-w-4xl py-6">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" /> {t('common.cancel', language, 'Cancel and return')}
          </button>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {editingCropId ? <Pencil className="size-5" /> : <Sprout className="size-6" />}
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {editingCropId
                    ? t('myCrop.editCropTitle', language, 'Edit Crop Details')
                    : t('myCrop.addCropTitle', language, 'Add New Crop')}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {editingCropId
                    ? t('myCrop.editDetailsDesc', language, 'Update crop attributes, sowing date, or cultivated acreage.')
                    : t('myCrop.guidanceSubtitle', language, 'Track your farm lifecycle, harvest dates, and fertilizer guidance.')}
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive animate-in fade-in">
                <AlertCircle className="size-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field">
                  <span className="font-semibold">{t('myCrop.cropName', language, 'Crop Name')} *</span>
                  <select
                    value={form.crop_name || form.name}
                    onChange={(e) => {
                      updateField('crop_name', e.target.value);
                      updateField('name', e.target.value);
                    }}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
                    required
                  >
                    {cropOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span className="font-semibold">{t('myCrop.variety', language, 'Crop Variety')}</span>
                  <input
                    type="text"
                    value={form.variety || ''}
                    onChange={(e) => updateField('variety', e.target.value)}
                    placeholder={t('myCrop.varietyPlaceholder', language, 'e.g. N-53 (Rabi), Lokwan')}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
                  />
                </label>

                <label className="field">
                  <span className="font-semibold">{t('myCrop.sowingDate', language, 'Sowing Date')} *</span>
                  <input
                    type="date"
                    value={form.sowing_date || form.plantedDate}
                    onChange={(e) => {
                      updateField('sowing_date', e.target.value);
                      updateField('plantedDate', e.target.value);
                    }}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
                    required
                  />
                </label>

                <label className="field">
                  <span className="font-semibold">{t('myCrop.farmArea', language, 'Farm Area (Acres)')} *</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.area_acres || form.area}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      updateField('area_acres', val);
                      updateField('area', val);
                    }}
                    placeholder="2.0"
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
                    required
                  />
                </label>

                <label className="field sm:col-span-2">
                  <span className="font-semibold">{t('myCrop.expectedHarvest', language, 'Expected Harvest Date')}</span>
                  <input
                    type="date"
                    value={form.expected_harvest_date || ''}
                    onChange={(e) => updateField('expected_harvest_date', e.target.value)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {language === 'hi'
                      ? 'अनुमानित फसल चक्र के आधार पर स्वचालित रूप से गणना की गई।'
                      : language === 'mr'
                      ? 'अंदाजे पीक चक्राच्या आधारे आपोआप गणना केली.'
                      : 'Automatically estimated based on standard crop maturity period.'}
                  </p>
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="secondary-button"
                >
                  {t('common.cancel', language, 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="primary-button"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {t('myCrop.saving', language, 'Saving to Database...')}
                    </>
                  ) : (
                    <>
                      {editingCropId ? <Pencil className="size-4" /> : <Sprout className="size-4" />}
                      {editingCropId ? t('myCrop.updateCrop', language, 'Update Crop') : t('myCrop.addMyCrop', language, 'Add Crop')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ─── 2. Loading State ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="crop-page min-h-screen bg-background">
        {renderHeader()}
        <main className="dashboard-main mx-auto max-w-4xl py-20 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 animate-spin">
            <Loader2 className="size-6" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">{t('common.loading', language, 'Loading your crop records...')}</p>
        </main>
      </div>
    );
  }

  // ─── 3. Empty State (No Crops Found) ────────────────────────────────────────
  if (!crop || crops.length === 0) {
    return (
      <div className="crop-page min-h-screen bg-background">
        {renderHeader(
          <button
            type="button"
            onClick={handleStartAdd}
            className="primary-button text-xs py-2 px-3.5"
          >
            <PlusCircle className="size-4" /> {t('myCrop.addMyCrop', language, 'Add Crop')}
          </button>
        )}

        <main className="dashboard-main mx-auto max-w-4xl py-14 text-center">
          <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sprout className="size-9" />
            </div>
            <h2 className="mt-5 font-serif text-2xl font-bold">{t('myCrop.noCropsTitle', language, 'No Crops Registered Yet')}</h2>
            <p className="mx-auto mt-2.5 max-w-md text-sm text-muted-foreground leading-relaxed">
              {t('myCrop.emptyState', language, "You haven't added any crops yet. Start tracking your crop lifecycle, water schedule, harvest dates, and yield estimates.")}
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleStartAdd}
                className="primary-button text-sm px-6 py-2.5 shadow-md hover:shadow-lg transition"
              >
                <PlusCircle className="size-4" /> {t('myCrop.addCropTitle', language, 'Add Your First Crop')}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── 4. Main View (Active Crop Dashboard + Stage-wise Guidance) ─────────────
  return (
    <div className="crop-page min-h-screen bg-background">
      {renderHeader(
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartAdd}
            className="primary-button text-xs py-1.5 px-3"
          >
            <PlusCircle className="size-4" /> {t('myCrop.addMyCrop', language, 'Add Crop')}
          </button>
          {/* Edit Button with Pencil Icon */}
          <button
            type="button"
            onClick={() => handleStartEdit(crop)}
            className="secondary-button text-xs py-1.5 px-3 flex items-center gap-1.5"
            title={t('myCrop.editDetails', language, 'Edit Crop')}
          >
            <Pencil className="size-3.5" /> {t('myCrop.editDetails', language, 'Edit')}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(crop.id)}
            className="secondary-button text-destructive hover:bg-destructive/10"
            title="Delete this crop"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}

      <main className="dashboard-main mx-auto max-w-6xl py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <ArrowLeft className="size-4" /> {t('nav.backToDashboard', language, 'Back to Dashboard')}
          </button>

          {/* Multi-Crop Switcher */}
          {crops.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">{t('myCrop.switchCrop', language, 'Your Crops:')}</span>
              {crops.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCropId(c.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    c.id === crop.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {c.crop_name || c.name} {c.variety ? `(${c.variety})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hero Section */}
        <section className="crop-hero rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="crop-hero-icon flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sprout className="size-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow">{t('myCrop.farmRecords', language, 'Active Farm Records')}</p>
              <button
                type="button"
                onClick={() => handleStartEdit(crop)}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <Pencil className="size-3" /> {t('myCrop.editDetails', language, 'Edit')}
              </button>
            </div>
            <h1 className="mt-1 font-serif text-3xl font-bold">{crop.crop_name || crop.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('myCrop.variety', language, 'Variety')}: <strong>{crop.variety || t('myCrop.notSpecified', language, 'Standard')}</strong>
            </p>
            <div className="crop-meta mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" /> {crop.area_acres || crop.area} {t('common.acres', language, 'acres')}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-primary" /> {t('myCrop.sowingDate', language, 'Sown')}: {new Date(crop.sowing_date || crop.plantedDate || '').toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Wheat className="size-4 text-primary" /> {t('myCrop.expectedHarvest', language, 'Harvest')}: {expectedHarvest}
              </span>
            </div>
          </div>
        </section>

        {/* Metric Cards */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="metric-card rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="metric-icon flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('myCrop.daysGrowing', language, 'Days Growing')}</p>
              <p className="mt-1 text-2xl font-bold">{daysGrowing}</p>
              <p className="text-[11px] text-muted-foreground">{t('myCrop.sincePlanting', language, 'days since sowing')}</p>
            </div>
          </div>

          <div className="metric-card rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="metric-icon blue flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Droplets className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('myCrop.waterPlan', language, 'Irrigation Status')}</p>
              <p className="mt-1 text-2xl font-bold">2–3×</p>
              <p className="text-[11px] text-muted-foreground">{t('myCrop.perWeek', language, 'times per week')}</p>
            </div>
          </div>

          <div className="metric-card rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="metric-icon gold flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Sun className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('myCrop.nextMilestone', language, 'Expected Harvest')}</p>
              <p className="mt-1 text-base font-bold truncate">{expectedHarvest}</p>
              <p className="text-[11px] text-muted-foreground">{t('myCrop.keepMonitoring', language, 'optimal harvest window')}</p>
            </div>
          </div>
        </div>

        {/* ─── STAGE-WISE GUIDANCE SECTION (Intelligent Dynamic Timeline) ─────── */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('myCrop.stageWiseGuidance', language, 'Stage-wise Crop Guidance')}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t('myCrop.guidanceSubtitle', language, 'AI Assistant roadmap tracking optimal farm actions from sowing to harvest.')}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <Clock className="size-3.5" /> Day {daysGrowing} · {crop.crop_name || crop.name}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {guidanceSteps.map((step) => {
              const isDone = daysGrowing > step.maxDay;
              const isActive = daysGrowing >= step.minDay && daysGrowing <= step.maxDay;
              const isUpcoming = daysGrowing < step.minDay;

              return (
                <div
                  key={step.step}
                  className={`rounded-2xl border p-4 transition-all duration-200 ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20 shadow-sm'
                      : isDone
                      ? 'border-border bg-secondary/30'
                      : 'border-border/60 bg-card/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                          <CheckCircle2 className="size-4" />
                        </div>
                      ) : isActive ? (
                        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-700 text-white ring-4 ring-emerald-100 animate-pulse">
                          <Sparkles className="size-4" />
                        </div>
                      ) : (
                        <div className="flex size-7 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-background text-muted-foreground text-xs font-bold">
                          {step.step}
                        </div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                          {t(step.titleKey, language, step.defaultTitle)}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                            {step.daysRange}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                              ● {t('myCrop.activeActionNeeded', language, 'Action Needed Now')}
                            </span>
                          )}
                          {isDone && (
                            <span className="text-[10px] font-semibold text-emerald-800">
                              ✓ {t('myCrop.completedStep', language, 'Completed')}
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {t('myCrop.upcomingStep', language, 'Upcoming')}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {t(step.descKey, language, step.defaultDesc)}
                      </p>

                      {/* Action Box */}
                      <div
                        className={`mt-2.5 rounded-xl p-3 text-xs leading-5 ${
                          isActive
                            ? 'bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-medium'
                            : 'bg-secondary/60 text-foreground/80'
                        }`}
                      >
                        <strong>{language === 'hi' ? 'सलाह: ' : language === 'mr' ? 'सल्ला: ' : 'Advisory: '}</strong>
                        {t(step.actionKey, language, step.defaultAction)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* General Management Advisory */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3 text-primary">
              <Leaf className="size-5" />
              <h3 className="font-bold text-sm text-foreground">
                {language === 'hi' ? 'कृषि मित्र सर्वोत्तम अभ्यास' : language === 'mr' ? 'कृषी मित्र सर्वोत्तम सराव' : 'Krishi Mitra Good Agricultural Practices'}
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>{language === 'hi' ? 'फसल की आवश्यकतानुसार ही सिंचाई करें, जलभराव से बचें।' : language === 'mr' ? 'पिकाच्या गरजेनुसारच पाणी द्या, पाणी साचू देऊ नका.' : 'Irrigate based on soil moisture check; prevent standing water around root zones.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>{language === 'hi' ? 'सप्ताह में दो बार कीट व फफूंद के लक्षणों के लिए खेत का निरीक्षण करें।' : language === 'mr' ? 'आठवड्यातून दोनदा कीड व रोगाच्या लक्षणांसाठी शेताची पाहणी करा.' : 'Scout field twice weekly for early signs of stem borers, fungal rust, or leaf curl.'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>{language === 'hi' ? 'कटाई से 14 दिन पूर्व कीटनाशक और रासायनिक छिड़काव पूर्णतः बंद करें।' : language === 'mr' ? 'काढणीपूर्वी १४ दिवस कीटकनाशक फवारणी पूर्णपणे थांबवा.' : 'Maintain Pre-Harvest Interval (PHI): stop chemical spraying 14 days before harvest.'}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-emerald-50/50 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <p className="eyebrow text-emerald-800">{t('myCrop.activeActionNeeded', language, 'Action Needed Now')}</p>
              <h4 className="mt-1 font-bold text-sm text-emerald-950">
                {language === 'hi' ? 'मौसम व मंडी सलाह' : language === 'mr' ? 'हवामान व बाजार सल्ला' : 'Weather & Mandi Sync'}
              </h4>
              <p className="mt-2 text-xs text-emerald-900 leading-relaxed">
                {language === 'hi'
                  ? 'अपनी फसल की गुणवत्ता जांचने और सर्वोत्तम मंडी भाव पाने के लिए "मार्केट और बोलियां" टैब देखें।'
                  : language === 'mr'
                  ? 'आपल्या पिकाची गुणवत्ता तपासण्यासाठी आणि सर्वोत्तम बाजार भाव मिळवण्यासाठी "मार्केट आणि बोली" टॅब तपासा.'
                  : 'Check current APMC Mandi rates and live buyer bids in the Market tab to plan profitable harvesting.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('Market & Bids')}
              className="mt-4 primary-button text-xs py-2 w-full justify-center"
            >
              {language === 'hi' ? 'मंडी भाव देखें' : language === 'mr' ? 'बाजार भाव पहा' : 'View Market Bids'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
