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
            priority: 100, // Very high priority to ensure test campaigns are selected
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
     * Create a Scratch Card campaign builder
     */
    scratchCard() {
        return new ScratchCardBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Create a Product Upsell campaign builder
     */
    productUpsell() {
        return new ProductUpsellBuilder(this.prisma, this.storeId, this);
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
     * Set frequency capping rules
     */
    withFrequencyCapping(triggersPerSession: number = 1, triggersPerDay: number = 1, cooldownSeconds: number = 86400): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.frequency_capping = {
            max_triggers_per_session: triggersPerSession,
            max_triggers_per_day: triggersPerDay,
            cooldown_between_triggers: cooldownSeconds
        };
        return this as unknown as T;
    }

    /**
     * Set session targeting (new vs returning)
     */
    withSessionTargeting(type: 'all' | 'new_visitor' | 'returning_visitor'): T {
        if (!this.config) throw new Error('Config not initialized');

        const conditions: any[] = [];
        if (type === 'new_visitor') {
            conditions.push({
                field: 'isReturningVisitor',
                operator: 'eq',
                value: false
            });
        } else if (type === 'returning_visitor') {
            conditions.push({
                field: 'isReturningVisitor',
                operator: 'eq',
                value: true
            });
        }

        this.config.targetRules.audienceTargeting.sessionRules = {
            enabled: conditions.length > 0,
            conditions,
            logicOperator: 'AND'
        };

        // Ensure audienceTargeting is enabled if we have rules
        if (conditions.length > 0) {
            this.config.targetRules.audienceTargeting.enabled = true;
        }

        return this as unknown as T;
    }

    /**
     * Set device targeting
     */
    withDeviceTargeting(devices: Array<'desktop' | 'tablet' | 'mobile'>): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.device_targeting = {
            enabled: true,
            device_types: devices
        };
        return this as unknown as T;
    }

    /**
     * Set scroll depth trigger
     */
    withScrollDepthTrigger(depthPercentage: number = 50, direction: 'down' | 'up' = 'down'): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.scroll_depth = {
            enabled: true,
            depth_percentage: depthPercentage,
            direction,
            debounce_time: 100
        };
        return this as unknown as T;
    }

    /**
     * Set time delay trigger
     */
    withTimeDelayTrigger(delaySeconds: number): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.time_delay = {
            enabled: true,
            delay: delaySeconds,
            immediate: false
        };
        return this as unknown as T;
    }

    /**
     * Set trigger combination logic (AND/OR)
     */
    withTriggerLogic(operator: 'AND' | 'OR'): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.trigger_combination = {
            operator
        };
        return this as unknown as T;
    }

    /**
     * Disable page_load trigger (useful when testing other triggers)
     */
    withoutPageLoadTrigger(): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.page_load = {
            enabled: false
        };
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
                { id: '1', label: '10% Off', color: '#FF6B6B', probability: 0.25 },
                { id: '2', label: '15% Off', color: '#4ECDC4', probability: 0.25 },
                { id: '3', label: '20% Off', color: '#45B7D1', probability: 0.25 },
                { id: '4', label: 'Free Shipping', color: '#FFA07A', probability: 0.25 },
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
            successMessage: 'Thanks for subscribing!',
            emailPlaceholder: 'Enter your email',
            emailRequired: true,
            submitButtonText: 'Subscribe',
            nameFieldEnabled: false,
            nameFieldRequired: false,
            consentFieldEnabled: false,
            consentFieldRequired: false,
        };
        return this;
    }

    /**
     * Enable GDPR checkbox
     */
    withGdprCheckbox(enabled: boolean = true, text?: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.consentFieldEnabled = enabled;
        if (text) {
            this.config.contentConfig.consentFieldText = text;
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
            successMessage: 'Your cart has been saved!',
            showCartItems: true,
            maxItemsToShow: 3,
            showCartTotal: true,
            showUrgency: true,
            urgencyTimer: 300,
            urgencyMessage: 'Hurry! Your cart is reserved for 5 minutes',
            showStockWarnings: false,
            ctaUrl: 'checkout',
            currency: 'USD',
            enableEmailRecovery: false,
            emailPlaceholder: 'Enter your email to save your cart',
        };
        return this;
    }

    /**
     * Enable email recovery flow
     */
    withEmailRecovery(enabled: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.enableEmailRecovery = enabled;
        return this;
    }

    /**
     * Set urgency timer (in seconds)
     */
    withUrgencyTimer(seconds: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.urgencyTimer = seconds;
        this.config.contentConfig.urgencyMessage = `Hurry! Your cart is reserved for ${Math.floor(seconds / 60)} minutes`;
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
 * Scratch Card Campaign Builder
 */
export class ScratchCardBuilder extends BaseBuilder<ScratchCardBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('SCRATCH_CARD');
        this.config.contentConfig = {
            headline: 'Scratch & Win!',
            subheadline: 'Scratch the card to reveal your prize',
            buttonText: 'Claim Prize',
            successMessage: 'Congratulations!',
            scratchInstruction: 'Scratch to reveal your prize!',
            emailRequired: true,
            emailPlaceholder: 'Enter your email to claim',
            emailBeforeScratching: false,
            scratchThreshold: 50,
            scratchRadius: 20,
            prizes: [
                { id: '1', label: '10% Off', probability: 0.4 },
                { id: '2', label: '15% Off', probability: 0.3 },
                { id: '3', label: '20% Off', probability: 0.2 },
                { id: '4', label: 'Free Shipping', probability: 0.1 },
            ],
        };
        return this;
    }

    /**
     * Set prizes with probabilities
     */
    withPrizes(prizes: Array<{ id?: string; label: string; probability: number }>): this {
        if (!this.config) throw new Error('Config not initialized');
        const prizesWithIds = prizes.map((prize, idx) => ({
            id: prize.id || `prize-${idx}`,
            label: prize.label,
            probability: prize.probability,
        }));
        this.config.contentConfig.prizes = prizesWithIds;
        return this;
    }

    /**
     * Set scratch threshold (percentage)
     */
    withScratchThreshold(threshold: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.scratchThreshold = threshold;
        return this;
    }

    /**
     * Require email before scratching
     */
    withEmailBeforeScratching(required: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.emailBeforeScratching = required;
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
 * Product Upsell Campaign Builder
 */
export class ProductUpsellBuilder extends BaseBuilder<ProductUpsellBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('PRODUCT_UPSELL');
        this.config.contentConfig = {
            headline: 'You Might Also Like',
            subheadline: 'Complete your order with these products',
            buttonText: 'Add to Cart',
            successMessage: 'Added to cart!',
            productSelectionMethod: 'ai',
            maxProducts: 3,
            layout: 'grid',
            columns: 2,
            showPrices: true,
            showCompareAtPrice: true,
            showImages: true,
            showRatings: false,
            showReviewCount: false,
            bundleDiscount: 15,
            multiSelect: true,
            currency: 'USD',
        };
        return this;
    }

    /**
     * Set product selection method
     */
    withProductSelectionMethod(method: 'ai' | 'manual' | 'collection'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.productSelectionMethod = method;
        return this;
    }

    /**
     * Set selected products (for manual selection)
     */
    withSelectedProducts(productIds: string[]): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.productSelectionMethod = 'manual';
        this.config.contentConfig.selectedProducts = productIds;
        return this;
    }

    /**
     * Set layout
     */
    withLayout(layout: 'grid' | 'carousel' | 'card'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.layout = layout;
        return this;
    }

    /**
     * Set bundle discount percentage
     */
    withBundleDiscount(percentage: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.bundleDiscount = percentage;
        this.config.contentConfig.bundleDiscountText = `Save ${percentage}% when you bundle!`;
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
