/**
 * SHAREC (Share + Record) - Pure Vanilla JavaScript Engine
 * Neo-Brutalist Bill Splitter & Dues Record Keeper
 * With Full State Persistence across Page Reloads & Offline Support
 * Zero external libraries or frameworks. Accessible by double clicking index.html.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'sharec_bill_data_v1';

  // =========================================================================
  // State Management
  // =========================================================================
  const state = {
    mode: 'total', // 'total' | 'itemwise'
    currency: '$',
    theme: 'light',

    // Equal Split State
    total: {
      occasion: '',
      billAmount: 0,
      peopleCount: 4,
      tipPercent: 0,
      taxAmount: 0,
      serviceAmount: 0,
      results: null,
      dues: [] // { id, payer, borrower, amount, note, cleared: false }
    },

    // Item-Wise Split State
    itemwise: {
      occasion: '',
      totalBill: 0,
      peopleCount: 3,
      people: [
        { id: 'p1', name: 'Alex' },
        { id: 'p2', name: 'Jordan' },
        { id: 'p3', name: 'Taylor' }
      ],
      items: [
        { id: 'i1', name: 'Truffle Fries & Dips', price: 14.50, assignees: ['p1', 'p2', 'p3'] },
        { id: 'i2', name: 'Grilled Ribeye Steak', price: 38.00, assignees: ['p1'] },
        { id: 'i3', name: 'Wild Mushroom Pasta', price: 26.50, assignees: ['p2'] },
        { id: 'i4', name: 'Pan-Seared Salmon', price: 32.00, assignees: ['p3'] }
      ],
      taxAmount: 0,
      serviceAmount: 0,
      tipAmount: 0,
      results: null,
      dues: [] // { id, payer, borrower, amount, note, cleared: false }
    },

    // Base share paid status dictionary: { [dinerId]: boolean }
    paidStatus: {}
  };

  // =========================================================================
  // DOM Cache
  // =========================================================================
  const DOM = {
    // Top Controls
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    currencySelect: document.getElementById('currency-select'),
    btnLoadSample: document.getElementById('btn-load-sample'),
    currencySymbols: document.querySelectorAll('.currency-symbol'),
    statusBanner: document.getElementById('status-banner'),
    bannerMessage: document.getElementById('banner-message'),
    bannerClose: document.getElementById('banner-close'),
    toast: document.getElementById('toast'),

    // Mode Navigation
    tabTotal: document.getElementById('tab-total'),
    tabItemwise: document.getElementById('tab-itemwise'),
    totalModeView: document.getElementById('total-mode-view'),
    itemwiseModeView: document.getElementById('itemwise-mode-view'),

    // Total Mode Elements
    totalOccasion: document.getElementById('total-occasion'),
    totalBillAmount: document.getElementById('total-bill-amount'),
    totalPeopleCount: document.getElementById('total-people-count'),
    totalTipChips: document.getElementById('total-tip-chips'),
    totalTipCalculated: document.getElementById('total-tip-calculated'),
    totalCustomTipBox: document.getElementById('total-custom-tip-box'),
    totalCustomTipVal: document.getElementById('total-custom-tip-val'),
    totalExtraToggle: document.getElementById('total-extra-toggle'),
    totalExtraBody: document.getElementById('total-extra-body'),
    totalTaxAmount: document.getElementById('total-tax-amount'),
    totalServiceAmount: document.getElementById('total-service-amount'),
    btnCalcTotal: document.getElementById('btn-calc-total'),
    btnResetTotal: document.getElementById('btn-reset-total'),
    errTotalBill: document.getElementById('err-total-bill'),
    errTotalPeople: document.getElementById('err-total-people'),

    // Total Dues Form Elements
    totalPayerSelect: document.getElementById('total-payer-select'),
    totalBorrowerSelect: document.getElementById('total-borrower-select'),
    totalCoverAmount: document.getElementById('total-cover-amount'),
    totalCoverNote: document.getElementById('total-cover-note'),
    btnAddCoverTotal: document.getElementById('btn-add-cover-total'),
    totalDuesCount: document.getElementById('total-dues-count'),
    totalDuesList: document.getElementById('total-dues-list'),

    // Total Results Elements
    totalEmptyState: document.getElementById('total-empty-state'),
    totalNoResultState: document.getElementById('total-no-result-state'),
    totalNoResultText: document.getElementById('total-no-result-text'),
    totalResultContent: document.getElementById('total-result-content'),
    totalSuccessBanner: document.getElementById('total-success-banner'),
    totalSuccessText: document.getElementById('total-success-text'),
    totalReceiptOccasion: document.getElementById('total-receipt-occasion'),
    totalReceiptTime: document.getElementById('total-receipt-time'),
    totalReceiptGrand: document.getElementById('total-receipt-grand'),
    totalMetricFood: document.getElementById('total-metric-food'),
    totalMetricFees: document.getElementById('total-metric-fees'),
    totalMetricTip: document.getElementById('total-metric-tip'),
    totalMetricEach: document.getElementById('total-metric-each'),
    totalSharesIndicator: document.getElementById('total-shares-indicator'),
    totalDinersCardsContainer: document.getElementById('total-diners-cards-container'),
    totalNetDuesBox: document.getElementById('total-net-dues-box'),
    totalNetDuesList: document.getElementById('total-net-dues-list'),
    btnExportPdfTotal: document.getElementById('btn-export-pdf-total'),
    btnCopyTotal: document.getElementById('btn-copy-total'),
    btnToggleAllPaidTotal: document.getElementById('btn-toggle-all-paid-total'),

    // Item-Wise Mode Elements
    itemwiseOccasion: document.getElementById('itemwise-occasion'),
    itemwiseTotalBill: document.getElementById('itemwise-total-bill'),
    itemwisePeopleCount: document.getElementById('itemwise-people-count'),
    itemwiseTax: document.getElementById('itemwise-tax'),
    itemwiseService: document.getElementById('itemwise-service'),
    itemwiseTip: document.getElementById('itemwise-tip'),
    errItemwiseBill: document.getElementById('err-itemwise-bill'),
    errItemwisePeople: document.getElementById('err-itemwise-people'),

    // Item-Wise Members & Items Elements
    btnAddMember: document.getElementById('btn-add-member'),
    peopleNamesContainer: document.getElementById('people-names-container'),
    btnAddItem: document.getElementById('btn-add-item'),
    itemsListContainer: document.getElementById('items-list-container'),
    btnCalcItemwise: document.getElementById('btn-calc-itemwise'),
    btnResetItemwise: document.getElementById('btn-reset-itemwise'),

    // Ticker Elements
    tickerItemsSubtotal: document.getElementById('ticker-items-subtotal'),
    tickerExtras: document.getElementById('ticker-extras'),
    tickerSumTotal: document.getElementById('ticker-sum-total'),
    tickerTargetDiff: document.getElementById('ticker-target-diff'),

    // Item-Wise Dues Form Elements
    itemwisePayerSelect: document.getElementById('itemwise-payer-select'),
    itemwiseBorrowerSelect: document.getElementById('itemwise-borrower-select'),
    itemwiseCoverAmount: document.getElementById('itemwise-cover-amount'),
    itemwiseCoverNote: document.getElementById('itemwise-cover-note'),
    btnAddCoverItemwise: document.getElementById('btn-add-cover-itemwise'),
    itemwiseDuesCount: document.getElementById('itemwise-dues-count'),
    itemwiseDuesList: document.getElementById('itemwise-dues-list'),

    // Item-Wise Results Elements
    itemwiseEmptyState: document.getElementById('itemwise-empty-state'),
    itemwiseNoResultState: document.getElementById('itemwise-no-result-state'),
    itemwiseNoResultText: document.getElementById('itemwise-no-result-text'),
    itemwiseItemAlertTip: document.getElementById('itemwise-item-alert-tip'),
    itemwiseResultContent: document.getElementById('itemwise-result-content'),
    itemwiseSuccessBanner: document.getElementById('itemwise-success-banner'),
    itemwiseSuccessText: document.getElementById('itemwise-success-text'),
    itemwiseReceiptOccasion: document.getElementById('itemwise-receipt-occasion'),
    itemwiseReceiptTime: document.getElementById('itemwise-receipt-time'),
    itemwiseReceiptGrand: document.getElementById('itemwise-receipt-grand'),
    itemwiseMetricFood: document.getElementById('itemwise-metric-food'),
    itemwiseMetricFees: document.getElementById('itemwise-metric-fees'),
    itemwiseMetricTip: document.getElementById('itemwise-metric-tip'),
    itemwiseMetricDiners: document.getElementById('itemwise-metric-diners'),
    itemwiseSharesIndicator: document.getElementById('itemwise-shares-indicator'),
    itemwiseDinersCardsContainer: document.getElementById('itemwise-diners-cards-container'),
    itemwiseNetDuesBox: document.getElementById('itemwise-net-dues-box'),
    itemwiseNetDuesList: document.getElementById('itemwise-net-dues-list'),
    btnExportPdfItemwise: document.getElementById('btn-export-pdf-itemwise'),
    btnCopyItemwise: document.getElementById('btn-copy-itemwise'),
    btnToggleAllPaidItemwise: document.getElementById('btn-toggle-all-paid-itemwise'),

    // Modal
    resetConfirmModal: document.getElementById('reset-confirm-modal'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalConfirmResetBtn: document.getElementById('modal-confirm-reset-btn')
  };

  // =========================================================================
  // Persistence Engine (LocalStorage Save & Restore)
  // =========================================================================
  function saveStateToStorage() {
    try {
      const dataToSave = {
        mode: state.mode,
        currency: state.currency,
        paidStatus: state.paidStatus,
        total: {
          occasion: DOM.totalOccasion ? DOM.totalOccasion.value : '',
          billAmount: DOM.totalBillAmount ? DOM.totalBillAmount.value : '',
          peopleCount: DOM.totalPeopleCount ? DOM.totalPeopleCount.value : '4',
          tipPercent: state.total.tipPercent,
          customTipVal: DOM.totalCustomTipVal ? DOM.totalCustomTipVal.value : '',
          taxAmount: DOM.totalTaxAmount ? DOM.totalTaxAmount.value : '',
          serviceAmount: DOM.totalServiceAmount ? DOM.totalServiceAmount.value : '',
          dues: state.total.dues || [],
          results: state.total.results || null
        },
        itemwise: {
          occasion: DOM.itemwiseOccasion ? DOM.itemwiseOccasion.value : '',
          totalBill: DOM.itemwiseTotalBill ? DOM.itemwiseTotalBill.value : '',
          peopleCount: DOM.itemwisePeopleCount ? DOM.itemwisePeopleCount.value : '3',
          taxAmount: DOM.itemwiseTax ? DOM.itemwiseTax.value : '',
          serviceAmount: DOM.itemwiseService ? DOM.itemwiseService.value : '',
          tipAmount: DOM.itemwiseTip ? DOM.itemwiseTip.value : '',
          people: state.itemwise.people || [],
          items: state.itemwise.items || [],
          dues: state.itemwise.dues || [],
          results: state.itemwise.results || null
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }
  }

  function loadStateFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved) return false;

      // Restore Currency
      if (saved.currency) {
        state.currency = saved.currency;
        if (DOM.currencySelect) DOM.currencySelect.value = saved.currency;
        updateCurrencySymbols();
      }

      // Restore Paid Status
      if (saved.paidStatus) {
        state.paidStatus = saved.paidStatus;
      }

      // Restore Equal Split State & Fields
      if (saved.total) {
        if (DOM.totalOccasion) DOM.totalOccasion.value = saved.total.occasion || '';
        if (DOM.totalBillAmount) DOM.totalBillAmount.value = saved.total.billAmount || '';
        if (DOM.totalPeopleCount) DOM.totalPeopleCount.value = saved.total.peopleCount || '4';
        if (DOM.totalTaxAmount) DOM.totalTaxAmount.value = saved.total.taxAmount || '';
        if (DOM.totalServiceAmount) DOM.totalServiceAmount.value = saved.total.serviceAmount || '';

        state.total.tipPercent = typeof saved.total.tipPercent === 'number' ? saved.total.tipPercent : 0;
        if (DOM.totalTipChips) {
          DOM.totalTipChips.querySelectorAll('.btn-tip-pill').forEach(b => b.classList.remove('active'));
          let matched = false;
          DOM.totalTipChips.querySelectorAll('.btn-tip-pill').forEach(b => {
            if (b.dataset.percent === String(state.total.tipPercent)) {
              b.classList.add('active');
              matched = true;
            }
          });
          if (!matched && state.total.tipPercent > 0) {
            const customBtn = DOM.totalTipChips.querySelector('[data-percent="custom"]');
            if (customBtn) customBtn.classList.add('active');
            if (DOM.totalCustomTipBox) DOM.totalCustomTipBox.classList.remove('hidden');
            if (DOM.totalCustomTipVal) DOM.totalCustomTipVal.value = saved.total.customTipVal || state.total.tipPercent;
          } else if (matched && state.total.tipPercent === 0) {
            const chip0 = DOM.totalTipChips.querySelector('[data-percent="0"]');
            if (chip0) chip0.classList.add('active');
          }
        }

        if (saved.total.taxAmount || saved.total.serviceAmount) {
          if (DOM.totalExtraBody) DOM.totalExtraBody.classList.remove('hidden');
          if (DOM.totalExtraToggle) {
            const ind = DOM.totalExtraToggle.querySelector('.acc-indicator');
            if (ind) ind.textContent = '▲';
          }
        }

        if (Array.isArray(saved.total.dues)) {
          state.total.dues = saved.total.dues;
        }

        updateTotalTipPreview();
        updateTotalDuesDropdowns();
        renderDuesList('total');

        if (saved.total.results) {
          state.total.results = saved.total.results;
          renderTotalResults(state.total.results);
        }
      }

      // Restore Item-Wise Split State & Fields
      if (saved.itemwise) {
        if (DOM.itemwiseOccasion) DOM.itemwiseOccasion.value = saved.itemwise.occasion || '';
        if (DOM.itemwiseTotalBill) DOM.itemwiseTotalBill.value = saved.itemwise.totalBill || '';
        if (DOM.itemwisePeopleCount) DOM.itemwisePeopleCount.value = saved.itemwise.peopleCount || '3';
        if (DOM.itemwiseTax) DOM.itemwiseTax.value = saved.itemwise.taxAmount || '';
        if (DOM.itemwiseService) DOM.itemwiseService.value = saved.itemwise.serviceAmount || '';
        if (DOM.itemwiseTip) DOM.itemwiseTip.value = saved.itemwise.tipAmount || '';

        if (Array.isArray(saved.itemwise.people) && saved.itemwise.people.length > 0) {
          state.itemwise.people = saved.itemwise.people;
        }
        if (Array.isArray(saved.itemwise.items)) {
          state.itemwise.items = saved.itemwise.items;
        }
        if (Array.isArray(saved.itemwise.dues)) {
          state.itemwise.dues = saved.itemwise.dues;
        }

        renderPeopleRoster();
        renderItemsList();
        updateItemwiseTicker();
        updateItemwiseDuesDropdowns();
        renderDuesList('itemwise');

        if (saved.itemwise.results) {
          state.itemwise.results = saved.itemwise.results;
          renderItemwiseResults(state.itemwise.results);
        }
      }

      // Restore Active Mode View
      if (saved.mode) {
        switchMode(saved.mode);
      }
      return true;
    } catch (err) {
      console.warn('Could not load from localStorage:', err);
      return false;
    }
  }

  // =========================================================================
  // Theme & Currency
  // =========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('sharec_theme') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);

    DOM.themeToggleBtn.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
      setTheme(nextTheme);
      showToast(`Theme: ${nextTheme.toUpperCase()}`);
    });
  }

  function setTheme(theme) {
    state.theme = theme;
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
    localStorage.setItem('sharec_theme', theme);
  }

  function initCurrency() {
    DOM.currencySelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      updateCurrencySymbols();
      updateTotalTipPreview();
      updateItemwiseTicker();
      if (state.mode === 'total' && state.total.results) {
        calculateTotalSplit();
      } else if (state.mode === 'itemwise' && state.itemwise.results) {
        calculateItemwiseSplit();
      }
      renderDuesList('total');
      renderDuesList('itemwise');
      saveStateToStorage();
      showToast(`Currency: ${state.currency}`);
    });
  }

  function updateCurrencySymbols() {
    DOM.currencySymbols = document.querySelectorAll('.currency-symbol');
    DOM.currencySymbols.forEach(el => {
      el.textContent = state.currency;
    });
  }

  function formatMoney(amount) {
    const num = isNaN(amount) ? 0 : Number(amount);
    return `${state.currency}${num.toFixed(2)}`;
  }

  // =========================================================================
  // Mode Switcher (Shows ONLY ONE mode workspace at a time)
  // =========================================================================
  function initModeSwitch() {
    DOM.tabTotal.addEventListener('click', () => switchMode('total'));
    DOM.tabItemwise.addEventListener('click', () => switchMode('itemwise'));
  }

  function switchMode(newMode) {
    state.mode = newMode;

    if (newMode === 'total') {
      DOM.tabTotal.classList.add('active');
      DOM.tabTotal.setAttribute('aria-selected', 'true');
      DOM.tabItemwise.classList.remove('active');
      DOM.tabItemwise.setAttribute('aria-selected', 'false');

      // Hide Item-Wise completely, Show Total
      DOM.totalModeView.classList.remove('hidden');
      DOM.totalModeView.classList.add('active');
      DOM.itemwiseModeView.classList.add('hidden');
      DOM.itemwiseModeView.classList.remove('active');

      updateTotalDuesDropdowns();
      renderDuesList('total');

      if (state.total.results) {
        renderTotalResults(state.total.results);
      } else {
        DOM.totalEmptyState.classList.remove('hidden');
        DOM.totalNoResultState.classList.add('hidden');
        DOM.totalResultContent.classList.add('hidden');
      }
    } else {
      DOM.tabItemwise.classList.add('active');
      DOM.tabItemwise.setAttribute('aria-selected', 'true');
      DOM.tabTotal.classList.remove('active');
      DOM.tabTotal.setAttribute('aria-selected', 'false');

      // Hide Total completely, Show Item-Wise
      DOM.itemwiseModeView.classList.remove('hidden');
      DOM.itemwiseModeView.classList.add('active');
      DOM.totalModeView.classList.add('hidden');
      DOM.totalModeView.classList.remove('active');

      renderPeopleRoster();
      renderItemsList();
      updateItemwiseTicker();
      updateItemwiseDuesDropdowns();
      renderDuesList('itemwise');

      if (state.itemwise.results) {
        renderItemwiseResults(state.itemwise.results);
      } else {
        DOM.itemwiseEmptyState.classList.remove('hidden');
        DOM.itemwiseNoResultState.classList.add('hidden');
        DOM.itemwiseResultContent.classList.add('hidden');
      }
    }
    hideBanner();
    saveStateToStorage();
  }

  // =========================================================================
  // Total Splitting Logic & Form
  // =========================================================================
  function initTotalSplitting() {
    // Tip selector buttons
    DOM.totalTipChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-tip-pill');
      if (!btn) return;

      DOM.totalTipChips.querySelectorAll('.btn-tip-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const pct = btn.dataset.percent;
      if (pct === 'custom') {
        DOM.totalCustomTipBox.classList.remove('hidden');
        DOM.totalCustomTipVal.focus();
        state.total.tipPercent = parseFloat(DOM.totalCustomTipVal.value) || 0;
      } else {
        DOM.totalCustomTipBox.classList.add('hidden');
        state.total.tipPercent = parseFloat(pct) || 0;
      }
      updateTotalTipPreview();
      saveStateToStorage();
    });

    DOM.totalCustomTipVal.addEventListener('input', () => {
      state.total.tipPercent = Math.max(0, parseFloat(DOM.totalCustomTipVal.value) || 0);
      updateTotalTipPreview();
      saveStateToStorage();
    });

    DOM.totalOccasion.addEventListener('input', saveStateToStorage);

    DOM.totalBillAmount.addEventListener('input', () => {
      updateTotalTipPreview();
      saveStateToStorage();
    });

    DOM.totalPeopleCount.addEventListener('input', () => {
      let val = parseInt(DOM.totalPeopleCount.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      state.total.peopleCount = val;
      updateTotalDuesDropdowns();
      saveStateToStorage();
    });

    DOM.totalTaxAmount.addEventListener('input', saveStateToStorage);
    DOM.totalServiceAmount.addEventListener('input', saveStateToStorage);

    // Extra taxes toggle
    DOM.totalExtraToggle.addEventListener('click', () => {
      const isHidden = DOM.totalExtraBody.classList.contains('hidden');
      DOM.totalExtraBody.classList.toggle('hidden', !isHidden);
      DOM.totalExtraToggle.querySelector('.acc-indicator').textContent = isHidden ? '▲' : '▼';
    });

    // Actions
    DOM.btnCalcTotal.addEventListener('click', calculateTotalSplit);
    DOM.btnResetTotal.addEventListener('click', () => openResetModal('total'));

    // Dues Record Form in Total Mode
    DOM.btnAddCoverTotal.addEventListener('click', addCoverTotal);

    DOM.btnExportPdfTotal.addEventListener('click', () => exportToPdf('total'));
    DOM.btnCopyTotal.addEventListener('click', () => copyFullSummary('total'));
    DOM.btnToggleAllPaidTotal.addEventListener('click', () => toggleAllPaidStatus('total'));

    updateTotalDuesDropdowns();
  }

  function updateTotalTipPreview() {
    const bill = parseFloat(DOM.totalBillAmount.value) || 0;
    const tipAmount = (bill * state.total.tipPercent) / 100;
    DOM.totalTipCalculated.textContent = `TIP: ${formatMoney(tipAmount)}`;
  }

  function updateTotalDuesDropdowns() {
    const count = parseInt(DOM.totalPeopleCount.value, 10) || 4;
    DOM.totalPayerSelect.innerHTML = '';
    DOM.totalBorrowerSelect.innerHTML = '';

    for (let i = 1; i <= count; i++) {
      const opt1 = document.createElement('option');
      opt1.value = `Person ${i}`;
      opt1.textContent = `Person ${i}`;
      DOM.totalPayerSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = `Person ${i}`;
      opt2.textContent = `Person ${i}`;
      DOM.totalBorrowerSelect.appendChild(opt2);
    }

    if (count > 1) {
      DOM.totalBorrowerSelect.selectedIndex = 1;
    }
  }

  function calculateTotalSplit() {
    clearFieldErrors();
    const rawBill = DOM.totalBillAmount.value.trim();
    const rawPeople = DOM.totalPeopleCount.value.trim();

    const bill = parseFloat(rawBill);
    const people = parseInt(rawPeople, 10);
    const occasion = DOM.totalOccasion.value.trim() || 'Dinner Outing';
    const tax = Math.max(0, parseFloat(DOM.totalTaxAmount.value) || 0);
    const service = Math.max(0, parseFloat(DOM.totalServiceAmount.value) || 0);

    // Mandatory Validation:
    // "show a no result message if, bill no. or no. of people is blank, zero or negative for the required inputs."
    if (!rawBill || isNaN(bill) || bill <= 0 || !rawPeople || isNaN(people) || people <= 0) {
      let reasons = [];
      if (!rawBill || isNaN(bill) || bill <= 0) {
        DOM.errTotalBill.textContent = 'Enter a valid bill amount greater than 0.';
        DOM.totalBillAmount.classList.add('input-error');
        reasons.push('Total bill amount is blank, zero, or negative');
      }
      if (!rawPeople || isNaN(people) || people <= 0) {
        DOM.errTotalPeople.textContent = 'Number of people must be at least 1.';
        DOM.totalPeopleCount.classList.add('input-error');
        reasons.push('Number of people is blank, zero, or negative');
      }

      showNoResultState('total', reasons.join(' and ') + '.');
      state.total.results = null;
      saveStateToStorage();
      return;
    }

    // Calculations
    const tipAmount = (bill * state.total.tipPercent) / 100;
    const grandTotal = bill + tax + service + tipAmount;
    const baseSharePerPerson = grandTotal / people;

    const diners = [];
    let allocatedTotal = 0;

    for (let i = 1; i <= people; i++) {
      const share = Math.round(baseSharePerPerson * 100) / 100;
      diners.push({
        id: `total-p-${i}`,
        name: `Person ${i}`,
        foodSubtotal: bill / people,
        taxShare: tax / people,
        serviceShare: service / people,
        tipShare: tipAmount / people,
        totalShare: share,
        items: []
      });
      allocatedTotal += share;
    }

    // Cent discrepancy adjustment on last diner
    const diff = Math.round((grandTotal - allocatedTotal) * 100) / 100;
    if (diff !== 0 && diners.length > 0) {
      diners[diners.length - 1].totalShare += diff;
    }

    state.total.results = {
      mode: 'total',
      occasion,
      bill,
      tax,
      service,
      tip: tipAmount,
      grandTotal,
      peopleCount: people,
      diners,
      timestamp: new Date().toLocaleDateString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };

    renderTotalResults(state.total.results);
    saveStateToStorage();
  }

  function renderTotalResults(data) {
    hideBanner();
    DOM.totalEmptyState.classList.add('hidden');
    DOM.totalNoResultState.classList.add('hidden');
    DOM.totalResultContent.classList.remove('hidden');

    DOM.totalSuccessText.textContent = `The bill of ${formatMoney(data.grandTotal)} has been split equally among all ${data.peopleCount} members!`;

    DOM.totalReceiptOccasion.textContent = data.occasion.toUpperCase();
    DOM.totalReceiptTime.textContent = data.timestamp;
    DOM.totalReceiptGrand.textContent = formatMoney(data.grandTotal);

    DOM.totalMetricFood.textContent = formatMoney(data.bill);
    DOM.totalMetricFees.textContent = formatMoney(data.tax + data.service);
    DOM.totalMetricTip.textContent = formatMoney(data.tip);
    DOM.totalMetricEach.textContent = formatMoney(data.diners[0].totalShare);

    DOM.totalSharesIndicator.textContent = `${data.peopleCount} Diners &bull; ${formatMoney(data.diners[0].totalShare)} each`;

    // Render Diners Cards
    DOM.totalDinersCardsContainer.innerHTML = '';
    data.diners.forEach((diner, idx) => {
      const isPaid = !!state.paidStatus[diner.id];
      const card = document.createElement('div');
      card.className = `diner-brutal-card ${isPaid ? 'is-paid' : ''}`;
      card.id = `total-card-${diner.id}`;

      card.innerHTML = `
        <div class="diner-card-header">
          <div class="diner-left-id">
            <span class="diner-avatar-stamp">${diner.name.charAt(0)}</span>
            <span class="diner-card-name">${escapeHtml(diner.name)}</span>
          </div>
          <div class="diner-right-total">
            <span class="diner-share-text">${formatMoney(diner.totalShare)}</span>
            <span class="diner-paid-stamp">${isPaid ? '✓ SETTLED' : 'PENDING'}</span>
          </div>
        </div>
        <div class="diner-details-table">
          <div class="detail-row">
            <span>Bill Base Share:</span>
            <span>${formatMoney(diner.foodSubtotal)}</span>
          </div>
          ${(diner.taxShare + diner.serviceShare) > 0 ? `
            <div class="detail-row">
              <span>Tax & Service Fees:</span>
              <span>+${formatMoney(diner.taxShare + diner.serviceShare)}</span>
            </div>
          ` : ''}
          ${diner.tipShare > 0 ? `
            <div class="detail-row">
              <span>Tip Share:</span>
              <span>+${formatMoney(diner.tipShare)}</span>
            </div>
          ` : ''}
          <div class="detail-final-row">
            <span>FINAL SHARE:</span>
            <span>${formatMoney(diner.totalShare)}</span>
          </div>
        </div>
        <div class="diner-footer-actions no-print">
          <label class="paid-toggle-label">
            <input type="checkbox" class="total-paid-checkbox" data-diner-id="${diner.id}" ${isPaid ? 'checked' : ''}>
            <span>TICK OFF AMOUNT PAID</span>
          </label>
          <button type="button" class="btn-copy-diner-share" data-index="${idx}" title="Copy share text">
            COPY SHARE
          </button>
        </div>
      `;

      DOM.totalDinersCardsContainer.appendChild(card);
    });

    attachDinerCardListenersTotal(data);
    renderNetDuesMatrix('total');
  }

  function attachDinerCardListenersTotal(data) {
    DOM.totalDinersCardsContainer.querySelectorAll('.total-paid-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.dinerId;
        const checked = e.target.checked;
        state.paidStatus[id] = checked;

        const card = document.getElementById(`total-card-${id}`);
        if (card) {
          card.classList.toggle('is-paid', checked);
          const stamp = card.querySelector('.diner-paid-stamp');
          if (stamp) stamp.textContent = checked ? '✓ SETTLED' : 'PENDING';
        }
        saveStateToStorage();
      });
    });

    DOM.totalDinersCardsContainer.querySelectorAll('.btn-copy-diner-share').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const diner = data.diners[idx];
        if (!diner) return;

        const text = `Hey ${diner.name}! Your share for ${data.occasion} is ${formatMoney(diner.totalShare)}.\nPaid Status: ${state.paidStatus[diner.id] ? 'Settled' : 'Pending'}`;
        copyToClipboard(text, `${diner.name}'s share copied!`);
      });
    });
  }

  // =========================================================================
  // Item-Wise Splitting Logic & Member Roster (+ Add Member Feature)
  // =========================================================================
  function initItemwiseSplitting() {
    DOM.itemwisePeopleCount.addEventListener('input', () => {
      handlePeopleCountChange();
      saveStateToStorage();
    });

    DOM.itemwiseOccasion.addEventListener('input', saveStateToStorage);

    DOM.btnAddMember.addEventListener('click', () => {
      addNewMember();
      saveStateToStorage();
    });

    DOM.btnAddItem.addEventListener('click', () => {
      addItemRow();
      saveStateToStorage();
    });

    // Auto tip percentage chips in item-wise mode
    document.querySelectorAll('.btn-chip-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        const pct = parseFloat(btn.dataset.tipPercent) || 0;
        const subtotal = calculateItemsSubtotal();
        const tipVal = (subtotal * pct) / 100;
        DOM.itemwiseTip.value = tipVal > 0 ? tipVal.toFixed(2) : '';
        updateItemwiseTicker();
        saveStateToStorage();
      });
    });

    [DOM.itemwiseTotalBill, DOM.itemwiseTax, DOM.itemwiseService, DOM.itemwiseTip].forEach(el => {
      el.addEventListener('input', () => {
        updateItemwiseTicker();
        saveStateToStorage();
      });
    });

    // Actions
    DOM.btnCalcItemwise.addEventListener('click', calculateItemwiseSplit);
    DOM.btnResetItemwise.addEventListener('click', () => openResetModal('itemwise'));

    // Dues Record Form in Item-Wise Mode
    DOM.btnAddCoverItemwise.addEventListener('click', addCoverItemwise);

    DOM.btnExportPdfItemwise.addEventListener('click', () => exportToPdf('itemwise'));
    DOM.btnCopyItemwise.addEventListener('click', () => copyFullSummary('itemwise'));
    DOM.btnToggleAllPaidItemwise.addEventListener('click', () => toggleAllPaidStatus('itemwise'));

    renderPeopleRoster();
    renderItemsList();
    updateItemwiseTicker();
    updateItemwiseDuesDropdowns();
  }

  function addNewMember(customName = '') {
    const currentPeople = state.itemwise.people;
    const newIdx = currentPeople.length + 1;
    const newMemberId = 'p' + (Date.now() + Math.floor(Math.random() * 100));
    const name = customName || `Diner ${newIdx}`;

    currentPeople.push({
      id: newMemberId,
      name: name
    });

    DOM.itemwisePeopleCount.value = currentPeople.length;

    renderPeopleRoster();
    renderItemsList();
    updateItemwiseTicker();
    updateItemwiseDuesDropdowns();
    saveStateToStorage();
    showToast(`Added ${name}! Total members: ${currentPeople.length}`);
  }

  function removeMember(memberId) {
    if (state.itemwise.people.length <= 1) {
      showToast('You must have at least 1 person in the group.');
      return;
    }

    state.itemwise.people = state.itemwise.people.filter(p => p.id !== memberId);
    DOM.itemwisePeopleCount.value = state.itemwise.people.length;

    // Clean up assignees from items
    const validIds = new Set(state.itemwise.people.map(p => p.id));
    state.itemwise.items.forEach(item => {
      item.assignees = item.assignees.filter(id => validIds.has(id));
    });

    // Clean up dues involving this member
    state.itemwise.dues = state.itemwise.dues.filter(d => d.payer !== memberId && d.borrower !== memberId);

    renderPeopleRoster();
    renderItemsList();
    updateItemwiseTicker();
    updateItemwiseDuesDropdowns();
    renderDuesList('itemwise');
    saveStateToStorage();
  }

  function handlePeopleCountChange() {
    let count = parseInt(DOM.itemwisePeopleCount.value, 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 30) count = 30;
    DOM.itemwisePeopleCount.value = count;

    const currentPeople = state.itemwise.people;
    if (count > currentPeople.length) {
      for (let i = currentPeople.length + 1; i <= count; i++) {
        currentPeople.push({
          id: `p${Date.now()}-${i}`,
          name: `Diner ${i}`
        });
      }
    } else if (count < currentPeople.length) {
      currentPeople.splice(count);
      const validIds = new Set(currentPeople.map(p => p.id));
      state.itemwise.items.forEach(item => {
        item.assignees = item.assignees.filter(id => validIds.has(id));
      });
    }

    renderPeopleRoster();
    renderItemsList();
    updateItemwiseTicker();
    updateItemwiseDuesDropdowns();
    saveStateToStorage();
  }

  function renderPeopleRoster() {
    DOM.peopleNamesContainer.innerHTML = '';
    state.itemwise.people.forEach((person, index) => {
      const card = document.createElement('div');
      card.className = 'member-chip-card';
      card.innerHTML = `
        <span class="member-badge-circle">${person.name.charAt(0).toUpperCase()}</span>
        <input type="text" class="member-name-input" data-person-index="${index}" value="${escapeHtml(person.name)}" placeholder="Name" maxlength="24">
        ${state.itemwise.people.length > 1 ? `
          <button type="button" class="btn-del-member" data-member-id="${person.id}" title="Remove member">✕</button>
        ` : ''}
      `;
      DOM.peopleNamesContainer.appendChild(card);
    });

    // Handle name input
    DOM.peopleNamesContainer.querySelectorAll('.member-name-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.personIndex, 10);
        const newName = e.target.value.trim() || `Diner ${idx + 1}`;
        state.itemwise.people[idx].name = newName;

        const card = e.target.closest('.member-chip-card');
        if (card) {
          card.querySelector('.member-badge-circle').textContent = newName.charAt(0).toUpperCase();
        }
        updateAssigneeChipsLabels();
        updateItemwiseDuesDropdowns();
        saveStateToStorage();
      });
    });

    // Handle delete member
    DOM.peopleNamesContainer.querySelectorAll('.btn-del-member').forEach(btn => {
      btn.addEventListener('click', () => {
        removeMember(btn.dataset.memberId);
      });
    });
  }

  function updateAssigneeChipsLabels() {
    document.querySelectorAll('.assign-chip').forEach(chip => {
      const pId = chip.dataset.personId;
      const person = state.itemwise.people.find(p => p.id === pId);
      if (person) {
        chip.textContent = person.name;
      }
    });
  }

  function updateItemwiseDuesDropdowns() {
    DOM.itemwisePayerSelect.innerHTML = '';
    DOM.itemwiseBorrowerSelect.innerHTML = '';

    state.itemwise.people.forEach(p => {
      const opt1 = document.createElement('option');
      opt1.value = p.name;
      opt1.textContent = p.name;
      DOM.itemwisePayerSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = p.name;
      opt2.textContent = p.name;
      DOM.itemwiseBorrowerSelect.appendChild(opt2);
    });

    if (state.itemwise.people.length > 1) {
      DOM.itemwiseBorrowerSelect.selectedIndex = 1;
    }
  }

  function addItemRow(defaultName = '', defaultPrice = '') {
    const newItemId = 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const allPersonIds = state.itemwise.people.map(p => p.id);

    state.itemwise.items.push({
      id: newItemId,
      name: defaultName,
      price: parseFloat(defaultPrice) || 0,
      assignees: [...allPersonIds]
    });

    renderItemsList();
    updateItemwiseTicker();
    saveStateToStorage();

    const lastItemInput = DOM.itemsListContainer.querySelector(`[data-item-id="${newItemId}"] .item-name-input`);
    if (lastItemInput) lastItemInput.focus();
  }

  function renderItemsList() {
    DOM.itemsListContainer.innerHTML = '';
    if (state.itemwise.items.length === 0) {
      DOM.itemsListContainer.innerHTML = `
        <div style="text-align: center; padding: 1.25rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
          NO ITEMS ADDED YET. CLICK <strong>+ ADD ITEM</strong> TO ENTER DISHES & DRINKS.
        </div>
      `;
      return;
    }

    state.itemwise.items.forEach(item => {
      const itemRow = document.createElement('div');
      itemRow.className = 'item-brutal-card';
      itemRow.dataset.itemId = item.id;

      const assigneeChipsHtml = state.itemwise.people.map(person => {
        const isSelected = item.assignees.includes(person.id);
        return `
          <div class="assign-chip ${isSelected ? 'selected' : ''}" data-item-id="${item.id}" data-person-id="${person.id}">
            ${escapeHtml(person.name)}
          </div>
        `;
      }).join('');

      itemRow.innerHTML = `
        <div class="item-top-row">
          <input type="text" class="brutal-input item-name-input" placeholder="Dish or Drink name (e.g. Ribeye, Sangria)" value="${escapeHtml(item.name)}" data-item-id="${item.id}">
          <div class="input-symbol-wrap item-price-wrap">
            <span class="input-sym currency-symbol">${state.currency}</span>
            <input type="number" class="brutal-input input-with-sym item-price-input" placeholder="0.00" step="0.01" min="0" value="${item.price > 0 ? item.price : ''}" data-item-id="${item.id}">
          </div>
          <button type="button" class="btn-remove-dish" data-item-id="${item.id}" title="Remove item" aria-label="Remove item">✕</button>
        </div>
        <div class="item-assignment-box">
          <div class="assignment-head">
            <span class="assign-label">ASSIGNED TO:</span>
            <button type="button" class="btn-split-all" data-item-id="${item.id}">TOGGLE EVERYONE</button>
          </div>
          <div class="assignee-chips-wrap">
            ${assigneeChipsHtml}
          </div>
        </div>
      `;

      DOM.itemsListContainer.appendChild(itemRow);
    });

    attachItemRowEventListeners();
  }

  function attachItemRowEventListeners() {
    DOM.itemsListContainer.querySelectorAll('.item-name-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.dataset.itemId;
        const item = state.itemwise.items.find(i => i.id === id);
        if (item) {
          item.name = e.target.value;
          saveStateToStorage();
        }
      });
    });

    DOM.itemsListContainer.querySelectorAll('.item-price-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.dataset.itemId;
        const item = state.itemwise.items.find(i => i.id === id);
        if (item) {
          item.price = Math.max(0, parseFloat(e.target.value) || 0);
          updateItemwiseTicker();
          saveStateToStorage();
        }
      });
    });

    DOM.itemsListContainer.querySelectorAll('.btn-remove-dish').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.itemId;
        state.itemwise.items = state.itemwise.items.filter(i => i.id !== id);
        renderItemsList();
        updateItemwiseTicker();
        saveStateToStorage();
      });
    });

    DOM.itemsListContainer.querySelectorAll('.assign-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const itemId = chip.dataset.itemId;
        const personId = chip.dataset.personId;
        const item = state.itemwise.items.find(i => i.id === itemId);
        if (!item) return;

        if (item.assignees.includes(personId)) {
          item.assignees = item.assignees.filter(id => id !== personId);
          chip.classList.remove('selected');
        } else {
          item.assignees.push(personId);
          chip.classList.add('selected');
        }
        updateItemwiseTicker();
        saveStateToStorage();
      });
    });

    DOM.itemsListContainer.querySelectorAll('.btn-split-all').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.itemId;
        const item = state.itemwise.items.find(i => i.id === itemId);
        if (!item) return;

        const allPersonIds = state.itemwise.people.map(p => p.id);
        const isAllSelected = item.assignees.length === allPersonIds.length;

        item.assignees = isAllSelected ? [] : [...allPersonIds];

        const row = DOM.itemsListContainer.querySelector(`[data-item-id="${itemId}"]`);
        if (row) {
          row.querySelectorAll('.assign-chip').forEach(chip => {
            chip.classList.toggle('selected', !isAllSelected);
          });
        }
        updateItemwiseTicker();
        saveStateToStorage();
      });
    });
  }

  function calculateItemsSubtotal() {
    return state.itemwise.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  }

  function updateItemwiseTicker() {
    const itemsSubtotal = calculateItemsSubtotal();
    const tax = Math.max(0, parseFloat(DOM.itemwiseTax.value) || 0);
    const service = Math.max(0, parseFloat(DOM.itemwiseService.value) || 0);
    const tip = Math.max(0, parseFloat(DOM.itemwiseTip.value) || 0);
    const totalExtras = tax + service + tip;
    const computedTotal = itemsSubtotal + totalExtras;
    const targetBill = parseFloat(DOM.itemwiseTotalBill.value) || 0;

    DOM.tickerItemsSubtotal.textContent = formatMoney(itemsSubtotal);
    DOM.tickerExtras.textContent = formatMoney(totalExtras);
    DOM.tickerSumTotal.textContent = formatMoney(computedTotal);

    if (targetBill > 0) {
      const diff = Math.round((computedTotal - targetBill) * 100) / 100;
      if (Math.abs(diff) < 0.01) {
        DOM.tickerTargetDiff.textContent = 'MATCHES BILL ✓';
        DOM.tickerTargetDiff.className = 'tick-val tick-match';
      } else if (diff > 0) {
        DOM.tickerTargetDiff.textContent = `+${formatMoney(diff)} OVER`;
        DOM.tickerTargetDiff.className = 'tick-val tick-unmatch';
      } else {
        DOM.tickerTargetDiff.textContent = `-${formatMoney(Math.abs(diff))} SHORT`;
        DOM.tickerTargetDiff.className = 'tick-val tick-unmatch';
      }
    } else {
      DOM.tickerTargetDiff.textContent = 'PENDING';
      DOM.tickerTargetDiff.className = 'tick-val';
    }
  }

  function calculateItemwiseSplit() {
    clearFieldErrors();
    const rawBill = DOM.itemwiseTotalBill.value.trim();
    const rawPeople = DOM.itemwisePeopleCount.value.trim();

    const bill = parseFloat(rawBill);
    const people = parseInt(rawPeople, 10);
    const occasion = DOM.itemwiseOccasion.value.trim() || 'Dinner Outing';
    const tax = Math.max(0, parseFloat(DOM.itemwiseTax.value) || 0);
    const service = Math.max(0, parseFloat(DOM.itemwiseService.value) || 0);
    const tip = Math.max(0, parseFloat(DOM.itemwiseTip.value) || 0);

    // Mandatory Validation:
    // "show a no result message if, bill no. or no. of people is blank, zero or negative for the required inputs."
    if (!rawBill || isNaN(bill) || bill <= 0 || !rawPeople || isNaN(people) || people <= 0) {
      let reasons = [];
      if (!rawBill || isNaN(bill) || bill <= 0) {
        DOM.errItemwiseBill.textContent = 'Enter a valid bill amount greater than 0.';
        DOM.itemwiseTotalBill.classList.add('input-error');
        reasons.push('Total bill amount is blank, zero, or negative');
      }
      if (!rawPeople || isNaN(people) || people <= 0) {
        DOM.errItemwisePeople.textContent = 'Number of people must be at least 1.';
        DOM.itemwisePeopleCount.classList.add('input-error');
        reasons.push('Number of people is blank, zero, or negative');
      }

      showNoResultState('itemwise', reasons.join(' and ') + '.');
      state.itemwise.results = null;
      saveStateToStorage();
      return;
    }

    if (state.itemwise.items.length === 0) {
      showNoResultState('itemwise', 'Please add at least one item to calculate the item-wise split.', true);
      state.itemwise.results = null;
      saveStateToStorage();
      return;
    }

    const unassignedItems = state.itemwise.items.filter(item => !item.assignees || item.assignees.length === 0);
    if (unassignedItems.length > 0) {
      const names = unassignedItems.map(i => `"${i.name || 'Untitled Item'}"`).join(', ');
      showBanner(`Items unassigned: ${names}. Assign them to diners to proceed.`, 'error');
      return;
    }

    const itemsSubtotal = calculateItemsSubtotal();
    if (itemsSubtotal <= 0) {
      showNoResultState('itemwise', 'Total cost of items must be greater than zero.', true);
      state.itemwise.results = null;
      saveStateToStorage();
      return;
    }

    // Build Diner Breakdown
    const dinerMap = {};
    state.itemwise.people.forEach(person => {
      dinerMap[person.id] = {
        id: person.id,
        name: person.name,
        items: [],
        foodSubtotal: 0,
        taxShare: 0,
        serviceShare: 0,
        subtotalWithTaxes: 0,
        tipShare: 0,
        totalShare: 0
      };
    });

    // 1. Food items shares
    state.itemwise.items.forEach(item => {
      const price = parseFloat(item.price) || 0;
      const numShares = item.assignees.length;
      const sharePrice = price / numShares;

      item.assignees.forEach(pId => {
        if (dinerMap[pId]) {
          dinerMap[pId].foodSubtotal += sharePrice;
          dinerMap[pId].items.push({
            name: item.name || 'Item',
            fullPrice: price,
            sharedWithCount: numShares,
            personShare: sharePrice
          });
        }
      });
    });

    // 2. Proportional tax, service charge, and tip
    let allocatedTotal = 0;
    Object.values(dinerMap).forEach(diner => {
      const ratio = itemsSubtotal > 0 ? (diner.foodSubtotal / itemsSubtotal) : (1 / state.itemwise.people.length);

      diner.taxShare = tax * ratio;
      diner.serviceShare = service * ratio;
      diner.tipShare = tip * ratio;

      // Subtotal including taxes and service charges
      diner.subtotalWithTaxes = diner.foodSubtotal + diner.taxShare + diner.serviceShare;
      diner.totalShare = Math.round((diner.subtotalWithTaxes + diner.tipShare) * 100) / 100;
      allocatedTotal += diner.totalShare;
    });

    const grandTotal = itemsSubtotal + tax + service + tip;

    // Cent rounding adjustment
    const diff = Math.round((grandTotal - allocatedTotal) * 100) / 100;
    const dinerArray = Object.values(dinerMap);
    if (diff !== 0 && dinerArray.length > 0) {
      dinerArray.sort((a, b) => b.totalShare - a.totalShare);
      dinerArray[0].totalShare += diff;
    }

    state.itemwise.results = {
      mode: 'itemwise',
      occasion,
      targetBill: bill,
      itemsSubtotal,
      tax,
      service,
      tip,
      grandTotal,
      peopleCount: state.itemwise.people.length,
      diners: dinerArray,
      timestamp: new Date().toLocaleDateString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };

    renderItemwiseResults(state.itemwise.results);
    saveStateToStorage();
  }

  function renderItemwiseResults(data) {
    hideBanner();
    DOM.itemwiseEmptyState.classList.add('hidden');
    DOM.itemwiseNoResultState.classList.add('hidden');
    DOM.itemwiseResultContent.classList.remove('hidden');

    DOM.itemwiseSuccessText.textContent = `The bill of ${formatMoney(data.grandTotal)} has been split item-by-item successfully for all ${data.peopleCount} diners!`;

    DOM.itemwiseReceiptOccasion.textContent = data.occasion.toUpperCase();
    DOM.itemwiseReceiptTime.textContent = data.timestamp;
    DOM.itemwiseReceiptGrand.textContent = formatMoney(data.grandTotal);

    DOM.itemwiseMetricFood.textContent = formatMoney(data.itemsSubtotal);
    DOM.itemwiseMetricFees.textContent = formatMoney(data.tax + data.service);
    DOM.itemwiseMetricTip.textContent = formatMoney(data.tip);
    DOM.itemwiseMetricDiners.textContent = data.peopleCount;

    DOM.itemwiseSharesIndicator.textContent = `${data.peopleCount} Members Itemized`;

    DOM.itemwiseDinersCardsContainer.innerHTML = '';
    data.diners.forEach((diner, idx) => {
      const isPaid = !!state.paidStatus[diner.id];
      const card = document.createElement('div');
      card.className = `diner-brutal-card ${isPaid ? 'is-paid' : ''}`;
      card.id = `itemwise-card-${diner.id}`;

      const itemsHtml = diner.items.map(i => `
        <div class="detail-row">
          <span>&bull; ${escapeHtml(i.name)} ${i.sharedWithCount > 1 ? `<small>(1/${i.sharedWithCount})</small>` : ''}</span>
          <span>${formatMoney(i.personShare)}</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="diner-card-header">
          <div class="diner-left-id">
            <span class="diner-avatar-stamp">${diner.name.charAt(0).toUpperCase()}</span>
            <span class="diner-card-name">${escapeHtml(diner.name)}</span>
          </div>
          <div class="diner-right-total">
            <span class="diner-share-text">${formatMoney(diner.totalShare)}</span>
            <span class="diner-paid-stamp">${isPaid ? '✓ SETTLED' : 'PENDING'}</span>
          </div>
        </div>
        <div class="diner-details-table">
          <div style="font-family: var(--font-mono); font-size: 0.68rem; font-weight: 900; margin-bottom: 0.25rem; color: var(--text-main);">ORDERED / SHARED ITEMS:</div>
          ${itemsHtml || '<div class="detail-row"><span>No individual items</span><span>$0.00</span></div>'}
          <div class="detail-row detail-row-bold">
            <span>Items Subtotal:</span>
            <span>${formatMoney(diner.foodSubtotal)}</span>
          </div>
          ${(diner.taxShare + diner.serviceShare) > 0 ? `
            <div class="detail-row">
              <span>Tax & Service Charge Share:</span>
              <span>+${formatMoney(diner.taxShare + diner.serviceShare)}</span>
            </div>
            <div class="detail-row" style="font-weight: 800; color: var(--text-main);">
              <span>Subtotal (Items + Tax & Fees):</span>
              <span>${formatMoney(diner.subtotalWithTaxes)}</span>
            </div>
          ` : ''}
          ${diner.tipShare > 0 ? `
            <div class="detail-row">
              <span>Tip Share:</span>
              <span>+${formatMoney(diner.tipShare)}</span>
            </div>
          ` : ''}
          <div class="detail-final-row">
            <span>FINAL SHARE:</span>
            <span>${formatMoney(diner.totalShare)}</span>
          </div>
        </div>
        <div class="diner-footer-actions no-print">
          <label class="paid-toggle-label">
            <input type="checkbox" class="itemwise-paid-checkbox" data-diner-id="${diner.id}" ${isPaid ? 'checked' : ''}>
            <span>TICK OFF AMOUNT PAID</span>
          </label>
          <button type="button" class="btn-copy-diner-share" data-index="${idx}" title="Copy share text">
            COPY SHARE
          </button>
        </div>
      `;

      DOM.itemwiseDinersCardsContainer.appendChild(card);
    });

    attachDinerCardListenersItemwise(data);
    renderNetDuesMatrix('itemwise');
  }

  function attachDinerCardListenersItemwise(data) {
    DOM.itemwiseDinersCardsContainer.querySelectorAll('.itemwise-paid-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.dinerId;
        const checked = e.target.checked;
        state.paidStatus[id] = checked;

        const card = document.getElementById(`itemwise-card-${id}`);
        if (card) {
          card.classList.toggle('is-paid', checked);
          const stamp = card.querySelector('.diner-paid-stamp');
          if (stamp) stamp.textContent = checked ? '✓ SETTLED' : 'PENDING';
        }
        saveStateToStorage();
      });
    });

    DOM.itemwiseDinersCardsContainer.querySelectorAll('.btn-copy-diner-share').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const diner = data.diners[idx];
        if (!diner) return;

        let text = `Hey ${diner.name}! Your share for ${data.occasion} is ${formatMoney(diner.totalShare)}.\n`;
        if (diner.items && diner.items.length > 0) {
          text += `Items: ${diner.items.map(i => i.name).join(', ')}\n`;
        }
        text += `Subtotal + Fees: ${formatMoney(diner.subtotalWithTaxes || diner.foodSubtotal)}`;
        if (diner.tipShare > 0) text += ` | Tip: ${formatMoney(diner.tipShare)}`;

        copyToClipboard(text, `${diner.name}'s share copied!`);
      });
    });
  }

  // =========================================================================
  // Dues & Settlement Tracker ("Paid on Behalf")
  // =========================================================================
  function addCoverTotal() {
    const payer = DOM.totalPayerSelect.value;
    const borrower = DOM.totalBorrowerSelect.value;
    const amount = parseFloat(DOM.totalCoverAmount.value) || 0;
    const note = DOM.totalCoverNote.value.trim() || 'Paid on behalf';

    if (payer === borrower) {
      showToast('Payer and borrower cannot be the same person.');
      return;
    }
    if (amount <= 0) {
      showToast('Please enter an amount greater than 0.');
      return;
    }

    state.total.dues.push({
      id: 'due-total-' + Date.now(),
      payer,
      borrower,
      amount,
      note,
      cleared: false
    });

    DOM.totalCoverAmount.value = '';
    DOM.totalCoverNote.value = '';
    renderDuesList('total');
    renderNetDuesMatrix('total');
    saveStateToStorage();
    showToast(`Recorded: ${borrower} owes ${payer} ${formatMoney(amount)}`);
  }

  function addCoverItemwise() {
    const payer = DOM.itemwisePayerSelect.value;
    const borrower = DOM.itemwiseBorrowerSelect.value;
    const amount = parseFloat(DOM.itemwiseCoverAmount.value) || 0;
    const note = DOM.itemwiseCoverNote.value.trim() || 'Paid on behalf';

    if (payer === borrower) {
      showToast('Payer and borrower cannot be the same person.');
      return;
    }
    if (amount <= 0) {
      showToast('Please enter an amount greater than 0.');
      return;
    }

    state.itemwise.dues.push({
      id: 'due-itemwise-' + Date.now(),
      payer,
      borrower,
      amount,
      note,
      cleared: false
    });

    DOM.itemwiseCoverAmount.value = '';
    DOM.itemwiseCoverNote.value = '';
    renderDuesList('itemwise');
    renderNetDuesMatrix('itemwise');
    saveStateToStorage();
    showToast(`Recorded: ${borrower} owes ${payer} ${formatMoney(amount)}`);
  }

  function renderDuesList(mode) {
    const dues = mode === 'total' ? state.total.dues : state.itemwise.dues;
    const listEl = mode === 'total' ? DOM.totalDuesList : DOM.itemwiseDuesList;
    const countEl = mode === 'total' ? DOM.totalDuesCount : DOM.itemwiseDuesCount;

    countEl.textContent = dues.length;
    listEl.innerHTML = '';

    if (dues.length === 0) {
      listEl.innerHTML = '<p class="dues-empty-hint">No cover transactions recorded yet. Add one above!</p>';
      return;
    }

    dues.forEach(due => {
      const item = document.createElement('div');
      item.className = 'due-item-card';
      item.innerHTML = `
        <div class="due-info">
          <span class="due-statement">
            <strong>${escapeHtml(due.payer)}</strong> paid <span class="due-amount-pill">${formatMoney(due.amount)}</span> for <strong>${escapeHtml(due.borrower)}</strong>
          </span>
          <span class="due-note">Note: ${escapeHtml(due.note)} &bull; <em>${due.cleared ? 'Cleared' : 'Pending'}</em></span>
        </div>
        <div class="due-actions no-print">
          <button type="button" class="btn-due-toggle ${due.cleared ? 'is-cleared' : ''}" data-due-id="${due.id}" data-mode="${mode}">
            ${due.cleared ? '✓ CLEARED' : 'SETTLE'}
          </button>
          <button type="button" class="btn-due-delete" data-due-id="${due.id}" data-mode="${mode}" title="Delete due entry">✕</button>
        </div>
      `;
      listEl.appendChild(item);
    });

    // Toggle cleared
    listEl.querySelectorAll('.btn-due-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const dId = btn.dataset.dueId;
        const targetDue = dues.find(d => d.id === dId);
        if (targetDue) {
          targetDue.cleared = !targetDue.cleared;
          renderDuesList(mode);
          renderNetDuesMatrix(mode);
          saveStateToStorage();
        }
      });
    });

    // Delete due
    listEl.querySelectorAll('.btn-due-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const dId = btn.dataset.dueId;
        if (mode === 'total') {
          state.total.dues = state.total.dues.filter(d => d.id !== dId);
        } else {
          state.itemwise.dues = state.itemwise.dues.filter(d => d.id !== dId);
        }
        renderDuesList(mode);
        renderNetDuesMatrix(mode);
        saveStateToStorage();
      });
    });
  }

  function renderNetDuesMatrix(mode) {
    const dues = (mode === 'total' ? state.total.dues : state.itemwise.dues).filter(d => !d.cleared);
    const listEl = mode === 'total' ? DOM.totalNetDuesList : DOM.itemwiseNetDuesList;

    listEl.innerHTML = '';
    if (dues.length === 0) {
      listEl.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">
          ALL RECORDED COVERS ARE CLEARED OR NONE ADDED YET.
        </div>
      `;
      return;
    }

    const balances = {};
    dues.forEach(d => {
      const p1 = d.payer;
      const p2 = d.borrower;
      if (p1 < p2) {
        const key = `${p1}|${p2}`;
        balances[key] = (balances[key] || 0) + d.amount;
      } else {
        const key = `${p2}|${p1}`;
        balances[key] = (balances[key] || 0) - d.amount;
      }
    });

    let renderedAny = false;
    Object.keys(balances).forEach(key => {
      const net = Math.round(balances[key] * 100) / 100;
      if (Math.abs(net) < 0.01) return;

      renderedAny = true;
      const [personA, personB] = key.split('|');
      let debtor = '';
      let creditor = '';
      let absAmount = Math.abs(net);

      if (net > 0) {
        debtor = personB;
        creditor = personA;
      } else {
        debtor = personA;
        creditor = personB;
      }

      const row = document.createElement('div');
      row.className = 'net-due-pill';
      row.innerHTML = `
        <div>
          <span><strong>${escapeHtml(debtor)}</strong> owes <strong>${escapeHtml(creditor)}</strong>:</span>
        </div>
        <span class="net-val">${formatMoney(absAmount)}</span>
      `;
      listEl.appendChild(row);
    });

    if (!renderedAny) {
      listEl.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">
          MUTUAL DUES ARE PERFECTLY BALANCED OUT.
        </div>
      `;
    }
  }

  // =========================================================================
  // No Result States & Banner Feedback
  // =========================================================================
  function showNoResultState(mode, reason, isItemSpecific = false) {
    if (mode === 'total') {
      DOM.totalEmptyState.classList.add('hidden');
      DOM.totalResultContent.classList.add('hidden');
      DOM.totalNoResultState.classList.remove('hidden');
      DOM.totalNoResultText.textContent = reason;
    } else {
      DOM.itemwiseEmptyState.classList.add('hidden');
      DOM.itemwiseResultContent.classList.add('hidden');
      DOM.itemwiseNoResultState.classList.remove('hidden');
      DOM.itemwiseNoResultText.textContent = reason;
      DOM.itemwiseItemAlertTip.classList.toggle('hidden', !isItemSpecific);
    }
    showBanner(reason, 'error');
  }

  function showBanner(message) {
    DOM.statusBanner.classList.remove('hidden');
    DOM.bannerMessage.textContent = message;
  }

  function hideBanner() {
    DOM.statusBanner.classList.add('hidden');
  }

  DOM.bannerClose.addEventListener('click', hideBanner);

  function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.brutal-input').forEach(el => el.classList.remove('input-error'));
  }

  function showToast(message) {
    DOM.toast.textContent = message;
    DOM.toast.classList.remove('hidden');
    setTimeout(() => {
      DOM.toast.classList.add('hidden');
    }, 2800);
  }

  // =========================================================================
  // PDF Export & Sharing
  // =========================================================================
  function exportToPdf(mode) {
    const results = mode === 'total' ? state.total.results : state.itemwise.results;
    if (!results) {
      showToast('Calculate your bill first before exporting.');
      return;
    }
    showToast('Opening print dialog for PDF export...');
    setTimeout(() => {
      window.print();
    }, 150);
  }

  function copyFullSummary(mode) {
    const results = mode === 'total' ? state.total.results : state.itemwise.results;
    if (!results) {
      showToast('Calculate your bill first.');
      return;
    }

    let summary = `🧾 SHAREC BILL SETTLEMENT: ${results.occasion.toUpperCase()}\n`;
    summary += `Date: ${results.timestamp}\n`;
    summary += `Grand Total: ${formatMoney(results.grandTotal)}\n`;
    summary += `Mode: ${results.mode === 'total' ? 'Equal Split' : 'Item-Wise Split'}\n`;
    summary += `------------------------------------\n`;

    results.diners.forEach(d => {
      summary += `${d.name}: ${formatMoney(d.totalShare)} [${state.paidStatus[d.id] ? 'PAID' : 'PENDING'}]\n`;
      if (d.items && d.items.length > 0) {
        summary += `   Dishes: ${d.items.map(i => i.name).join(', ')}\n`;
      }
    });

    const dues = (mode === 'total' ? state.total.dues : state.itemwise.dues).filter(d => !d.cleared);
    if (dues.length > 0) {
      summary += `\n📌 RECORDED COVER DUES:\n`;
      dues.forEach(d => {
        summary += `   • ${d.borrower} owes ${d.payer}: ${formatMoney(d.amount)} (${d.note})\n`;
      });
    }

    summary += `------------------------------------\n`;
    summary += `Calculated with Sharec (Share + Record)`;

    copyToClipboard(summary, 'Complete bill and dues summary copied!');
  }

  function toggleAllPaidStatus(mode) {
    const results = mode === 'total' ? state.total.results : state.itemwise.results;
    if (!results) return;

    const allPaid = results.diners.every(d => !!state.paidStatus[d.id]);
    const nextStatus = !allPaid;

    results.diners.forEach(d => {
      state.paidStatus[d.id] = nextStatus;
      const card = document.getElementById(`${mode}-card-${d.id}`);
      if (card) {
        card.classList.toggle('is-paid', nextStatus);
        const cb = card.querySelector(`.${mode}-paid-checkbox`);
        if (cb) cb.checked = nextStatus;
        const stamp = card.querySelector('.diner-paid-stamp');
        if (stamp) stamp.textContent = nextStatus ? '✓ SETTLED' : 'PENDING';
      }
    });

    saveStateToStorage();
    showToast(nextStatus ? 'All members marked as paid!' : 'All paid marks cleared.');
  }

  function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        fallbackCopyTextToClipboard(text, successMsg);
      });
    } else {
      fallbackCopyTextToClipboard(text, successMsg);
    }
  }

  function fallbackCopyTextToClipboard(text, successMsg) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (err) {
      showToast('Could not copy to clipboard.');
    }
    document.body.removeChild(textArea);
  }

  // =========================================================================
  // Reset Handlers (Clears Form & Stored Data)
  // =========================================================================
  let pendingResetMode = 'total';

  function initResetHandlers() {
    DOM.modalCancelBtn.addEventListener('click', closeResetModal);
    DOM.modalConfirmResetBtn.addEventListener('click', confirmReset);

    DOM.resetConfirmModal.addEventListener('click', (e) => {
      if (e.target === DOM.resetConfirmModal) {
        closeResetModal();
      }
    });
  }

  function openResetModal(mode) {
    pendingResetMode = mode;
    if (typeof DOM.resetConfirmModal.showModal === 'function') {
      DOM.resetConfirmModal.showModal();
    } else {
      DOM.resetConfirmModal.classList.remove('hidden');
    }
  }

  function closeResetModal() {
    if (typeof DOM.resetConfirmModal.close === 'function') {
      DOM.resetConfirmModal.close();
    } else {
      DOM.resetConfirmModal.classList.add('hidden');
    }
  }

  function confirmReset() {
    closeResetModal();
    if (pendingResetMode === 'total') {
      DOM.totalOccasion.value = '';
      DOM.totalBillAmount.value = '';
      DOM.totalPeopleCount.value = '4';
      DOM.totalTaxAmount.value = '';
      DOM.totalServiceAmount.value = '';
      DOM.totalCustomTipVal.value = '';
      DOM.totalCustomTipBox.classList.add('hidden');

      DOM.totalTipChips.querySelectorAll('.btn-tip-pill').forEach(b => b.classList.remove('active'));
      DOM.totalTipChips.querySelector('[data-percent="0"]').classList.add('active');
      state.total.tipPercent = 0;
      state.total.results = null;
      state.total.dues = [];

      // Clear paid status for total diners
      Object.keys(state.paidStatus).forEach(k => {
        if (k.startsWith('total-p-')) delete state.paidStatus[k];
      });

      updateTotalTipPreview();
      updateTotalDuesDropdowns();
      renderDuesList('total');

      DOM.totalEmptyState.classList.remove('hidden');
      DOM.totalNoResultState.classList.add('hidden');
      DOM.totalResultContent.classList.add('hidden');
    } else {
      DOM.itemwiseOccasion.value = '';
      DOM.itemwiseTotalBill.value = '';
      DOM.itemwisePeopleCount.value = '3';
      DOM.itemwiseTax.value = '';
      DOM.itemwiseService.value = '';
      DOM.itemwiseTip.value = '';

      state.itemwise.people = [
        { id: 'p1', name: 'Alex' },
        { id: 'p2', name: 'Jordan' },
        { id: 'p3', name: 'Taylor' }
      ];
      state.itemwise.items = [];
      state.itemwise.results = null;
      state.itemwise.dues = [];

      // Clear paid status for itemwise diners
      Object.keys(state.paidStatus).forEach(k => {
        if (!k.startsWith('total-p-')) delete state.paidStatus[k];
      });

      renderPeopleRoster();
      renderItemsList();
      updateItemwiseTicker();
      updateItemwiseDuesDropdowns();
      renderDuesList('itemwise');

      DOM.itemwiseEmptyState.classList.remove('hidden');
      DOM.itemwiseNoResultState.classList.add('hidden');
      DOM.itemwiseResultContent.classList.add('hidden');
    }

    clearFieldErrors();
    saveStateToStorage();
    showToast('Form reset and saved memory cleared.');
  }

  // =========================================================================
  // Demo Data Loader (Immediate full feature showcase)
  // =========================================================================
  function initSampleDataLoader() {
    DOM.btnLoadSample.addEventListener('click', () => {
      if (state.mode === 'total') {
        DOM.totalOccasion.value = 'Trattoria Bella Vista';
        DOM.totalBillAmount.value = '180.00';
        DOM.totalPeopleCount.value = '4';
        DOM.totalTaxAmount.value = '15.00';
        DOM.totalServiceAmount.value = '8.00';

        DOM.totalTipChips.querySelectorAll('.btn-tip-pill').forEach(b => b.classList.remove('active'));
        const chip15 = DOM.totalTipChips.querySelector('[data-percent="15"]');
        if (chip15) chip15.classList.add('active');
        state.total.tipPercent = 15;

        // Add sample dues: Person 2 covered $25 for Person 4
        state.total.dues = [
          {
            id: 'sample-due-1',
            payer: 'Person 2',
            borrower: 'Person 4',
            amount: 25.00,
            note: 'Covered cocktails',
            cleared: false
          }
        ];

        updateTotalTipPreview();
        updateTotalDuesDropdowns();
        renderDuesList('total');
        calculateTotalSplit();
        saveStateToStorage();
        showToast('Sample Equal Dinner + Dues Loaded!');
      } else {
        DOM.itemwiseOccasion.value = 'Osteria Del Sole Feast';
        DOM.itemwiseTotalBill.value = '156.50';
        DOM.itemwisePeopleCount.value = '4';

        state.itemwise.people = [
          { id: 'p1', name: 'Alex' },
          { id: 'p2', name: 'Jordan' },
          { id: 'p3', name: 'Taylor' },
          { id: 'p4', name: 'Maya' }
        ];

        state.itemwise.items = [
          { id: 'i1', name: 'Garlic Focaccia & Olives', price: 14.00, assignees: ['p1', 'p2', 'p3', 'p4'] },
          { id: 'i2', name: 'Truffle Porcini Risotto', price: 29.50, assignees: ['p1'] },
          { id: 'i3', name: 'Woodfired Diavola Pizza', price: 24.00, assignees: ['p2'] },
          { id: 'i4', name: 'Pan-Seared Sea Bass', price: 34.00, assignees: ['p3'] },
          { id: 'i5', name: 'Handmade Gnocchi Pesto', price: 26.00, assignees: ['p4'] }
        ];

        DOM.itemwiseTax.value = '12.00';
        DOM.itemwiseService.value = '6.00';
        DOM.itemwiseTip.value = '11.00';

        // Add sample dues: Alex paid $50 on behalf of Jordan
        state.itemwise.dues = [
          {
            id: 'sample-due-2',
            payer: 'Alex',
            borrower: 'Jordan',
            amount: 50.00,
            note: 'Paid on Jordan behalf',
            cleared: false
          }
        ];

        renderPeopleRoster();
        renderItemsList();
        updateItemwiseTicker();
        updateItemwiseDuesDropdowns();
        renderDuesList('itemwise');
        calculateItemwiseSplit();
        saveStateToStorage();
        showToast('Sample Item-Wise Dinner + Dues Loaded!');
      }
    });
  }

  // Counter +/- Buttons
  function initCounters() {
    document.querySelectorAll('.btn-stepper').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const delta = parseInt(btn.dataset.delta, 10);
        const input = document.getElementById(targetId);
        if (!input) return;

        let val = parseInt(input.value, 10) || 1;
        val = Math.max(1, val + delta);
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        saveStateToStorage();
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // Bootstrapper
  // =========================================================================
  function init() {
    initTheme();
    initCurrency();
    initModeSwitch();
    initTotalSplitting();
    initItemwiseSplitting();
    initCounters();
    initResetHandlers();
    initSampleDataLoader();

    // Restore saved state across page reloads!
    const restored = loadStateFromStorage();
    if (!restored) {
      updateTotalDuesDropdowns();
      renderPeopleRoster();
      renderItemsList();
      updateItemwiseTicker();
      updateItemwiseDuesDropdowns();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
