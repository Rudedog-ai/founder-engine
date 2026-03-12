// Hacker News Scraper
// Fetches "Show HN" posts about AI/automation tools

export async function scrapeHackerNews() {
  try {
    // HN Algolia API - search for recent "Show HN" posts
    const query = 'Show HN (AI OR automation OR agent OR SaaS OR business)'
    const response = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=show_hn&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('HN API error:', response.statusText)
      return []
    }

    const data = await response.json()
    const discoveries = []

    for (const hit of data.hits) {
      // Extract URL from story_url or objectID
      const url = hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`
      
      discoveries.push({
        source: 'hackernews',
        source_id: hit.objectID,
        url: url,
        title: hit.title.replace(/^Show HN:\s*/i, ''),
        description: hit.story_text || '',
        author: hit.author,
        tags: extractTags(hit.title + ' ' + (hit.story_text || '')),
        raw_data: {
          points: hit.points,
          num_comments: hit.num_comments,
          created_at: new Date(hit.created_at_i * 1000).toISOString(),
          hn_url: `https://news.ycombinator.com/item?id=${hit.objectID}`
        }
      })
    }

    return discoveries
  } catch (error) {
    console.error('Error scraping Hacker News:', error)
    return []
  }
}

function extractTags(text) {
  const keywords = ['ai', 'ml', 'agent', 'automation', 'saas', 'finance', 'cfo', 'analytics', 'business', 'llm']
  const found = []
  const lowerText = text.toLowerCase()
  
  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      found.push(keyword)
    }
  }
  
  return found.length > 0 ? found : ['general']
}
