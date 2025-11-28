️ Partially Covered (Needs More Tests)

| Feature | Current State | Missing |
   |---------|--------------|---------|
| Session Rules | Only visit count tested | Cart value threshold, page type conditions, OR logic |
| Auto-Apply Discount | Mocked API | Real Shopify checkout integration |
| Popup Position | Only corner positions | Modal center, slide-in, fullscreen |
| Frequency Capping | Basic test | Multi-day, cooldown between triggers |

❌ Not Tested (Critical Gaps)

1. Design/Layout Features
   • Popup sizes (small/medium/large)
   • Background images
   • Custom colors/fonts
   • Animations (fade, slide, bounce)

2. Interaction Patterns
   • ESC key to close popup
   • Click outside to dismiss
   • Mobile swipe gestures
   • Tab/keyboard navigation (accessibility)

3. A/B Testing / Experiments
   • Variant A vs B display
   • Traffic split verification
   • Experiment tracking events

4. Error Handling
   • API failure graceful degradation
   • Network timeout behavior
   • Invalid campaign config handling
   • JavaScript errors don't break storefront

5. Advanced Targeting
   • Shopify customer segments
   • Product tag targeting
   • Collection-based targeting
   • UTM parameter targeting

6. Form Features
   • Name collection field
   • Phone number field
   • Custom fields
   • Form validation errors display
   • Rate limiting

7. Edge Cases
   • Multiple popups competing (priority resolution)
   • Popup stacking prevention
   • Rapid page navigation
   • Browser back/forward buttons
   • Session persistence across subdomains

8. Analytics/Tracking
   • Impression tracking
   • Click tracking
   • Conversion tracking
   • Event dispatching to analytics
