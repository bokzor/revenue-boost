import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('~/shopify.server', () => ({
  authenticate: { admin: vi.fn().mockResolvedValue({ session: { shop: 'test.myshopify.com' } }) },
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

import { getStoreId as getStoreIdMock } from '~/lib/auth-helpers.server';
import { CampaignService } from '~/domains/campaigns';
import { loader } from '~/routes/app.campaigns.$campaignId.edit';

describe('app.campaigns.$campaignId.edit loader', () => {
  beforeEach(() => {
    (getStoreIdMock as any).mockClear?.();
    (CampaignService.getCampaignById as any).mockClear?.();
  });

  it('uses getStoreId and passes it to CampaignService.getCampaignById', async () => {
    const request = new Request('http://localhost/app/campaigns/c1/edit');
    const params = { campaignId: 'c1' } as any;
    const res = await loader({ request, params } as any);

    expect(getStoreIdMock).toHaveBeenCalled();
    expect(CampaignService.getCampaignById).toHaveBeenCalledWith('c1', 'store-abc');
    expect(res).toBeTruthy();
  });
});

