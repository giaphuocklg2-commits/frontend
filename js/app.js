document.addEventListener('DOMContentLoaded', () => {
  const socket = io(API_CONFIG.SOCKET_URL || API_CONFIG.API_BASE_URL);

  const urlInput = document.getElementById('urlInput');
  const convertBtn = document.getElementById('convertBtn');
  const statusSection = document.getElementById('statusSection');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const progressBar = document.getElementById('progressBar');
  const resultSection = document.getElementById('resultSection');
  const shortUrlEl = document.getElementById('shortUrl');
  const errorSection = document.getElementById('errorSection');
  const errorText = document.getElementById('errorText');
  const toast = document.getElementById('toast');
  const loadReportBtn = document.getElementById('loadReportBtn');

  let currentJobId = null;

  socket.on('connect', () => console.log('Đã kết nối'));
  socket.on('disconnect', () => console.log('Mất kết nối'));

  socket.on('jobProcessing', (data) => {
    if (data.id === currentJobId) setStatus('processing');
  });

  socket.on('jobFinished', (data) => {
    if (data.id === currentJobId) {
      setStatus('completed');
      showResult(data.shortUrl);
    }
  });

  socket.on('jobError', (data) => {
    if (data.id === currentJobId) {
      setStatus('error');
      showError(data.error || 'Chuyển đổi thất bại');
    }
  });

  window.convertLink = async function () {
    const url = urlInput.value.trim();
    if (!url) { urlInput.focus(); return; }
    if (!/shopee\.|shp\.ee|shope\.ee/.test(url)) {
      showError('Link Shopee không hợp lệ');
      return;
    }

    convertBtn.disabled = true;
    convertBtn.textContent = 'Đang convert...';

    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    statusSection.classList.remove('hidden');
    setStatus('waiting');

    try {
      const res = await fetch(`${API_CONFIG.API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');
      currentJobId = data.id;
    } catch (e) {
      showError(e.message);
      resetBtn();
    }
  };

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

  function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  }

  const openBtnText = document.getElementById('openBtnText');
  if (openBtnText) openBtnText.textContent = isMobile() ? 'Mở app' : 'Mở link';

  window.openLink = function (url) {
    const link = url || shortUrlEl.textContent;
    if (!link) return;
    window.open(link, '_blank');
  };

  function setStatus(status) {
    const map = {
      waiting: { color: 'bg-yellow-400', text: 'Đang chờ...', progress: '25%' },
      processing: { color: 'bg-blue-400', text: 'Đang xử lý...', progress: '60%' },
      completed: { color: 'bg-emerald-400', text: 'Hoàn thành', progress: '100%' },
      error: { color: 'bg-red-400', text: 'Lỗi', progress: '100%' },
    };
    const s = map[status];
    if (!s) return;

    statusIcon.className = `w-1.5 h-1.5 rounded-full ${s.color}`;
    statusText.textContent = s.text;
    statusText.className = `text-xs ${
      status === 'completed' ? 'text-emerald-400' :
      status === 'error' ? 'text-red-400' : 'text-slate-400'
    }`;
    progressBar.style.width = s.progress;
    progressBar.className = `h-full rounded-full transition-all duration-500 ${
      status === 'completed' ? 'bg-emerald-500' :
      status === 'error' ? 'bg-red-500' : 'bg-shopee-500'
    }`;
  }

  function showResult(shortUrl) {
    shortUrlEl.textContent = shortUrl;
    resultSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
    resetBtn();
    openLink(shortUrl);
  }

  function showError(msg) {
    errorText.textContent = msg;
    errorSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    statusSection.classList.add('hidden');
    resetBtn();
  }

  function resetBtn() {
    convertBtn.disabled = false;
    convertBtn.textContent = 'Convert';
  }

  urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') convertLink(); });
  urlInput.focus();

  // ═══ Report ═══
  window.loadReport = async function () {
    loadReportBtn.disabled = true;
    loadReportBtn.textContent = 'Đang tải...';

    document.getElementById('reportEmpty').classList.add('hidden');
    document.getElementById('reportNoData').classList.add('hidden');
    document.getElementById('reportTableContainer').classList.add('hidden');
    document.getElementById('reportError').classList.add('hidden');
    document.getElementById('reportLoading').classList.remove('hidden');

    try {
      const res = await fetch(`${API_CONFIG.API_BASE_URL}/api/reports/conversion`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');

      document.getElementById('reportLoading').classList.add('hidden');

      if (data.summary && (data.summary.totalOrders > 0 || data.summary.totalCommission > 0 || data.summary.totalRevenue > 0)) {
        document.getElementById('statTotalOrders').textContent = data.summary.totalOrders || 0;
        document.getElementById('statTotalCommission').textContent = formatCurrency(data.summary.totalCommission || 0);
        document.getElementById('statTotalRevenue').textContent = formatCurrency(data.summary.totalRevenue || 0);
      }

      if (data.orders && data.orders.length > 0) {
        document.getElementById('reportTableBody').innerHTML = data.orders.map(o => `
          <tr>
            <td class="px-3 py-2 font-mono text-white/90">${esc(o.orderId)}</td>
            <td class="px-3 py-2 text-slate-400">${esc(o.orderTime)}</td>
            <td class="px-3 py-2 text-slate-300 font-medium">${esc(o.orderValue)}</td>
            <td class="px-3 py-2 text-emerald-400 font-semibold">${esc(o.commission)}</td>
            <td class="px-3 py-2 text-slate-400 max-w-[150px] truncate" title="${esc(o.product)}">${esc(o.product)}</td>
            <td class="px-3 py-2">
              <span class="px-2 py-0.5 rounded-full text-[10px] ${statusClass(o.status)}">${esc(o.status)}</span>
            </td>
          </tr>
        `).join('');
        document.getElementById('reportTableContainer').classList.remove('hidden');
      } else {
        document.getElementById('reportNoData').classList.remove('hidden');
      }

    } catch (e) {
      document.getElementById('reportLoading').classList.add('hidden');
      document.getElementById('reportError').classList.remove('hidden');
      document.getElementById('reportErrorText').textContent = e.message;
    } finally {
      loadReportBtn.disabled = false;
      loadReportBtn.textContent = 'Tải báo cáo';
    }
  };

  function formatCurrency(v) {
    if (!v || isNaN(v)) return '0₫';
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
