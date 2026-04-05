// ── Internationalization (i18n) Engine ──────────────────────────────────────
var LANGUAGES = {
  en: { name: "English", flag: "🇬🇧" },
  hi: { name: "हिन्दी", flag: "🇮🇳" },
  te: { name: "తెలుగు", flag: "🇮🇳" }
};

var TRANSLATIONS = {
  "nav.dashboard":    { en: "Dashboard",   hi: "डैशबोर्ड",    te: "డాష్‌బోర్డ్" },
  "nav.inventory":    { en: "Inventory",   hi: "इन्वेंटरी",    te: "ఇన్వెంటరీ" },
  "nav.billing":      { en: "Billing",     hi: "बिलिंग",       te: "బిల్లింగ్" },
  "nav.alerts":       { en: "Alerts",      hi: "अलर्ट",        te: "అలర్ట్‌లు" },
  "nav.offers":       { en: "Offers",      hi: "ऑफ़र",         te: "ఆఫర్లు" },
  "nav.reports":      { en: "Reports",     hi: "रिपोर्ट",      te: "రిపోర్ట్‌లు" },
  "nav.suppliers":    { en: "Suppliers",   hi: "सप्लायर",      te: "సరఫరాదారులు" },
  "layout.signout":   { en: "Sign Out",    hi: "साइन आउट",    te: "సైన్ అవుట్" },
  "layout.owner":     { en: "Store Owner", hi: "दुकान मालिक",  te: "దుకాణ యజమాని" },
  "action.add":       { en: "Add",         hi: "जोड़ें",        te: "జోడించు" },
  "action.edit":      { en: "Edit",        hi: "संपादित करें",  te: "సవరించు" },
  "action.delete":    { en: "Delete",      hi: "हटाएं",        te: "తొలగించు" },
  "action.save":      { en: "Save",        hi: "सेव करें",     te: "సేవ్ చేయి" },
  "action.cancel":    { en: "Cancel",      hi: "रद्द करें",    te: "రద్దు చేయి" },
  "action.search":    { en: "Search",      hi: "खोजें",        te: "వెతుకు" },
  "action.confirm":   { en: "Confirm",     hi: "पुष्टि करें",  te: "నిర్ధారించు" },
  "action.close":     { en: "Close",       hi: "बंद करें",     te: "మూసివేయి" },
  "action.loading":   { en: "Loading…",    hi: "लोड हो रहा…",  te: "లోడ్ అవుతోంది…" },
  "action.retry":     { en: "Retry",       hi: "पुनः प्रयास",  te: "మళ్ళీ ప్రయత్నించు" },
  "dash.title":       { en: "Dashboard",           hi: "डैशबोर्ड",           te: "డాష్‌బోర్డ్" },
  "dash.customers":   { en: "Customers Today",     hi: "आज के ग्राहक",       te: "ఈరోజు కస్టమర్లు" },
  "dash.items_sold":  { en: "Items Sold",          hi: "बेचे गए आइटम",      te: "అమ్మిన వస్తువులు" },
  "dash.revenue":     { en: "Revenue",             hi: "राजस्व",             te: "ఆదాయం" },
  "dash.profit":      { en: "Profit",              hi: "लाभ",                te: "లాభం" },
  "dash.alerts":      { en: "Active Alerts",       hi: "सक्रिय अलर्ट",      te: "యాక్టివ్ అలర్ట్‌లు" },
  "dash.trend":       { en: "30-Day Profit Trend", hi: "30 दिन का लाभ ट्रेंड", te: "30 రోజుల లాభ ట్రెండ్" },
  "dash.top5":        { en: "Top 5 Sellers",       hi: "टॉप 5 बिकने वाले",  te: "టాప్ 5 అమ్మకాలు" },
  "dash.recent":      { en: "Recent Alerts",       hi: "हाल के अलर्ट",      te: "ఇటీవలి అలర్ట్‌లు" },
  "dash.category":    { en: "Sales by Category",   hi: "श्रेणी अनुसार बिक्री", te: "వర్గం వారీగా అమ్మకాలు" },
  "inv.title":        { en: "Inventory",           hi: "इन्वेंटरी",          te: "ఇన్వెంటరీ" },
  "inv.add_product":  { en: "Add Product",         hi: "उत्पाद जोड़ें",      te: "ఉత్పత్తి జోడించు" },
  "inv.scan_find":    { en: "Scan to Find",        hi: "स्कैन करें",         te: "స్కాన్ చేయి" },
  "inv.bulk_scan":    { en: "Bulk Scan",           hi: "बल्क स्कैन",        te: "బల్క్ స్కాన్" },
  "inv.product":      { en: "Product",             hi: "उत्पाद",             te: "ఉత్పత్తి" },
  "inv.company":      { en: "Company / Brand",     hi: "कंपनी / ब्रांड",     te: "కంపెనీ / బ్రాండ్" },
  "inv.category":     { en: "Category",            hi: "श्रेणी",             te: "వర్గం" },
  "inv.cost":         { en: "Cost Price",          hi: "लागत मूल्य",        te: "ధర" },
  "inv.sell_price":   { en: "Selling Price",       hi: "बिक्री मूल्य",      te: "అమ్మకపు ధర" },
  "inv.quantity":     { en: "Quantity",            hi: "मात्रा",             te: "పరిమాణం" },
  "inv.max_stock":    { en: "Max Stock",           hi: "अधिकतम स्टॉक",     te: "గరిష్ట స్టాక్" },
  "inv.status":       { en: "Status",              hi: "स्थिति",             te: "స్థితి" },
  "inv.expiry":       { en: "Expiry",              hi: "एक्सपायरी",         te: "గడువు" },
  "inv.supplier":     { en: "Supplier",            hi: "सप्लायर",            te: "సరఫరాదారు" },
  "inv.barcode":      { en: "Barcode",             hi: "बारकोड",             te: "బార్‌కోడ్" },
  "inv.low_stock":    { en: "Low Stock",           hi: "कम स्टॉक",          te: "తక్కువ స్టాక్" },
  "inv.expiring":     { en: "Expiring Soon",       hi: "जल्द एक्सपायर",     te: "త్వరలో గడువు" },
  "inv.all_cat":      { en: "All Categories",      hi: "सभी श्रेणियां",      te: "అన్ని వర్గాలు" },
  "inv.all_status":   { en: "All Status",          hi: "सभी स्थिति",        te: "అన్ని స్థితి" },
  "bill.title":       { en: "Billing",             hi: "बिलिंग",             te: "బిల్లింగ్" },
  "bill.search":      { en: "Search products…",    hi: "उत्पाद खोजें…",     te: "ఉత్పత్తులు వెతుకు…" },
  "bill.scan":        { en: "Scan",                hi: "स्कैन",              te: "స్కాన్" },
  "bill.cart":        { en: "Current Bill",        hi: "वर्तमान बिल",       te: "ప్రస్తుత బిల్లు" },
  "bill.customer":    { en: "Customer Name",       hi: "ग्राहक का नाम",     te: "కస్టమర్ పేరు" },
  "bill.walkin":      { en: "Walk-in Customer",    hi: "वॉक-इन ग्राहक",    te: "వాక్-ఇన్ కస్టమర్" },
  "bill.summary":     { en: "Bill Summary",        hi: "बिल सारांश",        te: "బిల్లు సారాంశం" },
  "bill.subtotal":    { en: "Subtotal",            hi: "उप-कुल",            te: "ఉప-మొత్తం" },
  "bill.discount":    { en: "Discount",            hi: "छूट",               te: "తగ్గింపు" },
  "bill.grand_total": { en: "Grand Total",         hi: "कुल योग",           te: "మొత్తం" },
  "bill.confirm":     { en: "Confirm & Save Bill", hi: "बिल सेव करें",      te: "బిల్లు సేవ్ చేయి" },
  "bill.add_items":   { en: "Add items from the left panel.", hi: "बाएं पैनल से आइटम जोड़ें।", te: "ఎడమ ప్యానెల్ నుండి వస్తువులు జోడించండి." },
  "bill.out_of_stock":{ en: "Out of stock!",       hi: "स्टॉक खत्म!",       te: "స్టాక్ అయిపోయింది!" },
  "bill.max_stock":   { en: "Max stock reached.",  hi: "अधिकतम स्टॉक।",    te: "గరిష్ట స్టాక్." },
  "bill.saved":       { en: "Bill saved!",         hi: "बिल सेव हो गया!",   te: "బిల్లు సేవ్ అయింది!" },
  "bill.thank_you":   { en: "Thank you for shopping!", hi: "खरीदारी के लिए धन्यवाद!", te: "షాపింగ్ చేసినందుకు ధన్యవాదాలు!" },
  "alert.title":      { en: "Alerts & Notifications", hi: "अलर्ट और सूचनाएं", te: "అలర్ట్‌లు & నోటిఫికేషన్లు" },
  "alert.run_check":  { en: "Run Check",           hi: "जांच करें",          te: "తనిఖీ చేయి" },
  "alert.resolve_all":{ en: "Resolve All",         hi: "सभी हल करें",       te: "అన్నీ పరిష్కరించు" },
  "alert.resolve":    { en: "Resolve",             hi: "हल करें",           te: "పరిష్కరించు" },
  "alert.resolved":   { en: "Resolved",            hi: "हल हो गया",        te: "పరిష్కరించబడింది" },
  "alert.unresolved": { en: "Unresolved",          hi: "अनसुलझा",          te: "పరిష్కరించబడలేదు" },
  "alert.all":        { en: "All",                 hi: "सभी",               te: "అన్నీ" },
  "alert.all_good":   { en: "No active alerts. Everything looks good!", hi: "कोई अलर्ट नहीं। सब ठीक है!", te: "అలర్ట్‌లు లేవు. అంతా బాగుంది!" },
  "alert.low_stock":  { en: "Low Stock",           hi: "कम स्टॉक",          te: "తక్కువ స్టాక్" },
  "alert.expiry15":   { en: "Expiry (15 days)",    hi: "एक्सपायरी (15 दिन)", te: "గడువు (15 రోజులు)" },
  "alert.expiry30":   { en: "Expiry (30 days)",    hi: "एक्सपायरी (30 दिन)", te: "గడువు (30 రోజులు)" },
  "alert.deadstock":  { en: "Dead Stock",          hi: "डेड स्टॉक",         te: "డెడ్ స్టాక్" },
  "alert.bestseller": { en: "Best Seller",         hi: "बेस्ट सेलर",        te: "బెస్ట్ సెల్లర్" },
  "alert.create_offer":{ en: "Create Offer",       hi: "ऑफ़र बनाएं",        te: "ఆఫర్ సృష్టించు" },
  "offer.title":      { en: "Offers & Discounts",  hi: "ऑफ़र और छूट",       te: "ఆఫర్లు & తగ్గింపులు" },
  "offer.create":     { en: "Create Offer",        hi: "ऑफ़र बनाएं",        te: "ఆఫర్ సృష్టించు" },
  "offer.product":    { en: "Product",             hi: "उत्पाद",             te: "ఉత్పత్తి" },
  "offer.type":       { en: "Offer Type",          hi: "ऑफ़र प्रकार",       te: "ఆఫర్ రకం" },
  "offer.percent":    { en: "Percentage Off",      hi: "प्रतिशत छूट",       te: "శాతం తగ్గింపు" },
  "offer.flat":       { en: "Flat Discount",       hi: "फ्लैट छूट",         te: "ఫ్లాట్ తగ్గింపు" },
  "offer.bxgy":       { en: "Buy X Get Y",         hi: "X खरीदें Y पाएं",   te: "X కొనండి Y పొందండి" },
  "offer.valid_until":{ en: "Valid Until",         hi: "तक मान्य",          te: "వరకు చెల్లుబాటు" },
  "offer.max_qty":    { en: "Max Quantity",        hi: "अधिकतम मात्रा",    te: "గరిష్ట పరిమాణం" },
  "offer.active":     { en: "Active",              hi: "सक्रिय",            te: "యాక్టివ్" },
  "offer.inactive":   { en: "Inactive",            hi: "निष्क्रिय",         te: "నిష్క్రియ" },
  "offer.sold_out":   { en: "Sold Out",            hi: "बिक गया",           te: "అమ్ముడైపోయింది" },
  "offer.sell_now":   { en: "Sell Now",            hi: "अभी बेचें",         te: "ఇప్పుడు అమ్ము" },
  "offer.expiry_clear":{ en: "Expiry Clearance Suggestions", hi: "एक्सपायरी क्लीयरेंस सुझाव", te: "గడువు క్లియరెన్స్ సూచనలు" },
  "report.title":     { en: "Reports & Analytics", hi: "रिपोर्ट और विश्लेषण", te: "రిపోర్ట్‌లు & విశ్లేషణ" },
  "report.daily":     { en: "Daily",               hi: "दैनिक",              te: "రోజువారీ" },
  "report.weekly":    { en: "Weekly",              hi: "साप्ताहिक",          te: "వారపు" },
  "report.monthly":   { en: "Monthly",             hi: "मासिक",              te: "నెలవారీ" },
  "report.export":    { en: "Export CSV",          hi: "CSV डाउनलोड",       te: "CSV డౌన్‌లోడ్" },
  "report.total_bills":{ en: "Total Bills",        hi: "कुल बिल",           te: "మొత్తం బిల్లులు" },
  "report.items_sold":{ en: "Items Sold",          hi: "बेचे गए आइटम",     te: "అమ్మిన వస్తువులు" },
  "report.gst":       { en: "GST Collected",       hi: "GST एकत्रित",       te: "GST వసూలు" },
  "sup.title":        { en: "Suppliers",           hi: "सप्लायर",            te: "సరఫరాదారులు" },
  "sup.add":          { en: "Add Supplier",        hi: "सप्लायर जोड़ें",     te: "సరఫరాదారు జోడించు" },
  "sup.name":         { en: "Supplier Name",       hi: "सप्लायर का नाम",    te: "సరఫరాదారు పేరు" },
  "sup.phone":        { en: "Phone / WhatsApp",    hi: "फ़ोन / व्हाट्सएप",  te: "ఫోన్ / వాట్సాప్" },
  "sup.email":        { en: "Email",               hi: "ईमेल",               te: "ఇమెయిల్" },
  "sup.notes":        { en: "Notes",               hi: "नोट्स",              te: "నోట్స్" },
  "sup.link_products":{ en: "Link Products",       hi: "उत्पाद जोड़ें",      te: "ఉత్పత్తులు లింక్ చేయి" },
  "sup.reorder":      { en: "Auto Reorder Drafts", hi: "ऑटो रीऑर्डर ड्राफ्ट", te: "ఆటో రీఆర్డర్ డ్రాఫ్ట్‌లు" },
  "pred.title":       { en: "AI Predictions",      hi: "AI भविष्यवाणी",     te: "AI అంచనాలు" },
  "pred.no_data":     { en: "Not enough sales data yet.", hi: "अभी पर्याप्त डेटा नहीं।", te: "ఇంకా తగినంత డేటా లేదు." },
  "offline.banner":   { en: "You're offline. Changes will sync when connected.", hi: "आप ऑफ़लाइन हैं। कनेक्ट होने पर सिंक होगा।", te: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. కనెక్ట్ అయినప్పుడు సింక్ అవుతుంది." },
  "offline.back":     { en: "Back online! Syncing…", hi: "वापस ऑनलाइन! सिंक हो रहा…", te: "తిరిగి ఆన్‌లైన్! సింక్ అవుతోంది…" },
};

var currentLang = localStorage.getItem("lang") || "en";

function t(key) {
  var entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[currentLang] || entry["en"] || key;
}

function setLanguage(lang) {
  if (!LANGUAGES[lang]) return;
  currentLang = lang;
  localStorage.setItem("lang", lang);
  window.location.reload();
}

function getLangSwitcherHTML() {
  return '<select id="lang-switcher" onchange="setLanguage(this.value)" ' +
    'style="padding:6px 10px;border-radius:8px;font-size:12px;border:1px solid var(--border);' +
    'background:var(--card-bg);color:var(--text);box-shadow:var(--shadow);cursor:pointer">' +
    Object.keys(LANGUAGES).map(function(code) {
      var sel = code === currentLang ? ' selected' : '';
      return '<option value="' + code + '"' + sel + '>' + LANGUAGES[code].flag + ' ' + LANGUAGES[code].name + '</option>';
    }).join("") +
  '</select>';
}
