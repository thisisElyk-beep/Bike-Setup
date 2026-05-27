// ── SHARED UTILITIES ─────────────────────────────────────
// Isolated from app.js to prevent circular imports

export function showToast(message, type = 'info') {
  const existing = document.getElementById('toast-container');
  const container = existing || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 320);
  }, 2800);
}

export function openModal(title, bodyHTML, footerHTML = '') {
  const overlay = document.getElementById('modal-overlay');
  const modal   = document.getElementById('modal');
  if (!overlay || !modal) return;

  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML  = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;

  overlay.classList.remove('hidden');
  modal.classList.remove('hidden');

  // Focus first input if present
  setTimeout(() => {
    const first = modal.querySelector('input:not([type=hidden]),textarea,select');
    if (first) first.focus();
  }, 50);
}

export function closeModal() {
  document.getElementById('modal-overlay')?.classList.add('hidden');
  document.getElementById('modal')?.classList.add('hidden');
}
