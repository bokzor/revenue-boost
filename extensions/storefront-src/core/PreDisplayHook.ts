/**
 * PreDisplayHook - Resource loading hook system for campaign popups
 *
 * Ensures all required resources (images, discount codes, challenge tokens, product data)
 * are loaded BEFORE the popup is displayed to users, eliminating visible loading states.
 *
 * Architecture:
 * - Each hook is responsible for loading a specific type of resource
 * - Hooks are registered per template type in the HookRegistry
 * - executeHooksForCampaign() runs all hooks in parallel before popup render
 * - Results are cached and passed to popup components via props
 */

import type { ApiClient } from './api';
import type { TemplateType } from './component-loader';
import type { StorefrontCampaign } from './PopupManagerPreact';

/**
 * Context passed to each hook during execution
 */
export interface PreDisplayHookContext {
    campaign: StorefrontCampaign;
    api: ApiClient;
    sessionId: string;
    visitorId: string;
    previewMode: boolean;
    /**
     * Optional trigger context (e.g., product ID from add_to_cart trigger)
     * This allows hooks to use data from the trigger event
     */
    triggerContext?: {
        productId?: string; // Product ID that triggered the campaign (for add_to_cart)
        [key: string]: unknown; // Allow other trigger-specific data
    };
}

/**
 * Result returned by each hook
 */
export interface PreDisplayHookResult {
    success: boolean;
    error?: string;
    data?: unknown;
    hookName: string;
    executionTimeMs?: number;
}

/**
 * Base interface for all pre-display hooks
 */
export interface PreDisplayHook {
    /**
     * Unique identifier for this hook
     */
    readonly name: string;

    /**
     * Execute the hook to load resources
     * @param context - Campaign and session context
     * @returns Promise with hook execution result
     */
    execute(context: PreDisplayHookContext): Promise<PreDisplayHookResult>;

    /**
     * Whether this hook should run in preview mode
     * Default: false (skip in preview)
     */
    readonly runInPreview?: boolean;

    /**
     * Timeout in milliseconds before the hook is considered failed
     * Default: 5000ms
     */
    readonly timeoutMs?: number;
}

/**
 * Combined result from executing all hooks for a campaign
 */
export interface CampaignHooksResult {
    success: boolean;
    loadedResources: Record<string, unknown>;
    errors: string[];
    hookResults: PreDisplayHookResult[];
    totalExecutionTimeMs: number;
}

/**
 * In-memory cache for pre-loaded resources
 */
class ResourceCache {
    private cache = new Map<string, { data: unknown; timestamp: number }>();
    private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

    get(campaignId: string, hookName: string): unknown | null {
        const key = `${campaignId}:${hookName}`;
        const cached = this.cache.get(key);

        if (cached && Date.now() - cached.timestamp < this.TTL_MS) {
            return cached.data;
        }

        // Remove expired entry
        if (cached) {
            this.cache.delete(key);
        }

        return null;
    }

    set(campaignId: string, hookName: string, data: unknown): void {
        const key = `${campaignId}:${hookName}`;
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    clear(campaignId: string): void {
        for (const key of Array.from(this.cache.keys())) {
            if (key.startsWith(`${campaignId}:`)) {
                this.cache.delete(key);
            }
        }
    }

    clearAll(): void {
        this.cache.clear();
    }
}

// Singleton cache instance
const resourceCache = new ResourceCache();

/**
 * Registry for hooks by template type
 */
class HookRegistryClass {
    private hooks = new Map<TemplateType, PreDisplayHook[]>();

    /**
     * Register a hook for a specific template type
     */
    register(templateType: TemplateType, hook: PreDisplayHook): void {
        const existing = this.hooks.get(templateType) || [];
        existing.push(hook);
        this.hooks.set(templateType, existing);
    }

    /**
     * Get all hooks registered for a template type
     */
    getHooks(templateType: TemplateType): PreDisplayHook[] {
        return this.hooks.get(templateType) || [];
    }

    /**
     * Clear all registered hooks (useful for testing)
     */
    clear(): void {
        this.hooks.clear();
    }
}

// Singleton registry instance
export const HookRegistry = new HookRegistryClass();

/**
 * Execute a single hook with timeout and error handling
 */
async function executeHook(
    hook: PreDisplayHook,
    context: PreDisplayHookContext
): Promise<PreDisplayHookResult> {
    const startTime = Date.now();
    const timeoutMs = hook.timeoutMs || 5000;

    try {
        // Check cache first
        const cached = resourceCache.get(context.campaign.id, hook.name);
        if (cached !== null) {
            console.log(`[PreDisplayHook] Using cached data for ${hook.name}`);
            return {
                success: true,
                data: cached,
                hookName: hook.name,
                executionTimeMs: 0,
            };
        }

        // Skip hook in preview mode unless explicitly allowed
        if (context.previewMode && !hook.runInPreview) {
            console.log(`[PreDisplayHook] Skipping ${hook.name} in preview mode`);
            return {
                success: true,
                data: null,
                hookName: hook.name,
                executionTimeMs: 0,
            };
        }

        // Execute hook with timeout
        const result = await Promise.race([
            hook.execute(context),
            new Promise<PreDisplayHookResult>((_, reject) =>
                setTimeout(() => reject(new Error(`Hook timeout: ${hook.name}`)), timeoutMs)
            ),
        ]);

        const executionTime = Date.now() - startTime;

        // Cache successful results
        if (result.success && result.data !== undefined) {
            resourceCache.set(context.campaign.id, hook.name, result.data);
        }

        return {
            ...result,
            executionTimeMs: executionTime,
        };
    } catch (error) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error(`[PreDisplayHook] Hook ${hook.name} failed:`, errorMessage);

        return {
            success: false,
            error: errorMessage,
            hookName: hook.name,
            executionTimeMs: executionTime,
        };
    }
}

/**
 * Execute all hooks for a campaign in parallel
 *
 * @param campaign - Campaign configuration
 * @param api - API client for making requests
 * @returns Combined result with all loaded resources
 */
export async function executeHooksForCampaign(
    campaign: StorefrontCampaign,
    api: ApiClient,
    sessionId: string,
    visitorId: string,
    triggerContext?: { productId?: string; [key: string]: unknown }
): Promise<CampaignHooksResult> {
    const startTime = Date.now();
    const templateType = campaign.templateType;
    const previewMode = (campaign.designConfig as { previewMode?: boolean } | undefined)?.previewMode || false;

    console.log(`[PreDisplayHook] Executing hooks for campaign ${campaign.id} (${templateType})`);

    const hooks = HookRegistry.getHooks(templateType);

    if (hooks.length === 0) {
        console.log(`[PreDisplayHook] No hooks registered for ${templateType}`);
        return {
            success: true,
            loadedResources: {},
            errors: [],
            hookResults: [],
            totalExecutionTimeMs: 0,
        };
    }

    const context: PreDisplayHookContext = {
        campaign,
        api,
        sessionId,
        visitorId,
        previewMode,
        triggerContext, // Pass trigger context to hooks
    };

    // Execute all hooks in parallel
    const results = await Promise.all(
        hooks.map(hook => executeHook(hook, context))
    );

    // Combine results
    const loadedResources: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const result of results) {
        if (result.success && result.data !== undefined && result.data !== null) {
            loadedResources[result.hookName] = result.data;
        } else if (!result.success && result.error) {
            errors.push(`${result.hookName}: ${result.error}`);
        }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    // Success if ALL hooks succeeded (strict mode)
    // This ensures critical resources like challenge tokens are always loaded
    const allSucceeded = successCount === totalCount;

    console.log(
        `[PreDisplayHook] Completed in ${totalTime}ms. ` +
        `Success: ${successCount}/${totalCount}`
    );

    if (errors.length > 0) {
        console.error(`[PreDisplayHook] Hook failures detected:`, errors);
    }

    return {
        success: allSucceeded,
        loadedResources,
        errors,
        hookResults: results,
        totalExecutionTimeMs: totalTime,
    };
}

/**
 * Clear cached resources for a campaign
 * Call this when a popup is closed
 */
export function clearCampaignCache(campaignId: string): void {
    resourceCache.clear(campaignId);
}

/**
 * Clear all cached resources
 * Call this on page navigation or when needed
 */
export function clearAllCaches(): void {
    resourceCache.clearAll();
}
