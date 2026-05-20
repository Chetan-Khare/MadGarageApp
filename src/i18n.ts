import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      "login": {
        "title": "SECURE LOGIN",
        "subtitle": "Enter your credentials",
        "phone_placeholder": "Phone Number",
        "email_placeholder": "Enterprise Email",
        "password_placeholder": "Secret Key",
        "otp_placeholder": "6-Digit OTP",
        "login_button": "ESTABLISH LINK",
        "verify_button": "VERIFY & LOGIN",
        "send_otp": "SEND OTP",
        "resend_otp": "RESEND OTP",
        "resend_in": "RESEND OTP IN {{seconds}}s",
        "change_number": "← CHANGE NUMBER",
        "guest_mode": "CONTINUE AS GUEST",
        "business_partnership": "Business Partnership",
        "partnership_question": "ARE YOU A SELLER OR GARAGE?",
        "made_in_india": "MADE IN INDIA FOR INDIA"
      }
    }
  },
  hi: {
    translation: {
      "login": {
        "title": "सुरक्षित लॉगिन",
        "subtitle": "अपने क्रेडेंशियल्स दर्ज करें",
        "phone_placeholder": "फ़ोन नंबर",
        "email_placeholder": "एंटरप्राइज़ ईमेल",
        "password_placeholder": "सीक्रेट की",
        "otp_placeholder": "6-अंकीय ओटीपी",
        "login_button": "लिंक स्थापित करें",
        "verify_button": "सत्यापित करें और लॉगिन करें",
        "send_otp": "ओटीपी भेजें",
        "resend_otp": "ओटीपी पुन: भेजें",
        "resend_in": "{{seconds}}s में ओटीपी पुन: भेजें",
        "change_number": "← नंबर बदलें",
        "guest_mode": "अतिथि के रूप में जारी रखें",
        "business_partnership": "बिजनेस पार्टनरशिप",
        "partnership_question": "क्या आप विक्रेता या गैरेज हैं?",
        "made_in_india": "भारत के लिए भारत में निर्मित"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0].languageCode ?? 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
