// logos.ts v1 — Inline SVG data URIs for integration brand icons
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
  salesforce: svg(
    '<rect width="32" height="32" rx="6" fill="#00A1E0"/>' +
    '<path d="M7 18c0-3 2-5 5-5 1-2 3-3 5-3s4 1.5 4.5 3.5c2 0 3.5 1.5 3.5 3.5s-1.5 3.5-3.5 3.5H10c-2 0-3-1.5-3-2.5z" fill="#fff"/>'
  ),
  quickbooks: svg(
    '<rect width="32" height="32" rx="6" fill="#2CA01C"/>' +
    '<circle cx="16" cy="16" r="9" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<path d="M13 11v10M13 16h5a2.5 2.5 0 0 0 0-5H13" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  gmail: svg(
    '<rect width="32" height="32" rx="6" fill="#fff" stroke="#e0e0e0" stroke-width="0.5"/>' +
    '<rect x="5" y="9" width="22" height="15" rx="2" fill="#EA4335" opacity="0.15"/>' +
    '<rect x="5" y="9" width="22" height="15" rx="2" fill="none" stroke="#EA4335" stroke-width="1.5"/>' +
    '<path d="M5 9l11 8.5L27 9" fill="none" stroke="#EA4335" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  linkedin: svg(
    '<rect width="32" height="32" rx="6" fill="#0A66C2"/>' +
    '<rect x="8" y="14" width="4" height="11" rx="0.5" fill="#fff"/>' +
    '<circle cx="10" cy="10.5" r="2.5" fill="#fff"/>' +
    '<path d="M18 14h3.5c1.9 0 3.5 1.6 3.5 3.5V25h-4v-6.5a1.5 1.5 0 0 0-3 0V25h-4v-11h4z" fill="#fff"/>'
  ),
  apollo: svg(
    '<rect width="32" height="32" rx="6" fill="#6C63FF"/>' +
    '<circle cx="16" cy="16" r="7" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="16" cy="16" r="2.5" fill="#fff"/>'
  ),
  stripe: svg(
    '<rect width="32" height="32" rx="6" fill="#635BFF"/>' +
    '<path d="M15.5 10c-3.5 0-5.5 1.8-5.5 4 0 4.5 8 3.5 8 6.5 0 1.8-2 3-5 3" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
    '<line x1="16" y1="7" x2="16" y2="25" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'
  ),
}
