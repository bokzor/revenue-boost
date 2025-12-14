/**
 * Format a date string for display
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get the category display name
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    guides: 'Guides',
    tutorials: 'Tutorials',
    updates: 'Updates',
    'case-studies': 'Case Studies',
    tips: 'Tips & Tricks',
  }
  return names[category] || category
}

