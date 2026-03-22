# SafePay Mobile App — React Native / Expo

## პირველი გაშვება

1. **Node.js** დაყენება (თუ არ გაქვს): https://nodejs.org

2. **Expo CLI** დაყენება:
```
npm install -g expo-cli
```

3. **dependencies** დაყენება (safepay-app ფოლდერში):
```
npm install
```

4. **გაშვება:**
```
npx expo start
```

გაიხსნება QR კოდი. დაყენე **Expo Go** app ტელეფონზე:
- Android: Play Store → Expo Go
- iPhone: App Store → Expo Go

QR კოდი დაასკანე → ესაა!

---

## ფაილების სტრუქტურა

```
safepay-app/
├── App.js                        ← მთავარი entry point
├── app.json                      ← Expo კონფიგი
├── package.json                  ← dependencies
├── src/
│   ├── constants/
│   │   └── colors.js             ← ფერები + fmt()
│   ├── api/
│   │   └── apiFetch.js           ← API კლიენტი
│   ├── store/
│   │   └── useAuth.js            ← Auth state (AsyncStorage)
│   ├── i18n/
│   │   └── index.js              ← მრავალენოვნება
│   ├── components/
│   │   └── UI.js                 ← Btn, Card, Input, Toast...
│   ├── navigation/
│   │   └── AppNavigator.js       ← Navigation
│   └── screens/
│       ├── LoginScreen.js
│       ├── RegisterScreen.js
│       ├── DashboardScreen.js
│       ├── DealScreen.js
│       ├── WalletScreen.js
│       ├── CreateDealScreen.js
│       └── ProfileScreen.js
```

## API

ყველა request მიდის: `https://safepay-backend-27671206048.europe-west1.run.app/api`

ეს შეცვლა შეიძლება `src/api/apiFetch.js`-ში.
