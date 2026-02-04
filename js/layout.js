document.addEventListener('DOMContentLoaded', () => {
    
    // --- Header Injection ---
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = `
        <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B0B0B]/80 border-b border-gray-800">
            <nav class="container mx-auto max-w-6xl px-4 h-16 flex justify-between items-center relative">
                <!-- Logo -->
                <a href="/" class="text-2xl font-bold text-white flex items-baseline">
                    <i class="fa-solid fa-receipt h-7 w-7 text-[#E50914] mr-1"></i>
                    Desi<span class="text-[#E50914] font-cursive text-3xl font-bold">Bill</span>
                </a>
                
                <!-- Nav Links (Desktop) -->
                <div class="hidden md:flex items-center space-x-6">
                    <a href="/" class="nav-link text-gray-300 hover:text-white transition-all text-sm font-medium py-1">Home</a>
                    <a href="/calculator/gst-calculator.html" class="nav-link text-gray-300 hover:text-white transition-all text-sm font-medium py-1">GST Calc</a>
                    <a href="/calculator/daily-cash-calculator.html" class="nav-link text-gray-300 hover:text-white transition-all text-sm font-medium py-1">Cash Tally</a>
                    <a href="/calculator/number-to-words.html" class="nav-link text-gray-300 hover:text-white transition-all text-sm font-medium py-1">Num to Words</a>
                    <a href="/calculator/margin-calculator.html" class="nav-link text-gray-300 hover:text-white transition-all text-sm font-medium py-1">Profit Margin</a>
                    <a href="/calculator/discount-calculator.html" class="nav-link text-gray-300 hover:text-white transition-all text-sm font-medium py-1">Discount Calc</a>
                </div>
                
                <!-- CTA (Desktop) -->
                <div class="hidden md:flex items-center">
                    <a href="/#invoice-tool" class="btn-primary text-white py-1.5 px-4 rounded-lg font-bold text-sm">
                        Create Invoice Now
                    </a>
                </div>
                
                <!-- Mobile Menu Button -->
                <button id="mobile-menu-btn" class="md:hidden text-white" aria-label="Open menu" aria-expanded="false">
                    <svg id="menu-open-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                    <svg id="menu-close-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 hidden">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                <!-- Mobile Menu -->
                <div id="mobile-menu" class="hidden md:hidden absolute top-16 left-0 w-full bg-[#111] border-b border-gray-800 shadow-lg">
                    <div class="flex flex-col space-y-2 p-4">
                        <a href="/" class="mobile-menu-link text-gray-300 hover:text-white transition-colors text-base py-2 px-2 rounded-md">Home</a>
                        <a href="/calculator/gst-calculator.html" class="mobile-menu-link text-gray-300 hover:text-white transition-colors text-base py-2 px-2 rounded-md">GST Calc</a>
                        <a href="/calculator/daily-cash-calculator.html" class="mobile-menu-link text-gray-300 hover:text-white transition-colors text-base py-2 px-2 rounded-md">Cash Tally</a>
                        <a href="/calculator/number-to-words.html" class="mobile-menu-link text-gray-300 hover:text-white transition-colors text-base py-2 px-2 rounded-md">Num to Words</a>
                        <a href="/calculator/margin-calculator.html" class="mobile-menu-link text-gray-300 hover:text-white transition-colors text-base py-2 px-2 rounded-md">Profit Margin</a>
                        <a href="/calculator/discount-calculator.html" class="mobile-menu-link text-gray-300 hover:text-white transition-colors text-base py-2 px-2 rounded-md">Discount Calc</a>
                        <a href="/#invoice-tool" class="btn-primary text-white text-center py-2.5 px-4 rounded-lg font-bold text-base mt-2">
                            Create Invoice Now
                        </a>
                    </div>
                </div>
            </nav>
        </header>
        `;

        // --- Active Link Logic ---
        const currentPath = window.location.pathname;
        
        // Handle Desktop Links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            // Check if current path matches href (handling root / and index.html cases)
            const isActive = (currentPath === href) || 
                             (currentPath.endsWith('/') && href === '/') || 
                             (currentPath.includes(href) && href !== '/');

            if (isActive) {
                link.classList.remove('text-gray-300', 'hover:text-white');
                // Apply Red Accent Line and White Text
                link.classList.add('text-white', 'border-b-2', 'border-red-500');
            }
        });

        // Handle Mobile Links
        const mobileLinks = document.querySelectorAll('.mobile-menu-link');
        mobileLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = (currentPath === href) || 
                             (currentPath.endsWith('/') && href === '/') || 
                             (currentPath.includes(href) && href !== '/');

            if (isActive) {
                link.classList.remove('text-gray-300', 'hover:text-white');
                // Apply Active Style for Mobile (Red Text + Dark bg)
                link.classList.add('text-red-500', 'bg-gray-900', 'font-bold');
            }
        });


        // --- Mobile Menu Toggle Logic ---
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const openIcon = document.getElementById('menu-open-icon');
        const closeIcon = document.getElementById('menu-close-icon');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
                menuBtn.setAttribute('aria-expanded', !isExpanded);
                if (mobileMenu) mobileMenu.classList.toggle('hidden');
                if (openIcon) openIcon.classList.toggle('hidden');
                if (closeIcon) closeIcon.classList.toggle('hidden');
            });
        }
        
        // Close menu when a link is clicked
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
                if (mobileMenu) mobileMenu.classList.add('hidden');
                if (openIcon) openIcon.classList.remove('hidden');
                if (closeIcon) closeIcon.classList.add('hidden');
            });
        });
    }

    // --- Footer Injection ---
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = `
        <footer class="bg-gray-900 border-t border-gray-800 py-10">
            <div class="container mx-auto max-w-6xl px-4">
                
                <!-- Trust Symbols -->
                <div class="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-5">
                    <span class="flex items-center gap-2 text-sm font-medium text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-green-400">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        100% Free Forever
                    </span>
                    <span class="flex items-center gap-2 text-sm font-medium text-white">
                        🇮🇳 Made in India
                    </span>
                    <span class="flex items-center gap-2 text-sm font-medium text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-400">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        Secure & Private
                    </span>
                </div>
                
                <!-- Calculator Links Row -->
                <div class="flex justify-center items-center space-x-4 mb-1 flex-wrap">
                     <a href="/" class="text-gray-400 hover:text-white transition-colors text-xs">Home</a>
                     <a href="/calculator/gst-calculator.html" class="text-gray-400 hover:text-white transition-colors text-xs">GST Calc</a>
                     <a href="/calculator/daily-cash-calculator.html" class="text-gray-400 hover:text-white transition-colors text-xs">Cash Tally</a>
                     <a href="/calculator/number-to-words.html" class="text-gray-400 hover:text-white transition-colors text-xs">Num to Words</a>
                     <a href="/calculator/margin-calculator.html" class="text-gray-400 hover:text-white transition-colors text-xs">Profit Margin</a>
                     <a href="/calculator/discount-calculator.html" class="text-gray-400 hover:text-white transition-colors text-xs">Discount Calc</a>
                </div>

                <!-- Slim Divider -->
                <div class="w-full max-w-lg mx-auto border-t border-gray-800 my-4 opacity-50"></div>

                <!-- Legal Links Row -->
                <div class="flex justify-center items-center space-x-6 mb-4 flex-wrap">
                     <!-- UPDATED: Use root folder URL -->
                     <a href="/calculator/" class="text-gray-500 hover:text-white transition-colors text-xs">Calculator Hub</a>
                     <a href="/legal/about.html" class="text-gray-500 hover:text-white transition-colors text-xs">About Us</a>
                     <a href="/legal/terms.html" class="text-gray-500 hover:text-white transition-colors text-xs">Terms of Use</a>
                     <a href="/legal/privacy.html" class="text-gray-500 hover:text-white transition-colors text-xs">Privacy Policy</a>
                     <a href="/legal/contact.html" class="text-gray-500 hover:text-white transition-colors text-xs">Contact</a>
                </div>
                
                <!-- Copyright -->
                <p class="text-center text-gray-500 text-xs">
                    © 2026 DesiBill. All rights reserved.
                </p>
                <p class="text-center text-gray-500 text-xs mt-1">
                    Fast. Simple. Free Forever.
                </p>
                
            </div>
        </footer>
        `;
    }
});
