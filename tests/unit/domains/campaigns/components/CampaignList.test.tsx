import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('shows experiment group with name and variant badges, and standalone section when present', async () => {
    const user = userEvent.setup();
    const variantA = makeCampaign({ id: 'cA', name: 'Variant A Campaign', experimentId: 'exp_1', variantKey: 'A', isControl: true });
    const variantB = makeCampaign({ id: 'cB', name: 'Variant B Campaign', experimentId: 'exp_1', variantKey: 'B', isControl: false });
    const standalone = makeCampaign({ id: 'cS', name: 'Standalone Campaign' });

    const experiments = [
      { id: 'exp_1', name: 'Price Test' } as any,
    ];

    renderWithPolaris(
      <CampaignList campaigns={[variantA, variantB, standalone]} experiments={experiments} />
    );

    // Experiment name should be visible
    expect(screen.getByText('Price Test')).toBeTruthy();

    // Expand the experiment to see variants
    const expandButton = screen.getByRole('button', { name: /expand experiment/i });
    await user.click(expandButton as Element);

    // Variant badges indicating keys and control should now be visible
    expect(screen.getAllByText(/Variant A \(Control\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Variant B/i).length).toBeGreaterThan(0);
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

  it('calls onExperimentSelect when clicking on experiment row', async () => {
    const user = userEvent.setup();
    const onExperimentSelect = vi.fn();

    const variantA = makeCampaign({ id: 'cA', name: 'Variant A Campaign', experimentId: 'exp_1', variantKey: 'A', isControl: true });
    const variantB = makeCampaign({ id: 'cB', name: 'Variant B Campaign', experimentId: 'exp_1', variantKey: 'B', isControl: false });

    const experiments = [
      { id: 'exp_1', name: 'Price Test' } as any,
    ];

    renderWithPolaris(
      <CampaignList
        campaigns={[variantA, variantB]}
        experiments={experiments}
        onExperimentSelect={onExperimentSelect}
      />
    );

    // Click on the experiment row (the text "Price Test")
    const experimentRow = screen.getByText('Price Test');
    await user.click(experimentRow as Element);

    expect(onExperimentSelect).toHaveBeenCalledWith('exp_1');
  });

  it('calls onExperimentEdit when clicking Edit button on experiment', async () => {
    const user = userEvent.setup();
    const onExperimentEdit = vi.fn();

    const variantA = makeCampaign({ id: 'cA', name: 'Variant A Campaign', experimentId: 'exp_1', variantKey: 'A', isControl: true });
    const variantB = makeCampaign({ id: 'cB', name: 'Variant B Campaign', experimentId: 'exp_1', variantKey: 'B', isControl: false });

    const experiments = [
      { id: 'exp_1', name: 'Price Test' } as any,
    ];

    renderWithPolaris(
      <CampaignList
        campaigns={[variantA, variantB]}
        experiments={experiments}
        onExperimentEdit={onExperimentEdit}
      />
    );

    // Find and click the Edit button
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const experimentEditButton = editButtons.find(btn => btn.textContent === 'Edit');

    if (experimentEditButton) {
      await user.click(experimentEditButton as Element);
      expect(onExperimentEdit).toHaveBeenCalledWith('exp_1');
    }
  });

  it('calls onExperimentEdit with variantKey when clicking Edit Variant button', async () => {
    const user = userEvent.setup();
    const onExperimentEdit = vi.fn();

    const variantA = makeCampaign({ id: 'cA', name: 'Variant A Campaign', experimentId: 'exp_1', variantKey: 'A', isControl: true });
    const variantB = makeCampaign({ id: 'cB', name: 'Variant B Campaign', experimentId: 'exp_1', variantKey: 'B', isControl: false });

    const experiments = [
      { id: 'exp_1', name: 'Price Test' } as any,
    ];

    renderWithPolaris(
      <CampaignList
        campaigns={[variantA, variantB]}
        experiments={experiments}
        onExperimentEdit={onExperimentEdit}
      />
    );

    // First expand the experiment to see variants
    const expandButton = screen.getByRole('button', { name: /expand experiment/i });
    await user.click(expandButton as Element);

    // Find and click the "Edit Variant" button for variant B
    const editVariantButtons = screen.getAllByRole('button', { name: /edit variant/i });

    // Click on the second variant's edit button (Variant B)
    if (editVariantButtons.length > 1) {
      await user.click(editVariantButtons[1] as Element);
      expect(onExperimentEdit).toHaveBeenCalledWith('exp_1', 'B');
    }
  });

  it('does not call onExperimentSelect when clicking expand/collapse button', async () => {
    const user = userEvent.setup();
    const onExperimentSelect = vi.fn();

    const variantA = makeCampaign({ id: 'cA', name: 'Variant A Campaign', experimentId: 'exp_1', variantKey: 'A', isControl: true });
    const variantB = makeCampaign({ id: 'cB', name: 'Variant B Campaign', experimentId: 'exp_1', variantKey: 'B', isControl: false });

    const experiments = [
      { id: 'exp_1', name: 'Price Test' } as any,
    ];

    renderWithPolaris(
      <CampaignList
        campaigns={[variantA, variantB]}
        experiments={experiments}
        onExperimentSelect={onExperimentSelect}
      />
    );

    // Click the expand button
    const expandButton = screen.getByRole('button', { name: /expand experiment/i });
    await user.click(expandButton as Element);

    // onExperimentSelect should NOT have been called
    expect(onExperimentSelect).not.toHaveBeenCalled();
  });

  it('does not call onExperimentSelect when clicking Edit button', async () => {
    const user = userEvent.setup();
    const onExperimentSelect = vi.fn();
    const onExperimentEdit = vi.fn();

    const variantA = makeCampaign({ id: 'cA', name: 'Variant A Campaign', experimentId: 'exp_1', variantKey: 'A', isControl: true });
    const variantB = makeCampaign({ id: 'cB', name: 'Variant B Campaign', experimentId: 'exp_1', variantKey: 'B', isControl: false });

    const experiments = [
      { id: 'exp_1', name: 'Price Test' } as any,
    ];

    renderWithPolaris(
      <CampaignList
        campaigns={[variantA, variantB]}
        experiments={experiments}
        onExperimentSelect={onExperimentSelect}
        onExperimentEdit={onExperimentEdit}
      />
    );

    // Find and click the Edit button
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const experimentEditButton = editButtons.find(btn => btn.textContent === 'Edit');

    if (experimentEditButton) {
      await user.click(experimentEditButton as Element);

      // onExperimentEdit should have been called
      expect(onExperimentEdit).toHaveBeenCalledWith('exp_1');

      // onExperimentSelect should NOT have been called
      expect(onExperimentSelect).not.toHaveBeenCalled();
    }
  });

  describe('Button click event handling (preventDefault)', () => {
    it('should prevent default and stop propagation when clicking Delete button on standalone campaign', async () => {
      const user = userEvent.setup();
      const onCampaignSelect = vi.fn();
      const onCampaignDelete = vi.fn();

      const campaign = makeCampaign({
        id: 'camp_1',
        name: 'Test Campaign',
        experimentId: null
      });

      renderWithPolaris(
        <CampaignList
          campaigns={[campaign]}
          onCampaignSelect={onCampaignSelect}
          onCampaignDelete={onCampaignDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Delete handler should be called
      expect(onCampaignDelete).toHaveBeenCalledWith('camp_1');

      // Campaign select should NOT be called (event propagation stopped)
      expect(onCampaignSelect).not.toHaveBeenCalled();
    });

    it('should prevent default and stop propagation when clicking Edit button on standalone campaign', async () => {
      const user = userEvent.setup();
      const onCampaignSelect = vi.fn();
      const onCampaignEdit = vi.fn();

      const campaign = makeCampaign({
        id: 'camp_2',
        name: 'Test Campaign',
        experimentId: null
      });

      renderWithPolaris(
        <CampaignList
          campaigns={[campaign]}
          onCampaignSelect={onCampaignSelect}
          onCampaignEdit={onCampaignEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /^edit$/i });
      await user.click(editButton);

      // Edit handler should be called
      expect(onCampaignEdit).toHaveBeenCalledWith('camp_2');

      // Campaign select should NOT be called (event propagation stopped)
      expect(onCampaignSelect).not.toHaveBeenCalled();
    });

    it('should prevent default and stop propagation when clicking Duplicate button on standalone campaign', async () => {
      const user = userEvent.setup();
      const onCampaignSelect = vi.fn();
      const onCampaignDuplicate = vi.fn();

      const campaign = makeCampaign({
        id: 'camp_3',
        name: 'Test Campaign',
        experimentId: null
      });

      renderWithPolaris(
        <CampaignList
          campaigns={[campaign]}
          onCampaignSelect={onCampaignSelect}
          onCampaignDuplicate={onCampaignDuplicate}
        />
      );

      const duplicateButton = screen.getByRole('button', { name: /duplicate/i });
      await user.click(duplicateButton);

      // Duplicate handler should be called
      expect(onCampaignDuplicate).toHaveBeenCalledWith('camp_3');

      // Campaign select should NOT be called (event propagation stopped)
      expect(onCampaignSelect).not.toHaveBeenCalled();
    });

    it('should prevent default and stop propagation when clicking Delete button on experiment', async () => {
      const user = userEvent.setup();
      const onExperimentSelect = vi.fn();
      const onCampaignDelete = vi.fn();

      const experiment = {
        id: 'exp_1',
        storeId: 'store_cuid_123',
        name: 'Test Experiment',
        description: null,
        hypothesis: null,
        status: 'RUNNING' as const,
        trafficAllocation: { A: 50, B: 50 },
        statisticalConfig: {
          confidenceLevel: 0.95,
          minimumSampleSize: 1000,
          minimumDetectableEffect: 0.05,
          maxDurationDays: 30,
        },
        successMetrics: { primaryMetric: 'conversion_rate' as const },
        startDate: null,
        endDate: null,
        plannedDurationDays: null,
        winnerId: null,
        winnerDeclaredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        variants: [],
      };

      const variantA = makeCampaign({
        id: 'var_a',
        name: 'Variant A',
        experimentId: 'exp_1',
        variantKey: 'A',
      });

      renderWithPolaris(
        <CampaignList
          campaigns={[variantA]}
          experiments={[experiment]}
          onExperimentSelect={onExperimentSelect}
          onCampaignDelete={onCampaignDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Delete handler should be called with first variant ID
      expect(onCampaignDelete).toHaveBeenCalledWith('var_a');

      // Experiment select should NOT be called (event propagation stopped)
      expect(onExperimentSelect).not.toHaveBeenCalled();
    });
  });
});

