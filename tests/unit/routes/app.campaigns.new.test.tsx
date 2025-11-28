import React from 'react';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';

// Mock Polaris Modal/Text/Frame to avoid AppProvider requirement in tests
vi.mock('@shopify/polaris', () => ({
  Modal: (props: any) => {
    // Auto-trigger "Not now" (secondary action) when modal opens to allow navigation
    if (props.open && props.secondaryActions?.[0]?.onAction) {
      setTimeout(() => props.secondaryActions[0].onAction(), 0);
    }
    return React.createElement('div', null, props.children);
  },
  Text: (props: any) => React.createElement('span', null, props.children),
  Frame: (props: any) => React.createElement('div', null, props.children),
}));

// Mock shopify.server to avoid environment check at import time
vi.mock('~/shopify.server', () => ({
  authenticate: { admin: vi.fn().mockResolvedValue({ session: { shop: 'test.myshopify.com' } }) },
}));

// Mocks for react-router hooks used by the route component
const mockNavigate = vi.fn();
const mockUseLoaderData = vi.fn(() => ({ storeId: 'store-1', shopDomain: 'test.myshopify.com' }));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<any>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLoaderData: () => mockUseLoaderData(),
  };
});

// Mock the form component to immediately invoke onSave with provided test data
let __payloadMode: 'single' | 'ab' = 'single';
let __mockInvocations = 0;
let __capturedOnSave: any = null;

vi.mock('~/domains/campaigns/components/CampaignFormWithABTesting', () => ({
  __setPayloadMode: (mode: 'single' | 'ab') => { __payloadMode = mode; },
  __getInvocations: () => __mockInvocations,
  __getOnSave: () => __capturedOnSave,
  CampaignFormWithABTesting: (props: any) => {
    __mockInvocations += 1;
    __capturedOnSave = props.onSave;
    return React.createElement('div', { 'data-testid': 'mock-form' });
  },
}));

// Import the route component under test AFTER mocks
import NewCampaign from '~/routes/app.campaigns.new';

describe('NewCampaign route - creation redirects', () => {
  const origFetch = global.fetch as any;

  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseLoaderData.mockReturnValue({ storeId: 'store-1', shopDomain: 'test.myshopify.com' });
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  it('navigates to /app/campaigns/:id when API responds with { data: { campaign } }', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { campaign: { id: 'c_123' } } }),
    });

    const mod = await vi.importMock<any>('~/domains/campaigns/components/CampaignFormWithABTesting');

    render(<NewCampaign />);

    // Ensure the mocked form rendered and onSave captured
    await waitFor(() => expect(mod.__getInvocations()).toBeGreaterThan(0));
    const onSave = mod.__getOnSave();
    expect(typeof onSave).toBe('function');

    // Trigger route's handleSave via the captured onSave
    await onSave({
      name: 'Test Campaign',
      description: 'Desc',
      goal: 'INCREASE_REVENUE',
      status: 'DRAFT',
      priority: 0,
      templateId: 'tpl_1',
      templateType: 'NEWSLETTER',
      contentConfig: {},
      designConfig: {},
      enhancedTriggers: {},
      audienceTargeting: {},
      frequencyCapping: {},
      discountConfig: {},
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/campaigns', expect.any(Object)));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/app/campaigns/c_123'));
  });

  it('navigates to /app/experiments/:id for A/B flow using { data: { experiment } } then multiple campaign posts', async () => {
    mockUseLoaderData.mockReturnValue({ storeId: 'store-1', shopDomain: 'test.myshopify.com' });

    // Switch mocked form to A/B payload mode
    const mod = await vi.importMock<any>('~/domains/campaigns/components/CampaignFormWithABTesting');
    mod.__setPayloadMode('ab');

    // First fetch is experiment creation, next two are campaign creations
    global.fetch = vi.fn()
      // POST /api/experiments
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { experiment: { id: 'exp_1' } } }) })
      // POST /api/campaigns (A)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { campaign: { id: 'c_A' } } }) })
      // POST /api/campaigns (B)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { campaign: { id: 'c_B' } } }) });

    render(<NewCampaign />);

    // Trigger AB onSave
    await waitFor(() => expect(typeof mod.__getOnSave()).toBe('function'));
    await mod.__getOnSave()([
      { name: 'Var A', templateType: 'NEWSLETTER', contentConfig: {}, designConfig: {}, enhancedTriggers: {}, audienceTargeting: {}, frequencyCapping: {}, discountConfig: {}, isControl: true },
      { name: 'Var B', templateType: 'NEWSLETTER', contentConfig: {}, designConfig: {}, enhancedTriggers: {}, audienceTargeting: {}, frequencyCapping: {}, discountConfig: {}, isControl: false },
    ]);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/app/experiments/exp_1'));

    // Sanity: at least one campaign post was made after experiment
    expect((global.fetch as any).mock.calls[0][0]).toBe('/api/experiments');
    expect((global.fetch as any).mock.calls[1][0]).toBe('/api/campaigns');
  });
});

