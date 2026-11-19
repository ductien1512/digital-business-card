/* sw.js — chạy được khi không có mạng.
 * Lưu sẵn giao diện (HTML, CSS, JS, font, icon) ở lần mở đầu tiên; các lần sau mở lại từ bản đã lưu
 * và âm thầm tải bản mới để dùng ở lần mở kế tiếp. Chỉ tệp của chính trang này và ảnh đi qua đây:
 * Firebase, Formspree, Google Analytics và API Cloudinary đi thẳng ra mạng, không bị đụng tới.
 *
 * PHÁT HÀNH BẢN MỚI: đổi CACHE_VERSION bên dưới (và thêm tệp mới vào PRECACHE nếu có),
 * người dùng sẽ nhận bản mới đồng bộ ở lần mở sau. Service worker chỉ chạy trên https hoặc localhost. */
const CACHE_VERSION = 'v1';
const CACHE = `card-${CACHE_VERSION}`;
const IMAGE_CACHE = 'card-images';       // ảnh đại diện (Cloudinary): giữ nguyên qua các phiên bản

// Mọi tệp trang cần để hiển thị đầy đủ. Thiếu một tệp ở đây thì lần cài đặt sẽ thất bại (có chủ ý).
const PRECACHE = [
  './', 'index.html', 'admin.html',
  'assets/ultimate-ui.css', 'assets/ui-mode.js', 'assets/ui-theme.js',
  'assets/animate.min.css', 'assets/fontawesome.min.css', 'assets/inter.css',
  'assets/fonts/fa-brands-400.woff2', 'assets/fonts/fa-solid-900.woff2',
  'assets/fonts/inter-400.ttf', 'assets/fonts/inter-500.ttf', 'assets/fonts/inter-600.ttf', 'assets/fonts/inter-700.ttf',
  'assets/qrcode.min.js',
  'assets/firebase-app-compat.js', 'assets/firebase-auth-compat.js', 'assets/firebase-database-compat.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))   // 'reload': bỏ qua cache HTTP cũ
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('card-') && k !== CACHE && k !== IMAGE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Trả ngay bản đã lưu (nếu có), đồng thời tải bản mới để lần sau dùng.
async function staleWhileRevalidate(request, cacheName, matchOptions) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, matchOptions);
  const refresh = fetch(request).then((response) => {
    if (response.ok || response.type === 'opaque') cache.put(request, response.clone());   // opaque: ảnh khác nguồn
    return response;
  });
  if (cached) { refresh.catch(() => {}); return cached; }                                   // offline: bỏ qua lỗi tải ngầm
  return refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin === self.location.origin) {
    // Trang mở kèm ?query (ví dụ ?ref=zalo) vẫn dùng được bản đã lưu
    event.respondWith(staleWhileRevalidate(request, CACHE, request.mode === 'navigate' ? { ignoreSearch: true } : undefined));
  } else if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  }
});
