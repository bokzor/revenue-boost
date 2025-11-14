import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { apiClient } from '~/lib/api-client';

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
  Banner: (props: any) => React.createElement('div', null, props.children),
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
    // Stub apiClient calls instead of real network requests
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      success: true,
      data: {
        campaign: { id: 'c1', name: 'Original', status: 'ACTIVE' },
      },
    } as any);

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      success: true,
      data: { campaign: { id: 'c2' } },
    } as any);

    render(<CampaignsIndexPage />);

    await waitFor(() => expect(__invocations).toBeGreaterThan(0));
    expect(typeof __capturedOnDuplicate).toBe('function');

    await __capturedOnDuplicate('c1');

    await waitFor(() => {
      // First call: GET original via ApiClient
      expect(getSpy).toHaveBeenCalledWith('/api/campaigns/c1');

      // Second call: POST duplicate via ApiClient
      expect(postSpy).toHaveBeenCalled();
      const [postUrl, postBody] = postSpy.mock.calls[0];
      expect(postUrl).toBe('/api/campaigns');
      expect(postBody.name).toBe('Original (Copy)');
      expect(postBody.status).toBe('DRAFT');

      // Should revalidate list on success
      expect(mockRevalidate).toHaveBeenCalled();
    });
  });
});

