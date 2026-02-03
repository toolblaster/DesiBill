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
    
    // NEW: Discount Elements
    const discountTypeSelect = document.getElementById('discount-type');
    const discountInput = document.getElementById('discount-value');
    const discountRowEl = document.getElementById('discount-row');
    const discountAmountEl = document.getElementById('discount-amount');

    // NEW: Invoice Details Elements
    const invoiceNumberInput = document.getElementById('invoice-number');
    const invoiceDateInput = document.getElementById('invoice-date');

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

    // NEW: History Elements
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    const historyCloseBtn = document.getElementById('history-close-btn');

    // NEW: Saved Profiles Elements
    const viewSavedBtn = document.getElementById('view-saved-btn');
    const savedModal = document.getElementById('saved-modal');
    const savedMyList = document.getElementById('saved-my-list');
    const savedClientList = document.getElementById('saved-client-list');
    const savedCloseBtn = document.getElementById('saved-close-btn');
    
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
    const historyStorageKey = 'billBharatHistory';
    const savedMyDetailsKey = 'billBharatSavedMyDetails'; // NEW Key
    const savedClientsKey = 'billBharatSavedClients'; // NEW Key

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

    // --- Initialize Defaults ---
    function initDefaults() {
        // Set default invoice number
        if (invoiceNumberInput && !invoiceNumberInput.value) {
            invoiceNumberInput.value = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
        }
        // Set default date to today
        if (invoiceDateInput && !invoiceDateInput.value) {
            invoiceDateInput.valueAsDate = new Date();
        }
    }

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
        
        // 1. Calculate Item Subtotal
        let totalSubtotal = 0;
        const itemRows = itemsContainer.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const qtyInput = row.querySelector('.item-qty');
            const priceInput = row.querySelector('.item-price');
            
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            totalSubtotal += qty * price;
        });

        // 2. Calculate Discount
        let discountVal = parseFloat(discountInput.value) || 0;
        let discountAmt = 0;
        
        if (discountTypeSelect.value === 'percentage') {
            discountAmt = totalSubtotal * (discountVal / 100);
        } else {
            discountAmt = discountVal;
        }
        
        // Validation: Discount cannot exceed subtotal
        if (discountAmt > totalSubtotal) discountAmt = totalSubtotal;

        // 3. Calculate Tax (on discounted amount)
        const taxableAmount = totalSubtotal - discountAmt;
        const taxAmount = taxableAmount * taxRate;
        const total = taxableAmount + taxAmount;

        // Update UI
        subtotalEl.innerText = totalSubtotal.toFixed(2);
        
        if (discountAmt > 0) {
            discountRowEl.classList.remove('hidden');
            discountAmountEl.innerText = discountAmt.toFixed(2);
        } else {
            discountRowEl.classList.add('hidden');
            discountAmountEl.innerText = "0.00";
        }

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
    function createItemRow(descVal = '', qtyVal = 1, priceVal = '') {
        if (itemCount >= maxItems || !itemsContainer) return;
        
        itemCount++;
        const firstItemRow = itemsContainer.querySelector('.item-row');
        
        // Create new row
        let newItemRow;
        if (firstItemRow) {
             newItemRow = firstItemRow.cloneNode(true);
        } else {
            // Fallback if no rows exist (unlikely but safe)
            return;
        }
        
        const inputs = newItemRow.querySelectorAll('input'); 
        
        inputs.forEach(input => {
            const baseId = input.id.replace(/\d+$/, ''); 
            const newId = baseId + itemCount;
            
            const label = newItemRow.querySelector(`label[for="${input.id}"]`);
            if (label) {
                label.setAttribute('for', newId);
            }
            
            input.id = newId;
            if (input.classList.contains('item-desc')) input.value = descVal;
            else if (input.classList.contains('item-qty')) input.value = qtyVal;
            else if (input.classList.contains('item-price')) input.value = priceVal;
        });
        
        // Adjust grid for remove button
        const descWrapper = newItemRow.querySelector(`div:has(> .item-desc)`);
        const qtyWrapper = newItemRow.querySelector(`div:has(> .item-qty)`);
        const priceWrapper = newItemRow.querySelector(`div:has(> .item-price)`);

        // Ensure proper classes are set (resetting first then adding specific)
        if (descWrapper) {
             descWrapper.className = 'col-span-12 md:col-span-6';
        }
        if (qtyWrapper) {
            qtyWrapper.className = 'col-span-4 md:col-span-2'; 
        }
        if (priceWrapper) {
             priceWrapper.className = 'col-span-4 md:col-span-2';
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
        
        const currentItems = itemsContainer.querySelectorAll('.item-row').length;
        // Sync itemCount just in case
        itemCount = currentItems;

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
    // Added listeners for discount inputs
    [currencySelect, taxRateSelect, discountInput, discountTypeSelect].forEach(el => {
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
        addItemBtn.addEventListener('click', () => createItemRow());
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

    initDefaults(); // NEW: Initialize defaults
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

    // --- HISTORY FEATURE IMPLEMENTATION ---

    function getHistory() {
        try {
            const history = localStorage.getItem(historyStorageKey);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error("Error reading history", e);
            return [];
        }
    }

    function saveToHistory(data) {
        let history = getHistory();
        
        // 1. Check for existing invoice with the same Invoice Number
        if (data.invoiceNo) {
            history = history.filter(item => item.invoiceNo !== data.invoiceNo);
        }

        // 2. Add new item to the beginning
        history.unshift(data);
        
        // 3. Limit history to 4 items as requested to save space
        if (history.length > 4) {
            history = history.slice(0, 4);
        }
        
        localStorage.setItem(historyStorageKey, JSON.stringify(history));
    }

    function deleteFromHistory(id) {
        let history = getHistory();
        history = history.filter(item => item.id !== id);
        localStorage.setItem(historyStorageKey, JSON.stringify(history));
        renderHistoryList();
    }

    function loadInvoiceFromHistory(id) {
        const history = getHistory();
        const invoice = history.find(item => item.id === id);
        
        if (!invoice) return;

        // 1. Populate standard fields
        document.getElementById('your-name').value = invoice.formData.yourName || '';
        document.getElementById('your-contact').value = invoice.formData.yourContact || '';
        document.getElementById('your-gstin').value = invoice.formData.yourGstin || '';
        document.getElementById('your-address').value = invoice.formData.yourAddress || '';
        
        document.getElementById('client-name').value = invoice.formData.clientName || '';
        document.getElementById('client-contact').value = invoice.formData.clientContact || '';
        document.getElementById('client-gstin').value = invoice.formData.clientGstin || '';
        document.getElementById('client-address').value = invoice.formData.clientAddress || '';

        document.getElementById('currency').value = invoice.formData.currency || 'INR';
        document.getElementById('tax-rate').value = invoice.formData.taxRate || 0;
        document.getElementById('discount-type').value = invoice.formData.discountType || 'fixed';
        document.getElementById('discount-value').value = invoice.formData.discountValue || '';
        document.getElementById('invoice-notes').value = invoice.formData.notes || '';
        
        if (document.getElementById('invoice-number')) {
            document.getElementById('invoice-number').value = invoice.formData.invoiceNumber || '';
        }
        // Date loading is skipped to prefer current/default or manual entry

        // 2. Re-create Items
        itemsContainer.innerHTML = '';
        itemCount = 0; 
        
        if (invoice.formData.items && invoice.formData.items.length > 0) {
            invoice.formData.items.forEach(item => {
                 createItemRow(item.desc, item.qty, item.price);
            });
        } else {
            createItemRow(); 
        }

        updateTotals();
        closeHistoryModal();
        showStep(1); 
        alert("Invoice loaded from history!");
    }

    function renderHistoryList() {
        if (!historyList) return;
        const history = getHistory();
        
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<p class="text-gray-500 text-center text-sm py-8">No invoices found in history.</p>';
            return;
        }

        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex flex-col sm:flex-row sm:items-center justify-between bg-[#1f1f1f] p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors gap-3';
            
            div.innerHTML = `
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                         <span class="text-white font-bold text-sm">${item.invoiceNo}</span>
                         <span class="text-gray-500 text-xs">• ${item.date}</span>
                    </div>
                    <div class="text-gray-300 text-sm font-medium">${item.clientName || 'Unknown Client'}</div>
                    <div class="text-red-500 text-sm font-bold mt-1">${item.currencySymbol} ${item.total}</div>
                </div>
                <div class="flex items-center gap-2 mt-2 sm:mt-0">
                    <button class="load-btn btn-secondary text-xs px-3 py-2 rounded text-white flex items-center gap-1.5" data-id="${item.id}">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="delete-btn bg-red-900/30 text-red-500 hover:bg-red-900/50 hover:text-red-400 text-xs px-3 py-2 rounded transition-colors" data-id="${item.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            
            historyList.appendChild(div);
        });

        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                loadInvoiceFromHistory(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                 const id = parseInt(e.currentTarget.dataset.id);
                 if(confirm('Delete this invoice from history?')) {
                     deleteFromHistory(id);
                 }
            });
        });
    }

    function openHistoryModal() {
        if (historyModal) {
            renderHistoryList();
            historyModal.classList.remove('hidden');
            historyModal.classList.add('flex');
        }
    }

    function closeHistoryModal() {
        if (historyModal) {
            historyModal.classList.add('hidden');
            historyModal.classList.remove('flex');
        }
    }

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', openHistoryModal);
    }
    
    if (historyCloseBtn) {
        historyCloseBtn.addEventListener('click', closeHistoryModal);
    }
    
    // --- SAVED PROFILES FEATURE IMPLEMENTATION ---

    function getSavedList(key) {
        try {
            const list = localStorage.getItem(key);
            return list ? JSON.parse(list) : [];
        } catch (e) {
            console.error("Error reading saved list", e);
            return [];
        }
    }

    function saveProfile(key, data, nameField) {
        // If data is empty (no name), don't save
        if (!data[nameField] || data[nameField].trim() === '') return;

        let list = getSavedList(key);
        
        // 1. Check for duplicates (by Name), update if exists
        list = list.filter(item => item[nameField] !== data[nameField]);
        
        // 2. Add to top
        list.unshift(data);

        // 3. Limit to 4
        if (list.length > 4) {
            list = list.slice(0, 4);
        }

        localStorage.setItem(key, JSON.stringify(list));
    }

    function renderSavedLists() {
        if (!savedMyList || !savedClientList) return;

        const myDetails = getSavedList(savedMyDetailsKey);
        const clients = getSavedList(savedClientsKey);

        // Render My Details
        savedMyList.innerHTML = '';
        if (myDetails.length === 0) {
            savedMyList.innerHTML = '<p class="text-gray-500 text-xs py-4 text-center">No saved business profiles.</p>';
        } else {
            myDetails.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'bg-[#1f1f1f] p-2.5 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors flex justify-between items-center group cursor-pointer';
                div.onclick = () => loadProfile('my', item);
                div.innerHTML = `
                    <div>
                        <div class="text-white font-medium text-sm">${item.yourName}</div>
                        <div class="text-gray-500 text-xs truncate max-w-[150px]">${item.yourContact || ''}</div>
                    </div>
                    <button class="text-xs bg-red-900/20 text-red-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Select</button>
                `;
                savedMyList.appendChild(div);
            });
        }

        // Render Clients
        savedClientList.innerHTML = '';
        if (clients.length === 0) {
            savedClientList.innerHTML = '<p class="text-gray-500 text-xs py-4 text-center">No saved clients.</p>';
        } else {
            clients.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'bg-[#1f1f1f] p-2.5 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors flex justify-between items-center group cursor-pointer';
                div.onclick = () => loadProfile('client', item);
                div.innerHTML = `
                    <div>
                        <div class="text-white font-medium text-sm">${item.clientName}</div>
                        <div class="text-gray-500 text-xs truncate max-w-[150px]">${item.clientContact || ''}</div>
                    </div>
                    <button class="text-xs bg-red-900/20 text-red-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Select</button>
                `;
                savedClientList.appendChild(div);
            });
        }
    }

    function loadProfile(type, data) {
        if (type === 'my') {
            document.getElementById('your-name').value = data.yourName || '';
            document.getElementById('your-contact').value = data.yourContact || '';
            document.getElementById('your-gstin').value = data.yourGstin || '';
            document.getElementById('your-address').value = data.yourAddress || '';
            alert(`Loaded Business Profile: ${data.yourName}`);
        } else {
            document.getElementById('client-name').value = data.clientName || '';
            document.getElementById('client-contact').value = data.clientContact || '';
            document.getElementById('client-gstin').value = data.clientGstin || '';
            document.getElementById('client-address').value = data.clientAddress || '';
            alert(`Loaded Client Profile: ${data.clientName}`);
        }
        closeSavedModal();
        showStep(1);
    }

    function openSavedModal() {
        if (savedModal) {
            renderSavedLists();
            savedModal.classList.remove('hidden');
            savedModal.classList.add('flex');
        }
    }

    function closeSavedModal() {
        if (savedModal) {
            savedModal.classList.add('hidden');
            savedModal.classList.remove('flex');
        }
    }

    if (viewSavedBtn) {
        viewSavedBtn.addEventListener('click', openSavedModal);
    }
    
    if (savedCloseBtn) {
        savedCloseBtn.addEventListener('click', closeSavedModal);
    }
    
    if (savedModal) {
        savedModal.addEventListener('click', (e) => {
            if (e.target === savedModal) closeSavedModal();
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
            // Discount elements handled in calc, just need display val here
            const discountAmountEl = document.getElementById('discount-amount');

            // NEW: Get manual invoice details
            const invoiceNumberVal = invoiceNumberInput ? invoiceNumberInput.value : `INV-${Date.now().toString().slice(-6)}`;
            const invoiceDateVal = invoiceDateInput && invoiceDateInput.value ? new Date(invoiceDateInput.value).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');


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
            const discountAmount = discountAmountEl ? (parseFloat(discountAmountEl.innerText) || 0) : 0;
            const taxAmount = gstAmountEl ? (parseFloat(gstAmountEl.innerText) || 0) : 0;
            const total = totalAmountEl ? (parseFloat(totalAmountEl.innerText) || 0) : 0;
            
            const invoiceNotes = invoiceNotesEl ? invoiceNotesEl.value : ""; 

            const date = invoiceDateVal;
            const invoiceNumber = invoiceNumberVal;
            
            const dueDate = date;

            // --- SAVE TO SAVED PROFILES (AUTO) ---
            const myProfileData = {
                yourName: yourNameEl?.value,
                yourContact: yourContactEl?.value,
                yourGstin: yourGstinEl?.value,
                yourAddress: yourAddressEl?.value
            };
            saveProfile(savedMyDetailsKey, myProfileData, 'yourName');

            const clientProfileData = {
                clientName: clientNameEl?.value,
                clientContact: clientContactEl?.value,
                clientGstin: clientGstinEl?.value,
                clientAddress: clientAddressEl?.value
            };
            saveProfile(savedClientsKey, clientProfileData, 'clientName');


            // --- SAVE TO HISTORY ---
            // Construct Item Data Array
            const itemDataArray = [];
            const itemFormRows = document.querySelectorAll('#invoice-items-container .item-row');
            itemFormRows.forEach(row => {
                 itemDataArray.push({
                     desc: row.querySelector('.item-desc')?.value || '',
                     qty: row.querySelector('.item-qty')?.value || 1,
                     price: row.querySelector('.item-price')?.value || ''
                 });
            });

            const historyData = {
                id: Date.now(),
                date: date,
                invoiceNo: invoiceNumber,
                clientName: clientName,
                total: total.toFixed(2),
                currencySymbol: currencySymbol,
                formData: {
                    yourName: yourNameEl?.value,
                    yourContact: yourContactEl?.value,
                    yourGstin: yourGstinEl?.value,
                    yourAddress: yourAddressEl?.value,
                    clientName: clientNameEl?.value,
                    clientContact: clientContactEl?.value,
                    clientGstin: clientGstinEl?.value,
                    clientAddress: clientAddressEl?.value,
                    currency: currencyEl?.value,
                    taxRate: taxRateEl?.value,
                    discountType: discountTypeSelect?.value,
                    discountValue: discountInput?.value,
                    notes: invoiceNotesEl?.value,
                    invoiceNumber: invoiceNumberInput?.value,
                    // Note: Date input value is specific format (yyyy-mm-dd), but we saved display string.
                    // For perfect reload, we might want raw input value. 
                    items: itemDataArray
                }
            };
            saveToHistory(historyData);

            let logoHtml = '';
            if (logoBase64) {
                logoHtml = `<img src="${logoBase64}" alt="Business Logo" class="logo">`;
            } else {
                logoHtml = `<div class="default-logo-icon"><i class="fa-solid fa-receipt"></i></div>`;
            }
            
            let itemsHtml = '';
            // Reuse itemFormRows from history save logic
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
            
            if (discountAmount > 0) {
                 totalsHtml += `
                    <div class="total-row">
                        <span>Discount</span>
                        <span class="right" style="color: #E50914;">- ${currencySymbol} ${discountAmount.toFixed(2)}</span>
                    </div>
                `;
            }

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

                        .invoice-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            padding: 20px 30px 15px; 
                            border-bottom: 2px solid #f4f4f4;
                        }
                        .header-left .logo {
                            max-width: 200px;
                            max-height: 60px; 
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
                            font-size: 24px; 
                            font-weight: 700;
                        }
                        .header-right p {
                            margin: 0;
                            font-size: 12px; 
                            color: #555;
                            line-height: 1.4;
                        }
                        .header-right p strong {
                            color: #000;
                        }

                        .invoice-parties {
                            padding: 15px 30px; 
                            display: flex;
                            justify-content: space-between;
                            gap: 15px; 
                        }
                        .party-box {
                            width: 48%;
                            background: #fdfdfd;
                            border: 1px solid #eee;
                            border-radius: 6px;
                            padding: 10px 12px; 
                        }
                        .party-box h3 {
                            font-size: 11px; 
                            color: #E50914; 
                            font-weight: 600;
                            margin-top: 0;
                            margin-bottom: 5px; 
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
                            margin: 0 0 2px 0; 
                            color: #333;
                        }
                        .party-box p.party-name {
                            font-size: 13px; 
                            font-weight: 700;
                            color: #000;
                            margin-bottom: 4px;
                        }
                        
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
                            padding: 8px 10px; 
                            text-align: left;
                            border-bottom: 1px solid #eee;
                            font-size: 12px;
                        }
                        table.items th {
                            background-image: linear-gradient(to bottom, #a10f18, #E50914);
                            color: #ffffff;
                            font-weight: 600;
                            font-size: 11px; 
                            text-transform: uppercase;
                            border-bottom: 1px solid #a10f18;
                        }
                        table.items tbody tr:nth-of-type(even) {
                            background-color: #fff8f8; 
                        }
                        table.items td.right, table.items th.right {
                            text-align: right;
                        }
                        
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
                            padding: 4px 0; 
                            font-size: 12px;
                            color: #333;
                        }
                        .total-row span:first-child {
                            color: #555;
                        }
                        .total-row.grand-total {
                            font-size: 14px; 
                            font-weight: 700;
                            color: #E50914;
                            border-top: 1px solid #333;
                            margin-top: 8px;
                            padding-top: 8px;
                        }

                        .notes h3 {
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
                        /* UPDATED SIGNATURE CSS */
                        .signature {
                            margin-top: 20px;
                            text-align: right;
                            padding-right: 10px;
                        }
                        .sign-content {
                            display: inline-block;
                            text-align: center;
                            min-width: 140px;
                        }
                        .sign-content img {
                            max-height: 30px; /* Reduced Size */
                            width: auto;
                            margin-bottom: 2px; /* Pull closer to line */
                            display: block;
                            margin-left: auto;
                            margin-right: auto;
                        }
                        .sign-content p {
                            font-size: 11px;
                            color: #555;
                            border-top: 1px solid #333; /* Darker line */
                            padding-top: 4px;
                            display: block;
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
                                        <div class="sign-content">
                                            <img src="${signatureBase64}" alt="Signature">
                                            <p>Authorized Signature</p>
                                        </div>
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
