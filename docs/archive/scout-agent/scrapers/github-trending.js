// GitHub Trending Scraper
// Fetches trending repos in AI/ML/Automation categories

export async function scrapeGitHubTrending() {
  const categories = [
    'ai',
    'machine-learning',
    'automation',
    'agents',
    'llm',
    'finance',
    'business-intelligence'
  ]

  const discoveries = []
  
  for (const category of categories) {
    try {
      // GitHub Trending doesn't have an official API, so we use GitHub Search API
      // with filters for recently created/updated repos with significant stars
      const response = await fetch(
        `https://api.github.com/search/repositories?q=topic:${category}+created:>2026-02-01+stars:>50&sort=stars&order=desc&per_page=20`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'FounderEngine-Scout'
          }
        }
      )

      if (!response.ok) {
        console.error(`GitHub API error for ${category}:`, response.statusText)
        continue
      }

      const data = await response.json()
      
      for (const repo of data.items) {
        discoveries.push({
          source: 'github',
          source_id: repo.id.toString(),
          url: repo.html_url,
          title: repo.full_name,
          description: repo.description || '',
          author: repo.owner.login,
          tags: [category, ...(repo.topics || [])],
          raw_data: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            open_issues: repo.open_issues_count,
            license: repo.license?.spdx_id
          }
        })
      }
    } catch (error) {
      console.error(`Error scraping GitHub category ${category}:`, error)
    }
  }

  return discoveries
}

// Example usage:
// const discoveries = await scrapeGitHubTrending()
// console.log(`Found ${discoveries.length} repos`)
