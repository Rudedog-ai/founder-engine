// logos.ts v2 — Inline SVG data URIs matching Composio auth configs
function svg(content: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${content}</svg>`
  )}`
}

export const LOGOS: Record<string, string> = {
  xero: svg(
    '<rect width="32" height="32" rx="6" fill="#13B5EA"/>' +
    '<path d="M11 11l10 10M21 11l-10 10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>'
  ),
  hubspot: svg(
    '<rect width="32" height="32" rx="6" fill="#FF7A59"/>' +
    '<circle cx="16" cy="14" r="4" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<line x1="16" y1="7" x2="16" y2="10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
    '<line x1="16" y1="18" x2="16" y2="21" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
    '<line x1="9" y1="14" x2="12" y2="14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
    '<line x1="20" y1="14" x2="23" y2="14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="22" cy="24" r="2.5" fill="#fff"/><rect x="20.5" y="21" width="3" height="3" fill="#fff"/>'
  ),
  slack: svg(
    '<rect width="32" height="32" rx="6" fill="#4A154B"/>' +
    '<rect x="7" y="13" width="8" height="3" rx="1.5" fill="#E01E5A"/>' +
    '<rect x="13" y="7" width="3" height="8" rx="1.5" fill="#36C5F0"/>' +
    '<rect x="17" y="16" width="8" height="3" rx="1.5" fill="#2EB67D"/>' +
    '<rect x="16" y="17" width="3" height="8" rx="1.5" fill="#ECB22E"/>' +
    '<rect x="13" y="13" width="3" height="3" fill="#E01E5A"/>' +
    '<rect x="16" y="13" width="3" height="3" fill="#36C5F0"/>' +
    '<rect x="13" y="16" width="3" height="3" fill="#ECB22E"/>' +
    '<rect x="16" y="16" width="3" height="3" fill="#2EB67D"/>'
  ),
  google_drive: svg(
    '<rect width="32" height="32" rx="6" fill="#f8f9fa"/>' +
    '<path d="M16 7l8 14H8z" fill="none" stroke="#4285F4" stroke-width="0.5"/>' +
    '<path d="M8 21l4-7h12l-4 7z" fill="#4285F4"/>' +
    '<path d="M12 14L16 7l8 14h-4z" fill="#FBBC04"/>' +
    '<path d="M16 7L8 21l4-7z" fill="#0F9D58"/>'
  ),
  notion: svg(
    '<rect width="32" height="32" rx="6" fill="#fff" stroke="#e0e0e0" stroke-width="0.5"/>' +
    '<path d="M9 7.5h10l4 3.5V25H9z" fill="#fff" stroke="#000" stroke-width="1.5"/>' +
    '<path d="M12 12h8M12 16h8M12 20h5" stroke="#000" stroke-width="1.2" stroke-linecap="round"/>'
  ),
  gmail: svg(
    '<rect width="32" height="32" rx="6" fill="#fff" stroke="#e0e0e0" stroke-width="0.5"/>' +
    '<rect x="5" y="9" width="22" height="15" rx="2" fill="#EA4335" opacity="0.15"/>' +
    '<rect x="5" y="9" width="22" height="15" rx="2" fill="none" stroke="#EA4335" stroke-width="1.5"/>' +
    '<path d="M5 9l11 8.5L27 9" fill="none" stroke="#EA4335" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  stripe: svg(
    '<rect width="32" height="32" rx="6" fill="#635BFF"/>' +
    '<path d="M15.5 10c-3.5 0-5.5 1.8-5.5 4 0 4.5 8 3.5 8 6.5 0 1.8-2 3-5 3" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
    '<line x1="16" y1="7" x2="16" y2="25" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'
  ),
  google_calendar: svg(
    '<rect width="32" height="32" rx="6" fill="#fff" stroke="#e0e0e0" stroke-width="0.5"/>' +
    '<rect x="7" y="9" width="18" height="17" rx="2" fill="none" stroke="#4285F4" stroke-width="1.5"/>' +
    '<line x1="7" y1="14" x2="25" y2="14" stroke="#4285F4" stroke-width="1.5"/>' +
    '<line x1="12" y1="7" x2="12" y2="11" stroke="#4285F4" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="20" y1="7" x2="20" y2="11" stroke="#4285F4" stroke-width="1.5" stroke-linecap="round"/>' +
    '<text x="16" y="23" text-anchor="middle" font-size="8" font-weight="bold" fill="#4285F4">31</text>'
  ),
  google_sheets: svg(
    '<rect width="32" height="32" rx="6" fill="#0F9D58"/>' +
    '<rect x="8" y="6" width="16" height="20" rx="2" fill="#fff"/>' +
    '<line x1="8" y1="12" x2="24" y2="12" stroke="#0F9D58" stroke-width="1"/>' +
    '<line x1="8" y1="17" x2="24" y2="17" stroke="#0F9D58" stroke-width="1"/>' +
    '<line x1="8" y1="22" x2="24" y2="22" stroke="#0F9D58" stroke-width="1"/>' +
    '<line x1="15" y1="6" x2="15" y2="26" stroke="#0F9D58" stroke-width="1"/>'
  ),
  google_docs: svg(
    '<rect width="32" height="32" rx="6" fill="#4285F4"/>' +
    '<rect x="8" y="5" width="16" height="22" rx="2" fill="#fff"/>' +
    '<path d="M12 11h8M12 15h8M12 19h5" stroke="#4285F4" stroke-width="1.2" stroke-linecap="round"/>'
  ),
  google_analytics: svg(
    '<rect width="32" height="32" rx="6" fill="#E37400"/>' +
    '<rect x="9" y="18" width="4" height="7" rx="1" fill="#fff"/>' +
    '<rect x="14" y="13" width="4" height="12" rx="1" fill="#fff"/>' +
    '<rect x="19" y="8" width="4" height="17" rx="1" fill="#fff"/>'
  ),
  google_ads: svg(
    '<rect width="32" height="32" rx="6" fill="#f8f9fa"/>' +
    '<circle cx="11" cy="20" r="4" fill="#FBBC04"/>' +
    '<rect x="14" y="8" width="5" height="16" rx="2.5" fill="#4285F4" transform="rotate(25 16 16)"/>' +
    '<rect x="14" y="8" width="5" height="16" rx="2.5" fill="#34A853" transform="rotate(-15 16 16)"/>'
  ),
  monday: svg(
    '<rect width="32" height="32" rx="6" fill="#6C60FF"/>' +
    '<circle cx="10" cy="20" r="3" fill="#FF3D57"/>' +
    '<circle cx="16" cy="14" r="3" fill="#FFCB00"/>' +
    '<circle cx="22" cy="20" r="3" fill="#00CA72"/>'
  ),
  calendly: svg(
    '<rect width="32" height="32" rx="6" fill="#006BFF"/>' +
    '<rect x="8" y="9" width="16" height="15" rx="2" fill="none" stroke="#fff" stroke-width="1.5"/>' +
    '<line x1="8" y1="14" x2="24" y2="14" stroke="#fff" stroke-width="1.5"/>' +
    '<line x1="12" y1="7" x2="12" y2="11" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="20" y1="7" x2="20" y2="11" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>' +
    '<circle cx="16" cy="19" r="2" fill="#fff"/>'
  ),
}
