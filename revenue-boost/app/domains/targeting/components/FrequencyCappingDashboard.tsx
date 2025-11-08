import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Badge,
  DataTable,
  TextField,
  Box,
  Modal,
  Tabs,
} from "@shopify/polaris";

interface FrequencyCappingDashboardProps {
  campaigns: any[];
  onUpdateFrequencyRules: (campaignId: string, rules: any) => void;
  onResetFrequency: (sessionId: string, campaignId?: string) => void;
  loading?: boolean;
  _loading?: boolean;
}

export function FrequencyCappingDashboard({
  campaigns,
  onUpdateFrequencyRules,
  onResetFrequency,
}: FrequencyCappingDashboardProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [testSessionId, setTestSessionId] = useState("");
  const [testResults, setTestResults] = useState<any>(null);

  const tabs = [
    { id: "overview", content: "Overview" },
    { id: "campaigns", content: "Campaign Rules" },
    { id: "testing", content: "Testing Tools" },
    { id: "analytics", content: "Analytics" },
  ];

  const handleEditFrequencyRules = (campaign: any) => {
    setEditingCampaign({
      ...campaign,
      frequencyRules: extractFrequencyRules(campaign.triggerConfig),
    });
  };

  const handleSaveFrequencyRules = () => {
    if (!editingCampaign) return;

    const updatedTriggerConfig = {
      ...editingCampaign.triggerConfig,
      frequency: editingCampaign.frequencyRules,
    };

    onUpdateFrequencyRules(editingCampaign.id, updatedTriggerConfig);
    setEditingCampaign(null);
  };

  const handleTestFrequency = async (campaignId: string) => {
    if (!testSessionId) return;

    try {
      // This would call the API to check frequency status
      const response = await fetch("/api/commerce/popup-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_frequency",
          sessionId: testSessionId,
          campaignId,
        }),
      });

      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      console.error("Test failed:", error);
    }
  };

  const extractFrequencyRules = (triggerConfig: any) => {
    return (
      triggerConfig?.frequency || {
        maxPerSession: 1,
        maxPerDay: 3,
        cooldownHours: 24,
        respectGlobalLimits: false,
      }
    );
  };

  const getCampaignTableRows = () => {
    return campaigns.map((campaign) => {
      const rules = extractFrequencyRules(campaign.triggerConfig);

      return [
        <InlineStack
          gap="200"
          blockAlign="center"
          key={`status-${campaign.id}`}
        >
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {campaign.name}
          </Text>
          <Badge tone={campaign.status === "ACTIVE" ? "success" : "new"}>
            {campaign.status}
          </Badge>
        </InlineStack>,
        `${rules.maxPerSession || "Unlimited"} per session`,
        `${rules.maxPerDay || "Unlimited"} per day`,
        rules.cooldownHours ? `${rules.cooldownHours}h` : "None",
        rules.respectGlobalLimits ? "Yes" : "No",
        <InlineStack gap="200" key={`actions-${campaign.id}`}>
          <Button
            size="micro"
            onClick={() => handleEditFrequencyRules(campaign)}
          >
            Edit Rules
          </Button>
          <Button size="micro" onClick={() => handleTestFrequency(campaign.id)}>
            Test
          </Button>
        </InlineStack>,
      ];
    });
  };

  const renderOverviewTab = () => (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="span" variant="headingMd">
            Frequency Capping Overview
          </Text>

          <InlineStack gap="400">
            <Box>
              <Text as="span" variant="bodyMd">
                Total Campaigns
              </Text>
              <Text as="span" variant="heading2xl">
                {campaigns.length}
              </Text>
            </Box>

            <Box>
              <Text as="span" variant="bodyMd">
                With Frequency Rules
              </Text>
              <Text as="span" variant="heading2xl">
                {
                  campaigns.filter(
                    (c) => extractFrequencyRules(c.triggerConfig).maxPerSession,
                  ).length
                }
              </Text>
            </Box>

            <Box>
              <Text as="span" variant="bodyMd">
                Global Limits Enabled
              </Text>
              <Text as="span" variant="heading2xl">
                {
                  campaigns.filter(
                    (c) =>
                      extractFrequencyRules(c.triggerConfig)
                        .respectGlobalLimits,
                  ).length
                }
              </Text>
            </Box>
          </InlineStack>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="span" variant="headingMd">
            Frequency Capping Features
          </Text>

          <BlockStack gap="300">
            <Box>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Per-Campaign Limits
              </Text>
              <Text as="span" variant="bodyMd">
                Control how often each campaign can be shown to the same user
              </Text>
            </Box>

            <Box>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Cross-Campaign Coordination
              </Text>
              <Text as="span" variant="bodyMd">
                Prevent popup fatigue with global limits across all campaigns
              </Text>
            </Box>

            <Box>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Cooldown Periods
              </Text>
              <Text as="span" variant="bodyMd">
                Set minimum time between popup displays for better user
                experience
              </Text>
            </Box>

            <Box>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Time-Based Windows
              </Text>
              <Text as="span" variant="bodyMd">
                Configure limits per session, hour, day, week, or month
              </Text>
            </Box>
          </BlockStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );

  const renderCampaignsTab = () => (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="span" variant="headingMd">
            Campaign Frequency Rules
          </Text>

          {campaigns.length > 0 ? (
            <DataTable
              columnContentTypes={[
                "text",
                "text",
                "text",
                "text",
                "text",
                "text",
              ]}
              headings={[
                "Campaign",
                "Session Limit",
                "Daily Limit",
                "Cooldown",
                "Global Limits",
                "Actions",
              ]}
              rows={getCampaignTableRows()}
            />
          ) : (
            <Box padding="400">
              <Text as="span" variant="bodyMd" alignment="center">
                No campaigns found. Create a campaign to configure frequency
                capping.
              </Text>
            </Box>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
  );

  const renderTestingTab = () => (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="span" variant="headingMd">
            Frequency Capping Testing
          </Text>

          <InlineStack gap="400">
            <Box minWidth="300px">
              <TextField
                autoComplete="off"
                label="Test Session ID"
                value={testSessionId}
                onChange={setTestSessionId}
                placeholder="Enter session ID to test"
                helpText="Use a session ID to test frequency capping rules"
              />
            </Box>

            <Button onClick={() => onResetFrequency(testSessionId)}>
              Reset All Frequency
            </Button>
          </InlineStack>

          {testResults && (
            <Box
              padding="400"
              background="bg-surface-secondary"
              borderRadius="200"
            >
              <BlockStack gap="300">
                <Text as="span" variant="headingMd">
                  Test Results
                </Text>
                <pre style={{ fontSize: "12px", overflow: "auto" }}>
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </BlockStack>
            </Box>
          )}
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="span" variant="headingMd">
            Testing Guidelines
          </Text>

          <BlockStack gap="300">
            <Box>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Session Testing
              </Text>
              <Text as="span" variant="bodyMd">
                Use consistent session IDs to test session-based limits
              </Text>
            </Box>

            <Box>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Time-Based Testing
              </Text>
              <Text as="span" variant="bodyMd">
                Daily/weekly limits are based on real time - use reset function
                for testing
              </Text>
            </Box>

            <Box>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Cooldown Testing
              </Text>
              <Text as="span" variant="bodyMd">
                Cooldown periods prevent immediate re-display - check next
                allowed time
              </Text>
            </Box>
          </BlockStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );

  const renderAnalyticsTab = () => (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="span" variant="headingMd">
            Frequency Capping Analytics
          </Text>

          <Text as="span" variant="bodyMd">
            Analytics for frequency capping effectiveness will be available
            here. This includes blocked displays, user experience metrics, and
            optimization suggestions.
          </Text>
        </BlockStack>
      </Card>
    </BlockStack>
  );

  return (
    <Page
      title="Frequency Capping & Deduplication"
      subtitle="Manage popup frequency limits and prevent user fatigue"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box padding="400">
                {selectedTab === 0 && renderOverviewTab()}
                {selectedTab === 1 && renderCampaignsTab()}
                {selectedTab === 2 && renderTestingTab()}
                {selectedTab === 3 && renderAnalyticsTab()}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Edit Frequency Rules Modal */}
      {editingCampaign && (
        <Modal
          open={!!editingCampaign}
          onClose={() => setEditingCampaign(null)}
          title={`Edit Frequency Rules: ${editingCampaign.name}`}
          primaryAction={{
            content: "Save Rules",
            onAction: handleSaveFrequencyRules,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setEditingCampaign(null),
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <TextField
                autoComplete="off"
                label="Max Per Session"
                type="number"
                value={
                  editingCampaign.frequencyRules.maxPerSession?.toString() || ""
                }
                onChange={(value) =>
                  setEditingCampaign({
                    ...editingCampaign,
                    frequencyRules: {
                      ...editingCampaign.frequencyRules,
                      maxPerSession: parseInt(value) || undefined,
                    },
                  })
                }
                helpText="Maximum displays per user session"
              />

              <TextField
                autoComplete="off"
                label="Max Per Day"
                type="number"
                value={
                  editingCampaign.frequencyRules.maxPerDay?.toString() || ""
                }
                onChange={(value) =>
                  setEditingCampaign({
                    ...editingCampaign,
                    frequencyRules: {
                      ...editingCampaign.frequencyRules,
                      maxPerDay: parseInt(value) || undefined,
                    },
                  })
                }
                helpText="Maximum displays per day"
              />

              <TextField
                autoComplete="off"
                label="Cooldown Hours"
                type="number"
                value={
                  editingCampaign.frequencyRules.cooldownHours?.toString() || ""
                }
                onChange={(value) =>
                  setEditingCampaign({
                    ...editingCampaign,
                    frequencyRules: {
                      ...editingCampaign.frequencyRules,
                      cooldownHours: parseInt(value) || undefined,
                    },
                  })
                }
                helpText="Hours to wait before showing again"
              />
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
