// Product Hunt Scraper
// Fetches top AI/automation/business tools posted in last 7 days

export async function scrapeProductHunt() {
  // Product Hunt GraphQL API
  // Note: Requires API token (set in Supabase secrets or env)
  
  const query = `
    query {
      posts(order: VOTES, postedAfter: "2026-03-02") {
        edges {
          node {
            id
            name
            tagline
            description
            url
            votesCount
            commentsCount
            createdAt
            topics {
              edges {
                node {
                  name
                }
              }
            }
            makers {
              edges {
                node {
                  name
                  username
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PRODUCTHUNT_API_KEY || ''}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      console.error('Product Hunt API error:', response.statusText)
      return []
    }

    const data = await response.json()
    const discoveries = []

    for (const edge of data.data.posts.edges) {
      const post = edge.node
      
      // Filter for AI/automation/business tools
      const topics = post.topics.edges.map(t => t.node.name.toLowerCase())
      const isRelevant = topics.some(topic => 
        ['ai', 'automation', 'business', 'finance', 'analytics', 'saas', 'productivity']
          .some(keyword => topic.includes(keyword))
      )

      if (!isRelevant) continue

      discoveries.push({
        source: 'producthunt',
        source_id: post.id,
        url: `https://www.producthunt.com${post.url}`,
        title: post.name,
        description: post.tagline || post.description,
        author: post.makers.edges.map(m => m.node.username).join(', '),
        tags: topics,
        raw_data: {
          votes: post.votesCount,
          comments: post.commentsCount,
          created_at: post.createdAt,
          full_description: post.description
        }
      })
    }

    return discoveries
  } catch (error) {
    console.error('Error scraping Product Hunt:', error)
    return []
  }
}
