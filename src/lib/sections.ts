// Chaves de navegação — controlam quais secções aparecem na sidebar
export const NAV_SECTIONS = {
  HOME:     "home",
  FEED:     "feed",
  CALENDAR: "calendar",
  PEOPLE:   "people",
  DOCS:     "docs",
  MANUAL:   "manual",
  PROFILE:  "profile",
  TOOLS:    "tools",
  ADMIN:    "admin",
} as const;

// Chaves de permissão granular — funcionalidades dentro das secções
export const SECTIONS = {
  DASHBOARD_CARD_BC:        "dashboard.card.bc",
  DASHBOARD_CARD_SESAME:    "dashboard.card.sesame",
  DASHBOARD_CARD_PIPEDRIVE: "dashboard.card.pipedrive",
  DASHBOARD_CARD_WWM:       "dashboard.card.wwm",
  ANNOUNCEMENTS_WRITE:      "announcements.write",
  MANUAL_WRITE:             "manual.write",
  DOCS_DRIVE:               "docs.drive",
  DOCS_LIBRARY:             "docs.library",
  TOOLS_LEGACY:             "tools.legacy",
  ADMIN_USERS:              "admin.users",
  ADMIN_ROLES:              "admin.roles",
  ADMIN_CONTENT:            "admin.content",
  ADMIN_SYNC:               "admin.sync",
  ADMIN_AUDIT:              "admin.audit",
} as const;

export type NavSectionKey = (typeof NAV_SECTIONS)[keyof typeof NAV_SECTIONS];
export type SectionKey = (typeof SECTIONS)[keyof typeof SECTIONS];
export type AnyPermissionKey = NavSectionKey | SectionKey;

// Wildcard — acesso total (só isAdmin de sistema)
export const WILDCARD = "*";

export function hasPermission(
  userSections: string[],
  key: AnyPermissionKey,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (userSections.includes(WILDCARD)) return true;
  return userSections.includes(key);
}
