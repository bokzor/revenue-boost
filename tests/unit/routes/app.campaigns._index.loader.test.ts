import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('~/shopify.server', () => ({
  authenticate: {
    admin: vi.fn().mockResolvedValue({ session: { shop: 'test.myshopify.com' } }),
  },
}));

vi.mock('~/lib/auth-helpers.server', () => {
  const getStoreId = vi.fn().mockResolvedValue('store-abc');
  return { getStoreId };
});

vi.mock('~/domains/campaigns', () => {
  const getAllCampaigns = vi.fn().mockResolvedValue([{ id: 'c1' }]);
  const getAllExperiments = vi.fn().mockResolvedValue([]);
  return {
    CampaignService: { getAllCampaigns },
    ExperimentService: { getAllExperiments },
  };
});

import { getStoreId as getStoreIdMock } from '~/lib/auth-helpers.server';
import { CampaignService, ExperimentService } from '~/domains/campaigns';
import { loader } from '~/routes/app.campaigns._index';

describe('app.campaigns._index loader', () => {
  beforeEach(() => {
    (getStoreIdMock as any).mockClear?.();
    (CampaignService.getAllCampaigns as any).mockClear?.();
    (ExperimentService.getAllExperiments as any).mockClear?.();
  });

  it('uses getStoreId and passes it to CampaignService.getAllCampaigns', async () => {
    const request = new Request('http://localhost/app/campaigns');

    // Ensure a campaign with experimentId is returned to trigger experiment fetch
    (CampaignService.getAllCampaigns as any).mockResolvedValueOnce([
      { id: 'c1', experimentId: 'exp_1' },
    ]);

    const res = await loader({ request } as any);

    expect(getStoreIdMock).toHaveBeenCalled();
    expect(CampaignService.getAllCampaigns).toHaveBeenCalledWith('store-abc');
    expect(ExperimentService.getAllExperiments).toHaveBeenCalledWith('store-abc');
    expect(res).toBeTruthy();
  });
});

