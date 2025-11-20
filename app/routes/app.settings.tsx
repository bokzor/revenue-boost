import { type LoaderFunctionArgs, type ActionFunctionArgs, data } from "react-router";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";

import type { PlanTier } from "../domains/billing/types/plan";

interface DowngradeDetails {
    campaigns: { current: number; limit: number } | null;
    experiments: { current: number; limit: number } | null;
    targetPlan: PlanTier;
}

interface SettingsActionData {
    error?: string;
    details?: DowngradeDetails;
    success?: boolean;
}
import {
    Page,
    Layout,
    Card,
    BlockStack,
    Text,
    Badge,
    Button,
    DataTable,
    Box,
    InlineGrid,
    Divider,
    ProgressBar,
    Icon,
    Modal,
    Banner,
} from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { PLAN_DEFINITIONS, PLAN_ORDER } from "../domains/billing/types/plan";
import { PlanGuardService } from "../domains/billing/services/plan-guard.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const store = await prisma.store.findUnique({
        where: { shopifyDomain: session.shop },
    });

    if (!store) {
        throw new Response("Store not found", { status: 404 });
    }

    const planContext = await PlanGuardService.getPlanContext(store.id);

    // Calculate usage
    const activeCampaignsCount = await prisma.campaign.count({
        where: {
            storeId: store.id,
            status: "ACTIVE",
        },
    });

    const experimentsCount = await prisma.experiment.count({
        where: {
            storeId: store.id,
            status: { in: ["RUNNING", "DRAFT"] },
        },
    });

    // Calculate monthly impressions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyImpressionsCount = await prisma.popupEvent.count({
        where: {
            storeId: store.id,
            eventType: "VIEW",
            createdAt: {
                gte: startOfMonth,
            },
        },
    });

    return {
        planContext,
        usage: {
            activeCampaigns: activeCampaignsCount,
            experiments: experimentsCount,
            monthlyImpressions: monthlyImpressionsCount,
        },
        PLAN_DEFINITIONS,
        PLAN_ORDER,
    };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const targetPlan = formData.get("targetPlan") as PlanTier;

    if (!targetPlan || !PLAN_DEFINITIONS[targetPlan]) {
        return data({ error: "Invalid plan selected" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
        where: { shopifyDomain: session.shop },
    });

    if (!store) {
        throw new Response("Store not found", { status: 404 });
    }

    const forceDowngrade = formData.get("forceDowngrade") === "true";
    const targetDefinition = PLAN_DEFINITIONS[targetPlan];

    // Check limits
    let activeCampaignsCount = 0;
    let experimentsCount = 0;

    if (targetDefinition.limits.maxActiveCampaigns !== null) {
        activeCampaignsCount = await prisma.campaign.count({
            where: { storeId: store.id, status: "ACTIVE" },
        });
    }

    if (targetDefinition.limits.maxExperiments !== null) {
        experimentsCount = await prisma.experiment.count({
            where: { storeId: store.id, status: { in: ["RUNNING", "DRAFT"] } },
        });
    }

    const campaignLimitExceeded = targetDefinition.limits.maxActiveCampaigns !== null && activeCampaignsCount > targetDefinition.limits.maxActiveCampaigns;
    const experimentLimitExceeded = targetDefinition.limits.maxExperiments !== null && experimentsCount > targetDefinition.limits.maxExperiments;

    if ((campaignLimitExceeded || experimentLimitExceeded) && !forceDowngrade) {
        return data({
            error: "LIMIT_EXCEEDED",
            details: {
                campaigns: campaignLimitExceeded ? { current: activeCampaignsCount, limit: targetDefinition.limits.maxActiveCampaigns } : null,
                experiments: experimentLimitExceeded ? { current: experimentsCount, limit: targetDefinition.limits.maxExperiments } : null,
                targetPlan,
            }
        }, { status: 400 });
    }

    // Handle forced downgrade (auto-deactivate)
    if (forceDowngrade) {
        if (campaignLimitExceeded && targetDefinition.limits.maxActiveCampaigns !== null) {
            // Fetch all active campaigns sorted by updatedAt desc (keep newest)
            const activeCampaigns = await prisma.campaign.findMany({
                where: { storeId: store.id, status: "ACTIVE" },
                orderBy: { updatedAt: "desc" },
                select: { id: true },
            });

            // Identify campaigns to deactivate (skip the first N allowed)
            const campaignsToDeactivate = activeCampaigns.slice(targetDefinition.limits.maxActiveCampaigns);
            const idsToDeactivate = campaignsToDeactivate.map(c => c.id);

            if (idsToDeactivate.length > 0) {
                await prisma.campaign.updateMany({
                    where: { id: { in: idsToDeactivate } },
                    data: { status: "PAUSED" },
                });
            }
        }

        if (experimentLimitExceeded && targetDefinition.limits.maxExperiments !== null) {
            // Fetch all active experiments sorted by updatedAt desc
            const activeExperiments = await prisma.experiment.findMany({
                where: { storeId: store.id, status: { in: ["RUNNING", "DRAFT"] } },
                orderBy: { updatedAt: "desc" },
                select: { id: true },
            });

            const experimentsToArchive = activeExperiments.slice(targetDefinition.limits.maxExperiments);
            const idsToArchive = experimentsToArchive.map(e => e.id);

            if (idsToArchive.length > 0) {
                await prisma.experiment.updateMany({
                    where: { id: { in: idsToArchive } },
                    data: { status: "ARCHIVED" },
                });
            }
        }
    }

    // Update plan
    await prisma.store.update({
        where: { id: store.id },
        data: {
            planTier: targetPlan,
            planStatus: "ACTIVE",
        },
    });

    return { success: true };
};

export default function SettingsPage() {
    const { planContext, usage, PLAN_DEFINITIONS, PLAN_ORDER } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const navigation = useNavigation();
    const isLoading = navigation.state === "submitting";

    const currentPlan = planContext.planTier;
    const currentDefinition = PLAN_DEFINITIONS[currentPlan];

    const handleUpgrade = (targetPlan: PlanTier) => {
        const formData = new FormData();
        formData.append("targetPlan", targetPlan);
        submit(formData, { method: "post" });
    };

    const actionData = useActionData<typeof action>() as SettingsActionData | undefined;
    const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
    const [downgradeDetails, setDowngradeDetails] = useState<DowngradeDetails | null>(null);

    useEffect(() => {
        if (!actionData) return;

        if (actionData.error === "LIMIT_EXCEEDED" && actionData.details) {
            setDowngradeDetails(actionData.details);
            setIsDowngradeModalOpen(true);
        } else if (actionData.error) {
            shopify.toast.show(actionData.error, { isError: true });
        } else if (actionData.success) {
            shopify.toast.show("Plan updated successfully");
        }
    }, [actionData]);

    const handleConfirmDowngrade = () => {
        if (!downgradeDetails) return;
        const formData = new FormData();
        formData.append("targetPlan", downgradeDetails.targetPlan);
        formData.append("forceDowngrade", "true");
        submit(formData, { method: "post" });
        setIsDowngradeModalOpen(false);
    };

    const rows = PLAN_ORDER.map((tier) => {
        const def = PLAN_DEFINITIONS[tier];
        const isCurrent = tier === currentPlan;

        return [
            <Text variant="bodyMd" fontWeight="bold" as="span">{def.name}</Text>,
            <Text variant="bodyMd" as="span">${def.price}/mo</Text>,
            <Text variant="bodyMd" as="span">
                {def.monthlyImpressionCap ? `${(def.monthlyImpressionCap / 1000).toFixed(0)}k` : "Unlimited"}
            </Text>,
            <Text variant="bodyMd" as="span">{def.limits.maxActiveCampaigns === null ? "Unlimited" : def.limits.maxActiveCampaigns}</Text>,
            <Text variant="bodyMd" as="span">{def.limits.maxExperiments === null ? "Unlimited" : def.limits.maxExperiments}</Text>,
            <Box>
                {def.features.experiments ? <Icon source={CheckIcon} tone="success" /> : <Icon source={XIcon} tone="critical" />}
            </Box>,
            isCurrent ? (
                <Badge tone="success">Current</Badge>
            ) : (
                <Button
                    onClick={() => handleUpgrade(tier)}
                    loading={isLoading}
                    disabled={isLoading}
                    variant={def.price > currentDefinition.price ? "primary" : "secondary"}
                >
                    {def.price > currentDefinition.price ? "Upgrade" : "Downgrade"}
                </Button>
            ),
        ];
    });

    return (
        <Page title="Settings" subtitle="Manage your subscription and plan limits">
            <Modal
                open={isDowngradeModalOpen}
                onClose={() => setIsDowngradeModalOpen(false)}
                title="Downgrade Plan"
                primaryAction={{
                    content: "Downgrade & Deactivate",
                    onAction: handleConfirmDowngrade,
                    destructive: true,
                }}
                secondaryActions={[
                    {
                        content: "Cancel",
                        onAction: () => setIsDowngradeModalOpen(false),
                    },
                ]}
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        <Text as="p">
                            You are about to downgrade to the <strong>{downgradeDetails?.targetPlan && PLAN_DEFINITIONS[downgradeDetails.targetPlan].name}</strong> plan.
                        </Text>
                        {downgradeDetails?.campaigns && (
                            <Banner tone="warning">
                                <p>
                                    You have <strong>{downgradeDetails.campaigns.current}</strong> active campaigns, but the new plan only allows <strong>{downgradeDetails.campaigns.limit}</strong>.
                                    Proceeding will automatically deactivate the <strong>{downgradeDetails.campaigns.current - downgradeDetails.campaigns.limit}</strong> oldest active campaigns.
                                </p>
                            </Banner>
                        )}
                        {downgradeDetails?.experiments && (
                            <Banner tone="warning">
                                <p>
                                    You have <strong>{downgradeDetails.experiments.current}</strong> active experiments, but the new plan only allows <strong>{downgradeDetails.experiments.limit}</strong>.
                                    Proceeding will automatically archive the <strong>{downgradeDetails.experiments.current - downgradeDetails.experiments.limit}</strong> oldest experiments.
                                </p>
                            </Banner>
                        )}
                        <Text as="p">
                            Are you sure you want to proceed?
                        </Text>
                    </BlockStack>
                </Modal.Section>
            </Modal>
            <BlockStack gap="500">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <InlineGrid columns="1fr auto" alignItems="center">
                                    <Text variant="headingMd" as="h2">Current Subscription</Text>
                                    <Badge tone={planContext.planStatus === "ACTIVE" ? "success" : "attention"}>
                                        {planContext.planStatus}
                                    </Badge>
                                </InlineGrid>

                                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                                    <BlockStack gap="200">
                                        <Text variant="headingLg" as="p">{currentDefinition.name} Plan</Text>
                                        <Text variant="bodyMd" tone="subdued" as="p">
                                            ${currentDefinition.price}/month • Up to {currentDefinition.monthlyImpressionCap ? `${(currentDefinition.monthlyImpressionCap / 1000).toFixed(0)}k` : "Unlimited"} impressions
                                        </Text>
                                    </BlockStack>
                                </Box>

                                <Divider />

                                <Text variant="headingSm" as="h3">Usage Limits</Text>
                                <BlockStack gap="400">
                                    <Box>
                                        <InlineGrid columns="1fr auto">
                                            <Text variant="bodyMd" as="span">Monthly Impressions</Text>
                                            <Text variant="bodyMd" tone="subdued" as="span">
                                                {usage.monthlyImpressions.toLocaleString()} / {currentDefinition.monthlyImpressionCap ? `${(currentDefinition.monthlyImpressionCap / 1000).toFixed(0)}k` : "∞"}
                                            </Text>
                                        </InlineGrid>
                                        <ProgressBar
                                            progress={currentDefinition.monthlyImpressionCap ? (usage.monthlyImpressions / currentDefinition.monthlyImpressionCap) * 100 : 0}
                                            tone={currentDefinition.monthlyImpressionCap && usage.monthlyImpressions >= currentDefinition.monthlyImpressionCap ? "critical" : "primary"}
                                            size="small"
                                        />
                                    </Box>

                                    <Box>
                                        <InlineGrid columns="1fr auto">
                                            <Text variant="bodyMd" as="span">Active Campaigns</Text>
                                            <Text variant="bodyMd" tone="subdued" as="span">
                                                {usage.activeCampaigns} / {currentDefinition.limits.maxActiveCampaigns === null ? "∞" : currentDefinition.limits.maxActiveCampaigns}
                                            </Text>
                                        </InlineGrid>
                                        <ProgressBar
                                            progress={currentDefinition.limits.maxActiveCampaigns ? (usage.activeCampaigns / currentDefinition.limits.maxActiveCampaigns) * 100 : 0}
                                            tone="primary"
                                            size="small"
                                        />
                                    </Box>

                                    <Box>
                                        <InlineGrid columns="1fr auto">
                                            <Text variant="bodyMd" as="span">Experiments</Text>
                                            <Text variant="bodyMd" tone="subdued" as="span">
                                                {usage.experiments} / {currentDefinition.limits.maxExperiments === null ? "∞" : currentDefinition.limits.maxExperiments}
                                            </Text>
                                        </InlineGrid>
                                        <ProgressBar
                                            progress={currentDefinition.limits.maxExperiments ? (usage.experiments / currentDefinition.limits.maxExperiments) * 100 : 0}
                                            tone="primary"
                                            size="small"
                                        />
                                    </Box>
                                </BlockStack>
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Compare Plans</Text>
                                <DataTable
                                    columnContentTypes={["text", "numeric", "text", "text", "text", "text", "text"]}
                                    headings={["Plan", "Price", "Impressions", "Campaigns", "Experiments", "A/B Testing", "Action"]}
                                    rows={rows}
                                    hoverable
                                />
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                </Layout>
            </BlockStack>
        </Page>
    );
}
