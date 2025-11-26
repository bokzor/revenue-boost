import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('~/shopify.server', () => ({
  authenticate: {
    admin: vi.fn().mockResolvedValue({
      session: { shop: 'test.myshopify.com' },
      admin: {
        graphql: vi.fn().mockResolvedValue({
          json: () => Promise.resolve({ data: { shop: { currencyCode: 'USD' } } }),
        }),
      },
    }),
  },
  BILLING_PLANS: {
    STARTER: 'Starter',
    GROWTH: 'Growth',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
  },
}));

vi.mock('~/lib/auth-helpers.server', () => {
  const getStoreId = vi.fn().mockResolvedValue('store-abc');
  return { getStoreId };
});

vi.mock('~/domains/campaigns', () => {
  const getCampaignById = vi.fn().mockResolvedValue({ id: 'c1' });
  return {
    CampaignService: { getCampaignById },
  };
});

vi.mock('~/domains/campaigns/services/campaign-analytics.server', () => ({
  CampaignAnalyticsService: {
    getCampaignStats: vi.fn().mockResolvedValue(new Map()),
    getRevenueBreakdownByCampaignIds: vi.fn().mockResolvedValue(new Map()),
  },
}));

vi.mock('~/domains/analytics/popup-events.server', () => ({
  PopupEventService: {
    getFunnelStatsByCampaign: vi.fn().mockResolvedValue(new Map()),
    getClickCountsByCampaign: vi.fn().mockResolvedValue(new Map()),
  },
}));

import { getStoreId as getStoreIdMock } from '~/lib/auth-helpers.server';
import { CampaignService } from '~/domains/campaigns';
import { loader } from '~/routes/app.campaigns.$campaignId';

describe('app.campaigns.$campaignId loader', () => {
  beforeEach(() => {
    (getStoreIdMock as any).mockClear?.();
    (CampaignService.getCampaignById as any).mockClear?.();
  });

  it('uses getStoreId and passes it to CampaignService.getCampaignById', async () => {
    const request = new Request('http://localhost/app/campaigns/c1');
    const params = { campaignId: 'c1' } as any;
    const res = await loader({ request, params } as any);

    expect(getStoreIdMock).toHaveBeenCalled();
    expect(CampaignService.getCampaignById).toHaveBeenCalledWith('c1', 'store-abc');
    expect(res).toBeTruthy();
  });
});

