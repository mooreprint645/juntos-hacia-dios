/* =========================================================
   JUNTOS HACIA DIOS - APP LIMPIA
   Supabase + Admin + Canciones + Artistas + Mesh
========================================================= */

/* ------------------------------
   CONFIGURACIÓN
------------------------------ */

const ADMIN_EMAIL = "mooreprint645@gmail.com";

let currentEditingArtistId = null;
let currentEditingCategoryId = null;
let currentEditingSongId = null;

let originalLyrics = "";
let transposeAmount = 0;
let chordLanguage = "english";

let meshPoints = [
  { x: 18, y: 35, color: "#facc15", size: 90, opacity: 0.85 },
  { x: 78, y: 30, color: "#38bdf8", size: 95, opacity: 0.70 },
  { x: 45, y: 78, color: "#a855f7", size: 90, opacity: 0.65 }
];

let selectedMeshPoint = 0;
let draggingMeshPoint = false;

/* ------------------------------
   HELPERS GENERALES
------------------------------ */

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

function safeText(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function safeUrl(value) {
  const url = String(value || "").trim();

  if (!url) return "";

  if (url.startsWith("https://") || url.startsWith("http://")) {
    return url;
  }

  return "";
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
  return window.location.pathname.includes("admin.html") ||
    !!document.getElementById("adminPanel");
}

function markAdminPage() {
  if (isAdminPage()) {
    document.body.classList.add("admin-page");
  }
}

function clamp(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(max, Math.max(min, number));
}

function safeHex(value, fallback = "#facc15") {
  const hex = String(value || "").trim();

  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }

  return fallback;
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

function getInitials(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");

  if (!clean) return "?";

  const words = clean.split(" ");

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words.slice(0, 3).map(word => word.charAt(0)).join("").toUpperCase();
}

/* ------------------------------
   TEMA / MENÚ
------------------------------ */

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

/* ------------------------------
   MESH GRADIENT
------------------------------ */

function normalizeMeshPoints(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return [
      { x: 18, y: 35, color: "#facc15", size: 90, opacity: 0.85 },
      { x: 78, y: 30, color: "#38bdf8", size: 95, opacity: 0.70 },
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
  return buildMeshGradient(artist.gradient_points);
}

function artistInlineGradient(artist) {
  return `--artist-mesh-gradient:${getArtistGradient(artist)};`;
}

function applyArtistGradientToHero(artist) {
  const hero = document.querySelector(".artist-profile-hero");

  if (!hero) return;

  hero.style.setProperty("--artist-mesh-gradient", getArtistGradient(artist));
}

function getPointerPositionPercent(event, element) {
  const rect = element.getBoundingClientRect();

  const source = event.touches && event.touches[0]
    ? event.touches[0]
    : event;

  const x = ((source.clientX - rect.left) / rect.width) * 100;
  const y = ((source.clientY - rect.top) / rect.height) * 100;

  return {
    x: clamp(Math.round(x), 50, 0, 100),
    y: clamp(Math.round(y), 50, 0, 100)
  };
}

/* ------------------------------
   AUTH ADMIN
------------------------------ */

async function loginAdmin() {
  const emailInput = document.getElementById("adminEmailInput");
  const passwordInput = document.getElementById("adminPasswordInput");
  const message = document.getElementById("adminLoginMessage");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";

  if (message) message.innerText = "";

  if (!email || !password) {
    if (message) message.innerText = "Escribe tu correo y contraseña.";
    return;
  }

  const client = getSupabase();

  if (!client) {
    if (message) message.innerText = "No se pudo conectar con Supabase.";
    return;
  }

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    if (message) message.innerText = "No se pudo iniciar sesión. Revisa correo y contraseña.";
    return;
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

/* ------------------------------
   ADMIN - ARTISTAS
------------------------------ */

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

  const nameInput = document.getElementById("artistNameInput");
  const descriptionInput = document.getElementById("artistDescriptionInput");

  const name = nameInput ? nameInput.value.trim() : "";
  const description = descriptionInput ? descriptionInput.value.trim() : "";

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

  if (!client) return;

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name");

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
      <strong>${escapeHTML(artist.name)}</strong>
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

  const { data } = await client
    .from("artists")
    .select("id, name")
    .order("name");

  select.innerHTML = `<option value="">Selecciona artista</option>`;

  (data || []).forEach(artist => {
    select.innerHTML += `<option value="${artist.id}">${escapeHTML(artist.name)}</option>`;
  });

  if (current) select.value = current;
}

/* ------------------------------
   ADMIN - MESH EDITOR
------------------------------ */

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

  const dots = meshPoints.map((point, index) => `
    <button
      type="button"
      class="mesh-point ${index === selectedMeshPoint ? "active" : ""}"
      data-index="${index}"
      style="left:${point.x}%; top:${point.y}%; background:${point.color};">
    </button>
  `).join("");

  wrap.innerHTML = dots;

  wrap.querySelectorAll(".mesh-point").forEach(dot => {
    dot.addEventListener("pointerdown", event => {
      event.stopPropagation();
      selectedMeshPoint = Number(dot.dataset.index);
      draggingMeshPoint = true;
      dot.setPointerCapture(event.pointerId);
      renderMeshEditor();
    });

    dot.addEventListener("pointermove", event => {
      if (!draggingMeshPoint) return;

      const position = getPointerPositionPercent(event, wrap);
      const point = meshPoints[selectedMeshPoint];

      if (!point) return;

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
      <label>Tamaño / mezcla <span id="meshSizeLabel">${point.size}%</span></label>
      <input type="range" id="meshSizeInput" min="20" max="180" value="${point.size}">
    </div>

    <div class="mesh-panel">
      <label>Intensidad <span id="meshOpacityLabel">${Math.round(point.opacity * 100)}%</span></label>
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
    colorInput.addEventListener("input", () => {
      point.color = safeHex(colorInput.value, point.color);
      renderMeshEditor();
    });
  }

  if (hexInput) {
    hexInput.addEventListener("input", () => {
      point.color = safeHex(hexInput.value, point.color);
      renderMeshEditor();
    });
  }

  if (sizeInput) {
    sizeInput.addEventListener("input", () => {
      point.size = clamp(sizeInput.value, 90, 20, 180);
      renderMeshEditor();
    });
  }

  if (opacityInput) {
    opacityInput.addEventListener("input", () => {
      point.opacity = clamp(Number(opacityInput.value) / 100, 0.75, 0.05, 1);
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

/* ------------------------------
   ADMIN - CATEGORÍAS
------------------------------ */

function resetCategoryForm() {
  currentEditingCategoryId = null;

  const name = document.getElementById("categoryNameInput");
  const description = document.getElementById("categoryDescriptionInput");

  if (name) name.value = "";
  if (description) description.value = "";
}

async function saveCategory() {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar.");
    return;
  }

  const nameInput = document.getElementById("categoryNameInput");
  const descriptionInput = document.getElementById("categoryDescriptionInput");

  const name = nameInput ? nameInput.value.trim() : "";
  const description = descriptionInput ? descriptionInput.value.trim() : "";

  if (!name) {
    alert("Escribe el nombre de la categoría.");
    return;
  }

  const payload = {
    name,
    slug: slugify(name),
    description
  };

  let result;

  if (currentEditingCategoryId) {
    result = await client
      .from("categories")
      .update(payload)
      .eq("id", currentEditingCategoryId);
  } else {
    result = await client
      .from("categories")
      .insert(payload);
  }

  if (result.error) {
    alert("No se pudo guardar categoría: " + result.error.message);
    return;
  }

  resetCategoryForm();
  await loadAdminCategories();
  await loadCategoryOptions();
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
}

async function loadAdminCategories() {
  const list = document.getElementById("adminCategoryList");

  if (!list) return;

  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    list.innerHTML = `<p style="color:#ffb4b4;">${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p style="color:var(--secondary);">No hay categorías todavía.</p>`;
    return;
  }

  list.innerHTML = data.map(category => `
    <div class="admin-list-item">
      <strong>${escapeHTML(category.name)}</strong>
      <p style="color:var(--secondary); margin-top:6px;">${escapeHTML(category.description || "")}</p>
      <button type="button" class="song-btn" onclick="deleteCategory('${category.id}')">Eliminar</button>
    </div>
  `).join("");
}

async function loadCategoryOptions() {
  const select = document.getElementById("songCategoryInput");

  if (!select) return;

  const client = getSupabase();

  if (!client) return;

  const current = select.value;

  const { data } = await client
    .from("categories")
    .select("id, name")
    .order("name");

  select.innerHTML = `<option value="">Selecciona categoría</option>`;

  (data || []).forEach(category => {
    select.innerHTML += `<option value="${category.id}">${escapeHTML(category.name)}</option>`;
  });

  if (current) select.value = current;
}

/* ------------------------------
   ADMIN - CANCIONES
------------------------------ */

function normalizeSongType(value) {
  const text = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (text.includes("cristiano")) return "cristiano";
  return "catolico";
}

function getSongTypeLabel(value) {
  const type = normalizeSongType(value);

  if (type === "cristiano") return "Cristiano";
  return "Católico";
}

function insertSectionTitle(title) {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) return;

  const value = textarea.value || "";
  const cursor = textarea.selectionStart || value.length;
  const before = value.substring(0, cursor);
  const after = value.substring(cursor);

  const section = `\n[${title}]\n`;

  textarea.value = before + section + after;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = cursor + section.length;

  updateLyricsPreview();
}

function insertFullTemplate() {
  const textarea = document.getElementById("songLyricsInput");

  if (!textarea) return;

  textarea.value = `[Intro]

[Verso 1]

[Coro]

[Verso 2]

[Puente]

[Coro Final]`;

  updateLyricsPreview();
}

function resetSongForm() {
  currentEditingSongId = null;

  const fields = [
    "songTitleInput",
    "songToneInput",
    "songDifficultyInput",
    "songLyricsInput",
    "songTutorialGuitarInput",
    "songTutorialPianoInput"
  ];

  fields.forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });

  const artist = document.getElementById("songArtistInput");
  const category = document.getElementById("songCategoryInput");
  const type = document.getElementById("songTypeInput");

  if (artist) artist.value = "";
  if (category) category.value = "";
  if (type) type.value = "catolico";

  updateLyricsPreview();
}

async function saveSong() {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar.");
    return;
  }

  const title = document.getElementById("songTitleInput")?.value.trim() || "";
  const artistId = document.getElementById("songArtistInput")?.value || "";
  const categoryId = document.getElementById("songCategoryInput")?.value || "";
  const tone = document.getElementById("songToneInput")?.value.trim() || "";
  const difficulty = document.getElementById("songDifficultyInput")?.value.trim() || "";
  const lyrics = document.getElementById("songLyricsInput")?.value || "";
  const tutorialGuitar = document.getElementById("songTutorialGuitarInput")?.value.trim() || "";
  const tutorialPiano = document.getElementById("songTutorialPianoInput")?.value.trim() || "";
  const songType = normalizeSongType(document.getElementById("songTypeInput")?.value || "catolico");

  if (!title) {
    alert("Escribe el título de la canción.");
    return;
  }

  if (!artistId) {
    alert("Selecciona un artista.");
    return;
  }

  const payload = {
    title,
    slug: slugify(title),
    artist_id: artistId,
    category_id: categoryId || null,
    song_type: songType,
    tone,
    difficulty,
    lyrics,
    tutorial_guitar: tutorialGuitar,
    tutorial_piano: tutorialPiano
  };

  let songId = currentEditingSongId;
  let result;

  if (currentEditingSongId) {
    result = await client
      .from("songs")
      .update(payload)
      .eq("id", currentEditingSongId)
      .select("id")
      .single();
  } else {
    result = await client
      .from("songs")
      .insert(payload)
      .select("id")
      .single();
  }

  if (result.error) {
    alert("No se pudo guardar canción: " + result.error.message);
    return;
  }

  songId = result.data.id;

  if (songId && categoryId) {
    await client
      .from("song_categories")
      .delete()
      .eq("song_id", songId);

    await client
      .from("song_categories")
      .insert({
        song_id: songId,
        category_id: categoryId
      });
  }

  alert("Canción guardada.");

  resetSongForm();
  await loadAdminSongs();
}

async function editSong(id) {
  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("songs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    alert("No se pudo cargar la canción.");
    return;
  }

  currentEditingSongId = id;

  document.getElementById("songTitleInput").value = data.title || "";
  document.getElementById("songArtistInput").value = data.artist_id || "";
  document.getElementById("songCategoryInput").value = data.category_id || "";
  document.getElementById("songTypeInput").value = normalizeSongType(data.song_type);
  document.getElementById("songToneInput").value = data.tone || "";
  document.getElementById("songDifficultyInput").value = data.difficulty || "";
  document.getElementById("songLyricsInput").value = data.lyrics || "";
  document.getElementById("songTutorialGuitarInput").value = data.tutorial_guitar || "";
  document.getElementById("songTutorialPianoInput").value = data.tutorial_piano || "";

  updateLyricsPreview();

  const card = document.getElementById("songFormCard");
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function deleteSong(id) {
  if (!confirm("¿Eliminar esta canción?")) return;

  const client = getSupabase();

  if (!client) return;

  await client
    .from("song_categories")
    .delete()
    .eq("song_id", id);

  const { error } = await client
    .from("songs")
    .delete()
    .eq("id", id);

  if (error) {
    alert("No se pudo eliminar: " + error.message);
    return;
  }

  await loadAdminSongs();
}

async function loadAdminSongs() {
  const list = document.getElementById("adminSongList");

  if (!list) return;

  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name)
    `)
    .order("title");

  if (error) {
    list.innerHTML = `<p style="color:#ffb4b4;">${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p style="color:var(--secondary);">No hay canciones todavía.</p>`;
    return;
  }

  list.innerHTML = data.map(song => `
    <div class="admin-list-item">
      <strong>${escapeHTML(song.title)}</strong>
      <p style="color:var(--secondary); margin-top:6px;">
        ${escapeHTML(song.artists?.name || "Sin artista")} · ${escapeHTML(getSongTypeLabel(song.song_type))} · Tono ${escapeHTML(song.tone || "Sin tono")}
      </p>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
        <button type="button" class="song-btn" onclick="editSong('${song.id}')">Editar</button>
        <button type="button" class="song-btn" onclick="deleteSong('${song.id}')">Eliminar</button>
      </div>
    </div>
  `).join("");
}

/* ------------------------------
   LETRAS / ACORDES
------------------------------ */

function isSectionLine(line) {
  return /^\s*\[[^\]]+\]\s*$/.test(line);
}

function cleanSectionName(line) {
  return String(line || "").replace("[", "").replace("]", "").trim();
}

function sectionChip(name) {
  const text = name.toLowerCase();

  if (text.includes("coro")) return "C";
  if (text.includes("verso")) return text.match(/\d+/)?.[0] ? `V${text.match(/\d+/)[0]}` : "V";
  if (text.includes("puente")) return "P";
  if (text.includes("intro")) return "IN";
  if (text.includes("final")) return "F";

  return name.substring(0, 2).toUpperCase();
}

function highlightChords(line) {
  const escaped = escapeHTML(line);

  return escaped.replace(
    /\(([A-G](?:#|b)?(?:m|maj7|maj9|m7|m9|7|9|11|13|6|sus4|sus2|dim|aug|add9)?(?:\/[A-G](?:#|b)?)?)\)/g,
    `<span class="chord-token">$1</span>`
  );
}

function renderLyricsHTML(text) {
  const lines = String(text || "").split("\n");

  let html = "";
  let currentLines = [];
  let currentTitle = "Canto";

  function flush() {
    if (currentLines.length === 0 && !currentTitle) return;

    html += `
      <section class="lyrics-app-section">
        <span class="lyrics-app-chip">${escapeHTML(sectionChip(currentTitle))}</span>
        <div class="lyrics-app-content">
          ${currentLines.map(line => `<span class="lyrics-app-line">${highlightChords(line)}</span>`).join("")}
        </div>
      </section>
    `;

    currentLines = [];
  }

  lines.forEach(line => {
    if (isSectionLine(line)) {
      flush();
      currentTitle = cleanSectionName(line);
      return;
    }

    currentLines.push(line);
  });

  flush();

  return `<div class="lyrics-app-view">${html}</div>`;
}

function showLyrics() {
  const box = document.getElementById("songLyrics");

  if (!box) return;

  box.innerHTML = renderLyricsHTML(originalLyrics);
}

function updateLyricsPreview() {
  const textarea = document.getElementById("songLyricsInput");
  const preview = document.getElementById("jhdLyricsPreviewContent");

  if (!textarea || !preview) return;

  preview.innerHTML = renderLyricsHTML(textarea.value);
}

/* ------------------------------
   PUBLIC - CATEGORÍAS SONGS
------------------------------ */

function getSongCategories(song) {
  if (song && Array.isArray(song.song_categories)) {
    return song.song_categories.map(item => item.categories).filter(Boolean);
  }

  if (song && song.categories) {
    return [song.categories];
  }

  return [];
}

function getSongCategoryNames(song) {
  const categories = getSongCategories(song);

  if (categories.length === 0) return "Sin categoría";

  return categories.map(category => category.name).join(", ");
}

function getSongCategorySearch(song) {
  return getSongCategories(song)
    .map(category => `${category.name || ""} ${category.slug || ""}`)
    .join(" ")
    .toLowerCase();
}

function currentTypeFilter() {
  return normalizeSongType(getParam("tipo") || "");
}

function applyTypeFilter(query) {
  const raw = getParam("tipo");

  if (!raw) return query;

  const type = normalizeSongType(raw);

  return query.eq("song_type", type);
}

function updateSongPageTitle() {
  const title = document.querySelector(".section h2") || document.querySelector("h1");

  if (!title) return;

  const raw = getParam("tipo");

  if (!raw) {
    title.innerText = "Explorar canciones";
    return;
  }

  const type = normalizeSongType(raw);
  title.innerText = type === "cristiano" ? "Cantos Cristianos" : "Cantos Católicos";
}

function filterSongCards() {
  const input = document.getElementById("songSearch");
  const cards = document.querySelectorAll("#songList .song-card");
  const noResults = document.getElementById("noResults");

  const search = input ? input.value.toLowerCase().trim() : "";
  let count = 0;

  cards.forEach(card => {
    const title = card.dataset.title || "";
    const show = !search || title.includes(search);

    card.style.display = show ? "block" : "none";

    if (show) count++;
  });

  if (noResults) {
    noResults.style.display = count === 0 ? "block" : "none";
  }
}

async function loadPublicSongs() {
  const list = document.getElementById("songList");

  if (!list) return;

  const client = getSupabase();

  if (!client) return;

  updateSongPageTitle();

  let query = client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .order("title");

  query = applyTypeFilter(query);

  const { data, error } = await query;

  if (error) {
    list.innerHTML = `<div class="song-card"><h3>Error cargando canciones</h3><p>${escapeHTML(error.message)}</p></div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="song-card"><h3>No hay canciones todavía</h3></div>`;
    return;
  }

  list.innerHTML = data.map(song => {
    const categoryNames = getSongCategoryNames(song);
    const artistName = song.artists?.name || "Sin artista";
    const typeLabel = getSongTypeLabel(song.song_type);

    return `
      <article class="song-card" data-title="${escapeHTML(`${song.title} ${artistName} ${categoryNames} ${typeLabel}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(song.title || "Sin título")}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>🙏 ${escapeHTML(typeLabel)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <p>🎸 Tono: ${escapeHTML(song.tone || "No definido")}</p>
        <p>⭐ ${escapeHTML(song.difficulty || "Sin dificultad")}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  }).join("");

  const initialSearch = getParam("buscar");

  const input = document.getElementById("songSearch");

  if (input && initialSearch) {
    input.value = initialSearch.toLowerCase();
    filterSongCards();
  }
}

async function loadHomeSongs() {
  const list = document.getElementById("homeSongList");

  if (!list) return;

  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    list.innerHTML = `<div class="song-card"><h3>Error cargando canciones</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="song-card"><h3>No hay canciones todavía</h3></div>`;
    return;
  }

  list.innerHTML = data.map(song => {
    const artistName = song.artists?.name || "Sin artista";
    const categoryNames = getSongCategoryNames(song);

    return `
      <article class="song-card" data-title="${escapeHTML(`${song.title} ${artistName} ${categoryNames}`.toLowerCase())}">
        <h3>🎵 ${escapeHTML(song.title)}</h3>
        <p>👤 ${escapeHTML(artistName)}</p>
        <p>✝ ${escapeHTML(categoryNames)}</p>
        <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
      </article>
    `;
  }).join("");
}

function searchHomeSongs() {
  const input = document.getElementById("homeSearch");

  const value = input ? input.value.trim() : "";

  if (value) {
    window.location.href = `canciones.html?buscar=${encodeURIComponent(value)}`;
  } else {
    window.location.href = "canciones.html";
  }
}

async function loadSingleSong() {
  const title = document.getElementById("songTitle");
  const info = document.getElementById("songInfo");

  if (!title || !info) return;

  const slug = getParam("id");

  if (!slug) {
    title.innerText = "Canto no encontrado";
    return;
  }

  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("songs")
    .select(`
      *,
      artists(name, slug),
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    title.innerText = "Canto no encontrado";
    return;
  }

  const artistName = data.artists?.name || "Sin artista";
  const categoryNames = getSongCategoryNames(data);
  const typeLabel = getSongTypeLabel(data.song_type);

  title.innerText = data.title || "Sin título";
  info.innerText = `${artistName} · ${typeLabel} · ${categoryNames} · Tono ${data.tone || "No definido"}`;

  originalLyrics = data.lyrics || "";
  showLyrics();

  const guitar = document.getElementById("tutorialGuitar");
  const piano = document.getElementById("tutorialPiano");

  if (guitar) {
    const url = safeUrl(data.tutorial_guitar);
    guitar.href = url || "#";
    guitar.style.display = url ? "inline-block" : "none";
  }

  if (piano) {
    const url = safeUrl(data.tutorial_piano);
    piano.href = url || "#";
    piano.style.display = url ? "inline-block" : "none";
  }
}

/* ------------------------------
   PUBLIC - ARTISTAS
------------------------------ */

async function loadPublicArtists() {
  const list = document.getElementById("artistList");

  if (!list) return;

  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name");

  if (error) {
    list.innerHTML = `<div class="song-card"><h3>Error cargando artistas</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="song-card"><h3>No hay artistas todavía</h3></div>`;
    return;
  }

  list.innerHTML = data.map(artist => `
    <article class="song-card artist-card" data-title="${escapeHTML(`${artist.name} ${artist.description || ""}`.toLowerCase())}">
      <div class="artist-avatar" style="${artistInlineGradient(artist)}">
        ${escapeHTML(getInitials(artist.name))}
      </div>
      <h3>${escapeHTML(artist.name)}</h3>
      <p>${escapeHTML(artist.description || "Sin descripción todavía.")}</p>
      <a class="song-btn" href="artista.html?id=${encodeURIComponent(artist.slug)}">Ver perfil</a>
    </article>
  `).join("");
}

async function loadArtistProfile() {
  const name = document.getElementById("artistName");
  const description = document.getElementById("artistDescription");
  const tags = document.getElementById("artistTags");
  const avatar = document.getElementById("artistAvatar");
  const songsList = document.getElementById("artistSongsList");

  if (!name || !songsList) return;

  const slug = getParam("id");

  if (!slug) {
    name.innerText = "Artista no encontrado";
    return;
  }

  const client = getSupabase();

  if (!client) return;

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    name.innerText = "Artista no encontrado";
    return;
  }

  applyArtistGradientToHero(artist);

  name.innerText = artist.name || "Sin nombre";
  if (description) description.innerText = artist.description || "Sin descripción todavía.";
  if (tags) tags.innerText = "ARTISTA / MINISTERIO";

  if (avatar) {
    avatar.style.cssText += artistInlineGradient(artist);
    avatar.innerText = getInitials(artist.name);
  }

  const { data: songsData } = await client
    .from("songs")
    .select(`
      *,
      song_categories(
        categories(id, name, slug)
      )
    `)
    .eq("artist_id", artist.id)
    .order("title");

  if (!songsData || songsData.length === 0) {
    songsList.innerHTML = `<div class="song-card"><h3>No hay canciones todavía</h3></div>`;
    return;
  }

  songsList.innerHTML = songsData.map(song => `
    <article class="song-card">
      <h3>🎵 ${escapeHTML(song.title)}</h3>
      <p>🙏 ${escapeHTML(getSongTypeLabel(song.song_type))}</p>
      <p>✝ ${escapeHTML(getSongCategoryNames(song))}</p>
      <p>🎸 Tono: ${escapeHTML(song.tone || "No definido")}</p>
      <a class="song-btn" href="canto.html?id=${encodeURIComponent(song.slug)}">Ver canto</a>
    </article>
  `).join("");
}

/* ------------------------------
   DONACIONES
------------------------------ */

async function loadDonationCards() {
  const list = document.getElementById("donationCardsList");

  if (!list) return;

  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("donation_cards")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    list.innerHTML = `<div class="song-card"><h3>Error cargando donaciones</h3></div>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<div class="song-card"><h3>No hay datos de donación todavía</h3></div>`;
    return;
  }

  list.innerHTML = data.map(card => `
    <article class="song-card">
      <h3>${escapeHTML(card.title || "Donación")}</h3>
      <p>${escapeHTML(card.description || "")}</p>
      <p><strong>Titular:</strong> ${escapeHTML(card.account_name || "")}</p>
      <p><strong>Banco:</strong> ${escapeHTML(card.bank_name || "")}</p>
      <p><strong>Cuenta:</strong> ${escapeHTML(card.account_number || "")}</p>
      <p><strong>CLABE:</strong> ${escapeHTML(card.clabe || "")}</p>
      <p><strong>Tarjeta:</strong> ${escapeHTML(card.card_number || "")}</p>
      <p><strong>Teléfono:</strong> ${escapeHTML(card.phone || "")}</p>
      ${card.link_url ? `<a class="song-btn" href="${escapeHTML(card.link_url)}" target="_blank" rel="noopener">Abrir enlace</a>` : ""}
    </article>
  `).join("");
}

/* ------------------------------
   INIT
------------------------------ */

async function loadAdminAll() {
  await loadAdminArtists();
  await loadAdminCategories();
  await loadAdminSongs();
  await loadArtistOptions();
  await loadCategoryOptions();
  initMeshEditor();
}

function initAdminEvents() {
  const lyricsInput = document.getElementById("songLyricsInput");

  if (lyricsInput) {
    lyricsInput.addEventListener("input", updateLyricsPreview);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  markAdminPage();
  initTheme();
  initMenu();

  const themeButton = document.getElementById("themeToggle");
  if (themeButton) {
    themeButton.addEventListener("click", toggleTheme);
  }

  initAdminEvents();

  if (isAdminPage()) {
    await checkAdminSession();
    initMeshEditor();
  }

  await loadHomeSongs();
  await loadPublicSongs();
  await loadSingleSong();
  await loadPublicArtists();
  await loadArtistProfile();
  await loadDonationCards();

  const songSearch = document.getElementById("songSearch");
  if (songSearch) {
    songSearch.addEventListener("input", filterSongCards);
  }
});

/* ------------------------------
   EXPONER FUNCIONES A HTML
------------------------------ */

window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;

window.saveArtist = saveArtist;
window.editArtist = editArtist;
window.deleteArtist = deleteArtist;
window.cancelArtistEdit = resetArtistForm;

window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;

window.saveSong = saveSong;
window.editSong = editSong;
window.deleteSong = deleteSong;
window.cancelSongEdit = resetSongForm;

window.insertSectionTitle = insertSectionTitle;
window.insertFullTemplate = insertFullTemplate;
window.searchHomeSongs = searchHomeSongs;
window.filterSongCards = filterSongCards;

/* =========================================================
   FIX EXTRA LOGIN ADMIN
========================================================= */

window.loginAdmin = async function () {
  const emailInput = document.getElementById("adminEmailInput");
  const passwordInput = document.getElementById("adminPasswordInput");
  const message = document.getElementById("adminLoginMessage");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";

  if (message) message.innerText = "Iniciando sesión...";

  if (!email || !password) {
    if (message) message.innerText = "Escribe correo y contraseña.";
    return;
  }

  const client = window.supabaseClient || (typeof getSupabase === "function" ? getSupabase() : null);

  if (!client) {
    if (message) message.innerText = "No se pudo conectar con Supabase.";
    return;
  }

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(error);
    if (message) message.innerText = "No se pudo iniciar sesión: " + error.message;
    return;
  }

  if (message) message.innerText = "Sesión iniciada.";

  if (typeof checkAdminSession === "function") {
    await checkAdminSession();
  } else {
    location.reload();
  }
};
/* =========================================================
   FIX CATEGORÍAS - ADMIN Y PÁGINA PÚBLICA
========================================================= */

async function loadAdminCategories() {
  const list = document.getElementById("adminCategoryList");

  if (!list) return;

  const client = getSupabase();

  if (!client) {
    list.innerHTML = `<p style="color:#ffb4b4;">No se pudo conectar con Supabase.</p>`;
    return;
  }

  list.innerHTML = `<p style="color:var(--secondary);">Cargando categorías...</p>`;

  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    list.innerHTML = `
      <p style="color:#ffb4b4;">
        Error cargando categorías: ${escapeHTML(error.message)}
      </p>
    `;
    console.error("Error categorías admin:", error);
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `
      <p style="color:var(--secondary);">
        No hay categorías todavía.
      </p>
    `;
    return;
  }

  list.innerHTML = data.map(category => `
    <div class="admin-list-item">
      <strong>${escapeHTML(category.name || "Sin nombre")}</strong>

      <p style="color:var(--secondary); margin-top:6px;">
        ${escapeHTML(category.description || "Sin descripción.")}
      </p>

      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
        <button type="button" class="song-btn" onclick="deleteCategory('${category.id}')">
          Eliminar
        </button>
      </div>
    </div>
  `).join("");
}

async function loadCategoryOptions() {
  const select = document.getElementById("songCategoryInput");

  if (!select) return;

  const client = getSupabase();

  if (!client) return;

  const current = select.value;

  const { data, error } = await client
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error opciones categorías:", error);
    return;
  }

  select.innerHTML = `<option value="">Selecciona categoría</option>`;

  (data || []).forEach(category => {
    select.innerHTML += `
      <option value="${category.id}">
        ${escapeHTML(category.name || "Sin nombre")}
      </option>
    `;
  });

  if (current) {
    select.value = current;
  }
}

async function loadPublicCategories() {
  const list =
    document.getElementById("categoryList") ||
    document.getElementById("categoriesList") ||
    document.getElementById("publicCategoryList");

  if (!list) return;

  const client = getSupabase();

  if (!client) {
    list.innerHTML = `
      <div class="song-card">
        <h3>No se pudo conectar con Supabase</h3>
      </div>
    `;
    return;
  }

  list.innerHTML = `
    <div class="song-card">
      <h3>Cargando categorías...</h3>
    </div>
  `;

  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    list.innerHTML = `
      <div class="song-card">
        <h3>Error cargando categorías</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
    console.error("Error categorías públicas:", error);
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `
      <div class="song-card">
        <h3>No hay categorías todavía</h3>
        <p>Agrega categorías desde el panel de administración.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = data.map(category => `
    <article class="song-card">
      <h3>${escapeHTML(category.name || "Sin nombre")}</h3>

      <p>${escapeHTML(category.description || "Cantos de esta categoría.")}</p>

      <a class="song-btn" href="canciones.html?buscar=${encodeURIComponent(category.name || "")}">
        Ver cantos
      </a>
    </article>
  `).join("");
}

async function jhdFixCategoriesNow() {
  await loadAdminCategories();
  await loadCategoryOptions();
  await loadPublicCategories();
}

document.addEventListener("DOMContentLoaded", () => {
  jhdFixCategoriesNow();
});

setTimeout(jhdFixCategoriesNow, 800);
setTimeout(jhdFixCategoriesNow, 1800);
setTimeout(jhdFixCategoriesNow, 3200);

window.loadAdminCategories = loadAdminCategories;
window.loadCategoryOptions = loadCategoryOptions;
window.loadPublicCategories = loadPublicCategories;
window.jhdFixCategoriesNow = jhdFixCategoriesNow;
