"""
OYNB Website Crawler — Forensic extraction via Scrapling
Crawls every page on oynb.com, extracts facts, stores to knowledge_base.
"""
import json
import re
import sys
import time
from urllib.parse import urljoin, urlparse

from scrapling import Fetcher

COMPANY_ID = "4e0cce04-ed81-4e60-aa32-15aae72c6bf5"
BASE_URL = "https://lopsided-jellybeans.flywheelsites.com"
# oynb.com/co.uk redirects to Flywheel hosting. Also accept oynb.com links.
ALLOWED_DOMAINS = {"lopsided-jellybeans.flywheelsites.com", "oynb.com", "www.oynb.com", "oynb.co.uk", "www.oynb.co.uk", "go.oynb.com"}
SUPABASE_URL = "https://qzlicsovnldozbnmahsa.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bGljc292bmxkb3pibm1haHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MTQ0NjgsImV4cCI6MjA1MjA5MDQ2OH0.VlyABiSdyaTz_5Rs6z4MRzaXeWs7sddFk2ePxRmULg0"

# Collect all facts before batch insert
all_facts = []

def add_fact(topic, key, value, source_url, confidence=1.0):
    """Queue a fact + source companion for batch insert."""
    val = str(value).strip()
    if not val or val.lower() in ('none', 'n/a', ''):
        return
    all_facts.append({
        "company_id": COMPANY_ID,
        "topic": topic,
        "key": key,
        "value": val,
        "confidence": confidence,
    })
    all_facts.append({
        "company_id": COMPANY_ID,
        "topic": topic,
        "key": f"{key}.source",
        "value": f"Website crawl: {source_url}",
        "confidence": 1.0,
    })


def extract_tech_signals(page, url):
    """Extract technology signals from page source."""
    try:
        # Get raw HTML for tech signal detection
        html_els = page.css('html').getall()
        html = html_els[0] if html_els else ""
    except:
        html = ""

    # CMS detection
    cms_signals = {
        "wordpress": ["wp-content", "wp-includes", "wp-json"],
        "shopify": ["cdn.shopify.com", "Shopify.theme", "shopify-section"],
        "squarespace": ["squarespace.com", "sqsp.net", "sqs-block"],
        "wix": ["wix.com", "wixsite.com", "wix-warmup"],
        "webflow": ["webflow.com", "wf-section"],
        "kajabi": ["kajabi.com", "kajabi-"],
        "teachable": ["teachable.com", "teachable-"],
        "thinkific": ["thinkific.com", "thinkific-"],
        "ghost": ["ghost.org", "ghost-"],
        "hubspot": ["hs-scripts.com", "hubspot.com", "hbspt"],
        "carrd": ["carrd.co"],
    }
    for cms, markers in cms_signals.items():
        for marker in markers:
            if marker.lower() in html.lower():
                add_fact("technology_systems", f"tech.website.platform", cms.title(), url)
                break

    # Analytics
    analytics_signals = {
        "google_analytics": ["google-analytics.com", "gtag(", "UA-", "G-", "googletagmanager.com"],
        "hotjar": ["hotjar.com", "hj("],
        "mixpanel": ["mixpanel.com"],
        "segment": ["segment.com", "analytics.js"],
        "facebook_pixel": ["fbq(", "facebook.com/tr"],
        "tiktok_pixel": ["analytics.tiktok.com"],
        "clarity": ["clarity.ms"],
    }
    detected_analytics = []
    for tool, markers in analytics_signals.items():
        for marker in markers:
            if marker.lower() in html.lower():
                detected_analytics.append(tool)
                break
    if detected_analytics:
        add_fact("technology_systems", "tech.analytics", ", ".join(detected_analytics), url)

    # Payment
    payment_signals = {
        "stripe": ["stripe.com", "Stripe(", "stripe.js"],
        "paypal": ["paypal.com", "paypal.me"],
        "gocardless": ["gocardless.com"],
        "paddle": ["paddle.com", "Paddle.Setup"],
        "chargebee": ["chargebee.com"],
    }
    for provider, markers in payment_signals.items():
        for marker in markers:
            if marker.lower() in html.lower():
                add_fact("technology_systems", f"tech.payments.platform", provider.title(), url)
                break

    # Email marketing
    email_signals = {
        "mailchimp": ["mailchimp.com", "mc.js"],
        "convertkit": ["convertkit.com"],
        "activecampaign": ["activecampaign.com"],
        "klaviyo": ["klaviyo.com"],
        "mailerlite": ["mailerlite.com"],
        "drip": ["getdrip.com"],
        "sendinblue": ["sendinblue.com", "brevo.com"],
        "hubspot_email": ["hs-scripts.com"],
    }
    for platform, markers in email_signals.items():
        for marker in markers:
            if marker.lower() in html.lower():
                add_fact("technology_systems", f"tech.email_marketing.platform", platform.replace("_", " ").title(), url)
                break

    # CRM
    crm_signals = {
        "hubspot_crm": ["hs-scripts.com", "hubspot.com"],
        "intercom": ["intercom.io", "Intercom("],
        "zendesk": ["zendesk.com"],
        "freshdesk": ["freshdesk.com"],
        "drift": ["drift.com"],
        "crisp": ["crisp.chat"],
        "tawk": ["tawk.to"],
        "livechat": ["livechatinc.com"],
    }
    for crm, markers in crm_signals.items():
        for marker in markers:
            if marker.lower() in html.lower():
                add_fact("technology_systems", f"tech.crm.platform", crm.replace("_", " ").title(), url)
                break

    # Social links
    social_platforms = {
        "facebook": r'facebook\.com/[^"\'\s]+',
        "instagram": r'instagram\.com/[^"\'\s]+',
        "twitter": r'(?:twitter|x)\.com/[^"\'\s]+',
        "linkedin": r'linkedin\.com/(?:company|in)/[^"\'\s]+',
        "youtube": r'youtube\.com/[^"\'\s]+',
        "tiktok": r'tiktok\.com/@[^"\'\s]+',
        "pinterest": r'pinterest\.com/[^"\'\s]+',
    }
    for platform, pattern in social_platforms.items():
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            add_fact("marketing_sales", f"marketing.social.{platform}.url", match.group(0), url)


def extract_team_members(page, url):
    """Look for team member names and roles."""
    # Common team page patterns
    team_cards = page.css('.team-member, .team-card, .staff-member, .person, [class*="team"], [class*="founder"], [class*="about-us"] .member')
    for card in team_cards:
        name_el = card.css('h2::text, h3::text, h4::text, .name::text, .title::text')
        role_el = card.css('.role::text, .position::text, .job-title::text, p::text')
        name = name_el.get() if name_el else None
        role = role_el.get() if role_el else None
        if name and len(name.strip()) > 2:
            clean_name = name.strip().lower().replace(' ', '_')
            add_fact("team_operations", f"team.member.{clean_name}.name", name.strip(), url)
            if role:
                add_fact("team_operations", f"team.member.{clean_name}.role", role.strip(), url)


def extract_products_pricing(page, url):
    """Extract product/program names and prices."""
    # Look for pricing elements
    price_patterns = [
        r'[£$€]\s*[\d,]+(?:\.\d{2})?',
        r'[\d,]+(?:\.\d{2})?\s*(?:per\s+(?:month|year|week))',
    ]
    try:
        text_els = page.css('body *::text').getall()
        text = ' '.join([t.strip() for t in text_els if t.strip()])
    except:
        text = ""

    # Product/challenge names from headings
    headings = page.css('h1::text, h2::text, h3::text').getall()
    for h in headings:
        h = h.strip() if h else ""
        # Look for challenge/program mentions
        challenge_match = re.search(r'(\d+)\s*[-–]?\s*(?:day|week|month)\s+(?:challenge|program|course|plan)', h, re.IGNORECASE)
        if challenge_match:
            add_fact("business_fundamentals", f"product.challenge.{h.strip().lower().replace(' ', '_')}", h.strip(), url)

    # Pricing cards
    pricing_cards = page.css('.pricing, .price-card, [class*="pricing"], [class*="plan"], .product-card')
    for card in pricing_cards:
        try:
            card_parts = card.css('*::text').getall()
            card_text = ' '.join([t.strip() for t in card_parts if t.strip()])
        except:
            card_text = ""
        for pattern in price_patterns:
            price_match = re.search(pattern, card_text)
            if price_match:
                # Try to find associated product name
                name_el = card.css('h2::text, h3::text, h4::text, .plan-name::text')
                plan_name = name_el.get() if name_el else "unknown"
                clean_name = plan_name.strip().lower().replace(' ', '_')
                add_fact("revenue_financials", f"product.pricing.{clean_name}", price_match.group(0), url)


def extract_testimonials(page, url):
    """Extract testimonials and review quotes."""
    testimonial_selectors = [
        '.testimonial', '.review', '.quote', '[class*="testimonial"]',
        '[class*="review"]', 'blockquote', '.client-quote',
        '[class*="success-stor"]', '[class*="case-stud"]',
    ]
    idx = 0
    for selector in testimonial_selectors:
        items = page.css(selector)
        for item in items:
            try:
                text_parts = item.css('*::text').getall()
                text = ' '.join([t.strip() for t in text_parts if t.strip()])
            except:
                text = ""
            if text and len(text) > 30 and len(text) < 1000:
                idx += 1
                add_fact("customers", f"customers.testimonial.{idx}", text[:500], url)
                # Look for attribution
                author = item.css('.author::text, .name::text, cite::text, .attribution::text')
                if author and author.get():
                    add_fact("customers", f"customers.testimonial.{idx}.author", author.get().strip(), url)


def extract_blog_posts(page, url):
    """Extract blog post titles and dates."""
    post_selectors = [
        'article', '.blog-post', '.post', '[class*="blog"]',
        '.entry', '.post-card', '.article-card',
    ]
    idx = 0
    for selector in post_selectors:
        posts = page.css(selector)
        for post in posts:
            title_el = post.css('h2::text, h3::text, h2 a::text, h3 a::text, .post-title::text')
            title = title_el.get() if title_el else None
            if title and len(title.strip()) > 5:
                idx += 1
                clean_title = title.strip()[:100]
                add_fact("marketing_sales", f"marketing.content.blog_post.{idx}.title", clean_title, url)
                # Date
                date_el = post.css('time::text, .date::text, .post-date::text, time::attr(datetime)')
                if date_el and date_el.get():
                    add_fact("marketing_sales", f"marketing.content.blog_post.{idx}.date", date_el.get().strip(), url)


def extract_partners_clients(page, url):
    """Extract partner/client logos and names."""
    logo_sections = page.css('[class*="partner"], [class*="client"], [class*="logo-strip"], [class*="trusted"], [class*="featured"]')
    for section in logo_sections:
        imgs = section.css('img')
        for img in imgs:
            alt = img.attrib.get('alt', '').strip()
            if alt and len(alt) > 2 and alt.lower() not in ('logo', 'image', 'icon'):
                add_fact("customers", f"customers.partner.{alt.lower().replace(' ', '_')}", alt, url)


def extract_lead_magnets(page, url):
    """Extract downloadable resources and lead magnets."""
    # PDF links
    pdf_links = page.css('a[href$=".pdf"]')
    for link in pdf_links:
        href = link.attrib.get('href', '')
        text = link.css('::text').get() or href.split('/')[-1]
        add_fact("marketing_sales", f"marketing.lead_magnet.{text[:50].lower().replace(' ', '_')}", text.strip(), url)

    # Forms (signup/newsletter)
    forms = page.css('form')
    for form in forms:
        action = form.attrib.get('action', '')
        inputs = form.css('input[type="email"], input[name*="email"]')
        if inputs:
            add_fact("marketing_sales", "marketing.email.has_signup_form", "true", url)
            if action:
                add_fact("marketing_sales", "marketing.email.form_action", action, url)


def extract_meta_info(page, url):
    """Extract meta tags, Open Graph, schema.org data."""
    # Meta description
    desc = page.css('meta[name="description"]::attr(content)').get()
    if desc:
        add_fact("business_fundamentals", "company.meta_description", desc.strip()[:500], url)

    # OG data
    og_title = page.css('meta[property="og:title"]::attr(content)').get()
    og_desc = page.css('meta[property="og:description"]::attr(content)').get()
    og_image = page.css('meta[property="og:image"]::attr(content)').get()

    if og_title:
        add_fact("business_fundamentals", "company.og_title", og_title.strip(), url)

    # Schema.org JSON-LD
    scripts = page.css('script[type="application/ld+json"]::text').getall()
    for script in scripts:
        try:
            data = json.loads(script)
            if isinstance(data, dict):
                parse_schema_org(data, url)
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        parse_schema_org(item, url)
        except:
            pass


def parse_schema_org(data, url):
    """Extract facts from schema.org JSON-LD."""
    schema_type = data.get('@type', '')
    if schema_type == 'Organization':
        if data.get('name'):
            add_fact("business_fundamentals", "company.schema_org.name", data['name'], url)
        if data.get('url'):
            add_fact("business_fundamentals", "company.schema_org.url", data['url'], url)
        if data.get('logo'):
            logo = data['logo'] if isinstance(data['logo'], str) else data['logo'].get('url', '')
            if logo:
                add_fact("business_fundamentals", "company.schema_org.logo", logo, url)
        if data.get('sameAs'):
            for i, link in enumerate(data['sameAs']):
                add_fact("marketing_sales", f"marketing.social.schema_same_as.{i}", link, url)
    elif schema_type in ('Product', 'Offer'):
        name = data.get('name', 'unknown')
        price = data.get('price') or data.get('offers', {}).get('price')
        if price:
            clean = name.lower().replace(' ', '_')[:50]
            add_fact("revenue_financials", f"product.schema_org.{clean}.price", str(price), url)
    elif schema_type == 'FAQPage':
        entities = data.get('mainEntity', [])
        for i, faq in enumerate(entities):
            q = faq.get('name', '')
            a_obj = faq.get('acceptedAnswer', {})
            a = a_obj.get('text', '') if isinstance(a_obj, dict) else ''
            if q:
                add_fact("business_fundamentals", f"company.faq.{i}.question", q[:200], url)
            if a:
                add_fact("business_fundamentals", f"company.faq.{i}.answer", a[:500], url)


def extract_page_content(page, url):
    """Extract general page content — numbers, stats, specific claims."""
    try:
        text_els = page.css('body *::text').getall()
        text = ' '.join([t.strip() for t in text_els if t.strip()])
    except:
        text = ""

    # Specific number claims (e.g., "over 50,000 members", "97% success rate")
    stat_patterns = [
        (r'(?:over|more than|nearly|approximately|around)?\s*[\d,]+(?:\.\d+)?[+]?\s*(?:members|customers|users|clients|people|subscribers|followers)', "customers.claimed_metric"),
        (r'[\d,]+(?:\.\d+)?%\s*(?:success|completion|satisfaction|retention|approval)', "customers.success_metric"),
        (r'(?:over|more than)?\s*[\d,]+\s*(?:countries|cities|locations)', "business_fundamentals.geographic_reach"),
        (r'(?:since|founded|established|started)\s*(?:in\s*)?(\d{4})', "business_fundamentals.founded_year"),
        (r'[\d,]+\s*(?:5[- ]?star|★)\s*reviews?', "customers.review_count"),
    ]
    for pattern, key_prefix in stat_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for i, match in enumerate(matches[:3]):  # Max 3 per pattern
            match_str = match.strip() if isinstance(match, str) else match
            add_fact(
                key_prefix.split('.')[0] if '.' in key_prefix else "business_fundamentals",
                f"{key_prefix}.{i}" if i > 0 else key_prefix,
                match_str,
                url,
                confidence=1.0
            )


def crawl_oynb():
    """Main crawler: discover pages, extract facts from each."""
    print(f"Starting forensic crawl of {BASE_URL}")
    visited = set()
    to_visit = [BASE_URL]
    page_count = 0
    max_pages = 100  # Safety limit

    while to_visit and page_count < max_pages:
        url = to_visit.pop(0)

        # Normalize URL
        parsed = urlparse(url)
        # Only crawl oynb.com pages
        if parsed.netloc and parsed.netloc not in ALLOWED_DOMAINS:
            continue
        # Skip non-HTML resources
        path_lower = parsed.path.lower()
        if any(path_lower.endswith(ext) for ext in ['.pdf', '.jpg', '.png', '.gif', '.svg', '.css', '.js', '.mp4', '.mp3', '.zip']):
            continue
        # Skip fragments and query-heavy URLs
        clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip('/')
        if clean_url in visited:
            continue

        visited.add(clean_url)
        page_count += 1

        print(f"\n[{page_count}] Crawling: {clean_url}")
        try:
            page = Fetcher.get(clean_url, timeout=15)
            if not page or page.status != 200:
                print(f"  -> Status {page.status if page else 'None'}, skipping")
                continue
        except Exception as e:
            print(f"  -> Error fetching: {e}")
            continue

        # Extract all facts from this page
        try:
            extract_tech_signals(page, clean_url)
        except Exception as e:
            print(f"  -> Tech signals error: {e}")

        try:
            extract_team_members(page, clean_url)
        except Exception as e:
            print(f"  -> Team extraction error: {e}")

        try:
            extract_products_pricing(page, clean_url)
        except Exception as e:
            print(f"  -> Products/pricing error: {e}")

        try:
            extract_testimonials(page, clean_url)
        except Exception as e:
            print(f"  -> Testimonials error: {e}")

        try:
            extract_blog_posts(page, clean_url)
        except Exception as e:
            print(f"  -> Blog extraction error: {e}")

        try:
            extract_partners_clients(page, clean_url)
        except Exception as e:
            print(f"  -> Partners extraction error: {e}")

        try:
            extract_lead_magnets(page, clean_url)
        except Exception as e:
            print(f"  -> Lead magnets error: {e}")

        try:
            extract_meta_info(page, clean_url)
        except Exception as e:
            print(f"  -> Meta info error: {e}")

        try:
            extract_page_content(page, clean_url)
        except Exception as e:
            print(f"  -> Content extraction error: {e}")

        # Discover internal links
        try:
            links = page.css('a::attr(href)').getall()
            for link in links:
                if not link:
                    continue
                full_url = urljoin(clean_url, link)
                full_parsed = urlparse(full_url)
                if full_parsed.netloc and full_parsed.netloc not in ALLOWED_DOMAINS:
                    continue
                normalized = f"{full_parsed.scheme}://{full_parsed.netloc}{full_parsed.path}".rstrip('/')
                if normalized not in visited and normalized not in to_visit:
                    to_visit.append(normalized)
        except Exception as e:
            print(f"  -> Link discovery error: {e}")

        # Polite delay
        time.sleep(0.5)

    print(f"\n{'='*60}")
    print(f"Crawl complete: {page_count} pages visited, {len(all_facts)} facts collected")

    # Deduplicate facts (same topic+key = keep first)
    seen_keys = set()
    unique_facts = []
    for fact in all_facts:
        key = f"{fact['topic']}:{fact['key']}"
        if key not in seen_keys:
            seen_keys.add(key)
            unique_facts.append(fact)

    print(f"After dedup: {len(unique_facts)} unique facts")

    # Write to JSON for inspection before inserting
    output_path = "scripts/oynb_crawl_results.json"
    with open(output_path, 'w') as f:
        json.dump(unique_facts, f, indent=2)
    print(f"Results written to {output_path}")

    return unique_facts


if __name__ == '__main__':
    facts = crawl_oynb()
    print(f"\nReady to insert {len(facts)} facts into knowledge_base")
    print("Run with --insert flag to write to Supabase")

    if '--insert' in sys.argv:
        # Use the Supabase REST API to insert
        import httpx

        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

        # Insert in batches of 50
        inserted = 0
        for i in range(0, len(facts), 50):
            batch = facts[i:i+50]
            resp = httpx.post(
                f"{SUPABASE_URL}/rest/v1/knowledge_base",
                headers=headers,
                json=batch,
                timeout=30,
            )
            if resp.status_code in (200, 201):
                inserted += len(batch)
                print(f"Inserted batch {i//50 + 1}: {len(batch)} rows (total: {inserted})")
            else:
                print(f"Error inserting batch {i//50 + 1}: {resp.status_code} {resp.text}")

        print(f"\nDone: {inserted} facts inserted into knowledge_base")
