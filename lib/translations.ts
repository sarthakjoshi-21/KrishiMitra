/**
 * Central UI translation dictionary for Krishi Mitra.
 *
 * Usage:
 *   import { t } from '@/lib/translations'
 *   import { useLanguage } from '@/components/krishi-mitra/language-context'
 *
 *   const { language } = useLanguage()
 *   <h2>{t('kisanSathi.headline', language)}</h2>
 */

export type Language = 'en' | 'hi' | 'mr'

// ─── Dictionary type ──────────────────────────────────────────────────────────

type TranslationMap = {
  [key: string]: Record<Language, string>
}

// ─── Translations ─────────────────────────────────────────────────────────────

export const translations: TranslationMap = {

  // ── Kisan Sathi chat screen ────────────────────────────────────────────────

  'kisanSathi.eyebrow': {
    en: 'Always here to help',
    hi: 'हमेशा आपकी सेवा में',
    mr: 'नेहमी मदतीसाठी येथे',
  },
  'kisanSathi.headline': {
    en: 'What can I help you grow today?',
    hi: 'आज मैं आपकी किस फसल में मदद करूँ?',
    mr: 'आज मी तुमच्या शेतीत कसे मदत करू?',
  },
  'kisanSathi.subheadline': {
    en: 'Ask about crops, soil, pests, irrigation, weather, schemes, or selling options.',
    hi: 'फसल, मिट्टी, कीट, सिंचाई, मौसम, योजनाएँ या बिक्री के बारे में पूछें।',
    mr: 'पिके, माती, कीड, सिंचन, हवामान, योजना किंवा विक्रीबद्दल विचारा.',
  },
  'kisanSathi.voiceHint.hi': {
    en: '',
    hi: '🎤 हिंदी में बोलें — मैं स्वचालित रूप से अनुवाद करूँगा।',
    mr: '',
  },
  'kisanSathi.voiceHint.mr': {
    en: '',
    hi: '',
    mr: '🎤 मराठीत बोला — मी आपोआप अनुवाद करेन.',
  },
  'kisanSathi.inputPlaceholder': {
    en: 'Ask Kisan Sathi anything about farming…',
    hi: 'खेती के बारे में कुछ भी पूछें…',
    mr: 'शेतीबद्दल काहीही विचारा…',
  },
  'kisanSathi.thinking': {
    en: 'Kisan Sathi is thinking…',
    hi: 'किसान साथी सोच रहा है…',
    mr: 'किसान साथी विचार करत आहे…',
  },
  'kisanSathi.processing': {
    en: 'Converting speech…',
    hi: 'बोली को शब्दों में बदल रहे हैं…',
    mr: 'बोली शब्दांत रूपांतरित करत आहे…',
  },
  'kisanSathi.processingTranslating': {
    en: 'Converting speech and translating…',
    hi: 'बोली परिवर्तित और अनुवाद कर रहे हैं…',
    mr: 'बोली रूपांतरित करून अनुवाद करत आहे…',
  },

  // ── Suggestion chips ───────────────────────────────────────────────────────

  'kisanSathi.chip.heatwave': {
    en: 'Protect my crop from heatwave',
    hi: 'गर्मी से फसल को बचाएँ',
    mr: 'उष्णतेपासून पिकाचे संरक्षण करा',
  },
  'kisanSathi.chip.schemes': {
    en: 'Find schemes for my farm',
    hi: 'मेरे खेत के लिए योजनाएँ खोजें',
    mr: 'माझ्या शेतासाठी योजना शोधा',
  },
  'kisanSathi.chip.irrigation': {
    en: 'Plan irrigation',
    hi: 'सिंचाई की योजना बनाएँ',
    mr: 'सिंचन नियोजन करा',
  },

  // ── Sidebar / voice language indicator ────────────────────────────────────

  'kisanSathi.sidebar.voiceLanguage': {
    en: 'Voice language',
    hi: 'आवाज़ की भाषा',
    mr: 'आवाजाची भाषा',
  },
  'kisanSathi.sidebar.languageName': {
    en: 'English',
    hi: 'हिन्दी — Hindi',
    mr: 'मराठी — Marathi',
  },
  'kisanSathi.sidebar.changeHint': {
    en: 'Change via the top bar dropdown',
    hi: 'ऊपर की पट्टी में बदलें',
    mr: 'वरच्या बारमधून बदला',
  },
  'kisanSathi.sidebar.backButton': {
    en: 'Back to Farmer Desk',
    hi: 'किसान डेस्क पर वापस',
    mr: 'शेतकरी डेस्कवर परत',
  },
  'kisanSathi.sidebar.description': {
    en: 'Your practical farming companion for every season.',
    hi: 'हर मौसम में आपका व्यावहारिक कृषि साथी।',
    mr: 'प्रत्येक हंगामातील तुमचा शेती सोबती.',
  },

  // ── Topbar ─────────────────────────────────────────────────────────────────

  'kisanSathi.topbar.eyebrow': {
    en: 'Kisan Sathi',
    hi: 'किसान साथी',
    mr: 'किसान साथी',
  },
  'kisanSathi.topbar.title': {
    en: 'Kisan Sathi',
    hi: 'किसान साथी',
    mr: 'किसान साथी',
  },
  'kisanSathi.topbar.hint': {
    en: 'Ask in your language',
    hi: 'अपनी भाषा में पूछें',
    mr: 'तुमच्या भाषेत विचारा',
  },
  'kisanSathi.topbar.logout': {
    en: 'Logout',
    hi: 'लॉगआउट',
    mr: 'लॉगआउट',
  },

  // ── Mic / speaker aria labels ──────────────────────────────────────────────

  'kisanSathi.mic.start': {
    en: 'Start voice input',
    hi: 'आवाज़ इनपुट शुरू करें',
    mr: 'आवाज इनपुट सुरू करा',
  },
  'kisanSathi.mic.stop': {
    en: 'Stop recording',
    hi: 'रिकॉर्डिंग रोकें',
    mr: 'रेकॉर्डिंग थांबवा',
  },
  'kisanSathi.mic.processing': {
    en: 'Processing speech…',
    hi: 'बोली प्रक्रिया हो रही है…',
    mr: 'बोली प्रक्रिया होत आहे…',
  },
  'kisanSathi.speaker.play': {
    en: 'Play audio in your language',
    hi: 'आपकी भाषा में ऑडियो सुनें',
    mr: 'तुमच्या भाषेत ऑडिओ ऐका',
  },
  'kisanSathi.speaker.stop': {
    en: 'Stop audio',
    hi: 'ऑडियो रोकें',
    mr: 'ऑडिओ थांबवा',
  },

  // ── Generic / shared ───────────────────────────────────────────────────────

  'generic.logout': {
    en: 'Logout',
    hi: 'लॉगआउट',
    mr: 'लॉगआउट',
  },
  'generic.backToFarmerDesk': {
    en: 'Back to Farmer Desk',
    hi: 'किसान डेस्क पर वापस',
    mr: 'शेतकरी डेस्कवर परत',
  },
  'generic.askYourLanguage': {
    en: 'Ask in your language',
    hi: 'अपनी भाषा में पूछें',
    mr: 'तुमच्या भाषेत विचारा',
  },
  'generic.chooseLanguage': {
    en: 'English',
    hi: 'हिन्दी',
    mr: 'मराठी',
  },

  // ── Farmer Dashboard topbar ────────────────────────────────────────────────

  'dashboard.greeting': {
    en: 'Good morning',
    hi: 'सुप्रभात',
    mr: 'सुप्रभात',
  },
  'dashboard.morning': {
    en: 'Good morning',
    hi: 'सुप्रभात',
    mr: 'सुप्रभात',
  },
  'dashboard.afternoon': {
    en: 'Good afternoon',
    hi: 'शुभ दोपहर',
    mr: 'शुभ दुपार',
  },
  'dashboard.evening': {
    en: 'Good evening',
    hi: 'शुभ संध्या',
    mr: 'शुभ संध्याकाळ',
  },
  'dashboard.night': {
    en: 'Good night',
    hi: 'शुभ रात्रि',
    mr: 'शुभ रात्री',
  },
  'dashboard.subline': {
    en: "Your farm is looking healthy. Here's your complete picture.",
    hi: 'आपका खेत स्वस्थ दिख रहा है। यहाँ आपकी पूरी जानकारी है।',
    mr: 'तुमची शेती निरोगी दिसत आहे. येथे तुमचे संपूर्ण चित्र आहे.',
  },
  'dashboard.readAloud': {
    en: 'Read dashboard aloud',
    hi: 'डैशबोर्ड ज़ोर से पढ़ें',
    mr: 'डॅशबोर्ड मोठ्याने वाचा',
  },
  'dashboard.date': {
    en: 'Tuesday, 29 August 2026',
    hi: 'मंगलवार, 29 अगस्त 2026',
    mr: 'मंगळवार, 29 ऑगस्ट 2026',
  },
  'dashboard.onlineSynced': {
    en: 'Online & synced',
    hi: 'ऑनलाइन और सिंक',
    mr: 'ऑनलाइन आणि सिंक',
  },

  // ── Dashboard metrics ──────────────────────────────────────────────────────

  'dashboard.metric.activeListings': {
    en: 'Active listings',
    hi: 'सक्रिय लिस्टिंग',
    mr: 'सक्रिय नोंदी',
  },
  'dashboard.metric.activeListingsDetail': {
    en: '2 receiving bids',
    hi: '2 बोलियां मिल रही हैं',
    mr: '2 बोली येत आहेत',
  },
  'dashboard.metric.bestOffer': {
    en: 'Best offer today',
    hi: 'आज का सबसे अच्छा प्रस्ताव',
    mr: 'आजचा सर्वोत्तम ऑफर',
  },
  'dashboard.metric.bestOfferDetail': {
    en: 'Basmati Rice · +4.1%',
    hi: 'बासमती चावल · +4.1%',
    mr: 'बासमती तांदूळ · +4.1%',
  },
  'dashboard.metric.logisticsSaved': {
    en: 'Logistics saved',
    hi: 'लॉजिस्टिक्स बचत',
    mr: 'लॉजिस्टिक्स बचत',
  },
  'dashboard.metric.logisticsDetail': {
    en: 'This month · 2 pooled trips',
    hi: 'इस महीने · 2 संयुक्त यात्राएं',
    mr: 'या महिन्यात · 2 एकत्रित ट्रिप्स',
  },
  'dashboard.metric.safetyStatus': {
    en: 'Safety status',
    hi: 'सुरक्षा स्थिति',
    mr: 'सुरक्षा स्थिती',
  },
  'dashboard.metric.safetyDetail': {
    en: 'Last checked 2 days ago',
    hi: '2 दिन पहले जांचा गया',
    mr: '2 दिवसांपूर्वी तपासले',
  },
  'dashboard.metric.allClear': {
    en: 'All clear',
    hi: 'सब ठीक है',
    mr: 'सर्व ठीक आहे',
  },

  // ── Dashboard listing panel ────────────────────────────────────────────────

  'dashboard.listing.eyebrow': {
    en: 'Smart listing',
    hi: 'स्मार्ट लिस्टिंग',
    mr: 'स्मार्ट नोंदणी',
  },
  'dashboard.listing.title': {
    en: 'Add farm crop & AI analysis',
    hi: 'फार्म फसल जोड़ें और AI विश्लेषण',
    mr: 'शेत पीक जोडा आणि AI विश्लेषण',
  },
  'dashboard.listing.dropzone': {
    en: 'Drop a crop photo here',
    hi: 'यहाँ फसल की फोटो डालें',
    mr: 'येथे पिकाचा फोटो टाका',
  },
  'dashboard.listing.dropzoneHint': {
    en: 'or use camera JPG/PNG up to 10MB',
    hi: 'या कैमरे से JPG/PNG 10MB तक',
    mr: 'किंवा कॅमेरा JPG/PNG 10MB पर्यंत',
  },
  'dashboard.listing.cropName': {
    en: 'Crop name',
    hi: 'फसल का नाम',
    mr: 'पिकाचे नाव',
  },
  'dashboard.listing.quantity': {
    en: 'Available quantity (Quintal)',
    hi: 'उपलब्ध मात्रा (क्विंटल)',
    mr: 'उपलब्ध प्रमाण (क्विंटल)',
  },
  'dashboard.listing.price': {
    en: 'Asking price (₹ / Quintal)',
    hi: 'मांग मूल्य (₹ / क्विंटल)',
    mr: 'मागणी किंमत (₹ / क्विंटल)',
  },
  'dashboard.listing.location': {
    en: 'Farm location',
    hi: 'खेत का स्थान',
    mr: 'शेताचे ठिकाण',
  },
  'dashboard.listing.needsTransport': {
    en: 'Need transport?',
    hi: 'परिवहन चाहिए?',
    mr: 'वाहतूक हवी आहे का?',
  },
  'dashboard.listing.publishBtn': {
    en: 'Publish to marketplace',
    hi: 'बाज़ार में प्रकाशित करें',
    mr: 'बाजारात प्रकाशित करा',
  },
  'dashboard.listing.publishing': {
    en: 'Publishing…',
    hi: 'प्रकाशित हो रहा है…',
    mr: 'प्रकाशित होत आहे…',
  },
  'dashboard.listing.published': {
    en: 'Published to Marketplace',
    hi: 'बाज़ार में प्रकाशित',
    mr: 'बाजारात प्रकाशित झाले',
  },

  // ── Dashboard bids panel ───────────────────────────────────────────────────

  'dashboard.bids.eyebrow': {
    en: 'Live activity',
    hi: 'लाइव गतिविधि',
    mr: 'थेट क्रियाकलाप',
  },
  'dashboard.bids.title': {
    en: 'Your active bids',
    hi: 'आपकी सक्रिय बोलियां',
    mr: 'तुमच्या सक्रिय बोली',
  },
  'dashboard.bids.viewAll': {
    en: 'View all',
    hi: 'सभी देखें',
    mr: 'सर्व पहा',
  },
  'dashboard.bids.trend': {
    en: 'Basmati Rice price trend',
    hi: 'बासमती चावल मूल्य प्रवृत्ति',
    mr: 'बासमती तांदूळ किंमत प्रवृत्ती',
  },
  'dashboard.bids.rising': {
    en: '↑ Rising',
    hi: '↑ बढ़ रहा है',
    mr: '↑ वाढत आहे',
  },

  // ── Marketplace section ────────────────────────────────────────────────────

  'dashboard.marketplace.eyebrow': {
    en: 'Marketplace',
    hi: 'बाज़ार',
    mr: 'बाजार',
  },
  'dashboard.marketplace.title': {
    en: "What's moving near you",
    hi: 'आपके पास क्या बिक रहा है',
    mr: 'तुमच्या जवळ काय विकले जात आहे',
  },
  'dashboard.marketplace.browse': {
    en: 'Browse lots',
    hi: 'लॉट देखें',
    mr: 'लॉट पहा',
  },
  'dashboard.marketplace.loading': {
    en: 'Loading marketplace…',
    hi: 'बाज़ार लोड हो रहा है…',
    mr: 'बाजार लोड होत आहे…',
  },
  'dashboard.marketplace.empty': {
    en: 'No active listings found in database. Add a crop above to create a listing.',
    hi: 'डेटाबेस में कोई सक्रिय लिस्टिंग नहीं मिली। लिस्टिंग बनाने के लिए ऊपर फसल जोड़ें।',
    mr: 'डेटाबेसमध्ये कोणत्याही सक्रिय नोंदी आढळल्या नाहीत. नोंद तयार करण्यासाठी वर पीक जोडा.',
  },

  // ── Schemes & Insurance page — chrome ─────────────────────────────────────

  'schemes.topbar.title': {
    en: 'Schemes & Insurance',
    hi: 'योजनाएँ और बीमा',
    mr: 'योजना आणि विमा',
  },
  'schemes.topbar.eyebrow': {
    en: 'Farmer desk',
    hi: 'किसान डेस्क',
    mr: 'शेतकरी डेस्क',
  },
  'schemes.topbar.dashboard': {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    mr: 'डॅशबोर्ड',
  },
  'schemes.topbar.logout': {
    en: 'Logout',
    hi: 'लॉगआउट',
    mr: 'लॉगआउट',
  },
  'schemes.hero.title': {
    en: 'Schemes & Insurance Assistance',
    hi: 'योजनाएँ और बीमा सहायता',
    mr: 'योजना आणि विमा सहाय्य',
  },
  'schemes.hero.badge': {
    en: 'Assisted workflow',
    hi: 'सहायता प्राप्त प्रक्रिया',
    mr: 'सहाय्यित प्रक्रिया',
  },
  'schemes.hero.description': {
    en: 'Discover eligible schemes and get assisted by verified CSC/Setu service providers. No direct government API integration.',
    hi: 'पात्र योजनाएं खोजें और सत्यापित CSC/सेतु सेवा प्रदाताओं से सहायता प्राप्त करें। कोई सीधा सरकारी API एकीकरण नहीं।',
    mr: 'पात्र योजना शोधा आणि सत्यापित CSC/सेतू सेवा प्रदात्यांकडून मदत घ्या. थेट सरकारी API एकत्रीकरण नाही.',
  },

  // ── Schemes list section ───────────────────────────────────────────────────

  'schemes.list.eyebrow': {
    en: 'Benefits for farmers',
    hi: 'किसानों के लिए लाभ',
    mr: 'शेतकऱ्यांसाठी लाभ',
  },
  'schemes.list.title': {
    en: 'Available schemes',
    hi: 'उपलब्ध योजनाएँ',
    mr: 'उपलब्ध योजना',
  },
  'schemes.list.programs': {
    en: '4 programs',
    hi: '4 कार्यक्रम',
    mr: '4 कार्यक्रम',
  },
  'schemes.card.eligibilityLabel': {
    en: 'Eligibility',
    hi: 'पात्रता',
    mr: 'पात्रता',
  },
  'schemes.card.benefitLabel': {
    en: 'Benefit',
    hi: 'लाभ',
    mr: 'फायदा',
  },
  'schemes.card.apply': {
    en: 'Apply with assistance',
    hi: 'सहायता से आवेदन करें',
    mr: 'सहाय्याने अर्ज करा',
  },
  'schemes.card.requested': {
    en: 'Assistance requested',
    hi: 'सहायता का अनुरोध किया',
    mr: 'सहाय्य विनंती केली',
  },

  // ── Scheme 1: PM-KISAN ─────────────────────────────────────────────────────

  'schemes.pmkisan.title': {
    en: 'PM-KISAN Samman Nidhi',
    hi: 'पीएम-किसान सम्मान निधि',
    mr: 'पीएम-किसान सन्मान निधी',
  },
  'schemes.pmkisan.ministry': {
    en: 'Ministry of Agriculture & Farmers Welfare',
    hi: 'कृषि एवं किसान कल्याण मंत्रालय',
    mr: 'कृषी आणि शेतकरी कल्याण मंत्रालय',
  },
  'schemes.pmkisan.category': {
    en: 'Income Support',
    hi: 'आय सहायता',
    mr: 'उत्पन्न सहाय्य',
  },
  'schemes.pmkisan.description': {
    en: 'Income support of ₹6,000/year to small and marginal farmer families.',
    hi: 'छोटे और सीमांत किसान परिवारों को ₹6,000/वर्ष की आय सहायता।',
    mr: 'लहान आणि सीमांत शेतकरी कुटुंबांना ₹6,000/वर्ष उत्पन्न सहाय्य.',
  },
  'schemes.pmkisan.eligibility': {
    en: 'All farmer families holding cultivable land, subject to exclusion criteria.',
    hi: 'सभी किसान परिवार जिनके पास कृषि योग्य भूमि है, अपवाद मानदंडों के अधीन।',
    mr: 'लागवडीयोग्य जमीन असलेले सर्व शेतकरी कुटुंब, वगळण्याच्या निकषांच्या अधीन.',
  },
  'schemes.pmkisan.benefit': {
    en: '₹6,000 per year in three instalments',
    hi: 'तीन किश्तों में ₹6,000 प्रति वर्ष',
    mr: 'तीन हप्त्यांमध्ये ₹6,000 प्रति वर्ष',
  },

  // ── Scheme 2: PMFBY ────────────────────────────────────────────────────────

  'schemes.pmfby.title': {
    en: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    hi: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
    mr: 'प्रधानमंत्री पीक विमा योजना (PMFBY)',
  },
  'schemes.pmfby.ministry': {
    en: 'Ministry of Agriculture & Farmers Welfare',
    hi: 'कृषि एवं किसान कल्याण मंत्रालय',
    mr: 'कृषी आणि शेतकरी कल्याण मंत्रालय',
  },
  'schemes.pmfby.category': {
    en: 'Insurance',
    hi: 'बीमा',
    mr: 'विमा',
  },
  'schemes.pmfby.description': {
    en: 'Crop insurance scheme covering natural calamities, pests and diseases.',
    hi: 'प्राकृतिक आपदाओं, कीटों और बीमारियों को कवर करने वाली फसल बीमा योजना।',
    mr: 'नैसर्गिक आपत्ती, कीड आणि रोगांना कव्हर करणारी पीक विमा योजना.',
  },
  'schemes.pmfby.eligibility': {
    en: 'All farmers (loanee and non-loanee) cultivating notified crops in notified areas.',
    hi: 'अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाने वाले सभी किसान (ऋणी और गैर-ऋणी)।',
    mr: 'अधिसूचित क्षेत्रांत अधिसूचित पिके घेणारे सर्व शेतकरी (कर्जदार आणि बिगर कर्जदार).',
  },
  'schemes.pmfby.benefit': {
    en: 'Subsidised crop insurance premium (up to 2% for Kharif, 1.5% for Rabi)',
    hi: 'सब्सिडाइज्ड फसल बीमा प्रीमियम (खरीफ के लिए 2% तक, रबी के लिए 1.5%)',
    mr: 'अनुदानित पीक विमा हप्ता (खरीपसाठी 2% पर्यंत, रब्बीसाठी 1.5%)',
  },

  // ── Scheme 3: SMAM ─────────────────────────────────────────────────────────

  'schemes.smam.title': {
    en: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    hi: 'कृषि यंत्रीकरण पर उप-मिशन (SMAM)',
    mr: 'कृषी यांत्रिकीकरण उप-अभियान (SMAM)',
  },
  'schemes.smam.ministry': {
    en: 'Ministry of Agriculture & Farmers Welfare',
    hi: 'कृषि एवं किसान कल्याण मंत्रालय',
    mr: 'कृषी आणि शेतकरी कल्याण मंत्रालय',
  },
  'schemes.smam.category': {
    en: 'Equipment Subsidy',
    hi: 'उपकरण सब्सिडी',
    mr: 'उपकरण अनुदान',
  },
  'schemes.smam.description': {
    en: 'Subsidy for purchase of agricultural machinery and equipment.',
    hi: 'कृषि मशीनरी और उपकरणों की खरीद के लिए सब्सिडी।',
    mr: 'कृषी यंत्रसामग्री आणि उपकरणांच्या खरेदीसाठी अनुदान.',
  },
  'schemes.smam.eligibility': {
    en: 'Individual farmers, FPOs, CHCs. Up to 40–50% subsidy depending on category.',
    hi: 'व्यक्तिगत किसान, FPO, CHC। श्रेणी के अनुसार 40-50% तक सब्सिडी।',
    mr: 'वैयक्तिक शेतकरी, FPO, CHC. श्रेणीनुसार 40-50% पर्यंत अनुदान.',
  },
  'schemes.smam.benefit': {
    en: 'Subsidy up to 50% on machinery cost (up to 80% for SC/ST/small farmers)',
    hi: 'मशीनरी लागत पर 50% तक सब्सिडी (SC/ST/लघु किसानों के लिए 80% तक)',
    mr: 'यंत्रसामग्री खर्चावर 50% पर्यंत अनुदान (SC/ST/लहान शेतकऱ्यांसाठी 80% पर्यंत)',
  },

  // ── Scheme 4: MIF ──────────────────────────────────────────────────────────

  'schemes.mif.title': {
    en: 'Micro Irrigation Fund (MIF)',
    hi: 'सूक्ष्म सिंचाई निधि (MIF)',
    mr: 'सूक्ष्म सिंचन निधी (MIF)',
  },
  'schemes.mif.ministry': {
    en: 'NABARD',
    hi: 'NABARD',
    mr: 'NABARD',
  },
  'schemes.mif.category': {
    en: 'Infrastructure',
    hi: 'बुनियादी ढाँचा',
    mr: 'पायाभूत सुविधा',
  },
  'schemes.mif.description': {
    en: 'Financial assistance for micro-irrigation (drip/sprinkler) installation.',
    hi: 'सूक्ष्म सिंचाई (ड्रिप/स्प्रिंकलर) स्थापना के लिए वित्तीय सहायता।',
    mr: 'सूक्ष्म सिंचन (ठिबक/तुषार) स्थापनेसाठी आर्थिक सहाय्य.',
  },
  'schemes.mif.eligibility': {
    en: 'Individual farmers, FPOs, state governments.',
    hi: 'व्यक्तिगत किसान, FPO, राज्य सरकारें।',
    mr: 'वैयक्तिक शेतकरी, FPO, राज्य सरकारे.',
  },
  'schemes.mif.benefit': {
    en: 'Subsidy up to 55% on drip/sprinkler systems',
    hi: 'ड्रिप/स्प्रिंकलर सिस्टम पर 55% तक सब्सिडी',
    mr: 'ठिबक/तुषार सिंचन प्रणालींवर 55% पर्यंत अनुदान',
  },

  // ── Assistance requests panel ──────────────────────────────────────────────

  'schemes.assistance.title': {
    en: 'My assistance requests',
    hi: 'मेरी सहायता अनुरोध',
    mr: 'माझ्या सहाय्य विनंत्या',
  },
  'schemes.assistance.track': {
    en: 'Track your ongoing applications',
    hi: 'अपने चल रहे आवेदन ट्रैक करें',
    mr: 'तुमचे चालू अर्ज ट्रॅक करा',
  },
  'schemes.assistance.sent': {
    en: 'Assistance request sent to a verified service provider.',
    hi: 'सहायता अनुरोध एक सत्यापित सेवा प्रदाता को भेजा गया।',
    mr: 'सहाय्य विनंती सत्यापित सेवा प्रदात्याला पाठवली गेली.',
  },
  'schemes.assistance.default1.name': {
    en: 'PM-KISAN Application',
    hi: 'पीएम-किसान आवेदन',
    mr: 'पीएम-किसान अर्ज',
  },
  'schemes.assistance.default1.desc': {
    en: 'Assistance with PM-KISAN registration and document upload.',
    hi: 'PM-KISAN पंजीकरण और दस्तावेज़ अपलोड में सहायता।',
    mr: 'PM-KISAN नोंदणी आणि कागदपत्रे अपलोडसाठी मदत.',
  },
  'schemes.assistance.default2.name': {
    en: 'Crop Insurance Claim',
    hi: 'फसल बीमा दावा',
    mr: 'पीक विमा दावा',
  },
  'schemes.assistance.default2.desc': {
    en: 'Filing PMFBY claim for pest-induced crop loss in Zone A.',
    hi: 'जोन A में कीट-प्रेरित फसल नुकसान के लिए PMFBY दावा दाखिल करना।',
    mr: 'झोन A मध्ये कीडजन्य पीक नुकसानीसाठी PMFBY दावा दाखल करणे.',
  },
  'schemes.assistance.default3.name': {
    en: 'Soil Health Card',
    hi: 'मृदा स्वास्थ्य कार्ड',
    mr: 'मृदा आरोग्य कार्ड',
  },
  'schemes.assistance.default3.desc': {
    en: 'Requesting soil sample collection and health card generation.',
    hi: 'मिट्टी के नमूने संग्रह और स्वास्थ्य कार्ड बनाने का अनुरोध।',
    mr: 'माती नमुना संकलन आणि आरोग्य कार्ड तयार करण्याची विनंती.',
  },
  'schemes.assistance.submittedDaysAgo': {
    en: 'Submitted',
    hi: 'जमा किया',
    mr: 'सादर केले',
  },
  'schemes.assistance.day': {
    en: 'day ago',
    hi: 'दिन पहले',
    mr: 'दिवसापूर्वी',
  },
  'schemes.assistance.days': {
    en: 'days ago',
    hi: 'दिन पहले',
    mr: 'दिवसांपूर्वी',
  },
  'schemes.status.inProgress': {
    en: 'In Progress',
    hi: 'प्रक्रियाधीन',
    mr: 'प्रक्रियेत',
  },
  'schemes.status.pending': {
    en: 'Pending',
    hi: 'लंबित',
    mr: 'प्रलंबित',
  },
  'schemes.status.completed': {
    en: 'Completed',
    hi: 'पूर्ण',
    mr: 'पूर्ण झाले',
  },

  // ── Navigation ────────────────────────────────────────────────────────────

  'nav.overview': {
    en: 'Overview',
    hi: 'अवलोकन',
    mr: 'आढावा',
  },
  'nav.myCrop': {
    en: 'My Crop',
    hi: 'मेरी फसल',
    mr: 'माझे पीक',
  },
  'nav.cropHealth': {
    en: 'Crop Health',
    hi: 'फसल स्वास्थ्य',
    mr: 'पीक आरोग्य',
  },
  'nav.irrigation': {
    en: 'Irrigation',
    hi: 'सिंचाई',
    mr: 'सिंचन',
  },
  'nav.weather': {
    en: 'Weather',
    hi: 'मौसम',
    mr: 'हवामान',
  },
  'nav.kisanSathi': {
    en: 'Kisan Sathi',
    hi: 'किसान साथी',
    mr: 'किसान साथी',
  },
  'nav.resources': {
    en: 'Resources',
    hi: 'संसाधन',
    mr: 'संसाधने',
  },
  'nav.community': {
    en: 'Community',
    hi: 'समुदाय',
    mr: 'समुदाय',
  },
  'nav.schemes': {
    en: 'Schemes & Insurance',
    hi: 'योजनाएं और बीमा',
    mr: 'योजना आणि विमा',
  },
  'nav.marketBids': {
    en: 'Market & Bids',
    hi: 'बाजार और बोलियां',
    mr: 'बाजार आणि बोली',
  },
  'nav.logistics': {
    en: 'Logistics',
    hi: 'लॉजिस्टिक्स',
    mr: 'वाहतूक व लॉजिस्टिक्स',
  },
  'nav.farmerDesk': {
    en: 'Farmer Desk',
    hi: 'किसान डेस्क',
    mr: 'शेतकरी डेस्क',
  },
  'nav.inSeason': {
    en: 'In-Season',
    hi: 'मौसम में',
    mr: 'हंगामात',
  },
  'nav.services': {
    en: 'Services',
    hi: 'सेवाएं',
    mr: 'सेवा',
  },
  'nav.postHarvest': {
    en: 'Post-Harvest',
    hi: 'फसल कटाई उपरांत',
    mr: 'काढणीनंतर',
  },
  'nav.logout': {
    en: 'Logout',
    hi: 'लॉगआउट',
    mr: 'लॉगआउट',
  },
  'nav.backToDashboard': {
    en: 'Back to Dashboard',
    hi: 'डैशबोर्ड पर वापस',
    mr: 'डॅशबोर्डवर परत',
  },
  'nav.dashboard': {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    mr: 'डॅशबोर्ड',
  },

  // ── Common ────────────────────────────────────────────────────────────────

  'common.farmer': {
    en: 'Farmer',
    hi: 'किसान',
    mr: 'शेतकरी',
  },
  'common.demoFarmer': {
    en: 'Demo Farmer',
    hi: 'डेमो किसान',
    mr: 'डेमो शेतकरी',
  },
  'common.buyer': {
    en: 'Buyer',
    hi: 'खरीदार',
    mr: 'खरेदीदार',
  },
  'common.verifiedBuyer': {
    en: 'Verified Buyer',
    hi: 'सत्यापित खरीदार',
    mr: 'सत्यापित खरेदीदार',
  },
  'common.save': {
    en: 'Save',
    hi: 'सहेजें',
    mr: 'जतन करा',
  },
  'common.saved': {
    en: 'Saved',
    hi: 'सहेजा गया',
    mr: 'जतन केले',
  },
  'common.cancel': {
    en: 'Cancel',
    hi: 'रद्द करें',
    mr: 'रद्द करा',
  },
  'common.close': {
    en: 'Close',
    hi: 'बंद करें',
    mr: 'बंद करा',
  },
  'common.edit': {
    en: 'Edit',
    hi: 'संपादित करें',
    mr: 'संपादित करा',
  },
  'common.loading': {
    en: 'Loading…',
    hi: 'लोड हो रहा है…',
    mr: 'लोड होत आहे…',
  },
  'common.verified': {
    en: 'Verified',
    hi: 'सत्यापित',
    mr: 'सत्यापित',
  },
  'common.safe': {
    en: 'Safe',
    hi: 'सुरक्षित',
    mr: 'सुरक्षित',
  },
  'common.safeToSell': {
    en: 'Safe to sell',
    hi: 'बेचने के लिए सुरक्षित',
    mr: 'विक्रीसाठी सुरक्षित',
  },
  'common.acres': {
    en: 'acres',
    hi: 'एकड़',
    mr: 'एकर',
  },
  'common.quintals': {
    en: 'Quintals',
    hi: 'क्विंटल',
    mr: 'क्विंटल',
  },
  'common.kg': {
    en: 'kg',
    hi: 'किग्रा',
    mr: 'किलो',
  },
  'common.step': {
    en: 'Step',
    hi: 'चरण',
    mr: 'टप्पा',
  },
  'common.of': {
    en: 'of',
    hi: 'का',
    mr: 'पैकी',
  },
  'common.notifications': {
    en: 'Notifications',
    hi: 'सूचनाएं',
    mr: 'सूचना',
  },
  'common.noNotifications': {
    en: 'No new notifications',
    hi: 'कोई नई सूचना नहीं है',
    mr: 'कोणतीही नवीन सूचना नाही',
  },
  'common.viewBids': {
    en: 'View Bids',
    hi: 'बोलियां देखें',
    mr: 'बोली पहा',
  },
  'common.addProfilePicture': {
    en: 'Add profile picture',
    hi: 'प्रोफ़ाइल फ़ोटो जोड़ें',
    mr: 'प्रोफाइल फोटो जोडा',
  },

  // ── My Crop Screen ────────────────────────────────────────────────────────

  'myCrop.title': {
    en: 'My Crop',
    hi: 'मेरी फसल',
    mr: 'माझे पीक',
  },
  'myCrop.farmRecords': {
    en: 'Farm records',
    hi: 'खेत रिकॉर्ड',
    mr: 'शेती नोंदी',
  },
  'myCrop.startWithCrop': {
    en: 'Start with your crop',
    hi: 'अपनी फसल से शुरुआत करें',
    mr: 'आपल्या पिकापासून सुरुवात करा',
  },
  'myCrop.tellUsGrowing': {
    en: "Tell us what you're growing",
    hi: 'बताएं कि आप क्या उगा रहे हैं',
    mr: 'तुम्ही काय पिकवत आहात ते सांगा',
  },
  'myCrop.addDetailsDesc': {
    en: 'Add your crop details once and get a simple plan for watering, nutrition, crop stages, and harvest.',
    hi: 'एक बार अपनी फसल का विवरण जोड़ें और सिंचाई, पोषण, विकास चरणों और कटाई की सरल योजना प्राप्त करें।',
    mr: 'तुमच्या पिकाची माहिती एकदा जोडा आणि पाणी, पोषण, वाढीचे टप्पे आणि काढणीची सोपी योजना मिळवा.',
  },
  'myCrop.cropProfile': {
    en: 'Crop profile',
    hi: 'फसल प्रोफ़ाइल',
    mr: 'पीक प्रोफाइल',
  },
  'myCrop.profileHint': {
    en: 'Fields marked with * help us personalize suggestions.',
    hi: '* से चिह्नित फ़ील्ड सुझावों को वैयक्तिकृत करने में मदद करते हैं।',
    mr: '* चिन्हांकित फील्ड्स सल्ले वैयक्तिकृत करण्यास मदत करतात.',
  },
  'myCrop.cropName': {
    en: 'Crop name *',
    hi: 'फसल का नाम *',
    mr: 'पिकाचे नाव *',
  },
  'myCrop.variety': {
    en: 'Variety / seed type',
    hi: 'किस्म / बीज प्रकार',
    mr: 'वाण / बियाणे प्रकार',
  },
  'myCrop.varietyPlaceholder': {
    en: 'e.g. N-53, HD-2967',
    hi: 'उदा. N-53, HD-2967',
    mr: 'उदा. N-53, HD-2967',
  },
  'myCrop.dictateVariety': {
    en: 'Dictate variety or seed type',
    hi: 'किस्म या बीज प्रकार बोलें',
    mr: 'वाण किंवा बियाण्याचा प्रकार बोला',
  },
  'myCrop.plantingDate': {
    en: 'Planting date *',
    hi: 'बुवाई की तारीख *',
    mr: 'पेरणी / लागवड तारीख *',
  },
  'myCrop.quantityPlanted': {
    en: 'Quantity planted *',
    hi: 'लगाई गई मात्रा *',
    mr: 'लागवड केलेले प्रमाण *',
  },
  'myCrop.farmArea': {
    en: 'Farm area (acres) *',
    hi: 'खेत का क्षेत्रफल (एकड़) *',
    mr: 'शेताचे क्षेत्रफळ (एकर) *',
  },
  'myCrop.soilType': {
    en: 'Soil type',
    hi: 'मिट्टी का प्रकार',
    mr: 'मातीचा प्रकार',
  },
  'myCrop.irrigationMethod': {
    en: 'Irrigation method',
    hi: 'सिंचाई विधि',
    mr: 'सिंचन पद्धत',
  },
  'myCrop.notes': {
    en: 'Anything else to remember?',
    hi: 'कुछ और याद रखने योग्य?',
    mr: 'इतर काही महत्त्वाचे?',
  },
  'myCrop.notesPlaceholder': {
    en: 'Previous crop, pest concern, target harvest date...',
    hi: 'पिछली फसल, कीट की समस्या, लक्षित कटाई की तारीख...',
    mr: 'मागील पीक, किडीची समस्या, अपेक्षित काढणी तारीख...',
  },
  'myCrop.addMyCrop': {
    en: 'Add my crop',
    hi: 'मेरी फसल जोड़ें',
    mr: 'माझे पीक जोडा',
  },
  'myCrop.saveCropDetails': {
    en: 'Save crop details',
    hi: 'फसल विवरण सहेजें',
    mr: 'पीक माहिती जतन करा',
  },
  'myCrop.editDetails': {
    en: 'Edit details',
    hi: 'विवरण संपादित करें',
    mr: 'माहिती संपादित करा',
  },
  'myCrop.activeCropProfile': {
    en: 'Active crop profile',
    hi: 'सक्रिय फसल प्रोफ़ाइल',
    mr: 'सक्रिय पीक प्रोफाइल',
  },
  'myCrop.varietyLabel': {
    en: 'Variety:',
    hi: 'किस्म:',
    mr: 'वाण:',
  },
  'myCrop.notSpecified': {
    en: 'Not specified',
    hi: 'निर्दिष्ट नहीं',
    mr: 'नमूद केलेले नाही',
  },
  'myCrop.planted': {
    en: 'Planted',
    hi: 'बुवाई की गई',
    mr: 'लागवड केली',
  },
  'myCrop.daysGrowing': {
    en: 'Days growing',
    hi: 'विकास के दिन',
    mr: 'वाढीचे दिवस',
  },
  'myCrop.sincePlanting': {
    en: 'Since planting',
    hi: 'बुवाई से अब तक',
    mr: 'लागवडीपासून आतापर्यंत',
  },
  'myCrop.waterPlan': {
    en: 'Water plan',
    hi: 'जल योजना',
    mr: 'पाणी नियोजन',
  },
  'myCrop.perWeek': {
    en: 'Per week this stage',
    hi: 'इस चरण में प्रति सप्ताह',
    mr: 'या टप्प्यावर प्रति आठवडा',
  },
  'myCrop.nextMilestone': {
    en: 'Next milestone',
    hi: 'अगला पड़ाव',
    mr: 'पुढील टप्पा',
  },
  'myCrop.keepMonitoring': {
    en: 'Keep monitoring',
    hi: 'निगरानी जारी रखें',
    mr: 'निरीक्षण चालू ठेवा',
  },
  'myCrop.lifecycle': {
    en: 'Crop lifecycle',
    hi: 'फसल जीवनचक्र',
    mr: 'पीक जीवनचक्र',
  },
  'myCrop.currentStageAhead': {
    en: "Current stage and what's ahead",
    hi: 'वर्तमान चरण और आगे क्या है',
    mr: 'सध्याचा टप्पा आणि पुढील वाटचाल',
  },
  'myCrop.stageCurrent': {
    en: 'Current',
    hi: 'वर्तमान',
    mr: 'सध्याचा',
  },
  'myCrop.stageComplete': {
    en: 'Complete',
    hi: 'पूर्ण',
    mr: 'पूर्ण',
  },
  'myCrop.stageUpcoming': {
    en: 'Upcoming',
    hi: 'आगामी',
    mr: 'पुढील',
  },
  'myCrop.recommendationsFor': {
    en: 'Recommendations for',
    hi: 'सुझाव:',
    mr: 'शिफारशी:',
  },
  'myCrop.personalizedGuidance': {
    en: 'Personalized guidance for your current stage',
    hi: 'आपके वर्तमान चरण के लिए व्यक्तिगत मार्गदर्शन',
    mr: 'तुमच्या सध्याच्या टप्प्यासाठी वैयक्तिकृत मार्गदर्शन',
  },
  'myCrop.guide1': {
    en: 'Check soil moisture before watering and avoid standing water around the roots.',
    hi: 'पानी देने से पहले मिट्टी की नमी जांचें और जड़ों के पास पानी जमा न होने दें।',
    mr: 'पाणी देण्यापूर्वी मातीतील ओलावा तपासा आणि मुळांजवळ पाणी साचू देऊ नका.',
  },
  'myCrop.guide2': {
    en: 'Walk the crop twice this week and look under leaves for early pest or disease signs.',
    hi: 'इस सप्ताह दो बार फसल का मुआयना करें और कीट या बीमारी के लक्षणों के लिए पत्तियों के नीचे देखें।',
    mr: 'या आठवड्यात दोनदा पिकाची पाहणी करा आणि कीड किंवा रोगाच्या लक्षणांसाठी पानांच्या खाली पहा.',
  },
  'myCrop.guide3': {
    en: 'Use balanced nutrition based on a soil test; avoid adding fertilizer on dry soil.',
    hi: 'मिट्टी परीक्षण के आधार पर संतुलित पोषण दें; सूखी मिट्टी में खाद डालने से बचें।',
    mr: 'माती परीक्षणावर आधारित संतुलित खते वापरा; कोरड्या मातीत खत टाकणे टाळा.',
  },
  'myCrop.guide4': {
    en: 'Record each irrigation, spray, and observation so your next recommendation gets better.',
    hi: 'प्रत्येक सिंचाई, छिड़काव और अवलोकन दर्ज करें ताकि अगली सलाह और बेहतर हो सके।',
    mr: 'प्रत्येक सिंचन, फवारणी आणि नोंदी नोंदवून ठेवा जेणेकरून पुढील सल्ला अधिक अचूक मिळेल.',
  },
  'myCrop.yourFarmDetails': {
    en: 'Your farm details',
    hi: 'आपके खेत का विवरण',
    mr: 'तुमच्या शेताचा तपशील',
  },
  'myCrop.soilTypeLabel': {
    en: 'Soil type',
    hi: 'मिट्टी का प्रकार',
    mr: 'मातीचा प्रकार',
  },
  'myCrop.irrigationLabel': {
    en: 'Irrigation',
    hi: 'सिंचाई',
    mr: 'सिंचन',
  },
  'myCrop.quantityLabel': {
    en: 'Quantity',
    hi: 'मात्रा',
    mr: 'प्रमाण',
  },
  'myCrop.nextBestAction': {
    en: 'Next best action',
    hi: 'अगली सबसे अच्छी कार्रवाई',
    mr: 'पुढील सर्वोत्तम कृती',
  },
  'myCrop.nextActionHint': {
    en: 'Inspect the field, check moisture, and update your crop notes after the next visit.',
    hi: 'खेत का निरीक्षण करें, नमी जांचें और अगली यात्रा के बाद फसल नोट्स अपडेट करें।',
    mr: 'शेताची पाहणी करा, ओलावा तपासा आणि पुढच्या भेटीनंतर पीक नोंदी अद्यतनित करा.',
  },

  // Stages
  'myCrop.stage.landPrep': {
    en: 'Land Preparation',
    hi: 'खेत की तैयारी',
    mr: 'जमीन मशागत',
  },
  'myCrop.stage.sowing': {
    en: 'Sowing',
    hi: 'बुवाई',
    mr: 'पेरणी',
  },
  'myCrop.stage.germination': {
    en: 'Germination',
    hi: 'अंकुरण',
    mr: 'अंकुरण',
  },
  'myCrop.stage.vegetative': {
    en: 'Vegetative Growth',
    hi: 'वानस्पतिक वृद्धि',
    mr: 'शाकीय वाढ',
  },
  'myCrop.stage.flowering': {
    en: 'Flowering',
    hi: 'फूल आना',
    mr: 'फुलोरा',
  },
  'myCrop.stage.bulbFormation': {
    en: 'Bulb Formation',
    hi: 'कंद / गांठ बनना',
    mr: 'कांदा / कंद तयार होणे',
  },
  'myCrop.stage.maturity': {
    en: 'Maturity',
    hi: 'परिपक्वता',
    mr: 'पक्वता',
  },
  'myCrop.stage.harvest': {
    en: 'Harvest',
    hi: 'कटाई',
    mr: 'काढणी',
  },

  // ── Irrigation Screen ─────────────────────────────────────────────────────

  'irrigation.title': {
    en: 'Zone-based Irrigation Advisory',
    hi: 'ज़ोन-आधारित सिंचाई सलाह',
    mr: 'झोन-आधारित सिंचन सल्ला',
  },
  'irrigation.simulatedSensors': {
    en: 'SIMULATED SENSORS',
    hi: 'सिमुलेटेड सेंसर',
    mr: 'सिम्युलेटेड सेन्सर्स',
  },
  'irrigation.heroDesc': {
    en: 'Each zone is assessed independently based on soil moisture, temperature, weather forecast and crop stage. The system is hardware-ready — real sensors can feed the same logic in future.',
    hi: 'प्रत्येक ज़ोन का मिट्टी की नमी, तापमान, मौसम पूर्वानुमान और फसल चरण के आधार पर स्वतंत्र रूप से मूल्यांकन किया जाता है।',
    mr: 'मातीतील ओलावा, तापमान, हवामान अंदाज आणि पिकाच्या टप्प्यावर प्रत्येक झोनचे स्वतंत्रपणे मूल्यांकन केले जाते.',
  },
  'irrigation.rainfallExpected': {
    en: 'Rainfall expected Sun:',
    hi: 'रविवार को बारिश की संभावना:',
    mr: 'रविवारी पावसाची शक्यता:',
  },
  'irrigation.rainfallDesc': {
    en: '8mm. Consider reducing irrigation in zones that can wait until then.',
    hi: '8 मिमी। उन क्षेत्रों में सिंचाई कम करने पर विचार करें जो तब तक प्रतीक्षा कर सकते हैं।',
    mr: '8 मिमी. तोपर्यंत थांबू शकणाऱ्या झोनमध्ये पाणी देणे कमी करण्याचा विचार करा.',
  },
  'irrigation.soilMoisture': {
    en: 'Soil moisture',
    hi: 'मिट्टी की नमी',
    mr: 'मातीतील ओलावा',
  },
  'irrigation.temperature': {
    en: 'Temperature',
    hi: 'तापमान',
    mr: 'तापमान',
  },
  'irrigation.lastIrrigated': {
    en: 'Last irrigated',
    hi: 'अंतिम सिंचाई',
    mr: 'शेवटचे सिंचन',
  },
  'irrigation.scheduleIrrigation': {
    en: 'Schedule irrigation',
    hi: 'सिंचाई निर्धारित करें',
    mr: 'सिंचन निश्चित करा',
  },
  'irrigation.scheduled': {
    en: 'Scheduled',
    hi: 'निर्धारित किया गया',
    mr: 'नियोजित केले',
  },
  'irrigation.zoneHealthy': {
    en: 'Zone healthy',
    hi: 'ज़ोन स्वस्थ है',
    mr: 'झोन निरोगी आहे',
  },
  'irrigation.safetyTitle': {
    en: 'Safety-tiered automation',
    hi: 'सुरक्षा-स्तरीय स्वचालन',
    mr: 'सुरक्षा-स्तरीय ऑटोमेशन',
  },
  'irrigation.concept': {
    en: '(concept)',
    hi: '(अवधारणा)',
    mr: '(संकल्पना)',
  },
  'irrigation.futureReady': {
    en: 'Future-ready irrigation control',
    hi: 'भविष्य के लिए तैयार सिंचाई नियंत्रण',
    mr: 'भविष्यासाठी सज्ज सिंचन नियंत्रण',
  },
  'irrigation.tier1Title': {
    en: 'Tier 1 — Advisory',
    hi: 'स्तर 1 — सलाह',
    mr: 'स्तर 1 — सल्लागार',
  },
  'irrigation.tier1Desc': {
    en: 'System recommends irrigation. Farmer confirms manually.',
    hi: 'प्रणाली सिंचाई की सिफारिश करती है। किसान मैन्युअल रूप से पुष्टि करता है।',
    mr: 'प्रणाली सिंचनाची शिफारस करते. शेतकरी स्वतः खात्री करतो.',
  },
  'irrigation.mvpActive': {
    en: 'MVP active',
    hi: 'MVP सक्रिय',
    mr: 'MVP सक्रिय',
  },
  'irrigation.tier2Title': {
    en: 'Tier 2 — Assisted',
    hi: 'स्तर 2 — समर्थित',
    mr: 'स्तर 2 — सहाय्यित',
  },
  'irrigation.tier2Desc': {
    en: 'System prepares irrigation plan with pre-filled settings. Farmer one-tap confirms.',
    hi: 'प्रणाली पूर्व-निर्धारित सेटिंग्स के साथ सिंचाई योजना तैयार करती है। किसान एक-टैप से पुष्टि करता है।',
    mr: 'प्रणाली पूर्व-नियोजित सेटिंग्जसह सिंचन योजना तयार करते. शेतकरी एका टॅपमध्ये पुष्टी करतो.',
  },
  'irrigation.tier3Title': {
    en: 'Tier 3 — Automated',
    hi: 'स्तर 3 — स्वचालित',
    mr: 'स्तर 3 — स्वयंचलित',
  },
  'irrigation.tier3Desc': {
    en: 'System auto-activates drip valves based on zone thresholds. Farmer can override.',
    hi: 'प्रणाली ज़ोन सीमाओं के आधार पर ड्रिप वाल्व को स्वचालित रूप से सक्रिय करती है। किसान बदल सकता है।',
    mr: 'प्रणाली झोन मर्यादेनुसार ड्रिप व्हॉल्व्ह आपोआप सुरू करते. शेतकरी बदल करू शकतो.',
  },

  // ── Weather Screen ────────────────────────────────────────────────────────

  'weather.advisoryTitle': {
    en: 'Heatwave advisory — next 3 days',
    hi: 'लू (हीटवेव) परामर्श — अगले 3 दिन',
    mr: 'उष्णतेची लाट सल्ला — पुढील 3 दिवस',
  },
  'weather.highRisk': {
    en: 'High Risk',
    hi: 'उच्च जोखिम',
    mr: 'उच्च धोका',
  },
  'weather.advisoryDesc': {
    en: 'Day temperatures expected to reach 37–39°C in Nashik district. Onion bulb formation is heat-sensitive.',
    hi: 'नासिक जिले में दिन का तापमान 37-39 डिग्री सेल्सियस तक पहुंचने की संभावना है। प्याज की गांठ बनना गर्मी के प्रति संवेदनशील है।',
    mr: 'नाशिक जिल्ह्यात दिवसाचे तापमान 37-39 अंश सेल्सिअसपर्यंत पोहोचण्याची शक्यता आहे. कांदा पोसणे उष्णतेस संवेदनशील आहे.',
  },
  'weather.recommendedAction': {
    en: 'RECOMMENDED ACTION',
    hi: 'अनुशंसित कार्रवाई',
    mr: 'शिफारस केलेली कृती',
  },
  'weather.actionDesc': {
    en: 'Irrigate in early morning or evening. Apply mulch where possible to reduce soil evaporation.',
    hi: 'सुबह जल्दी या शाम को सिंचाई करें। मिट्टी के वाष्पीकरण को कम करने के लिए जहां संभव हो वहां मल्च लगाएं।',
    mr: 'सकाळी लवकर किंवा संध्याकाळी पाणी द्या. बाष्पीभवन कमी करण्यासाठी शक्य असेल तिथे आच्छादन (मल्चिंग) वापरा.',
  },
  'weather.forecastTitle': {
    en: '7-day forecast',
    hi: '7-दिवसीय पूर्वानुमान',
    mr: '7-दिवसांचा अंदाज',
  },
  'weather.conditionsTitle': {
    en: "Today's conditions",
    hi: 'आज की स्थिति',
    mr: 'आजची परिस्थिती',
  },
  'weather.highLow': {
    en: 'High / Low',
    hi: 'अधिकतम / न्यूनतम',
    mr: 'कमाल / किमान',
  },
  'weather.humidity': {
    en: 'Humidity',
    hi: 'आर्द्रता',
    mr: 'आर्द्रता',
  },
  'weather.rainChance': {
    en: 'Rain chance',
    hi: 'बारिश की संभावना',
    mr: 'पावसाची शक्यता',
  },
  'weather.wind': {
    en: 'Wind',
    hi: 'हवा की गति',
    mr: 'वाऱ्याचा वेग',
  },
  'weather.day.today': {
    en: 'Today',
    hi: 'आज',
    mr: 'आज',
  },
  'weather.day.tomorrow': {
    en: 'Tomorrow',
    hi: 'कल',
    mr: 'उद्या',
  },
  'weather.day.fri': {
    en: 'Fri',
    hi: 'शुक्र',
    mr: 'शुक्र',
  },
  'weather.day.sat': {
    en: 'Sat',
    hi: 'शनि',
    mr: 'शनि',
  },
  'weather.day.sun': {
    en: 'Sun',
    hi: 'रवि',
    mr: 'रवि',
  },
  'weather.day.mon': {
    en: 'Mon',
    hi: 'सोम',
    mr: 'सोम',
  },
  'weather.day.tue': {
    en: 'Tue',
    hi: 'मंगल',
    mr: 'मंगळ',
  },

  // ── Resources Screen ──────────────────────────────────────────────────────

  'resources.title': {
    en: 'Resources & Services',
    hi: 'संसाधन और सेवाएं',
    mr: 'संसाधने आणि सेवा',
  },
  'resources.subtitle': {
    en: 'Seeds, fertilizer, machinery, labour, logistics, storage — ranked by suitability, quality and proximity, not by payment.',
    hi: 'बीज, उर्वरक, मशीनरी, श्रम, लॉजिस्टिक्स, भंडारण — उपयुक्तता, गुणवत्ता और निकटता के आधार पर रैंक किए गए।',
    mr: 'बियाणे, खते, यंत्रसामग्री, मजूर, वाहतूक, साठवणूक — उपयुक्तता, गुणवत्ता आणि जवळीकीनुसार रँक केलेले.',
  },
  'resources.trust': {
    en: 'Provider rankings are based on price, quality, ratings, availability and location. Paid promotion does not manipulate recommendations.',
    hi: 'प्रदाता रैंकिंग मूल्य, गुणवत्ता, रेटिंग, उपलब्धता और स्थान पर आधारित हैं। सशुल्क प्रचार सिफारिशों को प्रभावित नहीं करता है।',
    mr: 'सेवा प्रदाता रँकिंग किंमत, गुणवत्ता, रेटिंग, उपलब्धता आणि ठिकाणावर आधारित आहे. सशुल्क जाहिराती शिफारसी बदलत नाहीत.',
  },
  'resources.searchPlaceholder': {
    en: 'Search providers, village...',
    hi: 'प्रदाता, गांव खोजें...',
    mr: 'प्रदाता, गाव शोधा...',
  },
  'resources.cat.all': {
    en: 'All',
    hi: 'सभी',
    mr: 'सर्व',
  },
  'resources.cat.seeds': {
    en: 'Seeds',
    hi: 'बीज',
    mr: 'बियाणे',
  },
  'resources.cat.fertilizer': {
    en: 'Fertilizer',
    hi: 'उर्वरक / खाद',
    mr: 'खते',
  },
  'resources.cat.machinery': {
    en: 'Machinery',
    hi: 'मशीनरी व यंत्र',
    mr: 'यंत्रसामग्री',
  },
  'resources.cat.labour': {
    en: 'Labour',
    hi: 'श्रमिक / मजदूर',
    mr: 'मजूर',
  },
  'resources.cat.logistics': {
    en: 'Logistics',
    hi: 'लॉजिस्टिक्स',
    mr: 'वाहतूक',
  },
  'resources.cat.storage': {
    en: 'Storage',
    hi: 'भंडारण / कोल्ड स्टोरेज',
    mr: 'साठवणूक / कोल्ड स्टोरेज',
  },
  'resources.respondsIn': {
    en: 'Responds in ~',
    hi: 'प्रतिक्रिया समय ~',
    mr: 'प्रतिसाद वेळ ~',
  },
  'resources.inStock': {
    en: 'In stock',
    hi: 'उपलब्ध है',
    mr: 'उपलब्ध आहे',
  },
  'resources.outOfStock': {
    en: 'Out',
    hi: 'समाप्त',
    mr: 'संपले',
  },
  'resources.requestService': {
    en: 'Request service',
    hi: 'सेवा अनुरोध भेजें',
    mr: 'सेवेची विनंती करा',
  },
  'resources.contact': {
    en: 'Contact',
    hi: 'संपर्क करें',
    mr: 'संपर्क साधा',
  },
  'resources.noProviders': {
    en: 'No providers match your search.',
    hi: 'आपकी खोज से मेल खाने वाला कोई प्रदाता नहीं मिला।',
    mr: 'तुमच्या शोधाशी जुळणारा कोणताही प्रदाता आढळला नाही.',
  },
  'resources.verifiedBadge': {
    en: 'Krishi Mitra Verified',
    hi: 'कृषि मित्र सत्यापित',
    mr: 'कृषी मित्र सत्यापित',
  },
  'resources.call': {
    en: 'Call',
    hi: 'कॉल करें',
    mr: 'कॉल करा',
  },
  'resources.directions': {
    en: 'Directions',
    hi: 'दिशा-निर्देश',
    mr: 'दिशा',
  },
  'resources.useMyLocation': {
    en: 'Use My Location',
    hi: 'मेरा स्थान उपयोग करें',
    mr: 'माझे स्थान वापरा',
  },
  'resources.locating': {
    en: 'Detecting Location...',
    hi: 'स्थान खोजा जा रहा है...',
    mr: 'स्थान शोधत आहे...',
  },
  'resources.manualLocation': {
    en: 'Set Location',
    hi: 'स्थान सेट करें',
    mr: 'स्थान सेट करा',
  },
  'resources.villageOrPincode': {
    en: 'Enter Village or 6-digit Pincode (e.g. Chandwad or 422001)',
    hi: 'गांव या 6 अंकों का पिनकोड दर्ज करें (उदा. चांदवड या 422001)',
    mr: 'गाव किंवा 6 अंकी पिनकोड प्रविष्ट करा (उदा. चांदवड किंवा 422001)',
  },
  'resources.locationDenied': {
    en: 'Location access disabled or timed out. Enter your village or pincode below.',
    hi: 'स्थान अनुमति नहीं मिली या समय समाप्त। नीचे अपना गांव या पिनकोड दर्ज करें।',
    mr: 'स्थान परवानगी मिळाली नाही किंवा वेळ संपला. खाली आपले गाव किंवा पिनकोड प्रविष्ट करा.',
  },
  'resources.registerProvider': {
    en: 'Register Center',
    hi: 'केंद्र पंजीकृत करें',
    mr: 'केंद्र नोंदणी करा',
  },
  'resources.requestModalTitle': {
    en: 'Request Service',
    hi: 'सेवा अनुरोध',
    mr: 'सेवा विनंती',
  },
  'resources.farmerName': {
    en: 'Your Full Name',
    hi: 'आपका पूरा नाम',
    mr: 'तुमचे पूर्ण नाव',
  },
  'resources.farmerPhone': {
    en: 'Your Phone Number',
    hi: 'आपका फोन नंबर',
    mr: 'तुमचा फोन नंबर',
  },
  'resources.notes': {
    en: 'Requirement / Timeline Notes',
    hi: 'आवश्यकता / समय विवरण',
    mr: 'आवश्यकता / वेळ तपशील',
  },
  'resources.notesPlaceholder': {
    en: 'E.g., Need tractor tomorrow morning for 4 hours, or 10 bags of urea...',
    hi: 'उदा., कल सुबह 4 घंटे के लिए ट्रैक्टर चाहिए, या 10 बोरी यूरिया...',
    mr: 'उदा., उद्या सकाळी 4 तासांसाठी ट्रॅक्टर हवा, किंवा 10 पोती युरिया...',
  },
  'resources.submitRequest': {
    en: 'Send Request',
    hi: 'अनुरोध भेजें',
    mr: 'विनंती पाठवा',
  },
  'resources.submitting': {
    en: 'Submitting...',
    hi: 'भेजा जा रहा है...',
    mr: 'पाठवत आहे...',
  },
  'resources.cancel': {
    en: 'Cancel',
    hi: 'रद्द करें',
    mr: 'रद्द करा',
  },
  'resources.providerFormTitle': {
    en: 'Provider Onboarding (Fixed Business Location)',
    hi: 'स्थिर सेवा केंद्र पंजीकरण',
    mr: 'स्थिर सेवा केंद्र नोंदणी',
  },
  'resources.providerFormSubtitle': {
    en: 'Register your fixed agro-store, workshop, or center. Fixed locations only (no continuous GPS tracking).',
    hi: 'अपना निश्चित कृषि-स्टोर, कार्यशाला या केंद्र पंजीकृत करें। केवल स्थिर स्थान (कोई निरंतर जीपीएस ट्रैकिंग नहीं)।',
    mr: 'तुमचे निश्चित कृषी-स्टोअर, वर्कशॉप किंवा केंद्र नोंदवा. फक्त स्थिर ठिकाण (कोणतीही सतत जीपीएस ट्रॅकिंग नाही).',
  },
  'resources.businessName': {
    en: 'Business / Service Name',
    hi: 'व्यवसाय / सेवा केंद्र का नाम',
    mr: 'व्यवसाय / सेवा केंद्राचे नाव',
  },
  'resources.ownerName': {
    en: 'Owner / Contact Name',
    hi: 'मालिक / संपर्क व्यक्ति का नाम',
    mr: 'मालक / संपर्क व्यक्तीचे नाव',
  },
  'resources.address': {
    en: 'Full Address',
    hi: 'पूरा पता',
    mr: 'पूर्ण पत्ता',
  },
  'resources.pincode': {
    en: 'Pincode (6 digits)',
    hi: 'पिनकोड (6 अंक)',
    mr: 'पिनकोड (6 अंक)',
  },
  'resources.gpsCoords': {
    en: 'Fixed Business Coordinates (Lat, Lon)',
    hi: 'स्थिर व्यावसायिक निर्देशांक (अक्षांश, देशांतर)',
    mr: 'स्थिर व्यावसायिक निर्देशांक (अक्षांश, रेखांश)',
  },
  'resources.pendingVerificationNotice': {
    en: 'Registered with is_available: true and is_verified: false (pending Krishi Mitra verification).',
    hi: 'सफलतापूर्वक पंजीकृत! कृषि मित्र सत्यापन की प्रतीक्षा में।',
    mr: 'यशस्वीरीत्या नोंदणीकृत! कृषी मित्र पडताळणी प्रलंबित.',
  },
  'resources.emptyTitle': {
    en: 'No Providers Available Within Range',
    hi: 'दायरे में कोई प्रदाता उपलब्ध नहीं है',
    mr: 'कक्षेत कोणताही प्रदाता उपलब्ध नाही',
  },
  'resources.emptySubtitle': {
    en: 'No verified service providers found in this category near your location. Try another category or enter another village.',
    hi: 'आपके स्थान के निकट इस श्रेणी में कोई सत्यापित प्रदाता नहीं मिला। कोई अन्य श्रेणी आज़माएं या अन्य गांव दर्ज करें।',
    mr: 'तुमच्या स्थानाजवळ या श्रेणीमध्ये कोणताही सत्यापित प्रदाता आढळला नाही. दुसरी श्रेणी निवडून पहा किंवा दुसरे गाव टाका.',
  },
  'resources.resetFilters': {
    en: 'Reset Filters',
    hi: 'फ़िल्टर रीसेट करें',
    mr: 'फिल्टर रीसेट करा',
  },


  // ── Community Screen ──────────────────────────────────────────────────────

  'community.heroEyebrow': {
    en: 'Farmer network',
    hi: 'किसान नेटवर्क',
    mr: 'शेतकरी नेटवर्क',
  },
  'community.heroTitle': {
    en: 'Community & insights',
    hi: 'समुदाय और अंतर्दृष्टि',
    mr: 'समुदाय आणि माहिती',
  },
  'community.heroSubtitle': {
    en: 'Connect with farmers, learn from the field, and stay ahead of agriculture news.',
    hi: 'किसानों से जुड़ें, खेत के अनुभवों से सीखें और कृषि समाचारों से अवगत रहें।',
    mr: 'शेतकऱ्यांशी जोडा, शेतातील अनुभवातून शिका आणि कृषी बातम्यांशी अद्ययावत राहा.',
  },
  'community.shareWithFarmers': {
    en: 'Share with farmers',
    hi: 'किसानों के साथ साझा करें',
    mr: 'शेतकऱ्यांशी शेअर करा',
  },
  'community.whatsHappening': {
    en: "What's happening on your farm?",
    hi: 'आपके खेत में क्या चल रहा है?',
    mr: 'तुमच्या शेतात काय चालले आहे?',
  },
  'community.composerPlaceholder': {
    en: 'Share a question, tip, or update...',
    hi: 'कोई प्रश्न, सुझाव या अपडेट साझा करें...',
    mr: 'एखादा प्रश्न, टीप किंवा माहिती शेअर करा...',
  },
  'community.publishPost': {
    en: 'Publish post',
    hi: 'पोस्ट प्रकाशित करें',
    mr: 'पोस्ट प्रकाशित करा',
  },
  'community.fromCommunity': {
    en: 'From the community',
    hi: 'समुदाय से',
    mr: 'समुदायाकडून',
  },
  'community.conversations': {
    en: 'Farmer conversations',
    hi: 'किसान बातचीत',
    mr: 'शेतकरी संवाद',
  },
  'community.viewAll': {
    en: 'View all',
    hi: 'सभी देखें',
    mr: 'सर्व पहा',
  },
  'community.comments': {
    en: 'comments',
    hi: 'टिप्पणियाँ',
    mr: 'टिप्पण्या',
  },
  'community.growNetwork': {
    en: 'Grow your network',
    hi: 'अपना नेटवर्क बढ़ाएं',
    mr: 'तुमचे नेटवर्क वाढवा',
  },
  'community.farmersToConnect': {
    en: 'Farmers to connect',
    hi: 'जुड़ने योग्य किसान',
    mr: 'जोडण्यासाठी शेतकरी',
  },
  'community.connect': {
    en: 'Connect',
    hi: 'जुड़ें',
    mr: 'जोडा',
  },
  'community.connected': {
    en: 'Connected',
    hi: 'जुड़े हुए',
    mr: 'जोडले',
  },
  'community.trendingNow': {
    en: 'Trending now',
    hi: 'वर्तमान में चर्चित',
    mr: 'सध्या चर्चेत',
  },
  'community.agriNews': {
    en: 'Agriculture news',
    hi: 'कृषि समाचार',
    mr: 'कृषी बातम्या',
  },
  'community.seeAllNews': {
    en: 'See all agriculture news',
    hi: 'सभी कृषि समाचार देखें',
    mr: 'सर्व कृषी बातम्या पहा',
  },

  // ── Market & Bids Screen ──────────────────────────────────────────────────

  'marketBids.eyebrow': {
    en: 'Post-harvest & Sales',
    hi: 'फसल कटाई उपरांत और बिक्री',
    mr: 'काढणीनंतर आणि विक्री',
  },
  'marketBids.title': {
    en: 'Market & Bids',
    hi: 'बाजार और बोलियां',
    mr: 'बाजार आणि बोली',
  },
  'marketBids.subtitle': {
    en: 'Manage your published crop lots, locate buyers on OpenStreetMap, and review incoming offers in real time.',
    hi: 'अपने प्रकाशित फसल लॉट प्रबंधित करें, ओपनस्ट्रीटमैप पर खरीदारों को खोजें और रीयल-टाइम में प्रस्तावों की समीक्षा करें।',
    mr: 'तुमचे प्रकाशित पीक लॉट व्यवस्थापित करा, ओपनस्ट्रीटमॅपवर खरेदीदार शोधा आणि थेट बोली तपासा.',
  },
  'marketBids.publishCrop': {
    en: 'Publish Crop',
    hi: 'फसल प्रकाशित करें',
    mr: 'पीक प्रकाशित करा',
  },
  'marketBids.publishNewCrop': {
    en: 'Publish New Crop',
    hi: 'नई फसल प्रकाशित करें',
    mr: 'नवीन पीक प्रकाशित करा',
  },
  'marketBids.tabBids': {
    en: 'Published Crops & Active Bids',
    hi: 'प्रकाशित फसलें और सक्रिय बोलियां',
    mr: 'प्रकाशित पिके आणि सक्रिय बोली',
  },
  'marketBids.tabMap': {
    en: '🗺️ Interactive Map & Bidders',
    hi: '🗺️ मानचित्र और बोलीदाता',
    mr: '🗺️ नकाशा आणि बोली लावणारे',
  },
  'marketBids.tabMandi': {
    en: 'Mandi Trends',
    hi: 'मंडी रुझान',
    mr: 'बाजार भाव कल',
  },
  'marketBids.noLots': {
    en: 'No crop lots published yet',
    hi: 'अभी तक कोई फसल लॉट प्रकाशित नहीं हुआ है',
    mr: 'अद्याप कोणतेही पीक लॉट प्रकाशित केलेले नाही',
  },
  'marketBids.noLotsDesc': {
    en: 'Publish a crop lot from your Dashboard to list it on the marketplace and receive live bids from verified buyers.',
    hi: 'बाज़ार में सूचीबद्ध करने और सत्यापित खरीदारों से लाइव बोलियां प्राप्त करने के लिए अपने डैशबोर्ड से फसल प्रकाशित करें।',
    mr: 'बाजारात नोंदणी करण्यासाठी आणि सत्यापित खरेदीदारांकडून थेट बोली मिळवण्यासाठी तुमच्या डॅशबोर्डवरून पीक प्रकाशित करा.',
  },
  'marketBids.publishFirstLot': {
    en: 'Publish Your First Crop Lot',
    hi: 'अपना पहला फसल लॉट प्रकाशित करें',
    mr: 'तुमचे पहिले पीक लॉट प्रकाशित करा',
  },
  'marketBids.asking': {
    en: 'Asking',
    hi: 'मांग मूल्य',
    mr: 'अपेक्षित किंमत',
  },
  'marketBids.buyerOffers': {
    en: 'Buyer offers for this lot',
    hi: 'इस लॉट के लिए खरीदार के प्रस्ताव',
    mr: 'या लॉटसाठी खरेदीदारांच्या बोली',
  },
  'marketBids.noBidsOnLot': {
    en: 'No buyer bids placed yet on this lot. Your listing is broadcasted to buyers on the marketplace.',
    hi: 'इस लॉट पर अभी तक कोई बोली नहीं लगाई गई है। आपकी लिस्टिंग बाज़ार में खरीदारों को दिखाई दे रही है।',
    mr: 'या लॉटवर अद्याप कोणतीही बोली लावलेली नाही. तुमची नोंद बाजारातील खरेदीदारांपर्यंत पोहोचली आहे.',
  },
  'marketBids.stateMandiIndex': {
    en: 'State Mandi Live Index',
    hi: 'राज्य मंडी लाइव सूचकांक',
    mr: 'राज्य कृषी उत्पन्न बाजार थेट निर्देशांक',
  },
  'marketBids.mandiIndexDesc': {
    en: 'Real-time modal prices across APMC markets',
    hi: 'APMC मंडियों में रीयल-टाइम मॉडल भाव',
    mr: 'APMC बाजारांमधील थेट सरासरी भाव',
  },
  'marketBids.live': {
    en: 'Live',
    hi: 'लाइव',
    mr: 'थेट',
  },
  'marketBids.directNegotiation': {
    en: 'Direct Negotiation',
    hi: 'सीधी बातचीत',
    mr: 'थेट वाटाघाटी',
  },
  'marketBids.counterBid': {
    en: 'Counter-Bid',
    hi: 'प्रति-प्रस्ताव',
    mr: 'प्रति-बोली',
  },
  'marketBids.currentBid': {
    en: 'Current Bid',
    hi: 'वर्तमान बोली',
    mr: 'सध्याची बोली',
  },
  'marketBids.yourCounterOffer': {
    en: 'Your Counter-Offer (₹ per kg)',
    hi: 'आपका प्रति-प्रस्ताव (₹ प्रति किग्रा)',
    mr: 'तुमची प्रति-बोली (₹ प्रति किलो)',
  },
  'marketBids.sendCounter': {
    en: 'Send Counter-Offer',
    hi: 'प्रति-प्रस्ताव भेजें',
    mr: 'प्रति-बोली पाठवा',
  },
  'marketBids.sending': {
    en: 'Sending…',
    hi: 'भेजा जा रहा है…',
    mr: 'पाठवत आहे…',
  },

  // BidRow
  'bidRow.quantity': {
    en: 'Quantity',
    hi: 'मात्रा',
    mr: 'प्रमाण',
  },
  'bidRow.location': {
    en: 'Location',
    hi: 'स्थान',
    mr: 'ठिकाण',
  },
  'bidRow.total': {
    en: 'Total',
    hi: 'कुल',
    mr: 'एकूण',
  },
  'bidRow.accept': {
    en: 'Accept',
    hi: 'स्वीकारें',
    mr: 'स्वीकारा',
  },
  'bidRow.counter': {
    en: 'Counter',
    hi: 'प्रति-प्रस्ताव',
    mr: 'प्रति-बोली',
  },
  'bidRow.reject': {
    en: 'Reject',
    hi: 'अस्वीकार करें',
    mr: 'नाकारा',
  },
  'bidRow.statusAccepted': {
    en: '✓ Offer accepted',
    hi: '✓ प्रस्ताव स्वीकृत',
    mr: '✓ बोली मंजूर',
  },
  'bidRow.statusRejected': {
    en: '✗ Offer rejected',
    hi: '✗ प्रस्ताव अस्वीकृत',
    mr: '✗ बोली नाकारली',
  },
  'bidRow.statusCounter': {
    en: '↕ Counter',
    hi: '↕ प्रति-प्रस्ताव',
    mr: '↕ प्रति-बोली',
  },
  'bidRow.statusPending': {
    en: 'Pending review',
    hi: 'समीक्षाधीन',
    mr: 'पुनरावलोकनासाठी प्रलंबित',
  },

  // ── Logistics Screen ──────────────────────────────────────────────────────

  'logistics.heroTitle': {
    en: 'Pooled Logistics',
    hi: 'सामूहिक लॉजिस्टिक्स',
    mr: 'सामायिक वाहतूक व लॉजिस्टिक्स',
  },
  'logistics.simulated': {
    en: 'Simulated',
    hi: 'सिमुलेटेड',
    mr: 'सिम्युलेटेड',
  },
  'logistics.heroSubtitle': {
    en: 'Share transport with nearby farmers shipping the same crop to the same buyer. Lower cost per farmer, higher net realisation.',
    hi: 'एक ही खरीदार को एक ही फसल भेजने वाले नजदीकी किसानों के साथ परिवहन साझा करें। कम लागत, अधिक लाभ।',
    mr: 'एकाच खरेदीदाराला समान पीक पाठवणाऱ्या जवळच्या शेतकऱ्यांसोबत वाहतूक शेअर करा. कमी खर्च, जास्त नफा.',
  },
  'logistics.poolMatch': {
    en: 'Pool match found',
    hi: 'पूल मैच मिला',
    mr: 'वाहतूक गट सापडला',
  },
  'logistics.crop': {
    en: 'Crop',
    hi: 'फसल',
    mr: 'पीक',
  },
  'logistics.destination': {
    en: 'Destination',
    hi: 'गंतव्य स्थान',
    mr: 'गंतव्य ठिकाण',
  },
  'logistics.truckCapacity': {
    en: 'Truck capacity',
    hi: 'ट्रक की क्षमता',
    mr: 'ट्रकची क्षमता',
  },
  'logistics.pickupRoute': {
    en: 'Pickup route',
    hi: 'पिकअप मार्ग',
    mr: 'पिकअप मार्ग',
  },
  'logistics.finalDestination': {
    en: 'Final destination',
    hi: 'अंतिम गंतव्य',
    mr: 'अंतिम ठिकाण',
  },
  'logistics.soloCost': {
    en: 'Without pooling (solo)',
    hi: 'बिना साझा किए (अकेले)',
    mr: 'एकट्यासाठी (स्वतंत्र)',
  },
  'logistics.soloCostDesc': {
    en: 'Full truck cost borne by you alone',
    hi: 'पूरे ट्रक का खर्च अकेले आपको वहन करना होगा',
    mr: 'संपूर्ण ट्रकचा खर्च एकट्याला करावा लागेल',
  },
  'logistics.pooledCost': {
    en: 'With pooled logistics',
    hi: 'सामूहिक लॉजिस्टिक्स के साथ',
    mr: 'सामायिक लॉजिस्टिक्ससह',
  },
  'logistics.pooledCostDesc': {
    en: 'Shared across 3 farmers',
    hi: '3 किसानों के बीच साझा',
    mr: '3 शेतकऱ्यांमध्ये विभागलेला',
  },
  'logistics.estimatedSavings': {
    en: 'Your estimated savings',
    hi: 'आपकी अनुमानित बचत',
    mr: 'तुमची अंदाजे बचत',
  },
  'logistics.totalLoad': {
    en: 'Total pooled load',
    hi: 'कुल सामूहिक भार',
    mr: 'एकूण सामायिक वजन',
  },
  'logistics.howItWorks': {
    en: 'How pooled logistics works',
    hi: 'सामूहिक लॉजिस्टिक्स कैसे काम करता है',
    mr: 'सामायिक लॉजिस्टिक्स कसे कार्य करते',
  },
  'logistics.step1': {
    en: 'System finds farmers with the same crop, nearby location, similar destination and timing.',
    hi: 'प्रणाली समान फसल, नजदीकी स्थान, समान गंतव्य और समय वाले किसानों को ढूंढती है।',
    mr: 'प्रणाली समान पीक, जवळचे ठिकाण, समान गंतव्य आणि वेळेनुसार शेतकरी शोधते.',
  },
  'logistics.step2': {
    en: 'Farmers are grouped to fill a shared truck. Transport cost is divided proportionally by volume.',
    hi: 'किसानों को साझा ट्रक भरने के लिए समूहीकृत किया जाता है। परिवहन लागत मात्रा के अनुसार आनुपातिक रूप से विभाजित की जाती है।',
    mr: 'शेतकऱ्यांना सामायिक ट्रकसाठी एकत्र केले जाते. वाहतूक खर्च वजनानुसार विभागला जातो.',
  },
  'logistics.step3': {
    en: 'Each farmer pays only their share — lower cost per farmer, higher net realisation.',
    hi: 'प्रत्येक किसान केवल अपना हिस्सा चुकाता है — प्रति किसान कम लागत, अधिक शुद्ध प्राप्ति।',
    mr: 'प्रत्येक शेतकरी फक्त स्वतःचा हिस्सा देतो — कमी खर्च, जास्त नफा.',
  },
  'logistics.step4': {
    en: 'The buyer receives a consolidated delivery with individual lot tracking.',
    hi: 'खरीदार को व्यक्तिगत लॉट ट्रैकिंग के साथ एक समेकित डिलीवरी प्राप्त होती है।',
    mr: 'खरेदीदाराला स्वतंत्र लॉट ट्रॅकिंगसह एकत्रित डिलिव्हरी मिळते.',
  },
  'logistics.joinPool': {
    en: 'Join this logistics pool',
    hi: 'इस लॉजिस्टिक्स पूल में शामिल हों',
    mr: 'या सामायिक वाहतूक गटात सामील व्हा',
  },
  'logistics.joinedPool': {
    en: 'Joined this logistics pool',
    hi: 'लॉजिस्टिक्स पूल में शामिल हो गए',
    mr: 'सामायिक वाहतूक गटात सामील झाले',
  },
  'logistics.findOtherPools': {
    en: 'Find other pools',
    hi: 'अन्य पूल खोजें',
    mr: 'इतर वाहतूक गट शोधा',
  },

  // ── Crop Health Screen ────────────────────────────────────────────────────

  'cropHealth.title': {
    en: 'Crop Health',
    hi: 'फसल स्वास्थ्य',
    mr: 'पीक आरोग्य',
  },
  'cropHealth.diseaseDetection': {
    en: 'Disease detection',
    hi: 'रोग पहचान',
    mr: 'रोग निदान',
  },
  'cropHealth.result': {
    en: 'Early blight detected',
    hi: 'अगेती झुलसा (अर्ली ब्लाइट) पाया गया',
    mr: 'लवकर येणारा करपा रोग आढळला',
  },
  'cropHealth.resultDesc': {
    en: 'Leaf spots are consistent with early blight. Review your spray history before selling this crop.',
    hi: 'पत्तियों के धब्बे अगेती झुलसा के अनुकूल हैं। इस फसल को बेचने से पहले अपने छिड़काव के इतिहास की समीक्षा करें।',
    mr: 'पानावरील डाग करपा रोगासारखे आहेत. हे पीक विकण्यापूर्वी तुमच्या फवारणीच्या नोंदी तपासा.',
  },
  'cropHealth.pesticideUsed': {
    en: 'Pesticide Used',
    hi: 'उपयोग किया गया कीटनाशक',
    mr: 'वापरलेले कीटकनाशक',
  },
  'cropHealth.selectPesticide': {
    en: 'Select pesticide',
    hi: 'कीटनाशक चुनें',
    mr: 'कीटकनाशक निवडा',
  },
  'cropHealth.lastSprayDate': {
    en: 'Last Spray Date',
    hi: 'अंतिम छिड़काव की तारीख',
    mr: 'शेवटची फवारणी तारीख',
  },
  'cropHealth.safeToSell': {
    en: 'Safe to sell',
    hi: 'बेचने के लिए सुरक्षित',
    mr: 'विक्रीसाठी सुरक्षित',
  },
  'cropHealth.cannotVerify': {
    en: 'Cannot verify',
    hi: 'सत्यापित नहीं किया जा सकता',
    mr: 'पडताळणी करता येत नाही',
  },
  'cropHealth.farmerDeclared': {
    en: 'Farmer-declared — not lab verified',
    hi: 'किसान द्वारा घोषित — प्रयोगशाला सत्यापित नहीं',
    mr: 'शेतकऱ्याने घोषित केलेले — प्रयोगशाळा सत्यापित नाही',
  },

  // ── Authentication & Login ────────────────────────────────────────────────

  'auth.farmerPortal': {
    en: 'FARMER PORTAL',
    hi: 'किसान पोर्टल',
    mr: 'शेतकरी पोर्टल',
  },
  'auth.buyerPortal': {
    en: 'BUYER PORTAL',
    hi: 'खरीदार पोर्टल',
    mr: 'खरेदीदार पोर्टल',
  },
  'auth.farmerLogin': {
    en: 'Farmer Login',
    hi: 'किसान लॉगिन',
    mr: 'शेतकरी लॉगिन',
  },
  'auth.farmerSignUp': {
    en: 'Farmer Sign Up',
    hi: 'किसान साइन अप',
    mr: 'शेतकरी साइन अप',
  },
  'auth.buyerLogin': {
    en: 'Buyer Login',
    hi: 'खरीदार लॉगिन',
    mr: 'खरेदीदार लॉगिन',
  },
  'auth.buyerSignUp': {
    en: 'Buyer Sign Up',
    hi: 'खरीदार साइन अप',
    mr: 'खरेदीदार साइन अप',
  },
  'auth.login': {
    en: 'Login',
    hi: 'लॉगिन',
    mr: 'लॉगिन',
  },
  'auth.signUp': {
    en: 'Sign Up',
    hi: 'साइन अप',
    mr: 'साइन अप',
  },
  'auth.loggingIn': {
    en: 'Logging in…',
    hi: 'लॉगिन हो रहा है…',
    mr: 'लॉगिन होत आहे…',
  },
  'auth.signingUp': {
    en: 'Signing up…',
    hi: 'साइन अप हो रहा है…',
    mr: 'साइन अप होत आहे…',
  },
  'auth.farmerId': {
    en: 'Farmer ID',
    hi: 'किसान आईडी',
    mr: 'शेतकरी आयडी',
  },
  'auth.farmerIdPlaceholder': {
    en: 'Enter Farmer ID (e.g. MH-PUN-001)',
    hi: 'किसान आईडी दर्ज करें (उदा. MH-PUN-001)',
    mr: 'शेतकरी आयडी प्रविष्ट करा (उदा. MH-PUN-001)',
  },
  'auth.buyerEmail': {
    en: 'Buyer Email',
    hi: 'खरीदार ईमेल',
    mr: 'खरेदीदार ईमेल',
  },
  'auth.buyerEmailPlaceholder': {
    en: 'Enter business email (e.g. buyer@agro.com)',
    hi: 'व्यावसायिक ईमेल दर्ज करें (उदा. buyer@agro.com)',
    mr: 'व्यावसायिक ईमेल प्रविष्ट करा (उदा. buyer@agro.com)',
  },
  'auth.password': {
    en: 'Password',
    hi: 'पासवर्ड',
    mr: 'पासवर्ड',
  },
  'auth.passwordPlaceholder': {
    en: 'Enter password',
    hi: 'पासवर्ड दर्ज करें',
    mr: 'पासवर्ड प्रविष्ट करा',
  },
  'auth.backToHome': {
    en: 'Back to Home',
    hi: 'मुख्य पृष्ठ पर वापस',
    mr: 'मुख्य पानावर परत',
  },
  'auth.dataProtected': {
    en: 'Your farm data is protected with secure encryption.',
    hi: 'आपका कृषि डेटा सुरक्षित एन्क्रिप्शन से सुरक्षित है।',
    mr: 'तुमचा शेती डेटा सुरक्षित एनक्रिप्शनने संरक्षित आहे.',
  },
  'auth.credentialsSecure': {
    en: 'Credentials verified securely via Supabase Auth.',
    hi: 'Supabase Auth के माध्यम से क्रेडेंशियल सुरक्षित रूप से सत्यापित।',
    mr: 'Supabase Auth द्वारे सुरक्षित पडताळणी केली जाते.',
  },
  'auth.buyerProtected': {
    en: 'Verified buyer portal with end-to-end encryption.',
    hi: 'एंड-टू-एंड एन्क्रिप्शन के साथ सत्यापित खरीदार पोर्टल।',
    mr: 'एंड-टू-एंड एनक्रिप्शनसह सत्यापित खरेदीदार पोर्टल.',
  },
  'login.networkBadge': {
    en: "India's connected farm network",
    hi: 'भारत का जुड़ा हुआ कृषि नेटवर्क',
    mr: 'भारताचे जोडलेले शेती नेटवर्क',
  },
  'login.heroTitle1': {
    en: 'Every stage, every problem —',
    hi: 'हर चरण, हर समस्या —',
    mr: 'प्रत्येक टप्पा, प्रत्येक समस्या —',
  },
  'login.heroTitle2': {
    en: 'one solution.',
    hi: 'एक समाधान।',
    mr: 'एकच समाधान.',
  },
  'login.heroSubtitle': {
    en: "Connect your farm's complete life cycle from seed to soil. Sell better, plan smarter, and grow with a trusted local network.",
    hi: 'बीज से मिट्टी तक अपने खेत का पूरा जीवनचक्र जोड़ें। बेहतर बेचें, समझदारी से योजना बनाएं और भरोसेमंद स्थानीय नेटवर्क के साथ बढ़ें।',
    mr: 'बियाण्यापासून मातीपर्यंत तुमच्या शेतीचे संपूर्ण जीवनचक्र जोडा. चांगले विक्री करा, योग्य नियोजन करा आणि विश्वासू स्थानिक नेटवर्कसोबत वाढा.',
  },
  'login.loginAs': {
    en: 'Login As :',
    hi: 'इस रूप में लॉगिन करें :',
    mr: 'या नात्याने लॉगिन करा :',
  },
  'login.farmer': {
    en: 'Farmer',
    hi: 'किसान',
    mr: 'शेतकरी',
  },
  'login.buyer': {
    en: 'Buyer',
    hi: 'खरीदार',
    mr: 'खरेदीदार',
  },
  'login.detailsStay': {
    en: 'Your details stay on this device',
    hi: 'आपकी जानकारी इसी डिवाइस पर रहती है',
    mr: 'तुमची माहिती या डिव्हाइसवरच राहते',
  },
  'login.lifecycleOrchestrated': {
    en: 'The agricultural lifecycle, orchestrated',
    hi: 'कृषि जीवनचक्र, एक सुव्यवस्थित रूप में',
    mr: 'कृषी जीवनचक्र, एकाच ठिकाणी सुव्यवस्थित',
  },
  'login.stage.prePlanting': {
    en: 'Pre-Planting',
    hi: 'बुवाई से पहले',
    mr: 'लागवडीपूर्वी',
  },
  'login.stage.prePlantingHelp': {
    en: 'What should I grow?',
    hi: 'मुझे क्या उगाना चाहिए?',
    mr: 'मी काय पिकवले पाहिजे?',
  },
  'login.stage.inSeason': {
    en: 'In-Season',
    hi: 'मौसम में',
    mr: 'हंगामात',
  },
  'login.stage.inSeasonHelp': {
    en: 'How do I manage my crop?',
    hi: 'मैं अपनी फसल का प्रबंधन कैसे करूँ?',
    mr: 'मी माझ्या पिकाचे व्यवस्थापन कसे करू?',
  },
  'login.stage.resources': {
    en: 'Resources',
    hi: 'संसाधन',
    mr: 'संसाधने',
  },
  'login.stage.resourcesHelp': {
    en: 'What do I need?',
    hi: 'मुझे क्या चाहिए?',
    mr: 'मला काय हवे आहे?',
  },
  'login.stage.postHarvest': {
    en: 'Post-Harvest',
    hi: 'फसल कटाई उपरांत',
    mr: 'काढणीनंतर',
  },
  'login.stage.postHarvestHelp': {
    en: 'How do I maximise earnings?',
    hi: 'मैं अपनी कमाई कैसे अधिकतम करूँ?',
    mr: 'मी माझी कमाई कशी वाढवू?',
  },
  'login.stage.market': {
    en: 'Market',
    hi: 'बाजार',
    mr: 'बाजार',
  },
  'login.stage.marketHelp': {
    en: 'Net realisation & logistics',
    hi: 'शुद्ध प्राप्ति और लॉजिस्टिक्स',
    mr: 'निव्वळ नफा आणि वाहतूक',
  },

  // ── Mandi Live Trends & Prices UI ──────────────────────────────────────────

  'mandi.commodity': {
    en: 'Commodity',
    hi: 'फसल / जींस',
    mr: 'पीक / शेतमाल',
  },
  'mandi.market': {
    en: 'Market (Mandi)',
    hi: 'मंडी / बाजार',
    mr: 'बाजार समिती',
  },
  'mandi.minPrice': {
    en: 'Min Price',
    hi: 'न्यूनतम भाव',
    mr: 'किमान भाव',
  },
  'mandi.maxPrice': {
    en: 'Max Price',
    hi: 'अधिकतम भाव',
    mr: 'कमाल भाव',
  },
  'mandi.modalPrice': {
    en: 'Modal Price',
    hi: 'मॉडल भाव',
    mr: 'सर्वसाधारण भाव',
  },
  'mandi.all': {
    en: 'All Crops',
    hi: 'सभी फसलें',
    mr: 'सर्व पिके',
  },
  'mandi.filterByCrop': {
    en: 'Filter by Commodity:',
    hi: 'फसल के अनुसार छाँटें:',
    mr: 'पिकानुसार निवडा:',
  },
  'mandi.liveArrivals': {
    en: 'Live Agmarknet Mandi Prices',
    hi: 'लाइव एगमार्कनेट मंडी भाव',
    mr: 'थेट अ‍ॅगमार्कनेट बाजार भाव',
  },
  'mandi.showingDistrict': {
    en: 'District Mandis:',
    hi: 'जिले की मंडियां:',
    mr: 'जिल्हा बाजार समित्या:',
  },
  'mandi.perQuintal': {
    en: '₹/Quintal',
    hi: '₹/क्विंटल',
    mr: '₹/क्विंटल',
  },
  'mandi.noData': {
    en: 'No Mandi records found for the selected commodity.',
    hi: 'चयनित फसल के लिए कोई मंडी रिकॉर्ड नहीं मिला।',
    mr: 'निवडलेल्या पिकासाठी कोणताही बाजार भाव आढळला नाही.',
  },

  // ── Commodities Dictionary Namespace ───────────────────────────────────────

  'commodities.onion': {
    en: 'Onion',
    hi: 'प्याज',
    mr: 'कांदा',
  },
  'commodities.wheat': {
    en: 'Wheat',
    hi: 'गेहूँ',
    mr: 'गहू',
  },
  'commodities.basmatiRice': {
    en: 'Basmati Rice',
    hi: 'बासमती चावल',
    mr: 'बासमती तांदूळ',
  },
  'commodities.rice': {
    en: 'Rice',
    hi: 'चावल',
    mr: 'तांदूळ',
  },
  'commodities.paddy': {
    en: 'Paddy',
    hi: 'धान',
    mr: 'भात',
  },
  'commodities.tomato': {
    en: 'Tomato',
    hi: 'टमाटर',
    mr: 'टोमॅटो',
  },
  'commodities.potato': {
    en: 'Potato',
    hi: 'आलू',
    mr: 'बटाटा',
  },
  'commodities.soyabean': {
    en: 'Soybean',
    hi: 'सोयाबीन',
    mr: 'सोयाबीन',
  },
  'commodities.soybean': {
    en: 'Soybean',
    hi: 'सोयाबीन',
    mr: 'सोयाबीन',
  },
  'commodities.cotton': {
    en: 'Cotton',
    hi: 'कपास',
    mr: 'कापूस',
  },
  'commodities.turDal': {
    en: 'Tur Dal',
    hi: 'तूर दाल',
    mr: 'तूर डाळ',
  },
  'commodities.arhar': {
    en: 'Arhar',
    hi: 'अरहर',
    mr: 'तूर',
  },
  'commodities.redGram': {
    en: 'Red Gram',
    hi: 'अरहर',
    mr: 'तूर',
  },
  'commodities.gram': {
    en: 'Gram (Chana)',
    hi: 'चना',
    mr: 'हरभरा',
  },
  'commodities.chana': {
    en: 'Gram (Chana)',
    hi: 'चना',
    mr: 'हरभरा',
  },
  'commodities.bengalGram': {
    en: 'Bengal Gram',
    hi: 'चना',
    mr: 'हरभरा',
  },
  'commodities.moong': {
    en: 'Green Gram (Moong)',
    hi: 'मूंग',
    mr: 'मूग',
  },
  'commodities.greenGram': {
    en: 'Green Gram (Moong)',
    hi: 'मूंग',
    mr: 'मूग',
  },
  'commodities.greenGramMoong': {
    en: 'Green Gram (Moong)',
    hi: 'मूंग',
    mr: 'मूग',
  },
  'commodities.urad': {
    en: 'Black Gram (Urad)',
    hi: 'उड़द',
    mr: 'उडीद',
  },
  'commodities.blackGram': {
    en: 'Black Gram (Urad)',
    hi: 'उड़द',
    mr: 'उडीद',
  },
  'commodities.garlic': {
    en: 'Garlic',
    hi: 'लहसुन',
    mr: 'लसूण',
  },
  'commodities.ginger': {
    en: 'Ginger',
    hi: 'अदरक',
    mr: 'आले',
  },
  'commodities.grapes': {
    en: 'Grapes',
    hi: 'अंगूर',
    mr: 'द्राक्षे',
  },
  'commodities.pomegranate': {
    en: 'Pomegranate',
    hi: 'अनार',
    mr: 'डाळिंब',
  },
  'commodities.maize': {
    en: 'Maize',
    hi: 'मक्का',
    mr: 'मका',
  },
  'commodities.corn': {
    en: 'Corn',
    hi: 'मक्का',
    mr: 'मका',
  },
  'commodities.bajra': {
    en: 'Pearl Millet (Bajra)',
    hi: 'बाजरा',
    mr: 'बाजरी',
  },
  'commodities.jowar': {
    en: 'Sorghum (Jowar)',
    hi: 'ज्वार',
    mr: 'ज्वारी',
  },
  'commodities.banana': {
    en: 'Banana',
    hi: 'केला',
    mr: 'केळी',
  },
  'commodities.mango': {
    en: 'Mango',
    hi: 'आम',
    mr: 'आंबा',
  },
  'commodities.sugarcane': {
    en: 'Sugarcane',
    hi: 'गन्ना',
    mr: 'ऊस',
  },
  'commodities.mustard': {
    en: 'Mustard',
    hi: 'सरसों',
    mr: 'मोहरी',
  },
  'commodities.groundnut': {
    en: 'Groundnut',
    hi: 'मूंगफली',
    mr: 'भुईमूग',
  },
  'commodities.peanut': {
    en: 'Peanut',
    hi: 'मूंगफली',
    mr: 'शेंगदाणे',
  },
  'commodities.chilli': {
    en: 'Green Chilli',
    hi: 'हरी मिर्च',
    mr: 'हिरवी मिरची',
  },
  'commodities.greenChilli': {
    en: 'Green Chilli',
    hi: 'हरी मिर्च',
    mr: 'हिरवी मिरची',
  },
  'commodities.redChilli': {
    en: 'Red Chilli',
    hi: 'लाल मिर्च',
    mr: 'लाल मिरची',
  },
  'commodities.cauliflower': {
    en: 'Cauliflower',
    hi: 'फूलगोभी',
    mr: 'फ्लॉवर',
  },
  'commodities.cabbage': {
    en: 'Cabbage',
    hi: 'पत्तागोभी',
    mr: 'कोबी',
  },
  'commodities.brinjal': {
    en: 'Brinjal',
    hi: 'बैंगन',
    mr: 'वांगी',
  },
  'commodities.eggplant': {
    en: 'Eggplant',
    hi: 'बैंगन',
    mr: 'वांगी',
  },
  'commodities.coriander': {
    en: 'Coriander',
    hi: 'धनिया',
    mr: 'कोथिंबीर',
  },
  'commodities.fenugreek': {
    en: 'Fenugreek',
    hi: 'मेथी',
    mr: 'मेथी',
  },
  'commodities.cucumber': {
    en: 'Cucumber',
    hi: 'खीरा',
    mr: 'काकडी',
  },
  'commodities.apple': {
    en: 'Apple',
    hi: 'सेब',
    mr: 'सफरचंद',
  },
  'commodities.orange': {
    en: 'Orange',
    hi: 'संतरा',
    mr: 'संत्री',
  },
  'commodities.lemon': {
    en: 'Lemon',
    hi: 'नींबू',
    mr: 'लिंबू',
  },
  'commodities.turmeric': {
    en: 'Turmeric',
    hi: 'हल्दी',
    mr: 'हळद',
  },
  'commodities.cumin': {
    en: 'Cumin',
    hi: 'जीरा',
    mr: 'जिरे',
  },
  'commodities.sesamum': {
    en: 'Sesamum (Til)',
    hi: 'तिल',
    mr: 'तीळ',
  },
  'commodities.peas': {
    en: 'Green Peas',
    hi: 'मटर',
    mr: 'मटार',
  },
  'commodities.greenPeas': {
    en: 'Green Peas',
    hi: 'हरी मटर',
    mr: 'ओला मटार',
  },
  'mandi.fallbackWarning': {
    en: 'Live government API is currently unreachable. Displaying cached demo records for Nashik.',
    hi: 'सरकारी लाइव एपीआई वर्तमान में अनुपलब्ध है। नासिक के लिए कैश्ड डेमो रिकॉर्ड दिखाए जा रहे हैं।',
    mr: 'थेट शासकीय एपीआय सध्या अनुपलब्ध आहे. नाशिकसाठी कॅश केलेले डेमो रेकॉर्ड दर्शवित आहे.',
  },
  'mandi.fallbackBadge': {
    en: 'Cached Demo Data',
    hi: 'कैश्ड डेमो डेटा',
    mr: 'कॅश केलेला डेमो डेटा',
  },
}


// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Normalizes an incoming commodity string from the API (lowercase, replace spaces with camelCase).
 * Examples:
 *   "Onion" -> "onion"
 *   "Wheat" -> "wheat"
 *   "Basmati Rice" -> "basmatiRice"
 *   "Green Gram (Moong)" -> "greenGramMoong"
 */
export function normalizeCommodityKey(name: string): string {
  if (!name) return ''
  const cleaned = name.trim().replace(/[^a-zA-Z0-9\s]/g, ' ')
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 0) return name.toLowerCase()
  return words[0].toLowerCase() + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
}

/**
 * Retrieve a translated string.
 * Falls back to English if the key is missing for the given language.
 * Falls back to the provided fallback string (or the raw key string) if the key doesn't exist at all.
 */
export function t(key: string, language: Language, fallback?: string): string {
  const entry = translations[key]
  if (!entry) {
    return fallback ?? key
  }
  return entry[language] ?? entry['en'] ?? fallback ?? key
}
