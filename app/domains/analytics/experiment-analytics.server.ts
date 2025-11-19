/**
 * Experiment Analytics Service
 *
 * Aggregates performance metrics by variant for A/B testing experiments
 */

import prisma from "~/db.server";

export interface VariantMetrics {
    variantKey: string;
    campaignId: string;
    campaignName: string;
    isControl: boolean;
    impressions: number;
    clicks: number;
    submissions: number;
    couponsIssued: number;
    conversionRate: number;
    orders: number;
    revenue: number;
    averageOrderValue: number;
    revenuePerVisitor: number;
}

export interface VariantComparison {
    variants: VariantMetrics[];
    winner: string | null; // variantKey of winner, if statistically significant
    pValue: number | null;
    isSignificant: boolean;
}

/**
 * Get performance metrics for all variants in an experiment
 */
export async function getVariantPerformance(
    experimentId: string,
    storeId: string
): Promise<VariantComparison> {
    // 1. Get all campaigns (variants) in this experiment
    const campaigns = await prisma.campaign.findMany({
        where: {
            experimentId,
            storeId,
        },
        select: {
            id: true,
            name: true,
            variantKey: true,
            isControl: true,
        },
    });

    if (campaigns.length === 0) {
        return {
            variants: [],
            winner: null,
            pValue: null,
            isSignificant: false,
        };
    }

    const campaignIds = campaigns.map((c) => c.id);

    // 2. Get event counts per campaign
    const eventCounts = await prisma.popupEvent.groupBy({
        by: ["campaignId", "eventType"],
        where: {
            campaignId: { in: campaignIds },
            experimentId,
        },
        _count: {
            id: true,
        },
    });

    // 3. Get revenue data per campaign
    const revenueData = await prisma.campaignConversion.groupBy({
        by: ["campaignId"],
        where: {
            campaignId: { in: campaignIds },
        },
        _sum: {
            totalPrice: true,
        },
        _count: {
            id: true,
        },
    });

    // 4. Build metrics per variant
    const variants: VariantMetrics[] = campaigns.map((campaign) => {
        const campaignEvents = eventCounts.filter(
            (e) => e.campaignId === campaign.id
        );

        const impressions =
            campaignEvents.find((e) => e.eventType === "VIEW")?._count.id || 0;
        const clicks =
            campaignEvents.find((e) => e.eventType === "CLICK")?._count.id || 0;
        const submissions =
            campaignEvents.find((e) => e.eventType === "SUBMIT")?._count.id || 0;
        const couponsIssued =
            campaignEvents.find((e) => e.eventType === "COUPON_ISSUED")?._count.id ||
            0;

        const revenue = revenueData.find((r) => r.campaignId === campaign.id);
        const orders = revenue?._count.id || 0;
        const totalRevenue = revenue?._sum.totalPrice
            ? Number(revenue._sum.totalPrice)
            : 0;

        const conversionRate = impressions > 0 ? (submissions / impressions) * 100 : 0;
        const averageOrderValue = orders > 0 ? totalRevenue / orders : 0;
        const revenuePerVisitor = impressions > 0 ? totalRevenue / impressions : 0;

        return {
            variantKey: campaign.variantKey || "UNKNOWN",
            campaignId: campaign.id,
            campaignName: campaign.name,
            isControl: campaign.isControl || false,
            impressions,
            clicks,
            submissions,
            couponsIssued,
            conversionRate,
            orders,
            revenue: totalRevenue,
            averageOrderValue,
            revenuePerVisitor,
        };
    });

    // 5. Calculate statistical significance (if 2 variants)
    let winner: string | null = null;
    let pValue: number | null = null;
    let isSignificant = false;

    if (variants.length === 2) {
        const [variantA, variantB] = variants;
        const significance = calculateStatisticalSignificance(variantA, variantB);
        pValue = significance.pValue;
        isSignificant = significance.isSignificant;

        if (isSignificant) {
            // Determine winner based on conversion rate
            winner =
                variantA.conversionRate > variantB.conversionRate
                    ? variantA.variantKey
                    : variantB.variantKey;
        }
    }

    return {
        variants,
        winner,
        pValue,
        isSignificant,
    };
}

/**
 * Calculate statistical significance between two variants using chi-squared test
 */
function calculateStatisticalSignificance(
    variantA: VariantMetrics,
    variantB: VariantMetrics
): { pValue: number; isSignificant: boolean } {
    const n1 = variantA.impressions;
    const n2 = variantB.impressions;
    const x1 = variantA.submissions;
    const x2 = variantB.submissions;

    // Need minimum sample size
    if (n1 < 30 || n2 < 30) {
        return { pValue: 1, isSignificant: false };
    }

    // Pool proportions for chi-squared test
    const p1 = n1 > 0 ? x1 / n1 : 0;
    const p2 = n2 > 0 ? x2 / n2 : 0;
    const pPool = (x1 + x2) / (n1 + n2);

    // Calculate chi-squared statistic
    const expected1 = n1 * pPool;
    const expected2 = n2 * pPool;

    if (expected1 === 0 || expected2 === 0) {
        return { pValue: 1, isSignificant: false };
    }

    const chiSquared =
        Math.pow(x1 - expected1, 2) / expected1 +
        Math.pow(n1 - x1 - (n1 - expected1), 2) / (n1 - expected1) +
        Math.pow(x2 - expected2, 2) / expected2 +
        Math.pow(n2 - x2 - (n2 - expected2), 2) / (n2 - expected2);

    // Approximate p-value using chi-squared distribution (df=1)
    // For simplicity, using a lookup table approach
    const pValue = chiSquaredToPValue(chiSquared);

    // Significant if p < 0.05
    const isSignificant = pValue < 0.05;

    return { pValue, isSignificant };
}

/**
 * Convert chi-squared statistic to p-value (df=1)
 * Simplified lookup for common values
 */
function chiSquaredToPValue(chiSquared: number): number {
    // Critical values for chi-squared distribution (df=1)
    const criticalValues = [
        { chi: 3.841, p: 0.05 },
        { chi: 6.635, p: 0.01 },
        { chi: 10.828, p: 0.001 },
    ];

    if (chiSquared < 3.841) return 0.05; // p > 0.05
    if (chiSquared < 6.635) return 0.025;
    if (chiSquared < 10.828) return 0.005;
    return 0.001; // p < 0.001
}
