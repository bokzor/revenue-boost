import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// Mock shopify.server early to avoid env checks on import
vi.mock('~/shopify.server', () => ({
  authenticate: { admin: vi.fn().mockResolvedValue({ session: { shop: 'test.myshopify.com' } }) },
}));

// Mocks for react-router hooks used by the route component
const mockNavigate = vi.fn();

// Mock Polaris primitives to avoid AppProvider requirement
vi.mock('@shopify/polaris', () => ({
  Frame: (props: any) => React.createElement('div', null, props.children),
  Toast: (props: any) => React.createElement('div', null, props.content),
}));

const mockUseLoaderData = vi.fn(() => ({
  campaign: { id: 'c1', name: 'Original', status: 'ACTIVE' },
  storeId: 'store-1',
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<any>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLoaderData: () => mockUseLoaderData(),
    useRevalidator: () => ({ state: 'idle', revalidate: vi.fn() }),
  };
});

// Mock CampaignDetail to capture onDuplicate handler
let __capturedOnDuplicate: any = null;
let __invocations = 0;
vi.mock('~/domains/campaigns/components', () => ({
  CampaignDetail: (props: any) => {
    __invocations += 1;
    __capturedOnDuplicate = props.onDuplicate;
    return React.createElement('div', { 'data-testid': 'mock-detail' });
  },
}));

// Import the component under test AFTER mocks
import CampaignDetailPage from '~/routes/app.campaigns.$campaignId';

describe('CampaignDetailPage - duplicate from detail page', () => {
  const origFetch = global.fetch as any;

  beforeEach(() => {
    mockNavigate.mockReset();
    __capturedOnDuplicate = null;
    __invocations = 0;
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  it('POSTs duplicate using current campaign and navigates to new ID parsed from { data: { campaign } }', async () => {
    const fetchMock = vi.fn()
      // POST /api/campaigns
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { campaign: { id: 'c2' } } }) });
    global.fetch = fetchMock as any;

    render(<CampaignDetailPage />);

    await waitFor(() => expect(__invocations).toBeGreaterThan(0));
    expect(typeof __capturedOnDuplicate).toBe('function');

    await __capturedOnDuplicate();

    await waitFor(() => {
      const firstCall = (fetchMock as any).mock.calls[0];
      expect(firstCall[0]).toBe('/api/campaigns');
      const init = firstCall[1];
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/json');
      const body = JSON.parse(init.body);
      expect(body.name).toBe('Original (Copy)');
      expect(body.status).toBe('DRAFT');
      expect(mockNavigate).toHaveBeenCalledWith('/app/campaigns/c2');
    });
  });
});

