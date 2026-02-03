import { createContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'te' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'login.title': 'School Management System',
    'login.subtitle': 'Welcome back! Please login to your account.',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.button': 'Sign In',
    'login.role': 'Select Role',
    'login.student': 'Student',
    'login.teacher': 'Teacher',
    'login.admin': 'Admin',
    'login.error': 'Invalid email or password',
    'common.loading': 'Loading...',
  },
  te: {
    'login.title': 'పాఠశాల నిర్వహణ వ్యవస్థ',
    'login.subtitle': 'స్వాగతం! దయచేసి మీ ఖాతాలోకి ప్రవేశించండి.',
    'login.email': 'ఇమెయిల్ చిరునామా',
    'login.password': 'పాస్‌వర్డ్',
    'login.button': 'సైన్ ఇన్ చేయండి',
    'login.role': 'పాత్రను ఎంచుకోండి',
    'login.student': 'విద్యార్థి',
    'login.teacher': 'ఉపాధ్యాయుడు',
    'login.admin': 'నిర్వాహకుడు',
    'login.error': 'చెల్లని ఇమెయిల్ లేదా పాస్‌వర్డ్',
    'common.loading': 'లోడ్ అవుతోంది...',
  },
  hi: {
    'login.title': 'स्कूल प्रबंधन प्रणाली',
    'login.subtitle': 'वापस स्वागत है! कृपया अपने खाते में लॉगिन करें।',
    'login.email': 'ईमेल पता',
    'login.password': 'पासवर्ड',
    'login.button': 'साइन इन करें',
    'login.role': 'भूमिका चुनें',
    'login.student': 'छात्र',
    'login.teacher': 'शिक्षक',
    'login.admin': 'व्यवस्थापक',
    'login.error': 'अमान्य ईमेल या पासवर्ड',
    'common.loading': 'लोड हो रहा है...',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
