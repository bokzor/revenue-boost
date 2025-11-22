/**
 * ChallengeTokenHook - Pre-loads challenge tokens for secure API calls
 *
 * Used by templates that need challenge tokens for lead submission,
 * discount generation, or other authenticated actions.
 */

import type { PreDisplayHook, PreDisplayHookContext, PreDisplayHookResult } from '../PreDisplayHook';
import { requestChallengeToken, challengeTokenStore } from '~/domains/storefront/services/challenge-token.client';

export class ChallengeTokenHook implements PreDisplayHook {
    readonly name = 'challengeToken';
    readonly runInPreview = false; // Skip in preview mode
    readonly timeoutMs = 3000; // 3 second timeout

    async execute(context: PreDisplayHookContext): Promise<PreDisplayHookResult> {
        try {
            const { campaign, sessionId } = context;

            console.log(`[ChallengeTokenHook] Requesting token for campaign ${campaign.id}`);

            const response = await requestChallengeToken(campaign.id, sessionId);

            if (response.success && response.challengeToken && response.expiresAt) {
                // Store in the token store for later use
                challengeTokenStore.set(campaign.id, response.challengeToken, response.expiresAt);

                return {
                    success: true,
                    data: response.challengeToken,
                    hookName: this.name,
                };
            } else {
                return {
                    success: false,
                    error: response.error || 'Failed to acquire challenge token',
                    hookName: this.name,
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                error: errorMessage,
                hookName: this.name,
            };
        }
    }
}
