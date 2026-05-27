import { showToast } from './app.js';

import { setActiveProfile } from './db.js';

const STORAGE_KEY_PROFILES = 'dialed_profiles';
const STORAGE_KEY_ACTIVE   = 'dialed_active_profile';

// ── STORAGE HELPERS ───────────────────────────────────────
export function getProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    const profiles = raw ? JSON.parse(raw) : [];
    // Always ensure "default" profile exists first
    if (!profiles.find(p => p.id === 'default')) {
      profiles.unshift({ id: 'default', name: 'Default', createdAt: 0 });
      saveProfiles(profiles);
    }
    return profiles;
  } catch { return [{ id: 'default', name: 'Default', createdAt: 0 }]; }
}

function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
}

export function getActiveProfileId() {
  return localStorage.getItem(STORAGE_KEY_ACTIVE) || null;
}

export function activateProfile(profileId) {
  localStorage.setItem(STORAGE_KEY_ACTIVE, profileId);
  setActiveProfile(profileId);
}

export function createProfile(name) {
  const profiles = getProfiles();
  if (profiles.find(p => p.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`A profile named "${name}" already exists`);
  }
  const id = 'profile_' + Date.now();
  profiles.push({ id, name: name.trim(), createdAt: Date.now() });
  saveProfiles(profiles);
  return id;
}

export function deleteProfile(profileId) {
  if (profileId === 'default') throw new Error('Cannot delete the default profile');
  const profiles = getProfiles().filter(p => p.id !== profileId);
  saveProfiles(profiles);
  if (getActiveProfileId() === profileId) {
    activateProfile('default');
  }
}

export function renameProfile(profileId, newName) {
  const profiles = getProfiles();
  const p = profiles.find(p => p.id === profileId);
  if (p) { p.name = newName.trim(); saveProfiles(profiles); }
}

export function initProfile() {
  const active = getActiveProfileId();
  if (active) {
    setActiveProfile(active);
    return active;
  }
  return null; // caller should show profile picker
}

// ── PROFILE PICKER SCREEN ─────────────────────────────────
export function showProfilePicker(onSelected) {
  const profiles = getProfiles();
  const overlay = document.createElement('div');
  overlay.id = 'profile-picker-overlay';
  overlay.innerHTML = `
    <div class="profile-picker-card">
      <div class="profile-picker-logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="var(--accent)" stroke-width="1.8"/>
          <circle cx="16" cy="16" r="6" stroke="var(--accent)" stroke-width="1.8"/>
          <line x1="16" y1="2" x2="16" y2="8" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="16" y1="24" x2="16" y2="30" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="2" y1="16" x2="8" y2="16" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="24" y1="16" x2="30" y2="16" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <span class="profile-picker-app-name">Quiver</span>
      </div>
      <h2 class="profile-picker-title">Who's riding?</h2>
      <p class="profile-picker-sub">Select your profile to view your fleet and settings</p>
      <div class="profile-list" id="profile-list">
        ${profiles.map(p => `
          <button class="profile-btn" data-id="${p.id}">
            <div class="profile-btn-avatar">${p.name.charAt(0).toUpperCase()}</div>
            <span class="profile-btn-name">${escHtml(p.name)}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 7h6M8 5l2 2-2 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>`).join('')}
      </div>
      <div class="profile-picker-divider"></div>
      <div class="profile-new-section" id="profile-new-section">
        <button class="btn-text profile-new-toggle" id="profile-new-toggle">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          New Profile
        </button>
        <div class="profile-new-form hidden" id="profile-new-form">
          <input id="profile-new-name" class="field-input" type="text" placeholder="Your name" maxlength="32">
          <div style="display:flex;gap:.5rem;margin-top:.5rem">
            <button class="btn-secondary" id="profile-new-cancel" style="flex:1">Cancel</button>
            <button class="btn-primary" id="profile-new-save" style="flex:1">Create</button>
          </div>
          <div id="profile-new-error" style="font-size:.78rem;color:var(--danger);margin-top:.35rem;display:none"></div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Select existing profile
  overlay.querySelectorAll('.profile-btn').forEach(btn => {
    btn.onclick = () => {
      activateProfile(btn.dataset.id);
      closePicker();
      onSelected(btn.dataset.id);
    };
  });

  // New profile form toggle
  const toggle = document.getElementById('profile-new-toggle');
  const form   = document.getElementById('profile-new-form');
  toggle.onclick = () => {
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      document.getElementById('profile-new-name').focus();
      toggle.style.display = 'none';
    }
  };
  document.getElementById('profile-new-cancel').onclick = () => {
    form.classList.add('hidden');
    toggle.style.display = '';
    document.getElementById('profile-new-error').style.display = 'none';
  };

  const saveNew = () => {
    const name = document.getElementById('profile-new-name').value.trim();
    const errEl = document.getElementById('profile-new-error');
    if (!name) { errEl.textContent = 'Enter a name'; errEl.style.display = 'block'; return; }
    try {
      const id = createProfile(name);
      activateProfile(id);
      closePicker();
      onSelected(id);
    } catch(e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }
  };

  document.getElementById('profile-new-save').onclick = saveNew;
  document.getElementById('profile-new-name').onkeydown = e => { if (e.key === 'Enter') saveNew(); };

  function closePicker() {
    overlay.remove();
    document.body.style.overflow = '';
  }
}

// ── PROFILE SWITCHER (header dropdown) ───────────────────
export function renderProfileChip(profileId, onSwitch) {
  const profiles = getProfiles();
  const active = profiles.find(p => p.id === profileId);
  const name = active?.name || 'Profile';

  const existing = document.getElementById('profile-chip');
  if (existing) existing.remove();

  const chip = document.createElement('button');
  chip.id = 'profile-chip';
  chip.className = 'profile-chip';
  chip.title = 'Switch profile';
  chip.innerHTML = `
    <div class="profile-chip-avatar">${name.charAt(0).toUpperCase()}</div>
    <span class="profile-chip-name">${escHtml(name)}</span>
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  chip.onclick = (e) => {
    e.stopPropagation();
    const existing = document.getElementById('profile-dropdown');
    if (existing) { existing.remove(); return; }
    showProfileDropdown(profileId, chip, onSwitch);
  };

  // Insert as LAST item in header-right so theme toggle stays leftmost
  const headerRight = document.querySelector('#app-header .header-right');
  if (headerRight) {
    // Remove any existing chip first
    const old = headerRight.querySelector('#profile-chip');
    if (old) old.remove();
    // Append after the theme button so theme remains leftmost
    headerRight.appendChild(chip);
  }

  return chip;
}

function showProfileDropdown(activeId, anchor, onSwitch) {
  const profiles = getProfiles();
  const drop = document.createElement('div');
  drop.id = 'profile-dropdown';
  drop.className = 'profile-dropdown';
  const activeName = profiles.find(p => p.id === activeId)?.name || 'Profile';
  drop.innerHTML = `
    <div class="profile-drop-header">Signed in as</div>
    <div class="profile-drop-whoami">
      <div class="profile-drop-avatar active-avatar">${activeName.charAt(0).toUpperCase()}</div>
      <span class="profile-drop-active-name">${escHtml(activeName)}</span>
    </div>
    <div class="profile-drop-divider"></div>
    <button class="profile-drop-new" id="profile-drop-rename-active" data-id="${activeId}" data-name="${escHtml(activeName)}">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1.5l2.5 2.5L3.5 10.5H1V8L8 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
      Rename "${escHtml(activeName)}"
    </button>
    ${profiles.length > 1 ? `
    <div class="profile-drop-divider"></div>
    <div class="profile-drop-header">Switch to</div>
    ${profiles.filter(p => p.id !== activeId).map(p => `
      <button class="profile-drop-item" data-id="${p.id}">
        <div class="profile-drop-avatar">${p.name.charAt(0).toUpperCase()}</div>
        <span>${escHtml(p.name)}</span>
      </button>`).join('')}` : ''}
    <div class="profile-drop-divider"></div>
    <button class="profile-drop-new" id="profile-drop-new">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      New Profile
    </button>
    <button class="profile-drop-new" id="profile-drop-switch">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 5.5h9M7 2.5l3 3-3 3M4 8.5L1 5.5l3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Switch Profile
    </button>`;

  // Position below chip
  const rect = anchor.getBoundingClientRect();
  // Anchor to right edge of anchor so it doesn't overflow off screen
  const rightEdge = window.innerWidth - rect.right;
  drop.style.cssText = `position:fixed;top:${rect.bottom+6}px;right:${rightEdge}px;min-width:220px;z-index:9999`;
  document.body.appendChild(drop);

  drop.querySelectorAll('.profile-drop-item').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.id === activeId) { drop.remove(); return; }
      activateProfile(btn.dataset.id);
      drop.remove();
      onSwitch(btn.dataset.id);
    };
  });

  document.getElementById('profile-drop-rename-active')?.addEventListener('click', e => {
    e.stopPropagation();
    drop.remove();
    const btn = e.currentTarget;
    showRenameProfileModal(btn.dataset.id, btn.dataset.name, activeId, onSwitch);
  });

  document.getElementById('profile-drop-new').onclick = () => {
    drop.remove();
    showNewProfileInline(onSwitch);
  };

  document.getElementById('profile-drop-switch').onclick = () => {
    drop.remove();
    // Clear active profile so picker shows fresh
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
    showProfilePicker(newId => {
      renderProfileChip(newId, onSwitch);
      onSwitch(newId);
    });
  };

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function handler() {
      drop.remove();
      document.removeEventListener('click', handler);
    });
  }, 0);
}

function showNewProfileInline(onSwitch) {
  // Reuse the picker overlay but skip existing profiles
  const overlay = document.createElement('div');
  overlay.id = 'profile-picker-overlay';
  overlay.innerHTML = `
    <div class="profile-picker-card" style="max-width:340px">
      <h2 class="profile-picker-title" style="margin-bottom:.5rem">New Profile</h2>
      <p class="profile-picker-sub">Choose a name for this profile</p>
      <input id="profile-new-name-inline" class="field-input" type="text" placeholder="Your name" maxlength="32" style="margin:.75rem 0 .5rem">
      <div id="profile-new-error-inline" style="font-size:.78rem;color:var(--danger);margin-bottom:.5rem;display:none"></div>
      <div style="display:flex;gap:.5rem">
        <button class="btn-secondary" id="profile-new-cancel-inline" style="flex:1">Cancel</button>
        <button class="btn-primary" id="profile-new-save-inline" style="flex:1">Create & Switch</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  document.getElementById('profile-new-name-inline').focus();

  const close = () => { overlay.remove(); document.body.style.overflow = ''; };

  document.getElementById('profile-new-cancel-inline').onclick = close;
  const save = () => {
    const name = document.getElementById('profile-new-name-inline').value.trim();
    const errEl = document.getElementById('profile-new-error-inline');
    if (!name) { errEl.textContent = 'Enter a name'; errEl.style.display = 'block'; return; }
    try {
      const id = createProfile(name);
      activateProfile(id);
      close();
      onSwitch(id);
    } catch(e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }
  };
  document.getElementById('profile-new-save-inline').onclick = save;
  document.getElementById('profile-new-name-inline').onkeydown = e => { if (e.key === 'Enter') save(); };
}

function showRenameProfileModal(profileId, currentName, activeId, onSwitch) {
  const overlay = document.createElement('div');
  overlay.id = 'profile-picker-overlay';
  overlay.innerHTML = `
    <div class="profile-picker-card" style="max-width:340px">
      <h2 class="profile-picker-title" style="margin-bottom:.35rem">Rename Profile</h2>
      <p class="profile-picker-sub">Enter a new name for this profile</p>
      <input id="profile-rename-modal-input" class="field-input" type="text"
             value="${escHtml(currentName)}" maxlength="32"
             style="margin:.75rem 0 .5rem;font-size:1rem">
      <div id="profile-rename-error" style="font-size:.78rem;color:var(--danger);margin-bottom:.5rem;display:none"></div>
      <div style="display:flex;gap:.5rem">
        <button class="btn-secondary" id="profile-rename-cancel" style="flex:1">Cancel</button>
        <button class="btn-primary" id="profile-rename-save" style="flex:1">Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  const input = document.getElementById('profile-rename-modal-input');
  input.focus(); input.select();

  const close = () => { overlay.remove(); document.body.style.overflow = ''; };
  document.getElementById('profile-rename-cancel').onclick = close;

  const save = () => {
    const newName = input.value.trim();
    const errEl = document.getElementById('profile-rename-error');
    if (!newName) { errEl.textContent = 'Name cannot be empty'; errEl.style.display = 'block'; return; }
    renameProfile(profileId, newName);
    if (profileId === activeId) {
      const chip = document.getElementById('profile-chip');
      if (chip) {
        chip.querySelector('.profile-chip-avatar').textContent = newName.charAt(0).toUpperCase();
        chip.querySelector('.profile-chip-name').textContent = newName;
      }
    }
    close();
    showToast('Profile renamed', 'success');
  };
  document.getElementById('profile-rename-save').onclick = save;
  input.onkeydown = e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') close(); };
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
