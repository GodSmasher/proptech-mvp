🏠 **Automatische Extraktion wichtiger Informationen aus Immobilien-PDFs**

## ✨ Features

- 🔐 **Benutzer-Authentifizierung** (Registrierung & Login)
- 💳 **Credit-System** mit Stripe-Zahlungen
- 📄 **PDF-Upload** (Drag & Drop)
- 🤖 **KI-Analyse** mit OpenAI GPT-4
- 📊 **Dashboard** mit Dokumenten-Verlauf
- 💰 **Bezahlsystem** für zusätzliche Credits
- 📱 **Responsive Design**

## 🚀 Schnellstart für Replit

### 1. Repository Setup
\`\`\`bash
# Klone oder lade den Code in dein Replit-Projekt
# Alle Dateien in den Root-Ordner
\`\`\`

### 2. Dependencies installieren
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables (.env)
Erstelle eine \`.env\` Datei mit folgenden Variablen:

\`\`\`env
JWT_SECRET=dein-super-geheimer-jwt-key
OPENAI_API_KEY=sk-dein-openai-api-key
STRIPE_SECRET_KEY=sk_test_dein-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_dein-stripe-publishable-key
PORT=3000
\`\`\`

### 4. API Keys beschaffen

#### OpenAI API Key:
1. Gehe zu [platform.openai.com](https://platform.openai.com)
2. Registriere dich / logge dich ein
3. Navigiere zu "API Keys"
4. Erstelle einen neuen API Key
5. Füge ihn als \`OPENAI_API_KEY\` ein

#### Stripe Keys:
1. Gehe zu [stripe.com](https://stripe.com)
2. Erstelle einen Account
3. Im Dashboard: "Developers" → "API Keys"
4. Kopiere "Publishable key" und "Secret key" (Test-Modus)
5. Füge sie als \`STRIPE_PUBLISHABLE_KEY\` und \`STRIPE_SECRET_KEY\` ein

### 5. Starten
\`\`\`bash
npm start
\`\`\`

🎉 **Deine App läuft jetzt auf Port 3000!**

## 💡 Erste Schritte nach dem Start

### Als Benutzer:
1. Registriere dich (5 kostenlose Credits)
2. Lade ein PDF hoch
3. Analysiere das Dokument
4. Sieh dir die Ergebnisse an

### Als Entwickler:
1. Teste die Registrierung
2. Teste den PDF-Upload
3. Teste die Stripe-Integration
4. Überprüfe die Datenbank (proptech.db wird automatisch erstellt)

## 📁 Projektstruktur

\`\`\`
├── server.js              # Backend Server
├── package.json           # Dependencies
├── .env                   # Umgebungsvariablen
├── proptech.db           # SQLite Datenbank (automatisch erstellt)
├── public/
│   └── index.html        # Frontend SPA
└── uploads/              # PDF Upload Ordner
\`\`\`

## 💰 Monetarisierungsmodell

### Credit-Pakete:
- **10 Credits**: €9.90 (€0.99/Analyse)
- **25 Credits**: €19.90 (€0.80/Analyse)  
- **50 Credits**: €34.90 (€0.70/Analyse)

### Kostenstruktur:
- **OpenAI API**: ~€0.10-0.30 pro Analyse
- **Stripe Gebühren**: 2.9% + €0.25
- **Gewinnmarge**: ~60-70%

## 🔧 Technischer Stack

### Backend:
- **Express.js** - Web Framework
- **SQLite** - Datenbank
- **JWT** - Authentifizierung  
- **Multer** - File Upload
- **pdf-parse** - PDF Verarbeitung
- **Stripe** - Zahlungen
- **OpenAI API** - KI-Analyse

### Frontend:
- **Vanilla JavaScript** - Keine Frameworks
- **Tailwind CSS** - Styling
- **Stripe Elements** - Zahlungs-UI

## 📊 Datenbank Schema

### Users:
- id, email, password, name
- credits, subscription_status
- stripe_customer_id, created_at

### Documents:
- id, user_id, filename, original_name
- analysis_result, credits_used, created_at

### Transactions:
- id, user_id, type, amount
- description, stripe_payment_intent_id, created_at

## 🚀 Deployment Tipps

### Für Replit:
1. Setze \`PORT=3000\` in .env
2. Aktiviere "Always On" für 24/7 Betrieb
3. Nutze die Replit-Domain oder verbinde eigene Domain

### Für Produktion:
1. Ändere JWT_SECRET zu einem starken Key
2. Nutze Stripe Live-Keys statt Test-Keys
3. Setze NODE_ENV=production
4. Aktiviere HTTPS
5. Backup-Strategie für SQLite DB

## 🛡️ Sicherheit

- **Rate Limiting**: 100 Requests/15min
- **File Validation**: Nur PDFs, max 10MB
- **JWT Tokens**: 7 Tage Gültigkeit
- **Password Hashing**: bcrypt
- **Input Validation**: Alle Eingaben validiert

## 📈 Skalierung

### Wenn erfolgreich:
- **Database**: SQLite → PostgreSQL
- **File Storage**: Local → AWS S3/Cloudinary
- **Caching**: Redis für Sessions
- **Load Balancing**: Mehrere Server-Instanzen
- **Monitoring**: Error tracking, Analytics

## 🎯 Go-to-Market

### Zielgruppe:
- Immobilienmakler
- Anwaltskanzleien (Immobilienrecht)  
- Banken (Kreditprüfung)
- Immobilienverwaltungen
- Property Manager

### Marketing Kanäle:
- LinkedIn (B2B)
- Immobilien Facebook-Gruppen
- Google Ads ("Immobilien PDF analysieren")
- Cold E-Mail Kampagnen
- Immobilienmessen

## 🔄 Roadmap

### Phase 1 (Wochen 1-4):
- ✅ MVP Development
- ✅ Basic AI Analysis
- ✅ Payment Integration

### Phase 2 (Wochen 5-8):
- 📧 Email Benachrichtigungen
- 📊 Erweiterte Analytics
- 📤 Export Funktionen (Excel, Word)
- 🔍 Suchfunktion für Dokumente

### Phase 3 (Wochen 9-12):
- 👥 Team-Funktionen
- 🔗 API für Integrationen
- 📱 Mobile App
- 🌐 Mehrsprachigkeit

## ❓ Häufige Probleme & Lösungen

### "OpenAI API Error":
- Überprüfe API Key
- Prüfe OpenAI Account Guthaben
- Rate Limits beachten

### "Stripe Payment Failed":
- Test-Keys vs Live-Keys
- Webhook Endpoints konfigurieren
- CORS Einstellungen

### "File Upload Error":
- Dateigröße < 10MB
- Nur PDF-Dateien
- Uploads-Ordner Berechtigung

## 📞 Support & Community

- **GitHub Issues**: Bug Reports & Feature Requests
- **Discord**: Community Chat
- **Email**: support@proptech-ai.com

---

**Viel Erfolg mit deinem PropTech MVP! 🚀**

*Entwickelt für maximale Geschwindigkeit und Profitabilität.*
`;

// Write files
fs.writeFileSync('.env.example', envTemplate);
fs.writeFileSync('README.md', readmeContent);

console.log('📁 Files created:');
console.log('✅ server.js - Complete backend server');  
console.log('✅ package.json - Dependencies');
console.log('✅ public/index.html - Frontend SPA');
console.log('✅ .env.example - Environment template');
console.log('✅ README.md - Complete documentation');
console.log('');
console.log('🚀 Next steps:');
console.log('1. Copy .env.example to .env');
console.log('2. Add your API keys to .env');
console.log('3. Run: npm install');
console.log('4. Run: npm start');
console.log('5. Open http://localhost:3000');
console.log('');
console.log('💡 Need API keys?');
console.log('- OpenAI: https://platform.openai.com/api-keys');
console.log('- Stripe: https://dashboard.stripe.com/test/apikeys');
