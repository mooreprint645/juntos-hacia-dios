/* =========================================================
   JUNTOS HACIA DIOS - APP LIMPIA v14
   Admin + Supabase + Artistas + Mesh + Categorías + Canciones
========================================================= */

const ADMIN_EMAIL = "mooreprint645@gmail.com";

let currentEditingArtistId = null;
let currentEditingSongId = null;
let currentEditingDonationId = null;

let originalLyrics = "";

let meshPoints = [
  { x: 18, y: 35, color: "#facc15", size: 90, opacity: 0.85 },
  { x: 78, y: 30, color: "#38bdf8", size: 95, opacity: 0.7 },
  { x: 45, y: 78, color: "#a855f7", size: 90, opacity: 0.65 }
];

let selectedMeshPoint = 0;
let draggingMeshPoint = false;

/* =========================================================
   HELPERS
========================================================= */

function getSupabase() {
  return window.supabaseClient || null;
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function isAdminPage() {
  return window.location.pathname.includes("admin.html") || !!document.getElementById("adminPanel");
}

function clamp(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function safeHex(value, fallback = "#facc15") {
  const hex = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  return fallback;
}

function safeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  return "";
}

function getInitials(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");
  if (!clean) return "?";

  const words = clean.split(" ");

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words.slice(0, 3).map(word => word.charAt(0)).join("").toUpperCase();
}

function hexToRgbParts(hex) {
  const clean = safeHex(hex).replace("#", "");

  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  };
}

function hexToRgb(hex) {
  const rgb = hexToRgbParts(hex);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function hexToRgba(hex, opacity) {
  const rgb = hexToRgbParts(hex);
  const safeOpacity = clamp(opacity, 0.75, 0, 1);

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeOpacity})`;
}

/* =========================================================
   TEMA Y MENÚ
========================================================= */

function initTheme() {
  const savedTheme = localStorage.getItem("jhd-theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  }

  updateThemeButton();
}

function updateThemeButton() {
  const button = document.getElementById("themeToggle");
  if (!button) return;

  button.innerText = document.body.classList.contains("light-mode") ? "☀️" : "🌙";
}

function toggleTheme() {
  document.body.classList.toggle("light-mode");

  localStorage.setItem(
    "jhd-theme",
    document.body.classList.contains("light-mode") ? "light" : "dark"
  );

  updateThemeButton();
}

function initMenu() {
  const button = document.getElementById("menuToggle");
  const menu = document.getElementById("navMenu");

  if (!button || !menu) return;

  button.addEventListener("click", () => {
    menu.classList.toggle("open");
  });
}

/* =========================================================
   MESH GRADIENT
========================================================= */

function normalizeMeshPoints(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return [
      { x: 18, y: 35, color: "#facc15", size: 90, opacity: 0.85 },
      { x: 78, y: 30, color: "#38bdf8", size: 95, opacity: 0.7 },
      { x: 45, y: 78, color: "#a855f7", size: 90, opacity: 0.65 }
    ];
  }

  return points.map(point => ({
    x: clamp(point.x, 50, 0, 100),
    y: clamp(point.y, 50, 0, 100),
    color: safeHex(point.color, "#facc15"),
    size: clamp(point.size, 90, 20, 180),
    opacity: clamp(point.opacity, 0.75, 0.05, 1)
  }));
}

function buildMeshGradient(points) {
  const safePoints = normalizeMeshPoints(points);

  const layers = safePoints.map(point => {
    const strong = hexToRgba(point.color, point.opacity);
    const mid = hexToRgba(point.color, point.opacity * 0.55);
    const soft = hexToRgba(point.color, point.opacity * 0.22);

    return `radial-gradient(circle at ${point.x}% ${point.y}%, ${strong} 0%, ${mid} 32%, ${soft} 56%, transparent ${point.size}%)`;
  });

  layers.push("linear-gradient(135deg, #0b1020, #111827)");

  return layers.join(", ");
}

function getArtistGradient(artist) {
  return buildMeshGradient(artist && artist.gradient_points ? artist.gradient_points : []);
}

function artistInlineGradient(artist) {
  return `--artist-mesh-gradient:${getArtistGradient(artist)};`;
}

function getPointerPositionPercent(event, element) {
  const rect = element.getBoundingClientRect();

  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  return {
    x: clamp(Math.round(x), 50, 0, 100),
    y: clamp(Math.round(y), 50, 0, 100)
  };
}

function initMeshEditor() {
  const holder = document.getElementById("artistMeshEditor");

  if (!holder) return;

  holder.innerHTML = `
    <div id="jhdArtistGradientBox">
      <div class="mesh-editor-title">Portada tipo mesh</div>

      <div class="mesh-editor-help">
        Toca la portada para agregar un punto. Arrastra el punto para moverlo. Cambia color, tamaño e intensidad.
      </div>

      <div class="mesh-canvas-wrap" id="jhdMeshCanvasWrap"></div>

      <div class="mesh-controls" id="jhdMeshControls"></div>
    </div>
  `;

  const wrap = document.getElementById("jhdMeshCanvasWrap");

  if (wrap) {
    wrap.addEventListener("pointerdown", handleMeshPointerDown);
  }

  renderMeshEditor();
}

function renderMeshEditor() {
  const wrap = document.getElementById("jhdMeshCanvasWrap");

  if (!wrap) return;

  meshPoints = normalizeMeshPoints(meshPoints);
  wrap.style.background = buildMeshGradient(meshPoints);

  wrap.innerHTML = meshPoints.map((point, index) => `
    <button
      type="button"
      class="mesh-point ${index === selectedMeshPoint ? "active" : ""}"
      data-index="${index}"
      style="left:${point.x}%; top:${point.y}%; background:${point.color};">
    </button>
  `).join("");

  wrap.querySelectorAll(".mesh-point").forEach(dot => {
    dot.addEventListener("pointerdown", event => {
      event.stopPropagation();

      selectedMeshPoint = Number(dot.dataset.index);
      draggingMeshPoint = true;

      try {
        dot.setPointerCapture(event.pointerId);
      } catch (error) {}

      renderMeshEditor();
    });

    dot.addEventListener("pointermove", event => {
      if (!draggingMeshPoint) return;

      const point = meshPoints[selectedMeshPoint];
      if (!point) return;

      const position = getPointerPositionPercent(event, wrap);

      point.x = position.x;
      point.y = position.y;

      wrap.style.background = buildMeshGradient(meshPoints);
      dot.style.left = point.x + "%";
      dot.style.top = point.y + "%";
    });

    dot.addEventListener("pointerup", event => {
      draggingMeshPoint = false;

      try {
        dot.releasePointerCapture(event.pointerId);
      } catch (error) {}

      renderMeshEditor();
    });
  });

  updateMeshControls();
}

function handleMeshPointerDown(event) {
  if (event.target.classList.contains("mesh-point")) return;

  const wrap = document.getElementById("jhdMeshCanvasWrap");
  if (!wrap) return;

  const position = getPointerPositionPercent(event, wrap);

  meshPoints.push({
    x: position.x,
    y: position.y,
    color: "#facc15",
    size: 90,
    opacity: 0.75
  });

  selectedMeshPoint = meshPoints.length - 1;

  renderMeshEditor();
}

function updateMeshControls() {
  const panel = document.getElementById("jhdMeshControls");

  if (!panel) return;

  const point = meshPoints[selectedMeshPoint];

  if (!point) {
    panel.innerHTML = `<div class="mesh-panel">Toca la portada para agregar un punto.</div>`;
    return;
  }

  panel.innerHTML = `
    <div class="mesh-panel">
      <label>Color exacto</label>
      <input type="color" id="meshColorInput" value="${escapeHTML(point.color)}">
      <input type="text" id="meshHexInput" value="${escapeHTML(point.color)}" placeholder="#FACC15">
      <p style="color:var(--secondary); margin-top:8px;">${escapeHTML(hexToRgb(point.color))}</p>
    </div>

    <div class="mesh-panel">
      <label>Tamaño / mezcla <span>${point.size}%</span></label>
      <input type="range" id="meshSizeInput" min="20" max="180" value="${point.size}">
    </div>

    <div class="mesh-panel">
      <label>Intensidad <span>${Math.round(point.opacity * 100)}%</span></label>
      <input type="range" id="meshOpacityInput" min="5" max="100" value="${Math.round(point.opacity * 100)}">
    </div>

    <div class="mesh-actions">
      <button type="button" onclick="deleteSelectedMeshPoint()">Eliminar punto</button>
      <button type="button" onclick="resetMesh()">Reiniciar portada</button>
    </div>
  `;

  const colorInput = document.getElementById("meshColorInput");
  const hexInput = document.getElementById("meshHexInput");
  const sizeInput = document.getElementById("meshSizeInput");
  const opacityInput = document.getElementById("meshOpacityInput");

  if (colorInput) {
    colorInput.addEventListener("input", event => {
      point.color = safeHex(event.target.value, point.color);
      renderMeshEditor();
    });
  }

  if (hexInput) {
    hexInput.addEventListener("input", event => {
      point.color = safeHex(event.target.value, point.color);
      renderMeshEditor();
    });
  }

  if (sizeInput) {
    sizeInput.addEventListener("input", event => {
      point.size = clamp(event.target.value, 90, 20, 180);
      renderMeshEditor();
    });
  }

  if (opacityInput) {
    opacityInput.addEventListener("input", event => {
      point.opacity = clamp(Number(event.target.value) / 100, 0.75, 0.05, 1);
      renderMeshEditor();
    });
  }
}

function deleteSelectedMeshPoint() {
  if (meshPoints.length <= 1) {
    alert("Deja al menos un punto.");
    return;
  }

  meshPoints.splice(selectedMeshPoint, 1);
  selectedMeshPoint = 0;
  renderMeshEditor();
}

function resetMesh() {
  meshPoints = normalizeMeshPoints([]);
  selectedMeshPoint = 0;
  renderMeshEditor();
}

/* =========================================================
   LOGIN ADMIN
========================================================= */

async function loginAdmin() {
  const emailInput = document.getElementById("adminEmailInput");
  const passwordInput = document.getElementById("adminPasswordInput");
  const message = document.getElementById("adminLoginMessage");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";

  if (message) {
    message.innerText = "Iniciando sesión...";
  }

  if (!email || !password) {
    if (message) message.innerText = "Escribe tu correo y contraseña.";
    return;
  }

  const client = getSupabase();

  if (!client) {
    if (message) message.innerText = "No se pudo conectar con Supabase.";
    return;
  }

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (message) message.innerText = "No se pudo iniciar sesión: " + error.message;
    return;
  }

  if (message) {
    message.innerText = "Sesión iniciada.";
  }

  await checkAdminSession();
}

async function logoutAdmin() {
  const client = getSupabase();

  if (client) {
    await client.auth.signOut();
  }

  await checkAdminSession();
}

async function checkAdminSession() {
  const loginSection = document.getElementById("adminLoginSection");
  const panel = document.getElementById("adminPanel");
  const userText = document.getElementById("adminUserText");

  if (!loginSection || !panel) return;

  const client = getSupabase();

  if (!client) {
    loginSection.style.display = "block";
    panel.style.display = "none";
    return;
  }

  const { data } = await client.auth.getSession();
  const session = data ? data.session : null;

  if (!session || !session.user) {
    loginSection.style.display = "block";
    panel.style.display = "none";
    return;
  }

  const email = session.user.email || "";

  if (email !== ADMIN_EMAIL) {
    await client.auth.signOut();

    loginSection.style.display = "block";
    panel.style.display = "none";
    return;
  }

  loginSection.style.display = "none";
  panel.style.display = "block";

  if (userText) {
    userText.innerText = "Sesión iniciada como: " + email;
  }

  await loadAdminAll();
}

/* =========================================================
   ADMIN - ARTISTAS
========================================================= */

function resetArtistForm() {
  currentEditingArtistId = null;

  const title = document.getElementById("artistFormTitle");
  const name = document.getElementById("artistNameInput");
  const description = document.getElementById("artistDescriptionInput");

  if (title) title.innerText = "Agregar artista";
  if (name) name.value = "";
  if (description) description.value = "";

  meshPoints = normalizeMeshPoints([]);
  selectedMeshPoint = 0;

  renderMeshEditor();
}

async function saveArtist() {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar.");
    return;
  }

  const name = document.getElementById("artistNameInput")?.value.trim() || "";
  const description = document.getElementById("artistDescriptionInput")?.value.trim() || "";

  if (!name) {
    alert("Escribe el nombre del artista.");
    return;
  }

  const payload = {
    name,
    slug: slugify(name),
    description,
    avatar_url: "",
    cover_url: "",
    gradient_points: normalizeMeshPoints(meshPoints)
  };

  let result;

  if (currentEditingArtistId) {
    result = await client
      .from("artists")
      .update(payload)
      .eq("id", currentEditingArtistId);
  } else {
    result = await client
      .from("artists")
      .insert(payload);
  }

  if (result.error) {
    alert("No se pudo guardar artista: " + result.error.message);
    return;
  }

  alert("Artista guardado.");

  resetArtistForm();

  await loadAdminArtists();
  await loadArtistOptions();
  await loadPublicArtists();
}

async function editArtist(id) {
  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    alert("No se pudo cargar el artista.");
    return;
  }

  currentEditingArtistId = id;

  const title = document.getElementById("artistFormTitle");
  const name = document.getElementById("artistNameInput");
  const description = document.getElementById("artistDescriptionInput");

  if (title) title.innerText = "Editar artista";
  if (name) name.value = data.name || "";
  if (description) description.value = data.description || "";

  meshPoints = normalizeMeshPoints(data.gradient_points);
  selectedMeshPoint = 0;

  renderMeshEditor();

  const card = document.getElementById("artistFormCard");

  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function deleteArtist(id) {
  if (!confirm("¿Eliminar este artista?")) return;

  const client = getSupabase();

  if (!client) return;

  const { error } = await client
    .from("artists")
    .delete()
    .eq("id", id);

  if (error) {
    alert("No se pudo eliminar: " + error.message);
    return;
  }

  await loadAdminArtists();
  await loadArtistOptions();
}

async function loadAdminArtists() {
  const list = document.getElementById("adminArtistList");

  if (!list) return;

  const client = getSupabase();

  if (!client) {
    list.innerHTML = `<p style="color:#ffb4b4;">No se pudo conectar con Supabase.</p>`;
    return;
  }

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    list.innerHTML = `<p style="color:#ffb4b4;">${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p style="color:var(--secondary);">No hay artistas todavía.</p>`;
    return;
  }

  list.innerHTML = data.map(artist => `
    <div class="admin-list-item">
      <strong>${escapeHTML(artist.name || "Sin nombre")}</strong>
      <p style="color:var(--secondary); margin-top:6px;">${escapeHTML(artist.description || "Sin descripción.")}</p>

      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
        <button type="button" class="song-btn" onclick="editArtist('${artist.id}')">Editar</button>
        <button type="button" class="song-btn" onclick="deleteArtist('${artist.id}')">Eliminar</button>
      </div>
    </div>
  `).join("");
}

async function loadArtistOptions() {
  const select = document.getElementById("songArtistInput");

  if (!select) return;

  const client = getSupabase();

  if (!client) return;

  const current = select.value;

  const { data, error } = await client
    .from("artists")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) return;

  select.innerHTML = `<option value="">Selecciona artista</option>`;

  (data || []).forEach(artist => {
    select.innerHTML += `<option value="${artist.id}">${escapeHTML(artist.name || "Sin nombre")}</option>`;
  });

  if (current) {
    select.value = current;
  }
}

/* =========================================================
   ADMIN - CATEGORÍAS
========================================================= */

function resetCategoryForm() {
  const title = document.getElementById("categoryFormTitle");
  const name = document.getElementById("categoryNameInput");
  const description = document.getElementById("categoryDescriptionInput");

  if (title) title.innerText = "Agregar categoría";
  if (name) name.value = "";
  if (description) description.value = "";
}

async function saveCategory() {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar.");
    return;
  }

  const name = document.getElementById("categoryNameInput")?.value.trim() || "";
  const description = document.getElementById("categoryDescriptionInput")?.value.trim() || "";

  if (!name) {
    alert("Escribe el nombre de la categoría.");
    return;
  }

  const payload = {
    name,
    slug: slugify(name),
    description
  };

  const result = await client
    .from("categories")
    .insert(payload);

  if (result.error) {
    alert("No se pudo guardar categoría: " + result.error.message);
    return;
  }

  resetCategoryForm();

  await loadAdminCategories();
  await loadCategoryOptions();
  await loadPublicCategories();

  alert("Categoría guardada.");
}

async function deleteCategory(id) {
  if (!confirm("¿Eliminar esta categoría?")) return;

  const client = getSupabase();

  if (!client) return;

  const { error } = await client
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    alert("No se pudo eliminar: " + error.message);
    return;
  }

  await loadAdminCategories();
  await loadCategoryOptions();
  await loadPublicCategories();
}

async function loadAdminCategories() {
  const list = document.getElementById("adminCategoryList");

  if (!list) return;

  const client = getSupabase();

  if (!client) {
    list.innerHTML = `<
