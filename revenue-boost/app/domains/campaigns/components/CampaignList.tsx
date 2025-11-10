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

// ============================================================================
// TYPES
// ============================================================================

interface CampaignListProps {
  campaigns: CampaignWithConfigs[];
  loading?: boolean;
  onCampaignSelect?: (campaign: CampaignWithConfigs) => void;
  onCampaignEdit?: (campaignId: string) => void;
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
  loading = false,
  onCampaignSelect,
  onCampaignEdit,
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

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCampaigns = filteredAndSortedCampaigns.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
          {filteredAndSortedCampaigns.length} campaign{filteredAndSortedCampaigns.length !== 1 ? 's' : ''}
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

  // Main list rendering
  return (
    <Card>
      {filterMarkup}
      {sortControls}

      <ResourceList
        resourceName={{ singular: 'campaign', plural: 'campaigns' }}
        items={paginatedCampaigns}
        renderItem={(campaign) => {
          const { id, name, description, status, goal, templateType, priority, updatedAt } = campaign;
          const statusBadge = getStatusBadge(status as CampaignStatus);

          return (
            <ResourceItem
              id={id}
              url={onCampaignSelect ? '#' : undefined}
              onClick={() => { if (onCampaignSelect) onCampaignSelect(campaign); }}
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
                    <Text variant="bodySm" tone="subdued" as="span">
                      •
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="span">
                      Goal: {goal.replace('_', ' ').toLowerCase()}
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="span">
                      •
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="span">
                      Updated {formatDate(updatedAt)}
                    </Text>
                  </InlineStack>
                </BlockStack>

                <InlineStack gap="200">
                  {onCampaignEdit && (
                    <Button
                      size="slim"
                      onClick={() => onCampaignEdit(id)}
                    >
                      Edit
                    </Button>
                  )}

                  {onCampaignDuplicate && (
                    <Button
                      size="slim"
                      onClick={() => onCampaignDuplicate(id)}
                    >
                      Duplicate
                    </Button>
                  )}

                  {onCampaignDelete && (
                    <Button
                      size="slim"
                      tone="critical"
                      onClick={() => onCampaignDelete(id)}
                    >
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
