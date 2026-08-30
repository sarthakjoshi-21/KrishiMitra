'use client'

import { useEffect } from 'react'
import { useLanguage } from './language-context'

const translations = {
  hi: {
    Overview: 'अवलोकन', 'My Listings': 'मेरी लिस्टिंग', 'Active Bidding': 'सक्रिय बोली', 'My Progress': 'मेरी प्रगति', 'P2P Logistics': 'पी2पी लॉजिस्टिक्स', 'Plan & Grow': 'योजना और विकास', 'Digital Desk': 'डिजिटल डेस्क', 'Farmer desk': 'किसान डेस्क', 'Online & synced': 'ऑनलाइन और सिंक', 'Need help?': 'मदद चाहिए?', 'Open advisor': 'सलाहकार खोलें', 'Tuesday, 28 August 2026': 'मंगलवार, 28 अगस्त 2026', 'Good morning, Ramesh.': 'सुप्रभात, रमेश।', 'Your farm at a glance': 'आपके खेत की एक झलक', 'Total value': 'कुल मूल्य', 'This season': 'इस सीज़न', 'Active listings': 'सक्रिय लिस्टिंग', 'Currently live': 'अभी लाइव', 'Total sold': 'कुल बिक्री', 'Across 3 crops': '3 फसलों में', 'Next payout': 'अगला भुगतान', 'Due in 2 days': '2 दिनों में देय', 'Quick actions': 'त्वरित कार्य', 'List a crop': 'फसल सूचीबद्ध करें', 'Upload crop details and go live.': 'फसल की जानकारी अपलोड करें और लाइव करें।', 'Find buyers': 'खरीदार खोजें', 'Browse verified demand near you.': 'अपने पास सत्यापित मांग देखें।', 'Plan next season': 'अगले सीज़न की योजना', 'Get recommendations for soil and crop.': 'मिट्टी और फसल के सुझाव पाएं।', 'Recent activity': 'हाल की गतिविधि', 'Market insights': 'बाज़ार जानकारी', 'Today in your region': 'आज आपके क्षेत्र में', 'Market pulse': 'बाज़ार स्थिति', 'Highest bid': 'सबसे ऊंची बोली', Safe: 'सुरक्षित', 'Make an offer': 'ऑफर दें', 'Buyer marketplace': 'खरीदार बाज़ार', 'Source with confidence.': 'विश्वास के साथ खरीदें।', 'Verified crop lots, transparent bids, direct farmer relationships.': 'सत्यापित फसल, पारदर्शी बोलियां और सीधे किसान संबंध।', 'Available lots': 'उपलब्ध लॉट', 'Across 7 regions': '7 क्षेत्रों में', 'Verified-safe lots': 'सत्यापित सुरक्षित लॉट', 'Lab declarations visible': 'लैब घोषणाएं उपलब्ध', 'Market movement': 'बाज़ार बदलाव', 'Basmati this week': 'इस सप्ताह बासमती', 'Buy product & place bids': 'उत्पाद खरीदें और बोली लगाएं', 'Find crop lots': 'फसल लॉट खोजें', Logout: 'लॉगआउट', 'Service Provider / Admin access': 'सेवा प्रदाता / एडमिन एक्सेस', 'Frontend demo only. No credentials are sent or stored.': 'यह केवल फ्रंटएंड डेमो है। जानकारी भेजी या संग्रहीत नहीं होती।'
  },
  mr: {
    Overview: 'आढावा', 'My Listings': 'माझ्या नोंदी', 'Active Bidding': 'सक्रिय बोली', 'My Progress': 'माझी प्रगती', 'P2P Logistics': 'पी2पी लॉजिस्टिक्स', 'Plan & Grow': 'नियोजन आणि वाढ', 'Digital Desk': 'डिजिटल डेस्क', 'Farmer desk': 'शेतकरी डेस्क', 'Online & synced': 'ऑनलाइन आणि सिंक', 'Need help?': 'मदत हवी आहे?', 'Open advisor': 'सल्लागार उघडा', 'Good morning, Ramesh.': 'शुभ सकाळ, रमेश.', 'Your farm at a glance': 'तुमच्या शेतीचा आढावा', 'Total value': 'एकूण मूल्य', 'This season': 'या हंगामात', 'Active listings': 'सक्रिय नोंदी', 'Currently live': 'सध्या लाइव्ह', 'Total sold': 'एकूण विक्री', 'Across 3 crops': '3 पिकांमध्ये', 'Next payout': 'पुढील देयक', 'Due in 2 days': '2 दिवसांत देय', 'Quick actions': 'जलद कृती', 'List a crop': 'पीक नोंदवा', 'Find buyers': 'खरेदीदार शोधा', 'Plan next season': 'पुढील हंगामाचे नियोजन', 'Recent activity': 'अलीकडील क्रिया', 'Market insights': 'बाजार माहिती', 'Today in your region': 'आज तुमच्या भागात', 'Market pulse': 'बाजार स्थिती', 'Highest bid': 'सर्वोच्च बोली', Safe: 'सुरक्षित', 'Make an offer': 'ऑफर द्या', 'Buyer marketplace': 'खरेदीदार बाजार', 'Source with confidence.': 'विश्वासाने खरेदी करा.', 'Available lots': 'उपलब्ध लॉट', 'Verified-safe lots': 'सत्यापित सुरक्षित लॉट', 'Market movement': 'बाजारातील बदल', 'Buy product & place bids': 'उत्पादन खरेदी करा आणि बोली लावा', 'Find crop lots': 'पीक लॉट शोधा', Logout: 'लॉगआउट'
  }
} as const

const supplementalTranslations: Record<string, Record<'hi' | 'mr', string>> = {
  "India's connected farm network": { hi: 'भारत का जुड़ा हुआ कृषि नेटवर्क', mr: 'भारताचे जोडलेले शेती नेटवर्क' },
  "Every stage, every problem —": { hi: 'हर चरण, हर समस्या —', mr: 'प्रत्येक टप्पा, प्रत्येक समस्या —' },
  'one solution.': { hi: 'एक समाधान।', mr: 'एकच समाधान.' },
  "Connect your farm's complete life cycle from seed to soil. Sell better, plan smarter, and grow with a trusted local network.": { hi: 'बीज से मिट्टी तक अपने खेत का पूरा जीवनचक्र जोड़ें। बेहतर बेचें, समझदारी से योजना बनाएं और भरोसेमंद स्थानीय नेटवर्क के साथ बढ़ें।', mr: 'बियाण्यापासून मातीपर्यंत तुमच्या शेतीचे संपूर्ण जीवनचक्र जोडा. चांगले विक्री करा, योग्य नियोजन करा आणि विश्वासू स्थानिक नेटवर्कसोबत वाढा.' },
  'Login as Farmer': { hi: 'किसान के रूप में लॉगिन करें', mr: 'शेतकरी म्हणून लॉगिन करा' },
  'Login as Buyer': { hi: 'खरीदार के रूप में लॉगिन करें', mr: 'खरेदीदार म्हणून लॉगिन करा' },
  'Service Provider / Admin access': { hi: 'सेवा प्रदाता / एडमिन एक्सेस', mr: 'सेवा प्रदाता / अॅडमिन प्रवेश' },
  'Farmer name': { hi: 'किसान का नाम', mr: 'शेतकऱ्याचे नाव' },
  'Farmer ID': { hi: 'किसान आईडी', mr: 'शेतकरी आयडी' },
  'Mobile number': { hi: 'मोबाइल नंबर', mr: 'मोबाइल नंबर' },
  Password: { hi: 'पासवर्ड', mr: 'पासवर्ड' },
  Continue: { hi: 'जारी रखें', mr: 'पुढे जा' },
  'Make an offer': { hi: 'ऑफर दें', mr: 'ऑफर द्या' },
  'Buy product & place bids': { hi: 'उत्पाद खरीदें और बोली लगाएं', mr: 'उत्पादन खरेदी करा आणि बोली लावा' },
  'Logout': { hi: 'लॉगआउट', mr: 'लॉगआउट' },
  'Today in your region': { hi: 'आज आपके क्षेत्र में', mr: 'आज तुमच्या भागात' },
  'Market pulse': { hi: 'बाज़ार स्थिति', mr: 'बाजार स्थिती' },
  'Online & synced': { hi: 'ऑनलाइन और सिंक', mr: 'ऑनलाइन आणि सिंक' },
  'Farmer desk': { hi: 'किसान डेस्क', mr: 'शेतकरी डेस्क' },
  'Need help?': { hi: 'मदद चाहिए?', mr: 'मदत हवी आहे?' },
  'Talk to your Krishi Saathi in your language.': { hi: 'अपनी भाषा में अपने कृषि साथी से बात करें।', mr: 'तुमच्या भाषेत कृषी साथीशी बोला.' },
  'Open advisor': { hi: 'सलाहकार खोलें', mr: 'सल्लागार उघडा' },
  'Good morning, Ramesh.': { hi: 'सुप्रभात, रमेश।', mr: 'शुभ सकाळ, रमेश.' },
  'Your farm at a glance': { hi: 'आपके खेत की एक झलक', mr: 'तुमच्या शेतीचा आढावा' },
  'Total value': { hi: 'कुल मूल्य', mr: 'एकूण मूल्य' },
  'This season': { hi: 'इस सीज़न', mr: 'या हंगामात' },
  'Active listings': { hi: 'सक्रिय लिस्टिंग', mr: 'सक्रिय नोंदी' },
  'Currently live': { hi: 'अभी लाइव', mr: 'सध्या लाइव्ह' },
  'Total sold': { hi: 'कुल बिक्री', mr: 'एकूण विक्री' },
  'Across 3 crops': { hi: '3 फसलों में', mr: '3 पिकांमध्ये' },
  'Next payout': { hi: 'अगला भुगतान', mr: 'पुढील देयक' },
  'Due in 2 days': { hi: '2 दिनों में देय', mr: '2 दिवसांत देय' },
  'Quick actions': { hi: 'त्वरित कार्य', mr: 'जलद कृती' },
  'List a crop': { hi: 'फसल सूचीबद्ध करें', mr: 'पीक नोंदवा' },
  'Upload crop details and go live.': { hi: 'फसल की जानकारी अपलोड करें और लाइव करें।', mr: 'पिकाची माहिती अपलोड करा आणि लाइव्ह करा.' },
  'Find buyers': { hi: 'खरीदार खोजें', mr: 'खरेदीदार शोधा' },
  'Browse verified demand near you.': { hi: 'अपने पास सत्यापित मांग देखें।', mr: 'तुमच्या जवळील सत्यापित मागणी पहा.' },
  'Plan next season': { hi: 'अगले सीज़न की योजना', mr: 'पुढील हंगामाचे नियोजन' },
  'Get recommendations for soil and crop.': { hi: 'मिट्टी और फसल के सुझाव पाएं।', mr: 'माती आणि पिकासाठी शिफारसी मिळवा.' },
  'Recent activity': { hi: 'हाल की गतिविधि', mr: 'अलीकडील क्रिया' },
  'Market insights': { hi: 'बाज़ार जानकारी', mr: 'बाजार माहिती' },
  'Source with confidence.': { hi: 'विश्वास के साथ खरीदें।', mr: 'विश्वासाने खरेदी करा.' },
  'Verified crop lots, transparent bids, direct farmer relationships.': { hi: 'सत्यापित फसल, पारदर्शी बोलियां और सीधे किसान संबंध।', mr: 'सत्यापित पिके, पारदर्शक बोली आणि थेट शेतकरी संबंध.' },
  'Available lots': { hi: 'उपलब्ध लॉट', mr: 'उपलब्ध लॉट' },
  'Across 7 regions': { hi: '7 क्षेत्रों में', mr: '7 प्रदेशांमध्ये' },
  'Verified-safe lots': { hi: 'सत्यापित सुरक्षित लॉट', mr: 'सत्यापित सुरक्षित लॉट' },
  'Lab declarations visible': { hi: 'लैब घोषणाएं उपलब्ध', mr: 'लॅब घोषणा उपलब्ध' },
  'Market movement': { hi: 'बाज़ार बदलाव', mr: 'बाजारातील बदल' },
  'Basmati this week': { hi: 'इस सप्ताह बासमती', mr: 'या आठवड्यात बासमती' },

  'Find crop lots': { hi: 'फसल लॉट खोजें', mr: 'पीक लॉट शोधा' },
  'Highest bid': { hi: 'सबसे ऊंची बोली', mr: 'सर्वोच्च बोली' },
  'Safe': { hi: 'सुरक्षित', mr: 'सुरक्षित' },
  'Crop health check': { hi: 'फसल स्वास्थ्य जांच', mr: 'पीक आरोग्य तपासणी' },

  'Back to Overview': { hi: 'ओवरव्यू पर वापस जाएं', mr: 'आढाव्यावर परत जा' },
  'Manage crops you have published for verified buyers.': { hi: 'सत्यापित खरीदारों के लिए प्रकाशित फसलों का प्रबंधन करें।', mr: 'सत्यापित खरेदीदारांसाठी प्रकाशित केलेल्या पिकांचे व्यवस्थापन करा.' },
  'Track offers and respond to buyer demand in real time.': { hi: 'ऑफर ट्रैक करें और खरीदार की मांग का तुरंत जवाब दें।', mr: 'ऑफरचा मागोवा घ्या आणि खरेदीदारांच्या मागणीला तत्काळ प्रतिसाद द्या.' },
  'See your seasonal milestones and farm health indicators.': { hi: 'अपने मौसमी लक्ष्यों और खेत के स्वास्थ्य संकेतक देखें।', mr: 'तुमचे हंगामी टप्पे आणि शेतीच्या आरोग्याचे संकेतक पहा.' },
  'Coordinate pickup, transport, and delivery with trusted partners.': { hi: 'विश्वसनीय भागीदारों के साथ पिकअप, परिवहन और डिलीवरी का समन्वय करें।', mr: 'विश्वासू भागीदारांसोबत पिकअप, वाहतूक आणि वितरणाचे समन्वय करा.' },
  'Plan your next season with practical crop recommendations.': { hi: 'व्यावहारिक फसल सुझावों के साथ ���गले सीज़न की योजना बनाएं।', mr: 'व्यावहारिक पीक शिफारसींसह पुढील हंगामाचे नियोजन करा.' },
  'Get guidance, documents, and digital farming assistance.': { hi: 'मार्गदर्शन, दस्तावेज़ और डिजिटल खेती सहायता प्राप्त करें।', mr: 'मार्गदर्शन, कागदपत्रे आणि डिजिटल शेती सहाय्य मिळवा.' },
  'Save update locally': { hi: 'अपडेट स्थानीय रूप से सेव करें', mr: 'अपडेट स्थानिक पातळीवर जतन करा' },
  'Saved locally': { hi: 'स्थानीय रूप से सेव किया गया', mr: 'स्थानिक पातळीवर जतन केले' },
  Farmer: { hi: 'किसान', mr: 'शेतकरी' },
  Buyer: { hi: 'खरीदार', mr: 'खरेदीदार' },
  'Welcome to Krishi Mitra': { hi: 'कृषि-मित्र में आपका स्वागत है', mr: 'कृषी-मित्रमध्ये स्वागत आहे' },
  'Choose your role to continue with a secure demo login.': { hi: 'सुरक्षित डेमो लॉगिन के लिए अपनी भूमिका चुनें।', mr: 'सुरक्षित डेमो लॉगिनसाठी तुमची भूमिका निवडा.' },
  'Your details stay on this device': { hi: 'आपकी जानकारी इसी डिवाइस पर रहती है', mr: 'तुमची माहिती या डिव्हाइसवरच राहते' },
  'Choose language': { hi: 'भाषा चुनें', mr: 'भाषा निवडा' },
  'Back to role selection': { hi: 'भूमिका चयन पर वापस जाएं', mr: 'भूमिका निवडीवर परत जा' },
  '10-digit mobile number': { hi: '10 अंकों का मोबाइल नंबर', mr: '10 अंकी मोबाइल नंबर' },
  'Enter password': { hi: 'पासवर्ड दर्ज करें', mr: 'पासवर्ड टाका' },
  'Continue with Gmail': { hi: 'Gmail के साथ जारी रखें', mr: 'Gmail सह पुढे जा' },
  'Frontend demo only. No credentials are sent or stored.': { hi: 'यह केवल फ्रंटएंड डेमो है। जानकारी भेजी या संग्रहीत नहीं होती।', mr: 'हा फक्त फ्रंटएंड डेमो आहे. माहिती पाठवली किंवा जतन केली जात नाही.' },
  'Full Name': { hi: 'पूरा नाम', mr: 'पूर्ण नाव' },
  'e.g. Ramesh Patil': { hi: 'उदा. रमेश पाटिल', mr: 'उदा. रमेश पाटील' },
  'Already have an account?': { hi: 'क्या आपके पास पहले से खाता है?', mr: 'तुमचे आधीच खाते आहे का?' },
  'Log in': { hi: 'लॉग इन करें', mr: 'लॉग इन करा' },
  'Creating account…': { hi: 'खाता बनाया जा रहा है…', mr: 'खाते तयार होत आहे…' },
  'Create your account': { hi: 'अपना खाता बनाएं', mr: 'तुमचे खाते तयार करा' },
  'Create account': { hi: 'खाता बनाएं', mr: 'खाते तयार करा' },
  'Dashboard': { hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड' },
  'Market & Bids': { hi: 'बाज़ार और बोलियां', mr: 'बाजार आणि बोली' },
  'Kisan Sathi': { hi: 'किसान साथी', mr: 'कृषी साथी' },
  'Publish to marketplace': { hi: 'बाज़ार में प्रकाशित करें', mr: 'बाजारपेठेत प्रकाशित करा' },
  'Logistics': { hi: 'लॉजिस्टिक्स', mr: 'लॉजिस्टिक्स' },
  'Weather': { hi: 'मौसम', mr: 'हवामान' },
  'My Crop': { hi: 'मेरी फसल', mr: 'माझे पीक' },
  'Irrigation': { hi: 'सिंचाई', mr: 'सिंचन' },
  'Community': { hi: 'समुदाय', mr: 'समुदाय' },
  'Resources': { hi: 'संसाधन', mr: 'संसाधने' },
  'Premium Basmati Rice': { hi: 'प्रीमियम बासमती चावल', mr: 'प्रीमियम बासमती तांदूळ' },
  'Ramesh Patil': { hi: 'रमेश पाटिल', mr: 'रमेश पाटील' },
  'Nashik, Maharashtra': { hi: 'नासिक, महाराष्ट्र', mr: 'नाशिक, महाराष्ट्र' },
  'Organic Tur Dal': { hi: 'जैविक तुअर दाल', mr: 'सेंद्रिय तूर डाळ' },
  'Savitri Devi': { hi: 'सावित्री देवी', mr: 'सावित्री देवी' },
  'Indore, Madhya Pradesh': { hi: 'इंदौर, मध्य प्रदेश', mr: 'इंदूर, मध्य प्रदेश' },
  'Organic': { hi: 'जैविक', mr: 'सेंद्रिय' },
  'Fresh Red Onion': { hi: 'ताजा लाल प्याज', mr: 'ताजा लाल कांदा' },
  'Anil Jadhav': { hi: 'अनिल जाधव', mr: 'अनिल जाधव' },
  'Pune, Maharashtra': { hi: 'पुणे, महाराष्ट्र', mr: 'पुणे, महाराष्ट्र' },
  'GreenField Foods': { hi: 'ग्रीनफील्ड फूड्स', mr: 'ग्रीनफील्ड फूड्स' },
  'Harvest Hub': { hi: 'हार्वेस्ट हब', mr: 'हार्वेस्ट हब' },
  'Bharat Grains Co.': { hi: 'भारत ग्रेन्स को.', mr: 'भारत ग्रेन्स को.' },
  'Mumbai · 48 min ago': { hi: 'मुंबई · 48 मिनट पहले', mr: 'मुंबई · 48 मिनिटांपूर्वी' },
  'Pune · 2 hrs ago': { hi: 'पुणे · 2 घंटे पहले', mr: 'पुणे · 2 तासांपूर्वी' },
  'Nashik · 4 hrs ago': { hi: 'नासिक · 4 घंटे पहले', mr: 'नाशिक · 4 तासांपूर्वी' },
}

const originalTextNodes = new WeakMap<Text, string>()

function translateText(text: string, language: 'en' | 'hi' | 'mr') {
  if (language === 'en') return text
  const languageTranslations = translations[language as keyof typeof translations] ?? {}
  const englishTranslations = (translations as any).en ?? {}
  const direct = supplementalTranslations[text]?.[language] ?? (languageTranslations as any)[text]
  if (direct) return direct
  return Object.keys(supplementalTranslations)
    .concat(Object.keys(englishTranslations))
    .sort((a, b) => b.length - a.length)
    .reduce((value, key) => {
      const translated = supplementalTranslations[key]?.[language] ?? languageTranslations[key as keyof typeof languageTranslations]
      return translated ? value.split(key).join(translated) : value
    }, text)
}

export function TranslationLayer() {
  const { language } = useLanguage()
  useEffect(() => {
    const translate = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      let node: Node | null
      while ((node = walker.nextNode())) nodes.push(node as Text)
      nodes.forEach((textNode) => {
        const current = textNode.nodeValue ?? ''
        const value = originalTextNodes.get(textNode) ?? current.trim()
        if (!value || textNode.parentElement?.closest('script,style,select')) return
        if (!originalTextNodes.has(textNode)) originalTextNodes.set(textNode, value)
        const translated = translateText(value, language)
        textNode.nodeValue = current.replace(current.trim(), translated)
      })
      document.querySelectorAll<HTMLElement>('[placeholder], [aria-label], [title]').forEach((element) => {
        for (const attribute of ['placeholder', 'aria-label', 'title']) {
          const value = element.getAttribute(attribute)
          if (!value) continue
          const translated = translateText(value, language)
          if (translated !== value) element.setAttribute(attribute, translated)
        }
      })
    }
    translate()
    const observer = new MutationObserver(translate)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [language])
  return null
}
