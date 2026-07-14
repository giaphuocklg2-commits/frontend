/**
 * Frontend App - Shopee Affiliate Pro
 * Xử lý UI, Socket.IO, và API calls
 */

document.addEventListener('DOMContentLoaded', () => {
  // ===========================
  // Socket.IO Connection
  // ===========================
  const socket = io(API_CONFIG.SOCKET_URL || API_CONFIG.API_BASE_URL);

  // DOM Elements
  const urlInput = document.getElementById('urlInput');
  const convertBtn = document.getElementById('convertBtn');
  const statusSection = document.getElementById('statusSection');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const progressBar = document.getElementById('progressBar');
  const loadingAnimation = document.getElementById('loadingAnimation');
  const resultSection = document.getElementById('resultSection');
  const originalUrlEl = document.getElementById('originalUrl');
  const shortUrlEl = document.getElementById('shortUrl');
  const errorSection = document.getElementById('errorSection');
  const errorText = document.getElementById('errorText');
  const toast = document.getElementById('toast');

  let currentJobId = null;

  // ===========================
  // Socket Events
  // ===========================

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('jobProcessing', (data) => {
    if (data.id === currentJobId) {
      updateStatus('processing');
    }
  });

  socket.on('jobFinished', (data) => {
    if (data.id === currentJobId) {
      updateStatus('completed');
      showResult(data.shortUrl);
    }
  });

  socket.on('jobError', (data) => {
    if (data.id === currentJobId) {
      updateStatus('error');
      showError(data.error || 'Conversion failed');
    }
  });

  // ===========================
  // Main Functions
  // ===========================

  window.convertLink = async function () {
    const url = urlInput.value.trim();

    if (!url) {
      shakeInput();
      return;
    }

    if (!url.includes('shopee.vn') && !url.includes('s.shopee.vn')) {
      showError('Vui lòng nhập link Shopee hợp lệ');
      return;
    }

    convertBtn.disabled = true;
    convertBtn.innerHTML = `
      <span class="flex items-center justify-center gap-2">
        <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Converting...
      </span>
    `;

    resetUI();
    updateStatus('waiting');
    statusSection.classList.remove('hidden');

    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      currentJobId = data.id;
      updateStatus('waiting');
    } catch (error) {
      showError(error.message);
      convertBtn.disabled = false;
      convertBtn.innerHTML = `
        <span class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Convert Link
        </span>
      `;
    }
  };

  window.copyToClipboard = async function () {
    const shortUrl = shortUrlEl.textContent;
    if (!shortUrl) return;

    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
  };

  function updateStatus(status) {
    const statusMap = {
      waiting: { color: 'bg-yellow-500', text: 'Đang chờ xử lý...', progress: '25%', show: true },
      processing: { color: 'bg-blue-500', text: 'Đang xử lý...', progress: '60%', show: true },
      completed: { color: 'bg-green-500', text: 'Hoàn thành!', progress: '100%', show: false },
      error: { color: 'bg-red-500', text: 'Lỗi', progress: '100%', show: false },
    };
    const s = statusMap[status];
    if (!s) return;

    statusIcon.className = `w-3 h-3 rounded-full ${s.color}`;
    if (status === 'waiting' || status === 'processing') {
      statusIcon.classList.add('animate-pulse-dot');
    }
    statusText.textContent = s.text;
    statusText.className = `text-sm font-medium ${
      status === 'completed' ? 'text-green-400' :
      status === 'error' ? 'text-red-400' : 'text-slate-400'
    }`;
    progressBar.style.width = s.progress;
    loadingAnimation.classList.toggle('hidden', !s.show);
  }

  function showResult(shortUrl) {
    originalUrlEl.textContent = urlInput.value.trim();
    shortUrlEl.textContent = shortUrl;
    resultSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
    convertBtn.disabled = false;
    convertBtn.innerHTML = `
      <span class="flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Convert Link
      </span>
    `;
  }

  function showError(message) {
    errorText.textContent = message;
    errorSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    loadingAnimation.classList.add('hidden');
    convertBtn.disabled = false;
    convertBtn.innerHTML = `
      <span class="flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Convert Link
      </span>
    `;
  }

  function resetUI() {
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    loadingAnimation.classList.add('hidden');
    toast.classList.add('hidden');
    progressBar.style.width = '0%';
    statusIcon.className = 'w-3 h-3 rounded-full bg-slate-500';
    statusText.textContent = 'Waiting...';
    statusText.className = 'text-sm font-medium text-slate-400';
  }

  function shakeInput() {
    urlInput.classList.add('animate-shake');
    urlInput.focus();
    setTimeout(() => urlInput.classList.remove('animate-shake'), 500);
  }

  // ===========================
  // Event Listeners
  // ===========================

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') convertLink();
  });

  urlInput.focus();

  // ===========================
  // Report Functions
  // ===========================
  window.loadReport = async function () {
    const loadReportBtn = document.getElementById('loadReportBtn');
    const reportLoading = document.getElementById('reportLoading');
    const reportError = document.getElementById('reportError');
    const reportStats = document.getElementById('reportStats');
    const reportTableContainer = document.getElementById('reportTableContainer');
    const reportTableBody = document.getElementById('reportTableBody');
    const reportNoData = document.getElementById('reportNoData');

    loadReportBtn.disabled = true;
    loadReportBtn.innerHTML = `
      <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading...
    `;
    reportLoading.classList.remove('hidden');
    reportError.classList.add('hidden');
    reportStats.classList.add('hidden');
    reportTableContainer.classList.add('hidden');
    reportNoData.classList.add('hidden');

    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/reports/conversion`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load report');
      }

      // Show stats
      if (data.summary) {
        document.getElementById('statTotalOrders').textContent = data.summary.totalOrders || 0;
        document.getElementById('statTotalCommission').textContent = formatCurrency(data.summary.totalCommission || 0);
        document.getElementById('statTotalRevenue').textContent = formatCurrency(data.summary.totalRevenue || 0);
        reportStats.classList.remove('hidden');
      }

      // Show table
      if (data.orders && data.orders.length > 0) {
        reportTableBody.innerHTML = data.orders.map((order, index) => `
          <tr class="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors">
            <td class="px-4 py-4 font-mono text-sm text-white">${escapeHtml(order.orderId)}</td>
            <td class="px-4 py-4 text-slate-300 text-sm">${escapeHtml(order.orderTime)}</td>
            <td class="px-4 py-4 text-slate-300 text-sm font-medium">${escapeHtml(order.orderValue)}</td>
            <td class="px-4 py-4 text-green-400 font-semibold text-sm">${escapeHtml(order.commission)}</td>
            <td class="px-4 py-4 text-slate-300 text-sm max-w-[200px] truncate" title="${escapeHtml(order.product)}">${escapeHtml(order.product)}</td>
            <td class="px-4 py-4">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}">
                ${escapeHtml(order.status)}
              </span>
            </td>
          </tr>
        `).join('');
        reportTableContainer.classList.remove('hidden');
      } else {
        reportNoData.classList.remove('hidden');
      }
    } catch (error) {
      reportError.classList.remove('hidden');
      document.getElementById('reportErrorText').textContent = error.message;
    } finally {
      loadReportBtn.disabled = false;
      loadReportBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Load Report
      `;
      reportLoading.classList.add('hidden');
    }
  };

  function formatCurrency(value) {
    if (value === 0 || isNaN(value)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getStatusClass(status) {
    if (!status) return 'bg-slate-500/20 text-slate-400';
    const s = status.toLowerCase();
    if (s.includes('hoàn thành') || s.includes('completed') || s.includes('success') || s.includes('đã thanh toán')) {
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    } else if (s.includes('chờ') || s.includes('pending') || s.includes('processing') || s.includes('đang xử lý')) {
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    } else if (s.includes('hủy') || s.includes('cancel') || s.includes('failed') || s.includes('thất bại')) {
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    }
    return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  }

  // ===========================
  // Active Nav Highlight
  // ===========================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // ===========================
  // Shake Animation
  // ===========================
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
    .animate-shake {
      animation: shake 0.5s ease-in-out;
      border-color: #ef4444 !important;
    }
  `;
  document.head.appendChild(style);
});
