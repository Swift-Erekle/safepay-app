// src/i18n/index.js — მინიმალური i18n
import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const translations = {
  ka: {
    "login.title": "შესვლა",
    "login.email": "ელ.ფოსტა",
    "login.password": "პაროლი",
    "login.btn": "შესვლა",
    "login.no.account": "ანგარიში არ გაქვს?",
    "register.title": "რეგისტრაცია",
    "register.name": "სახელი გვარი",
    "register.email": "ელ.ფოსტა",
    "register.password": "პაროლი",
    "register.phone": "ტელეფონი",
    "register.id": "პირადი ნომერი",
    "register.btn": "რეგისტრაცია",
    "register.have.account": "ანგარიში გაქვს?",
    "dash.title": "გარიგებები",
    "dash.create": "ახალი გარიგება",
    "dash.empty": "გარიგებები არ არის",
    "deal.amount": "თანხა",
    "deal.status": "სტატუსი",
    "deal.seller": "გამყიდველი",
    "deal.buyer": "მყიდველი",
    "deal.confirm": "დადასტურება",
    "deal.ship": "გაგზავნა",
    "deal.dispute": "დავა",
    "deal.cancel": "გაუქმება",
    "wallet.title": "საფულე",
    "wallet.balance": "ბალანსი",
    "wallet.frozen": "გაყინული",
    "wallet.topup": "შეტანა",
    "wallet.withdraw": "გატანა",
    "wallet.transfer": "გადარიცხვა",
    "profile.title": "პროფილი",
    "profile.logout": "გამოსვლა",
    "create.title": "ახალი გარიგება",
    "create.name": "სათაური",
    "create.amount": "თანხა (₾)",
    "create.desc": "აღწერა",
    "create.days": "ავტო-დადასტურება (დღე)",
    "create.btn": "გარიგების შექმნა",
    "loading": "იტვირთება...",
    "error.generic": "შეცდომა მოხდა",
    "save": "შენახვა",
    "cancel": "გაუქმება",
    "back": "უკან",
    "days": "დღე",
  },
  en: {
    "login.title": "Login",
    "login.email": "Email",
    "login.password": "Password",
    "login.btn": "Login",
    "login.no.account": "No account?",
    "register.title": "Register",
    "register.name": "Full Name",
    "register.email": "Email",
    "register.password": "Password",
    "register.phone": "Phone",
    "register.id": "Personal ID",
    "register.btn": "Register",
    "register.have.account": "Have an account?",
    "dash.title": "Deals",
    "dash.create": "New Deal",
    "dash.empty": "No deals yet",
    "deal.amount": "Amount",
    "deal.status": "Status",
    "deal.seller": "Seller",
    "deal.buyer": "Buyer",
    "deal.confirm": "Confirm",
    "deal.ship": "Ship",
    "deal.dispute": "Dispute",
    "deal.cancel": "Cancel",
    "wallet.title": "Wallet",
    "wallet.balance": "Balance",
    "wallet.frozen": "Frozen",
    "wallet.topup": "Top Up",
    "wallet.withdraw": "Withdraw",
    "wallet.transfer": "Transfer",
    "profile.title": "Profile",
    "profile.logout": "Logout",
    "create.title": "New Deal",
    "create.name": "Title",
    "create.amount": "Amount (₾)",
    "create.desc": "Description",
    "create.days": "Auto-confirm (days)",
    "create.btn": "Create Deal",
    "loading": "Loading...",
    "error.generic": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "back": "Back",
    "days": "days",
  },
  ru: {
    "login.title": "Вход",
    "login.email": "Эл. почта",
    "login.password": "Пароль",
    "login.btn": "Войти",
    "login.no.account": "Нет аккаунта?",
    "register.title": "Регистрация",
    "register.name": "Полное имя",
    "register.email": "Эл. почта",
    "register.password": "Пароль",
    "register.phone": "Телефон",
    "register.id": "Личный номер",
    "register.btn": "Зарегистрироваться",
    "register.have.account": "Есть аккаунт?",
    "dash.title": "Сделки",
    "dash.create": "Новая сделка",
    "dash.empty": "Сделок нет",
    "deal.amount": "Сумма",
    "deal.status": "Статус",
    "deal.seller": "Продавец",
    "deal.buyer": "Покупатель",
    "deal.confirm": "Подтвердить",
    "deal.ship": "Отправить",
    "deal.dispute": "Спор",
    "deal.cancel": "Отменить",
    "wallet.title": "Кошелёк",
    "wallet.balance": "Баланс",
    "wallet.frozen": "Заморожено",
    "wallet.topup": "Пополнить",
    "wallet.withdraw": "Вывести",
    "wallet.transfer": "Перевод",
    "profile.title": "Профиль",
    "profile.logout": "Выйти",
    "create.title": "Новая сделка",
    "create.name": "Название",
    "create.amount": "Сумма (₾)",
    "create.desc": "Описание",
    "create.days": "Авто-подтверждение (дни)",
    "create.btn": "Создать сделку",
    "loading": "Загрузка...",
    "error.generic": "Произошла ошибка",
    "save": "Сохранить",
    "cancel": "Отмена",
    "back": "Назад",
    "days": "дней",
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("ka");

  // Load saved language on mount
  useEffect(() => {
    AsyncStorage.getItem("safepay_lang").then(saved => {
      if (saved && translations[saved]) setLangState(saved);
    }).catch(() => {});
  }, []);

  const setLang = useCallback(async (l) => {
    setLangState(l);
    try {
      await AsyncStorage.setItem("safepay_lang", l);
    } catch {}
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations["ka"]?.[key] || key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
