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

  "home.title": "How much more tax inflation costs you.",
  "home.subtitle":
    "Enter a turnover (taxable income). InflaTax computes last year's tax (TOT + profit tax), then applies the curfew rate before and after inflation to find this year's tax — Taaksii Bara 2018.",
  "home.latest": "Latest result",
  "home.history": "History",
  "home.click_row": "Click a row below for the full breakdown.",

  "form.new_entry": "New entry",
  "form.help":
    "Enter the turnover and/or the actual last year's tax. Give turnover to derive the tax; give the tax to back-solve the turnover; give both and the typed tax is used.",
  "form.name": "Taxpayer name",
  "form.tin": "TIN",
  "form.business_type": "Business type",
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

  "footer.tag": "InflaTax · curfew + inflation tax calculator (Schedule B)",
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

  "home.title": "የዋጋ ግሽበት ምን ያህል ተጨማሪ ግብር እንደሚያስከፍል።",
  "home.subtitle":
    "ጠቅላላ ሽያጭ (ታክስ የሚከፈልበት ገቢ) አስገባ። InflaTax የአምናውን ግብር (TOT + የትርፍ ግብር) አስልቶ የከርሰ-ምሽት መጣኔን ከግሽበት በፊትና በኋላ በመጠቀም የዘንድሮውን ግብር — Taaksii Bara 2018 — ያገኛል።",
  "home.latest": "የቅርብ ውጤት",
  "home.history": "ታሪክ",
  "home.click_row": "ሙሉ ዝርዝር ለማየት ከታች ያለውን ረድፍ ጫን።",

  "form.new_entry": "አዲስ ግቤት",
  "form.help":
    "ጠቅላላ ሽያጩን እና/ወይም የአምናውን ትክክለኛ ግብር አስገባ። ሽያጭ ካስገባህ ግብሩ ይሰላል፤ ግብር ካስገባህ ሽያጩ ይሰላል፤ ሁለቱንም ካስገባህ የተጻፈው ግብር ይወሰዳል።",
  "form.name": "የግብር ከፋይ ስም",
  "form.tin": "TIN",
  "form.business_type": "የንግድ ዓይነት",
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

  "footer.tag": "InflaTax · የከርሰ-ምሽት + ግሽበት ግብር ማስያ (ሰንጠረዥ B)",
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

  "home.title": "Dhiibbaan gatii taaksii hammam dabaluu akka si baasu.",
  "home.subtitle":
    "Gurgurtaa waliigalaa (galii taaksii) galchi. InflaTax taaksii bara darbee (TOT + taaksii bu'aa) shallaga, sana booda saffisa sadarkaa dhiibbaa gatii dura fi booda fayyadamuun taaksii bara kanaa — Taaksii Bara 2018 — argata.",
  "home.latest": "Bu'aa dhiyeenyaa",
  "home.history": "Seenaa",
  "home.click_row": "Ibsa guutuu argachuuf sarara gadii cuqaasi.",

  "form.new_entry": "Galmee haaraa",
  "form.help":
    "Gurgurtaa fi/yookiin taaksii bara darbee dhugaa galchi. Gurgurtaa galchite taaksiin ni shallagama; taaksii galchite gurgurtaan ni argama; lamaan galchite taaksiin barreeffame fayyada.",
  "form.name": "Maqaa Kafalaa Gibiraa",
  "form.tin": "TIN",
  "form.business_type": "Gosa daldala",
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

  "footer.tag": "InflaTax · shallagaa taaksii sadarkaa + dhiibbaa gatii (Gabatee B)",
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
