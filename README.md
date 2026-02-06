DesiBill - Free Business Toolkit for India 🇮🇳

DesiBill is a comprehensive, privacy-focused web toolkit designed for Indian shopkeepers, freelancers, and small business owners. It provides essential daily utilities—from generating GST invoices to counting daily cash—without requiring any login, database, or server. Everything runs 100% in the client's browser.

🚀 Tool Suite

1. 🧾 Free Invoice Generator

Core Feature: Create professional GST-compliant PDF invoices in 3 steps.

Key Capabilities: Auto-tax calculation, signature pad (draw/upload), logo branding, and instant PDF preview/download.

2. 🧮 GST Calculator

Core Feature: Calculate GST Inclusive (Reverse) and Exclusive (Forward) amounts.

Key Capabilities: Pre-set Indian tax slabs (5%, 12%, 18%) and one-click copy.

3. 💵 Daily Cash Tally

Core Feature: Digital "Galla" to count physical cash at the end of the day.

Key Capabilities: Supports all Indian denominations (₹500, ₹200, coins, etc.) and generates a formatted report to share via WhatsApp.

4. 📝 Number to Words Converter

Core Feature: Convert numerical amounts into text for cheques and drafts.

Key Capabilities: Uses the Indian Numbering System (Lakhs & Crores) instead of Millions, with "Only" appended automatically.

5. 📈 Profit Margin Calculator

Core Feature: Determine the correct Selling Price (MRP) based on Cost.

Key Capabilities: Clearly distinguishes between Markup (profit on cost) and Gross Margin (profit on sale).

6. 🏷️ Smart Discount Calculator

Core Feature: Calculate final sale prices for complex offers.

Key Capabilities: Handles Double Discounts (e.g., 50% + 20%) and Buy X Get Y schemes (e.g., Buy 2 Get 1 Free).

🛠️ Tech Stack

HTML5: Semantic, SEO-optimized structure.

CSS3: Tailwind CSS (via CDN) for responsive, mobile-first design + Custom CSS for print layouts.

JavaScript (ES6): Vanilla JS for all logic, DOM manipulation, and state management.

Icons: Font Awesome 6.

Fonts: Google Fonts (Inter & Dancing Script).

📂 Project Structure

/
├── index.html                      # Landing Page & Invoice Tool
├── css/
│   └── style.css                   # Global styles & Print media queries
├── js/
│   ├── layout.js                   # Dynamic Header/Footer injection & Navigation
│   └── script.js                   # Universal logic for all tools
├── calculator/
│   ├── gst-calculator.html         # GST Calculation Tool
│   ├── daily-cash-calculator.html  # Cash Tally Tool
│   ├── number-to-words.html        # Cheque Writing Tool
│   ├── margin-calculator.html      # Profit/Markup Tool
│   └── discount-calculator.html    # Discount/Scheme Tool
└── favicon/                        # Favicon assets


⚡ Setup & Deployment

Since DesiBill is a static web application, it requires no backend setup.

Local Development:

Clone the repository.

Open index.html in any browser.

Recommendation: Use VS Code with "Live Server" to ensure relative paths load correctly.

Deployment:

Upload the entire folder to any static host: GitHub Pages, Netlify, or Vercel.

No build commands (npm run build) are needed.

📝 Key Features for Developers

Centralized Layout: The js/layout.js file injects the Header and Footer across all pages, making menu updates easy.

SEO Optimized: Every page has unique Titles, Meta Descriptions, and JSON-LD Schema (SoftwareApplication, HowTo, FAQPage).

Performance: Minimal external dependencies (Tailwind CDN) ensure fast load times even on 4G networks.

Accessibility: WCAG AA compliant colors and semantic heading hierarchy (H1-H3).

📄 License

This project is open-source. Feel free to use it for personal or commercial purposes.

Built with ❤️ for Indian Small Businesses.
