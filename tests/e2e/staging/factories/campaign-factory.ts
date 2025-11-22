import { PrismaClient } from '@prisma/client';
import type { TemplateType } from '~/domains/campaigns/types/campaign';

/**
 * Campaign Factory for E2E Testing
 * 
 * Generates campaign configurations with type-safe builders
 * All campaigns created by this factory are prefixed with "E2E-Test-"
 * for easy identification and cleanup.
 */

export interface BaseCampaignConfig {
    name: string;
    templateType: TemplateType;
    templateId: string;
    storeId: string;
    status: 'ACTIVE' | 'DRAFT';
    priority: number;
    goal: 'NEWSLETTER_SIGNUP' | 'INCREASE_REVENUE' | 'ENGAGEMENT';
    targetRules: any;
    contentConfig: any;
    designConfig: any;
    discountConfig?: any;
}

export class CampaignFactory {
    private prisma: PrismaClient;
    private storeId: string;
    private templateCache: Map<TemplateType, string> = new Map();

    constructor(prisma: PrismaClient, storeId: string) {
        this.prisma = prisma;
        this.storeId = storeId;
    }

    /**
     * Get template ID for a given template type
     * Results are cached to avoid repeated database queries
     */
    private async getTemplateId(templateType: TemplateType): Promise<string> {
        if (this.templateCache.has(templateType)) {
            return this.templateCache.get(templateType)!;
        }

        const template = await this.prisma.template.findFirst({
            where: { templateType }
        });

        if (!template) {
            throw new Error(`Template not found for type: ${templateType}`);
        }

        this.templateCache.set(templateType, template.id);
        return template.id;
    }

    /**
     * Create base campaign configuration with required fields
     */
    private async createBaseConfig(templateType: TemplateType): Promise<BaseCampaignConfig> {
        const templateId = await this.getTemplateId(templateType);

        return {
            name: `E2E-Test-${templateType}-${Date.now()}`,
            templateType,
            templateId,
            storeId: this.storeId,
            status: 'ACTIVE',
            priority: 15, // High priority to ensure test campaigns are selected
            goal: 'NEWSLETTER_SIGNUP',
            // Complete targetRules structure (required to pass filters)
            targetRules: {
                pageTargeting: {
                    enabled: false,
                    pages: [],
                    excludePages: [],
                    collections: [],
                    productTags: [],
                    customPatterns: []
                },
                enhancedTriggers: {
                    enabled: true,
                    page_load: {
                        enabled: true,
                        delay: 0
                    },
                    device_targeting: {
                        enabled: true,
                        device_types: ['desktop', 'tablet', 'mobile']
                    },
                    frequency_capping: {
                        max_triggers_per_session: 1,
                        max_triggers_per_day: 1,
                        cooldown_between_triggers: 86400
                    }
                },
                audienceTargeting: {
                    enabled: false,
                    shopifySegmentIds: [],
                    sessionRules: {
                        enabled: false,
                        conditions: [],
                        logicOperator: 'AND'
                    }
                }
            },
            contentConfig: {},
            designConfig: {
                theme: 'modern'
            }
        };
    }

    /**
     * Create a Spin to Win campaign builder
     */
    spinToWin() {
        return new SpinToWinBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Create a Newsletter campaign builder
     */
    newsletter() {
        return new NewsletterBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Create a Cart Abandonment campaign builder
     */
    cartAbandonment() {
        return new CartAbandonmentBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Internal method used by builders to create campaigns
     */
    async _createCampaign(config: BaseCampaignConfig) {
        return this.prisma.campaign.create({
            data: config
        });
    }

    /**
     * Internal method used by builders to get base config
     */
    async _getBaseConfig(templateType: TemplateType): Promise<BaseCampaignConfig> {
        return this.createBaseConfig(templateType);
    }
}

/**
 * Base builder class with common configuration methods
 */
class BaseBuilder<T extends BaseBuilder<T>> {
    protected config: BaseCampaignConfig | null = null;
    protected prisma: PrismaClient;
    protected storeId: string;
    protected factory: CampaignFactory;

    constructor(prisma: PrismaClient, storeId: string, factory: CampaignFactory) {
        this.prisma = prisma;
        this.storeId = storeId;
        this.factory = factory;
    }

    /**
     * Set custom name for the campaign
     */
    withName(name: string): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.name = `E2E-Test-${name}`;
        return this as unknown as T;
    }

    /**
     * Set priority (default: 15)
     */
    withPriority(priority: number): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.priority = priority;
        return this as unknown as T;
    }

    /**
     * Set campaign goal
     */
    withGoal(goal: 'NEWSLETTER_SIGNUP' | 'INCREASE_REVENUE' | 'ENGAGEMENT'): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.goal = goal;
        return this as unknown as T;
    }

    /**
     * Enable/disable specific pages targeting
     */
    withPageTargeting(pages: string[], enabled: boolean = true): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.pageTargeting = {
            ...this.config.targetRules.pageTargeting,
            enabled,
            pages
        };
        return this as unknown as T;
    }

    /**
     * Set trigger delay
     */
    withTriggerDelay(delayMs: number): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.page_load.delay = delayMs;
        return this as unknown as T;
    }

    /**
     * Create the campaign in the database
     */
    async create() {
        if (!this.config) throw new Error('Config not initialized');
        return this.factory._createCampaign(this.config);
    }
}

/**
 * Spin to Win Campaign Builder
 */
export class SpinToWinBuilder extends BaseBuilder<SpinToWinBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('SPIN_TO_WIN');
        this.config.contentConfig = {
            headline: 'Spin & Win!',
            subheadline: 'Try your luck for a discount',
            wheelSegments: [
                { id: '1', label: '10% Off', color: '#FF6B6B', probability: 25 },
                { id: '2', label: '15% Off', color: '#4ECDC4', probability: 25 },
                { id: '3', label: '20% Off', color: '#45B7D1', probability: 25 },
                { id: '4', label: 'Free Shipping', color: '#FFA07A', probability: 25 },
            ],
            emailRequired: true,
            collectName: false,
            buttonText: 'Spin Now!',
        };
        return this;
    }

    /**
     * Set wheel segments
     */
    withSegments(segments: Array<{ id?: string; label: string; color: string; probability: number }>): this {
        if (!this.config) throw new Error('Config not initialized');
        const segmentsWithIds = segments.map((seg, idx) => ({
            id: seg.id || `segment-${idx}`,
            label: seg.label,
            color: seg.color,
            probability: seg.probability
        }));
        this.config.contentConfig.wheelSegments = segmentsWithIds;
        return this;
    }

    /**
     * Require email
     */
    withEmailRequired(required: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.emailRequired = required;
        return this;
    }

    /**
     * Collect name
     */
    withNameCollection(enabled: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.collectName = enabled;
        return this;
    }

    /**
     * Set headline text
     */
    withHeadline(headline: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.headline = headline;
        return this;
    }
}

/**
 * Newsletter Campaign Builder
 */
export class NewsletterBuilder extends BaseBuilder<NewsletterBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('NEWSLETTER');
        this.config.contentConfig = {
            headline: 'Get 10% Off Your First Order',
            subheadline: 'Subscribe to our newsletter',
            buttonText: 'Subscribe',
            emailPlaceholder: 'Enter your email',
            collectName: false,
            showGdprCheckbox: false,
        };
        return this;
    }

    /**
     * Enable GDPR checkbox
     */
    withGdprCheckbox(enabled: boolean = true, text?: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.showGdprCheckbox = enabled;
        if (text) {
            this.config.contentConfig.gdprLabel = text;
        }
        return this;
    }

    /**
     * Set headline text
     */
    withHeadline(headline: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.headline = headline;
        return this;
    }
}

/**
 * Cart Abandonment Campaign Builder
 */
export class CartAbandonmentBuilder extends BaseBuilder<CartAbandonmentBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('CART_ABANDONMENT');
        this.config.contentConfig = {
            headline: "Don't Miss Out!",
            subheadline: 'Complete your purchase and get a special discount',
            buttonText: 'Complete Purchase',
            emailPlaceholder: 'Enter your email to save your cart',
            discountPercentage: 10,
        };
        return this;
    }

    /**
     * Set discount percentage
     */
    withDiscountPercentage(percentage: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.discountPercentage = percentage;
        return this;
    }

    /**
     * Set headline text
     */
    withHeadline(headline: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.headline = headline;
        return this;
    }
}
