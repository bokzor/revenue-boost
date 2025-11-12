/**
 * Campaign List Component
 *
 * A comprehensive list component for displaying campaigns with filtering,
 * sorting, and pagination capabilities.
 */

import { useState, useMemo } from 'react';
import {
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Badge,
  Button,
  ButtonGroup,
  Filters,
  ChoiceList,
  Pagination,
  EmptyState,
  Spinner,
  InlineStack,
  BlockStack,
  Box,
} from '@shopify/polaris';
import type { CampaignWithConfigs , CampaignStatus, CampaignGoal, TemplateType } from '~/domains/campaigns/types/campaign';
import type { ExperimentWithVariants } from '~/domains/campaigns/types/experiment';


// ============================================================================
// TYPES
// ============================================================================

interface CampaignListProps {
  campaigns: CampaignWithConfigs[];
  experiments?: ExperimentWithVariants[];
  loading?: boolean;
  onCampaignSelect?: (campaign: CampaignWithConfigs) => void;
  onCampaignEdit?: (campaignId: string) => void;
  onExperimentSelect?: (experimentId: string) => void;
  onExperimentEdit?: (experimentId: string, variantKey?: string) => void;
  onCampaignDelete?: (campaignId: string) => void;
  onCampaignDuplicate?: (campaignId: string) => void;
  onCreateNew?: () => void;
}

interface FilterState {
  status: CampaignStatus[];
  goal: CampaignGoal[];
  templateType: TemplateType[];
  searchQuery: string;
}

type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// COMPONENT
// ============================================================================

export function CampaignList({
  campaigns,
  experiments = [],
  loading = false,
  onCampaignSelect,
  onCampaignEdit,
  onExperimentSelect,
  onExperimentEdit,
  onCampaignDelete,
  onCampaignDuplicate,
  onCreateNew,
}: CampaignListProps) {
  // State for filtering and sorting
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    goal: [],
    templateType: [],
    searchQuery: '',
  });

  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Map experimentId -> name for headers
  const experimentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const exp of experiments) map.set(exp.id, exp.name);
    return map;
  }, [experiments]);

  // Filter options
  const statusOptions = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Paused', value: 'PAUSED' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  const goalOptions = [
    { label: 'Newsletter Signup', value: 'NEWSLETTER_SIGNUP' },
    { label: 'Increase Revenue', value: 'INCREASE_REVENUE' },
    { label: 'Engagement', value: 'ENGAGEMENT' },
  ];

  const templateTypeOptions = [
    { label: 'Newsletter', value: 'NEWSLETTER' },
    { label: 'Spin to Win', value: 'SPIN_TO_WIN' },
    { label: 'Flash Sale', value: 'FLASH_SALE' },
    { label: 'Free Shipping', value: 'FREE_SHIPPING' },
    { label: 'Exit Intent', value: 'EXIT_INTENT' },
    { label: 'Cart Abandonment', value: 'CART_ABANDONMENT' },
    { label: 'Product Upsell', value: 'PRODUCT_UPSELL' },
    { label: 'Social Proof', value: 'SOCIAL_PROOF' },
    { label: 'Countdown Timer', value: 'COUNTDOWN_TIMER' },
    { label: 'Scratch Card', value: 'SCRATCH_CARD' },
    { label: 'Announcement', value: 'ANNOUNCEMENT' },
  ];

  // Filter and sort campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Apply filters
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(query) ||
        campaign.description?.toLowerCase().includes(query)
      );
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(campaign =>
        filters.status.includes(campaign.status as CampaignStatus)
      );
    }

    if (filters.goal.length > 0) {
      filtered = filtered.filter(campaign =>
        filters.goal.includes(campaign.goal as CampaignGoal)
      );
    }

    if (filters.templateType.length > 0) {
      filtered = filtered.filter(campaign =>
        filters.templateType.includes(campaign.templateType as TemplateType)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'priority':
          aValue = a.priority || 0;
          bValue = b.priority || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [campaigns, filters, sortBy, sortDirection]);

  // Group experiments vs standalone (full set), then paginate top-level rows
  const { experimentGroupsAll, regularCampaignsAll } = useMemo(() => {
    const groupsMap = new Map<string, CampaignWithConfigs[]>();
    const regular: CampaignWithConfigs[] = [];

    for (const c of filteredAndSortedCampaigns) {
      if (c.experimentId) {
        const key = c.experimentId as string;
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key)!.push(c);
      } else {
        regular.push(c);
      }
    }

    const groups = Array.from(groupsMap.entries()).map(([experimentId, variants]) => ({
      experimentId,
      variants: variants.sort((a, b) => ((a.variantKey || '').localeCompare(b.variantKey || ''))),
    }));

    return { experimentGroupsAll: groups, regularCampaignsAll: regular };
  }, [filteredAndSortedCampaigns]);

  // Build top-level rows for pagination: groups first, then standalone
  const topLevelRows = useMemo(() => {
    return [
      ...experimentGroupsAll.map((g) => ({ type: 'group' as const, group: g })),
      ...regularCampaignsAll.map((c) => ({ type: 'single' as const, campaign: c })),
    ];
  }, [experimentGroupsAll, regularCampaignsAll]);

  const totalPages = Math.ceil(topLevelRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageRows = topLevelRows.slice(startIndex, startIndex + itemsPerPage);

  const experimentGroups = pageRows
    .filter((r) => r.type === 'group')
    .map((r) => (r as { type: 'group'; group: { experimentId: string; variants: CampaignWithConfigs[] } }).group);
  const regularCampaigns = pageRows
    .filter((r) => r.type === 'single')
    .map((r) => (r as { type: 'single'; campaign: CampaignWithConfigs }).campaign);

  // Event handlers
  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchQuery: value }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      status: [],
      goal: [],
      templateType: [],
      searchQuery: '',
    });
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  // Helper functions
  const getStatusBadge = (status: CampaignStatus) => {
    const statusConfig: Record<CampaignStatus, { tone: 'info' | 'success' | 'warning' | 'critical'; children: string }> = {
      DRAFT: { tone: 'info', children: 'Draft' },
      ACTIVE: { tone: 'success', children: 'Active' },
      PAUSED: { tone: 'warning', children: 'Paused' },
      ARCHIVED: { tone: 'critical', children: 'Archived' },
    };

    return statusConfig[status] || { tone: 'info', children: status };
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTemplateTypeLabel = (templateType: TemplateType) => {
    const labels: Record<TemplateType, string> = {
      NEWSLETTER: 'Newsletter',
      SPIN_TO_WIN: 'Spin to Win',
      FLASH_SALE: 'Flash Sale',
      FREE_SHIPPING: 'Free Shipping',
      EXIT_INTENT: 'Exit Intent',
      CART_ABANDONMENT: 'Cart Abandonment',
      PRODUCT_UPSELL: 'Product Upsell',
      SOCIAL_PROOF: 'Social Proof',
      COUNTDOWN_TIMER: 'Countdown Timer',
      SCRATCH_CARD: 'Scratch Card',
      ANNOUNCEMENT: 'Announcement',
    };

    return labels[templateType] || templateType;
  };

  // Filter components
  const appliedFilters = [];

  if (filters.status.length > 0) {
    appliedFilters.push({
      key: 'status',
      label: `Status: ${filters.status.join(', ')}`,
      onRemove: () => handleFiltersChange({ status: [] }),
    });
  }

  if (filters.goal.length > 0) {
    appliedFilters.push({
      key: 'goal',
      label: `Goal: ${filters.goal.join(', ')}`,
      onRemove: () => handleFiltersChange({ goal: [] }),
    });
  }

  if (filters.templateType.length > 0) {
    appliedFilters.push({
      key: 'templateType',
      label: `Template: ${filters.templateType.join(', ')}`,
      onRemove: () => handleFiltersChange({ templateType: [] }),
    });
  }

  const filterMarkup = (
    <Filters
      queryValue={filters.searchQuery}
      queryPlaceholder="Search campaigns..."
      onQueryChange={handleSearchChange}
      onQueryClear={() => handleSearchChange('')}
      onClearAll={clearAllFilters}
      appliedFilters={appliedFilters}
      filters={[
        {
          key: 'status',
          label: 'Status',
          filter: (
            <ChoiceList
              title="Status"
              titleHidden
              choices={statusOptions}
              selected={filters.status}
              onChange={(value) => handleFiltersChange({ status: value as CampaignStatus[] })}
              allowMultiple
            />
          ),
          shortcut: true,
        },
        {
          key: 'goal',
          label: 'Goal',
          filter: (
            <ChoiceList
              title="Goal"
              titleHidden
              choices={goalOptions}
              selected={filters.goal}
              onChange={(value) => handleFiltersChange({ goal: value as CampaignGoal[] })}
              allowMultiple
            />
          ),
        },
        {
          key: 'templateType',
          label: 'Template Type',
          filter: (
            <ChoiceList
              title="Template Type"
              titleHidden
              choices={templateTypeOptions}
              selected={filters.templateType}
              onChange={(value) => handleFiltersChange({ templateType: value as TemplateType[] })}
              allowMultiple
            />
          ),
        },
      ]}
    />
  );

  // Sort controls
  const sortControls = (
    <Box paddingBlockEnd="400">
      <InlineStack align="space-between">
        <Text variant="bodyMd" as="p">
          {topLevelRows.length} item{topLevelRows.length !== 1 ? 's' : ''}
        </Text>
        <ButtonGroup variant="segmented">
          <Button
            variant={sortBy === 'name' ? 'primary' : undefined}
            onClick={() => handleSortChange('name')}
          >
            {`Name ${sortBy === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
          </Button>
          <Button
            variant={sortBy === 'updatedAt' ? 'primary' : undefined}
            onClick={() => handleSortChange('updatedAt')}
          >
            {`Updated ${sortBy === 'updatedAt' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
          </Button>
          <Button
            variant={sortBy === 'status' ? 'primary' : undefined}
            onClick={() => handleSortChange('status')}
          >
            {`Status ${sortBy === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
          </Button>
          <Button
            variant={sortBy === 'priority' ? 'primary' : undefined}
            onClick={() => handleSortChange('priority')}
          >
            {`Priority ${sortBy === 'priority' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
          </Button>
        </ButtonGroup>
      </InlineStack>
    </Box>
  );

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
          action={{
            content: 'Create campaign',
            onAction: onCreateNew,
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Create your first campaign to start boosting revenue.</p>
        </EmptyState>
      </Card>
    );
  }

  // No results after filtering
  if (filteredAndSortedCampaigns.length === 0) {
    return (
      <Card>
        {filterMarkup}
        <Box padding="800">
          <EmptyState
            heading="No campaigns match your filters"
            image=""
            action={{
              content: 'Clear filters',
              onAction: clearAllFilters,
            }}
          >
            <p>Try adjusting your search or filter criteria.</p>
          </EmptyState>
        </Box>
      </Card>
    );
  }

  // Main list rendering - Single unified list with experiments and campaigns
  return (
    <Card>
      {filterMarkup}
      {sortControls}

      <ResourceList
        resourceName={{ singular: 'item', plural: 'items' }}
        items={[...experimentGroups.map(g => ({ type: 'experiment' as const, data: g })), ...regularCampaigns.map(c => ({ type: 'campaign' as const, data: c }))]}
        renderItem={(item) => {
          // Render Experiment Row (Expandable)
          if (item.type === 'experiment') {
            const group = item.data;
            const isExpanded = expandedExperiments.has(group.experimentId);
            const experimentName = experimentNameById.get(group.experimentId) ?? `Experiment ${group.experimentId}`;

            // Get experiment status from first variant
            const firstVariant = group.variants[0];
            const experimentStatus = firstVariant?.status || 'DRAFT';
            const statusBadge = getStatusBadge(experimentStatus as CampaignStatus);

            return (
              <ResourceItem
                id={group.experimentId}
                accessibilityLabel={`Experiment ${experimentName}`}
                onClick={() => {
                  // Navigate to experiment detail/overview page
                  if (onExperimentSelect && group.experimentId) {
                    onExperimentSelect(group.experimentId);
                  }
                }}
              >
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="plain"
                          onClick={() => {
                            toggleExperiment(group.experimentId);
                          }}
                          accessibilityLabel={isExpanded ? 'Collapse experiment' : 'Expand experiment'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </Button>
                      </div>
                      <BlockStack gap="200">
                        <InlineStack gap="200">
                          <Text variant="bodyMd" fontWeight="semibold" as="h3">
                            {experimentName}
                          </Text>
                          <Badge {...statusBadge} />
                          <Badge tone="magic">
                            {`A/B Test (${group.variants.length} variants)`}
                          </Badge>
                        </InlineStack>
                        <InlineStack gap="200">
                          <Text variant="bodySm" tone="subdued" as="span">
                            {getTemplateTypeLabel(firstVariant?.templateType as TemplateType)}
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="span">•</Text>
                          <Text variant="bodySm" tone="subdued" as="span">
                            {group.variants
                              .filter((v) => !!v.variantKey)
                              .map((v) => `${v.variantKey}${v.isControl ? "*" : ""}`)
                              .join(", ")}
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="span">•</Text>
                          <Text variant="bodySm" tone="subdued" as="span">
                            Updated {formatDate(firstVariant?.updatedAt)}
                          </Text>
                        </InlineStack>
                      </BlockStack>
                    </InlineStack>

                    <div onClick={(e) => e.stopPropagation()}>
                      <InlineStack gap="200">
                        {onExperimentEdit && (
                          <Button
                            size="slim"
                            onClick={() => {
                              // Edit the experiment, not individual campaigns
                              if (group.experimentId) {
                                onExperimentEdit(group.experimentId);
                              }
                            }}
                          >
                            Edit
                          </Button>
                        )}
                        {onCampaignDelete && (
                          <Button
                            size="slim"
                            tone="critical"
                            onClick={() => {
                              // Delete first variant (which will trigger experiment deletion)
                              if (group.variants[0]) {
                                onCampaignDelete(group.variants[0].id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </InlineStack>
                    </div>
                  </InlineStack>

                  {/* Expanded Variants - rendered inside ResourceItem */}
                  {isExpanded && (
                    <Box paddingInlineStart="800" paddingBlockStart="400" paddingBlockEnd="200">
                      {group.variants.map((campaign) => {
                        const { id, name, description, status, goal, priority } = campaign;
                        const variantStatusBadge = getStatusBadge(status as CampaignStatus);

                        return (
                          <Box key={id} paddingBlockEnd="200">
                            <Card>
                              <Box padding="400">
                                <InlineStack align="space-between">
                                  <BlockStack gap="200">
                                    <InlineStack gap="200">
                                      <Text variant="bodyMd" fontWeight="medium" as="h4">
                                        {name}
                                      </Text>
                                      <Badge {...variantStatusBadge} />
                                      {campaign.variantKey && (
                                        <Badge tone="info">
                                          {`Variant ${campaign.variantKey}${campaign.isControl ? " (Control)" : ""}`}
                                        </Badge>
                                      )}
                                      {priority && priority > 0 && (
                                        <Badge tone="attention">{`Priority ${priority}`}</Badge>
                                      )}
                                    </InlineStack>

                                    {description && (
                                      <Text variant="bodySm" tone="subdued" as="p">
                                        {description}
                                      </Text>
                                    )}

                                    <InlineStack gap="200">
                                      <Text variant="bodySm" tone="subdued" as="span">
                                        Goal: {goal.replace('_', ' ').toLowerCase()}
                                      </Text>
                                    </InlineStack>
                                  </BlockStack>

                                  <div onClick={(e) => e.stopPropagation()}>
                                    <InlineStack gap="200">
                                      {onCampaignSelect && (
                                        <Button size="slim" onClick={() => onCampaignSelect(campaign)}>
                                          View
                                        </Button>
                                      )}
                                      {onExperimentEdit && campaign.variantKey && (
                                        <Button
                                          size="slim"
                                          onClick={() => {
                                            console.log('[CampaignList] Edit Variant clicked for experimentId:', group.experimentId, 'variantKey:', campaign.variantKey);
                                            // Edit this specific variant in the experiment
                                            if (group.experimentId) {
                                              onExperimentEdit(group.experimentId, campaign.variantKey || undefined);
                                            }
                                          }}
                                        >
                                          Edit Variant
                                        </Button>
                                      )}
                                    </InlineStack>
                                  </div>
                                </InlineStack>
                              </Box>
                            </Card>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </ResourceItem>
            );
          }

          // Render Regular Campaign Row
          const campaign = item.data;
          const { id, name, description, status, goal, templateType, priority, updatedAt } = campaign;
          const statusBadge = getStatusBadge(status as CampaignStatus);

          return (
            <ResourceItem
              key={id}
              id={id}
              onClick={() => {
                if (onCampaignSelect) {
                  onCampaignSelect(campaign);
                }
              }}
              accessibilityLabel={`Campaign ${name}`}
            >
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <InlineStack gap="200">
                    <Text variant="bodyMd" fontWeight="semibold" as="h3">
                      {name}
                    </Text>
                    <Badge {...statusBadge} />
                    {priority && priority > 0 && (
                      <Badge tone="attention">{`Priority ${priority}`}</Badge>
                    )}
                  </InlineStack>

                  {description && (
                    <Text variant="bodySm" tone="subdued" as="p">
                      {description}
                    </Text>
                  )}

                  <InlineStack gap="200">
                    <Text variant="bodySm" tone="subdued" as="span">
                      {getTemplateTypeLabel(templateType as TemplateType)}
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="span">•</Text>
                    <Text variant="bodySm" tone="subdued" as="span">
                      Goal: {goal.replace('_', ' ').toLowerCase()}
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="span">•</Text>
                    <Text variant="bodySm" tone="subdued" as="span">
                      Updated {formatDate(updatedAt)}
                    </Text>
                  </InlineStack>
                </BlockStack>

                <InlineStack gap="200">
                  {onCampaignEdit && (
                    <Button
                      size="slim"
                      onClick={() => {
                        onCampaignEdit(id);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {onCampaignDuplicate && (
                    <Button size="slim" onClick={() => { onCampaignDuplicate(id); }}>
                      Duplicate
                    </Button>
                  )}
                  {onCampaignDelete && (
                    <Button size="slim" tone="critical" onClick={() => { onCampaignDelete(id); }}>
                      Delete
                    </Button>
                  )}
                </InlineStack>
              </InlineStack>
            </ResourceItem>
          );
        }}
      />

      {totalPages > 1 && (
        <Box paddingBlockStart="400">
          <InlineStack align="center">
            <Pagination
              hasPrevious={currentPage > 1}
              onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              hasNext={currentPage < totalPages}
              onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              label={`Page ${currentPage} of ${totalPages}`}
            />
          </InlineStack>
        </Box>
      )}
    </Card>
  );
}
