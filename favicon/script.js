document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Menu Logic ---
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const openIcon = document.getElementById('menu-open-icon');
    const closeIcon = document.getElementById('menu-close-icon');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');

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
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            if (openIcon) openIcon.classList.remove('hidden');
            if (closeIcon) closeIcon.classList.add('hidden');
        });
    });

    // --- Invoice Generator Logic ---
    const currencySelect = document.getElementById('currency');
    const taxRateSelect = document.getElementById('tax-rate');
    const itemsContainer = document.getElementById('invoice-items-container');
    const addItemBtn = document.getElementById('add-item-btn');
    const itemLimitMsg = document.getElementById('item-limit-msg');
    const invoiceForm = document.getElementById('invoice-generator-form');
    
    const subtotalEl = document.getElementById('subtotal-amount');
    const gstRowEl = document.getElementById('gst-row');
    const gstLabelEl = document.getElementById('gst-label');
    const gstAmountEl = document.getElementById('gst-amount');
    const totalAmountEl = document.getElementById('total-amount');
    const currencySymbolEls = document.querySelectorAll('.currency-symbol');
    
    const logoUpload = document.getElementById('logo-upload');
    const logoPreview = document.getElementById('logo-preview');
    const removeLogoBtn = document.getElementById('remove-logo');

    const signatureUpload = document.getElementById('signature-upload');
    const signaturePreview = document.getElementById('signature-preview');
    const removeSignatureBtn = document.getElementById('remove-signature');

    // NEW: Signature tabs and panels
    const sigTabUpload = document.getElementById('sig-tab-upload');
    const sigTabDraw = document.getElementById('sig-tab-draw');
    const uploadPanel = document.getElementById('upload-panel');
    const drawPanel = document.getElementById('draw-panel');
    const sigCanvas = document.getElementById('signature-canvas');
    const sigClearBtn = document.getElementById('clear-signature');
    // Check if canvas exists before getting context
    const sigContext = sigCanvas ? sigCanvas.getContext('2d') : null;

    // NEW: Modal Elements
    const modal = document.getElementById('invoice-preview-modal');
    const modalContent = document.getElementById('modal-preview-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalPrintBtn = document.getElementById('modal-print-btn');
    
    // NEW: Step Wizard Elements
    let currentStep = 1;
    const totalSteps = 3;
    const steps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    
    const logoStorageKey = 'billBharatLogo'; // Kept old key to preserve user's logo
    const signatureStorageKey = 'billBharatSignature'; // Kept old key
    let sigMode = 'upload'; // NEW: Track current mode
    let isDrawing = false; // NEW
    let itemCount = 1;
    const maxItems = 5;

    // --- Currency & Calculation Logic ---
    const currencySymbols = {
        'INR': '₹',
        'USD': '$',
        'GBP': '£',
        'AUD': '$',
        'CAD': '$'
    };

    // NEW: Step Wizard Function
    function showStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > totalSteps) return;
        currentStep = stepNumber;

        // 1. Hide all steps
        steps.forEach(step => {
            step.classList.add('hidden');
        });
        // 2. Show current step
        const currentStepEl = document.querySelector(`.form-step[data-step-id="${currentStep}"]`);
        if (currentStepEl) {
            currentStepEl.classList.remove('hidden');
        }

        // 3. Update step indicators
        stepIndicators.forEach(indicator => {
            const indicatorStep = parseInt(indicator.dataset.step);
            if (indicatorStep === currentStep) {
                indicator.classList.add('active-step-indicator');
            } else {
                indicator.classList.remove('active-step-indicator');
            }
        });

        // 4. Update navigation buttons
        if (prevStepBtn && nextStepBtn && generatePdfBtn) {
            if (currentStep === 1) {
                // First step
                prevStepBtn.classList.add('hidden');
                nextStepBtn.classList.remove('hidden');
                generatePdfBtn.classList.add('hidden');
            } else if (currentStep === totalSteps) {
                // Last step
                prevStepBtn.classList.remove('hidden');
                nextStepBtn.classList.add('hidden');
                generatePdfBtn.classList.remove('hidden');
            } else {
                // Middle step
                prevStepBtn.classList.remove('hidden');
                nextStepBtn.classList.remove('hidden');
                generatePdfBtn.classList.add('hidden');
            }
        }
    }

    function updateTotals() {
        // Check if elements exist before proceeding
        if (!currencySelect || !taxRateSelect || !itemsContainer || !subtotalEl || !gstAmountEl || !totalAmountEl) {
            return;
        }
        
        const currency = currencySelect.value;
        const symbol = currencySymbols[currency];
        const taxRate = parseFloat(taxRateSelect.value) || 0;
        
        let totalSubtotal = 0;
        const itemRows = itemsContainer.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const qtyInput = row.querySelector('.item-qty');
            const priceInput = row.querySelector('.item-price');
            
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            totalSubtotal += qty * price;
        });

        const taxAmount = totalSubtotal * taxRate;
        const total = totalSubtotal + taxAmount;

        // Update UI
        subtotalEl.innerText = totalSubtotal.toFixed(2);
        gstAmountEl.innerText = taxAmount.toFixed(2);
        totalAmountEl.innerText = total.toFixed(2);
        
        currencySymbolEls.forEach(el => {
            el.innerText = symbol;
        });

        if (gstLabelEl && gstRowEl) {
            if (taxRate > 0) {
                const selectedOption = taxRateSelect.options[taxRateSelect.selectedIndex];
                const taxLabel = selectedOption.text.replace(' @', ''); // "GST @ 5%" becomes "GST 5%"
                // FIXED: This is the correct location for this code
                gstLabelEl.innerText = `${taxLabel}:`;
                gstRowEl.classList.remove('hidden');
            } else {
                gstRowEl.classList.add('hidden');
            }
        }
    }
    
    // --- Add / Remove Item Logic (FIXED: ID Duplication and Validation Logic) ---
    function createItemRow() {
        if (itemCount >= maxItems || !itemsContainer) return;
        
        itemCount++;
        const firstItemRow = itemsContainer.querySelector('.item-row');
        // Clone the first item row
        if (!firstItemRow) return; // Guard clause if first row isn't found
        const newItemRow = firstItemRow.cloneNode(true);
        
        // 1. Reset values and update IDs to prevent duplication (CRITICAL FIX)
        const inputs = newItemRow.querySelectorAll('input'); 
        
        inputs.forEach(input => {
            const baseId = input.id.replace(/\d+$/, ''); // e.g., 'item-desc-'
            const newId = baseId + itemCount;
            
            // Update label 'for' attribute
            const label = newItemRow.querySelector(`label[for="${input.id}"]`);
            if (label) {
                label.setAttribute('for', newId);
            }
            
            // Update input ID and clear/reset value
            input.id = newId;
            // Check if it's the quantity field and reset to 1, otherwise clear
            input.value = (input.classList.contains('item-qty') ? '1' : ''); 
        });
        
        // --- NEW: Adjust grid for remove button ---
        // Find wrappers using a robust query that won't fail
        const descWrapper = newItemRow.querySelector(`div:has(> #item-desc-${itemCount})`);
        const qtyWrapper = newItemRow.querySelector(`div:has(> #item-qty-${itemCount})`);
        const priceWrapper = newItemRow.querySelector(`div:has(> #item-price-${itemCount})`);

        if (descWrapper) {
            descWrapper.classList.remove('md:col-span-6');
            descWrapper.classList.add('md:col-span-6'); // Stays 6
        }
        if (qtyWrapper) {
            qtyWrapper.classList.remove('md:col-span-3');
            qtyWrapper.classList.add('md:col-span-2'); // Changes to 2
            
            qtyWrapper.classList.remove('col-span-6');
            qtyWrapper.classList.add('col-span-4'); // Mobile span
        }
        if (priceWrapper) {
            priceWrapper.classList.remove('md:col-span-3');
            priceWrapper.classList.add('md:col-span-2'); // Changes to 2

            priceWrapper.classList.remove('col-span-6');
            priceWrapper.classList.add('col-span-4'); // Mobile span
        }
        // --- End of grid adjust ---

        // 2. Add remove button (if not already present from cloning a previously added row)
        let removeBtn = newItemRow.querySelector('.remove-item-btn');
        let removeBtnWrapper = newItemRow.querySelector('.remove-btn-wrapper');

        if (!removeBtn) {
             // Create the button
             removeBtn = document.createElement('button');
             removeBtn.type = 'button';
             removeBtn.innerHTML = `<i class="fa-solid fa-trash-can w-4 h-4"></i>`; // Font Awesome icon
             removeBtn.className = 'remove-item-btn text-red-500 hover:text-red-400 p-2.5 rounded-lg bg-[#0B0B0B] border border-gray-700 w-full flex justify-center items-center'; // Match input style

             // Create the wrapper div
             removeBtnWrapper = document.createElement('div');
             // UPDATED: Mobile span 4, Desktop span 2
             removeBtnWrapper.className = 'remove-btn-wrapper col-span-4 md:col-span-2 flex items-end';
             
             // Append button to wrapper
             removeBtnWrapper.appendChild(removeBtn);

             // Append wrapper to the grid
             const grid = newItemRow.querySelector('.grid');
             if (grid) {
                grid.appendChild(removeBtnWrapper);
             } else {
                // Fallback, though it should find the grid
                newItemRow.appendChild(removeBtnWrapper);
             }
        }
        
        removeBtn.onclick = () => {
            newItemRow.remove();
            itemCount--;
            updateTotals();
            checkAddItemButtonState();
        };
        
        itemsContainer.appendChild(newItemRow);
        checkAddItemButtonState();
    }
    
    function checkAddItemButtonState() {
        if (!addItemBtn || !itemLimitMsg) return;
        
        // Simplified validation: only check if max items limit is reached (FUNCTIONAL FIX)
        if (itemCount >= maxItems) {
            addItemBtn.disabled = true;
            addItemBtn.classList.add('opacity-50', 'cursor-not-allowed');
            itemLimitMsg.classList.remove('hidden');
        } else {
            addItemBtn.disabled = false;
            addItemBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            itemLimitMsg.classList.add('hidden');
        }
    }
    
    // --- Logo Logic ---
    function loadLogo() {
        if (!logoPreview || !removeLogoBtn) return;
        try {
            const base64Logo = localStorage.getItem(logoStorageKey);
            if (base64Logo) {
                logoPreview.src = base64Logo;
                logoPreview.classList.remove('hidden');
                removeLogoBtn.classList.remove('hidden');
            }
        } catch (e) {
            console.error("Could not load logo from localStorage:", e);
        }
    }

    if (logoUpload) {
        logoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Logo = event.target.result;
                    try {
                        localStorage.setItem(logoStorageKey, base64Logo);
                        if (logoPreview) logoPreview.src = base64Logo;
                        if (logoPreview) logoPreview.classList.remove('hidden');
                        if (removeLogoBtn) removeLogoBtn.classList.remove('hidden');
                    } catch (e) {
                        console.error("Could not save logo to localStorage:", e);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeLogoBtn) {
        removeLogoBtn.addEventListener('click', () => {
            try {
                localStorage.removeItem(logoStorageKey);
                if (logoPreview) logoPreview.src = '';
                if (logoPreview) logoPreview.classList.add('hidden');
                removeLogoBtn.classList.add('hidden');
                if (logoUpload) logoUpload.value = ''; // Clear file input
            } catch (e) {
                 console.error("Could not remove logo from localStorage:", e);
            }
        });
    }
    
    // --- Signature Logic ---
    function loadSignature() {
        if (!signaturePreview || !removeSignatureBtn) return;
        // This function now only loads the *uploaded* signature
        if (sigMode !== 'upload') return; // Only run if in upload mode
        try {
            const base64Signature = localStorage.getItem(signatureStorageKey);
            if (base64Signature) {
                signaturePreview.src = base64Signature;
                signaturePreview.classList.remove('hidden');
                removeSignatureBtn.classList.remove('hidden');
            } else {
                signaturePreview.src = '';
                signaturePreview.classList.add('hidden');
                removeSignatureBtn.classList.add('hidden');
            }
        } catch (e) {
            console.error("Could not load signature from localStorage:", e);
        }
    }

    if (signatureUpload) {
        signatureUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Signature = event.target.result;
                    try {
                        localStorage.setItem(signatureStorageKey, base64Signature);
                        if (signaturePreview) signaturePreview.src = base64Signature;
                        if (signaturePreview) signaturePreview.classList.remove('hidden');
                        if (removeSignatureBtn) removeSignatureBtn.classList.remove('hidden');
                    } catch (e) {
                        console.error("Could not save signature to localStorage:", e);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // UPDATED: Remove button logic works for both modes
    if (removeSignatureBtn) {
        removeSignatureBtn.addEventListener('click', () => {
            if (sigMode === 'upload') {
                try {
                    localStorage.removeItem(signatureStorageKey);
                    if (signaturePreview) signaturePreview.src = ''; 
                    if (signaturePreview) signaturePreview.classList.add('hidden');
                    removeSignatureBtn.classList.add('hidden');
                    if (signatureUpload) signatureUpload.value = ''; // Clear file input
                } catch (e) {
                    console.error("Could not remove signature from localStorage:", e);
                }
            } else if (sigMode === 'draw') {
                if (sigClearBtn) sigClearBtn.click(); // Trigger the canvas clear logic
            }
        });
    }

    // --- NEW: Signature Tab and Canvas Logic ---
    if (sigTabUpload) {
        sigTabUpload.addEventListener('click', () => {
            sigMode = 'upload';
            if (uploadPanel) uploadPanel.classList.remove('hidden');
            if (drawPanel) drawPanel.classList.add('hidden');
            // Style active tab
            sigTabUpload.classList.add('border-red-500', 'text-white');
            sigTabUpload.classList.remove('border-transparent', 'text-gray-400');
            // Style inactive tab
            if (sigTabDraw) {
                sigTabDraw.classList.add('border-transparent', 'text-gray-400');
                sigTabDraw.classList.remove('border-red-500', 'text-white');
            }
            loadSignature(); // Reload uploaded signature into preview
        });
    }

    if (sigTabDraw) {
        sigTabDraw.addEventListener('click', () => {
            sigMode = 'draw';
            if (uploadPanel) uploadPanel.classList.add('hidden');
            if (drawPanel) drawPanel.classList.remove('hidden');
            // Style active tab
            sigTabDraw.classList.add('border-red-500', 'text-white');
            sigTabDraw.classList.remove('border-transparent', 'text-gray-400');
            // Style inactive tab
            if (sigTabUpload) {
                sigTabUpload.classList.add('border-transparent', 'text-gray-400');
                sigTabUpload.classList.remove('border-red-500', 'text-white');
            }
            
            // Check if there's a drawn signature to show
            if (sigCanvas && !isCanvasBlank(sigCanvas)) {
                 if (signaturePreview) signaturePreview.src = sigCanvas.toDataURL();
                 if (signaturePreview) signaturePreview.classList.remove('hidden');
                 if (removeSignatureBtn) removeSignatureBtn.classList.remove('hidden');
            } else {
                 if (signaturePreview) signaturePreview.src = '';
                 if (signaturePreview) signaturePreview.classList.add('hidden');
                 if (removeSignatureBtn) removeSignatureBtn.classList.add('hidden');
            }
        });
    }

    // --- NEW: Canvas drawing logic ---
    if (sigContext) {
        sigContext.strokeStyle = '#000000';
        sigContext.lineWidth = 2;
        sigContext.lineCap = 'round';
        sigContext.lineJoin = 'round';
    }

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        if (evt.touches) { // Touch event
            clientX = evt.touches[0].clientX;
            clientY = evt.touches[0].clientY;
        } else { // Mouse event
            clientX = evt.clientX;
            clientY = evt.clientY;
        }
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        if (!sigContext) return;
        e.preventDefault(); // prevent scrolling
        isDrawing = true;
        const pos = getMousePos(sigCanvas, e);
        sigContext.beginPath();
        sigContext.moveTo(pos.x, pos.y);
    }

    function draw(e) {
        if (!isDrawing || !sigContext) return;
        e.preventDefault();
        const pos = getMousePos(sigCanvas, e);
        sigContext.lineTo(pos.x, pos.y);
        sigContext.stroke();
    }

    function stopDrawing(e) {
        if (!isDrawing || !sigContext) return;
        isDrawing = false;
        sigContext.closePath();
        
        // Update preview only if it's not a mouseout event
        if (e.type !== 'mouseout' && sigCanvas) {
            const dataUrl = sigCanvas.toDataURL();
            if (signaturePreview) signaturePreview.src = dataUrl;
            if (signaturePreview) signaturePreview.classList.remove('hidden');
            if (removeSignatureBtn) removeSignatureBtn.classList.remove('hidden');
        }
    }
    
    function isCanvasBlank(canvas) {
        if (!canvas) return true;
        // Check if canvas is empty
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();
    }

    if (sigCanvas) {
        // Mouse events
        sigCanvas.addEventListener('mousedown', startDrawing);
        sigCanvas.addEventListener('mousemove', draw);
        sigCanvas.addEventListener('mouseup', stopDrawing);
        sigCanvas.addEventListener('mouseout', stopDrawing); // Stop if mouse leaves canvas

        // Touch events
        sigCanvas.addEventListener('touchstart', startDrawing);
        sigCanvas.addEventListener('touchmove', draw);
        sigCanvas.addEventListener('touchend', stopDrawing);
    }

    // Clear button
    if (sigClearBtn) {
        sigClearBtn.addEventListener('click', () => {
            if (sigContext && sigCanvas) sigContext.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            if (signaturePreview) signaturePreview.src = '';
            if (signaturePreview) signaturePreview.classList.add('hidden');
            if (removeSignatureBtn) removeSignatureBtn.classList.add('hidden');
        });
    }

    // --- Initial Setup ---
    // Listen for changes on currency and tax rate
    [currencySelect, taxRateSelect].forEach(el => {
        if (el) el.addEventListener('input', updateTotals);
    });
    
    // Use event delegation for dynamic item rows
    if (itemsContainer) {
        itemsContainer.addEventListener('input', (e) => {
            if (e.target.matches('.item-qty, .item-price, .item-desc')) {
                updateTotals();
            }
        });
    }
    
    // Add item button click
    if (addItemBtn) {
        addItemBtn.addEventListener('click', createItemRow);
    }
    
    // --- NEW: Step Wizard Event Listeners ---
    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', () => {
            showStep(currentStep + 1);
        });
    }
    
    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', () => {
            showStep(currentStep - 1);
        });
    }
    
    stepIndicators.forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            // Find the button element in case the user clicks the dot or label
            const targetButton = e.target.closest('.step-indicator');
            if (targetButton) {
                const targetStep = parseInt(targetButton.dataset.step);
                showStep(targetStep);
            }
        });
    });

    loadLogo(); // Load logo from localStorage on page load
    loadSignature(); // Load signature from localStorage
    updateTotals(); // Initial calculation
    checkAddItemButtonState(); // Check button state on load
    showStep(1); // NEW: Initialize the wizard on step 1
    
    
    // --- NEW: Modal Logic ---
    function closeModal() {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        if (modalContent) {
            modalContent.innerHTML = ''; // Clear iframe
        }
        // Restore main page scroll
        document.body.style.overflow = '';
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Modal Print Button
    if (modalPrintBtn) {
        modalPrintBtn.addEventListener('click', () => {
            const iframe = modalContent.querySelector('iframe');
            if (iframe) {
                iframe.contentWindow.print();
            }
        });
    }

    // --- HTML Invoice Generation (MODIFIED: Show in Modal) ---
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Hide main page scroll
            document.body.style.overflow = 'hidden';

            let logoBase64 = null;
            try {
                logoBase64 = localStorage.getItem(logoStorageKey);
            } catch (e) {
                console.error("Could not read logo from localStorage:", e);
            }
            
            // UPDATED: Get signature based on sigMode
            let signatureBase64 = null;
            if (sigMode === 'upload') {
                try {
                    signatureBase64 = localStorage.getItem(signatureStorageKey);
                } catch (e) {
                    console.error("Could not read signature from localStorage:", e);
                }
            } else if (sigMode === 'draw' && sigCanvas && !isCanvasBlank(sigCanvas)) {
                signatureBase64 = sigCanvas.toDataURL(); // Get drawn signature
            }

            const yourNameEl = document.getElementById('your-name');
            const yourAddressEl = document.getElementById('your-address');
            const yourGstinEl = document.getElementById('your-gstin');
            const clientNameEl = document.getElementById('client-name');
            const clientAddressEl = document.getElementById('client-address');
            const clientGstinEl = document.getElementById('client-gstin');
            const yourContactEl = document.getElementById('your-contact');
            const clientContactEl = document.getElementById('client-contact');
            const currencyEl = document.getElementById('currency');
            const taxRateEl = document.getElementById('tax-rate');
            const subtotalAmountEl = document.getElementById('subtotal-amount');
            const gstAmountEl = document.getElementById('gst-amount');
            const totalAmountEl = document.getElementById('total-amount');
            const invoiceNotesEl = document.getElementById('invoice-notes');

            const yourName = yourNameEl ? yourNameEl.value : "Your Business";
            const yourAddress = yourAddressEl ? yourAddressEl.value : "";
            const yourGstin = yourGstinEl ? yourGstinEl.value : "";

            const clientName = clientNameEl ? clientNameEl.value : "Client Name";
            const clientAddress = clientAddressEl ? clientAddressEl.value : "";
            const clientGstin = clientGstinEl ? clientGstinEl.value : "";
            
            const yourContact = yourContactEl ? yourContactEl.value : ""; // Added
            const clientContact = clientContactEl ? clientContactEl.value : ""; // Added
            
            const currency = currencyEl ? currencyEl.value : "INR";
            const currencySymbol = currencySymbols[currency] || '₹';
            const taxRate = taxRateEl ? (parseFloat(taxRateEl.value) || 0) : 0;

            const subtotal = subtotalAmountEl ? (parseFloat(subtotalAmountEl.innerText) || 0) : 0;
            const taxAmount = gstAmountEl ? (parseFloat(gstAmountEl.innerText) || 0) : 0;
            const total = totalAmountEl ? (parseFloat(totalAmountEl.innerText) || 0) : 0;
            
            const invoiceNotes = invoiceNotesEl ? invoiceNotesEl.value : ""; // Added

            const date = new Date().toLocaleDateString('en-IN');
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
            
            // UPDATED: Due Date is same as Invoice Date
            const dueDate = date;

            // UPDATED: Logic for custom vs. default logo
            let logoHtml = '';
            if (logoBase64) {
                logoHtml = `<img src="${logoBase64}" alt="Business Logo" class="logo">`;
            } else {
                // Use Font Awesome receipt icon
                logoHtml = `<div class="default-logo-icon"><i class="fa-solid fa-receipt"></i></div>`;
            }
            
            // UPDATED: Default logo for footer
            const defaultLogoFooterHtml = '<div style="font-family: \'Inter\', sans-serif; font-size: 16px; font-weight: 700; color: #333; margin-top: 8px;">Desi<span style="font-family: \'Dancing Script\', cursive; font-size: 20px; color: #E50914;">Bill</span></div>';

            // 2. Build Item Rows HTML
            let itemsHtml = '';
            const itemFormRows = document.querySelectorAll('#invoice-items-container .item-row');
            itemFormRows.forEach(row => {
                const desc = (row.querySelector('.item-desc')?.value || '').trim() || 'Service/Product';
                const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
                const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
                const rowTotal = (qty * price);

                if (desc || qty > 0 || price > 0) {
                    // UPDATED: New table structure
                    itemsHtml += `
                        <tr>
                            <td><strong>${desc}</strong></td>
                            <td class="right">${qty}</td>
                            <td class="right">${currencySymbol} ${price.toFixed(2)}</td>
                            <td class="right">${currencySymbol} ${rowTotal.toFixed(2)}</td>
                        </tr>
                    `;
                }
            });

            if (itemsHtml === '') {
                itemsHtml = '<tr><td colspan="4" class="center" style="padding: 20px 0;">No items added.</td></tr>';
            }

            // 3. Build Totals Rows HTML
            // UPDATED: New totals structure
            let totalsHtml = `
                <div class="total-row">
                    <span>Subtotal</span>
                    <span class="right">${currencySymbol} ${subtotal.toFixed(2)}</span>
                </div>
            `;
            
            if (taxRate > 0) {
                const taxLabelEl = document.getElementById('gst-label');
                const taxLabel = taxLabelEl ? taxLabelEl.innerText.replace(':', '') : 'Tax';
                totalsHtml += `
                    <div class="total-row">
                        <span>${taxLabel}</span>
                        <span class="right">${currencySymbol} ${taxAmount.toFixed(2)}</span>
                    </div>
                `;
            }
            
            totalsHtml += `
                <div class="total-row grand-total">
                    <span>TOTAL</span>
                    <span class="right">${currencySymbol} ${total.toFixed(2)}</span>
                </div>
            `;


            // 4. Construct Full Invoice HTML
            // UPDATED: Removed the <button onclick="window.print()">
            // UPDATED: Complete redesign of styles and HTML structure
            const invoiceHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Invoice ${invoiceNumber}</title>
                    <!-- UPDATED: Added Font Awesome for default icon -->
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
                    <style>
                        /* NEW: Import Cursive Font */
                        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    
                        body { 
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            background-color: #f8f8f8; 
                            color: #333;
                            -webkit-font-smoothing: antialiased;
                            -moz-osx-font-smoothing: grayscale;
                            /* NEW: Force print background colors */
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        
                        .invoice-container { 
                            max-width: 840px; 
                            min-height: 1188px; /* A4 aspect ratio helper */
                            margin: 20px auto; 
                            background-color: #fff; 
                            border: 1px solid #ddd; 
                            padding: 0;
                            box-shadow: 0 0 15px rgba(0,0,0,0.07);
                            position: relative; /* For stacking context */
                            z-index: 2; /* Ensure content is above watermark */
                        }
                        
                        /* Watermark */
                        .watermark {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%) rotate(-45deg);
                            font-size: 100px;
                            font-weight: bold;
                            color: rgba(0, 0, 0, 0.04); /* Very faint gray */
                            white-space: nowrap;
                            z-index: 1; /* Behind the content */
                            user-select: none;
                        }
                        .watermark .cursive {
                            font-family: 'Dancing Script', cursive;
                            font-size: 120px; /* Make cursive part slightly larger */
                        }

                        /* Header */
                        .invoice-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            padding: 30px 40px 20px; /* Reduced padding */
                            border-bottom: 2px solid #f4f4f4;
                        }
                        .header-left .logo {
                            max-width: 220px;
                            max-height: 70px;
                            object-fit: contain;
                            display: block;
                        }
                        /* NEW: Default Icon Style */
                        .header-left .default-logo-icon {
                            font-size: 48px;
                            color: #E50914;
                            width: 70px; /* Match height */
                            height: 70px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .header-left h2 {
                            margin: 10px 0 0 0;
                            font-size: 20px;
                            font-weight: 600;
                            color: #000;
                        }
                        .header-right {
                            text-align: right;
                        }
                        .header-right h1 {
                            margin: 0 0 10px 0;
                            color: #E50914;
                            font-size: 32px;
                            font-weight: 700;
                        }
                        .header-right p {
                            margin: 0;
                            font-size: 13px;
                            color: #555;
                            line-height: 1.6;
                        }
                        .header-right p strong {
                            color: #000;
                        }

                        /* From/To Parties */
                        .invoice-parties {
                            padding: 20px 40px; /* Reduced padding */
                            display: flex;
                            justify-content: space-between;
                            gap: 20px;
                        }
                        /* UPDATED: Party Box styling */
                        .party-box {
                            width: 48%;
                            background: #fdfdfd;
                            border: 1px solid #eee;
                            border-radius: 8px;
                            padding: 15px;
                        }
                        .party-box h3 {
                            font-size: 13px;
                            color: #E50914; /* Red title */
                            font-weight: 600;
                            margin-top: 0;
                            margin-bottom: 10px;
                            text-transform: uppercase;
                            /* UPDATED: Align title to left */
                            text-align: left; 
                        }
                        .party-box-content {
                            /* UPDATED: Align content to left */
                            text-align: left;
                        }
                        .party-box p {
                            font-size: 14px;
                            line-height: 1.6;
                            white-space: pre-line;
                            margin: 0 0 5px 0;
                            color: #222;
                        }
                        .party-box p.party-name {
                            font-size: 16px;
                            font-weight: 700;
                            color: #000;
                            margin-bottom: 8px;
                        }
                        .party-box p strong {
                            font-weight: 600;
                            color: #333;
                        }
                        
                        /* Items Table */
                        .invoice-table {
                            padding: 0 40px 20px;
                        }
                        table.items {
                            width: 100%;
                            border-collapse: collapse;
                            border-radius: 8px; /* Rounded corners for table */
                            overflow: hidden; /* Clip gradient */
                            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                        }
                        table.items th, table.items td {
                            padding: 12px 15px;
                            text-align: left;
                            border-bottom: 1px solid #eee;
                            font-size: 14px;
                        }
                        /* UPDATED: Dark Red Gradient Header */
                        table.items th {
                            background-image: linear-gradient(to bottom, #a10f18, #E50914);
                            color: #ffffff;
                            font-weight: 600;
                            font-size: 12px;
                            text-transform: uppercase;
                            border-bottom: 1px solid #a10f18;
                        }
                        /* UPDATED: Zebra striping for items */
                        table.items tbody tr:nth-of-type(even) {
                            background-color: #fff8f8; /* Very light red */
                        }
                        table.items td.right, table.items th.right {
                            text-align: right;
                        }
                        
                        /* Summary / Totals */
                        /* UPDATED: Removed old summary styles, replaced with new bottom section */
                        .invoice-bottom-section {
                            padding: 20px 40px 40px;
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start; /* Align tops */
                        }
                        .invoice-bottom-left { /* For notes */
                            width: 55%;
                        }
                        .invoice-bottom-right { /* For totals & signature */
                            width: 40%;
                        }

                        .totals-box {
                            width: 100%;
                            margin-bottom: 30px; /* Space before signature */
                        }
                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 8px 0;
                            font-size: 14px;
                            color: #333;
                        }
                        .total-row span:first-child {
                            color: #555;
                        }
                        .total-row.grand-total {
                            font-size: 18px;
                            font-weight: 700;
                            color: #E50914;
                            border-top: 2px solid #333;
                            margin-top: 10px;
                            padding-top: 10px;
                        }

                        /* Notes & Signature */
                        /* UPDATED: Removed old footer-details padding */
                        .notes h3, .signature h3 {
                            font-size: 13px;
                            color: #777;
                            font-weight: 500;
                            margin-bottom: 5px;
                            text-transform: uppercase;
                        }
                        .notes p {
                            font-size: 13px;
                            color: #555;
                            margin: 0;
                            line-height: 1.6;
                            white-space: pre-line;
                        }
                        .signature {
                            margin-top: 30px;
                            text-align: right;
                        }
                        .signature img {
                            max-height: 50px;
                            object-fit: contain;
                            margin-bottom: 5px;
                        }
                        .signature p {
                            font-size: 12px;
                            color: #555;
                            border-top: 1px solid #ccc;
                            padding-top: 5px;
                            display: inline-block;
                            margin: 0;
                        }
                        
                        /* Page Footer */
                        .invoice-footer {
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            padding: 20px 40px;
                            text-align: center;
                            font-size: 12px;
                            color: #999;
                            border-top: 1px solid #eee;
                        }
                        .invoice-footer p { margin: 2px 0; }
                        
                        /* NEW: Footer Logo Styles */
                        .footer-logo {
                            font-family: 'Inter', sans-serif; 
                            font-size: 14px; /* smaller */
                            font-weight: 700; 
                            color: #555; /* subtle */
                            display: inline-block;
                            margin-left: 8px;
                            vertical-align: middle;
                        }
                        .footer-logo .cursive {
                            font-family: 'Dancing Script', cursive; 
                            font-size: 16px; /* smaller */
                            color: #E50914;
                        }
                        
                        /* REMOVED the mobile-specific media query that caused wrapping */

                        @media print {
                            body { background-color: #fff; margin: 0; }
                            .invoice-container { 
                                width: 100%; 
                                margin: 0; 
                                padding: 0; 
                                border: none; 
                                box-shadow: none;
                                min-height: 0; 
                            }
                            .invoice-footer {
                                position: static; /* Don't stick footer on print */
                            }
                            .no-print { display: none; }
                            .watermark {
                                color: rgba(0, 0, 0, 0.06);
                            }
                            @page {
                                size: A4;
                                margin: 0;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                            }
                            .invoice-container {
                                padding: 20mm; /* Standard A4 margins */
                                box-sizing: border-box;
                                height: 297mm;
                                width: 210mm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        <!-- Watermark -->
                        <div class="watermark">
                            Desi<span class="cursive">Bill</span>
                        </div>
                        
                        <div class="invoice-header">
                            <div class="header-left">
                                ${logoHtml}
                            </div>
                            <div class="header-right">
                                <h1>INVOICE</h1>
                                <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
                                <p><strong>Date:</strong> ${date}</p>
                                <p><strong>Due Date:</strong> ${dueDate}</p>
                            </div>
                        </div>

                        <div class="invoice-parties">
                            <!-- UPDATED: FROM Box -->
                            <div class="party-box">
                                <h3>FROM:</h3>
                                <div class="party-box-content">
                                    <p class="party-name">${yourName}</p>
                                    <p>
                                        ${yourContact ? `${yourContact}<br>` : ''}
                                        ${yourAddress.replace(/\n/g, '<br>')}
                                        ${yourGstin ? `<br><strong>GSTIN:</strong> ${yourGstin}` : ''}
                                    </p>
                                </div>
                            </div>
                            <!-- UPDATED: TO Box -->
                            <div class="party-box">
                                <h3>BILL TO:</h3>
                                <div class="party-box-content">
                                    <p class="party-name">${clientName}</p>
                                    <p>
                                        ${clientContact ? `${clientContact}<br>` : ''}
                                        ${clientAddress.replace(/\n/g, '<br>')}
                                        ${clientGstin ? `<br><strong>GSTIN:</strong> ${clientGstin}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="invoice-table">
                            <table class="items">
                                <thead>
                                    <tr>
                                        <th>Item Description</th>
                                        <th class="right">Qty</th>
                                        <th class="right">Price</th>
                                        <th class="right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- UPDATED: Replaced summary and footer-details with new bottom section -->
                        <div class="invoice-bottom-section">
                            <div class="invoice-bottom-left">
                                ${invoiceNotes ? `
                                    <div class="notes">
                                        <h3>Notes / Terms:</h3>
                                        <p>${invoiceNotes.replace(/\n/g, '<br>')}</p>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="invoice-bottom-right">
                                <div class="totals-box">
                                    ${totalsHtml}
                                </div>
                                
                                ${signatureBase64 ? `
                                    <div class="signature">
                                        <img src="${signatureBase64}" alt="Signature">
                                        <p>Authorized Signature</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="invoice-footer">
                            <p>Thank you for your business!</p>
                            <p>
                                Generated by DesiBill - India's Free Billing Tool
                                <!-- NEW: Added footer logo -->
                                <span class="footer-logo">Desi<span class="cursive">Bill</span></span>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // 5. MODIFIED: Show in Modal
            if (modal && modalContent) {
                // Store data on the modal for action buttons
                modal.dataset.invoiceNumber = invoiceNumber;
                modal.dataset.clientContact = clientContact; // This field holds phone or email
                modal.dataset.clientName = clientName;
                modal.dataset.yourName = yourName;
                modal.dataset.total = total.toFixed(2);
                modal.dataset.currencySymbol = currencySymbol;
                
                // Create iframe
                const iframe = document.createElement('iframe');
                iframe.className = 'w-full h-[75vh] border-0 bg-white';
                // Use srcdoc for security and style isolation
                iframe.srcdoc = invoiceHtml; 
                
                // Add iframe to modal and display
                modalContent.innerHTML = ''; // Clear previous preview
                modalContent.appendChild(iframe);
                modal.classList.remove('hidden');
                modal.classList.add('flex'); // Use flex for centering
            } else {
                console.error("Modal elements not found. Could not display preview.");
            }
        });
    }
    // --- End of PDF Generation Script ---
    
}); // <-- ADDED THIS WRAPPER