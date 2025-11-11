import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'hy' | 'ru' | 'es' | 'zh' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tWithParams: (key: string, params: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // App & Navigation
    'app.title': 'RateSnap',
    'app.subtitle': 'Professional Currency Converter Suite',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.converter': 'Converter',
    'dashboard.multiCurrency': 'Multi Currency',
    'dashboard.rateAlerts': 'Rate Alerts',
    'dashboard.savedRates': 'Saved Rates',
    'dashboard.features': 'Dashboard Features',
    'dashboard.features.description': 'Complete currency conversion suite with advanced features',
    
    // Quick Actions
    'quick.action.converter': 'Currency Converter',
    'quick.action.converter.desc': 'Professional converter with all features',
    'quick.action.multiCurrency': 'Multi Currency',
    'quick.action.multiCurrency.desc': 'Quick conversions to 20 currencies',
    'quick.action.multiCurrency.hide': 'Hide conversion tool',
    'quick.action.rateAlerts': 'Rate Alerts',
    'quick.action.rateAlerts.desc': 'Set target rates for currency monitoring',
    'quick.action.rateAlerts.hide': 'Hide alerts',
    'quick.action.savedRates': 'Saved Rates',
    'quick.action.savedRates.desc': 'Quick access to favorites',
    'quick.action.savedRates.hide': 'Hide saved rates',
    
    // Currency Converter
    'converter.title': 'Currency Converter',
    'converter.subtitle': 'Complete currency conversion suite with advanced features',
    'converter.standard': 'Standard Conversion',
    'converter.multiCurrency.section': 'Multi-Currency Converter',
    'converter.calculator': 'Calculator',
    'converter.saveRate': 'Save This Rate',
    'converter.disclaimer': 'Professional currency converter with real-time rates and advanced features',
    'converter.loadingRates': 'Loading exchange rates...',
    'converter.refreshData': 'Refresh Data',
    'converter.enterAmount': 'Enter amount to convert',
    'converter.exchangeRate': 'Exchange Rate',
    'converter.rate': 'Rate',
    'converter.to': 'To',
    'converter.from': 'From',
    'converter.selectCurrencies': 'Select currencies to see conversion',
    'converter.professional': 'Professional currency converter with real-time rates and advanced features',
    'converter.conversionResult': '{amount} {fromCurrency} = {convertedAmount} {toCurrency}',
    'converter.exchangeRateResult': '{rateLabel}: 1 {fromCurrency} = {rate} {toCurrency}',
    'converter.backToDashboard': '← Back to Dashboard',
    
    // Rate Alerts
    'alerts.title': 'Rate Alerts',
    'alerts.active': 'Your Active Alerts:',
    'alerts.none': 'No rate alerts set yet',
    'alerts.createFirst': 'Create your first alert below',
    'alerts.createNew': 'Create New Alert:',
    'alerts.condition.below': 'Below',
    'alerts.condition.above': 'Above',
    'alerts.create': 'Create Alert',
    'alerts.deleteAll': 'Delete All',
    'alerts.viewMore': 'View more alerts →',
    'alerts.targetRate': 'Target rate',
    
    // Saved Rates
    'saved.title': 'Saved Rates',
    'saved.titles': 'Saved Rates', // Alias for compatibility
    'saved.shortTitle': 'Saved', // Short version for constrained layouts
    'saved.clear': 'Clear All',
    'saved.yourRates': 'Your Saved Rates:',
    'saved.none': 'No saved rates yet',
    'saved.addFirst': 'Add your first rate using the converter above',
    'saved.deleteConfirm': 'Are you sure you want to delete this saved rate?',
    'saved.deleteAllConfirm': 'Are you sure you want to delete all saved rates? This action cannot be undone.',
    'saved.delete': 'Delete',
    'saved.cancel': 'Cancel',
    'saved.deleteAll': 'Delete All',
    'saved.noRates': 'No saved rates yet. Convert currencies and click "Save This Rate" to add some!',
    'saved.savedOn': 'Saved on',
    'saved.at': 'at',
    'success.rateSaved': 'Rate saved successfully!',
    'success.alertCreated': 'Rate alert created successfully!',
    'success.alertDeleted': 'Rate alert deleted',
    'success.rateDeleted': 'Rate deleted',
    
    // Settings & Common
    'settings.language': 'Language',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.refresh': 'Refresh',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.more': 'More',
    'common.less': 'Less',
    'common.showMore': 'Show More',
    'common.showLess': 'Show Less',
    'common.select': 'Select',
    'common.selected': 'Selected',
    'common.noneSelected': 'None Selected',
    
    // Multi-Currency
    'multi.title': 'Multi-Currency Converter',
    'multi.subtitle': 'Convert to multiple currencies instantly with live rates',
    'multi.from': 'From',
    'multi.to': 'To',
    'multi.amount': 'Amount',
    'multi.rates': 'Exchange Rates',
    'multi.manage': 'Manage Currencies',
    'multi.emptyState': 'Click "Add Currency" to select currencies for conversion',
    'multi.alreadyInList': 'is already in your conversion list. Please select a different currency.',
    'multi.selectCurrency': 'Select currency',
    'multi.addCurrency': '+ Add Currency',
    'multi.convertTo': 'Convert To',
    'multi.titleComponent': '🔄 Multi-Currency Converter',

    // Currency Picker & Dynamic
    'picker.selectCurrency': 'Select Currency',
    'picker.searchCurrencies': 'Search currencies',
    'picker.frequentlyUsed': '⭐ Frequently Used',
    'picker.close': 'Close',

    // Dynamic Content
    'dynamic.savedCount': '({count})',
    
    // Features
    'feature.multiCurrency.title': 'Multi-Currency Converter',
    'feature.multiCurrency.desc': 'Convert to multiple currencies instantly with live rates',
    'feature.calculator.title': 'Calculator Integration',
    'feature.calculator.desc': 'Built-in calculator for amount calculations',
    'feature.offline.title': 'Offline Mode',
    'feature.offline.desc': 'Works without internet using cached rates',
    'feature.location.title': 'Auto-Detect Location',
    'feature.location.desc': 'Automatically detects your country and sets default currency',
    'feature.caching.title': 'Smart Caching',
    'feature.caching.desc': 'Intelligent rate caching with offline fallbacks',
    
    // Location
    'location.detect': 'Detect Location',
    'location.detecting': 'Detecting your location...',
    'location.permission': 'Location Permission Required',
    'location.detected': 'Location detected',
    'location.notDetected': 'Location not detected',
    
    // Footer
    'footer.copyright': '© 2025 {appTitle} - {suiteName}',
    'footer.suiteName': 'Professional Currency Converter Suite',
    'footer.terms': 'Terms of Use & Privacy',
    
    // Date/Time
    'time.lastUpdate': 'Last update',
    'time.nextUpdate': 'Next update',
    
    // Authentication
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.welcome': 'Welcome',
    'auth.signout': 'Sign Out',
    'auth.continueWithEmail': 'Continue with Email',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.continueWithApple': 'Continue with Apple',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.username': 'Username',
    'auth.createAccount': 'Create Account',
    'auth.creatingAccount': 'Creating Account...',
    'auth.signingIn': 'Signing In...',
    'auth.signingOut': 'Signing Out...',
    
    // Errors & Messages
    'error.network': 'Network error. Please check your connection.',
    'error.loading': 'Failed to load data. Please try again.',
    'error.invalidAmount': 'Please enter a valid amount',
    'error.selectCurrency': 'Please select currencies to convert',
    'error.ratesUnavailable': 'Exchange rates are currently unavailable',
    'error.duplicateCurrency': 'Duplicate Currency',
    'common.ok': 'OK',
    'common.sponsored': 'Sponsored',
    'common.learnMore': 'Learn More',
    'common.adSupport': 'Support us with ads',
  },
  hy: {
    // Armenian
    'app.title': 'Տարեկան',
    'app.subtitle': 'Մասնագիտական արժույթի փոխարկիչների հավաքածու',
    
    'dashboard.title': 'Վահանակ',
    'dashboard.converter': 'Փոխարկիչ',
    'dashboard.multiCurrency': 'Բազմարժույթ',
    'dashboard.rateAlerts': 'Դրույքի ծանուցումներ',
    'dashboard.savedRates': 'Պահպանված դրույքներ',
    'dashboard.features': 'Վահանակի հնարավորություններ',
    'dashboard.features.description': 'Արժույթի փոխարկման ամբողջական հավաքածու բարդ գործառույթներով',
    
    'quick.action.converter': 'Արժույթի փոխարկիչ',
    'quick.action.converter.desc': 'Բոլոր գործառույթներով մասնագիտական փոխարկիչ',
    'quick.action.multiCurrency': 'Բազմարժույթ',
    'quick.action.multiCurrency.desc': 'Արագ փոխարկում 20 արժույթով',
    'quick.action.multiCurrency.hide': 'Թաքցնել փոխարկման գործիքը',
    'quick.action.rateAlerts': 'Դրույքի ծանուցումներ',
    'quick.action.rateAlerts.desc': 'Արժույթի մոնիտորինգի համար նշանակեք թիրախային դրույքներ',
    'quick.action.rateAlerts.hide': 'Թաքցնել ծանուցումները',
    'quick.action.savedRates': 'Պահպանված դրույքներ',
    'quick.action.savedRates.desc': 'Նախընտրածների արագ հասանելիություն',
    'quick.action.savedRates.hide': 'Թաքցնել պահպանված դրույքները',
    
    'converter.title': 'Արժույթի փոխարկիչ',
    'converter.subtitle': 'Արժույթի փոխարկման ամբողջական հավաքածու բարդ գործառույթներով',
    'converter.standard': 'Ստանդարտ փոխարկում',
    'converter.multiCurrency.section': 'Բազմարժույթ փոխարկիչ',
    'converter.calculator': 'Հաշվիչ',
    'converter.saveRate': 'Պահպանել այս դրույքը',
    'converter.disclaimer': 'Արժույթի մասնագիտական փոխարկիչ իրական ժամանակի դրույքներով և բարդ գործառույթներով',
    'converter.loadingRates': 'Արտարժույթի դրույքները բեռնվում են...',
    'converter.refreshData': 'Թարմացնել տվյալները',
    'converter.enterAmount': 'Ներմուծեք փոխարկման գումարը',
    'converter.exchangeRate': 'Փոխարժեք',
    'converter.rate': 'Դրույք',
    'converter.to': 'Ուր',
    'converter.from': 'Որտեղից',
    'converter.selectCurrencies': 'Ընտրեք արժույթները՝ փոխարկումը տեսնելու համար',
    'converter.professional': 'Արժույթի մասնագիտական փոխարկիչ իրական ժամանակի դրույքներով և բարդ գործառույթներով',
    'converter.conversionResult': '{amount} {fromCurrency} = {convertedAmount} {toCurrency}',
    'converter.exchangeRateResult': '{rateLabel}: 1 {fromCurrency} = {rate} {toCurrency}',
    'converter.backToDashboard': '← Վերադարձ դեպի վահանակ',
    
    'settings.language': 'Լեզու',
    'common.loading': 'Բեռնում...',
    'common.error': 'Սխալ',
    'common.retry': 'Կրկին փորձել',
    'common.close': 'Փակել',
    'common.save': 'Պահպանել',
    'common.cancel': 'Չեղարկել',
    'common.delete': 'Հեռացնել',
    'common.more': 'Ավելի',
    'common.less': 'Ավելի քիչ',
    'common.ok': 'OK',
    
    // Authentication
    'auth.signin': 'Մուտք գործել',
    'auth.signup': 'Գրանցվել',
    'auth.welcome': 'Բարի գալուստ',
    'auth.signout': 'Ելք գործել',
    'auth.continueWithEmail': 'Շարունակել էլ-փոստով',
    'auth.continueWithGoogle': 'Շարունակել Google-ով',
    'auth.continueWithApple': 'Շարունակել Apple-ով',
    'auth.alreadyHaveAccount': 'Արդե՞ն ունեք հաշիվ',
    'auth.dontHaveAccount': "Չունե՞ք հաշիվ",
    'auth.signIn': 'Մուտք գործել',
    'auth.signUp': 'Գրանցվել',
    'auth.email': 'Էլ-փոստ',
    'auth.password': 'Գաղտնաբառ',
    'auth.confirmPassword': 'Հաստատել գաղտնաբառը',
    'auth.username': 'Օգտանուն',
    'auth.createAccount': 'Ստեղծել հաշիվ',
    'auth.creatingAccount': 'Հաշիվը ստեղծվում է...',
    'auth.signingIn': 'Մուտք գործում...',
    'auth.signingOut': 'Ելք գործում...',

    // Multi-Currency
    'multi.title': 'Բազմարժույթ փոխարկիչ',
    'multi.subtitle': 'Արագ փոխարկում բազմաթիվ արժույթներով իրական ժամանակի դրույքներով',
    'multi.from': 'Որտեղից',
    'multi.to': 'Ուր',
    'multi.amount': 'Գումար',
    'multi.rates': 'Փոխարժեքներ',
    'multi.manage': 'Կառավարել արժույթները',
    'multi.emptyState': 'Սեղմեք "Ավելացնել արժույթ" որպեսզի ընտրեք փոխարկման համար',
    'multi.alreadyInList': 'արդեն գոյություն ունի ձեր փոխարկման ցանկում: Խնդրում ենք ընտրեք այլ արժույթ:',
    'multi.selectCurrency': 'Ընտրել արժույթ',
    'multi.addCurrency': '+ Ավելացնել արժույթ',
    'multi.convertTo': 'Փոխարկել դեպի',
    'multi.titleComponent': '🔄 Բազմարժույթ փոխարկիչ',

    // Currency Picker & Dynamic
    'picker.selectCurrency': 'Ընտրել արժույթ',
    'picker.searchCurrencies': 'Որոնել արժույթներ',
    'picker.frequentlyUsed': '⭐ Հաճախ օգտագործվող',
    'picker.close': 'Փակել',

    // Dynamic Content
    'dynamic.savedCount': '({count})',

    // Saved Rates
    'saved.title': 'Պահպանված',
    'saved.titles': 'Պահպանված դրույքներ', // Alias for compatibility
    'saved.shortTitle': 'Պահպանված', // Short version for constrained layouts
    'saved.noRates': 'Դեռ չկան պահպանված դրույքներ: Փոխարկեք արժույթները և սեղմեք "Պահպանել այս դրույքը" որպեսզի որևէ բան ավելացնեք:',
    'saved.savedOn': 'Պահպանվել է',
    'saved.at': 'ժամը',

    // Errors & Messages
    'error.duplicateCurrency': 'Կրկնվող արժույթ',
    
    // Features
    'feature.multiCurrency.title': 'Բազմարժույթ փոխարկիչ',
    'feature.multiCurrency.desc': 'Արագ փոխարկում բազմաթիվ արժույթներով իրական ժամանակի դրույքներով',
    'feature.calculator.title': 'Հաշվիչի ինտեգրում',
    'feature.calculator.desc': 'Ներկառուցված հաշվիչ գումարի հաշվարկների համար',
    'feature.offline.title': 'Անցանց ռեժիմ',
    'feature.offline.desc': 'Աշխատում է առանց ինտերնետի` օգտագործելով քեշավորված դրույքները',
    'feature.location.title': 'Ավտոմատ տեղն որոշում',
    'feature.location.desc': 'Ավտոմատ կերպով որոշում է երկիրը և սահմանում է լռելյայն արժույթը',
    'feature.caching.title': 'Խելացի քեշավորում',
    'feature.caching.desc': 'Խելացի դրույքի քեշավորում անցանց պահեստավորումներով',
    
    'footer.copyright': '© 2025 {appTitle} - {suiteName}',
    'footer.suiteName': 'Արժույթի մասնագիտական փոխարկիչների հավաքածու',
    'footer.terms': 'Օգտագործման պայմաններ և գաղտնիություն',
    
    // Date/Time
    'time.lastUpdate': 'Վերջին թարմացում',
    'time.nextUpdate': 'Հաջորդ թարմացում',
    
    'error.network': 'Խնդիր ցանցում: Խնդրում ենք ստուգել կապը:',
    'error.loading': 'Չհաջողվեց բեռնել տվյալները: Խնդրում ենք կրկին փորձել:',
    'success.rateSaved': 'Դրույքը հաջողությամբ պահպանվեց:',
  },
  ru: {
    // Russian
    'app.title': 'РейтСнап',
    'app.subtitle': 'Профессиональный набор конвертеров валют',
    
    'dashboard.title': 'Панель',
    'dashboard.converter': 'Конвертер',
    'dashboard.multiCurrency': 'Мультивалютный',
    'dashboard.rateAlerts': 'Уведомления о курсах',
    'dashboard.savedRates': 'Сохраненные курсы',
    'dashboard.features': 'Возможности панели',
    'dashboard.features.description': 'Полный набор конвертации валют с расширенными функциями',
    
    // Compact versions for header buttons
    'auth.signin.compact': 'Вход',
    'auth.signup.compact': 'Регистрация',
    'auth.signout.compact': 'Выход',
    'auth.welcome.compact': 'Привет',
    'converter.title.compact': 'Конв',
    
    'quick.action.converter': 'Конвертер валют',
    'quick.action.converter.desc': 'Профессиональный конвертер со всеми функциями',
    'quick.action.multiCurrency': 'Мультивалютный',
    'quick.action.multiCurrency.desc': 'Быстрая конвертация в 20 валют',
    'quick.action.multiCurrency.hide': 'Скрыть инструмент конвертации',
    'quick.action.rateAlerts': 'Уведомления о курсах',
    'quick.action.rateAlerts.desc': 'Установите целевые курсы для мониторинга валют',
    'quick.action.rateAlerts.hide': 'Скрыть уведомления',
    'quick.action.savedRates': 'Сохраненные курсы',
    'quick.action.savedRates.desc': 'Быстрый доступ к избранному',
    'quick.action.savedRates.hide': 'Скрыть сохраненные курсы',
    
    'converter.title': 'Конвертер валют',
    'converter.subtitle': 'Полный набор конвертации валют с расширенными функциями',
    'converter.standard': 'Стандартная конвертация',
    'converter.multiCurrency.section': 'Мультивалютный конвертер',
    'converter.calculator': 'Калькулятор',
    'converter.saveRate': 'Сохранить этот курс',
    'converter.disclaimer': 'Профессиональный конвертер валют с курсами в реальном времени и расширенными функциями',
    'converter.loadingRates': 'Загрузка курсов валют...',
    'converter.refreshData': 'Обновить данные',
    'converter.enterAmount': 'Введите сумму для конвертации',
    'converter.exchangeRate': 'Обменный курс',
    'converter.rate': 'Курс',
    'converter.to': 'В',
    'converter.from': 'Из',
    'converter.selectCurrencies': 'Выберите валюты для просмотра конвертации',
    'converter.professional': 'Профессиональный конвертер валют с курсами в реальном времени и расширенными функциями',
    'converter.conversionResult': '{amount} {fromCurrency} = {convertedAmount} {toCurrency}',
    'converter.exchangeRateResult': '{rateLabel}: 1 {fromCurrency} = {rate} {toCurrency}',
    'converter.backToDashboard': '← Назад к панели',
    
    'settings.language': 'Язык',
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.retry': 'Повторить',
    'common.close': 'Закрыть',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.more': 'Больше',
    'common.less': 'Меньше',
    'common.ok': 'OK',

    // Multi-Currency
    'multi.title': 'Мультивалютный конвертер',
    'multi.subtitle': 'Быстрая конвертация в несколько валют с курсами в реальном времени',
    'multi.from': 'Из',
    'multi.to': 'В',
    'multi.amount': 'Сумма',
    'multi.rates': 'Обменные курсы',
    'multi.manage': 'Управление валютами',
    'multi.emptyState': 'Нажмите "Добавить валюту" для выбора валют для конвертации',
    'multi.alreadyInList': 'уже есть в вашем списке конвертации. Пожалуйста, выберите другую валюту.',
    'multi.selectCurrency': 'Выберите валюту',
    'multi.addCurrency': '+ Добавить валюту',
    'multi.convertTo': 'Конвертировать в',
    'multi.titleComponent': '🔄 Мультивалютный конвертер',

    // Currency Picker & Dynamic
    'picker.selectCurrency': 'Выберите валюту',
    'picker.searchCurrencies': 'Поиск валют',
    'picker.frequentlyUsed': '⭐ Часто используемые',
    'picker.close': 'Закрыть',

    // Dynamic Content
    'dynamic.savedCount': '({count})',

    // Saved Rates
    'saved.title': 'Сохраненные курсы',
    'saved.titles': 'Сохраненные курсы', // Alias for compatibility
    'saved.shortTitle': 'Сохраненные', // Short version for constrained layouts
    'saved.noRates': 'Пока нет сохраненных курсов. Конвертируйте валюты и нажмите "Сохранить этот курс", чтобы добавить!',
    'saved.savedOn': 'Сохранено',
    'saved.at': 'в',

    // Errors & Messages
    'error.duplicateCurrency': 'Дубликат валюты',
    
    'feature.multiCurrency.title': 'Мультивалютный конвертер',
    'feature.multiCurrency.desc': 'Быстрая конвертация в несколько валют с курсами в реальном времени',
    'feature.calculator.title': 'Интеграция калькулятора',
    'feature.calculator.desc': 'Встроенный калькулятор для расчета сумм',
    'feature.offline.title': 'Автономный режим',
    'feature.offline.desc': 'Работает без интернета, используя кэшированные курсы',
    'feature.location.title': 'Автоопределение местоположения',
    'feature.location.desc': 'Автоматически определяет вашу страну и устанавливает валюту по умолчанию',
    'feature.caching.title': 'Умное кэширование',
    'feature.caching.desc': 'Интеллектуальное кэширование курсов с автономными резервными копиями',
    
    'footer.copyright': '© 2025 {appTitle} - {suiteName}',
    'footer.suiteName': 'Профессиональный набор конвертеров валют',
    'footer.terms': 'Условия использования и конфиденциальность',
    
    // Date/Time
    'time.lastUpdate': 'Последнее обновление',
    'time.nextUpdate': 'Следующее обновление',
    
    // Authentication
    'auth.signin': 'Войти',
    'auth.signup': 'Зарегистрироваться',
    'auth.welcome': 'Добро пожаловать',
    'auth.signout': 'Выйти',
    'auth.continueWithEmail': 'Продолжить с email',
    'auth.continueWithGoogle': 'Продолжить с Google',
    'auth.continueWithApple': 'Продолжить с Apple',
    'auth.alreadyHaveAccount': 'Уже есть аккаунт?',
    'auth.dontHaveAccount': "Нет аккаунта?",
    'auth.signIn': 'Войти',
    'auth.signUp': 'Зарегистрироваться',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.confirmPassword': 'Подтвердить пароль',
    'auth.username': 'Имя пользователя',
    'auth.createAccount': 'Создать аккаунт',
    'auth.creatingAccount': 'Создаю аккаунт...',
    'auth.signingIn': 'Вхожу...',
    'auth.signingOut': 'Выхожу...',
    
    'error.network': 'Ошибка сети. Проверьте подключение.',
    'error.loading': 'Не удалось загрузить данные. Попробуйте снова.',
    'success.rateSaved': 'Курс успешно сохранен!',
  },
  es: {
    // Spanish
    'app.title': 'RateSnap',
    'app.subtitle': 'Suite Profesional de Conversores de Moneda',
    
    'dashboard.title': 'Panel',
    'dashboard.converter': 'Convertidor',
    'dashboard.multiCurrency': 'Multi Moneda',
    'dashboard.rateAlerts': 'Alertas de Tipo',
    'dashboard.savedRates': 'Tasas Guardadas',
    'dashboard.features': 'Características del Panel',
    'dashboard.features.description': 'Suite completa de conversión de moneda con funciones avanzadas',
    
    'quick.action.converter': 'Convertidor de Moneda',
    'quick.action.converter.desc': 'Convertidor profesional con todas las funciones',
    'quick.action.multiCurrency': 'Multi Moneda',
    'quick.action.multiCurrency.desc': 'Conversiones rápidas a 20 monedas',
    'quick.action.multiCurrency.hide': 'Ocultar herramienta de conversión',
    'quick.action.rateAlerts': 'Alertas de Tipo',
    'quick.action.rateAlerts.desc': 'Establece tipos objetivo para monitoreo de moneda',
    'quick.action.rateAlerts.hide': 'Ocultar alertas',
    'quick.action.savedRates': 'Tasas Guardadas',
    'quick.action.savedRates.desc': 'Acceso rápido a favoritos',
    'quick.action.savedRates.hide': 'Ocultar tasas guardadas',
    
    'converter.title': 'Convertidor de Moneda',
    'converter.subtitle': 'Suite completa de conversión de moneda con funciones avanzadas',
    'converter.standard': 'Conversión Estándar',
    'converter.multiCurrency.section': 'Convertidor Multi-Moneda',
    'converter.calculator': 'Calculadora',
    'converter.saveRate': 'Guardar Esta Tasa',
    'converter.disclaimer': 'Convertidor de moneda profesional con tasas en tiempo real y funciones avanzadas',
    'converter.loadingRates': 'Cargando tipos de cambio...',
    'converter.refreshData': 'Actualizar Datos',
    'converter.enterAmount': 'Ingrese cantidad a convertir',
    'converter.exchangeRate': 'Tipo de Cambio',
    'converter.rate': 'Tasa',
    'converter.to': 'A',
    'converter.from': 'De',
    'converter.selectCurrencies': 'Seleccione monedas para ver conversión',
    'converter.professional': 'Convertidor de moneda profesional con tasas en tiempo real y funciones avanzadas',
    'converter.conversionResult': '{amount} {fromCurrency} = {convertedAmount} {toCurrency}',
    'converter.exchangeRateResult': '{rateLabel}: 1 {fromCurrency} = {rate} {toCurrency}',
    'converter.backToDashboard': '← Volver al Panel',
    
    'settings.language': 'Idioma',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.retry': 'Reintentar',
    'common.close': 'Cerrar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.more': 'Más',
    'common.less': 'Menos',
    'common.ok': 'OK',

    // Multi-Currency
    'multi.title': 'Convertidor Multi-Moneda',
    'multi.subtitle': 'Convierte a múltiples monedas instantáneamente con tasas en vivo',
    'multi.from': 'De',
    'multi.to': 'A',
    'multi.amount': 'Cantidad',
    'multi.rates': 'Tipos de Cambio',
    'multi.manage': 'Gestionar Monedas',
    'multi.emptyState': 'Haz clic en "Agregar Moneda" para seleccionar monedas para conversión',
    'multi.alreadyInList': 'ya está en tu lista de conversión. Por favor selecciona una moneda diferente.',
    'multi.selectCurrency': 'Seleccionar moneda',
    'multi.addCurrency': '+ Agregar Moneda',
    'multi.convertTo': 'Convertir a',
    'multi.titleComponent': '🔄 Convertidor Multi-Moneda',

    // Currency Picker & Dynamic
    'picker.selectCurrency': 'Seleccionar Moneda',
    'picker.searchCurrencies': 'Buscar monedas',
    'picker.frequentlyUsed': '⭐ Frecuentemente Usadas',
    'picker.close': 'Cerrar',

    // Dynamic Content
    'dynamic.savedCount': '({count})',

    // Saved Rates
    'saved.title': 'Tasas Guardadas',
    'saved.titles': 'Tasas Guardadas', // Alias for compatibility
    'saved.shortTitle': 'Guardadas', // Short version for constrained layouts
    'saved.noRates': 'Aún no hay tasas guardadas. ¡Convierte monedas y haz clic en "Guardar Esta Tasa" para agregar algunas!',
    'saved.savedOn': 'Guardado el',
    'saved.at': 'a las',

    // Errors & Messages
    'error.duplicateCurrency': 'Moneda Duplicada',
    
    'feature.multiCurrency.title': 'Convertidor Multi-Moneda',
    'feature.multiCurrency.desc': 'Convierte a múltiples monedas instantáneamente con tasas en vivo',
    'feature.calculator.title': 'Integración de Calculadora',
    'feature.calculator.desc': 'Calculadora integrada para cálculos de cantidad',
    'feature.offline.title': 'Modo Sin Conexión',
    'feature.offline.desc': 'Funciona sin internet usando tasas en caché',
    'feature.location.title': 'Detección Automática de Ubicación',
    'feature.location.desc': 'Detecta automáticamente tu país y establece la moneda por defecto',
    'feature.caching.title': 'Almacenamiento Inteligente',
    'feature.caching.desc': 'Almacenamiento inteligente de tasas con respaldos sin conexión',
    
    'footer.copyright': '© 2025 {appTitle} - {suiteName}',
    'footer.suiteName': 'Suite Profesional de Conversores de Moneda',
    'footer.terms': 'Términos de Uso y Privacidad',
    
    // Date/Time
    'time.lastUpdate': 'Última Actualización',
    'time.nextUpdate': 'Próxima Actualización',
    
    // Authentication
    'auth.signin': 'Iniciar Sesión',
    'auth.signup': 'Registrarse',
    'auth.welcome': 'Bienvenido',
    'auth.signout': 'Cerrar Sesión',
    'auth.continueWithEmail': 'Continuar con Email',
    'auth.continueWithGoogle': 'Continuar con Google',
    'auth.continueWithApple': 'Continuar con Apple',
    'auth.alreadyHaveAccount': '¿Ya tienes una cuenta?',
    'auth.dontHaveAccount': "¿No tienes una cuenta?",
    'auth.signIn': 'Iniciar Sesión',
    'auth.signUp': 'Registrarse',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.username': 'Nombre de Usuario',
    'auth.createAccount': 'Crear Cuenta',
    'auth.creatingAccount': 'Creando Cuenta...',
    'auth.signingIn': 'Iniciando Sesión...',
    'auth.signingOut': 'Cerrando Sesión...',
    
    'error.network': 'Error de red. Verifica tu conexión.',
    'error.loading': 'Error al cargar datos. Inténtalo de nuevo.',
    'success.rateSaved': '¡Tasa guardada exitosamente!',
  },
  zh: {
    // Chinese (Simplified)
    'app.title': '汇率快手',
    'app.subtitle': '专业货币转换器套件',
    
    'dashboard.title': '仪表板',
    'dashboard.converter': '转换器',
    'dashboard.multiCurrency': '多货币',
    'dashboard.rateAlerts': '汇率提醒',
    'dashboard.savedRates': '已保存汇率',
    'dashboard.features': '仪表板功能',
    'dashboard.features.description': '带高级功能的完整货币转换套件',
    
    'quick.action.converter': '货币转换器',
    'quick.action.converter.desc': '带所有功能的专业转换器',
    'quick.action.multiCurrency': '多货币',
    'quick.action.multiCurrency.desc': '快速转换为20种货币',
    'quick.action.multiCurrency.hide': '隐藏转换工具',
    'quick.action.rateAlerts': '汇率提醒',
    'quick.action.rateAlerts.desc': '设置货币监控的目标汇率',
    'quick.action.rateAlerts.hide': '隐藏提醒',
    'quick.action.savedRates': '已保存汇率',
    'quick.action.savedRates.desc': '快速访问收藏夹',
    'quick.action.savedRates.hide': '隐藏已保存汇率',
    
    'converter.title': '货币转换器',
    'converter.subtitle': '带高级功能的完整货币转换套件',
    'converter.standard': '标准转换',
    'converter.multiCurrency.section': '多货币转换器',
    'converter.calculator': '计算器',
    'converter.saveRate': '保存此汇率',
    'converter.disclaimer': '带实时汇率和高级功能的专业货币转换器',
    'converter.loadingRates': '正在加载汇率...',
    'converter.refreshData': '刷新数据',
    'converter.enterAmount': '输入要转换的金额',
    'converter.exchangeRate': '汇率',
    'converter.rate': '汇率',
    'converter.to': '到',
    'converter.from': '从',
    'converter.selectCurrencies': '选择货币以查看转换',
    'converter.professional': '带实时汇率和高级功能的专业货币转换器',
    'converter.conversionResult': '{amount} {fromCurrency} = {convertedAmount} {toCurrency}',
    'converter.exchangeRateResult': '{rateLabel}: 1 {fromCurrency} = {rate} {toCurrency}',
    'converter.backToDashboard': '← 返回仪表板',
    
    'settings.language': '语言',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.retry': '重试',
    'common.close': '关闭',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.more': '更多',
    'common.less': '更少',
    'common.ok': 'OK',

    // Multi-Currency
    'multi.title': '多货币转换器',
    'multi.subtitle': '使用实时汇率即时转换为多种货币',
    'multi.from': '从',
    'multi.to': '到',
    'multi.amount': '金额',
    'multi.rates': '汇率',
    'multi.manage': '管理货币',
    'multi.emptyState': '点击"添加货币"选择要转换的货币',
    'multi.alreadyInList': '已在您的转换列表中。请选择其他货币。',
    'multi.selectCurrency': '选择货币',
    'multi.addCurrency': '+ 添加货币',
    'multi.convertTo': '转换为',
    'multi.titleComponent': '🔄 多货币转换器',

    // Currency Picker & Dynamic
    'picker.selectCurrency': '选择货币',
    'picker.searchCurrencies': '搜索货币',
    'picker.frequentlyUsed': '⭐ 常用货币',
    'picker.close': '关闭',

    // Dynamic Content
    'dynamic.savedCount': '({count})',

    // Saved Rates
    'saved.title': '已保存汇率',
    'saved.titles': '已保存汇率', // Alias for compatibility
    'saved.shortTitle': '已保存', // Short version for constrained layouts
    'saved.noRates': '还没有保存的汇率。转换货币并点击"保存此汇率"来添加一些！',
    'saved.savedOn': '保存于',
    'saved.at': '时间',

    // Errors & Messages
    'error.duplicateCurrency': '重复货币',
    
    'feature.multiCurrency.title': '多货币转换器',
    'feature.multiCurrency.desc': '使用实时汇率即时转换为多种货币',
    'feature.calculator.title': '计算器集成',
    'feature.calculator.desc': '内置计算器用于金额计算',
    'feature.offline.title': '离线模式',
    'feature.offline.desc': '使用缓存汇率无需互联网即可工作',
    'feature.location.title': '自动检测位置',
    'feature.location.desc': '自动检测您的国家并设置默认货币',
    'feature.caching.title': '智能缓存',
    'feature.caching.desc': '智能汇率缓存和离线备份',
    
    'footer.copyright': '© 2025 {appTitle} - {suiteName}',
    'footer.suiteName': '专业货币转换器套件',
    'footer.terms': '使用条款和隐私',
    
    // Date/Time
    'time.lastUpdate': '最后更新',
    'time.nextUpdate': '下次更新',
    
    // Authentication
    'auth.signin': '登录',
    'auth.signup': '注册',
    'auth.welcome': '欢迎',
    'auth.signout': '退出',
    'auth.continueWithEmail': '使用邮箱继续',
    'auth.continueWithGoogle': '使用Google继续',
    'auth.continueWithApple': '使用Apple继续',
    'auth.alreadyHaveAccount': '已有账户？',
    'auth.dontHaveAccount': "没有账户？",
    'auth.signIn': '登录',
    'auth.signUp': '注册',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.username': '用户名',
    'auth.createAccount': '创建账户',
    'auth.creatingAccount': '正在创建账户...',
    'auth.signingIn': '正在登录...',
    'auth.signingOut': '正在退出...',
    
    'error.network': '网络错误。请检查您的连接。',
    'error.loading': '数据加载失败。请重试。',
    'success.rateSaved': '汇率保存成功！',
  },
  hi: {
    // Hindi
    'app.title': 'RateSnap',
    'app.subtitle': 'पेशेवर मुद्रा कन्वर्टर सूट',
    
    'dashboard.title': 'डैशबोर्ड',
    'dashboard.converter': 'कन्वर्टर',
    'dashboard.multiCurrency': 'मल्टी करेंसी',
    'dashboard.rateAlerts': 'रेट अलर्ट्स',
    'dashboard.savedRates': 'सेव्ड रेट्स',
    'dashboard.features': 'डैशबोर्ड फीचर्स',
    'dashboard.features.description': 'उन्नत सुविधाओं के साथ पूर्ण मुद्रा रूपांतरण सूट',
    
    'quick.action.converter': 'मुद्रा कन्वर्टर',
    'quick.action.converter.desc': 'सभी सुविधाओं के साथ पेशेवर कन्वर्टर',
    'quick.action.multiCurrency': 'मल्टी करेंसी',
    'quick.action.multiCurrency.desc': '20 मुद्राओं में त्वरित रूपांतरण',
    'quick.action.multiCurrency.hide': 'रूपांतरण टूल छुपाएं',
    'quick.action.rateAlerts': 'रेट अलर्ट्स',
    'quick.action.rateAlerts.desc': 'मुद्रा निगरानी के लिए लक्ष्य दरें निर्धारित करें',
    'quick.action.rateAlerts.hide': 'अलर्ट्स छुपाएं',
    'quick.action.savedRates': 'सेव्ड रेट्स',
    'quick.action.savedRates.desc': 'पसंदीदा तक त्वरित पहुंच',
    'quick.action.savedRates.hide': 'सेव्ड रेट्स छुपाएं',
    
    'converter.title': 'मुद्रा कन्वर्टर',
    'converter.subtitle': 'उन्नत सुविधाओं के साथ पूर्ण मुद्रा रूपांतरण सूट',
    'converter.standard': 'मानक रूपांतरण',
    'converter.multiCurrency.section': 'मल्टी-करेंसी कन्वर्टर',
    'converter.calculator': 'कैलकुलेटर',
    'converter.saveRate': 'इस दर को सेव करें',
    'converter.disclaimer': 'रियल-टाइम दरों और उन्नत सुविधाओं के साथ पेशेवर मुद्रा कन्वर्टर',
    'converter.loadingRates': 'एक्सचेंज रेट लोड हो रहे हैं...',
    'converter.refreshData': 'डेटा रिफ्रेश करें',
    'converter.enterAmount': 'रूपांतरण के लिए राशि दर्ज करें',
    'converter.exchangeRate': 'एक्सचेंज रेट',
    'converter.rate': 'दर',
    'converter.to': 'को',
    'converter.from': 'से',
    'converter.selectCurrencies': 'रूपांतरण देखने के लिए मुद्राएं चुनें',
    'converter.professional': 'रियल-टाइम दरों और उन्नत सुविधाओं के साथ पेशेवर मुद्रा कन्वर्टर',
    'converter.conversionResult': '{amount} {fromCurrency} = {convertedAmount} {toCurrency}',
    'converter.exchangeRateResult': '{rateLabel}: 1 {fromCurrency} = {rate} {toCurrency}',
    'converter.backToDashboard': '← डैशबोर्ड पर वापस जाएं',
    
    'settings.language': 'भाषा',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'एरर',
    'common.retry': 'पुनः प्रयास करें',
    'common.close': 'बंद करें',
    'common.save': 'सेव करें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'डिलीट करें',
    'common.more': 'और',
    'common.less': 'कम',
    'common.ok': 'OK',

    // Multi-Currency
    'multi.title': 'मल्टी-करेंसी कन्वर्टर',
    'multi.subtitle': 'लाइव दरों के साथ तुरंत कई मुद्राओं में रूपांतरण',
    'multi.from': 'से',
    'multi.to': 'को',
    'multi.amount': 'राशि',
    'multi.rates': 'एक्सचेंज रेट्स',
    'multi.manage': 'मुद्राएं मैनेज करें',
    'multi.emptyState': 'रूपांतरण के लिए मुद्राएं चुनने के लिए "करेंसी जोड़ें" पर क्लिक करें',
    'multi.alreadyInList': 'पहले से ही आपकी रूपांतरण सूची में है। कृपया एक अलग मुद्रा चुनें।',
    'multi.selectCurrency': 'मुद्रा चुनें',
    'multi.addCurrency': '+ करेंसी जोड़ें',
    'multi.convertTo': 'में बदलें',
    'multi.titleComponent': '🔄 मल्टी-करेंसी कन्वर्टर',

    // Currency Picker & Dynamic
    'picker.selectCurrency': 'मुद्रा चुनें',
    'picker.searchCurrencies': 'मुद्राएं खोजें',
    'picker.frequentlyUsed': '⭐ अक्सर उपयोग की जाने वाली',
    'picker.close': 'बंद करें',

    // Dynamic Content
    'dynamic.savedCount': '({count})',

    // Saved Rates
    'saved.title': 'सेव्ड रेट्स',
    'saved.titles': 'सेव्ड रेट्स', // Alias for compatibility
    'saved.shortTitle': 'सेव्ड', // Short version for constrained layouts
    'saved.noRates': 'अभी तक कोई सेव्ड रेट्स नहीं। मुद्राएं बदलें और कुछ जोड़ने के लिए "इस दर को सेव करें" पर क्लिक करें!',
    'saved.savedOn': 'सेव किया गया',
    'saved.at': 'पर',

    // Errors & Messages
    'error.duplicateCurrency': 'डुप्लिकेट करेंसी',
    
    'feature.multiCurrency.title': 'मल्टी-करेंसी कन्वर्टर',
    'feature.multiCurrency.desc': 'लाइव दरों के साथ तुरंत कई मुद्राओं में रूपांतरण',
    'feature.calculator.title': 'कैलकुलेटर इंटीग्रेशन',
    'feature.calculator.desc': 'राशि गणनाओं के लिए बिल्ट-इन कैलकुलेटर',
    'feature.offline.title': 'ऑफ़लाइन मोड',
    'feature.offline.desc': 'कैश्ड दरों का उपयोग करके बिना इंटरनेट के काम करता है',
    'feature.location.title': 'ऑटो-लोकेशन डिटेक्शन',
    'feature.location.desc': 'स्वचालित रूप से आपका देश पहचानता है और डिफ़ॉल्ट करेंसी सेट करता है',
    'feature.caching.title': 'स्मार्ट कैशिंग',
    'feature.caching.desc': 'ऑफ़लाइन बैकअप के साथ स्मार्ट रेट कैशिंग',
    
    'footer.copyright': '© 2025 {appTitle} - {suiteName}',
    'footer.suiteName': 'पेशेवर मुद्रा कन्वर्टर सूट',
    'footer.terms': 'उपयोग की शर्तें और गोपनीयता',
    
    // Date/Time
    'time.lastUpdate': 'अंतिम अपडेट',
    'time.nextUpdate': 'अगला अपडेट',
    
    // Authentication
    'auth.signin': 'साइन इन',
    'auth.signup': 'साइन अप',
    'auth.welcome': 'स्वागत है',
    'auth.signout': 'साइन आउट',
    'auth.continueWithEmail': 'ईमेल के साथ जारी रखें',
    'auth.continueWithGoogle': 'Google के साथ जारी रखें',
    'auth.continueWithApple': 'Apple के साथ जारी रखें',
    'auth.alreadyHaveAccount': 'क्या आपके पास पहले से खाता है?',
    'auth.dontHaveAccount': "खाता नहीं है?",
    'auth.signIn': 'साइन इन',
    'auth.signUp': 'साइन अप',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'auth.username': 'यूजरनेम',
    'auth.createAccount': 'खाता बनाएं',
    'auth.creatingAccount': 'खाता बनाया जा रहा है...',
    'auth.signingIn': 'साइन इन हो रहा है...',
    'auth.signingOut': 'साइन आउट हो रहा है...',
    
    'error.network': 'नेटवर्क एरर। कृपया अपना कनेक्शन चेक करें।',
    'error.loading': 'डेटा लोड करने में असफल। कृपया पुनः प्रयास करें।',
    'success.rateSaved': 'रेट सफलतापूर्वक सेव किया गया!',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage && ['en', 'hy', 'ru', 'es', 'zh', 'hi'].includes(savedLanguage)) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('appLanguage', lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  const tWithParams = (key: string, params: { [key: string]: string | number }): string => {
    let translation = (translations[language] as any)[key] || key;
    
    // Replace placeholders like {amount}, {fromCurrency}, etc.
    Object.keys(params).forEach(paramKey => {
      const placeholder = `{${paramKey}}`;
      translation = translation.replace(new RegExp(placeholder, 'g'), String(params[paramKey]));
    });
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tWithParams }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};