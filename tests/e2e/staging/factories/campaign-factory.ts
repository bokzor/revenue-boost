import { PrismaClient } from '@prisma/client';
import type { TemplateType } from '~/domains/campaigns/types/campaign';
import "../helpers/load-staging-env";

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
    private testPrefix: string;

    /**
     * @param prisma - Prisma client instance
     * @param storeId - Store ID to create campaigns for
     * @param testPrefix - Optional prefix for campaign names (defaults to 'E2E-Test-')
     *                     Use getTestPrefix() from test-helpers to generate unique prefixes per test file
     */
    constructor(prisma: PrismaClient, storeId: string, testPrefix: string = 'E2E-Test-') {
        this.prisma = prisma;
        this.storeId = storeId;
        this.testPrefix = testPrefix;
    }

    /**
     * Get the test prefix used by this factory
     */
    getPrefix(): string {
        return this.testPrefix;
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
            name: `${this.testPrefix}${templateType}-${Date.now()}`,
            templateType,
            templateId,
            storeId: this.storeId,
            status: 'ACTIVE',
            priority: 99999, // Maximum priority to ensure test campaigns always show first
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
                        // E2E test campaigns should trigger freely without limits
                        max_triggers_per_session: 999,
                        max_triggers_per_day: 999,
                        cooldown_between_triggers: 0
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
     * Create a Flash Sale campaign builder
     */
    flashSale() {
        return new FlashSaleBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Create a Free Shipping campaign builder
     */
    freeShipping() {
        return new FreeShippingBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Create a Countdown Timer campaign builder
     */
    countdownTimer() {
        return new CountdownTimerBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Create an Announcement campaign builder
     */
    announcement() {
        return new AnnouncementBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Create a Social Proof campaign builder
     */
    socialProof() {
        return new SocialProofBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Create an Exit Intent campaign builder
     */
    exitIntent() {
        return new ExitIntentBuilder(this.prisma, this.storeId, this);
    }

    /**
     * Create an A/B test experiment builder
     */
    experiment() {
        return new ExperimentBuilder(this.prisma, this.storeId, this.testPrefix, this.templateCache);
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
     * Note: The factory prefix is automatically prepended
     */
    withName(name: string): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.name = `${this.factory.getPrefix()}${name}`;
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
     * Configure percentage discount (e.g., 10%, 25%, 50%)
     */
    withPercentageDiscount(percent: number, prefix: string = 'SAVE'): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.discountConfig = {
            enabled: true,
            type: 'generated',
            valueType: 'PERCENTAGE',
            value: percent,
            prefix: prefix,
            expiryDays: 30,
            usageLimit: 1,
            deliveryMode: 'show_code_always',
            showInPreview: true
        };
        return this as unknown as T;
    }

    /**
     * Configure fixed amount discount (e.g., $5, $10, $20)
     */
    withFixedAmountDiscount(amount: number, prefix: string = 'SAVE'): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.discountConfig = {
            enabled: true,
            type: 'generated',
            valueType: 'FIXED_AMOUNT',
            value: amount,
            prefix: prefix,
            expiryDays: 30,
            usageLimit: 1,
            deliveryMode: 'show_code_always',
            showInPreview: true
        };
        return this as unknown as T;
    }

    /**
     * Configure free shipping discount
     */
    withFreeShippingDiscount(prefix: string = 'FREESHIP'): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.discountConfig = {
            enabled: true,
            type: 'generated',
            valueType: 'FREE_SHIPPING',
            value: 0,
            prefix: prefix,
            expiryDays: 30,
            usageLimit: 1,
            deliveryMode: 'show_code_always',
            showInPreview: true
        };
        return this as unknown as T;
    }

    /**
     * Configure single discount code (same code for all users)
     */
    withSingleDiscountCode(code: string): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.discountConfig = {
            enabled: true,
            type: 'shared',
            singleCode: code,
            deliveryMode: 'show_code_always',
            showInPreview: true
        };
        return this as unknown as T;
    }

    /**
     * Set max impressions per session
     */
    withMaxImpressionsPerSession(max: number): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.frequency_capping = {
            ...this.config.targetRules.enhancedTriggers.frequency_capping,
            max_triggers_per_session: max
        };
        return this as unknown as T;
    }

    /**
     * Set cooldown between triggers (in seconds)
     */
    withCooldownBetweenTriggers(seconds: number): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.frequency_capping = {
            ...this.config.targetRules.enhancedTriggers.frequency_capping,
            cooldown_between_triggers: seconds
        };
        return this as unknown as T;
    }

    /**
     * Configure popup size
     */
    withPopupSize(size: 'small' | 'medium' | 'large'): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.designConfig = {
            ...this.config.designConfig,
            size
        };
        return this as unknown as T;
    }

    /**
     * Configure add-to-cart trigger
     */
    withAddToCartTrigger(): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.add_to_cart = {
            enabled: true
        };
        // Disable page_load to avoid conflicts
        this.config.targetRules.enhancedTriggers.page_load = {
            enabled: false
        };
        return this as unknown as T;
    }

    /**
     * Configure cart value threshold trigger
     */
    withCartValueTrigger(min: number, max?: number): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.cart_value = {
            enabled: true,
            min_value: min,
            max_value: max
        };
        // Disable page_load to avoid conflicts
        this.config.targetRules.enhancedTriggers.page_load = {
            enabled: false
        };
        return this as unknown as T;
    }

    /**
     * Configure exit intent trigger
     */
    withExitIntentTrigger(): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.exit_intent = {
            enabled: true,
            sensitivity: 'medium'
        };
        // Disable page_load to avoid conflicts
        this.config.targetRules.enhancedTriggers.page_load = {
            enabled: false
        };
        return this as unknown as T;
    }

    /**
     * Configure product view trigger
     * Shows popup when user views a specific product page
     */
    withProductViewTrigger(options?: {
        productIds?: string[];
        timeOnPageSeconds?: number;
        requireScroll?: boolean;
    }): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.product_view = {
            enabled: true,
            product_ids: options?.productIds || [],
            time_on_page_seconds: options?.timeOnPageSeconds ?? 0,
            require_scroll: options?.requireScroll ?? false
        };
        // Disable page_load to avoid conflicts
        this.config.targetRules.enhancedTriggers.page_load = {
            enabled: false
        };
        return this as unknown as T;
    }

    /**
     * Configure idle timer trigger
     * Shows popup after user has been inactive for specified time
     */
    withIdleTimerTrigger(idleSeconds: number = 30): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.idle_timer = {
            enabled: true,
            idle_duration: idleSeconds  // Schema expects `idle_duration`, not `idle_seconds`
        };
        // Disable page_load to avoid conflicts
        this.config.targetRules.enhancedTriggers.page_load = {
            enabled: false
        };
        return this as unknown as T;
    }

    /**
     * Configure custom event trigger
     * Shows popup when a custom DOM event is dispatched
     */
    withCustomEventTrigger(eventName: string): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.custom_event = {
            enabled: true,
            event_name: eventName
        };
        // Disable page_load to avoid conflicts
        this.config.targetRules.enhancedTriggers.page_load = {
            enabled: false
        };
        return this as unknown as T;
    }

    /**
     * Configure add-to-cart trigger with product filtering
     */
    withAddToCartTriggerFiltered(options?: {
        productIds?: string[];
        collectionIds?: string[];
        delaySeconds?: number;
        immediate?: boolean;
    }): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.add_to_cart = {
            enabled: true,
            productIds: options?.productIds || [],
            collectionIds: options?.collectionIds || [],
            delay: options?.delaySeconds ?? 0,  // schema expects `delay`, not `delay_seconds`
            immediate: options?.immediate ?? true
        };
        // Disable page_load to avoid conflicts
        this.config.targetRules.enhancedTriggers.page_load = {
            enabled: false
        };
        return this as unknown as T;
    }

    /**
     * Configure geographic targeting (country-based)
     * Uses Shopify's X-Country-Code header (ISO 3166-1 alpha-2)
     */
    withGeoTargeting(options: {
        mode: 'include' | 'exclude';
        countries: string[]; // e.g., ['US', 'CA', 'GB']
    }): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.geoTargeting = {
            enabled: true,
            mode: options.mode,
            countries: options.countries.map(c => c.toUpperCase())
        };
        return this as unknown as T;
    }

    /**
     * Configure audience targeting with session rules
     */
    withSessionRules(options: {
        conditions: Array<{
            field: string;
            operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
            value: string | number | boolean | string[];
        }>;
        logicOperator?: 'AND' | 'OR';
    }): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.audienceTargeting = {
            enabled: true,
            shopifySegmentIds: [],
            sessionRules: {
                enabled: true,
                conditions: options.conditions,
                logicOperator: options.logicOperator || 'AND'
            }
        };
        return this as unknown as T;
    }

    /**
     * Configure discount with auto-apply behavior
     */
    withAutoApplyDiscount(options: {
        valueType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
        value: number;
        prefix?: string;
    }): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.discountConfig = {
            enabled: true,
            showInPreview: true,
            type: 'shared',
            valueType: options.valueType,
            value: options.value,
            prefix: options.prefix || 'AUTO',
            behavior: 'SHOW_CODE_AND_AUTO_APPLY',
            expiryDays: 30
        };
        return this as unknown as T;
    }

    /**
     * Configure discount with show code only (no auto-apply)
     */
    withShowCodeOnlyDiscount(options: {
        valueType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
        value: number;
        prefix?: string;
    }): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.discountConfig = {
            enabled: true,
            showInPreview: true,
            type: 'shared',
            valueType: options.valueType,
            value: options.value,
            prefix: options.prefix || 'SAVE',
            behavior: 'SHOW_CODE_ONLY',
            expiryDays: 30
        };
        return this as unknown as T;
    }

    /**
     * Configure design settings (size, position, colors, etc.)
     */
    withDesignConfig(designUpdates: {
        size?: 'SMALL' | 'MEDIUM' | 'LARGE';
        position?: 'CENTER' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
        primaryColor?: string;
        secondaryColor?: string;
        textColor?: string;
        cornerRadius?: number;
        overlayOpacity?: number;
        backgroundImage?: string;
        hasBackgroundImage?: boolean;
    }): T {
        if (!this.config) throw new Error('Config not initialized');
        this.config.designConfig = {
            ...this.config.designConfig,
            ...designUpdates
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

    /**
     * Enable GDPR checkbox with custom text
     */
    withGdprCheckbox(enabled: boolean, text?: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.showGdprCheckbox = enabled;
        if (text) {
            this.config.contentConfig.gdprLabel = text;
        }
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

    /**
     * Set button text
     */
    withButtonText(text: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.buttonText = text;
        this.config.contentConfig.submitButtonText = text;
        return this;
    }

    /**
     * Set email placeholder text
     */
    withEmailPlaceholder(placeholder: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.emailPlaceholder = placeholder;
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

    /**
     * Configure cart items display
     */
    withShowCartItems(show: boolean, maxItems: number = 3): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.showCartItems = show;
        this.config.contentConfig.maxItemsToShow = maxItems;
        return this;
    }

    /**
     * Set CTA URL for checkout redirect
     */
    withCtaUrl(url: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.ctaUrl = url;
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

    /**
     * Enable GDPR checkbox with custom text
     */
    withGdprCheckbox(enabled: boolean, text?: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.showGdprCheckbox = enabled;
        if (text) {
            this.config.contentConfig.gdprLabel = text;
        }
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

    /**
     * Enable/disable product info display
     */
    withShowProductInfo(show: boolean): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.showPrices = show;
        this.config.contentConfig.showImages = show;
        return this;
    }

    /**
     * Set upsell type
     */
    withUpsellType(type: 'recommended' | 'frequently_bought_together' | 'related' | 'manual'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.upsellType = type;
        if (type === 'frequently_bought_together') {
            this.config.contentConfig.headline = 'Frequently Bought Together';
        }
        return this;
    }
}

/**
 * Flash Sale Campaign Builder
 */
export class FlashSaleBuilder extends BaseBuilder<FlashSaleBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('FLASH_SALE');
        this.config.goal = 'INCREASE_REVENUE';
        this.config.contentConfig = {
            headline: 'Flash Sale!',
            subheadline: 'Limited time offer - Don\'t miss out!',
            buttonText: 'Shop Now',
            successMessage: 'Discount applied!',
            urgencyMessage: 'Hurry! Sale ends soon',
            discountPercentage: 25,
            showCountdown: true,
            countdownDuration: 3600, // 1 hour
            hideOnExpiry: true,
            showStockCounter: false,
        };
        return this;
    }

    /**
     * Set urgency message
     */
    withUrgencyMessage(message: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.urgencyMessage = message;
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
     * Set countdown duration (in seconds)
     */
    withCountdownDuration(seconds: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.countdownDuration = seconds;
        return this;
    }

    /**
     * Enable stock counter
     */
    withStockCounter(enabled: boolean = true, message?: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.showStockCounter = enabled;
        if (message) {
            this.config.contentConfig.stockMessage = message;
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
 * Free Shipping Campaign Builder
 */
export class FreeShippingBuilder extends BaseBuilder<FreeShippingBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('FREE_SHIPPING');
        this.config.goal = 'INCREASE_REVENUE';
        this.config.contentConfig = {
            threshold: 75,
            currency: '$',
            nearMissThreshold: 10,
            emptyMessage: 'Add items to unlock free shipping',
            progressMessage: 'You\'re {remaining} away from free shipping',
            nearMissMessage: 'Only {remaining} to go!',
            unlockedMessage: 'You\'ve unlocked free shipping! 🎉',
            barPosition: 'top',
            dismissible: true,
            showIcon: true,
            celebrateOnUnlock: true,
        };
        return this;
    }

    /**
     * Set free shipping threshold
     */
    withThreshold(amount: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.threshold = amount;
        return this;
    }

    /**
     * Set currency symbol
     */
    withCurrency(currency: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.currency = currency;
        return this;
    }

    /**
     * Set bar position
     */
    withPosition(position: 'top' | 'bottom'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.barPosition = position;
        return this;
    }

    /**
     * Set custom messages
     */
    withMessages(messages: {
        empty?: string;
        progress?: string;
        nearMiss?: string;
        unlocked?: string;
    }): this {
        if (!this.config) throw new Error('Config not initialized');
        if (messages.empty) this.config.contentConfig.emptyMessage = messages.empty;
        if (messages.progress) this.config.contentConfig.progressMessage = messages.progress;
        if (messages.nearMiss) this.config.contentConfig.nearMissMessage = messages.nearMiss;
        if (messages.unlocked) this.config.contentConfig.unlockedMessage = messages.unlocked;
        return this;
    }

    /**
     * Enable/disable celebration animation on unlock
     */
    withCelebration(enabled: boolean): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.celebrateOnUnlock = enabled;
        return this;
    }
}

/**
 * Countdown Timer Campaign Builder
 */
export class CountdownTimerBuilder extends BaseBuilder<CountdownTimerBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('COUNTDOWN_TIMER');
        this.config.goal = 'INCREASE_REVENUE';
        this.config.contentConfig = {
            headline: 'Limited Time Offer!',
            subheadline: 'Don\'t miss this exclusive deal',
            buttonText: 'Shop Now',
            successMessage: 'Offer claimed!',
            countdownDuration: 3600, // 1 hour
            hideOnExpiry: true,
            sticky: true,
            colorScheme: 'urgent',
        };
        return this;
    }

    /**
     * Set countdown duration (in seconds)
     */
    withCountdownDuration(seconds: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.countdownDuration = seconds;
        return this;
    }

    /**
     * Set fixed end time (ISO string)
     */
    withEndTime(endTimeISO: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.endTime = endTimeISO;
        return this;
    }

    /**
     * Set sticky behavior
     */
    withSticky(sticky: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.sticky = sticky;
        return this;
    }

    /**
     * Set color scheme
     */
    withColorScheme(scheme: 'urgent' | 'success' | 'info' | 'custom'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.colorScheme = scheme;
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

    /**
     * Set countdown duration (alias for withCountdownDuration)
     */
    withDuration(seconds: number): this {
        return this.withCountdownDuration(seconds);
    }

    /**
     * Set CTA button text and URL
     */
    withCtaButton(text: string, url: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.buttonText = text;
        this.config.contentConfig.ctaUrl = url;
        return this;
    }
}

/**
 * Announcement Campaign Builder
 */
export class AnnouncementBuilder extends BaseBuilder<AnnouncementBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('ANNOUNCEMENT');
        this.config.goal = 'ENGAGEMENT';
        this.config.contentConfig = {
            headline: 'Important Announcement',
            subheadline: 'Check out our latest updates',
            buttonText: 'Learn More',
            successMessage: 'Thanks for reading!',
            sticky: true,
            colorScheme: 'info',
        };
        return this;
    }

    /**
     * Set sticky behavior
     */
    withSticky(sticky: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.sticky = sticky;
        return this;
    }

    /**
     * Set color scheme
     */
    withColorScheme(scheme: 'urgent' | 'success' | 'info' | 'custom'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.colorScheme = scheme;
        return this;
    }

    /**
     * Set CTA URL
     */
    withCtaUrl(url: string, openInNewTab: boolean = false): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.ctaUrl = url;
        this.config.contentConfig.ctaOpenInNewTab = openInNewTab;
        return this;
    }

    /**
     * Set icon
     */
    withIcon(icon: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.icon = icon;
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

    /**
     * Set subheadline text
     */
    withSubheadline(subheadline: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.subheadline = subheadline;
        return this;
    }

    /**
     * Set button text
     */
    withButtonText(buttonText: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.buttonText = buttonText;
        return this;
    }

    /**
     * Set dismiss label text
     */
    withDismissLabel(dismissLabel: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.dismissLabel = dismissLabel;
        return this;
    }

    /**
     * Set position (top or bottom)
     */
    withPosition(position: 'top' | 'bottom'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.designConfig.position = position;
        return this;
    }

    /**
     * Set dismissible (show close button)
     */
    withDismissible(dismissible: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.dismissible = dismissible;
        return this;
    }
}

/**
 * Social Proof Campaign Builder
 */
export class SocialProofBuilder extends BaseBuilder<SocialProofBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('SOCIAL_PROOF');
        this.config.goal = 'ENGAGEMENT';
        this.config.contentConfig = {
            headline: 'Join Thousands of Happy Customers',
            subheadline: 'See what others are buying',
            buttonText: 'Shop Now',
            successMessage: 'Welcome!',
            enablePurchaseNotifications: true,
            enableVisitorNotifications: false,
            enableReviewNotifications: false,
            cornerPosition: 'bottom-left',
            displayDuration: 6,
            rotationInterval: 8,
            maxNotificationsPerSession: 5,
            showProductImage: true,
            showTimer: true,
        };
        return this;
    }

    /**
     * Enable/disable purchase notifications
     */
    withPurchaseNotifications(enabled: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.enablePurchaseNotifications = enabled;
        return this;
    }

    /**
     * Enable/disable visitor notifications
     */
    withVisitorNotifications(enabled: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.enableVisitorNotifications = enabled;
        return this;
    }

    /**
     * Enable/disable review notifications
     */
    withReviewNotifications(enabled: boolean = true): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.enableReviewNotifications = enabled;
        return this;
    }

    /**
     * Set corner position
     */
    withCornerPosition(position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.cornerPosition = position;
        return this;
    }

    /**
     * Set display duration (in seconds)
     */
    withDisplayDuration(seconds: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.displayDuration = seconds;
        return this;
    }

    /**
     * Set rotation interval (in seconds)
     */
    withRotationInterval(seconds: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.rotationInterval = seconds;
        return this;
    }

    /**
     * Set max notifications per session
     */
    withMaxNotifications(max: number): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.contentConfig.maxNotificationsPerSession = max;
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
 * Exit Intent Campaign Builder
 * Uses Newsletter content schema with exit_intent trigger
 */
export class ExitIntentBuilder extends BaseBuilder<ExitIntentBuilder> {
    async init() {
        this.config = await this.factory._getBaseConfig('EXIT_INTENT');
        this.config.contentConfig = {
            headline: 'Wait! Don\'t Go',
            subheadline: 'Get 10% off your first order',
            buttonText: 'Get Discount',
            successMessage: 'Thanks! Check your email for your discount code.',
            emailPlaceholder: 'Enter your email',
            emailRequired: true,
            submitButtonText: 'Get Discount',
            nameFieldEnabled: false,
            nameFieldRequired: false,
            consentFieldEnabled: false,
            consentFieldRequired: false,
        };
        // Configure exit intent trigger
        this.config.targetRules.enhancedTriggers.page_load = { enabled: false };
        this.config.targetRules.enhancedTriggers.exit_intent = {
            enabled: true,
            sensitivity: 'medium',
        };
        return this;
    }

    /**
     * Set exit intent sensitivity
     */
    withSensitivity(sensitivity: 'low' | 'medium' | 'high'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.targetRules.enhancedTriggers.exit_intent = {
            ...this.config.targetRules.enhancedTriggers.exit_intent,
            sensitivity,
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

// ============================================================================
// EXPERIMENT BUILDER
// ============================================================================

export interface ExperimentConfig {
    name: string;
    storeId: string;
    status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
    trafficAllocation: Record<string, number>;
    statisticalConfig: {
        confidenceLevel: number;
        minimumSampleSize: number;
        minimumDetectableEffect: number;
    };
    successMetrics: {
        primary: string;
        secondary: string[];
    };
}

export interface VariantConfig {
    variantKey: 'A' | 'B' | 'C' | 'D';
    isControl: boolean;
    headline: string;
    templateType: TemplateType;
}

/**
 * Builder for A/B test experiments with multiple campaign variants
 */
export class ExperimentBuilder {
    private prisma: PrismaClient;
    private storeId: string;
    private testPrefix: string;
    private config: ExperimentConfig | null = null;
    private variants: VariantConfig[] = [];
    private templateCache: Map<TemplateType, string>;

    constructor(
        prisma: PrismaClient,
        storeId: string,
        testPrefix: string,
        templateCache: Map<TemplateType, string>
    ) {
        this.prisma = prisma;
        this.storeId = storeId;
        this.testPrefix = testPrefix;
        this.templateCache = templateCache;
    }

    /**
     * Initialize with default experiment configuration
     */
    async init(): Promise<this> {
        this.config = {
            name: `${this.testPrefix}Experiment-${Date.now()}`,
            storeId: this.storeId,
            status: 'RUNNING',
            trafficAllocation: { A: 50, B: 50 },
            statisticalConfig: {
                confidenceLevel: 0.95,
                minimumSampleSize: 100,
                minimumDetectableEffect: 0.05
            },
            successMetrics: {
                primary: 'CONVERSION_RATE',
                secondary: ['CLICK_THROUGH_RATE']
            }
        };
        return this;
    }

    /**
     * Set experiment name
     */
    withName(name: string): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.name = `${this.testPrefix}${name}`;
        return this;
    }

    /**
     * Set experiment status
     */
    withStatus(status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.status = status;
        return this;
    }

    /**
     * Set traffic allocation between variants
     */
    withTrafficAllocation(allocation: Record<string, number>): this {
        if (!this.config) throw new Error('Config not initialized');
        this.config.trafficAllocation = allocation;
        return this;
    }

    /**
     * Add a variant to the experiment
     */
    addVariant(config: Partial<VariantConfig> & { variantKey: 'A' | 'B' | 'C' | 'D' }): this {
        this.variants.push({
            variantKey: config.variantKey,
            isControl: config.isControl ?? (config.variantKey === 'A'),
            headline: config.headline ?? `Variant ${config.variantKey} Headline`,
            templateType: config.templateType ?? 'NEWSLETTER'
        });
        return this;
    }

    /**
     * Add default A/B variants (50/50 split, newsletter template)
     */
    withDefaultVariants(headlineA: string, headlineB: string): this {
        this.variants = [
            { variantKey: 'A', isControl: true, headline: headlineA, templateType: 'NEWSLETTER' },
            { variantKey: 'B', isControl: false, headline: headlineB, templateType: 'NEWSLETTER' }
        ];
        return this;
    }

    /**
     * Get template ID for a template type
     */
    private async getTemplateId(templateType: TemplateType): Promise<string> {
        if (this.templateCache.has(templateType)) {
            return this.templateCache.get(templateType)!;
        }

        const template = await this.prisma.template.findFirst({
            where: { templateType },
            select: { id: true }
        });

        if (!template) {
            throw new Error(`Template not found for type: ${templateType}`);
        }

        this.templateCache.set(templateType, template.id);
        return template.id;
    }

    /**
     * Create the experiment with all variants in the database
     */
    async create(): Promise<{ experiment: any; variants: any[] }> {
        if (!this.config) throw new Error('Config not initialized');
        if (this.variants.length < 2) {
            throw new Error('Experiment requires at least 2 variants');
        }

        // Create experiment
        const experiment = await this.prisma.experiment.create({
            data: {
                storeId: this.storeId,
                name: this.config.name,
                status: this.config.status,
                trafficAllocation: this.config.trafficAllocation,
                statisticalConfig: this.config.statisticalConfig,
                successMetrics: this.config.successMetrics,
                startDate: new Date()
            }
        });

        // Create variant campaigns
        const createdVariants = [];
        for (const variant of this.variants) {
            const templateId = await this.getTemplateId(variant.templateType);

            const campaign = await this.prisma.campaign.create({
                data: {
                    storeId: this.storeId,
                    templateId,
                    templateType: variant.templateType,
                    experimentId: experiment.id,
                    variantKey: variant.variantKey,
                    isControl: variant.isControl,
                    name: `${this.config.name} - Variant ${variant.variantKey}`,
                    status: 'ACTIVE',
                    priority: 99999, // High priority for testing
                    goal: 'NEWSLETTER_SIGNUP',
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
                                max_triggers_per_session: 999,
                                max_triggers_per_day: 999,
                                cooldown_between_triggers: 0
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
                    contentConfig: {
                        headline: variant.headline,
                        subheadline: `Test variant ${variant.variantKey}`,
                        emailPlaceholder: 'Enter your email',
                        submitButtonText: 'Subscribe',
                        privacyPolicyText: 'We respect your privacy',
                        showGdprCheckbox: false
                    },
                    designConfig: {
                        size: 'MEDIUM',
                        position: 'CENTER',
                        showCloseButton: true,
                        closeButtonPosition: 'TOP_RIGHT',
                        overlayOpacity: 0.5,
                        cornerRadius: 8,
                        primaryColor: '#000000',
                        secondaryColor: '#ffffff',
                        textColor: '#333333'
                    }
                }
            });
            createdVariants.push(campaign);
        }

        return { experiment, variants: createdVariants };
    }

    /**
     * Delete experiment and all its variants
     */
    async cleanup(experimentId: string): Promise<void> {
        // Delete campaigns first (due to foreign key)
        await this.prisma.campaign.deleteMany({
            where: { experimentId }
        });

        // Then delete experiment
        await this.prisma.experiment.delete({
            where: { id: experimentId }
        });
    }
}
