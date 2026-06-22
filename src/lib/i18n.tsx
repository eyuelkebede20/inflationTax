import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "am" | "om";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "om", label: "OM" },
  { code: "am", label: "አማ" },
  { code: "en", label: "EN" },
];

type Dict = Record<string, string>;

// en is the source of truth for keys. am = Amharic, om = Afaan Oromo.
const en: Dict = {
  "nav.profile": "Profile",
  "nav.signin": "Sign in",
  "nav.signout": "Sign out",

  "common.calculate": "Calculate",
  "common.save": "Save",
  "common.back": "← Back to calculator",
  "common.untitled": "Untitled",
  "common.change_settings": "change in Settings",
  "common.inflation_in_use": "Inflation rate in use",
  "common.saved_account": "Saved to your account",
  "common.saved_device": "Saved on this device",

  "home.title": "Adjust last year's tax for inflation — fairly.",
  "home.subtitle":
    "A new flat \"curfew\" rate often charges far less than a business paid last year. So instead of resetting to the new rate, this year's tax keeps last year's tax and adds only the rise inflation brings to the curfew tax.",
  "home.why_title": "Why this matters",
  "home.why_body":
    "Say Abebe paid 50,370 last year (TOT + profit tax). The new curfew rate alone might bill only ~9,000 — a steep drop in revenue. Instead, this year's tax = last year's tax + (curfew on the inflation-adjusted turnover − curfew on last year's turnover). The bill keeps pace with inflation and never falls below what was already paid.",
  "home.latest": "Latest result",
  "home.history": "History",
  "home.click_row": "Click a row below for the full breakdown.",

  "form.new_entry": "New entry",
  "form.help":
    "Enter the turnover and/or the actual last year's tax. Give turnover to derive the tax; give the tax to back-solve the turnover; give both and the typed tax is used.",
  "form.name": "Taxpayer name",
  "form.tin": "TIN",
  "form.business_type": "Business type",
  "form.is_service": "Service business (apply 10% TOT) — uncheck to drop TOT",
  "form.turnover": "Turnover / taxable income (Birr)",
  "form.lastyear_tax": "Last year's tax paid (optional)",
  "form.err_need_input": "Enter a turnover or a last year's tax.",
  "form.err_invalid": "Enter valid, non-negative numbers.",

  "result.lastyear_tax": "Last year's tax",
  "result.tax_before": "Curfew tax (before)",
  "result.tax_with": "Curfew tax (with inflation)",
  "result.garaagaruma": "Difference (Garaagaruma)",
  "result.taaksii2018": "Taaksii Bara 2018",
  "result.derived": "derived",
  "result.entered": "entered",

  "table.tl": "TL",
  "table.name": "Name",
  "table.tin": "TIN",
  "table.business": "Business",
  "table.lastyear_tax": "2017 tax",
  "table.sales_before": "Sales before infl.",
  "table.tax_before": "Tax before infl.",
  "table.sales_with": "Sales with infl.",
  "table.tax_with": "Tax with infl.",
  "table.garaagaruma": "Garaagaruma",
  "table.taaksii2018": "Taaksii Bara 2018",
  "table.empty": "No entries yet. Add one above and it will appear here.",

  "analysis.entry": "Entry",
  "analysis.metric": "Metric",
  "analysis.before": "Before inflation",
  "analysis.with": "With inflation",
  "analysis.delta_abs": "Δ (abs)",
  "analysis.delta_pct": "Δ (%)",
  "analysis.turnover": "Turnover",
  "analysis.curfew_rate": "Curfew rate",
  "analysis.curfew_tax": "Curfew tax",
  "analysis.buildup": "Last year's tax",
  "analysis.tot": "TOT",
  "analysis.profit_tax": "Profit tax",
  "analysis.bracket_jump": "Inflation pushed the curfew bracket from {a} up to {b}.",
  "analysis.result_title": "This year's tax (Taaksii Bara 2018)",
  "analysis.plus_diff": "+ Inflation difference",
  "analysis.chart": "Before vs with inflation",
  "analysis.result_note":
    "We don't reset to the new curfew rate — we keep last year's tax and add only the inflation difference.",
  "analysis.tot_dropped": "Not a service — TOT dropped",

  "profile.title": "Profile",
  "profile.signed_in_as": "Signed in as {email}",
  "profile.anon":
    "Anonymous mode — settings and history stay on this device.",
  "profile.settings": "Settings",
  "profile.inflation_rate": "Inflation rate (e.g. 0.152 for 15.2%)",
  "profile.tot_rate": "TOT rate (e.g. 0.10 for 10%)",
  "profile.margin": "Profit margin (e.g. 0.10 for 10%)",
  "profile.saved": "Settings saved.",
  "profile.err_settings": "Rates must be non-negative numbers.",
  "profile.reset_title": "Reset history",
  "profile.reset_help": "Permanently delete every saved entry.",
  "profile.reset_btn": "Delete all history",
  "profile.reset_done": "All history deleted.",
  "profile.reset_confirm": "Delete ALL saved entries? This cannot be undone.",
  "profile.account": "Account",
  "profile.change_pw": "Change password",
  "profile.update": "Update",
  "profile.pw_updated": "Password updated.",
  "profile.language": "Language",

  "common.err_load": "Failed to load history.",
  "common.err_save": "Failed to save calculation.",
  "common.delete": "Delete",
  "common.delete_confirm": "Delete this entry?",
  "common.print": "Print",
  "common.share": "Share",
  "common.copied": "Link copied to clipboard",
  "common.search": "Search name, TIN, business…",
  "common.filter_all": "All",
  "common.filter_service": "Service",
  "common.filter_nonservice": "Non-service",
  "common.no_match": "No entries match your search.",

  "shared.title": "Shared analysis",
  "shared.invalid": "This shared link is invalid or incomplete.",
  "shared.open_app": "Open InflaTax →",

  "chat.title": "Ask InflaTax",
  "chat.placeholder": "Ask about the tax, inflation, or how to use this…",
  "chat.send": "Send",
  "chat.intro":
    "Hi! Ask me anything about this calculator — the curfew rate, TOT, profit tax, inflation, or how a number was reached.",
  "chat.error": "Something went wrong. Please try again.",
  "chat.not_configured":
    "The assistant isn't set up yet. Add a GEMINI_API_KEY to enable it.",
  "chat.rate_limited":
    "I've hit the free usage limit for a moment. Please wait about 2 minutes and try again — or come back shortly.",
  "chat.thinking": "Thinking…",
  "chat.chip1": "How is this year's tax calculated?",
  "chat.chip2": "What is the curfew rate?",
  "chat.chip3": "What's the difference between Tax and Rental?",

  "print.subtitle": "Curfew + inflation tax — Schedule B",

  "auth.signin": "Sign in",
  "auth.create_account": "Create account",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.new_password": "New password",
  "auth.no_account": "No account?",
  "auth.have_account": "Already have an account?",
  "auth.forgot": "Forgot password?",
  "auth.continue_anon": "Continue without signing in →",
  "auth.reset_title": "Reset password",
  "auth.reset_help": "We'll email you a link to set a new password.",
  "auth.send_reset": "Send reset link",
  "auth.reset_sent": "Check your email for a password reset link.",
  "auth.back_signin": "Back to sign in",
  "auth.update_title": "Set a new password",
  "auth.update_help": "Open this page from the link in your reset email.",
  "auth.update_btn": "Update password",
  "auth.updated": "Password updated. Redirecting…",
  "auth.created": "Account created. Check your email to confirm, then sign in.",
  "auth.import_local":
    "Import calculations saved on this device into your account?",
  "auth.pw_min": "Password must be at least 6 characters.",

  "footer.tag": "InflaTax · curfew + inflation tax calculator (Schedule B)",

  // --- v2 (roles, branches, rental/tax, lock-on-print) ---
  "nav.dashboard": "Dashboard",
  "nav.admin": "Admin",
  "nav.superadmin": "Superadmin",
  "nav.dev_role": "Preview role",
  "nav.all_branches": "All branches",

  "form.kind": "Entry type",
  "form.kind_tax": "Tax",
  "form.kind_rental": "Rental",
  "form.rental_note": "Rental: only {pct} of the income is fed to the curfew + inflation math.",
  "form.err_required": "Fill in name, TIN, sales, and last year's tax.",

  "common.print_all": "Print all",
  "common.print_card": "Print card",
  "common.void": "Void",
  "common.void_prompt": "Reason for voiding this locked entry:",
  "common.void_need_reason": "A reason is required to void an entry.",
  "common.void_default_reason": "Voided by admin",
  "common.voided": "VOID",
  "common.locked": "Locked (printed)",
  "common.prev": "Prev",
  "common.next": "Next",
  "common.page_of": "Page {page} of {total}",
  "common.total_entries": "{n} entries",

  "print.card_title": "Tax Computation — Schedule B 2018",

  "analysis.rental_base": "Rental — {pct} fed to the math = {base}",

  "admin.title": "Admin dashboard",
  "admin.subtitle": "Branch: {branch}",
  "admin.no_branch": "All branches",
  "admin.entries": "Entries",
  "admin.total_lastyear": "Total last-year tax",
  "admin.total_2018": "Total Taaksii 2018",
  "admin.review_note": "Review and manage individual entries on the",
  "admin.open_entries": "entries page →",

  "super.title": "Superadmin dashboard",
  "super.subtitle": "Branches, global rates, analytics, and the void trail.",
  "super.rates": "Global rates",
  "super.rental_share": "Rental share (e.g. 0.5 for 50%)",
  "super.err_rates": "Rates must be non-negative numbers.",
  "super.branches": "Branches",
  "super.branch_name": "New branch name",
  "super.branch_ph": "e.g. Bole branch",
  "super.add_branch": "Add branch",
  "super.no_branches": "No branches yet. Add one above.",
  "super.branch_del_confirm": "Delete this branch?",
  "super.admin_note":
    "Creating admins with passwords needs server-side auth (see tasks.md) — branches are the local preview for now.",
  "super.analytics": "Branch analytics",
  "super.grand_total": "Grand total",
  "super.branch": "Branch",
  "super.voids": "Void notifications",
  "super.no_voids": "No voided entries.",
  "super.ack": "Acknowledge",
  "super.rate_note": "Rental entries currently feed {r} of income to the algorithm.",

  "profile.signin_to_change":
    "Sign in to change your password (available once auth is enabled).",
};

const am: Dict = {
  "nav.profile": "መገለጫ",
  "nav.signin": "ግባ",
  "nav.signout": "ውጣ",

  "common.calculate": "አስላ",
  "common.save": "አስቀምጥ",
  "common.back": "← ወደ ማስያ ተመለስ",
  "common.untitled": "ርዕስ የለም",
  "common.change_settings": "በቅንብሮች ቀይር",
  "common.inflation_in_use": "ጥቅም ላይ ያለ የዋጋ ግሽበት",
  "common.saved_account": "በመለያህ ተቀምጧል",
  "common.saved_device": "በዚህ መሣሪያ ተቀምጧል",

  "home.title": "የአምናውን ግብር በዋጋ ግሽበት በፍትሐዊነት አስተካክል።",
  "home.subtitle":
    "አዲሱ ቋሚ \"የከርሰ-ምሽት\" መጣኔ ብዙ ጊዜ ንግዱ አምና ከከፈለው በጣም ያንሳል። ስለዚህ ወደ አዲሱ መጣኔ ከመመለስ ይልቅ የዘንድሮ ግብር የአምናውን ግብር ይዞ የግሽበቱን ጭማሪ ብቻ ይጨምራል።",
  "home.why_title": "ለምን ጠቃሚ ሆነ",
  "home.why_body":
    "ለምሳሌ አበበ አምና 50,370 ከፍሏል (TOT + የትርፍ ግብር)። አዲሱ የከርሰ-ምሽት መጣኔ ብቻውን ~9,000 ሊያስከፍል ይችላል — ትልቅ ቅናሽ። በምትኩ፣ የዘንድሮ ግብር = የአምና ግብር + (በግሽበት የተስተካከለ ሽያጭ ላይ ያለ ከርሰ-ምሽት − የአምና ሽያጭ ላይ ያለ ከርሰ-ምሽት)። ግብሩ ከግሽበት ጋር ይሄዳል እንጂ ከተከፈለው አያንስም።",
  "home.latest": "የቅርብ ውጤት",
  "home.history": "ታሪክ",
  "home.click_row": "ሙሉ ዝርዝር ለማየት ከታች ያለውን ረድፍ ጫን።",

  "form.new_entry": "አዲስ ግቤት",
  "form.help":
    "ጠቅላላ ሽያጩን እና/ወይም የአምናውን ትክክለኛ ግብር አስገባ። ሽያጭ ካስገባህ ግብሩ ይሰላል፤ ግብር ካስገባህ ሽያጩ ይሰላል፤ ሁለቱንም ካስገባህ የተጻፈው ግብር ይወሰዳል።",
  "form.name": "የግብር ከፋይ ስም",
  "form.tin": "TIN",
  "form.business_type": "የንግድ ዓይነት",
  "form.is_service": "የአገልግሎት ንግድ (10% TOT ይተገበራል) — ለሌላ አንሳ",
  "form.turnover": "ጠቅላላ ሽያጭ / ታክስ የሚከፈልበት ገቢ (ብር)",
  "form.lastyear_tax": "የአምና የተከፈለ ግብር (አማራጭ)",
  "form.err_need_input": "ጠቅላላ ሽያጭ ወይም የአምና ግብር አስገባ።",
  "form.err_invalid": "ትክክለኛ፣ አሉታዊ ያልሆኑ ቁጥሮችን አስገባ።",

  "result.lastyear_tax": "የአምና ግብር",
  "result.tax_before": "የከርሰ-ምሽት ግብር (ከግሽበት በፊት)",
  "result.tax_with": "የከርሰ-ምሽት ግብር (ከግሽበት ጋር)",
  "result.garaagaruma": "ልዩነት (Garaagaruma)",
  "result.taaksii2018": "Taaksii Bara 2018",
  "result.derived": "የተሰላ",
  "result.entered": "የገባ",

  "table.tl": "ተራ",
  "table.name": "ስም",
  "table.tin": "TIN",
  "table.business": "ንግድ",
  "table.lastyear_tax": "የ2017 ግብር",
  "table.sales_before": "ሽያጭ ከግሽበት በፊት",
  "table.tax_before": "ግብር ከግሽበት በፊት",
  "table.sales_with": "ሽያጭ ከግሽበት ጋር",
  "table.tax_with": "ግብር ከግሽበት ጋር",
  "table.garaagaruma": "Garaagaruma",
  "table.taaksii2018": "Taaksii Bara 2018",
  "table.empty": "እስካሁን ግቤት የለም። ከላይ አንዱን ጨምር።",

  "analysis.entry": "ግቤት",
  "analysis.metric": "መለኪያ",
  "analysis.before": "ከግሽበት በፊት",
  "analysis.with": "ከግሽበት ጋር",
  "analysis.delta_abs": "ልዩነት",
  "analysis.delta_pct": "ልዩነት (%)",
  "analysis.turnover": "ጠቅላላ ሽያጭ",
  "analysis.curfew_rate": "የከርሰ-ምሽት መጣኔ",
  "analysis.curfew_tax": "የከርሰ-ምሽት ግብር",
  "analysis.buildup": "የአምና ግብር",
  "analysis.tot": "TOT",
  "analysis.profit_tax": "የትርፍ ግብር",
  "analysis.bracket_jump": "የዋጋ ግሽበት የከርሰ-ምሽት መጣኔን ከ{a} ወደ {b} ከፍ አደረገ።",
  "analysis.result_title": "የዘንድሮ ግብር (Taaksii Bara 2018)",
  "analysis.plus_diff": "+ የግሽበት ልዩነት",
  "analysis.chart": "ከግሽበት በፊት እና በኋላ",
  "analysis.result_note":
    "ወደ አዲሱ የከርሰ-ምሽት መጣኔ አንመለስም — የአምናውን ግብር ይዘን የግሽበቱን ልዩነት ብቻ እንጨምራለን።",
  "analysis.tot_dropped": "አገልግሎት አይደለም — TOT ተትቷል",

  "profile.title": "መገለጫ",
  "profile.signed_in_as": "የገባኸው እንደ {email}",
  "profile.anon": "ስም-አልባ ሁነታ — ቅንብሮችና ታሪክ በዚህ መሣሪያ ይቆያሉ።",
  "profile.settings": "ቅንብሮች",
  "profile.inflation_rate": "የዋጋ ግሽበት መጣኔ (ለምሳሌ 0.152 ለ15.2%)",
  "profile.tot_rate": "የTOT መጣኔ (ለምሳሌ 0.10 ለ10%)",
  "profile.margin": "የትርፍ ህዳግ (ለምሳሌ 0.10 ለ10%)",
  "profile.saved": "ቅንብሮች ተቀምጠዋል።",
  "profile.err_settings": "መጣኔዎች አሉታዊ ያልሆኑ ቁጥሮች መሆን አለባቸው።",
  "profile.reset_title": "ታሪክ አጥፋ",
  "profile.reset_help": "ሁሉንም የተቀመጡ ግቤቶች በቋሚነት ሰርዝ።",
  "profile.reset_btn": "ሁሉንም ታሪክ ሰርዝ",
  "profile.reset_done": "ሁሉም ታሪክ ተሰርዟል።",
  "profile.reset_confirm": "ሁሉንም ግቤቶች ሰርዝ? ይህ መመለስ አይቻልም።",
  "profile.account": "መለያ",
  "profile.change_pw": "የይለፍ ቃል ቀይር",
  "profile.update": "አዘምን",
  "profile.pw_updated": "የይለፍ ቃል ተቀይሯል።",
  "profile.language": "ቋንቋ",

  "common.err_load": "ታሪክን መጫን አልተሳካም።",
  "common.err_save": "ስሌቱን ማስቀመጥ አልተሳካም።",
  "common.delete": "ሰርዝ",
  "common.delete_confirm": "ይህን ግቤት ሰርዝ?",
  "common.print": "አትም",
  "common.share": "አጋራ",
  "common.copied": "ሊንኩ ተቀድቷል",
  "common.search": "ስም፣ TIN፣ ንግድ ፈልግ…",
  "common.filter_all": "ሁሉም",
  "common.filter_service": "አገልግሎት",
  "common.filter_nonservice": "አገልግሎት ያልሆነ",
  "common.no_match": "ከፍለጋህ ጋር የሚዛመድ ግቤት የለም።",

  "shared.title": "የተጋራ ትንታኔ",
  "shared.invalid": "ይህ የተጋራ ሊንክ ልክ ያልሆነ ወይም ያልተሟላ ነው።",
  "shared.open_app": "InflaTax ክፈት →",

  "chat.title": "InflaTax ጠይቅ",
  "chat.placeholder": "ስለ ግብሩ፣ ግሽበቱ ወይም አጠቃቀሙ ጠይቅ…",
  "chat.send": "ላክ",
  "chat.intro":
    "ሰላም! ስለዚህ ማስያ ማንኛውንም ጠይቀኝ — የከርሰ-ምሽት መጣኔ፣ TOT፣ የትርፍ ግብር፣ ግሽበት ወይም አንድ ቁጥር እንዴት እንደተገኘ።",
  "chat.error": "የሆነ ችግር ተፈጥሯል። እባክህ እንደገና ሞክር።",
  "chat.not_configured":
    "ረዳቱ ገና አልተዘጋጀም። ለማስቻል GEMINI_API_KEY አክል።",
  "chat.rate_limited":
    "ለጊዜው ነፃ የአጠቃቀም ገደብ ላይ ደርሻለሁ። እባክህ 2 ደቂቃ ያህል ጠብቀህ እንደገና ሞክር — ወይም ቆይተህ ተመለስ።",
  "chat.thinking": "በማሰብ ላይ…",
  "chat.chip1": "የዘንድሮ ግብር እንዴት ይሰላል?",
  "chat.chip2": "የከርሰ-ምሽት መጣኔ ስንት ነው?",
  "chat.chip3": "በግብር እና በኪራይ መካከል ያለው ልዩነት ምንድን ነው?",

  "print.subtitle": "የከርሰ-ምሽት + ግሽበት ግብር — ሰንጠረዥ B",

  "auth.signin": "ግባ",
  "auth.create_account": "መለያ ፍጠር",
  "auth.email": "ኢሜይል",
  "auth.password": "የይለፍ ቃል",
  "auth.new_password": "አዲስ የይለፍ ቃል",
  "auth.no_account": "መለያ የለህም?",
  "auth.have_account": "መለያ አለህ?",
  "auth.forgot": "የይለፍ ቃል ረሳህ?",
  "auth.continue_anon": "ሳትገባ ቀጥል →",
  "auth.reset_title": "የይለፍ ቃል ዳግም አስጀምር",
  "auth.reset_help": "አዲስ የይለፍ ቃል ለማስያዝ ሊንክ በኢሜይል እንልክልሃለን።",
  "auth.send_reset": "የዳግም ማስጀመሪያ ሊንክ ላክ",
  "auth.reset_sent": "የይለፍ ቃል ማስጀመሪያ ሊንክ ኢሜይልህን ተመልከት።",
  "auth.back_signin": "ወደ መግቢያ ተመለስ",
  "auth.update_title": "አዲስ የይለፍ ቃል አስይዝ",
  "auth.update_help": "ይህን ገጽ ከኢሜይልህ ሊንክ ክፈት።",
  "auth.update_btn": "የይለፍ ቃል አዘምን",
  "auth.updated": "የይለፍ ቃል ተቀይሯል። በመዘዋወር ላይ…",
  "auth.created": "መለያ ተፈጥሯል። ለማረጋገጥ ኢሜይልህን ተመልክተህ ግባ።",
  "auth.import_local": "በዚህ መሣሪያ የተቀመጡ ስሌቶችን ወደ መለያህ አስገባ?",
  "auth.pw_min": "የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት።",

  "footer.tag": "InflaTax · የከርሰ-ምሽት + ግሽበት ግብር ማስያ (ሰንጠረዥ B)",

  // --- v2 ---
  "nav.dashboard": "ዳሽቦርድ",
  "nav.admin": "አስተዳዳሪ",
  "nav.superadmin": "ሱፐር አስተዳዳሪ",
  "nav.dev_role": "ሚና ቅድመ-እይታ",
  "nav.all_branches": "ሁሉም ቅርንጫፎች",

  "form.kind": "የግቤት ዓይነት",
  "form.kind_tax": "ግብር",
  "form.kind_rental": "ኪራይ",
  "form.rental_note": "ኪራይ፡ ከገቢው {pct} ብቻ ለስሌቱ ይውላል።",
  "form.err_required": "ስም፣ TIN፣ ሽያጭ እና የአምና ግብር ሙላ።",

  "common.print_all": "ሁሉንም አትም",
  "common.print_card": "ካርድ አትም",
  "common.void": "ሰርዝ",
  "common.void_prompt": "ይህን የተቆለፈ ግቤት ለመሰረዝ ምክንያት፡",
  "common.void_need_reason": "ግቤትን ለመሰረዝ ምክንያት ያስፈልጋል።",
  "common.void_default_reason": "በአስተዳዳሪ ተሰርዟል",
  "common.voided": "ተሰርዟል",
  "common.locked": "ተቆልፏል (ታትሟል)",
  "common.prev": "ቀዳሚ",
  "common.next": "ቀጣይ",
  "common.page_of": "ገጽ {page} ከ {total}",
  "common.total_entries": "{n} ግቤቶች",

  "print.card_title": "የግብር ስሌት — ሰንጠረዥ B 2018",

  "analysis.rental_base": "ኪራይ — {pct} ለስሌቱ = {base}",

  "admin.title": "የአስተዳዳሪ ዳሽቦርድ",
  "admin.subtitle": "ቅርንጫፍ፡ {branch}",
  "admin.no_branch": "ሁሉም ቅርንጫፎች",
  "admin.entries": "ግቤቶች",
  "admin.total_lastyear": "ጠቅላላ የአምና ግብር",
  "admin.total_2018": "ጠቅላላ ታክሲ 2018",
  "admin.review_note": "የግለሰብ ግቤቶችን በ",
  "admin.open_entries": "ግቤቶች ገጽ ላይ ይመልከቱ →",

  "super.title": "የሱፐር አስተዳዳሪ ዳሽቦርድ",
  "super.subtitle": "ቅርንጫፎች፣ አጠቃላይ መጣኔዎች፣ ትንታኔ እና የስረዛ መዝገብ።",
  "super.rates": "አጠቃላይ መጣኔዎች",
  "super.rental_share": "የኪራይ ድርሻ (ለምሳሌ 0.5 ለ50%)",
  "super.err_rates": "መጣኔዎች አሉታዊ ያልሆኑ ቁጥሮች መሆን አለባቸው።",
  "super.branches": "ቅርንጫፎች",
  "super.branch_name": "አዲስ የቅርንጫፍ ስም",
  "super.branch_ph": "ለምሳሌ ቦሌ ቅርንጫፍ",
  "super.add_branch": "ቅርንጫፍ ጨምር",
  "super.no_branches": "እስካሁን ቅርንጫፍ የለም። ከላይ ጨምር።",
  "super.branch_del_confirm": "ይህን ቅርንጫፍ ሰርዝ?",
  "super.admin_note":
    "የይለፍ ቃል ያላቸው አስተዳዳሪዎችን መፍጠር የአገልጋይ-ጎን ማረጋገጫ ይፈልጋል (tasks.md ይመልከቱ) — ለአሁኑ ቅርንጫፎች የቅድመ-እይታ ናቸው።",
  "super.analytics": "የቅርንጫፍ ትንታኔ",
  "super.grand_total": "ጠቅላላ ድምር",
  "super.branch": "ቅርንጫፍ",
  "super.voids": "የስረዛ ማሳወቂያዎች",
  "super.no_voids": "የተሰረዙ ግቤቶች የሉም።",
  "super.ack": "አረጋግጥ",
  "super.rate_note": "የኪራይ ግቤቶች በአሁኑ ጊዜ ከገቢ {r} ለስሌቱ ይውላሉ።",

  "profile.signin_to_change": "የይለፍ ቃልህን ለመቀየር ግባ (ማረጋገጫ ሲነቃ ይገኛል)።",
};

const om: Dict = {
  "nav.profile": "Profaayilii",
  "nav.signin": "Seeni",
  "nav.signout": "Ba'i",

  "common.calculate": "Shallagi",
  "common.save": "Olkaa'i",
  "common.back": "← Gara shallagaatti deebi'i",
  "common.untitled": "Mata-duree hin qabu",
  "common.change_settings": "Qindaa'ina keessatti jijjiiri",
  "common.inflation_in_use": "Saffisa dhiibbaa gatii fayyadamaa jiru",
  "common.saved_account": "Herrega keetti olkaa'ame",
  "common.saved_device": "Meeshaa kana irratti olkaa'ame",

  "home.title": "Taaksii bara darbee dhiibbaa gatiitiin haqaan sirreessi.",
  "home.subtitle":
    "Saffisni \"sadarkaa\" haaraan yeroo baay'ee waan daldalaan bara darbee kaffale caalaa baay'ee xiqqeessa. Kanaaf, gara saffisa haaraatti deebi'uu mannaa, taaksiin bara kanaa taaksii bara darbee qabatee dabala dhiibbaa gatii qofa itti dabala.",
  "home.why_title": "Maaliif barbaachise",
  "home.why_body":
    "Fakkeenyaaf Abbabaan bara darbee 50,370 kaffale (TOT + taaksii bu'aa). Saffisni sadarkaa haaraan qofti gara ~9,000 qofa kaffalchiisuu danda'a — hir'ina guddaa. Kanaa mannaa, taaksiin bara kanaa = taaksii bara darbee + (sadarkaa gurgurtaa dhiibbaadhaan sirraa'e irratti − sadarkaa gurgurtaa bara darbee irratti). Taaksiin dhiibbaa gatii waliin deema malee waan kaffalame gadi hin bu'u.",
  "home.latest": "Bu'aa dhiyeenyaa",
  "home.history": "Seenaa",
  "home.click_row": "Ibsa guutuu argachuuf sarara gadii cuqaasi.",

  "form.new_entry": "Galmee haaraa",
  "form.help":
    "Gurgurtaa fi/yookiin taaksii bara darbee dhugaa galchi. Gurgurtaa galchite taaksiin ni shallagama; taaksii galchite gurgurtaan ni argama; lamaan galchite taaksiin barreeffame fayyada.",
  "form.name": "Maqaa Kafalaa Gibiraa",
  "form.tin": "TIN",
  "form.business_type": "Gosa daldala",
  "form.is_service": "Daldala tajaajilaa (10% TOT itti fayyadami) — kan biraatiif saaqi",
  "form.turnover": "Gurgurtaa waliigalaa / galii taaksii (Birrii)",
  "form.lastyear_tax": "Taaksii bara darbee kaffalame (filannoo)",
  "form.err_need_input": "Gurgurtaa yookiin taaksii bara darbee galchi.",
  "form.err_invalid": "Lakkoofsa sirrii, kan hin negatiivii galchi.",

  "result.lastyear_tax": "Taaksii bara darbee",
  "result.tax_before": "Taaksii sadarkaa (dura)",
  "result.tax_with": "Taaksii sadarkaa (dhiibbaa wajjin)",
  "result.garaagaruma": "Garaagaruma",
  "result.taaksii2018": "Taaksii Bara 2018",
  "result.derived": "shallagame",
  "result.entered": "galche",

  "table.tl": "TL",
  "table.name": "Maqaa",
  "table.tin": "TIN",
  "table.business": "Daldala",
  "table.lastyear_tax": "Taaksii 2017",
  "table.sales_before": "Sales before inflation",
  "table.tax_before": "tax before inflation",
  "table.sales_with": "sales with inflation",
  "table.tax_with": "Tax with inflation",
  "table.garaagaruma": "Garaagaruma",
  "table.taaksii2018": "Taaksii Bara 2018",
  "table.empty": "Hanga ammaatti galmeen hin jiru. Olitti tokko dabali.",

  "analysis.entry": "Galmee",
  "analysis.metric": "Safartuu",
  "analysis.before": "Dhiibbaa dura",
  "analysis.with": "Dhiibbaa wajjin",
  "analysis.delta_abs": "Garaagaruma",
  "analysis.delta_pct": "Garaagaruma (%)",
  "analysis.turnover": "Gurgurtaa",
  "analysis.curfew_rate": "Saffisa sadarkaa",
  "analysis.curfew_tax": "Taaksii sadarkaa",
  "analysis.buildup": "Taaksii bara darbee",
  "analysis.tot": "TOT",
  "analysis.profit_tax": "Taaksii bu'aa",
  "analysis.bracket_jump":
    "Dhiibbaan gatii saffisa sadarkaa {a} irraa gara {b} ol kaase.",
  "analysis.result_title": "Taaksii bara kanaa (Taaksii Bara 2018)",
  "analysis.plus_diff": "+ Garaagaruma dhiibbaa",
  "analysis.chart": "Dhiibbaa dura fi booda",
  "analysis.result_note":
    "Gara saffisa sadarkaa haaraatti hin deebinu — taaksii bara darbee qabannee garaagaruma dhiibbaa qofa dabalna.",
  "analysis.tot_dropped": "Tajaajila miti — TOT hafe",

  "profile.title": "Profaayilii",
  "profile.signed_in_as": "Akka {email} seente",
  "profile.anon":
    "Haala maqaa-malee — qindaa'inniifi seenaan meeshaa kana irra turu.",
  "profile.settings": "Qindaa'ina",
  "profile.inflation_rate": "Saffisa dhiibbaa gatii (fkn 0.152 = 15.2%)",
  "profile.tot_rate": "Saffisa TOT (fkn 0.10 = 10%)",
  "profile.margin": "Marjiinii bu'aa (fkn 0.10 = 10%)",
  "profile.saved": "Qindaa'inni olkaa'ame.",
  "profile.err_settings": "Saffisni lakkoofsa hin negatiivii ta'uu qaba.",
  "profile.reset_title": "Seenaa haquu",
  "profile.reset_help": "Galmeewwan olkaa'aman hunda gutummaatti haqi.",
  "profile.reset_btn": "Seenaa hunda haqi",
  "profile.reset_done": "Seenaan hundi haqame.",
  "profile.reset_confirm": "Galmee hunda haquu? Kun deebi'uu hin danda'u.",
  "profile.account": "Herrega",
  "profile.change_pw": "Jecha iccitii jijjiiri",
  "profile.update": "Haaromsi",
  "profile.pw_updated": "Jechi iccitii jijjiirame.",
  "profile.language": "Afaan",

  "common.err_load": "Seenaa fe'uun hin milkoofne.",
  "common.err_save": "Shallaggii olkaa'uun hin milkoofne.",
  "common.delete": "Haqi",
  "common.delete_confirm": "Galmee kana haquu?",
  "common.print": "Maxxansi",
  "common.share": "Qoodi",
  "common.copied": "Liinkiin garagalfame",
  "common.search": "Maqaa, TIN, daldala barbaadi…",
  "common.filter_all": "Hunda",
  "common.filter_service": "Tajaajila",
  "common.filter_nonservice": "Tajaajila miti",
  "common.no_match": "Galmeen barbaacha kee waliin walsimu hin jiru.",

  "shared.title": "Xiinxala qoodame",
  "shared.invalid": "Liinkiin qoodame kun sirrii miti yookiin guutuu miti.",
  "shared.open_app": "InflaTax bani →",

  "chat.title": "InflaTax gaafadhu",
  "chat.placeholder": "Waa'ee taaksii, dhiibbaa gatii, yookiin akkaataa itti fayyadamaa gaafadhu…",
  "chat.send": "Ergi",
  "chat.intro":
    "Akkam! Waa'ee shallagaa kanaa waan barbaadde na gaafadhu — saffisa sadarkaa, TOT, taaksii bu'aa, dhiibbaa gatii, yookiin akkaataa lakkoofsi tokko itti argame.",
  "chat.error": "Wanti tokko dogoggore. Maaloo irra deebi'ii yaali.",
  "chat.not_configured":
    "Gargaaraan ammatti hin qophoofne. Dandeessisuuf GEMINI_API_KEY dabali.",
  "chat.rate_limited":
    "Yeroof daangaa fayyadama bilisaa ga'eera. Maaloo daqiiqaa 2 eegii irra deebi'ii yaali — yookiin booda deebi'i.",
  "chat.thinking": "Yaadaa jira…",
  "chat.chip1": "Taaksiin bara kanaa akkamitti shallagama?",
  "chat.chip2": "Saffisni sadarkaa meeqa?",
  "chat.chip3": "Garaagarummaan Taaksii fi Kiraa maali?",

  "print.subtitle": "Taaksii sadarkaa + dhiibbaa gatii — Gabatee B",

  "auth.signin": "Seeni",
  "auth.create_account": "Herrega uumi",
  "auth.email": "Imeelii",
  "auth.password": "Jecha iccitii",
  "auth.new_password": "Jecha iccitii haaraa",
  "auth.no_account": "Herrega hin qabduu?",
  "auth.have_account": "Herrega qabdaa?",
  "auth.forgot": "Jecha iccitii dagattee?",
  "auth.continue_anon": "Osoo hin seenin itti fufi →",
  "auth.reset_title": "Jecha iccitii haaromsi",
  "auth.reset_help":
    "Jecha iccitii haaraa qindeeffachuuf liinkii imeeliidhaan siif ergina.",
  "auth.send_reset": "Liinkii haaromsaa ergi",
  "auth.reset_sent": "Liinkii jecha iccitii haaromsaa imeelii kee keessaa ilaali.",
  "auth.back_signin": "Gara seensaatti deebi'i",
  "auth.update_title": "Jecha iccitii haaraa qindeessi",
  "auth.update_help": "Fuula kana liinkii imeelii kee irraa bani.",
  "auth.update_btn": "Jecha iccitii haaromsi",
  "auth.updated": "Jechi iccitii haaromfame. Deebi'aa jira…",
  "auth.created":
    "Herregni uumame. Mirkaneessuuf imeelii kee ilaaltee seeni.",
  "auth.import_local":
    "Shallaggii meeshaa kana irratti olkaa'aman gara herrega keetti galchuu?",
  "auth.pw_min": "Jecha iccitii xiqqaate qubee 6 ta'uu qaba.",

  "footer.tag": "InflaTax · shallagaa taaksii sadarkaa + dhiibbaa gatii (Gabatee B)",

  // --- v2 ---
  "nav.dashboard": "Daashboordii",
  "nav.admin": "Bulchaa",
  "nav.superadmin": "Bulchaa Ol'aanaa",
  "nav.dev_role": "Gahee durduubee",
  "nav.all_branches": "Damee hunda",

  "form.kind": "Gosa galmee",
  "form.kind_tax": "Taaksii",
  "form.kind_rental": "Kiraa",
  "form.rental_note": "Kiraa: galii keessaa {pct} qofatu shallaggiidhaaf oola.",
  "form.err_required": "Maqaa, TIN, gurgurtaa fi taaksii bara darbee guuti.",

  "common.print_all": "Hunda maxxansi",
  "common.print_card": "Kaardii maxxansi",
  "common.void": "Haqi",
  "common.void_prompt": "Sababa galmee cufame kana haquuf:",
  "common.void_need_reason": "Galmee haquuf sababni barbaachisaadha.",
  "common.void_default_reason": "Bulchaadhaan haqame",
  "common.voided": "HAQAME",
  "common.locked": "Cufame (maxxanfame)",
  "common.prev": "Duraa",
  "common.next": "Itti aanu",
  "common.page_of": "Fuula {page} / {total}",
  "common.total_entries": "Galmee {n}",

  "print.card_title": "Shallaggii Taaksii — Gabatee B 2018",

  "analysis.rental_base": "Kiraa — {pct} shallaggiidhaaf = {base}",

  "admin.title": "Daashboordii bulchaa",
  "admin.subtitle": "Damee: {branch}",
  "admin.no_branch": "Damee hunda",
  "admin.entries": "Galmeewwan",
  "admin.total_lastyear": "Taaksii bara darbee waliigalaa",
  "admin.total_2018": "Taaksii 2018 waliigalaa",
  "admin.review_note": "Galmeewwan dhuunfaa fuula",
  "admin.open_entries": "galmeewwanii irratti ilaali →",

  "super.title": "Daashboordii bulchaa ol'aanaa",
  "super.subtitle": "Damee, saffisa waliigalaa, xiinxala fi galmee haqaa.",
  "super.rates": "Saffisa waliigalaa",
  "super.rental_share": "Qooda kiraa (fkn 0.5 = 50%)",
  "super.err_rates": "Saffisni lakkoofsa hin negatiivii ta'uu qaba.",
  "super.branches": "Damee",
  "super.branch_name": "Maqaa damee haaraa",
  "super.branch_ph": "fkn Damee Boolee",
  "super.add_branch": "Damee dabali",
  "super.no_branches": "Hanga ammaatti dameen hin jiru. Olitti dabali.",
  "super.branch_del_confirm": "Damee kana haquu?",
  "super.admin_note":
    "Bulchitoota jecha iccitii qaban uumuun mirkaneessa garee-server barbaada (tasks.md ilaali) — ammaaf damee durduubee qofa.",
  "super.analytics": "Xiinxala damee",
  "super.grand_total": "Ida'ama guddaa",
  "super.branch": "Damee",
  "super.voids": "Beeksisa haqaa",
  "super.no_voids": "Galmeen haqame hin jiru.",
  "super.ack": "Mirkaneessi",
  "super.rate_note": "Galmeewwan kiraa ammaaf galii irraa {r} shallaggiidhaaf oolu.",

  "profile.signin_to_change":
    "Jecha iccitii kee jijjiiruuf seeni (yeroo mirkaneessi banamu argama).",
};

const dicts: Record<Lang, Dict> = { en, am, om };

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

const STORAGE_KEY = "lang";

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && dicts[saved]) return saved;
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      let str = dicts[lang][key] ?? en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, v);
        }
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  return useContext(I18nContext);
}
