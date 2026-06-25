/* =========================================================
   JUNTOS HACIA DIOS - APP MINIMA
   Luna + login + categorias + artistas basicos
========================================================= */

const ADMIN_EMAIL = "mooreprint645@gmail.com";

let currentEditingCategoryId = null;
let currentEditingArtistId = null;

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

function getInitials(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");

  if (!clean) return "?";

  const words = clean.split(" ");

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words.slice(0, 3).map(function (word) {
    return word.charAt(0);
  }).join("").toUpperCase();
}

/* =========================================================
   LUNA / TEMA
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

/* =========================================================
   MENU
========================================================= */

function initMenu() {
  const button = document.getElementById("menuToggle");
  const menu = document.getElementById("navMenu");

  if (!button || !menu) return;

  button.addEventListener("click", function () {
    menu.classList.toggle("open");
  });
}

/* =========================================================
   LOGIN
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
    if (message) {
      message.innerText = "Escribe correo y contraseña.";
    }
    return;
  }

  const client = getSupabase();

  if (!client) {
    if (message) {
      message.innerText = "No se pudo conectar con Supabase.";
    }
    return;
  }

  const { error } = await client.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    if (message) {
      message.innerText = "No se pudo iniciar sesión: " + error.message;
    }
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
  const adminPanel = document.getElementById("adminPanel");
  const userText = document.getElementById("adminUserText");

  if (!loginSection || !adminPanel) return;

  const client = getSupabase();

  if (!client) {
    loginSection.style.display = "block";
    adminPanel.style.display = "none";
    return;
  }

  const { data } = await client.auth.getSession();
  const session = data ? data.session : null;

  if (!session || !session.user) {
    loginSection.style.display = "block";
    adminPanel.style.display = "none";
    return;
  }

  const email = session.user.email || "";

  if (email !== ADMIN_EMAIL) {
    await client.auth.signOut();

    loginSection.style.display = "block";
    adminPanel.style.display = "none";

    const message = document.getElementById("adminLoginMessage");
    if (message) {
      message.innerText = "Este correo no tiene permisos de administrador.";
    }

    return;
  }

  loginSection.style.display = "none";
  adminPanel.style.display = "block";

  if (userText) {
    userText.innerText = "Sesión iniciada como: " + email;
  }

  await loadAdminCategories();
  await loadAdminArtists();
  await loadCategoryOptions();
}

/* =========================================================
   ARTISTAS ADMIN
========================================================= */

function resetArtistForm() {
  currentEditingArtistId = null;

  const title = document.getElementById("artistFormTitle");
  const nameInput = document.getElementById("artistNameInput");
  const descriptionInput = document.getElementById("artistDescriptionInput");

  if (title) title.innerText = "Agregar artista";
  if (nameInput) nameInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
}

async function editArtist(id) {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase.");
    return;
  }

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
  const nameInput = document.getElementById("artistNameInput");
  const descriptionInput = document.getElementById("artistDescriptionInput");

  if (title) title.innerText = "Editar artista";
  if (nameInput) nameInput.value = data.name || "";
  if (descriptionInput) descriptionInput.value = data.description || "";

  const form = document.getElementById("artistFormCard");

  if (form) {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function saveArtist() {
  const nameInput = document.getElementById("artistNameInput");
  const descriptionInput = document.getElementById("artistDescriptionInput");

  const name = nameInput ? nameInput.value.trim() : "";
  const description = descriptionInput ? descriptionInput.value.trim() : "";

  if (!name) {
    alert("Escribe el nombre del artista.");
    return;
  }

  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase.");
    return;
  }

  let result;

  if (currentEditingArtistId) {
    result = await client
      .from("artists")
      .update({
        name: name,
        slug: slugify(name),
        description: description,
        avatar_url: "",
        cover_url: ""
      })
      .eq("id", currentEditingArtistId);
  } else {
    result = await client
      .from("artists")
      .insert({
        name: name,
        slug: slugify(name),
        description: description,
        avatar_url: "",
        cover_url: ""
      });
  }

  if (result.error) {
    alert("No se pudo guardar artista: " + result.error.message);
    return;
  }

  const wasEditing = !!currentEditingArtistId;

  resetArtistForm();

  await loadAdminArtists();
  await loadArtistOptions();

  alert(wasEditing ? "Artista actualizado." : "Artista guardado.");
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
    list.innerHTML = "<p>No se pudo conectar con Supabase.</p>";
    return;
  }

  const { data, error } = await client
    .from("artists")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    list.innerHTML = "<p style='color:#ffb4b4;'>Error: " + escapeHTML(error.message) + "</p>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<p style='color:var(--secondary);'>No hay artistas todavía.</p>";
    return;
  }

  list.innerHTML = data.map(function (artist) {
    return `
      <div class="admin-list-item">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="artist-avatar" style="width:44px; height:44px; font-size:16px;">
            ${escapeHTML(getInitials(artist.name || ""))}
          </div>

          <div>
            <strong>${escapeHTML(artist.name || "Sin nombre")}</strong>
            <p style="color:var(--secondary); margin-top:6px;">
              ${escapeHTML(artist.description || "Sin descripción.")}
            </p>
          </div>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
          <button type="button" class="song-btn" onclick="editArtist('${artist.id}')">
            Editar
          </button>

          <button type="button" class="song-btn" onclick="deleteArtist('${artist.id}')">
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join("");
}

async function loadArtistOptions() {
  const select = document.getElementById("songArtistInput");

  if (!select) return;

  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("artists")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) return;

  select.innerHTML = '<option value="">Selecciona artista</option>';

  (data || []).forEach(function (artist) {
    select.innerHTML += `<option value="${artist.id}">${escapeHTML(artist.name || "Sin nombre")}</option>`;
  });
}

/* =========================================================
   CATEGORIAS ADMIN
========================================================= */

function resetCategoryForm() {
  currentEditingCategoryId = null;

  const title = document.getElementById("categoryFormTitle");
  const nameInput = document.getElementById("categoryNameInput");
  const descriptionInput = document.getElementById("categoryDescriptionInput");

  if (title) title.innerText = "Agregar categoría";
  if (nameInput) nameInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
}

async function editCategory(id) {
  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase.");
    return;
  }

  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    alert("No se pudo cargar la categoría.");
    return;
  }

  currentEditingCategoryId = id;

  const title = document.getElementById("categoryFormTitle");
  const nameInput = document.getElementById("categoryNameInput");
  const descriptionInput = document.getElementById("categoryDescriptionInput");

  if (title) title.innerText = "Editar categoría";
  if (nameInput) nameInput.value = data.name || "";
  if (descriptionInput) descriptionInput.value = data.description || "";

  const form = document.getElementById("categoryFormCard");

  if (form) {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function saveCategory() {
  const nameInput = document.getElementById("categoryNameInput");
  const descriptionInput = document.getElementById("categoryDescriptionInput");

  const name = nameInput ? nameInput.value.trim() : "";
  const description = descriptionInput ? descriptionInput.value.trim() : "";

  if (!name) {
    alert("Escribe el nombre de la categoría.");
    return;
  }

  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase.");
    return;
  }

  let result;

  if (currentEditingCategoryId) {
    result = await client
      .from("categories")
      .update({
        name: name,
        slug: slugify(name),
        description: description
      })
      .eq("id", currentEditingCategoryId);
  } else {
    result = await client
      .from("categories")
      .insert({
        name: name,
        slug: slugify(name),
        description: description
      });
  }

  if (result.error) {
    alert("No se pudo guardar categoría: " + result.error.message);
    return;
  }

  const wasEditing = !!currentEditingCategoryId;

  resetCategoryForm();

  await loadAdminCategories();
  await loadCategoryOptions();
  await loadPublicCategories();

  alert(wasEditing ? "Categoría actualizada." : "Categoría guardada.");
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
    list.innerHTML = "<p>No se pudo conectar con Supabase.</p>";
    return;
  }

  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    list.innerHTML = "<p style='color:#ffb4b4;'>Error: " + escapeHTML(error.message) + "</p>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<p style='color:var(--secondary);'>No hay categorías todavía.</p>";
    return;
  }

  list.innerHTML = data.map(function (category) {
    return `
      <div class="admin-list-item">
        <strong>${escapeHTML(category.name || "Sin nombre")}</strong>

        <p style="color:var(--secondary); margin-top:6px;">
          ${escapeHTML(category.description || "Sin descripción.")}
        </p>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
          <button type="button" class="song-btn" onclick="editCategory('${category.id}')">
            Editar
          </button>

          <button type="button" class="song-btn" onclick="deleteCategory('${category.id}')">
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join("");
}

async function loadCategoryOptions() {
  const select = document.getElementById("songCategoryInput");

  if (!select) return;

  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) return;

  select.innerHTML = '<option value="">Selecciona categoría</option>';

  (data || []).forEach(function (category) {
    select.innerHTML += `<option value="${category.id}">${escapeHTML(category.name || "Sin nombre")}</option>`;
  });
}

/* =========================================================
   CATEGORIAS PUBLICAS
========================================================= */

async function loadPublicCategories() {
  const list = document.getElementById("categoryList");

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

  list.innerHTML = data.map(function (category) {
    return `
      <article class="song-card">
        <h3>${escapeHTML(category.name || "Sin nombre")}</h3>
        <p>${escapeHTML(category.description || "Cantos de esta categoría.")}</p>
        <a class="song-btn" href="canciones.html?buscar=${encodeURIComponent(category.name || "")}">
          Ver cantos
        </a>
      </article>
    `;
  }).join("");
}

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {
  initTheme();
  initMenu();

  const themeButton = document.getElementById("themeToggle");

  if (themeButton) {
    themeButton.addEventListener("click", toggleTheme);
  }

  await loadPublicCategories();

  if (document.getElementById("adminPanel")) {
    await checkAdminSession();
  }
});

/* =========================================================
   HTML FUNCTIONS
========================================================= */

window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;

window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.cancelCategoryEdit = resetCategoryForm;

window.saveArtist = saveArtist;
window.editArtist = editArtist;
window.deleteArtist = deleteArtist;
window.cancelArtistEdit = resetArtistForm;

window.loadPublicCategories = loadPublicCategories;
