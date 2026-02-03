DesiBill - Free GST Billing & Invoice Tool for India 🇮🇳

DesiBill is a lightweight, client-side web application designed to help small Indian businesses (shopkeepers, freelancers, vendors) generate professional GST-compliant invoices instantly.

It is built with a mobile-first approach, requires no backend, and works entirely in the browser using LocalStorage for data persistence.

🚀 Features

100% Free & Client-Side: No sign-up required, no data sent to servers.

3-Step Invoice Wizard: Easy flow (Details -> Items -> Finalize).

PDF Generation: Instant client-side PDF preview and printing/downloading.

Custom Branding: Upload business logos and digital signatures.

Drawing Pad: Integrated canvas for drawing signatures on touch devices.

GST Support: Automatic calculation of CGST/SGST/IGST based on selected rates.

Responsive Design: Fully optimized for mobile, tablet, and desktop.

Data Persistence: Saves logos and signatures locally so they are available on next visit.

🛠️ Tech Stack

HTML5: Semantic structure.

CSS3: Tailwind CSS (via CDN) for utility classes + css/style.css for custom theming (gradients, print styles).

JavaScript (ES6): Vanilla JS for all logic, DOM manipulation, and state management.

Font Awesome: For UI icons.

Google Fonts: Inter (Body) & Dancing Script (Logo).

📂 Project Structure

/
├── index.html          # Main application entry point
├── logo-icon.svg       # Project favicon/logo
├── css/
│   └── style.css       # Custom styles, animations, and print media queries
└── js/
    ├── layout.js       # Injects Header and Footer components (SPA feel)
    └── script.js       # Core logic: Calculations, Wizard nav, Signature pad, PDF generation


⚡ Setup & Usage

Since this is a static web application, no build process or server installation is required.

Clone or Download the repository.

Open the folder in your code editor (e.g., VS Code).

Launch index.html in any modern web browser (Chrome, Edge, Firefox, Safari).

Tip: Use "Live Server" extension in VS Code for the best development experience.

📝 SEO & Performance

Meta Tags: Optimized titles, descriptions, and keywords for Indian billing keywords.

Schema Markup: JSON-LD included for SoftwareApplication and Organization.

CLS Optimization: Fixed height reserved for injected headers to prevent layout shifts.

Accessibility: WCAG AA compliance focused (high contrast, semantic tags).

📄 License

This project is open-source and free to use for personal and commercial purposes.

Built with ❤️ for Bharat.
