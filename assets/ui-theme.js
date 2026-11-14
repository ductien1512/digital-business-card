/* ui-theme.js — chủ đề màu dùng chung cho mọi trang (danh thiếp + admin).
 *
 * Chủ đề hiện tại nằm ở html[data-theme]; màu của từng chủ đề khai báo trong assets/ultimate-ui.css
 * (mục "8. CHỦ ĐỀ MÀU"). Chủ đề mặc định (nordic) dùng bộ màu gốc nên không cần khối CSS riêng.
 *
 * Thêm một chủ đề mới:
 *   1. Thêm khoá vào THEMES bên dưới.
 *   2. Thêm 2 khối CSS (tối + sáng) cho html[data-theme="khoá"] trong ultimate-ui.css.
 *   3. Thêm một lựa chọn trong tab "Giao diện" của admin.html (data-theme-option + swatch).
 *
 * API:  UITheme.apply(khoá)  -> áp dụng, lưu lại, trả về khoá đã chuẩn hoá
 *       UITheme.saved()      -> chủ đề đã lưu trong trình duyệt (hoặc mặc định)
 *       UITheme.normalize(x) -> khoá hợp lệ (nhận cả khoá cũ trong LEGACY)
 *       sự kiện 'ui:themechange' với e.detail.theme
 * Nạp file này trong <head> (sau ui-mode.js) để màu được áp dụng trước khi vẽ trang, không bị nháy.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'cardTheme';     // giữ khoá cũ để không mất lựa chọn đã lưu
  const DEFAULT = 'nordic';
  const THEMES = ['nordic', 'champagne', 'emerald', 'indigo'];
  // Khoá cũ (bản trước) -> chủ đề mới tương ứng; dữ liệu đã lưu trên Firebase vẫn đọc được
  const LEGACY = { professional: 'nordic', creative: 'champagne', ocean: 'emerald' };

  const root = document.documentElement;

  const normalize = (theme) => (THEMES.includes(theme) ? theme : (LEGACY[theme] || DEFAULT));

  function saved() {
    try { return normalize(localStorage.getItem(STORAGE_KEY)); } catch { return DEFAULT; }
  }

  function apply(theme) {
    const name = normalize(theme);
    root.dataset.theme = name;
    try { localStorage.setItem(STORAGE_KEY, name); } catch { /* chế độ riêng tư: bỏ qua */ }
    document.dispatchEvent(new CustomEvent('ui:themechange', { detail: { theme: name } }));
    return name;
  }

  root.dataset.theme = saved();        // áp dụng ngay khi script chạy (trong <head>)

  window.UITheme = { THEMES, DEFAULT, LEGACY, normalize, saved, apply };
})();
