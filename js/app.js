/**
 * Frontend App - Shopee Affiliate Pro
 * Stable dashboard with skeleton loading
 */

document.addEventListener('DOMContentLoaded', () => {
  const socket = io(API_CONFIG.SOCKET_URL || API_CONFIG.API_BASE_URL);

  // DOM
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

  // Report DOM
  const reportStats = document.getElementById('reportStats');
  const statsSkeleton = document.getElementById('statsSkeleton');
  const statsEmpty = document.getElementById('statsEmpty');
  const reportTableContainer = document.getElementById('reportTableContainer');
  const reportTableBody = document.getElementById('reportTableBody');
  const tableSkeleton = document.getElementById('tableSkeleton');
  const reportNoData = document.getElementById('reportNoData');
  const reportError = document.getElementById('reportError');
  const loadReportBtn = document.getElementById('loadReportBtn');

  let currentJobId = null;

  // ═══ Socket ═══
  socket.on('connect', () => console.log('Connected'));
  socket.on('disconnect', () => console.log('Disconnected'));

  socket.on('jobProcessing', (data) => {
    if (data.id === currentJobId) updateStatus('processing');
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

  // ═══ Convert ═══
  window.convertLink = async function () {
    const url = urlInput.value.trim();
    if (!url) { shakeInput(); return; }
    if (!/shopee\.vn|s\.shopee\.vn|shp\.ee|shope\.ee|vn\.shp\.ee|vn\.sh\.ee/.test(url)) {
      showError('Nhập link Shopee hợp lệ');
      return;
    }

    convertBtn.disabled = true;
    convertBtn.innerHTML = `<span class="flex items-center gap-2">
      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      Converting...
    </span>`;

    resetUI();
    updateStatus('waiting');
    statusSection.classList.remove('hidden');

    try {
      const res = await fetch(`${API_CONFIG.API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      currentJobId = data.id;
      updateStatus('waiting');
    } catch (e) {
      showError(e.message);
      resetConvertBtn();
    }
  };

  // ═══ Copy ═══
  window.copyToClipboard = async function () {
    const url = shortUrlEl.textContent;
    if (!url) return;
    try { await navigator.clipboard.writeText(url); }
    catch {
      const t = document.createElement('textarea');
      t.value = url; document.body.appendChild(t);
      t.select(); document.execCommand('copy');
      document.body.removeChild(t);
    }
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
  };

  // ═══ Open Link ═══
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  }

  // Set button text based on device
  const openBtnText = document.getElementById('openBtnText');
  if (openBtnText) {
    openBtnText.textContent = isMobile() ? 'Mở app' : 'Mở link';
  }

  window.openLink = function (url) {
    const link = url || shortUrlEl.textContent;
    if (!link) return;
    window.open(link, '_blank');
  };

  // ═══ Status ═══
  function updateStatus(status) {
    const map = {
      waiting: { color: 'bg-yellow-400', text: 'Đang chờ...', progress: '25%', show: true },
      processing: { color: 'bg-blue-400', text: 'Đang xử lý...', progress: '60%', show: true },
      completed: { color: 'bg-emerald-400', text: 'Hoàn thành', progress: '100%', show: false },
      error: { color: 'bg-red-400', text: 'Lỗi', progress: '100%', show: false },
    };
    const s = map[status];
    if (!s) return;

    statusIcon.className = `w-2 h-2 rounded-full ${s.color}`;
    statusText.textContent = s.text;
    statusText.className = `text-xs font-medium ${
      status === 'completed' ? 'text-emerald-400' :
      status === 'error' ? 'text-red-400' : 'text-slate-400'
    }`;
    progressBar.style.width = s.progress;

    if (status === 'completed') {
      progressBar.className = 'h-full rounded-full transition-all duration-500 bg-emerald-500';
    } else if (status === 'error') {
      progressBar.className = 'h-full rounded-full transition-all duration-500 bg-red-500';
    } else {
      progressBar.className = 'h-full rounded-full transition-all duration-500 bg-shopee-500';
    }

    loadingAnimation.classList.toggle('hidden', !s.show);
  }

  function showResult(shortUrl) {
    originalUrlEl.textContent = urlInput.value.trim();
    shortUrlEl.textContent = shortUrl;
    resultSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
    resetConvertBtn();
    // Auto-open link
    openLink(shortUrl);
  }

  function showError(msg) {
    errorText.textContent = msg;
    errorSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    loadingAnimation.classList.add('hidden');
    resetConvertBtn();
  }

  function resetConvertBtn() {
    convertBtn.disabled = false;
    convertBtn.innerHTML = `<span class="flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
      Convert
    </span>`;
  }

  function resetUI() {
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    loadingAnimation.classList.add('hidden');
    toast.classList.add('hidden');
    progressBar.style.width = '0%';
    statusIcon.className = 'w-2 h-2 rounded-full bg-slate-500';
    statusText.textContent = 'Waiting...';
  }

  function shakeInput() {
    urlInput.classList.add('animate-shake');
    urlInput.focus();
    setTimeout(() => urlInput.classList.remove('animate-shake'), 300);
  }

  urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') convertLink(); });
  urlInput.focus();

  // ═══ Report ═══
  window.loadReport = async function () {
    // Show skeletons, hide everything else
    loadReportBtn.disabled = true;
    loadReportBtn.innerHTML = `<svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Loading...`;

    reportStats.classList.add('hidden');
    statsEmpty.classList.add('hidden');
    statsSkeleton.classList.remove('hidden');

    reportTableContainer.classList.add('hidden');
    reportNoData.classList.add('hidden');
    tableSkeleton.classList.remove('hidden');

    reportError.classList.add('hidden');

    try {
      const res = await fetch(`${API_CONFIG.API_BASE_URL}/api/reports/conversion`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      // Hide skeletons
      statsSkeleton.classList.add('hidden');
      tableSkeleton.classList.add('hidden');

      // Stats
      if (data.summary && (data.summary.totalOrders > 0 || data.summary.totalCommission > 0 || data.summary.totalRevenue > 0)) {
        document.getElementById('statTotalOrders').textContent = data.summary.totalOrders || 0;
        document.getElementById('statTotalCommission').textContent = formatCurrency(data.summary.totalCommission || 0);
        document.getElementById('statTotalRevenue').textContent = formatCurrency(data.summary.totalRevenue || 0);
        reportStats.classList.remove('hidden');
      } else {
        statsEmpty.classList.remove('hidden');
      }

      // Table
      if (data.orders && data.orders.length > 0) {
        reportTableBody.innerHTML = data.orders.map(o => `
          <tr>
            <td class="px-6 py-3 font-mono text-xs text-white/90">${esc(o.orderId)}</td>
            <td class="px-4 py-3 text-slate-400 text-xs">${esc(o.orderTime)}</td>
            <td class="px-4 py-3 text-slate-300 text-xs font-medium">${esc(o.orderValue)}</td>
            <td class="px-4 py-3 text-emerald-400 font-semibold text-xs">${esc(o.commission)}</td>
            <td class="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate" title="${esc(o.product)}">${esc(o.product)}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusClass(o.status)}">${esc(o.status)}</span>
            </td>
          </tr>
        `).join('');
        reportTableContainer.classList.remove('hidden');
      } else {
        reportNoData.classList.remove('hidden');
      }

    } catch (e) {
      statsSkeleton.classList.add('hidden');
      tableSkeleton.classList.add('hidden');
      statsEmpty.classList.remove('hidden');
      reportError.classList.remove('hidden');
      document.getElementById('reportErrorText').textContent = e.message;
    } finally {
      loadReportBtn.disabled = false;
      loadReportBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Load Report`;
    }
  };

  function formatCurrency(v) {
    if (!v || isNaN(v)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  }

  function esc(t) {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  function statusClass(s) {
    if (!s) return 'bg-white/5 text-slate-500';
    const l = s.toLowerCase();
    if (l.includes('hoàn thành') || l.includes('completed') || l.includes('success')) return 'bg-emerald-500/10 text-emerald-400';
    if (l.includes('chờ') || l.includes('pending') || l.includes('processing')) return 'bg-yellow-500/10 text-yellow-400';
    if (l.includes('hủy') || l.includes('cancel') || l.includes('failed')) return 'bg-red-500/10 text-red-400';
    return 'bg-white/5 text-slate-500';
  }
});
