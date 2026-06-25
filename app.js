/* =========================================================
   JUNTOS HACIA DIOS - APP MINIMA DE RESCATE
   Prueba: luna + login + categorias
========================================================= */

const ADMIN_EMAIL = "mooreprint645@gmail.com";

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
  await loadCategoryOptions();
}

/* =========================================================
   CATEGORIAS ADMIN
========================================================= */

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

  const { error } = await client
    .from("categories")
    .insert({
      name: name,
      slug: slugify(name),
      description: description
    });

  if (error) {
    alert("No se pudo guardar categoría: " + error.message);
    return;
  }

  if (nameInput) nameInput.value = "";
  if (descriptionInput) descriptionInput.value = "";

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
        <button type="button" class="song-btn" onclick="deleteCategory('${category.id}')">
          Eliminar
        </button>
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
window.deleteCategory = deleteCategory;
window.loadPublicCategories = loadPublicCategories;
