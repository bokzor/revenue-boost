import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AppProvider } from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import { CampaignList } from '../../../../../app/domains/campaigns/components/CampaignList';

// Minimal helpers to build campaign/experiment data used by the list
function makeCampaign(overrides: Partial<any>): any {
  const now = new Date();
  return {
    id: 'c_' + Math.random().toString(36).slice(2),
    storeId: 'store_cuid_123',
    name: 'Sample Campaign',
    description: 'desc',
    goal: 'INCREASE_REVENUE',
    status: 'ACTIVE',
    priority: 0,
    templateId: null,
    templateType: 'NEWSLETTER',
    experimentId: null,
    variantKey: null,
    isControl: false,
    startDate: null,
    endDate: null,
    createdAt: now,
    updatedAt: now,
    // JSON config placeholders not used by the list UI
    contentConfig: {},
    designConfig: {
      theme: 'professional-blue',
      position: 'center',
      size: 'medium',
      borderRadius: 8,
      animation: 'fade',
      overlayOpacity: 0.5,
    },
    targetRules: {},
    discountConfig: {},
    ...overrides,
  };
}

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe('CampaignList (grouped by experiment)', () => {
  it('shows experiment group with name and variant badges, and standalone section when present', () => {
    const variantA = makeCampaign({ id: 'cA', name: 'Variant A Campaign', experimentId: 'exp_1', variantKey: 'A', isControl: true });
    const variantB = makeCampaign({ id: 'cB', name: 'Variant B Campaign', experimentId: 'exp_1', variantKey: 'B', isControl: false });
    const standalone = makeCampaign({ id: 'cS', name: 'Standalone Campaign' });

    const experiments = [
      { id: 'exp_1', name: 'Price Test' } as any,
    ];

    renderWithPolaris(
      <CampaignList campaigns={[variantA, variantB, standalone]} experiments={experiments} />
    );

    // Experiment section header and name
    expect(screen.getByText('Experiments')).toBeTruthy();
    expect(screen.getByText('Price Test')).toBeTruthy();

    // Variant badges indicating keys and control
    expect(screen.getAllByText(/Variant A \(Control\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Variant B/i).length).toBeGreaterThan(0);

    // Standalone section label present when both exist
    expect(screen.getByText('Standalone campaigns')).toBeTruthy();
  });

  it('shows count as number of top-level rows (experiment groups + standalone)', () => {
    const variantA = makeCampaign({ id: 'cA', name: 'Variant A Campaign', experimentId: 'exp_1', variantKey: 'A', isControl: true });
    const variantB = makeCampaign({ id: 'cB', name: 'Variant B Campaign', experimentId: 'exp_1', variantKey: 'B', isControl: false });
    const standalone = makeCampaign({ id: 'cS', name: 'Standalone Campaign' });

    const experiments = [
      { id: 'exp_1', name: 'Price Test' } as any,
    ];

    renderWithPolaris(
      <CampaignList campaigns={[variantA, variantB, standalone]} experiments={experiments} />
    );

    // One experiment group + one standalone campaign = 2 items
    expect(screen.getByText(/2 items/i)).toBeTruthy();
  });
});

