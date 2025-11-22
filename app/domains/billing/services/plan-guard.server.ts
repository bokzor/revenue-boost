import prisma from "~/db.server";
import { PLAN_DEFINITIONS, type PlanTier, type PlanFeatures } from "../types/plan";
import { PlanLimitError } from "../errors";

export class PlanGuardService {
	static async getPlanContext(storeId: string) {
		const store = await prisma.store.findUnique({
			where: { id: storeId },
			select: { planTier: true, planStatus: true },
		});

		if (!store) {
			throw new Error(`Store not found: ${storeId}`);
		}

		const planDefinition = PLAN_DEFINITIONS[store.planTier as PlanTier];
		return {
			planTier: store.planTier as PlanTier,
			planStatus: store.planStatus,
			definition: planDefinition,
		};
	}

	/** Ensure a given feature flag is enabled on the store's current plan. */
	static async assertFeatureEnabled(
		storeId: string,
		feature: keyof PlanFeatures,
	) {
		const { planTier, definition } = await this.getPlanContext(storeId);
		if (!definition.features[feature]) {
			throw new PlanLimitError(
				`${definition.name} plan does not include ${feature}.`,
				{ feature, planTier },
			);
		}
	}

	static async assertCanCreateCampaign(storeId: string) {
		const { planTier, definition } = await this.getPlanContext(storeId);
		const limit = definition.limits.maxActiveCampaigns;

		if (limit === null) return; // Unlimited

		const activeCampaignsCount = await prisma.campaign.count({
			where: {
				storeId,
				status: "ACTIVE",
			},
		});

		if (activeCampaignsCount >= limit) {
			throw new PlanLimitError(
				`Plan limit reached: You can only have ${limit} active campaign(s) on the ${definition.name} plan.`,
				{
					limitType: "maxActiveCampaigns",
					current: activeCampaignsCount,
					max: limit,
					planTier,
				},
			);
		}
	}

	static async assertCanCreateExperiment(storeId: string) {
		const { planTier, definition } = await this.getPlanContext(storeId);

		if (!definition.features.experiments) {
			throw new PlanLimitError(
				`Experiments are not available on the ${definition.name} plan.`,
				{
					feature: "experiments",
					planTier,
				},
			);
		}

		const limit = definition.limits.maxExperiments;
		if (limit === null) return; // Unlimited

		const activeExperimentsCount = await prisma.experiment.count({
			where: {
				storeId,
				status: { in: ["RUNNING", "DRAFT"] }, // Count drafts too
			},
		});

		if (activeExperimentsCount >= limit) {
			throw new PlanLimitError(
				`Plan limit reached: You can only have ${limit} experiment(s) on the ${definition.name} plan.`,
				{
					limitType: "maxExperiments",
					current: activeExperimentsCount,
					max: limit,
					planTier,
				},
			);
		}
	}

	static async assertCanAddVariant(storeId: string, experimentId: string) {
		const { planTier, definition } = await this.getPlanContext(storeId);
		const limit = definition.limits.maxVariantsPerExperiment;

		const currentVariantsCount = await prisma.campaign.count({
			where: {
				storeId,
				experimentId,
			},
		});

		if (currentVariantsCount >= limit) {
			throw new PlanLimitError(
				`Plan limit reached: You can only have ${limit} variants per experiment on the ${definition.name} plan.`,
				{
					limitType: "maxVariantsPerExperiment",
					current: currentVariantsCount,
					max: limit,
					planTier,
				},
			);
		}
	}

	/** Hard cap on number of custom (store-owned) templates. */
	static async assertCanCreateCustomTemplate(storeId: string) {
		const { planTier, definition } = await this.getPlanContext(storeId);
		const limit = definition.limits.maxCustomTemplates;
		if (limit === null) return; // Unlimited

		const current = await prisma.template.count({
			where: { storeId, isDefault: false },
		});

		if (current >= limit) {
			throw new PlanLimitError(
				`Plan limit reached: You can only have ${limit} custom template(s) on the ${definition.name} plan.`,
				{
					limitType: "maxCustomTemplates",
					current,
					max: limit,
					planTier,
				},
			);
		}
	}

	/** Ensure the store is still within its monthly impression cap (VIEW events). */
	static async assertWithinMonthlyImpressionCap(storeId: string) {
		const { planTier, definition } = await this.getPlanContext(storeId);
		const cap = definition.monthlyImpressionCap;
		if (cap == null) return; // Unlimited impressions

		const startOfMonth = new Date();
		startOfMonth.setUTCDate(1);
		startOfMonth.setUTCHours(0, 0, 0, 0);

		const current = await prisma.popupEvent.count({
			where: {
				storeId,
				eventType: "VIEW",
				createdAt: { gte: startOfMonth },
			},
		});

		if (current >= cap) {
			throw new PlanLimitError(
				`Plan limit reached: You have hit your monthly impression cap (${cap.toLocaleString()}) on the ${definition.name} plan.`,
				{
					limitType: "monthlyImpressionCap",
					current,
					max: cap,
					planTier,
				},
			);
		}
	}
}
