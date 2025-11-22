/**
 * Campaign Index Table Component
 *
 * A unified campaign list component with:
 * - Clean header design with status filter buttons
 * - Checkbox selection support
 * - Experiment grouping functionality
 * - IndexTable for consistent UI
 */

import { useState, useMemo } from 'react';
import {
  Card,
  IndexTable,
  Badge,
  Button,
  InlineStack,
  Box,
  Text,
  EmptyState,
  useIndexResourceState,
  Spinner,
  BlockStack,
  Modal,
  TextField,
  Banner,
  Icon,
  type IndexTableProps,
} from '@shopify/polaris';
import { ChevronDownIcon, ChevronRightIcon } from '@shopify/polaris-icons';
import type { CampaignWithConfigs, CampaignStatus } from '~/domains/campaigns/types/campaign';
import type { ExperimentWithVariants } from '~/domains/campaigns/types/experiment';

// ============================================================================
// TYPES
// ============================================================================

// Extended campaign type that includes optional analytics fields
// Flexible type to support both full CampaignWithConfigs and dashboard rows
type CampaignRow = {
  id: string;
  name: string;
  status: string;
  templateType: string;
  goal: string;
  views?: number;
  conversions?: number;
  revenue?: number;
  conversionRate?: number;
  experimentId?: string | null;
  variantKey?: string | null;
  isControl?: boolean;
  [key: string]: any; // Allow additional properties
};

interface CampaignIndexTableProps {
  campaigns: CampaignRow[];
  experiments?: ExperimentWithVariants[];
  onCampaignClick?: (campaignId: string) => void;
  onEditClick?: (campaignId: string) => void;
  onToggleStatus?: (campaignId: string, currentStatus: string) => void;
  onExperimentClick?: (experimentId: string) => void;
  onDeleteClick?: (campaignId: string) => void;
  onDuplicateClick?: (campaignId: string) => void;
  // Bulk actions
  onBulkActivate?: (campaignIds: string[]) => Promise<void>;
  onBulkPause?: (campaignIds: string[]) => Promise<void>;
  onBulkArchive?: (campaignIds: string[]) => Promise<void>;
  onBulkDelete?: (campaignIds: string[]) => Promise<void>;
  onBulkDuplicate?: (campaignIds: string[]) => Promise<void>;
  formatMoney?: (amount: number) => string;
  showMetrics?: boolean;
  loading?: boolean;
}

interface ExperimentGroup {
  experimentId: string;
  experimentName: string;
  variants: CampaignRow[];
  status: CampaignStatus;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CampaignIndexTable({
  campaigns,
  experiments = [],
  onCampaignClick,
  onEditClick,
  onToggleStatus,
  onExperimentClick,
  onDeleteClick,
  onDuplicateClick,
  onBulkActivate,
  onBulkPause,
  onBulkArchive,
  onBulkDelete,
  onBulkDuplicate,
  formatMoney = (amount) => `$${amount.toFixed(0)}`,
  showMetrics = true,
  loading = false,
}: CampaignIndexTableProps) {
  // State for status filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | CampaignStatus>('ALL');

  // State for bulk actions
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);

  // State for expanded experiments
  const [expandedExperiments, setExpandedExperiments] = useState<Set<string>>(new Set());

  const toggleExperiment = (experimentId: string) => {
    setExpandedExperiments(prev => {
      const next = new Set(prev);
      if (next.has(experimentId)) {
        next.delete(experimentId);
      } else {
        next.add(experimentId);
      }
      return next;
    });
  };

  // Map experiment IDs to names
  const experimentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const exp of experiments) {
      map.set(exp.id, exp.name);
    }
    return map;
  }, [experiments]);

  // Filter campaigns by status
  const filteredCampaigns = useMemo(() => {
    if (statusFilter === 'ALL') return campaigns;
    return campaigns.filter(c => c.status === statusFilter);
  }, [campaigns, statusFilter]);

  // Group campaigns by experiment
  const { experimentGroups, standaloneCampaigns } = useMemo(() => {
    const groupsMap = new Map<string, CampaignRow[]>();
    const standalone: CampaignRow[] = [];

    console.log('[CampaignIndexTable] Grouping campaigns:', {
      totalCampaigns: filteredCampaigns.length,
      campaignsWithExperimentId: filteredCampaigns.filter(c => c.experimentId).length,
      sampleCampaign: filteredCampaigns[0],
    });

    for (const campaign of filteredCampaigns) {
      if (campaign.experimentId) {
        const key = campaign.experimentId;
        console.log('[CampaignIndexTable] Found campaign with experimentId:', {
          id: campaign.id,
          name: campaign.name,
          experimentId: campaign.experimentId,
          variantKey: campaign.variantKey,
        });
        if (!groupsMap.has(key)) {
          groupsMap.set(key, []);
        }
        groupsMap.get(key)!.push(campaign);
      } else {
        standalone.push(campaign);
      }
    }

    const groups: ExperimentGroup[] = Array.from(groupsMap.entries()).map(([experimentId, variants]) => {
      const sortedVariants = variants.sort((a, b) => 
        (a.variantKey || '').localeCompare(b.variantKey || '')
      );
      
      return {
        experimentId,
        experimentName: experimentNameById.get(experimentId) || `Experiment ${experimentId}`,
        variants: sortedVariants,
        status: sortedVariants[0]?.status as CampaignStatus || 'DRAFT',
      };
    });

    return { experimentGroups: groups, standaloneCampaigns: standalone };
  }, [filteredCampaigns, experimentNameById]);

  // Flatten for IndexTable: experiment groups as parent rows, variants when expanded, then standalone campaigns
  const tableRows = useMemo(() => {
    const rows: Array<{
      id: string;
      type: 'experiment' | 'campaign' | 'variant';
      data: ExperimentGroup | CampaignRow;
      parentExperimentId?: string;
    }> = [];

    // Add experiment groups and their variants (if expanded)
    for (const group of experimentGroups) {
      rows.push({ id: group.experimentId, type: 'experiment', data: group });

      // If this experiment is expanded, add its variant campaigns
      if (expandedExperiments.has(group.experimentId)) {
        for (const variant of group.variants) {
          rows.push({
            id: variant.id,
            type: 'variant',
            data: variant,
            parentExperimentId: group.experimentId,
          });
        }
      }
    }

    // Add standalone campaigns
    for (const campaign of standaloneCampaigns) {
      rows.push({ id: campaign.id, type: 'campaign', data: campaign });
    }

    return rows;
  }, [experimentGroups, standaloneCampaigns, expandedExperiments]);

  // Resource state for checkboxes
  const resourceName = {
    singular: 'campaign',
    plural: 'campaigns',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(tableRows);

  // Get selected campaign IDs (expand experiment groups to individual campaigns)
  const selectedCampaignIds = useMemo(() => {
    const ids: string[] = [];
    for (const resourceId of selectedResources) {
      const row = tableRows.find(r => r.id === resourceId);
      if (!row) continue;

      if (row.type === 'experiment') {
        // Add all variant IDs from the experiment
        const group = row.data as ExperimentGroup;
        ids.push(...group.variants.map(v => v.id));
      } else {
        // Add single campaign ID
        ids.push(resourceId);
      }
    }
    return ids;
  }, [selectedResources, tableRows]);

  // Determine which bulk actions to show based on selected campaigns
  const selectedCampaigns = useMemo(() => {
    return campaigns.filter(c => selectedCampaignIds.includes(c.id));
  }, [campaigns, selectedCampaignIds]);

  const hasActiveSelected = selectedCampaigns.some(c => c.status === 'ACTIVE');
  const hasPausedOrDraftSelected = selectedCampaigns.some(c => c.status === 'PAUSED' || c.status === 'DRAFT');

  // Bulk action handlers
  const handleBulkActivate = async () => {
    if (!onBulkActivate || selectedCampaignIds.length === 0) return;

    setBulkActionLoading(true);
    setBulkActionError(null);
    try {
      await onBulkActivate(selectedCampaignIds);
      clearSelection();
    } catch (error) {
      setBulkActionError(error instanceof Error ? error.message : 'Failed to activate campaigns');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkPause = async () => {
    if (!onBulkPause || selectedCampaignIds.length === 0) return;

    setBulkActionLoading(true);
    setBulkActionError(null);
    try {
      await onBulkPause(selectedCampaignIds);
      clearSelection();
    } catch (error) {
      setBulkActionError(error instanceof Error ? error.message : 'Failed to pause campaigns');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (!onBulkArchive || selectedCampaignIds.length === 0) return;

    setBulkActionLoading(true);
    setBulkActionError(null);
    try {
      await onBulkArchive(selectedCampaignIds);
      clearSelection();
    } catch (error) {
      setBulkActionError(error instanceof Error ? error.message : 'Failed to archive campaigns');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDuplicate = async () => {
    if (!onBulkDuplicate || selectedCampaignIds.length === 0) return;

    setBulkActionLoading(true);
    setBulkActionError(null);
    try {
      await onBulkDuplicate(selectedCampaignIds);
      clearSelection();
    } catch (error) {
      setBulkActionError(error instanceof Error ? error.message : 'Failed to duplicate campaigns');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (!onBulkDelete || selectedCampaignIds.length === 0) return;
    if (deleteConfirmText !== 'DELETE') return;

    setBulkActionLoading(true);
    setBulkActionError(null);
    setDeleteConfirmOpen(false);
    setDeleteConfirmText('');

    try {
      await onBulkDelete(selectedCampaignIds);
      clearSelection();
    } catch (error) {
      setBulkActionError(error instanceof Error ? error.message : 'Failed to delete campaigns');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    const tone: 'success' | 'warning' | 'info' = status === 'ACTIVE' ? 'success' : status === 'PAUSED' ? 'warning' : 'info';
    return { tone, children: status };
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <Box padding="800">
          <BlockStack align="center">
            <Spinner size="large" />
            <Text variant="bodyMd" as="p">Loading campaigns...</Text>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  // Empty state
  if (campaigns.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="No campaigns yet"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Create your first campaign to start boosting revenue.</p>
        </EmptyState>
      </Card>
    );
  }

  // No results after filtering
  if (filteredCampaigns.length === 0) {
    return (
      <Card padding="0">
        <Box padding="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingMd">Active campaigns</Text>
            <InlineStack gap="200">
              <Button
                variant={statusFilter === 'ALL' ? 'primary' : 'tertiary'}
                onClick={() => setStatusFilter('ALL')}
                size="micro"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'primary' : 'tertiary'}
                onClick={() => setStatusFilter('ACTIVE')}
                size="micro"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'DRAFT' ? 'primary' : 'tertiary'}
                onClick={() => setStatusFilter('DRAFT')}
                size="micro"
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === 'PAUSED' ? 'primary' : 'tertiary'}
                onClick={() => setStatusFilter('PAUSED')}
                size="micro"
              >
                Paused
              </Button>
            </InlineStack>
          </InlineStack>
        </Box>
        <Box padding="400">
          <EmptyState
            heading="No campaigns found"
            image=""
          >
            <p>Try changing the filters or create a new campaign.</p>
          </EmptyState>
        </Box>
      </Card>
    );
  }

  // Define table headings based on whether metrics are shown
  const headings: IndexTableProps['headings'] = showMetrics
    ? [
        { title: 'Campaign' },
        { title: 'Status' },
        { title: 'Goal' },
        { title: 'Views' },
        { title: 'Conversions' },
        { title: 'Conv. Rate' },
        { title: 'Revenue' },
        { title: 'Actions' },
      ]
    : [
        { title: 'Campaign' },
        { title: 'Status' },
        { title: 'Goal' },
        { title: 'Template' },
        { title: 'Actions' },
      ];

  // Promoted bulk actions (shown when items are selected)
  const promotedBulkActions = useMemo(() => {
    if (selectedResources.length === 0) return undefined;

    const actions = [];

    if (hasPausedOrDraftSelected && onBulkActivate) {
      actions.push({
        content: 'Activate',
        onAction: handleBulkActivate,
        disabled: bulkActionLoading,
      });
    }

    if (hasActiveSelected && onBulkPause) {
      actions.push({
        content: 'Pause',
        onAction: handleBulkPause,
        disabled: bulkActionLoading,
      });
    }

    if (onBulkDuplicate) {
      actions.push({
        content: 'Duplicate',
        onAction: handleBulkDuplicate,
        disabled: bulkActionLoading,
      });
    }

    if (onBulkArchive) {
      actions.push({
        content: 'Archive',
        onAction: handleBulkArchive,
        disabled: bulkActionLoading,
      });
    }

    if (onBulkDelete) {
      actions.push({
        content: 'Delete',
        destructive: true,
        onAction: () => setDeleteConfirmOpen(true),
        disabled: bulkActionLoading,
      });
    }

    return actions.length > 0 ? actions : undefined;
  }, [selectedResources.length, hasPausedOrDraftSelected, hasActiveSelected, onBulkActivate, onBulkPause, onBulkArchive, onBulkDuplicate, onBulkDelete, bulkActionLoading]);

  return (
    <>
      <Card padding="0">
        <Box padding="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingMd">Active campaigns</Text>
            <InlineStack gap="200">
              <Button
                variant={statusFilter === 'ALL' ? 'primary' : 'tertiary'}
                onClick={() => setStatusFilter('ALL')}
                size="micro"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'primary' : 'tertiary'}
                onClick={() => setStatusFilter('ACTIVE')}
                size="micro"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'DRAFT' ? 'primary' : 'tertiary'}
                onClick={() => setStatusFilter('DRAFT')}
                size="micro"
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === 'PAUSED' ? 'primary' : 'tertiary'}
                onClick={() => setStatusFilter('PAUSED')}
                size="micro"
              >
                Paused
              </Button>
            </InlineStack>
          </InlineStack>
        </Box>

        {/* Bulk action error banner */}
        {bulkActionError && (
          <Box padding="400" paddingBlockStart="0">
            <Banner tone="critical" onDismiss={() => setBulkActionError(null)}>
              {bulkActionError}
            </Banner>
          </Box>
        )}

      <IndexTable
        resourceName={resourceName}
        itemCount={tableRows.length}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        headings={headings}
        promotedBulkActions={promotedBulkActions}
      >
        {tableRows.map((row, index) => {
          if (row.type === 'experiment') {
            const group = row.data as ExperimentGroup;
            const statusBadge = getStatusBadge(group.status);

            return (
              <IndexTable.Row
                id={row.id}
                key={row.id}
                selected={selectedResources.includes(row.id)}
                position={index}
              >
                <IndexTable.Cell>
                  <InlineStack gap="200" blockAlign="center">
                    {/* Expand/Collapse Icon */}
                    <div
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        toggleExperiment(group.experimentId);
                      }}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Icon
                        source={expandedExperiments.has(group.experimentId) ? ChevronDownIcon : ChevronRightIcon}
                        tone="base"
                      />
                    </div>

                    {/* Experiment Name */}
                    <div
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onExperimentClick?.(group.experimentId);
                      }}
                      style={{ cursor: onExperimentClick ? 'pointer' : 'default', flex: 1 }}
                    >
                      <Text as="span" fontWeight="bold">{group.experimentName}</Text>
                      <Box>
                        <Text as="span" tone="subdued" variant="bodySm">
                          A/B Test ({group.variants.length} variants)
                        </Text>
                      </Box>
                    </div>
                  </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge {...statusBadge} />
                </IndexTable.Cell>
                <IndexTable.Cell>
                  {group.variants[0]?.goal?.replace(/_/g, ' ') || '-'}
                </IndexTable.Cell>
                {showMetrics ? (
                  <>
                    <IndexTable.Cell>
                      {group.variants.reduce((sum, v) => sum + (v.views || 0), 0).toLocaleString()}
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      {group.variants.reduce((sum, v) => sum + (v.conversions || 0), 0).toLocaleString()}
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      {(() => {
                        const totalViews = group.variants.reduce((sum, v) => sum + (v.views || 0), 0);
                        const totalConversions = group.variants.reduce((sum, v) => sum + (v.conversions || 0), 0);
                        const rate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
                        return `${rate.toFixed(1)}%`;
                      })()}
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      {formatMoney(group.variants.reduce((sum, v) => sum + (v.revenue || 0), 0))}
                    </IndexTable.Cell>
                  </>
                ) : (
                  <IndexTable.Cell>
                    {group.variants[0]?.templateType?.replace(/_/g, ' ') || '-'}
                  </IndexTable.Cell>
                )}
                <IndexTable.Cell>
                  <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <InlineStack gap="200">
                      <Button
                        size="micro"
                        onClick={() => onExperimentClick?.(group.experimentId)}
                      >
                        View
                      </Button>
                    </InlineStack>
                  </div>
                </IndexTable.Cell>
              </IndexTable.Row>
            );
          } else if (row.type === 'variant') {
            // Variant campaign row (nested under experiment)
            const campaign = row.data as CampaignRow;
            const { id, name, status, templateType, goal, views, conversions, revenue, variantKey, isControl } = campaign;
            const statusBadge = getStatusBadge(status);
            const conversionRate = views && views > 0 ? ((conversions || 0) / views) * 100 : 0;

            return (
              <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
                tone="subdued"
              >
                <IndexTable.Cell>
                  <Box paddingInlineStart="800">
                    <InlineStack gap="200" blockAlign="center">
                      <div
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onCampaignClick?.(id);
                        }}
                        style={{ cursor: onCampaignClick ? 'pointer' : 'default', flex: 1 }}
                      >
                        <InlineStack gap="200" blockAlign="center">
                          <Badge tone={isControl ? 'info' : 'attention'} size="small">
                            {isControl ? 'Control' : `Variant ${variantKey}`}
                          </Badge>
                          <Text as="span">{name}</Text>
                        </InlineStack>
                        <Box paddingBlockStart="100">
                          <Text as="span" tone="subdued" variant="bodySm">
                            {templateType.replace(/_/g, ' ')}
                          </Text>
                        </Box>
                      </div>
                    </InlineStack>
                  </Box>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge {...statusBadge} />
                </IndexTable.Cell>
                <IndexTable.Cell>{goal.replace(/_/g, ' ')}</IndexTable.Cell>
                {showMetrics ? (
                  <>
                    <IndexTable.Cell>{(views || 0).toLocaleString()}</IndexTable.Cell>
                    <IndexTable.Cell>{(conversions || 0).toLocaleString()}</IndexTable.Cell>
                    <IndexTable.Cell>{conversionRate.toFixed(1)}%</IndexTable.Cell>
                    <IndexTable.Cell>{formatMoney(revenue || 0)}</IndexTable.Cell>
                  </>
                ) : (
                  <IndexTable.Cell>{templateType.replace(/_/g, ' ')}</IndexTable.Cell>
                )}
                <IndexTable.Cell>
                  <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <InlineStack gap="200">
                      <Button
                        size="micro"
                        onClick={() => onEditClick?.(id)}
                      >
                        Edit
                      </Button>
                      {onToggleStatus && (
                        <Button
                          size="micro"
                          onClick={() => onToggleStatus(id, status)}
                        >
                          {status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        </Button>
                      )}
                      {onDuplicateClick && (
                        <Button
                          size="micro"
                          onClick={() => onDuplicateClick(id)}
                        >
                          Duplicate
                        </Button>
                      )}
                      {onDeleteClick && (
                        <Button
                          size="micro"
                          tone="critical"
                          onClick={() => onDeleteClick(id)}
                        >
                          Delete
                        </Button>
                      )}
                    </InlineStack>
                  </div>
                </IndexTable.Cell>
              </IndexTable.Row>
            );
          } else {
            // Regular campaign row (standalone, not part of experiment)
            const campaign = row.data as CampaignRow;
            const { id, name, status, templateType, goal, views, conversions, revenue } = campaign;
            const statusBadge = getStatusBadge(status);
            const conversionRate = views && views > 0 ? ((conversions || 0) / views) * 100 : 0;

            return (
              <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
              >
                <IndexTable.Cell>
                  <div
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onCampaignClick?.(id);
                    }}
                    style={{ cursor: onCampaignClick ? 'pointer' : 'default' }}
                  >
                    <Text as="span" fontWeight="bold">{name}</Text>
                    <Box>
                      <Text as="span" tone="subdued" variant="bodySm">
                        {templateType.replace(/_/g, ' ')}
                      </Text>
                    </Box>
                  </div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge {...statusBadge} />
                </IndexTable.Cell>
                <IndexTable.Cell>{goal.replace(/_/g, ' ')}</IndexTable.Cell>
                {showMetrics ? (
                  <>
                    <IndexTable.Cell>{(views || 0).toLocaleString()}</IndexTable.Cell>
                    <IndexTable.Cell>{(conversions || 0).toLocaleString()}</IndexTable.Cell>
                    <IndexTable.Cell>{conversionRate.toFixed(1)}%</IndexTable.Cell>
                    <IndexTable.Cell>{formatMoney(revenue || 0)}</IndexTable.Cell>
                  </>
                ) : (
                  <IndexTable.Cell>{templateType.replace(/_/g, ' ')}</IndexTable.Cell>
                )}
                <IndexTable.Cell>
                  <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <InlineStack gap="200">
                      <Button
                        size="micro"
                        onClick={() => onEditClick?.(id)}
                      >
                        Edit
                      </Button>
                      {onToggleStatus && (
                        <Button
                          size="micro"
                          onClick={() => onToggleStatus(id, status)}
                        >
                          {status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        </Button>
                      )}
                      {onDuplicateClick && (
                        <Button
                          size="micro"
                          onClick={() => onDuplicateClick(id)}
                        >
                          Duplicate
                        </Button>
                      )}
                      {onDeleteClick && (
                        <Button
                          size="micro"
                          tone="critical"
                          onClick={() => onDeleteClick(id)}
                        >
                          Delete
                        </Button>
                      )}
                    </InlineStack>
                  </div>
                </IndexTable.Cell>
              </IndexTable.Row>
            );
          }
        })}
      </IndexTable>
    </Card>

    {/* Delete Confirmation Modal */}
    <Modal
      open={deleteConfirmOpen}
      onClose={() => {
        setDeleteConfirmOpen(false);
        setDeleteConfirmText('');
      }}
      title="Delete campaigns"
      primaryAction={{
        content: 'Delete',
        destructive: true,
        disabled: deleteConfirmText !== 'DELETE',
        onAction: handleBulkDeleteConfirm,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: () => {
            setDeleteConfirmOpen(false);
            setDeleteConfirmText('');
          },
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p">
            You are about to permanently delete <strong>{selectedCampaignIds.length}</strong> campaign{selectedCampaignIds.length !== 1 ? 's' : ''}:
          </Text>

          <Box paddingBlockStart="200" paddingBlockEnd="200">
            <BlockStack gap="100">
              {selectedCampaigns.slice(0, 5).map(campaign => (
                <Text key={campaign.id} as="p" tone="subdued">
                  • {campaign.name}
                </Text>
              ))}
              {selectedCampaigns.length > 5 && (
                <Text as="p" tone="subdued">
                  ... and {selectedCampaigns.length - 5} more
                </Text>
              )}
            </BlockStack>
          </Box>

          {/* Show analytics data that will be lost */}
          {showMetrics && selectedCampaigns.some(c => (c.views || 0) > 0 || (c.conversions || 0) > 0 || (c.revenue || 0) > 0) && (
            <Box paddingBlockStart="200" paddingBlockEnd="200">
              <BlockStack gap="200">
                <Text as="p" variant="headingSm">Analytics data that will be permanently deleted:</Text>
                <InlineStack gap="400">
                  <Text as="p" tone="subdued">
                    <strong>{selectedCampaigns.reduce((sum, c) => sum + (c.views || 0), 0).toLocaleString()}</strong> views
                  </Text>
                  <Text as="p" tone="subdued">
                    <strong>{selectedCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0).toLocaleString()}</strong> conversions
                  </Text>
                  <Text as="p" tone="subdued">
                    <strong>{formatMoney(selectedCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0))}</strong> revenue
                  </Text>
                </InlineStack>
              </BlockStack>
            </Box>
          )}

          <Banner tone="critical">
            <BlockStack gap="200">
              <Text as="p" fontWeight="bold">⚠️ This action cannot be undone!</Text>
              <Text as="p">All campaign data will be permanently deleted, including:</Text>
              <Box paddingInlineStart="400">
                <BlockStack gap="100">
                  <Text as="p">• Campaign settings and configurations</Text>
                  <Text as="p">• All analytics data (views, conversions, revenue)</Text>
                  <Text as="p">• Lead capture data and customer interactions</Text>
                  <Text as="p">• A/B test results and performance history</Text>
                </BlockStack>
              </Box>
              <Text as="p" tone="subdued">
                💡 <strong>Tip:</strong> Consider using "Archive" instead to preserve analytics while hiding the campaign.
              </Text>
            </BlockStack>
          </Banner>

          <TextField
            label={`Type "DELETE" to confirm`}
            value={deleteConfirmText}
            onChange={setDeleteConfirmText}
            autoComplete="off"
            placeholder="DELETE"
            helpText="This confirmation is required to prevent accidental deletion"
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  </>
  );
}

