#!/usr/bin/env python3
"""
Scrapling Test Script for OYNB
Scrapes social media, PR, blogs for company intelligence
Usage: python3 scrapling-test.py "Company Name" "website.com"
"""

import sys
import json
from datetime import datetime

try:
    from scrapling import Fetcher, PlayWrightFetcher
except ImportError:
    print(json.dumps({
        "error": "Scrapling not installed",
        "install": "pip3 install scrapling --break-system-packages"
    }))
    sys.exit(1)

def scrape_company(company_name, website):
    """Scrape social media, PR, and blog mentions for a company"""
    
    results = {
        "company": company_name,
        "website": website,
        "timestamp": datetime.now().isoformat(),
        "sources": {},
        "total_mentions": 0,
        "items": []
    }
    
    # 1. Search Twitter/X for mentions
    try:
        twitter_query = f"{company_name} OR @{company_name.lower().replace(' ', '')}"
        twitter_url = f"https://twitter.com/search?q={twitter_query}&f=live"
        
        fetcher = Fetcher()
        page = fetcher.get(twitter_url)
        
        # Extract tweets (simplified - real version would parse properly)
        tweets = page.css('article[data-testid="tweet"]')
        
        results["sources"]["twitter"] = {
            "found": len(tweets) > 0,
            "count": len(tweets),
            "url": twitter_url
        }
        
        for tweet in tweets[:5]:  # Top 5
            results["items"].append({
                "source": "twitter",
                "type": "mention",
                "content": tweet.text[:200] if hasattr(tweet, 'text') else "Tweet content",
                "url": twitter_url
            })
        
    except Exception as e:
        results["sources"]["twitter"] = {"error": str(e)}
    
    # 2. Search LinkedIn
    try:
        linkedin_url = f"https://www.linkedin.com/search/results/content/?keywords={company_name}"
        
        fetcher = PlayWrightFetcher()
        page = fetcher.get(linkedin_url)
        
        posts = page.css('.feed-shared-update-v2')
        
        results["sources"]["linkedin"] = {
            "found": len(posts) > 0,
            "count": len(posts),
            "url": linkedin_url
        }
        
        for post in posts[:5]:
            results["items"].append({
                "source": "linkedin",
                "type": "post",
                "content": post.text[:200] if hasattr(post, 'text') else "LinkedIn post",
                "url": linkedin_url
            })
            
    except Exception as e:
        results["sources"]["linkedin"] = {"error": str(e)}
    
    # 3. Google News search
    try:
        news_url = f"https://news.google.com/search?q={company_name}"
        
        fetcher = Fetcher()
        page = fetcher.get(news_url)
        
        articles = page.css('article')
        
        results["sources"]["news"] = {
            "found": len(articles) > 0,
            "count": len(articles),
            "url": news_url
        }
        
        for article in articles[:10]:
            headline = article.css('a').first()
            if headline:
                results["items"].append({
                    "source": "google_news",
                    "type": "article",
                    "title": headline.text,
                    "url": headline.attrs.get('href', '')
                })
                
    except Exception as e:
        results["sources"]["news"] = {"error": str(e)}
    
    # 4. Company blog (if website provided)
    if website:
        try:
            blog_urls = [
                f"https://{website}/blog",
                f"https://{website}/news",
                f"https://{website}/press"
            ]
            
            for url in blog_urls:
                try:
                    fetcher = Fetcher()
                    page = fetcher.get(url)
                    
                    if page.status == 200:
                        # Found blog
                        articles = page.css('article, .post, .blog-post')
                        
                        results["sources"]["company_blog"] = {
                            "found": True,
                            "url": url,
                            "count": len(articles)
                        }
                        
                        for article in articles[:5]:
                            title_elem = article.css('h2, h3, .title').first()
                            results["items"].append({
                                "source": "company_blog",
                                "type": "blog_post",
                                "title": title_elem.text if title_elem else "Blog post",
                                "url": url
                            })
                        break
                except:
                    continue
                    
        except Exception as e:
            results["sources"]["company_blog"] = {"error": str(e)}
    
    # Calculate total mentions
    results["total_mentions"] = len(results["items"])
    
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: scrapling-test.py 'Company Name' 'website.com'"
        }))
        sys.exit(1)
    
    company_name = sys.argv[1]
    website = sys.argv[2] if len(sys.argv) > 2 else None
    
    results = scrape_company(company_name, website)
    print(json.dumps(results, indent=2))
