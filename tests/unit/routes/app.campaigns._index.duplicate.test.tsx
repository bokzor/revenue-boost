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
  Page: (props: any) => React.createElement('div', null, props.children),
  Frame: (props: any) => React.createElement('div', null, props.children),
  Toast: (props: any) => React.createElement('div', null, props.content),
}));

const mockUseLoaderData = vi.fn(() => ({
  campaigns: [
    { id: 'c1', name: 'Original', status: 'ACTIVE' },
  ],
  experiments: [],
  storeId: 'store-1',
}));
const mockRevalidate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<any>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLoaderData: () => mockUseLoaderData(),
    useRevalidator: () => ({ revalidate: mockRevalidate, state: 'idle' }),
  };
});

// Mock CampaignList to capture onCampaignDuplicate handler
let __capturedOnDuplicate: any = null;
let __invocations = 0;
vi.mock('~/domains/campaigns/components', () => ({
  CampaignList: (props: any) => {
    __invocations += 1;
    __capturedOnDuplicate = props.onCampaignDuplicate;
    return React.createElement('div', { 'data-testid': 'mock-list' });
  },
}));

// Import the component under test AFTER mocks
import CampaignsIndexPage from '~/routes/app.campaigns._index';

describe('CampaignsIndexPage - duplicate from list', () => {
  const origFetch = global.fetch as any;

  beforeEach(() => {
    mockNavigate.mockReset();
    mockRevalidate.mockReset();
    __capturedOnDuplicate = null;
    __invocations = 0;
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  it('fetches original via GET then POSTs duplicate using parsed { data: { campaign } } and revalidates', async () => {
    // First GET returns the source campaign nested in data.campaign
    // Then POST creates the duplicate
    const fetchMock = vi.fn()
      // GET /api/campaigns/c1
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { campaign: { id: 'c1', name: 'Original', status: 'ACTIVE' } } }),
      })
      // POST /api/campaigns
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { campaign: { id: 'c2' } } }) });
    global.fetch = fetchMock as any;

    render(<CampaignsIndexPage />);

    await waitFor(() => expect(__invocations).toBeGreaterThan(0));
    expect(typeof __capturedOnDuplicate).toBe('function');

    await __capturedOnDuplicate('c1');

    await waitFor(() => {
      // First call: GET original
      expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/campaigns/c1', { method: 'GET' });
      // Second call: POST duplicate
      const secondCall = (fetchMock as any).mock.calls[1];
      expect(secondCall[0]).toBe('/api/campaigns');
      const init = secondCall[1];
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/json');
      const body = JSON.parse(init.body);
      expect(body.name).toBe('Original (Copy)');
      expect(body.status).toBe('DRAFT');
      // Should revalidate list on success
      expect(mockRevalidate).toHaveBeenCalled();
    });
  });
});

