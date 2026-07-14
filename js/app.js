/**
 * Frontend App - Shopee Affiliate Link Converter
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
      showError('Please enter a valid Shopee URL');
      return;
    }

    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';

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
      convertBtn.textContent = 'Convert';
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
      waiting: { color: 'bg-yellow-500', text: 'Waiting...', progress: '25%', show: true },
      processing: { color: 'bg-blue-500', text: 'Processing...', progress: '60%', show: true },
      completed: { color: 'bg-green-500', text: 'Completed', progress: '100%', show: false },
      error: { color: 'bg-red-500', text: 'Error', progress: '100%', show: false },
    };
    const s = statusMap[status];
    if (!s) return;

    statusIcon.className = `w-3 h-3 rounded-full ${s.color}`;
    if (status === 'waiting' || status === 'processing') {
      statusIcon.classList.add('animate-pulse-dot');
    }
    statusText.textContent = s.text;
    progressBar.style.width = s.progress;
    loadingAnimation.classList.toggle('hidden', !s.show);
  }

  function showResult(shortUrl) {
    originalUrlEl.textContent = urlInput.value.trim();
    shortUrlEl.textContent = shortUrl;
    resultSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
    convertBtn.disabled = false;
    convertBtn.textContent = 'Convert';
  }

  function showError(message) {
    errorText.textContent = message;
    errorSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    loadingAnimation.classList.add('hidden');
    convertBtn.disabled = false;
    convertBtn.textContent = 'Convert';
  }

  function resetUI() {
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    loadingAnimation.classList.add('hidden');
    toast.classList.add('hidden');
    progressBar.style.width = '0%';
    statusIcon.className = 'w-3 h-3 rounded-full bg-gray-500';
    statusText.textContent = 'Waiting...';
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
  // Shake Animation (CSS-in-JS)
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
