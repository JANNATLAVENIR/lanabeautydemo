import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type Language = 'en' | 'so' | 'ar';

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  localizeCategory: (category: string) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Comprehensive dictionary for all UI text across the entire store
const TRANSLATIONS_SO: Record<string, string> = {
  // Brand & Titles
  'LANA': 'LANA',
  'Haute Parfumerie & Luxury Goods': 'Qurxinta, Cadarrada & Dharka Qaliga ah',
  'Fashion & Accessories': 'Dharka & Qalabka Xarragada',
  'Fragrance & Beauty': 'Cadarrada & Qurxinta Sare',
  'Shop now': 'Iibso hadda',
  'Shop Collection': 'Iibso Ururinta',
  'Explore Haute Couture': 'Sahami Dharka Sare',
  'Discover Fragrances': 'Sahami Cadarrada',
  'Discover Lookbook': 'Eeg Buugga Moodada',
  'Curated Exclusives': 'Xulasho Gaar Ah',
  'All Fashion': 'Dhammaan Dharka',
  'All Beauty': 'Dhammaan Qurxinta',
  'Leather Bags': 'Boorsooyinka Haragga ah',
  'Footwear & Pumps': 'Kabaha & Dacasaha Sare',
  'Ready-to-Wear': 'Dharka Diyaar-ka ah',
  'Runway Creations & Leather Icons': 'Naqshadaha Masraxa & Haragga Sare',
  'View Full Catalogue': 'Eeg Dhammaan Buug-yaraha',
  'THE ATELIER CURATION': 'XULASHADA GAARKA AH EE MAISON-KA',
  'DISCOVER HAUTE PARFUMERIE': 'SAHAMI CADARRADA SARE EE LANA',
  'Niche Perfumery & Prestigious Skincare': 'Cadarrada Gaarka ah & Daryeelka Maqaarka ee Sare',

  // Navigation
  'Search': 'Raadi',
  'Search...': 'Raadi...',
  'Search luxury fashion & beauty...': 'Raadi dharka iyo qurxinta qaaliga ah...',
  'Search luxury fashion & beauty': 'Raadi dharka iyo qurxinta qaaliga ah',
  'Account': 'Koonto',
  'My Account': 'Koontadayda',
  'Sign In': 'Gal Koontada',
  'Sign Out': 'Ka Bax',
  'Shopping Bag': 'Boorsada Wax-iibsiga',
  'Bag': 'Boorsada',
  'Wishlist': 'Alaabta aad Jeclaysatay',
  'Fashion': 'Dharka',
  "Men's Dress": 'Dharka Ragga',
  "Men's Fashion": 'Moodada Ragga',
  'Men': 'Ragga',
  'Women': 'Dumarka',
  'Shirt': 'Shaati',
  'Shirts': 'Shaatiyada',
  'Jeans': 'Jaanis (Jeans)',
  'Watches': 'Saacadaha Qaaliga ah',
  'Beauty': 'Qurxinta',
  'Skincare': 'Daryeelka Maqaarka',
  'Bodycare': 'Daryeelka Jirka',
  'Body Care': 'Daryeelka Jirka',
  'Accessories': 'Qalabka & Xirmooyinka',
  'New Arrivals': 'Kuwa Cusub',
  'Collections': 'Ururinnada',
  'Brands': 'Noocyada (Brands)',
  'Bags': 'Boorsooyinka',
  'Shoes': 'Kabaha',
  'Makeup': 'Qurxinta Wajiga',
  'Fragrance': 'Cadarrada',
  'Haircare': 'Daryeelka Timaha',
  'Deodorant': 'Udgoonka Jirka',
  'All': 'Dhammaan',
  'LANA Concierge': 'Kaaliyaha LANA',
  'Hair Mists & Care': 'Udugga Timaha & Daryeelka',

  // Catalog & Filter
  'Filter': 'Kala Saar',
  'Filters': 'Kala Saarista',
  'Sort by': 'U kala horraysii',
  'Featured': 'Kuwa ugu mudan',
  'Price: Low to High': 'Qiimaha: Hoose ilaa Sare',
  'Price: High to Low': 'Qiimaha: Sare ilaa Hoose',
  'Newest': 'Ugu Cusub',
  'In Stock Only': 'Kuwa yaalla kaliya',
  'Price Range': 'Heerka Qiimaha',
  'Clear all': 'Nadiifi dhammaan',
  'Reset Filters': 'Dib u deji',
  'Showing': 'Muujinaya',
  'creations': 'alaabood',
  'products': 'alaabood',
  'No products found': 'Wax alaab ah lama helin',
  'Try adjusting your search or filters': 'Isku day inaad bedesho baadhitaanka ama kala saarista',
  'Color': 'Midabka',
  'Size': 'Cabirka',
  'Price': 'Qiimaha',
  'Brand': 'Nooca',
  'Category': 'Qaybta',
  'View all': 'Eeg dhammaan',

  // Product Card & Details
  'Add to Bag': 'Ku dar Boorsada',
  'Added to Bag': 'Waa lagu daray boorsada',
  'Quick View': 'Aragti Degdeg ah',
  'Add to Wishlist': 'Ku dar Liiska aad Jeclaysatay',
  'Remove from Wishlist': 'Ka saar Liiska aad Jeclaysatay',
  'View Details': 'Eeg Faahfaahinta',
  'Select Size': 'Dooro Cabirka',
  'Quantity': 'Tirada',
  'Buy Now': 'Iibso Hadda',
  'In Stock': 'Waa diyaar',
  'Out of Stock': 'Waa go’day',
  'Free Express Delivery': 'Keenis Degdeg ah oo Bilaash ah',
  'Authenticity Guaranteed': 'Tayo Dhab ah oo La Hubiyay (100%)',
  'Description': 'Sharaxaadda Alaabta',
  'Details & Heritage': 'Faahfaahinta & Taariikhda',
  'Complimentary Delivery & Returns': 'Keenis & Soo Celin Bilaash ah',
  'Client Reviews & Reflections': 'Fikradaha Macaamiisha',
  'Write a Review': 'Qor Fikrad',
  'Submit Review': 'Gudbi Fikradda',
  'Related Creations': 'Alaabo La Xiriira',
  'Back to Collection': 'Ku noqo Ururinta',
  'Size Guide': 'Tilmaamaha Cabirka',
  'Only a few left': 'Wax yar baa ka hadhay',

  // Cart & Checkout
  'Your Shopping Bag': 'Boorsadaada Wax-iibsiga',
  'Your Bag is Empty': 'Boorsadaadu waa madhan tahay',
  'Start Shopping': 'Bilow Wax-iibsiga',
  'Subtotal': 'Wadarta Hoose',
  'Shipping': 'Kharashka Keenista',
  'Free': 'Bilaash',
  'Estimated Tax': 'Canshuurta',
  'Total': 'Wadarta Guud',
  'Total Amount:': 'Wadarta Guud:',
  'Proceed to Checkout': 'U gudub Dhameystirka Dalabka',
  'Continue Shopping': 'Sii wad Wax-iibsiga',
  'Remove': 'Ka saar',
  'Apply': 'Isticmaal',
  'Promo Code': 'Koodhka Dhimista',
  'Enter promo code': 'Geli koodhka dhimista',
  'Order Summary': 'Koobitaanka Dalabka',
  'Checkout': 'Dhameystirka Dalabka',
  'Contact Information': 'Macluumaadka Xiriirka',
  'Full Name': 'Magaca oo Buuxa',
  'Email Address': 'Ciwaanka Email-ka',
  'Phone Number': 'Lambarka Taleefanka',
  'Shipping Address': 'Ciwaanka Keenista',
  'Address': 'Ciwaanka',
  'City': 'Magaalada',
  'Postal Code': 'Koodhka Boostada',
  'Country / Territory': 'Waddanka / Gobolka',
  'Country / Territory *': 'Waddanka / Gobolka *',
  'Payment Method': 'Habka Lacag-bixinta',
  'Cash on Delivery': 'Lacag-bixin Marka aad Hesho',
  'Place Order': 'Gudbi Dalabka',
  'Processing...': 'Waa socotaa...',
  'Delivery Details': 'Faahfaahinta Keenista',
  'Complete Order via WhatsApp': 'Ku dhamaystir Dalabka WhatsApp',
  'Please fill in your Name, Phone, and Delivery Address.': 'Fadlan buuxi Magacaaga, Taleefankaaga, iyo Ciwaanka.',

  // Order Confirmation & Tracker
  'Order Request Created': 'Dalabka waa la Diiwaangeliyay',
  'Payment: Pending': 'Lacag-bixin: Sugaysa',
  'Order: Pending Payment': 'Dalab: Lacag sugaya',
  'Order Confirmed': 'Dalabka waa la Xaqiijiyay',
  'Order Number': 'Lambarka Dalabka',
  'Tracking Code:': 'Koodhka Raad-raaca:',
  'Order ID copied to clipboard!': 'Lambarka dalabka waa la koobiyeeyay!',
  'Track Order Status': 'Raad-raac Xaaladda Dalabka',
  'Track Order': 'Raad-raac Dalabka',
  'Track Your Order': 'Raad-raac Dalabkaaga',
  'Enter your order ID': 'Geli lambarka dalabkaaga',
  'Enter order ID or code...': 'Geli lambarka dalabka ama koodhka...',
  'Close Window': 'Xir Daaqadda',
  'Close': 'Xir',
  'Track': 'Raad-raac',
  'Order Status': 'Xaaladda Dalabka',
  'Placed': 'La Gudbiyay',
  'Confirmed': 'Waa la Xaqiijiyay',
  'Shipped': 'Waa la Soo Diray',
  'Delivered': 'Waa la Gaadhsiiyay',

  // Country & Language Modal
  'Country & Region': 'Waddanka & Gobolka',
  'Country, Region & Language': 'Waddanka, Gobolka & Luuqadda',
  'Select Language': 'Dooro Luuqadda',
  'Select Country': 'Dooro Waddanka',
  'Language': 'Luuqadda',
  'Country / Region:': 'Waddanka / Gobolka:',
  'Country / Region': 'Waddanka / Gobolka',
  'Search region or currency...': 'Raadi gobol ama lacag...',
  'Search country or region': 'Raadi waddan ama gobol',
  'Done': 'Dhammee',

  // Footer & Account
  'Customer Care': 'Daryeelka Macmiilka',
  'The Maison': 'Shirkadda LANA',
  'Legal & Privacy': 'Sharciga & Asturnaanta',
  'Contact Us': 'Nala soo xiriir',
  'Shipping & Returns': 'Keenista & Soo Celinta',
  'FAQs': 'Su’aalaha Badanaa La Isweydiiyo',
  'Terms & Conditions': 'Shuruudaha & Xeerarka',
  'Privacy Policy': 'Xeerka Asturnaanta',
  'Accessibility': 'Fududeynta Isticmaalka',
  'Accessibility Settings': 'Dejinta Fududeynta',
  'High Contrast': 'Midabka Sare',
  'Reduced Motion': 'Yaree Dhaqdhaqaaqa',
  'Enlarged Typography': 'Qoraal Weyn',
  'All rights reserved.': 'Dhammaan xuquuqda way dhowran yihiin.',
  '© 2026 LANA. All rights reserved.': '© 2026 LANA. Dhammaan xuquuqda way dhowran yihiin.',
  'Newsletter': 'Wargeyska Gaarka ah',
  'Sign up for exclusive previews and private sales': 'Is-qor si aad u hesho xogta gaarka ah iyo dhimisyada',
  'Enter your email address': 'Geli email-kaaga',
  'Subscribe': 'Is-diiwaangeli',
  'Thank you for subscribing': 'Waad ku mahadsan tahay is-qoristaada',
  'Admin Portal': 'Qaybta Maamulka',
  'Gali Admin Portal': 'Gal Qaybta Maamulka',
  'Orders': 'Dalabaadka',
  'Profile': 'Xogtaada',
  'Addresses': 'Ciwaannada',
  'Concierge': 'Kaaliyaha Gaarka ah',
  'Welcome': 'Soo Dhawoow',
  'Create Account': 'Sameyso Koonto',
  'Password': 'Furaha Sirta',

  // Account & Customer Portal
  'Register': 'Is-diiwaangeli',
  'Email': 'Email-ka',
  'First Name': 'Magaca Koowaad',
  'Last Name': 'Magaca Qoyska',
  'Title': 'Darajada / Cinwaanka',
  'Customer': 'Macmiilka',
  'Save Changes': 'Keydi Isbeddellada',
  'Saved': 'Waa la keydiyay',
  'Phone': 'Taleefanka',
  'Default Shipping Address': 'Ciwaanka Rasmiga ah ee Keenista',
  'Street Address': 'Ciwaanka Waddada',
  'Default': 'Rasmiga ah',
  'Active Orders': 'Dalabaadka Firfircoon',
  'Sign in to view your orders, track shipments, and manage your luxury acquisitions.': 'Gal koontadaada si aad u aragto dalabaadkaaga, ula socoto xaaladda xirmadaada, una maamusho iibsashadaada.',
  'No orders placed yet': 'Wali ma jiraan wax dalabaad ah oo aad gudbisay',
  'Items': 'Alaabo',
  'Items in your Wishlist': 'Alaabta ku jirta liiskaaga',
  'Move to Bag': 'U wareeji Boorsada',
  'Your wishlist is currently empty': 'Liiskaaga aad jeclaysatay hadda waa madhan yahay',
  'Explore Collections': 'Sahami Ururinnada',
  'Welcome to Maison Lana Concierge': 'Ku soo dhawoow Kaaliyaha Khaaska ah ee Maison LANA',
  'Need styling advice, private appointment, or order assistance? Our dedicated luxury concierges are at your service 24/7 via WhatsApp or direct phone.': 'Ma u baahan tahay talo ku saabsan xulashada, ballan gaar ah, ama caawin ku saabsan dalabkaaga? Kooxdayada waxay diyaar kuu yihiin 24/7.',
  'WhatsApp Atelier Concierge': 'La xiriir WhatsApp-ka Gaarka ah',
  'Call Direct Line': 'Wac Khadka Tooska ah',
  'Admin Access': 'Gelitaanka Maamulka',
  'Open Management Portal': 'Fur Qaybta Maamulka',
  'High Jewellery': 'Dahabka & Qalabka Qalbiga',
  'Haute Couture': 'Dharka Heerka Sare',
  'Fine Fragrance': 'Cadarrada Gaarka ah',
  'Rare Elixirs': 'Udugyada Qalbiga',
  'Trending Now': 'Kuwa Hadda Ugu Hadal-haynta Badan',
  'Editor’s Selection': 'Xulashada Tifatiraha',
  'Trending': 'Kuwa Caanka ah',
  'Shop All Fashion': 'Dukaamayso Dhammaan Dharka',
  'Shop All Beauty': 'Dukaamayso Dhammaan Qurxinta',
  'Cancel': 'Ka noqo',
  'Confirm': 'Xaqiiji'
};

const TRANSLATIONS_AR: Record<string, string> = {
  // Brand & Titles
  'LANA': 'لانا',
  'Haute Parfumerie & Luxury Goods': 'العطور الراقية والمنتجات الفاخرة',
  'Fashion & Accessories': 'الأزياء والإكسسوارات الفاخرة',
  'Fragrance & Beauty': 'العطور والجمال الراقي',
  'Shop now': 'تسوق الآن',
  'Shop Collection': 'تسوق التشكيلة',
  'Explore Haute Couture': 'استكشف الهوت كوتور',
  'Discover Fragrances': 'اكتشف العطور',
  'Discover Lookbook': 'استكشف الكتالوج',
  'Curated Exclusives': 'حصريات منتقاة بعناية',
  'All Fashion': 'جميع الأزياء',
  'All Beauty': 'جميع منتجات الجمال',
  'Leather Bags': 'الحقائب الجلدية الفاخرة',
  'Footwear & Pumps': 'الأحذية والكعوب الأنيقة',
  'Ready-to-Wear': 'الملابس الجاهزة',
  'Runway Creations & Leather Icons': 'إبداعات المنصات والقطع الجلدية الأيقونية',
  'View Full Catalogue': 'عرض الكتالوج بالكامل',
  'THE ATELIER CURATION': 'مختارات دار الأزياء الفاخرة',
  'DISCOVER HAUTE PARFUMERIE': 'اكتشف عالم العطور الفاخرة',
  'Niche Perfumery & Prestigious Skincare': 'العطور النادرة والعناية الفائقة بالبشرة',

  // Navigation
  'Search': 'بحث',
  'Search...': 'بحث...',
  'Search luxury fashion & beauty...': 'ابحث في الأزياء الفاخرة ومستحضرات التجميل...',
  'Search luxury fashion & beauty': 'ابحث في الأزياء الفاخرة ومستحضرات التجميل',
  'Account': 'الحساب',
  'My Account': 'حسابي',
  'Sign In': 'تسجيل الدخول',
  'Sign Out': 'تسجيل الخروج',
  'Shopping Bag': 'حقيبة التسوق',
  'Bag': 'الحقيبة',
  'Wishlist': 'قائمة الأمنيات',
  'Fashion': 'الأزياء',
  'Beauty': 'الجمال',
  'Skincare': 'العناية بالبشرة',
  'Bodycare': 'العناية بالجسم',
  'Body Care': 'العناية بالجسم',
  'Accessories': 'الإكسسوارات',
  'New Arrivals': 'وصل حديثاً',
  'Collections': 'المجموعات',
  'Brands': 'الماركات',
  'Bags': 'الحقائب',
  'Shoes': 'الأحذية',
  'Makeup': 'المكياج',
  'Fragrance': 'العطور',
  'Haircare': 'العناية بالشعر',
  'Deodorant': 'مزيلات العرق',
  'All': 'الكل',
  'LANA Concierge': 'مساعد لانا الخاص',
  'Hair Mists & Care': 'معطرات الشعر والعناية',

  // Catalog & Filter
  'Filter': 'تصفية',
  'Filters': 'الفلاتر',
  'Sort by': 'الترتيب حسب',
  'Featured': 'المميز',
  'Price: Low to High': 'السعر: من الأقل للأعلى',
  'Price: High to Low': 'السعر: من الأعلى للأقل',
  'Newest': 'الأحدث',
  'In Stock Only': 'المتوفر في المخزون فقط',
  'Price Range': 'نطاق السعر',
  'Clear all': 'مسح الكل',
  'Reset Filters': 'إعادة ضبط الفلاتر',
  'Showing': 'عرض',
  'creations': 'إبداعاً',
  'products': 'منتجاً',
  'No products found': 'لم يتم العثور على منتجات',
  'Try adjusting your search or filters': 'حاول تعديل خيارات البحث أو الفلاتر',
  'Color': 'اللون',
  'Size': 'المقاس',
  'Price': 'السعر',
  'Brand': 'الماركة',
  'Category': 'الفئة',
  'View all': 'عرض الكل',

  // Product Card & Details
  'Add to Bag': 'أضف إلى الحقيبة',
  'Added to Bag': 'تمت الإضافة إلى الحقيبة',
  'Quick View': 'نظرة سريعة',
  'Add to Wishlist': 'إضافة إلى قائمة الأمنيات',
  'Remove from Wishlist': 'إزالة من قائمة الأمنيات',
  'View Details': 'عرض التفاصيل',
  'Select Size': 'اختر المقاس',
  'Quantity': 'الكمية',
  'Buy Now': 'اشتري الآن',
  'In Stock': 'متوفر بالمخزون',
  'Out of Stock': 'نفد من المخزون',
  'Free Express Delivery': 'توصيل سريع مجاني',
  'Authenticity Guaranteed': 'أصالة مضمونة 100%',
  'Description': 'وصف المنتج',
  'Details & Heritage': 'التفاصيل والتراث',
  'Complimentary Delivery & Returns': 'توصيل وإرجاع مجاني',
  'Client Reviews & Reflections': 'تقييمات وآراء العملاء',
  'Write a Review': 'اكتب تقييماً',
  'Submit Review': 'إرسال التقييم',
  'Related Creations': 'إبداعات ذات صلة',
  'Back to Collection': 'العودة للمجموعة',
  'Size Guide': 'دليل المقاسات',
  'Only a few left': 'تبقى قطع معدودة فقط',

  // Cart & Checkout
  'Your Shopping Bag': 'حقيبة التسوق الخاصة بك',
  'Your Bag is Empty': 'حقيبة التسوق فارغة حالياً',
  'Start Shopping': 'ابدأ التسوق',
  'Subtotal': 'المجموع الفرعي',
  'Shipping': 'الشحن',
  'Free': 'مجاني',
  'Estimated Tax': 'الضريبة التقديرية',
  'Total': 'المجموع الإجمالي',
  'Total Amount:': 'المبلغ الإجمالي:',
  'Proceed to Checkout': 'متابعة إتمام الشراء',
  'Continue Shopping': 'متابعة التسوق',
  'Remove': 'إزالة',
  'Apply': 'تطبيق',
  'Promo Code': 'رمز الخصم',
  'Enter promo code': 'أدخل رمز التخفيض',
  'Order Summary': 'ملخص الطلب',
  'Checkout': 'إتمام الشراء',
  'Contact Information': 'معلومات الاتصال',
  'Full Name': 'الاسم الكامل',
  'Email Address': 'البريد الإلكتروني',
  'Phone Number': 'رقم الهاتف',
  'Shipping Address': 'عنوان التوصيل',
  'Address': 'العنوان',
  'City': 'المدينة',
  'Postal Code': 'الرمز البريدي',
  'Country / Territory': 'الدولة / المنطقة',
  'Country / Territory *': 'الدولة / المنطقة *',
  'Payment Method': 'طريقة الدفع',
  'Cash on Delivery': 'الدفع عند الاستلام',
  'Place Order': 'تأكيد الطلب',
  'Processing...': 'جاري المعالجة...',
  'Delivery Details': 'تفاصيل التوصيل',
  'Complete Order via WhatsApp': 'إتمام الطلب عبر واتساب',
  'Please fill in your Name, Phone, and Delivery Address.': 'يرجى إدخال الاسم، رقم الهاتف، وعنوان التوصيل.',

  // Order Confirmation & Tracker
  'Order Request Created': 'تم إنشاء طلبك بنجاح',
  'Payment: Pending': 'الدفع: قيد الانتظار',
  'Order: Pending Payment': 'الطلب: بانتظار الدفع',
  'Order Confirmed': 'تم تأكيد الطلب بنجاح',
  'Order Number': 'رقم الطلب',
  'Tracking Code:': 'رمز التتبع:',
  'Order ID copied to clipboard!': 'تم نسخ رقم الطلب إلى الحافظة!',
  'Track Order Status': 'تتبع حالة الطلب',
  'Track Order': 'تتبع الطلب',
  'Track Your Order': 'تتبع طلبك',
  'Enter your order ID': 'أدخل رقم الطلب الخاص بك',
  'Enter order ID or code...': 'أدخل رقم الطلب أو رمز التتبع...',
  'Close Window': 'إغلاق النافذة',
  'Close': 'إغلاق',
  'Track': 'تتبع',
  'Order Status': 'حالة الطلب',
  'Placed': 'تم الطلب',
  'Confirmed': 'تم التأكيد',
  'Shipped': 'تم الشحن',
  'Delivered': 'تم التوصيل',

  // Country & Language Modal
  'Country & Region': 'الدولة والمنطقة',
  'Country, Region & Language': 'الدولة والمنطقة واللغة',
  'Select Language': 'اختر اللغة',
  'Select Country': 'اختر الدولة',
  'Language': 'اللغة',
  'Country / Region:': 'الدولة / المنطقة:',
  'Country / Region': 'الدولة / المنطقة',
  'Search region or currency...': 'ابحث عن دولة أو عملة...',
  'Search country or region': 'ابحث عن دولة أو منطقة',
  'Done': 'تم',

  // Footer & Account
  'Customer Care': 'خدمة العملاء',
  'The Maison': 'عالم لانا',
  'Legal & Privacy': 'الشؤون القانونية والخصوصية',
  'Contact Us': 'اتصل بنا',
  'Shipping & Returns': 'الشحن والإرجاع',
  'FAQs': 'الأسئلة الشائعة',
  'Terms & Conditions': 'الشروط والأحكام',
  'Privacy Policy': 'سياسة الخصوصية',
  'Accessibility': 'إمكانية الوصول',
  'Accessibility Settings': 'إعدادات إمكانية الوصول',
  'High Contrast': 'التباين العالي',
  'Reduced Motion': 'تقليل الحركة',
  'Enlarged Typography': 'تكبير الخطوط',
  'All rights reserved.': 'جميع الحقوق محفوظة.',
  '© 2026 LANA. All rights reserved.': '© 2026 لانا. جميع الحقوق محفوظة.',
  'Newsletter': 'النشرة البريدية الحصرية',
  'Sign up for exclusive previews and private sales': 'اشترك للحصول على المعاينات الحصرية والعروض الخاصة المسبقة',
  'Enter your email address': 'أدخل بريدك الإلكتروني',
  'Subscribe': 'اشتراك',
  'Thank you for subscribing': 'شكراً لاشتراكك معنا',
  'Admin Portal': 'لوحة الإدارة',
  'Gali Admin Portal': 'دخول لوحة الإدارة',
  'Orders': 'الطلبات',
  'Profile': 'الملف الشخصي',
  'Addresses': 'العناوين',
  'Concierge': 'المساعد الشخصي',
  'Welcome': 'مرحباً بك',
  'Create Account': 'إنشاء حساب جديد',
  'Password': 'كلمة المرور',

  // Account & Customer Portal
  'Register': 'إنشاء حساب',
  'Email': 'البريد الإلكتروني',
  'First Name': 'الاسم الأول',
  'Last Name': 'اسم العائلة',
  'Title': 'اللقب',
  'Customer': 'العميل',
  'Save Changes': 'حفظ التعديلات',
  'Saved': 'تم الحفظ',
  'Phone': 'رقم الهاتف',
  'Default Shipping Address': 'عنوان التوصيل الافتراضي',
  'Street Address': 'عنوان الشارع والحي',
  'Default': 'افتراضي',
  'Active Orders': 'الطلبات النشطة',
  'Sign in to view your orders, track shipments, and manage your luxury acquisitions.': 'سجل الدخول لعرض طلباتك، تتبع الشحنات، وإدارة مشترياتك الفاخرة.',
  'No orders placed yet': 'لا توجد طلبات مسجلة بعد',
  'Items': 'منتجات',
  'Items in your Wishlist': 'منتجات في قائمة أمنياتك',
  'Move to Bag': 'نقل إلى الحقيبة',
  'Your wishlist is currently empty': 'قائمة الأمنيات الخاصة بك فارغة حالياً',
  'Explore Collections': 'استكشف المجموعات',
  'Welcome to Maison Lana Concierge': 'مرحباً بك في خدمة المساعد الشخصي لدار لانا',
  'Need styling advice, private appointment, or order assistance? Our dedicated luxury concierges are at your service 24/7 via WhatsApp or direct phone.': 'هل تحتاج إلى استشارة خاصة في الموضة، موعد حصري، أو مساعدة في طلبك؟ مستشارونا في خدمتك على مدار الساعة عبر واتساب أو الاتصال المباشر.',
  'WhatsApp Atelier Concierge': 'تواصل عبر واتساب دار الأزياء',
  'Call Direct Line': 'الاتصال المباشر',
  'Admin Access': 'صلاحيات الإدارة',
  'Open Management Portal': 'فتح لوحة التحكم',
  'High Jewellery': 'المجوهرات الراقية',
  'Haute Couture': 'الهوت كوتور',
  'Fine Fragrance': 'العطور الفاخرة',
  'Rare Elixirs': 'الإكسيرات النادرة',
  'Trending Now': 'الأكثر رواجاً الآن',
  'Editor’s Selection': 'مختارات المحرر',
  'Trending': 'رائج الآن',
  'Shop All Fashion': 'تسوق جميع الأزياء',
  'Shop All Beauty': 'تسوق جميع منتجات الجمال',
  'Cancel': 'إلغاء',
  'Confirm': 'تأكيد'
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('lana_language') as Language;
      if (saved === 'so' || saved === 'ar' || saved === 'en') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('lana_language', lang);
    } catch (e) {
      console.error('Failed to save language', e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (language === 'ar') {
      document.documentElement.classList.add('lang-ar');
    } else {
      document.documentElement.classList.remove('lang-ar');
    }
  }, [language]);

  const t = useCallback(
    (key: string, defaultText?: string): string => {
      if (!key) return defaultText || '';
      if (language === 'en') return defaultText || key;

      const trimmed = key.trim();
      const hasColon = trimmed.endsWith(':');
      const baseKey = hasColon ? trimmed.slice(0, -1).trim() : trimmed;

      let dict = language === 'so' ? TRANSLATIONS_SO : TRANSLATIONS_AR;

      // Exact match
      if (dict[trimmed]) return dict[trimmed];
      if (dict[baseKey]) return hasColon ? `${dict[baseKey]}:` : dict[baseKey];

      // Lowercase match fallback
      const foundEntry = Object.keys(dict).find(
        (k) => k.toLowerCase() === baseKey.toLowerCase()
      );
      if (foundEntry) {
        return hasColon ? `${dict[foundEntry]}:` : dict[foundEntry];
      }

      return defaultText || key;
    },
    [language]
  );

  const localizeCategory = useCallback(
    (category: string): string => {
      if (!category) return '';
      const upper = category.toUpperCase();
      if (language === 'so') {
        if (upper === 'MEN' || upper === "MEN'S DRESS" || upper === 'MEN DRESS') return 'Dharka Ragga';
        if (upper === 'SHIRT' || upper === 'SHIRTS') return 'Shaatiyada';
        if (upper === 'JEANS' || upper === 'DENIM') return 'Jaaniska';
        if (upper === 'WATCHES' || upper === 'WATCH') return 'Saacadaha';
        if (upper === 'FASHION') return 'Dharka & Moodada';
        if (upper === 'BEAUTY') return 'Qurxinta & Cadarrada';
        if (upper === 'SKINCARE') return 'Daryeelka Maqaarka';
        if (upper === 'BODYCARE' || upper === 'BODY CARE') return 'Daryeelka Jirka';
        if (upper === 'BAGS') return 'Boorsooyinka';
        if (upper === 'SHOES') return 'Kabaha';
        if (upper === 'ACCESSORIES') return 'Qalabka Xarragada';
        if (upper === 'FRAGRANCE') return 'Cadarrada';
        if (upper === 'MAKEUP') return 'Qurxinta Wajiga';
        if (upper === 'HAIRCARE') return 'Daryeelka Timaha';
        if (upper === 'DEODORANT') return 'Udgoonka Jirka';
        if (upper === 'ALL') return 'Dhammaan Alaabta';
      } else if (language === 'ar') {
        if (upper === 'MEN' || upper === "MEN'S DRESS" || upper === 'MEN DRESS') return 'أزياء رجالية';
        if (upper === 'SHIRT' || upper === 'SHIRTS') return 'قمصان';
        if (upper === 'JEANS' || upper === 'DENIM') return 'جينز';
        if (upper === 'WATCHES' || upper === 'WATCH') return 'ساعات';
        if (upper === 'FASHION') return 'الأزياء الراقية';
        if (upper === 'BEAUTY') return 'الجمال والعطور';
        if (upper === 'SKINCARE') return 'العناية بالبشرة';
        if (upper === 'BODYCARE' || upper === 'BODY CARE') return 'العناية بالجسم';
        if (upper === 'BAGS') return 'الحقائب';
        if (upper === 'SHOES') return 'الأحذية';
        if (upper === 'ACCESSORIES') return 'الإكسسوارات';
        if (upper === 'FRAGRANCE') return 'العطور';
        if (upper === 'MAKEUP') return 'المكياج';
        if (upper === 'HAIRCARE') return 'العناية بالشعر';
        if (upper === 'DEODORANT') return 'مزيل العرق';
        if (upper === 'ALL') return 'جميع المنتجات';
      }
      return category;
    },
    [language]
  );

  const isRtl = language === 'ar';

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      localizeCategory,
      isRtl,
    }),
    [language, setLanguage, t, localizeCategory, isRtl]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
