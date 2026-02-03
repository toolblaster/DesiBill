document.addEventListener('DOMContentLoaded', () => {
    
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
    
    const logoStorageKey = 'billBharatLogo'; 
    const signatureStorageKey = 'billBharatSignature'; 
    let sigMode = 'upload'; 
    let isDrawing = false; 
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
                const taxLabel = selectedOption.text.replace(' @', ''); 
                gstLabelEl.innerText = `${taxLabel}:`;
                gstRowEl.classList.remove('hidden');
            } else {
                gstRowEl.classList.add('hidden');
            }
        }
    }
    
    // --- Add / Remove Item Logic ---
    function createItemRow() {
        if (itemCount >= maxItems || !itemsContainer) return;
        
        itemCount++;
        const firstItemRow = itemsContainer.querySelector('.item-row');
        if (!firstItemRow) return; 
        const newItemRow = firstItemRow.cloneNode(true);
        
        const inputs = newItemRow.querySelectorAll('input'); 
        
        inputs.forEach(input => {
            const baseId = input.id.replace(/\d+$/, ''); 
            const newId = baseId + itemCount;
            
            const label = newItemRow.querySelector(`label[for="${input.id}"]`);
            if (label) {
                label.setAttribute('for', newId);
            }
            
            input.id = newId;
            input.value = (input.classList.contains('item-qty') ? '1' : ''); 
        });
        
        // Adjust grid for remove button
        const descWrapper = newItemRow.querySelector(`div:has(> #item-desc-${itemCount})`);
        const qtyWrapper = newItemRow.querySelector(`div:has(> #item-qty-${itemCount})`);
        const priceWrapper = newItemRow.querySelector(`div:has(> #item-price-${itemCount})`);

        if (descWrapper) {
            descWrapper.classList.remove('md:col-span-6');
            descWrapper.classList.add('md:col-span-6');
        }
        if (qtyWrapper) {
            qtyWrapper.classList.remove('md:col-span-3');
            qtyWrapper.classList.add('md:col-span-2');
            qtyWrapper.classList.remove('col-span-6');
            qtyWrapper.classList.add('col-span-4'); 
        }
        if (priceWrapper) {
            priceWrapper.classList.remove('md:col-span-3');
            priceWrapper.classList.add('md:col-span-2');
            priceWrapper.classList.remove('col-span-6');
            priceWrapper.classList.add('col-span-4'); 
        }

        let removeBtn = newItemRow.querySelector('.remove-item-btn');
        let removeBtnWrapper = newItemRow.querySelector('.remove-btn-wrapper');

        if (!removeBtn) {
             removeBtn = document.createElement('button');
             removeBtn.type = 'button';
             removeBtn.innerHTML = `<i class="fa-solid fa-trash-can w-4 h-4"></i>`;
             removeBtn.className = 'remove-item-btn text-red-500 hover:text-red-400 p-2.5 rounded-lg bg-[#0B0B0B] border border-gray-700 w-full flex justify-center items-center'; 

             removeBtnWrapper = document.createElement('div');
             removeBtnWrapper.className = 'remove-btn-wrapper col-span-4 md:col-span-2 flex items-end';
             removeBtnWrapper.appendChild(removeBtn);

             const grid = newItemRow.querySelector('.grid');
             if (grid) {
                grid.appendChild(removeBtnWrapper);
             } else {
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
                if (logoUpload) logoUpload.value = ''; 
            } catch (e) {
                 console.error("Could not remove logo from localStorage:", e);
            }
        });
    }
    
    // --- Signature Logic ---
    function loadSignature() {
        if (!signaturePreview || !removeSignatureBtn) return;
        if (sigMode !== 'upload') return; 
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

    if (removeSignatureBtn) {
        removeSignatureBtn.addEventListener('click', () => {
            if (sigMode === 'upload') {
                try {
                    localStorage.removeItem(signatureStorageKey);
                    if (signaturePreview) signaturePreview.src = ''; 
                    if (signaturePreview) signaturePreview.classList.add('hidden');
                    removeSignatureBtn.classList.add('hidden');
                    if (signatureUpload) signatureUpload.value = ''; 
                } catch (e) {
                    console.error("Could not remove signature from localStorage:", e);
                }
            } else if (sigMode === 'draw') {
                if (sigClearBtn) sigClearBtn.click(); 
            }
        });
    }

    // --- Signature Tab and Canvas Logic ---
    if (sigTabUpload) {
        sigTabUpload.addEventListener('click', () => {
            sigMode = 'upload';
            if (uploadPanel) uploadPanel.classList.remove('hidden');
            if (drawPanel) drawPanel.classList.add('hidden');
            sigTabUpload.classList.add('border-red-500', 'text-white');
            sigTabUpload.classList.remove('border-transparent', 'text-gray-400');
            if (sigTabDraw) {
                sigTabDraw.classList.add('border-transparent', 'text-gray-400');
                sigTabDraw.classList.remove('border-red-500', 'text-white');
            }
            loadSignature(); 
        });
    }

    if (sigTabDraw) {
        sigTabDraw.addEventListener('click', () => {
            sigMode = 'draw';
            if (uploadPanel) uploadPanel.classList.add('hidden');
            if (drawPanel) drawPanel.classList.remove('hidden');
            sigTabDraw.classList.add('border-red-500', 'text-white');
            sigTabDraw.classList.remove('border-transparent', 'text-gray-400');
            if (sigTabUpload) {
                sigTabUpload.classList.add('border-transparent', 'text-gray-400');
                sigTabUpload.classList.remove('border-red-500', 'text-white');
            }
            
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

    // --- Canvas drawing logic ---
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
        if (evt.touches) { 
            clientX = evt.touches[0].clientX;
            clientY = evt.touches[0].clientY;
        } else { 
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
        e.preventDefault(); 
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
        
        if (e.type !== 'mouseout' && sigCanvas) {
            const dataUrl = sigCanvas.toDataURL();
            if (signaturePreview) signaturePreview.src = dataUrl;
            if (signaturePreview) signaturePreview.classList.remove('hidden');
            if (removeSignatureBtn) removeSignatureBtn.classList.remove('hidden');
        }
    }
    
    function isCanvasBlank(canvas) {
        if (!canvas) return true;
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();
    }

    if (sigCanvas) {
        sigCanvas.addEventListener('mousedown', startDrawing);
        sigCanvas.addEventListener('mousemove', draw);
        sigCanvas.addEventListener('mouseup', stopDrawing);
        sigCanvas.addEventListener('mouseout', stopDrawing); 

        sigCanvas.addEventListener('touchstart', startDrawing);
        sigCanvas.addEventListener('touchmove', draw);
        sigCanvas.addEventListener('touchend', stopDrawing);
    }

    if (sigClearBtn) {
        sigClearBtn.addEventListener('click', () => {
            if (sigContext && sigCanvas) sigContext.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            if (signaturePreview) signaturePreview.src = '';
            if (signaturePreview) signaturePreview.classList.add('hidden');
            if (removeSignatureBtn) removeSignatureBtn.classList.add('hidden');
        });
    }

    // --- Initial Setup ---
    [currencySelect, taxRateSelect].forEach(el => {
        if (el) el.addEventListener('input', updateTotals);
    });
    
    if (itemsContainer) {
        itemsContainer.addEventListener('input', (e) => {
            if (e.target.matches('.item-qty, .item-price, .item-desc')) {
                updateTotals();
            }
        });
    }
    
    if (addItemBtn) {
        addItemBtn.addEventListener('click', createItemRow);
    }
    
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
            const targetButton = e.target.closest('.step-indicator');
            if (targetButton) {
                const targetStep = parseInt(targetButton.dataset.step);
                showStep(targetStep);
            }
        });
    });

    loadLogo(); 
    loadSignature(); 
    updateTotals(); 
    checkAddItemButtonState(); 
    showStep(1); 
    
    
    // --- Modal Logic ---
    function closeModal() {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        if (modalContent) {
            modalContent.innerHTML = ''; 
        }
        document.body.style.overflow = '';
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    if (modalPrintBtn) {
        modalPrintBtn.addEventListener('click', () => {
            const iframe = modalContent.querySelector('iframe');
            if (iframe) {
                iframe.contentWindow.print();
            }
        });
    }

    // --- HTML Invoice Generation (MODIFIED: Compact Vertical Spacing & Standard Fonts) ---
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            document.body.style.overflow = 'hidden';

            let logoBase64 = null;
            try {
                logoBase64 = localStorage.getItem(logoStorageKey);
            } catch (e) {
                console.error("Could not read logo from localStorage:", e);
            }
            
            let signatureBase64 = null;
            if (sigMode === 'upload') {
                try {
                    signatureBase64 = localStorage.getItem(signatureStorageKey);
                } catch (e) {
                    console.error("Could not read signature from localStorage:", e);
                }
            } else if (sigMode === 'draw' && sigCanvas && !isCanvasBlank(sigCanvas)) {
                signatureBase64 = sigCanvas.toDataURL(); 
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
            
            const yourContact = yourContactEl ? yourContactEl.value : ""; 
            const clientContact = clientContactEl ? clientContactEl.value : ""; 
            
            const currency = currencyEl ? currencyEl.value : "INR";
            const currencySymbol = currencySymbols[currency] || '₹';
            const taxRate = taxRateEl ? (parseFloat(taxRateEl.value) || 0) : 0;

            const subtotal = subtotalAmountEl ? (parseFloat(subtotalAmountEl.innerText) || 0) : 0;
            const taxAmount = gstAmountEl ? (parseFloat(gstAmountEl.innerText) || 0) : 0;
            const total = totalAmountEl ? (parseFloat(totalAmountEl.innerText) || 0) : 0;
            
            const invoiceNotes = invoiceNotesEl ? invoiceNotesEl.value : ""; 

            const date = new Date().toLocaleDateString('en-IN');
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
            
            const dueDate = date;

            let logoHtml = '';
            if (logoBase64) {
                logoHtml = `<img src="${logoBase64}" alt="Business Logo" class="logo">`;
            } else {
                logoHtml = `<div class="default-logo-icon"><i class="fa-solid fa-receipt"></i></div>`;
            }
            
            let itemsHtml = '';
            const itemFormRows = document.querySelectorAll('#invoice-items-container .item-row');
            itemFormRows.forEach(row => {
                const desc = (row.querySelector('.item-desc')?.value || '').trim() || 'Service/Product';
                const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
                const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
                const rowTotal = (qty * price);

                if (desc || qty > 0 || price > 0) {
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

            // --- REFINED INVOICE TEMPLATE ---
            const invoiceHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Invoice ${invoiceNumber}</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
                    <style>
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
                            /* Standardized Font Size */
                            font-size: 12px; 
                            line-height: 1.3;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        
                        .invoice-container { 
                            max-width: 840px; 
                            min-height: 1188px; 
                            margin: 20px auto; 
                            background-color: #fff; 
                            border: 1px solid #ddd; 
                            padding: 0;
                            box-shadow: 0 0 15px rgba(0,0,0,0.07);
                            position: relative; 
                            z-index: 2; 
                        }
                        
                        .watermark {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%) rotate(-45deg);
                            font-size: 100px;
                            font-weight: bold;
                            color: rgba(0, 0, 0, 0.04); 
                            white-space: nowrap;
                            z-index: 1; 
                            user-select: none;
                        }
                        .watermark .cursive {
                            font-family: 'Dancing Script', cursive;
                            font-size: 120px; 
                        }

                        /* Compact Header */
                        .invoice-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            padding: 20px 30px 15px; /* Reduced padding */
                            border-bottom: 2px solid #f4f4f4;
                        }
                        .header-left .logo {
                            max-width: 200px;
                            max-height: 60px; /* Constrain height */
                            object-fit: contain;
                            display: block;
                        }
                        .header-left .default-logo-icon {
                            font-size: 40px;
                            color: #E50914;
                            width: 60px;
                            height: 60px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        .header-right {
                            text-align: right;
                        }
                        .header-right h1 {
                            margin: 0 0 5px 0;
                            color: #E50914;
                            font-size: 24px; /* Reduced size */
                            font-weight: 700;
                        }
                        .header-right p {
                            margin: 0;
                            font-size: 12px; /* Standard size */
                            color: #555;
                            line-height: 1.4;
                        }
                        .header-right p strong {
                            color: #000;
                        }

                        /* Compact From/To Parties */
                        .invoice-parties {
                            padding: 15px 30px; /* Reduced vertical padding */
                            display: flex;
                            justify-content: space-between;
                            gap: 15px; /* Reduced gap */
                        }
                        .party-box {
                            width: 48%;
                            background: #fdfdfd;
                            border: 1px solid #eee;
                            border-radius: 6px;
                            padding: 10px 12px; /* Compact padding inside box */
                        }
                        .party-box h3 {
                            font-size: 11px; /* Small, uppercase label */
                            color: #E50914; 
                            font-weight: 600;
                            margin-top: 0;
                            margin-bottom: 5px; /* Tighter margin */
                            text-transform: uppercase;
                            text-align: left; 
                        }
                        .party-box-content {
                            text-align: left;
                        }
                        .party-box p {
                            font-size: 12px;
                            line-height: 1.4;
                            white-space: pre-line;
                            margin: 0 0 2px 0; /* Tighter lines */
                            color: #333;
                        }
                        .party-box p.party-name {
                            font-size: 13px; /* Only slightly larger */
                            font-weight: 700;
                            color: #000;
                            margin-bottom: 4px;
                        }
                        
                        /* Table */
                        .invoice-table {
                            padding: 5px 30px 15px;
                        }
                        table.items {
                            width: 100%;
                            border-collapse: collapse;
                            border-radius: 6px; 
                            overflow: hidden; 
                            box-shadow: 0 2px 5px rgba(0,0,0,0.03);
                        }
                        table.items th, table.items td {
                            padding: 8px 10px; /* Reduced cell padding */
                            text-align: left;
                            border-bottom: 1px solid #eee;
                            font-size: 12px;
                        }
                        table.items th {
                            background-image: linear-gradient(to bottom, #a10f18, #E50914);
                            color: #ffffff;
                            font-weight: 600;
                            font-size: 11px; /* Smaller header font */
                            text-transform: uppercase;
                            border-bottom: 1px solid #a10f18;
                        }
                        table.items tbody tr:nth-of-type(even) {
                            background-color: #fff8f8; 
                        }
                        table.items td.right, table.items th.right {
                            text-align: right;
                        }
                        
                        /* Bottom Section */
                        .invoice-bottom-section {
                            padding: 10px 30px 30px;
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start; 
                        }
                        .invoice-bottom-left { 
                            width: 55%;
                        }
                        .invoice-bottom-right { 
                            width: 40%;
                        }

                        .totals-box {
                            width: 100%;
                            margin-bottom: 25px; 
                        }
                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 4px 0; /* Tighter totals */
                            font-size: 12px;
                            color: #333;
                        }
                        .total-row span:first-child {
                            color: #555;
                        }
                        .total-row.grand-total {
                            font-size: 14px; /* Slightly larger */
                            font-weight: 700;
                            color: #E50914;
                            border-top: 1px solid #333;
                            margin-top: 8px;
                            padding-top: 8px;
                        }

                        .notes h3, .signature h3 {
                            font-size: 11px;
                            color: #777;
                            font-weight: 500;
                            margin-bottom: 4px;
                            text-transform: uppercase;
                        }
                        .notes p {
                            font-size: 12px;
                            color: #555;
                            margin: 0;
                            line-height: 1.4;
                            white-space: pre-line;
                        }
                        .signature {
                            margin-top: 20px;
                            text-align: right;
                        }
                        .signature img {
                            max-height: 45px;
                            object-fit: contain;
                            margin-bottom: 4px;
                        }
                        .signature p {
                            font-size: 11px;
                            color: #555;
                            border-top: 1px solid #ccc;
                            padding-top: 4px;
                            display: inline-block;
                            margin: 0;
                        }
                        
                        .invoice-footer {
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            padding: 15px 30px;
                            text-align: center;
                            font-size: 11px;
                            color: #999;
                            border-top: 1px solid #eee;
                        }
                        .invoice-footer p { margin: 2px 0; }
                        
                        .footer-logo {
                            font-family: 'Inter', sans-serif; 
                            font-size: 12px;
                            font-weight: 700; 
                            color: #555; 
                            display: inline-block;
                            margin-left: 6px;
                            vertical-align: middle;
                        }
                        .footer-logo .cursive {
                            font-family: 'Dancing Script', cursive; 
                            font-size: 14px;
                            color: #E50914;
                        }

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
                                position: static; 
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
                                padding: 15mm; 
                                box-sizing: border-box;
                                height: 297mm;
                                width: 210mm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
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
                                <span class="footer-logo">Desi<span class="cursive">Bill</span></span>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            if (modal && modalContent) {
                modal.dataset.invoiceNumber = invoiceNumber;
                modal.dataset.clientContact = clientContact; 
                modal.dataset.clientName = clientName;
                modal.dataset.yourName = yourName;
                modal.dataset.total = total.toFixed(2);
                modal.dataset.currencySymbol = currencySymbol;
                
                const iframe = document.createElement('iframe');
                iframe.className = 'w-full h-[75vh] border-0 bg-white';
                iframe.srcdoc = invoiceHtml; 
                
                modalContent.innerHTML = ''; 
                modalContent.appendChild(iframe);
                modal.classList.remove('hidden');
                modal.classList.add('flex'); 
            } else {
                console.error("Modal elements not found. Could not display preview.");
            }
        });
    }
    
});
