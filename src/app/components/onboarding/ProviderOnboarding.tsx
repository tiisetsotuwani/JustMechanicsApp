import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../../../utils/api';
import type { OnboardingApplication } from '../../../shared/types';

interface ProviderOnboardingProps {
  onBack: () => void;
  onComplete: () => void;
}

const STEPS = [
  { key: 'provider_type', title: 'Provider Type' },
  { key: 'qualification_path', title: 'Qualification Path' },
  { key: 'professional_info', title: 'Professional Info' },
  { key: 'services_pricing', title: 'Services & Pricing' },
  { key: 'location_availability', title: 'Location & Availability' },
  { key: 'review_submit', title: 'Review & Submit' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export function ProviderOnboarding({ onBack, onComplete }: ProviderOnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<StepKey, Record<string, unknown>>>({
    provider_type: { type: 'independent' },
    qualification_path: { path: 'experience_only' },
    professional_info: { yearsExperience: 1 },
    services_pricing: { services: [], hourlyRate: 0 },
    location_availability: { serviceRadius: 10 },
    review_submit: {},
  });
  const [savedAt, setSavedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'loading' | 'wizard' | 'pending_review' | 'approved'>('loading');
  const [statusMessage, setStatusMessage] = useState('');

  const currentStep = STEPS[stepIndex];
  const progress = useMemo(() => ((stepIndex + 1) / STEPS.length) * 100, [stepIndex]);
  const isFinalStep = currentStep.key === 'review_submit';
  const isFirstStep = stepIndex === 0;

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await api.onboarding.getStatus();
        const onboarding = (response.onboarding || {}) as OnboardingApplication;
        const onboardingStatus = onboarding.status;
        if (onboardingStatus === 'approved') {
          setStatus('approved');
          onComplete();
          return;
        }
        if (onboardingStatus === 'pending_review') {
          setStatus('pending_review');
          setStatusMessage('Your provider profile is under review. We will unlock your dashboard once approved.');
          return;
        }
        if (onboarding.steps) {
          setFormData((previous) => {
            const next = { ...previous };
            (Object.keys(onboarding.steps || {}) as Array<keyof typeof onboarding.steps>).forEach((step) => {
              const key = step as StepKey;
              if (key in next) {
                next[key] = { ...next[key], ...(onboarding.steps?.[step] || {}) };
              }
            });
            return next;
          });
        }
        const currentStepKey = onboarding.currentStep as StepKey | undefined;
        if (currentStepKey) {
          const index = STEPS.findIndex((step) => step.key === currentStepKey);
          if (index >= 0) {
            setStepIndex(index);
          }
        }
        setStatus('wizard');
      } catch {
        setStatus('wizard');
      }
    };

    void loadStatus();
  }, [onComplete]);

  const updateStep = (data: Record<string, unknown>) => {
    setFormData((previous) => ({
      ...previous,
      [currentStep.key]: {
        ...previous[currentStep.key],
        ...data,
      },
    }));
    if (error) {
      setError('');
    }
  };

  const isStepValid = (stepKey: StepKey) => {
    const stepData = formData[stepKey] || {};
    if (stepKey === 'provider_type') {
      return Boolean(stepData.type);
    }
    if (stepKey === 'qualification_path') {
      return Boolean(stepData.path);
    }
    if (stepKey === 'professional_info') {
      return Number(stepData.yearsExperience || 0) >= 0;
    }
    if (stepKey === 'services_pricing') {
      const hourlyRate = Number(stepData.hourlyRate || 0);
      return hourlyRate >= 0;
    }
    if (stepKey === 'location_availability') {
      return Number(stepData.serviceRadius || 0) > 0;
    }
    return true;
  };

  const saveCurrentStep = async () => {
    await api.onboarding.saveStep(currentStep.key, formData[currentStep.key] || {});
    setSavedAt(new Date().toLocaleTimeString());
  };

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      await saveCurrentStep();
      setError('');
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!isStepValid(currentStep.key)) {
      setError('Please complete this step before continuing.');
      return;
    }

    try {
      setSubmitting(true);
      await saveCurrentStep();
      setStepIndex((value) => Math.min(value + 1, STEPS.length - 1));
      setError('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to save onboarding step');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await saveCurrentStep();
      const response = await api.onboarding.submit();
      const onboardingStatus = response.onboarding?.status as string | undefined;
      if (onboardingStatus === 'approved') {
        setStatus('approved');
        onComplete();
        return;
      }
      setStatus('pending_review');
      setStatusMessage('Application submitted. Your profile is now pending admin review.');
      setError('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitle = STEPS[stepIndex].title;

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      {status === 'loading' && (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-600">Loading onboarding...</div>
        </div>
      )}

      {status === 'pending_review' && (
        <div className="min-h-screen bg-stone-100 pb-20">
          <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
            <button onClick={onBack} className="flex items-center gap-2 mb-6">
              <ArrowLeft className="w-6 h-6" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold">Onboarding Submitted</h1>
          </div>
          <div className="px-6 py-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle2 className="w-6 h-6" />
                <h2 className="text-xl font-semibold text-gray-900">Waiting for Approval</h2>
              </div>
              <p className="text-gray-700">{statusMessage}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-700 text-white rounded-xl py-3 font-semibold hover:bg-red-800 transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'wizard' && (
        <>
      <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold">Provider Onboarding</h1>
        <p className="text-red-100 mt-2">Step {stepIndex + 1} of {STEPS.length}: {stepTitle}</p>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
          {STEPS.map((step, index) => (
            <div
              key={step.key}
              className={`rounded-lg px-2 py-1 text-center ${
                index === stepIndex
                  ? 'bg-white text-red-700 font-semibold'
                  : index < stepIndex
                    ? 'bg-white/30 text-white'
                    : 'bg-white/15 text-red-100'
              }`}
            >
              {index + 1}. {step.title}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          {currentStep.key === 'provider_type' && (
            <select
              value={String(formData.provider_type?.type || 'independent')}
              onChange={(event) => updateStep({ type: event.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3"
            >
              <option value="independent">Independent mechanic</option>
              <option value="shop_owner">Shop owner</option>
              <option value="shop_employee">Shop employee</option>
            </select>
          )}

          {currentStep.key === 'qualification_path' && (
            <select
              value={String(formData.qualification_path?.path || 'experience_only')}
              onChange={(event) => updateStep({ path: event.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3"
            >
              <option value="experience_only">Experience only</option>
              <option value="certified">Certified mechanic</option>
            </select>
          )}

          {currentStep.key === 'professional_info' && (
            <>
              <input
                type="number"
                min="0"
                value={Number(formData.professional_info?.yearsExperience || 1)}
                onChange={(event) => updateStep({ yearsExperience: Number(event.target.value) })}
                placeholder="Years of experience"
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
              <textarea
                value={String(formData.professional_info?.bio || '')}
                onChange={(event) => updateStep({ bio: event.target.value })}
                placeholder="Describe your experience"
                rows={5}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none"
              />
            </>
          )}

          {currentStep.key === 'services_pricing' && (
            <>
              <input
                type="text"
                value={String(formData.services_pricing?.services || '')}
                onChange={(event) =>
                  updateStep({
                    services: event.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Comma separated services"
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
              <input
                type="number"
                min="0"
                value={Number(formData.services_pricing?.hourlyRate || 0)}
                onChange={(event) => updateStep({ hourlyRate: Number(event.target.value) })}
                placeholder="Hourly rate"
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
            </>
          )}

          {currentStep.key === 'location_availability' && (
            <>
              <input
                type="text"
                value={String(formData.location_availability?.homeBase || '')}
                onChange={(event) => updateStep({ homeBase: event.target.value })}
                placeholder="Home base address"
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
              <input
                type="number"
                min="1"
                value={Number(formData.location_availability?.serviceRadius || 10)}
                onChange={(event) => updateStep({ serviceRadius: Number(event.target.value) })}
                placeholder="Service radius (km)"
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
            </>
          )}

          {currentStep.key === 'review_submit' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle2 className="w-6 h-6" />
                <h2 className="text-xl font-semibold text-gray-900">Review and submit</h2>
              </div>
              <pre className="bg-stone-100 rounded-2xl p-4 text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {savedAt && <p className="text-xs text-gray-500">Saved at {savedAt}</p>}

          <div className="grid grid-cols-2 gap-3" data-testid="onboarding-nav-actions">
            <button
              onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}
              disabled={isFirstStep || submitting}
              className="border border-gray-300 rounded-xl py-3 font-semibold text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => void (isFinalStep ? handleSubmit() : handleNext())}
              disabled={submitting}
              className="bg-red-700 text-white rounded-xl py-3 font-semibold hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isFinalStep ? 'Submit' : 'Next'}
            </button>
          </div>
          <button
            onClick={() => void handleSaveDraft()}
            disabled={submitting}
            className="w-full mt-2 border border-red-200 text-red-700 rounded-xl py-3 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
