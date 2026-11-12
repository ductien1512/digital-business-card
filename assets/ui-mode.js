/* ui-mode.js — chế độ sáng/tối dùng chung cho mọi trang.
 *
 * Cách dùng:
 *   1. Nạp file này trong <head>, TRƯỚC thẻ <link> CSS (để không bị nháy sai màu khi tải trang).
 *   2. Đặt nút ở bất kỳ đâu:  <button type="button" class="ui-mode-toggle" data-mode-toggle>…</button>
 *   3. (Tuỳ chọn) lắng nghe thay đổi:
 *        document.addEventListener('ui:modechange', (e) => { ... });
 *      với e.detail.mode = 'light' | 'dark' và e.detail.source = 'manual' | 'system' | 'sync'.
 *
 * Quy tắc chọn chế độ: lựa chọn đã lưu > cài đặt của hệ điều hành > tối (nhận diện mặc định của giao diện).
 * Chế độ hiện tại nằm ở html[data-mode]; CSS chỉ cần viết html[data-mode="light"] { … }.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'darkMode';   // giữ khoá cũ ('dark' | 'light') để không mất lựa chọn đã lưu
  const LABELS = { toLight: 'Chuyển sang giao diện sáng', toDark: 'Chuyển sang giao diện tối' };

  const root = document.documentElement;
  const systemLight = window.matchMedia('(prefers-color-scheme: light)');

  const store = {
    get() { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } },
    set(value) { try { localStorage.setItem(STORAGE_KEY, value); } catch { /* chế độ riêng tư: bỏ qua */ } },
  };
  const isMode = (value) => value === 'light' || value === 'dark';

  function resolveInitial() {
    const saved = store.get();
    if (isMode(saved)) return saved;
    return systemLight.matches ? 'light' : 'dark';
  }

  function syncButtons() {
    const isLight = root.dataset.mode === 'light';
    const label = isLight ? LABELS.toDark : LABELS.toLight;
    document.querySelectorAll('[data-mode-toggle]').forEach((button) => {
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', String(!isLight));   // pressed = đang ở chế độ tối
    });
  }

  function setMode(mode, source) {
    if (!isMode(mode)) return;
    root.dataset.mode = mode;
    syncButtons();
    document.dispatchEvent(new CustomEvent('ui:modechange', { detail: { mode, source } }));
  }

  // Áp dụng ngay khi script chạy (trong <head>) để tránh nháy màu
  root.dataset.mode = resolveInitial();

  document.addEventListener('DOMContentLoaded', () => {
    syncButtons();
    document.querySelectorAll('[data-mode-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = root.dataset.mode === 'light' ? 'dark' : 'light';
        store.set(next);
        setMode(next, 'manual');
      });
    });
  });

  // Chưa chọn thủ công thì đi theo hệ điều hành khi người dùng đổi giữa chừng
  systemLight.addEventListener('change', (event) => {
    if (!isMode(store.get())) setMode(event.matches ? 'light' : 'dark', 'system');
  });

  // Đồng bộ giữa các tab (ví dụ: đổi ở trang admin thì trang danh thiếp đổi theo)
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && isMode(event.newValue)) setMode(event.newValue, 'sync');
  });
})();
