import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = [
  "app/components/auth/LoginPage.tsx",
  "app/components/auth/RegisterPage.tsx",
  "app/components/settings/SettingsPage.tsx",
  "app/components/calendar/TrackerCalendar.tsx",
  "app/components/calendar/WeekDayListView.tsx",
  "app/components/calendar/MonthWeeksView.tsx"
];

const violations = [];
const textRegex = />\s*([A-Za-z][^<{]{2,})\s*</g;

for (const file of files) {
  const abs = resolve(process.cwd(), file);
  const src = readFileSync(abs, "utf8");
  for (const match of src.matchAll(textRegex)) {
    const text = match[1].trim();
    if (!text || text.includes("{") || text.includes("}")) continue;
    if (text.startsWith("//") || text.startsWith("/*")) continue;
    violations.push({ file, text });
  }
}

if (violations.length > 0) {
  console.warn("Potential hardcoded UI strings (review for i18n):");
  for (const v of violations) {
    console.warn(`  ${v.file}: "${v.text}"`);
  }
  console.warn("Run with node scripts/check-hardcoded-strings.mjs to audit.");
} else {
  console.log("No hardcoded UI string candidates found in tracked files.");
}
