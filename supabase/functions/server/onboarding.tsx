import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { audit } from "./audit.tsx";

export const onboardingRoutes = {
  getStatus: async (c: Context) => {
    const userId = c.get('userId');
    const onboarding = await kv.get(`onboarding:${userId}`);
    return c.json({ onboarding: onboarding || { status: 'not_started' } });
  },

  saveStep: async (c: Context) => {
    const userId = c.get('userId');
    const { step, data } = await c.req.json();

    if (!step || typeof step !== 'string') {
      return c.json({ error: 'Step is required' }, 400);
    }

    const existing = await kv.get(`onboarding:${userId}`);
    const onboarding =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? existing
        : { status: 'in_progress', createdAt: new Date().toISOString() };

    if (!onboarding.steps || typeof onboarding.steps !== 'object') {
      onboarding.steps = {};
    }

    if (onboarding.status === 'not_started') {
      onboarding.status = 'in_progress';
    }

    const stepData = data && typeof data === 'object' ? data : {};
    onboarding.steps[step] = { ...stepData, completedAt: new Date().toISOString() };
    onboarding.currentStep = step;
    onboarding.updatedAt = new Date().toISOString();

    if (step === 'provider_type') {
      const profile = await kv.get(`user:${userId}`);
      if (profile && stepData.type && typeof stepData.type === 'string') {
        profile.providerType = stepData.type;
        profile.updatedAt = new Date().toISOString();
        await kv.set(`user:${userId}`, profile);
      }
    }

    await kv.set(`onboarding:${userId}`, onboarding);
    return c.json({ onboarding, message: `Step ${step} saved` });
  },

  submit: async (c: Context) => {
    const userId = c.get('userId');
    const onboarding = await kv.get(`onboarding:${userId}`);
    if (!onboarding) {
      return c.json({ error: 'No onboarding data found' }, 404);
    }

    const qualificationPath = onboarding.steps?.qualification_path?.path;
    if (qualificationPath === 'experience_only') {
      onboarding.status = 'approved';
      onboarding.tier = 'basic';
      onboarding.approvedAt = new Date().toISOString();
      const profile = await kv.get(`user:${userId}`);
      if (profile) {
        profile.onboardingStatus = 'approved';
        profile.providerTier = 'basic';
        profile.providerType = onboarding.steps?.provider_type?.type || 'independent';
        await kv.set(`user:${userId}`, profile);
      }
    } else {
      onboarding.status = 'pending_review';
      const reviewQueue = (await kv.get('admin:onboarding_queue')) || [];
      reviewQueue.unshift({ userId, submittedAt: new Date().toISOString() });
      await kv.set('admin:onboarding_queue', reviewQueue);
    }

    onboarding.submittedAt = new Date().toISOString();
    await kv.set(`onboarding:${userId}`, onboarding);
    await audit.log({
      action: 'onboarding.submitted',
      userId,
      targetId: userId,
      details: { qualificationPath },
    });
    return c.json({ onboarding, message: 'Onboarding submitted' });
  },

  adminReview: async (c: Context) => {
    const adminId = c.get('userId');
    const { providerId, decision, reason } = await c.req.json();
    const onboarding = await kv.get(`onboarding:${providerId}`);

    if (!onboarding) {
      return c.json({ error: 'Not found' }, 404);
    }

    onboarding.status = decision;
    onboarding.reviewedAt = new Date().toISOString();
    onboarding.reviewReason = reason || '';

    if (decision === 'approved') {
      onboarding.tier = 'verified';
      const profile = await kv.get(`user:${providerId}`);
      if (profile) {
        profile.onboardingStatus = 'approved';
        profile.providerTier = 'verified';
        profile.providerType = onboarding.steps?.provider_type?.type || 'independent';
        await kv.set(`user:${providerId}`, profile);
      }
    }

    await kv.set(`onboarding:${providerId}`, onboarding);
    const queue = (await kv.get('admin:onboarding_queue')) || [];
    await kv.set(
      'admin:onboarding_queue',
      queue.filter((item: { userId: string }) => item.userId !== providerId),
    );
    await audit.log({
      action: 'onboarding.reviewed',
      userId: adminId,
      targetId: providerId,
      details: { decision, reason: reason || '' },
    });
    return c.json({ onboarding, message: `Provider ${decision}` });
  },

  getQueue: async (c: Context) => {
    const queue = ((await kv.get('admin:onboarding_queue')) || []) as Array<
      { userId?: string; submittedAt?: string } | string
    >;
    const applications = [];

    for (const item of queue) {
      const userId = typeof item === 'string' ? item : item.userId;
      if (!userId) {
        continue;
      }
      const onboarding = await kv.get(`onboarding:${userId}`);
      const profile = await kv.get(`user:${userId}`);
      if (!onboarding) {
        continue;
      }
      applications.push({
        userId,
        submittedAt: typeof item === 'string' ? onboarding.submittedAt || null : item.submittedAt || onboarding.submittedAt || null,
        onboarding,
        profile,
      });
    }

    applications.sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
    return c.json({ applications });
  },
};
