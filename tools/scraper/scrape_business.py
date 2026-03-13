"""
Founder Engine - Business Website Scraper
Crawls a business website and extracts structured knowledge base data.
Uses Scrapling for fetching + parsing, outputs JSON knowledge base.

Usage:
    python scrape_business.py https://ajdunlop.co.uk --output ajdunlop_kb.json
"""

import argparse
import json
import re
import sys
import time
from urllib.parse import urljoin, urlparse

from scrapling import Fetcher


def get_sitemap_urls(base_url):
    """Try to discover all pages via sitemap.xml."""
    urls = set()
    sitemap_url = urljoin(base_url, "/sitemap.xml")

    try:
        resp = Fetcher.get(sitemap_url)
        if resp.status == 200:
            # Find nested sitemaps
            sitemap_links = resp.css("sitemap loc")
            if sitemap_links:
                for loc in sitemap_links:
                    sub_url = loc.text.strip()
                    try:
                        sub_resp = Fetcher.get(sub_url)
                        if sub_resp.status == 200:
                            for page_loc in sub_resp.css("url loc"):
                                urls.add(page_loc.text.strip())
                    except Exception:
                        pass
            else:
                # Flat sitemap
                for loc in resp.css("url loc"):
                    urls.add(loc.text.strip())
    except Exception:
        pass

    return urls


def discover_links(resp, base_domain):
    """Extract all internal links from a page response."""
    links = set()
    for a in resp.css("a"):
        href = a.attrib.get("href", "")
        if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        full_url = resp.urljoin(href)
        parsed = urlparse(full_url)
        # Only internal links
        if parsed.netloc == base_domain or parsed.netloc == f"www.{base_domain}":
            # Clean fragment and query
            clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            if clean.endswith("/"):
                clean = clean
            links.add(clean)
    return links


def extract_page_data(resp, url):
    """Extract structured data from a single page."""
    page_data = {
        "url": url,
        "title": "",
        "meta_description": "",
        "headings": [],
        "paragraphs": [],
        "lists": [],
        "contact_info": {
            "phones": [],
            "emails": [],
            "addresses": [],
        },
        "links": [],
        "images": [],
        "raw_text": "",
    }

    # Title
    title_el = resp.css("title")
    if title_el:
        page_data["title"] = title_el[0].text.strip()

    # Meta description
    meta = resp.css('meta[name="description"]')
    if meta:
        page_data["meta_description"] = meta[0].attrib.get("content", "")

    # Headings
    for level in range(1, 7):
        for h in resp.css(f"h{level}"):
            text = h.get_all_text(separator=" ").strip()
            if text and len(text) > 1:
                page_data["headings"].append({"level": level, "text": text})

    # Paragraphs - get meaningful text blocks
    for p in resp.css("p"):
        text = p.get_all_text(separator=" ").strip()
        if text and len(text) > 20:  # Skip tiny fragments
            page_data["paragraphs"].append(text)

    # Lists
    for ul in resp.css("ul, ol"):
        items = []
        for li in ul.css("li"):
            text = li.get_all_text(separator=" ").strip()
            if text:
                items.append(text)
        if items:
            page_data["lists"].append(items)

    # Extract phone numbers from full page text
    full_text = resp.get_all_text(separator=" ").strip()
    phones = re.findall(r'(?:0\d{4}\s?\d{6}|(?:\+44|0044)\s?\d{4}\s?\d{6}|\d{5}\s\d{6})', full_text)
    page_data["contact_info"]["phones"] = list(set(phones))

    # Extract emails
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', full_text)
    page_data["contact_info"]["emails"] = list(set(emails))

    # Images with alt text
    for img in resp.css("img"):
        alt = img.attrib.get("alt", "").strip()
        src = img.attrib.get("src", "")
        if alt and src:
            page_data["images"].append({"alt": alt, "src": resp.urljoin(src)})

    # Raw text (cleaned)
    page_data["raw_text"] = re.sub(r'\s+', ' ', full_text).strip()

    return page_data


def extract_business_knowledge(pages_data):
    """Synthesize page data into structured business knowledge."""
    knowledge = {
        "business_name": "",
        "tagline": "",
        "location": "",
        "phone": "",
        "email": "",
        "website": "",
        "services": [],
        "opening_hours": [],
        "team": [],
        "pricing": [],
        "testimonials": [],
        "certifications": [],
        "areas_served": [],
        "key_facts": [],
        "technology_signals": [],
        "social_links": [],
        "all_pages": [],
    }

    all_phones = set()
    all_emails = set()

    for page in pages_data:
        # Collect contact info
        all_phones.update(page["contact_info"]["phones"])
        all_emails.update(page["contact_info"]["emails"])

        # Page summary
        knowledge["all_pages"].append({
            "url": page["url"],
            "title": page["title"],
            "heading_count": len(page["headings"]),
            "paragraph_count": len(page["paragraphs"]),
        })

        url_lower = page["url"].lower()

        # Services pages
        if "/our-services" in url_lower or "/services" in url_lower:
            service = {
                "page_url": page["url"],
                "name": page["title"].split("|")[0].strip() if page["title"] else "",
                "description": " ".join(page["paragraphs"][:3]),
                "details": [],
            }
            for heading in page["headings"]:
                service["details"].append(heading["text"])
            for lst in page["lists"]:
                service["details"].extend(lst)
            knowledge["services"].append(service)

        # About page
        if "/about" in url_lower:
            knowledge["key_facts"].extend(page["paragraphs"][:5])
            # Look for team members
            for heading in page["headings"]:
                if any(w in heading["text"].lower() for w in ["team", "staff", "meet", "people"]):
                    knowledge["team"].append(heading["text"])

        # Testimonials
        if "/testimonial" in url_lower:
            knowledge["testimonials"].extend(page["paragraphs"])

        # Contact page
        if "/contact" in url_lower or "/find-us" in url_lower or "/how-to-find" in url_lower:
            knowledge["key_facts"].extend(page["paragraphs"][:3])
            # Look for address-like text and hours
            for p in page["paragraphs"]:
                if any(w in p.lower() for w in ["monday", "tuesday", "open", "hours", "am", "pm"]):
                    knowledge["opening_hours"].append(p)
                if any(w in p.lower() for w in ["road", "lane", "street", "hp", "sl", "postcode"]):
                    knowledge["location"] = p

        # Booking page
        if "/booking" in url_lower or "/book" in url_lower:
            knowledge["key_facts"].extend(page["paragraphs"][:3])

        # Look for pricing anywhere
        for p in page["paragraphs"]:
            if re.search(r'[£$]\d+', p):
                knowledge["pricing"].append({"text": p, "source": page["url"]})

        # Certifications
        for p in page["paragraphs"]:
            if any(w in p.lower() for w in ["bosch", "certified", "approved", "accredited", "iso"]):
                knowledge["certifications"].append(p)

    # Set top-level contact info
    if all_phones:
        knowledge["phone"] = list(all_phones)[0]
    if all_emails:
        knowledge["email"] = list(all_emails)[0]

    # Try to extract business name from homepage
    homepage = next((p for p in pages_data if p["url"].rstrip("/").endswith(urlparse(pages_data[0]["url"]).netloc)), None)
    if not homepage and pages_data:
        homepage = pages_data[0]
    if homepage:
        title = homepage["title"]
        knowledge["business_name"] = title.split("|")[0].strip() if title else ""
        knowledge["website"] = homepage["url"]
        if homepage["headings"]:
            knowledge["tagline"] = homepage["headings"][0]["text"]

    return knowledge


def scrape_business(base_url, max_pages=50, delay=1.0):
    """Main scraping function. Crawls site and returns structured knowledge."""
    parsed = urlparse(base_url)
    base_domain = parsed.netloc.replace("www.", "")

    print(f"[*] Scraping {base_url}")
    print(f"[*] Domain: {base_domain}")

    # Step 1: Discover pages via sitemap
    print("[*] Checking sitemap...")
    urls = get_sitemap_urls(base_url)
    print(f"[*] Found {len(urls)} URLs in sitemap")

    # Step 2: Add base URL if not in sitemap
    if not urls:
        urls = {base_url}

    # Filter out attachment/media URLs and non-page content
    skip_patterns = ["/attachment", "/category/", "/author/", "/tag/", "/wp-content/", "/feed/"]
    urls = {u for u in urls if not any(p in u.lower() for p in skip_patterns)}

    # Limit pages
    urls = list(urls)[:max_pages]
    print(f"[*] Will scrape {len(urls)} pages")

    # Step 3: Crawl each page
    pages_data = []
    discovered_urls = set()

    for i, url in enumerate(urls):
        print(f"[{i+1}/{len(urls)}] {url}")
        try:
            resp = Fetcher.get(url)
            if resp.status == 200:
                page_data = extract_page_data(resp, url)
                pages_data.append(page_data)

                # Discover new internal links
                new_links = discover_links(resp, base_domain)
                discovered_urls.update(new_links)
            else:
                print(f"  [!] Status {resp.status}")
        except Exception as e:
            print(f"  [!] Error: {e}")

        if delay > 0 and i < len(urls) - 1:
            time.sleep(delay)

    # Step 4: Crawl any discovered pages not in sitemap
    new_urls = discovered_urls - set(urls)
    new_urls = {u for u in new_urls if not any(p in u.lower() for p in skip_patterns)}
    new_urls = list(new_urls)[:10]  # Cap at 10 extra pages

    if new_urls:
        print(f"[*] Found {len(new_urls)} additional pages from crawling")
        for i, url in enumerate(new_urls):
            print(f"  [extra {i+1}/{len(new_urls)}] {url}")
            try:
                resp = Fetcher.get(url)
                if resp.status == 200:
                    page_data = extract_page_data(resp, url)
                    pages_data.append(page_data)
            except Exception as e:
                print(f"  [!] Error: {e}")
            if delay > 0:
                time.sleep(delay)

    # Step 5: Extract structured knowledge
    print(f"[*] Extracting knowledge from {len(pages_data)} pages...")
    knowledge = extract_business_knowledge(pages_data)

    # Add raw page data for AI processing
    result = {
        "scrape_metadata": {
            "source_url": base_url,
            "pages_crawled": len(pages_data),
            "scrape_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        },
        "knowledge": knowledge,
        "raw_pages": pages_data,
    }

    return result


def main():
    parser = argparse.ArgumentParser(description="Scrape a business website for Founder Engine")
    parser.add_argument("url", help="Business website URL")
    parser.add_argument("--output", "-o", default=None, help="Output JSON file path")
    parser.add_argument("--max-pages", type=int, default=50, help="Max pages to crawl")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between requests (seconds)")
    args = parser.parse_args()

    # Ensure URL has scheme
    url = args.url
    if not url.startswith("http"):
        url = f"https://{url}"

    result = scrape_business(url, max_pages=args.max_pages, delay=args.delay)

    # Output
    output_path = args.output
    if not output_path:
        domain = urlparse(url).netloc.replace("www.", "").replace(".", "_")
        output_path = f"{domain}_kb.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\n[*] Done! Knowledge base saved to {output_path}")
    print(f"[*] Pages crawled: {result['scrape_metadata']['pages_crawled']}")
    print(f"[*] Services found: {len(result['knowledge']['services'])}")
    print(f"[*] Testimonials: {len(result['knowledge']['testimonials'])}")
    print(f"[*] Key facts: {len(result['knowledge']['key_facts'])}")

    return result


if __name__ == "__main__":
    main()
