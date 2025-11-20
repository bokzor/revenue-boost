/**
 * Challenge Token Client Utility
 * 
 * Frontend helper for requesting and managing challenge tokens
 * for secure discount code generation.
 */

interface ChallengeTokenResponse {
    success: boolean;
    challengeToken?: string;
    expiresAt?: string;
    error?: string;
    retryAfter?: string;
}

/**
 * Request a challenge token from the server
 * Call this when user interacts with popup (before showing email form)
 * 
 * @param campaignId - Campaign ID
 * @param sessionId - User's session ID
 * @returns Challenge token data or error
 */
export async function requestChallengeToken(
    campaignId: string,
    sessionId: string
): Promise<ChallengeTokenResponse> {
    try {
        const response = await fetch('/apps/revenue-boost/api/challenge/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                campaignId,
                sessionId,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Challenge Token] Request failed:', data.error);
            return {
                success: false,
                error: data.error || 'Failed to request challenge token',
                retryAfter: data.retryAfter,
            };
        }

        return data;
    } catch (error) {
        console.error('[Challenge Token] Network error:', error);
        return {
            success: false,
            error: 'Network error requesting challenge token',
        };
    }
}

/**
 * Check if a challenge token is still valid (not expired)
 */
export function isChallengeTokenValid(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) > new Date();
}

/**
 * Store challenge token in memory (don't persist to localStorage for security)
 */
class ChallengeTokenStore {
    private tokens: Map<string, { token: string; expiresAt: string }> = new Map();

    set(campaignId: string, token: string, expiresAt: string) {
        this.tokens.set(campaignId, { token, expiresAt });
    }

    get(campaignId: string): string | null {
        const data = this.tokens.get(campaignId);
        if (!data) return null;

        // Check if expired
        if (!isChallengeTokenValid(data.expiresAt)) {
            this.tokens.delete(campaignId);
            return null;
        }

        return data.token;
    }

    delete(campaignId: string) {
        this.tokens.delete(campaignId);
    }

    clear() {
        this.tokens.clear();
    }
}

export const challengeTokenStore = new ChallengeTokenStore();
