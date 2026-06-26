/* =========================================================
   JUNTOS HACIA DIOS - APP LIMPIA 1.1
   Categorías + artistas + álbumes + canciones
   Colaboraciones + links múltiples + transposición
========================================================= */

const ADMIN_EMAIL = "mooreprint645@gmail.com";

let currentEditingArtistId = null;
let currentEditingCategoryId = null;
let currentEditingAlbumId = null;
let currentEditingSongId = null;

let currentSongForPage = null;
let currentTransposeSteps = 0;

/* =========================================================
   HELPERS GENERALES
========================================================= */

function $(id) {
  return document.getElementById(id);
}

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

function getInputValue(id) {
  const input = $(id);

  return input ? input.value.trim() : "";
}

function setInputValue(id, value) {
  const input = $(id);

  if (input) {
    input.value = value || "";
  }
}

function showMessage(id, text) {
  const element = $(id);

  if (element) {
    element.innerText = text || "";
  }
}

function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);

  return params.get(name) || "";
}

function getSelectedValues(selectId) {
  const select = $(selectId);

  if (!select) return [];

  return Array.from(select.selectedOptions || [])
    .map(function (option) {
      return option.value;
    })
    .filter(Boolean);
}

function setSelectedValues(selectId, values) {
  const select = $(selectId);

  if (!select) return;

  const selectedValues = new Set(values || []);

  Array.from(select.options || []).forEach(function (option) {
    option.selected = selectedValues.has(option.value);
  });
}

function setOptions(selectId, items, placeholder, valueKey, labelKey) {
  const select = $(selectId);

  if (!select) return;

  const valueField = valueKey || "id";
  const labelField = labelKey || "name";

  select.innerHTML = `<option value="">${escapeHTML(placeholder || "Selecciona")}</option>`;

  (items || []).forEach(function (item) {
    const value = item[valueField] || "";
    const label = item[labelField] || "Sin nombre";

    select.innerHTML += `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`;
  });
}

function setMultiOptions(selectId, items, labelKey) {
  const select = $(selectId);

  if (!select) return;

  const labelField = labelKey || "name";

  select.innerHTML = "";

  (items || []).forEach(function (item) {
    const value = item.id || "";
    const label = item[labelField] || "Sin nombre";

    select.innerHTML += `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`;
  });
}

function artistLinksHTML(artists) {
  const safeArtists = artists || [];

  if (!safeArtists.length) {
    return `<span>Sin artista</span>`;
  }

  return safeArtists.map(function (artist) {
    const slug = artist.slug || slugify(artist.name || "");

    return `<a href="artista.html?slug=${encodeURIComponent(slug)}">${escapeHTML(artist.name || "Sin artista")}</a>`;
  }).join(`<span class="artist-dot"> · </span>`);
}

/* =========================================================
   LINKS MÚLTIPLES DE CANCIONES
   Formato en admin:
   Título | Tipo | Plataforma | URL
========================================================= */

function parseSongLinksText(text) {
  const lines = String(text || "")
    .split("\n")
    .map(function (line) {
      return line.trim();
    })
    .filter(Boolean);

  return lines.map(function (line, index) {
    const parts = line.split("|").map(function (part) {
      return part.trim();
    });

    if (parts.length >= 4) {
      return {
        title: parts[0],
        link_type: parts[1] || "tutorial",
        platform: parts[2] || "",
        url: parts.slice(3).join("|").trim(),
        sort_order: index
      };
    }

    if (parts.length === 3) {
      return {
        title: parts[0],
        link_type: parts[1] || "tutorial",
        platform: "",
        url: parts[2],
        sort_order: index
      };
    }

    if (parts.length === 2) {
      return {
        title: parts[0],
        link_type: "tutorial",
        platform: "",
        url: parts[1],
        sort_order: index
      };
    }

    return {
      title: "Link " + (index + 1),
      link_type: "tutorial",
      platform: "",
      url: parts[0],
      sort_order: index
    };
  }).filter(function (link) {
    return link.title && link.url;
  });
}

function linksToText(links) {
  return (links || []).map(function (link) {
    return [
      link.title || "Link",
      link.link_type || "tutorial",
      link.platform || "",
      link.url || ""
    ].join(" | ");
  }).join("\n");
}

function linkIcon(link) {
  const text = `${link.platform || ""} ${link.link_type || ""} ${link.title || ""}`.toLowerCase();

  if (text.includes("guitarra")) return "🎸";
  if (text.includes("piano")) return "🎹";
  if (text.includes("youtube")) return "▶️";
  if (text.includes("tiktok")) return "🎵";
  if (text.includes("instagram")) return "📷";
  if (text.includes("canal")) return "📺";

  return "🔗";
}

function renderSongLinksHTML(links) {
  const safeLinks = links || [];

  if (!safeLinks.length) return "";

  return `
    <section class="song-links-box">
      <h2>Tutoriales y enlaces</h2>

      <div class="song-links-list">
        ${safeLinks.map(function (link) {
          return `
            <a class="song-link-item" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">
              <span>${linkIcon(link)}</span>
              <div>
                <strong>${escapeHTML(link.title || "Link")}</strong>
                <small>${escapeHTML([link.platform, link.link_type].filter(Boolean).join(" · "))}</small>
              </div>
            </a>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

/* =========================================================
   TRANSPOSICIÓN DE ACORDES
========================================================= */

const CHORD_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const FLAT_TO_SHARP = {
  "Db": "C#",
  "Eb": "D#",
  "Gb": "F#",
  "Ab": "G#",
  "Bb": "A#"
};

function normalizeNote(note) {
  return FLAT_TO_SHARP[note] || note;
}

function transposeNote(note, steps) {
  const normalized = normalizeNote(note);
  const index = CHORD_NOTES.indexOf(normalized);

  if (index === -1) return note;

  const nextIndex = (index + steps + CHORD_NOTES.length * 10) % CHORD_NOTES.length;

  return CHORD_NOTES[nextIndex];
}

function transposeSingleChord(chord, steps) {
  const match = String(chord || "").match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) return chord;

  const root = match[1];
  let rest = match[2] || "";

  const transposedRoot = transposeNote(root, steps);

  rest = rest.replace(/\/([A-G](?:#|b)?)/g, function (_, bassNote) {
    return "/" + transposeNote(bassNote, steps);
  });

  return transposedRoot + rest;
}

function transposeChordGroup(chordGroup, steps) {
  return String(chordGroup || "").replace(/[A-G](?:#|b)?[a-zA-Z0-9#b°+\-susmajdimaug/()]*/g, function (chord) {
    return transposeSingleChord(chord, steps);
  });
}

function renderChordedLyrics(lyrics, transposeSteps) {
  const escaped = escapeHTML(lyrics || "");
  const steps = Number(transposeSteps || 0);

  return escaped.replace(/\(([^)]+)\)/g, function (_, chordGroup) {
    const transposed = transposeChordGroup(chordGroup, steps);

    return `<span class="chord-token">${escapeHTML(transposed)}</span>`;
  });
}

function changeTranspose(amount) {
  currentTransposeSteps += amount;
  updateSongLyricsDisplay();
}

function resetTranspose() {
  currentTransposeSteps = 0;
  updateSongLyricsDisplay();
}

function updateSongLyricsDisplay() {
  const lyricsBox = $("lyricsContent");
  const label = $("transposeLabel");

  if (!lyricsBox || !currentSongForPage) return;

  lyricsBox.innerHTML = renderChordedLyrics(currentSongForPage.lyrics || "", currentTransposeSteps);

  if (label) {
    if (currentTransposeSteps === 0) {
      label.innerText = "Tono original";
    } else if (currentTransposeSteps > 0) {
      label.innerText = "+" + currentTransposeSteps;
    } else {
      label.innerText = String(currentTransposeSteps);
    }
  }
}

/* =========================================================
   AYUDAS DEL EDITOR
========================================================= */

function insertAtCursor(textareaId, text) {
  const textarea = $(textareaId);

  if (!textarea) return;

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);

  textarea.value = before + text + after;

  const newPosition = start + text.length;

  textarea.focus();
  textarea.setSelectionRange(newPosition, newPosition);
}

function insertSongSection(sectionName) {
  const cleanName = String(sectionName || "").trim();

  if (!cleanName) return;

  insertAtCursor("songLyricsInput", "\n[" + cleanName + "]\n");
    }
/* =========================================================
   TEMA / MENÚ
========================================================= */

function initTheme() {
  const savedTheme = localStorage.getItem("jhd-theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  }

  updateThemeButton();
}

function updateThemeButton() {
  const button = $("themeToggle");

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
  const button = $("menuToggle");
  const menu = $("navMenu");

  if (!button || !menu) return;

  button.addEventListener("click", function () {
    menu.classList.toggle("open");
  });
}

/* =========================================================
   LOGIN ADMIN
========================================================= */

async function loginAdmin() {
  const email = getInputValue("adminEmailInput");
  const passwordInput = $("adminPasswordInput");
  const password = passwordInput ? passwordInput.value : "";

  showMessage("adminLoginMessage", "Iniciando sesión...");

  if (!email || !password) {
    showMessage("adminLoginMessage", "Escribe correo y contraseña.");
    return;
  }

  const client = getSupabase();

  if (!client) {
    showMessage("adminLoginMessage", "No se pudo conectar con Supabase.");
    return;
  }

  const { error } = await client.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    showMessage("adminLoginMessage", "No se pudo iniciar sesión: " + error.message);
    return;
  }

  showMessage("adminLoginMessage", "Sesión iniciada.");

  await checkAdminSession();
}

async function logoutAdmin() {
  const client = getSupabase();

  if (client) {
    await client.auth.signOut();
  }

  currentEditingArtistId = null;
  currentEditingCategoryId = null;
  currentEditingAlbumId = null;
  currentEditingSongId = null;

  await checkAdminSession();
}

async function checkAdminSession() {
  const loginSection = $("adminLoginSection");
  const adminPanel = $("adminPanel");
  const userText = $("adminUserText");

  if (!loginSection || !adminPanel) return;

  const client = getSupabase();

  if (!client) {
    loginSection.style.display = "block";
    adminPanel.style.display = "none";
    showMessage("adminLoginMessage", "No se pudo conectar con Supabase.");
    return;
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    loginSection.style.display = "block";
    adminPanel.style.display = "none";
    showMessage("adminLoginMessage", "Error leyendo la sesión.");
    return;
  }

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

    showMessage("adminLoginMessage", "Este correo no tiene permisos de administrador.");
    return;
  }

  loginSection.style.display = "none";
  adminPanel.style.display = "block";

  if (userText) {
    userText.innerText = "Sesión iniciada como: " + email;
  }

  await loadAdminData();
}

async function loadAdminData() {
  await Promise.all([
    loadAdminArtists(),
    loadAdminCategories(),
    loadAdminAlbums(),
    loadAdminSongs(),
    loadArtistOptions(),
    loadCategoryOptions(),
    loadAlbumOptions()
  ]);
}

/* =========================================================
   DATA HELPERS
========================================================= */

async function fetchArtists() {
  const client = getSupabase();

  if (!client) {
    return {
      data: [],
      error: { message: "Sin conexión a Supabase" }
    };
  }

  return await client
    .from("artists")
    .select("*")
    .order("name", { ascending: true });
}

async function fetchCategories() {
  const client = getSupabase();

  if (!client) {
    return {
      data: [],
      error: { message: "Sin conexión a Supabase" }
    };
  }

  return await client
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
}

async function fetchAlbums() {
  const client = getSupabase();

  if (!client) {
    return {
      data: [],
      error: { message: "Sin conexión a Supabase" }
    };
  }

  const { data: albums, error } = await client
    .from("albums")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    return {
      data: [],
      error: error
    };
  }

  const { data: artists } = await fetchArtists();

  const artistMap = new Map(
    (artists || []).map(function (artist) {
      return [artist.id, artist];
    })
  );

  const merged = (albums || []).map(function (album) {
    return Object.assign({}, album, {
      artist: artistMap.get(album.artist_id) || null
    });
  });

  return {
    data: merged,
    error: null
  };
}

async function fetchSongsBase(ids) {
  const client = getSupabase();

  if (!client) {
    return {
      data: [],
      error: { message: "Sin conexión a Supabase" }
    };
  }

  let query = client
    .from("songs")
    .select("*")
    .order("title", { ascending: true });

  if (ids && ids.length) {
    query = query.in("id", ids);
  }

  return await query;
}

async function fetchSongLinksBySongIds(songIds) {
  const client = getSupabase();

  if (!client || !songIds || !songIds.length) {
    return {
      data: [],
      error: null
    };
  }

  return await client
    .from("song_links")
    .select("*")
    .in("song_id", songIds)
    .order("sort_order", { ascending: true });
}

async function fetchSongsWithRelations(ids) {
  const client = getSupabase();

  if (!client) {
    return {
      data: [],
      error: { message: "Sin conexión a Supabase" }
    };
  }

  const { data: songs, error } = await fetchSongsBase(ids);

  if (error) {
    return {
      data: [],
      error: error
    };
  }

  const safeSongs = songs || [];

  const songIds = safeSongs
    .map(function (song) {
      return song.id;
    })
    .filter(Boolean);

  if (!songIds.length) {
    return {
      data: [],
      error: null
    };
  }

  const artistRes = await client
    .from("song_artists")
    .select("song_id, role, sort_order, artists(id, name, slug, description)")
    .in("song_id", songIds)
    .order("sort_order", { ascending: true });

  const categoryRes = await client
    .from("song_categories")
    .select("song_id, categories(id, name, slug, description)")
    .in("song_id", songIds);

  const albumRes = await client
    .from("album_songs")
    .select("song_id, albums(id, title, slug, description, artist_id)")
    .in("song_id", songIds);

  const linksRes = await fetchSongLinksBySongIds(songIds);

  const artistsBySong = new Map();
  const categoriesBySong = new Map();
  const albumsBySong = new Map();
  const linksBySong = new Map();

  (artistRes.data || []).forEach(function (row) {
    if (!artistsBySong.has(row.song_id)) {
      artistsBySong.set(row.song_id, []);
    }

    if (row.artists) {
      artistsBySong.get(row.song_id).push(row.artists);
    }
  });

  (categoryRes.data || []).forEach(function (row) {
    if (!categoriesBySong.has(row.song_id)) {
      categoriesBySong.set(row.song_id, []);
    }

    if (row.categories) {
      categoriesBySong.get(row.song_id).push(row.categories);
    }
  });

  (albumRes.data || []).forEach(function (row) {
    if (!albumsBySong.has(row.song_id)) {
      albumsBySong.set(row.song_id, []);
    }

    if (row.albums) {
      albumsBySong.get(row.song_id).push(row.albums);
    }
  });

  (linksRes.data || []).forEach(function (row) {
    if (!linksBySong.has(row.song_id)) {
      linksBySong.set(row.song_id, []);
    }

    linksBySong.get(row.song_id).push(row);
  });

  const merged = safeSongs.map(function (song) {
    return Object.assign({}, song, {
      _artists: artistsBySong.get(song.id) || [],
      _categories: categoriesBySong.get(song.id) || [],
      _albums: albumsBySong.get(song.id) || [],
      _links: linksBySong.get(song.id) || []
    });
  });

  return {
    data: merged,
    error: null
  };
}
/* =========================================================
   ARTISTAS ADMIN
========================================================= */

function resetArtistForm() {
  currentEditingArtistId = null;

  const title = $("artistFormTitle");

  if (title) {
    title.innerText = "Agregar artista";
  }

  setInputValue("artistNameInput", "");
  setInputValue("artistDescriptionInput", "");
}

async function saveArtist() {
  const name = getInputValue("artistNameInput");
  const description = getInputValue("artistDescriptionInput");

  if (!name) {
    alert("Escribe el nombre del artista.");
    return;
  }

  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase.");
    return;
  }

  const payload = {
    name: name,
    slug: slugify(name),
    description: description,
    avatar_url: "",
    cover_url: ""
  };

  const result = currentEditingArtistId
    ? await client.from("artists").update(payload).eq("id", currentEditingArtistId)
    : await client.from("artists").insert(payload);

  if (result.error) {
    alert("No se pudo guardar artista: " + result.error.message);
    return;
  }

  const wasEditing = !!currentEditingArtistId;

  resetArtistForm();

  await Promise.all([
    loadAdminArtists(),
    loadArtistOptions(),
    loadPublicArtists()
  ]);

  alert(wasEditing ? "Artista actualizado." : "Artista guardado.");
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

  const title = $("artistFormTitle");

  if (title) {
    title.innerText = "Editar artista";
  }

  setInputValue("artistNameInput", data.name || "");
  setInputValue("artistDescriptionInput", data.description || "");

  const form = $("artistFormCard");

  if (form) {
    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
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

  await Promise.all([
    loadAdminArtists(),
    loadArtistOptions(),
    loadAdminAlbums(),
    loadAlbumOptions(),
    loadPublicArtists()
  ]);
}

async function loadAdminArtists() {
  const list = $("adminArtistList");

  if (!list) return;

  const { data, error } = await fetchArtists();

  if (error) {
    list.innerHTML = `<p style="color:#ffb4b4;">Error: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = `<p style="color:var(--secondary);">No hay artistas todavía.</p>`;
    return;
  }

  list.innerHTML = data.map(function (artist) {
    return `
      <div class="admin-list-item">
        <div class="admin-person-row">
          <div class="artist-avatar-small">
            ${escapeHTML(getInitials(artist.name))}
          </div>

          <div>
            <strong>${escapeHTML(artist.name || "Sin nombre")}</strong>
            <p>${escapeHTML(artist.description || "Sin descripción.")}</p>
          </div>
        </div>

        <div class="admin-actions">
          <button type="button" class="song-btn" onclick="editArtist('${artist.id}')">
            Editar
          </button>

          <button type="button" class="song-btn danger" onclick="deleteArtist('${artist.id}')">
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join("");
}

async function loadArtistOptions() {
  const { data } = await fetchArtists();

  setOptions("albumArtistInput", data || [], "Selecciona artista", "id", "name");
  setMultiOptions("songArtistsInput", data || [], "name");
}

/* =========================================================
   CATEGORÍAS ADMIN
========================================================= */

function resetCategoryForm() {
  currentEditingCategoryId = null;

  const title = $("categoryFormTitle");

  if (title) {
    title.innerText = "Agregar categoría";
  }

  setInputValue("categoryNameInput", "");
  setInputValue("categoryDescriptionInput", "");
}

async function saveCategory() {
  const name = getInputValue("categoryNameInput");
  const description = getInputValue("categoryDescriptionInput");

  if (!name) {
    alert("Escribe el nombre de la categoría.");
    return;
  }

  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase.");
    return;
  }

  const payload = {
    name: name,
    slug: slugify(name),
    description: description
  };

  const result = currentEditingCategoryId
    ? await client.from("categories").update(payload).eq("id", currentEditingCategoryId)
    : await client.from("categories").insert(payload);

  if (result.error) {
    alert("No se pudo guardar categoría: " + result.error.message);
    return;
  }

  const wasEditing = !!currentEditingCategoryId;

  resetCategoryForm();

  await Promise.all([
    loadAdminCategories(),
    loadCategoryOptions(),
    loadPublicCategories()
  ]);

  alert(wasEditing ? "Categoría actualizada." : "Categoría guardada.");
}

async function editCategory(id) {
  const client = getSupabase();

  if (!client) return;

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

  const title = $("categoryFormTitle");

  if (title) {
    title.innerText = "Editar categoría";
  }

  setInputValue("categoryNameInput", data.name || "");
  setInputValue("categoryDescriptionInput", data.description || "");

  const form = $("categoryFormCard");

  if (form) {
    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
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

  await Promise.all([
    loadAdminCategories(),
    loadCategoryOptions(),
    loadPublicCategories()
  ]);
}

async function loadAdminCategories() {
  const list = $("adminCategoryList");

  if (!list) return;

  const { data, error } = await fetchCategories();

  if (error) {
    list.innerHTML = `<p style="color:#ffb4b4;">Error: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = `<p style="color:var(--secondary);">No hay categorías todavía.</p>`;
    return;
  }

  list.innerHTML = data.map(function (category) {
    return `
      <div class="admin-list-item">
        <strong>${escapeHTML(category.name || "Sin nombre")}</strong>

        <p>${escapeHTML(category.description || "Sin descripción.")}</p>

        <div class="admin-actions">
          <button type="button" class="song-btn" onclick="editCategory('${category.id}')">
            Editar
          </button>

          <button type="button" class="song-btn danger" onclick="deleteCategory('${category.id}')">
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join("");
}

async function loadCategoryOptions() {
  const { data } = await fetchCategories();

  setOptions("songCategoryInput", data || [], "Selecciona categoría", "id", "name");
}

/* =========================================================
   ÁLBUMES ADMIN
========================================================= */

function resetAlbumForm() {
  currentEditingAlbumId = null;

  const title = $("albumFormTitle");

  if (title) {
    title.innerText = "Agregar álbum / carpeta";
  }

  setInputValue("albumTitleInput", "");
  setInputValue("albumDescriptionInput", "");
  setInputValue("albumArtistInput", "");
}

async function saveAlbum() {
  const artistId = getInputValue("albumArtistInput");
  const title = getInputValue("albumTitleInput");
  const description = getInputValue("albumDescriptionInput");

  if (!artistId || !title) {
    alert("Selecciona artista y escribe el nombre del álbum.");
    return;
  }

  const client = getSupabase();

  if (!client) return;

  const payload = {
    artist_id: artistId,
    title: title,
    slug: slugify(title),
    description: description
  };

  const result = currentEditingAlbumId
    ? await client.from("albums").update(payload).eq("id", currentEditingAlbumId)
    : await client.from("albums").insert(payload);

  if (result.error) {
    alert("No se pudo guardar álbum: " + result.error.message);
    return;
  }

  const wasEditing = !!currentEditingAlbumId;

  resetAlbumForm();

  await Promise.all([
    loadAdminAlbums(),
    loadAlbumOptions()
  ]);

  alert(wasEditing ? "Álbum actualizado." : "Álbum guardado.");
}

async function editAlbum(id) {
  const client = getSupabase();

  if (!client) return;

  const { data, error } = await client
    .from("albums")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    alert("No se pudo cargar el álbum.");
    return;
  }

  currentEditingAlbumId = id;

  const title = $("albumFormTitle");

  if (title) {
    title.innerText = "Editar álbum / carpeta";
  }

  setInputValue("albumArtistInput", data.artist_id || "");
  setInputValue("albumTitleInput", data.title || "");
  setInputValue("albumDescriptionInput", data.description || "");

  const form = $("albumFormCard");

  if (form) {
    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

async function deleteAlbum(id) {
  if (!confirm("¿Eliminar este álbum/carpeta? Las canciones no se borran.")) return;

  const client = getSupabase();

  if (!client) return;

  const { error } = await client
    .from("albums")
    .delete()
    .eq("id", id);

  if (error) {
    alert("No se pudo eliminar: " + error.message);
    return;
  }

  await Promise.all([
    loadAdminAlbums(),
    loadAlbumOptions()
  ]);
}

async function loadAdminAlbums() {
  const list = $("adminAlbumList");

  if (!list) return;

  const { data, error } = await fetchAlbums();

  if (error) {
    list.innerHTML = `<p style="color:#ffb4b4;">Error: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = `<p style="color:var(--secondary);">No hay álbumes todavía.</p>`;
    return;
  }

  list.innerHTML = data.map(function (album) {
    return `
      <div class="admin-list-item">
        <strong>📁 ${escapeHTML(album.title || "Sin título")}</strong>

        <p>${escapeHTML(album.artist ? album.artist.name : "Sin artista")}</p>

        <p>${escapeHTML(album.description || "Sin descripción.")}</p>

        <div class="admin-actions">
          <button type="button" class="song-btn" onclick="editAlbum('${album.id}')">
            Editar
          </button>

          <button type="button" class="song-btn danger" onclick="deleteAlbum('${album.id}')">
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join("");
}

async function loadAlbumOptions() {
  const { data } = await fetchAlbums();

  const select = $("songAlbumInput");

  if (!select) return;

  select.innerHTML = `<option value="">Sin álbum / carpeta</option>`;

  (data || []).forEach(function (album) {
    const artistName = album.artist ? album.artist.name : "Sin artista";

    select.innerHTML += `
      <option value="${escapeHTML(album.id)}">
        ${escapeHTML(artistName)} — ${escapeHTML(album.title || "Sin título")}
      </option>
    `;
  });
}
/* =========================================================
   CANCIONES ADMIN
========================================================= */

function resetSongForm() {
  currentEditingSongId = null;

  const title = $("songFormTitle");

  if (title) {
    title.innerText = "Agregar canción";
  }

  [
    "songTitleInput",
    "songToneInput",
    "songDifficultyInput",
    "songLyricsInput",
    "songLinksInput"
  ].forEach(function (id) {
    setInputValue(id, "");
  });

  setInputValue("songTypeInput", "catolico");
  setInputValue("songCategoryInput", "");
  setInputValue("songAlbumInput", "");
  setSelectedValues("songArtistsInput", []);
}

async function saveSong() {
  const title = getInputValue("songTitleInput");
  const songType = getInputValue("songTypeInput") || "catolico";
  const tone = getInputValue("songToneInput");
  const difficulty = getInputValue("songDifficultyInput");
  const lyrics = getInputValue("songLyricsInput");
  const categoryId = getInputValue("songCategoryInput");
  const albumId = getInputValue("songAlbumInput");
  const artistIds = getSelectedValues("songArtistsInput");
  const linksText = getInputValue("songLinksInput");
  const links = parseSongLinksText(linksText);

  if (!title) {
    alert("Escribe el título de la canción.");
    return;
  }

  if (!artistIds.length) {
    alert("Selecciona al menos un artista.");
    return;
  }

  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase.");
    return;
  }

  const payload = {
    title: title,
    slug: slugify(title),
    song_type: songType,
    tone: tone,
    difficulty: difficulty,
    lyrics: lyrics,
    artist_id: artistIds[0]
  };

  let savedSongId = currentEditingSongId;
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

  savedSongId = result.data ? result.data.id : savedSongId;

  /* Artistas de la canción */
  await client
    .from("song_artists")
    .delete()
    .eq("song_id", savedSongId);

  const artistRows = artistIds.map(function (artistId, index) {
    return {
      song_id: savedSongId,
      artist_id: artistId,
      role: index === 0 ? "principal" : "colaborador",
      sort_order: index
    };
  });

  if (artistRows.length) {
    const artistResult = await client
      .from("song_artists")
      .insert(artistRows);

    if (artistResult.error) {
      alert("La canción se guardó, pero falló la relación con artistas: " + artistResult.error.message);
      return;
    }
  }

  /* Categoría */
  await client
    .from("song_categories")
    .delete()
    .eq("song_id", savedSongId);

  if (categoryId) {
    const categoryResult = await client
      .from("song_categories")
      .insert({
        song_id: savedSongId,
        category_id: categoryId
      });

    if (categoryResult.error) {
      alert("La canción se guardó, pero falló la categoría: " + categoryResult.error.message);
      return;
    }
  }

  /* Álbum / carpeta */
  await client
    .from("album_songs")
    .delete()
    .eq("song_id", savedSongId);

  if (albumId) {
    const albumResult = await client
      .from("album_songs")
      .insert({
        song_id: savedSongId,
        album_id: albumId
      });

    if (albumResult.error) {
      alert("La canción se guardó, pero falló el álbum: " + albumResult.error.message);
      return;
    }
  }

  /* Links múltiples */
  await client
    .from("song_links")
    .delete()
    .eq("song_id", savedSongId);

  if (links.length) {
    const linkRows = links.map(function (link, index) {
      return {
        song_id: savedSongId,
        title: link.title,
        link_type: link.link_type || "tutorial",
        platform: link.platform || "",
        url: link.url,
        sort_order: index
      };
    });

    const linksResult = await client
      .from("song_links")
      .insert(linkRows);

    if (linksResult.error) {
      alert("La canción se guardó, pero fallaron los links: " + linksResult.error.message);
      return;
    }
  }

  const wasEditing = !!currentEditingSongId;

  resetSongForm();

  await Promise.all([
    loadAdminSongs(),
    loadPublicSongs()
  ]);

  alert(wasEditing ? "Canción actualizada." : "Canción guardada.");
}

async function editSong(id) {
  const { data: songs, error } = await fetchSongsWithRelations([id]);

  if (error || !songs || !songs.length) {
    alert("No se pudo cargar la canción.");
    return;
  }

  const song = songs[0];

  currentEditingSongId = song.id;

  const title = $("songFormTitle");

  if (title) {
    title.innerText = "Editar canción";
  }

  setInputValue("songTitleInput", song.title || "");
  setInputValue("songTypeInput", song.song_type || "catolico");
  setInputValue("songToneInput", song.tone || "");
  setInputValue("songDifficultyInput", song.difficulty || "");
  setInputValue("songLyricsInput", song.lyrics || "");
  setInputValue("songLinksInput", linksToText(song._links || []));

  setSelectedValues(
    "songArtistsInput",
    (song._artists || []).map(function (artist) {
      return artist.id;
    })
  );

  setInputValue(
    "songCategoryInput",
    song._categories && song._categories[0] ? song._categories[0].id : ""
  );

  setInputValue(
    "songAlbumInput",
    song._albums && song._albums[0] ? song._albums[0].id : ""
  );

  const form = $("songFormCard");

  if (form) {
    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

async function deleteSong(id) {
  if (!confirm("¿Eliminar esta canción?")) return;

  const client = getSupabase();

  if (!client) return;

  const { error } = await client
    .from("songs")
    .delete()
    .eq("id", id);

  if (error) {
    alert("No se pudo eliminar: " + error.message);
    return;
  }

  await Promise.all([
    loadAdminSongs(),
    loadPublicSongs()
  ]);
}

async function loadAdminSongs() {
  const list = $("adminSongList");

  if (!list) return;

  const { data, error } = await fetchSongsWithRelations();

  if (error) {
    list.innerHTML = `<p style="color:#ffb4b4;">Error: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = `<p style="color:var(--secondary);">No hay canciones todavía.</p>`;
    return;
  }

  list.innerHTML = data.map(function (song) {
    const linkCount = (song._links || []).length;

    return `
      <div class="admin-list-item">
        <strong>${escapeHTML(song.title || "Sin título")}</strong>

        <p class="artists-line">
          ${artistLinksHTML(song._artists)}
        </p>

        <p>
          ${escapeHTML(song.song_type || "")}
          ${song.tone ? " · " + escapeHTML(song.tone) : ""}
          ${linkCount ? " · " + linkCount + " link(s)" : ""}
        </p>

        <div class="admin-actions">
          <button type="button" class="song-btn" onclick="editSong('${song.id}')">
            Editar
          </button>

          <button type="button" class="song-btn danger" onclick="deleteSong('${song.id}')">
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join("");
}

/* =========================================================
   PÚBLICO: ARTISTAS
========================================================= */

async function loadPublicArtists() {
  const list = $("artistList") || $("artistsList") || $("publicArtistList");

  if (!list) return;

  const { data, error } = await fetchArtists();

  if (error) {
    list.innerHTML = `
      <div class="song-card">
        <h3>Error cargando artistas</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = `
      <div class="song-card">
        <h3>No hay artistas todavía</h3>
      </div>
    `;
    return;
  }

  list.dataset.allArtists = JSON.stringify(data);

  renderPublicArtists(data);
}

function renderPublicArtists(artists) {
  const list = $("artistList") || $("artistsList") || $("publicArtistList");

  if (!list) return;

  list.innerHTML = (artists || []).map(function (artist) {
    return `
      <article class="song-card artist-card">
        <div class="artist-public-row">
          <div class="artist-avatar-public">
            ${escapeHTML(getInitials(artist.name))}
          </div>

          <div>
            <h3>${escapeHTML(artist.name || "Sin nombre")}</h3>
            <p>${escapeHTML(artist.description || "Ministerio o artista registrado.")}</p>
          </div>
        </div>

        <a class="song-btn" href="artista.html?slug=${encodeURIComponent(artist.slug || slugify(artist.name))}">
          Ver artista
        </a>
      </article>
    `;
  }).join("");
}

function initArtistSearch() {
  const input =
    $("artistSearchInput") ||
    $("artistSearch") ||
    document.querySelector('input[placeholder*="artista"]');

  const list = $("artistList") || $("artistsList") || $("publicArtistList");

  if (!input || !list) return;

  input.addEventListener("input", function () {
    let artists = [];

    try {
      artists = JSON.parse(list.dataset.allArtists || "[]");
    } catch (error) {
      artists = [];
    }

    const search = input.value.trim().toLowerCase();

    const filtered = search
      ? artists.filter(function (artist) {
          return `${artist.name || ""} ${artist.description || ""}`
            .toLowerCase()
            .includes(search);
        })
      : artists;

    if (!filtered.length) {
      list.innerHTML = `
        <div class="song-card">
          <h3>No se encontraron artistas</h3>
        </div>
      `;
      return;
    }

    renderPublicArtists(filtered);
  });
}

/* =========================================================
   PÚBLICO: CATEGORÍAS
========================================================= */

async function loadPublicCategories() {
  const list = $("categoryList");

  if (!list) return;

  const { data, error } = await fetchCategories();

  if (error) {
    list.innerHTML = `
      <div class="song-card">
        <h3>Error cargando categorías</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = `
      <div class="song-card">
        <h3>No hay categorías todavía</h3>
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
   PÚBLICO: CANCIONES
========================================================= */

async function loadPublicSongs() {
  const list = $("songList") || $("songsList") || $("publicSongList");

  if (!list) return;

  const { data, error } = await fetchSongsWithRelations();

  if (error) {
    list.innerHTML = `
      <div class="song-card">
        <h3>Error cargando canciones</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
    return;
  }

  let songs = data || [];

  const type = getUrlParam("tipo");
  const searchParam = getUrlParam("buscar").toLowerCase();

  if (type) {
    songs = songs.filter(function (song) {
      return String(song.song_type || "").toLowerCase() === type.toLowerCase();
    });
  }

  if (searchParam) {
    songs = songs.filter(function (song) {
      const haystack = [
        song.title || "",
        song.lyrics || "",
        (song._artists || []).map(function (artist) {
          return artist.name;
        }).join(" "),
        (song._categories || []).map(function (category) {
          return category.name;
        }).join(" ")
      ].join(" ").toLowerCase();

      return haystack.includes(searchParam);
    });
  }

  list.dataset.allSongs = JSON.stringify(data || []);

  renderPublicSongs(songs);
}

function renderPublicSongs(songs) {
  const list = $("songList") || $("songsList") || $("publicSongList");

  if (!list) return;

  if (!songs || !songs.length) {
    list.innerHTML = `
      <div class="song-card">
        <h3>No se encontraron canciones</h3>
      </div>
    `;
    return;
  }

  list.innerHTML = songs.map(function (song) {
    return `
      <article class="song-card">
        <h3>${escapeHTML(song.title || "Sin título")}</h3>

        <p class="artists-line">
          ${artistLinksHTML(song._artists)}
        </p>

        <p>
          ${escapeHTML(song.tone || "")}
          ${song.difficulty ? " · " + escapeHTML(song.difficulty) : ""}
        </p>

        <a class="song-btn" href="canto.html?slug=${encodeURIComponent(song.slug || slugify(song.title))}">
          Abrir canto
        </a>
      </article>
    `;
  }).join("");
}

function initSongSearch() {
  const input = $("songSearchInput") || $("searchInput");
  const list = $("songList") || $("songsList") || $("publicSongList");

  if (!input || !list) return;

  input.addEventListener("input", function () {
    let songs = [];

    try {
      songs = JSON.parse(list.dataset.allSongs || "[]");
    } catch (error) {
      songs = [];
    }

    const search = input.value.trim().toLowerCase();

    const filtered = search
      ? songs.filter(function (song) {
          const text = [
            song.title || "",
            song.lyrics || "",
            (song._artists || []).map(function (artist) {
              return artist.name;
            }).join(" ")
          ].join(" ").toLowerCase();

          return text.includes(search);
        })
      : songs;

    renderPublicSongs(filtered);
  });
}
/* =========================================================
   PÚBLICO: PERFIL DE ARTISTA
========================================================= */

async function loadArtistProfile() {
  const box = $("artistProfile") || $("artistProfileContent") || $("artistDetail");

  if (!box) return;

  const slug = getUrlParam("slug");
  const client = getSupabase();

  if (!client || !slug) {
    box.innerHTML = `
      <div class="song-card">
        <h3>Artista no encontrado</h3>
      </div>
    `;
    return;
  }

  const { data: artist, error } = await client
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !artist) {
    box.innerHTML = `
      <div class="song-card">
        <h3>Artista no encontrado</h3>
      </div>
    `;
    return;
  }

  const { data: relations } = await client
    .from("song_artists")
    .select("song_id")
    .eq("artist_id", artist.id);

  const songIds = (relations || []).map(function (row) {
    return row.song_id;
  });

  const { data: songs } = await fetchSongsWithRelations(songIds);

  const safeSongs = songs || [];

  const { data: albums } = await client
    .from("albums")
    .select("*")
    .eq("artist_id", artist.id)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  const albumSections = (albums || []).map(function (album) {
    const albumSongs = safeSongs.filter(function (song) {
      return (song._albums || []).some(function (songAlbum) {
        return songAlbum.id === album.id;
      });
    });

    if (!albumSongs.length) return "";

    return `
      <section class="artist-folder">
        <h3>📁 ${escapeHTML(album.title || "Álbum")}</h3>

        <div class="song-list compact-list">
          ${albumSongs.map(renderMiniSongCard).join("")}
        </div>
      </section>
    `;
  }).join("");

  const collaborationSongs = safeSongs.filter(function (song) {
    return (song._artists || []).length > 1;
  });

  const songsWithoutArtistAlbum = safeSongs.filter(function (song) {
    const hasAlbumFromThisArtist = (song._albums || []).some(function (album) {
      return album.artist_id === artist.id;
    });

    return !hasAlbumFromThisArtist;
  });

  box.innerHTML = `
    <section class="artist-hero-card">
      <div class="artist-avatar-public big">
        ${escapeHTML(getInitials(artist.name))}
      </div>

      <div>
        <h1>${escapeHTML(artist.name || "Sin nombre")}</h1>
        <p>${escapeHTML(artist.description || "Ministerio o artista registrado.")}</p>
      </div>
    </section>

    ${albumSections || ""}

    ${songsWithoutArtistAlbum.length ? `
      <section class="artist-folder">
        <h3>Cantos</h3>

        <div class="song-list compact-list">
          ${songsWithoutArtistAlbum.map(renderMiniSongCard).join("")}
        </div>
      </section>
    ` : ""}

    ${collaborationSongs.length ? `
      <section class="artist-folder">
        <h3>Colaboraciones</h3>

        <div class="song-list compact-list">
          ${collaborationSongs.map(renderMiniSongCard).join("")}
        </div>
      </section>
    ` : ""}
  `;
}

function renderMiniSongCard(song) {
  return `
    <article class="song-card mini-song-card">
      <h4>${escapeHTML(song.title || "Sin título")}</h4>

      <p class="artists-line">
        ${artistLinksHTML(song._artists)}
      </p>

      <a class="song-btn" href="canto.html?slug=${encodeURIComponent(song.slug || slugify(song.title))}">
        Abrir
      </a>
    </article>
  `;
}

/* =========================================================
   PÚBLICO: PÁGINA DE CANTO
========================================================= */

async function loadSongPage() {
  const box = $("songPage") || $("songDetail") || $("cantoContent");

  if (!box) return;

  const slug = getUrlParam("slug");
  const client = getSupabase();

  if (!client || !slug) {
    box.innerHTML = `
      <div class="song-card">
        <h3>Canto no encontrado</h3>
      </div>
    `;
    return;
  }

  const { data: song, error } = await client
    .from("songs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !song) {
    box.innerHTML = `
      <div class="song-card">
        <h3>Canto no encontrado</h3>
      </div>
    `;
    return;
  }

  const { data: songs } = await fetchSongsWithRelations([song.id]);

  const fullSong = songs && songs[0]
    ? songs[0]
    : Object.assign({}, song, {
        _artists: [],
        _categories: [],
        _albums: [],
        _links: []
      });

  currentSongForPage = fullSong;
  currentTransposeSteps = 0;

  box.innerHTML = `
    <article class="song-detail-card">
      <p class="artists-line">
        ${artistLinksHTML(fullSong._artists)}
      </p>

      <h1>${escapeHTML(fullSong.title || "Sin título")}</h1>

      <p class="song-meta-line">
        ${escapeHTML(fullSong.tone || "")}
        ${fullSong.difficulty ? " · " + escapeHTML(fullSong.difficulty) : ""}
      </p>

      <div class="transpose-box">
        <button type="button" class="song-btn small-btn" onclick="changeTranspose(-1)">
          Bajar tono
        </button>

        <span id="transposeLabel">Tono original</span>

        <button type="button" class="song-btn small-btn" onclick="changeTranspose(1)">
          Subir tono
        </button>

        <button type="button" class="song-btn small-btn" onclick="resetTranspose()">
          Original
        </button>
      </div>

      <pre class="lyrics-block" id="lyricsContent">${renderChordedLyrics(fullSong.lyrics || "", 0)}</pre>

      ${renderSongLinksHTML(fullSong._links || [])}
    </article>
  `;
}

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {
  try {
    initTheme();
    initMenu();

    const themeButton = $("themeToggle");

    if (themeButton) {
      themeButton.addEventListener("click", toggleTheme);
    }

    await Promise.all([
      loadPublicCategories(),
      loadPublicArtists(),
      loadPublicSongs(),
      loadArtistProfile(),
      loadSongPage()
    ]);

    initArtistSearch();
    initSongSearch();

    if ($("adminPanel")) {
      await checkAdminSession();
    }
  } catch (error) {
    console.error("Error iniciando JHD:", error);
  }
});

/* =========================================================
   FUNCIONES PARA HTML
========================================================= */

window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;

window.saveArtist = saveArtist;
window.editArtist = editArtist;
window.deleteArtist = deleteArtist;
window.cancelArtistEdit = resetArtistForm;

window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.cancelCategoryEdit = resetCategoryForm;

window.saveAlbum = saveAlbum;
window.editAlbum = editAlbum;
window.deleteAlbum = deleteAlbum;
window.cancelAlbumEdit = resetAlbumForm;

window.saveSong = saveSong;
window.editSong = editSong;
window.deleteSong = deleteSong;
window.cancelSongEdit = resetSongForm;

window.insertSongSection = insertSongSection;

window.changeTranspose = changeTranspose;
window.resetTranspose = resetTranspose;

window.loadPublicArtists = loadPublicArtists;
window.loadPublicCategories = loadPublicCategories;
window.loadPublicSongs = loadPublicSongs;

/* =========================================================
   APP 1.2 - CAPO / SIN CAPO
========================================================= */

let currentCapoMode = "original";

function getCapoPosition(song) {
  const value = Number(song && song.capo_position ? song.capo_position : 0);

  if (Number.isNaN(value)) return 0;

  return value;
}

function getTotalTransposeSteps() {
  if (!currentSongForPage) return currentTransposeSteps;

  const capoPosition = getCapoPosition(currentSongForPage);

  if (currentCapoMode === "capo" && capoPosition > 0) {
    return currentTransposeSteps - capoPosition;
  }

  return currentTransposeSteps;
}

function setCapoMode(mode) {
  currentCapoMode = mode === "capo" ? "capo" : "original";
  currentTransposeSteps = 0;

  updateSongLyricsDisplay();
}

function updateSongLyricsDisplay() {
  const lyricsBox = $("lyricsContent");
  const label = $("transposeLabel");
  const modeLabel = $("capoModeLabel");

  if (!lyricsBox || !currentSongForPage) return;

  const totalSteps = getTotalTransposeSteps();

  lyricsBox.innerHTML = renderChordedLyrics(currentSongForPage.lyrics || "", totalSteps);

  if (label) {
    if (currentTransposeSteps === 0) {
      label.innerText = "Tono original";
    } else if (currentTransposeSteps > 0) {
      label.innerText = "+" + currentTransposeSteps;
    } else {
      label.innerText = String(currentTransposeSteps);
    }
  }

  if (modeLabel) {
    if (currentCapoMode === "capo") {
      const capo = getCapoPosition(currentSongForPage);
      const capoKey = currentSongForPage.capo_key || "";
      modeLabel.innerText = "Con capo " + capo + (capoKey ? " · Figuras en " + capoKey : "");
    } else {
      modeLabel.innerText = "Sin capo";
    }
  }
}

async function saveSong() {
  const title = getInputValue("songTitleInput");
  const songType = getInputValue("songTypeInput") || "catolico";
  const tone = getInputValue("songToneInput");
  const difficulty = getInputValue("songDifficultyInput");
  const lyrics = getInputValue("songLyricsInput");
  const categoryId = getInputValue("songCategoryInput");
  const albumId = getInputValue("songAlbumInput");
  const artistIds = getSelectedValues("songArtistsInput");
  const linksText = getInputValue("songLinksInput");
  const links = parseSongLinksText(linksText);

  const capoPositionRaw = getInputValue("songCapoInput");
  const capoPosition = capoPositionRaw ? Number(capoPositionRaw) : 0;
  const capoKey = getInputValue("songCapoKeyInput");

  if (!title) {
    alert("Escribe el título de la canción.");
    return;
  }

  if (!artistIds.length) {
    alert("Selecciona al menos un artista.");
    return;
  }

  const client = getSupabase();

  if (!client) {
    alert("No se pudo conectar con Supabase.");
    return;
  }

  const payload = {
    title: title,
    slug: slugify(title),
    song_type: songType,
    tone: tone,
    difficulty: difficulty,
    lyrics: lyrics,
    artist_id: artistIds[0],
    capo_position: Number.isNaN(capoPosition) ? 0 : capoPosition,
    capo_key: capoKey
  };

  let savedSongId = currentEditingSongId;
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

  savedSongId = result.data ? result.data.id : savedSongId;

  await client.from("song_artists").delete().eq("song_id", savedSongId);

  const artistRows = artistIds.map(function (artistId, index) {
    return {
      song_id: savedSongId,
      artist_id: artistId,
      role: index === 0 ? "principal" : "colaborador",
      sort_order: index
    };
  });

  if (artistRows.length) {
    const artistResult = await client.from("song_artists").insert(artistRows);

    if (artistResult.error) {
      alert("La canción se guardó, pero falló la relación con artistas: " + artistResult.error.message);
      return;
    }
  }

  await client.from("song_categories").delete().eq("song_id", savedSongId);

  if (categoryId) {
    const categoryResult = await client.from("song_categories").insert({
      song_id: savedSongId,
      category_id: categoryId
    });

    if (categoryResult.error) {
      alert("La canción se guardó, pero falló la categoría: " + categoryResult.error.message);
      return;
    }
  }

  await client.from("album_songs").delete().eq("song_id", savedSongId);

  if (albumId) {
    const albumResult = await client.from("album_songs").insert({
      song_id: savedSongId,
      album_id: albumId
    });

    if (albumResult.error) {
      alert("La canción se guardó, pero falló el álbum: " + albumResult.error.message);
      return;
    }
  }

  await client.from("song_links").delete().eq("song_id", savedSongId);

  if (links.length) {
    const linkRows = links.map(function (link, index) {
      return {
        song_id: savedSongId,
        title: link.title,
        link_type: link.link_type || "tutorial",
        platform: link.platform || "",
        url: link.url,
        sort_order: index
      };
    });

    const linksResult = await client.from("song_links").insert(linkRows);

    if (linksResult.error) {
      alert("La canción se guardó, pero fallaron los links: " + linksResult.error.message);
      return;
    }
  }

  const wasEditing = !!currentEditingSongId;

  resetSongForm();

  await Promise.all([
    loadAdminSongs(),
    loadPublicSongs()
  ]);

  alert(wasEditing ? "Canción actualizada." : "Canción guardada.");
}

async function editSong(id) {
  const { data: songs, error } = await fetchSongsWithRelations([id]);

  if (error || !songs || !songs.length) {
    alert("No se pudo cargar la canción.");
    return;
  }

  const song = songs[0];

  currentEditingSongId = song.id;

  const title = $("songFormTitle");

  if (title) {
    title.innerText = "Editar canción";
  }

  setInputValue("songTitleInput", song.title || "");
  setInputValue("songTypeInput", song.song_type || "catolico");
  setInputValue("songToneInput", song.tone || "");
  setInputValue("songDifficultyInput", song.difficulty || "");
  setInputValue("songLyricsInput", song.lyrics || "");
  setInputValue("songLinksInput", linksToText(song._links || []));
  setInputValue("songCapoInput", song.capo_position || "");
  setInputValue("songCapoKeyInput", song.capo_key || "");

  setSelectedValues(
    "songArtistsInput",
    (song._artists || []).map(function (artist) {
      return artist.id;
    })
  );

  setInputValue(
    "songCategoryInput",
    song._categories && song._categories[0] ? song._categories[0].id : ""
  );

  setInputValue(
    "songAlbumInput",
    song._albums && song._albums[0] ? song._albums[0].id : ""
  );

  const form = $("songFormCard");

  if (form) {
    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function resetSongForm() {
  currentEditingSongId = null;

  const title = $("songFormTitle");

  if (title) {
    title.innerText = "Agregar canción";
  }

  [
    "songTitleInput",
    "songToneInput",
    "songDifficultyInput",
    "songLyricsInput",
    "songLinksInput",
    "songCapoInput",
    "songCapoKeyInput"
  ].forEach(function (id) {
    setInputValue(id, "");
  });

  setInputValue("songTypeInput", "catolico");
  setInputValue("songCategoryInput", "");
  setInputValue("songAlbumInput", "");
  setSelectedValues("songArtistsInput", []);
}

async function loadSongPage() {
  const box = $("songPage") || $("songDetail") || $("cantoContent");

  if (!box) return;

  const slug = getUrlParam("slug");
  const client = getSupabase();

  if (!client || !slug) {
    box.innerHTML = `
      <div class="song-card">
        <h3>Canto no encontrado</h3>
      </div>
    `;
    return;
  }

  const { data: song, error } = await client
    .from("songs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !song) {
    box.innerHTML = `
      <div class="song-card">
        <h3>Canto no encontrado</h3>
      </div>
    `;
    return;
  }

  const { data: songs } = await fetchSongsWithRelations([song.id]);

  const fullSong = songs && songs[0]
    ? songs[0]
    : Object.assign({}, song, {
        _artists: [],
        _categories: [],
        _albums: [],
        _links: []
      });

  currentSongForPage = fullSong;
  currentTransposeSteps = 0;
  currentCapoMode = "original";

  const capoPosition = getCapoPosition(fullSong);
  const capoKey = fullSong.capo_key || "";

  box.innerHTML = `
    <article class="song-detail-card">
      <p class="artists-line">
        ${artistLinksHTML(fullSong._artists)}
      </p>

      <h1>${escapeHTML(fullSong.title || "Sin título")}</h1>

      <p class="song-meta-line">
        ${escapeHTML(fullSong.tone || "")}
        ${fullSong.difficulty ? " · " + escapeHTML(fullSong.difficulty) : ""}
      </p>

      ${capoPosition > 0 ? `
        <div class="capo-box">
          <span id="capoModeLabel">Sin capo</span>

          <button type="button" class="song-btn small-btn" onclick="setCapoMode('original')">
            Sin capo
          </button>

          <button type="button" class="song-btn small-btn" onclick="setCapoMode('capo')">
            Con capo ${capoPosition}${capoKey ? " · " + escapeHTML(capoKey) : ""}
          </button>
        </div>
      ` : ""}

      <div class="transpose-box">
        <button type="button" class="song-btn small-btn" onclick="changeTranspose(-1)">
          Bajar tono
        </button>

        <span id="transposeLabel">Tono original</span>

        <button type="button" class="song-btn small-btn" onclick="changeTranspose(1)">
          Subir tono
        </button>

        <button type="button" class="song-btn small-btn" onclick="resetTranspose()">
          Original
        </button>
      </div>

      <pre class="lyrics-block" id="lyricsContent">${renderChordedLyrics(fullSong.lyrics || "", 0)}</pre>

      ${renderSongLinksHTML(fullSong._links || [])}
    </article>
  `;
}

window.saveSong = saveSong;
window.editSong = editSong;
window.cancelSongEdit = resetSongForm;
window.loadSongPage = loadSongPage;
window.setCapoMode = setCapoMode;
window.changeTranspose = changeTranspose;
window.resetTranspose = resetTranspose;

/* =========================================================
   APP 1.4 - PERFIL DE ARTISTA CON SHIMMER SIN FOTOS
========================================================= */

function artistPageClient() {
  if (window.supabaseClient) return window.supabaseClient;

  if (typeof getSupabase === "function") {
    return getSupabase();
  }

  return null;
}

function artistPageParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function artistPageEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function artistPageInitials(name) {
  return String(name || "JHD")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(function (part) {
      return part.charAt(0).toUpperCase();
    })
    .join("") || "JHD";
}

function artistPageSongCard(song) {
  const artists = song._artists && song._artists.length
    ? song._artists.map(function (artist) {
        return artist.name;
      }).join(" · ")
    : "";

  return `
    <a class="song-card song-link-card" href="canto.html?slug=${artistPageEscape(song.slug || "")}">
      <p class="artists-line">${artistPageEscape(artists)}</p>
      <h3>${artistPageEscape(song.title || "Sin título")}</h3>
      <p style="color:var(--secondary); margin-top:8px;">
        ${artistPageEscape([song.tone, song.difficulty].filter(Boolean).join(" · "))}
      </p>
    </a>
  `;
}

function artistPageAlbumCard(album, songs) {
  const albumSongs = songs.filter(function (song) {
    return (song._albums || []).some(function (item) {
      return String(item.id) === String(album.id);
    });
  });

  return `
    <div class="song-card">
      <p class="hero-kicker">Álbum / carpeta</p>
      <h3>${artistPageEscape(album.title || album.name || "Sin título")}</h3>
      <p style="color:var(--secondary); margin-top:8px;">
        ${artistPageEscape(album.description || "Sin descripción.")}
      </p>
      <p style="color:var(--secondary); margin-top:12px;">
        ${albumSongs.length} canto${albumSongs.length === 1 ? "" : "s"}
      </p>
    </div>
  `;
}

async function artistPageFetchSongIds(client, artistId) {
  const ids = [];

  const relationResult = await client
    .from("song_artists")
    .select("song_id")
    .eq("artist_id", artistId);

  if (relationResult.data) {
    relationResult.data.forEach(function (row) {
      if (row.song_id) ids.push(row.song_id);
    });
  }

  const directResult = await client
    .from("songs")
    .select("id")
    .eq("artist_id", artistId);

  if (directResult.data) {
    directResult.data.forEach(function (row) {
      if (row.id) ids.push(row.id);
    });
  }

  return Array.from(new Set(ids));
}

async function artistPageFetchSongs(client, songIds) {
  if (!songIds.length) return [];

  if (typeof fetchSongsWithRelations === "function") {
    const result = await fetchSongsWithRelations(songIds);

    if (result && result.data) {
      return result.data;
    }
  }

  const songsResult = await client
    .from("songs")
    .select("*")
    .in("id", songIds)
    .order("title", { ascending: true });

  if (!songsResult.data) return [];

  const artistsResult = await client
    .from("song_artists")
    .select("song_id, sort_order, artists(id, name, slug, description)")
    .in("song_id", songIds)
    .order("sort_order", { ascending: true });

  const albumsResult = await client
    .from("album_songs")
    .select("song_id, albums(id, title, slug, description, artist_id)")
    .in("song_id", songIds);

  return songsResult.data.map(function (song) {
    const songArtists = (artistsResult.data || [])
      .filter(function (row) {
        return String(row.song_id) === String(song.id) && row.artists;
      })
      .map(function (row) {
        return row.artists;
      });

    const songAlbums = (albumsResult.data || [])
      .filter(function (row) {
        return String(row.song_id) === String(song.id) && row.albums;
      })
      .map(function (row) {
        return row.albums;
      });

    return Object.assign({}, song, {
      _artists: songArtists,
      _albums: songAlbums
    });
  });
}

async function artistPageFetchAlbums(client, artistId) {
  const result = await client
    .from("albums")
    .select("*")
    .eq("artist_id", artistId)
    .order("title", { ascending: true });

  return result.data || [];
}

async function loadArtistPage() {
  const box = document.getElementById("artistPage");

  if (!box) return;

  const client = artistPageClient();
  const slug = artistPageParam("slug");
  const id = artistPageParam("id");

  if (!client) {
    box.innerHTML = `
      <div class="song-card">
        <h2>No se pudo conectar</h2>
        <p style="color:var(--secondary);">Revisa la conexión con Supabase.</p>
      </div>
    `;
    return;
  }

  let artistResult;

  if (slug) {
    artistResult = await client
      .from("artists")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
  } else if (id) {
    artistResult = await client
      .from("artists")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  } else {
    box.innerHTML = `
      <div class="song-card">
        <h2>Artista no encontrado</h2>
        <p style="color:var(--secondary);">La página no tiene slug de artista.</p>
      </div>
    `;
    return;
  }

  if (artistResult.error || !artistResult.data) {
    box.innerHTML = `
      <div class="song-card">
        <h2>Artista no encontrado</h2>
        <p style="color:var(--secondary);">No se encontró información de este artista.</p>
      </div>
    `;
    return;
  }

  const artist = artistResult.data;
  const songIds = await artistPageFetchSongIds(client, artist.id);
  const songs = await artistPageFetchSongs(client, songIds);
  const albums = await artistPageFetchAlbums(client, artist.id);

  const collaborations = songs.filter(function (song) {
    return song._artists && song._artists.length > 1;
  });

  box.innerHTML = `
    <article class="artist-profile-card">

      <div class="artist-gradient-banner"></div>

      <div class="artist-profile-head">
        <div class="artist-avatar-initials">
          ${artistPageEscape(artistPageInitials(artist.name))}
        </div>

        <div>
          <p class="hero-kicker">Artista / grupo</p>
          <h1>${artistPageEscape(artist.name || "Artista")}</h1>
          <p style="color:var(--secondary); margin-top:10px;">
            ${artistPageEscape(artist.description || "Sin descripción.")}
          </p>
        </div>
      </div>

    </article>

    <section class="section-inner">
      <h2>Álbumes / carpetas</h2>

      <div class="admin-grid">
        ${
          albums.length
            ? albums.map(function (album) {
                return artistPageAlbumCard(album, songs);
              }).join("")
            : '<div class="song-card"><p style="color:var(--secondary);">Aún no hay álbumes o carpetas para este artista.</p></div>'
        }
      </div>
    </section>

    <section class="section-inner">
      <h2>Canciones</h2>

      <div class="songs-grid">
        ${
          songs.length
            ? songs.map(artistPageSongCard).join("")
            : '<div class="song-card"><p style="color:var(--secondary);">Aún no hay canciones para este artista.</p></div>'
        }
      </div>
    </section>

    <section class="section-inner">
      <h2>Colaboraciones</h2>

      <div class="songs-grid">
        ${
          collaborations.length
            ? collaborations.map(artistPageSongCard).join("")
            : '<div class="song-card"><p style="color:var(--secondary);">Aún no hay colaboraciones registradas.</p></div>'
        }
      </div>
    </section>
  `;
}

window.loadArtistPage = loadArtistPage;
/* =========================================================
   APP 1.6 - EDITOR DE DONACIONES
========================================================= */

function donationEditorClient() {
  if (window.supabaseClient) return window.supabaseClient;

  if (typeof getSupabase === "function") {
    return getSupabase();
  }

  return null;
}

function donationEditorEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensureDonationEditorInAdmin() {
  const panel = document.getElementById("adminPanel");

  if (!panel) return;

  if (document.getElementById("donationEditorCard")) return;

  const donationHTML = `
    <div class="song-card" id="donationEditorCard" style="margin-top:28px;">
      <h2>Editor de donaciones</h2>

      <p style="color:var(--secondary); margin-bottom:14px;">
        Edita la información que aparece en la página de donaciones.
      </p>

      <input
        id="donationTitleInput"
        type="text"
        placeholder="Título, ejemplo: Apoya este proyecto"
      >

      <textarea
        id="donationDescriptionInput"
        placeholder="Descripción de la donación"
      ></textarea>

      <input
        id="donationMethodInput"
        type="text"
        placeholder="Método, ejemplo: Mercado Pago"
      >

      <input
        id="donationTransferNumberInput"
        type="text"
        placeholder="Número para transferir"
      >

      <textarea
        id="donationNoteInput"
        placeholder="Nota final"
      ></textarea>

      <div class="admin-actions">
        <button class="song-btn" type="button" onclick="saveDonationSettings()">
          Guardar donaciones
        </button>

        <button class="song-btn" type="button" onclick="loadDonationSettingsAdmin()">
          Recargar datos
        </button>
      </div>

      <p id="donationEditorMessage" style="color:var(--secondary); margin-top:14px;"></p>
    </div>
  `;

  panel.insertAdjacentHTML("beforeend", donationHTML);

  loadDonationSettingsAdmin();
}

async function loadDonationSettingsAdmin() {
  const client = donationEditorClient();
  const message = document.getElementById("donationEditorMessage");

  if (!client) {
    if (message) {
      message.textContent = "No se pudo conectar con Supabase.";
    }

    return;
  }

  const result = await client
    .from("donation_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (result.error) {
    if (message) {
      message.textContent = "Error al cargar donaciones: " + result.error.message;
    }

    return;
  }

  const data = result.data || {};

  const titleInput = document.getElementById("donationTitleInput");
  const descriptionInput = document.getElementById("donationDescriptionInput");
  const methodInput = document.getElementById("donationMethodInput");
  const transferInput = document.getElementById("donationTransferNumberInput");
  const noteInput = document.getElementById("donationNoteInput");

  if (titleInput) titleInput.value = data.title || "Apoya este proyecto";
  if (descriptionInput) descriptionInput.value = data.description || "";
  if (methodInput) methodInput.value = data.method || "Mercado Pago";
  if (transferInput) transferInput.value = data.transfer_number || "722969014489272097";
  if (noteInput) noteInput.value = data.note || "Gracias por apoyar este proyecto. Dios te bendiga.";

  if (message) {
    message.textContent = "Datos de donaciones cargados.";
  }
}

async function saveDonationSettings() {
  const client = donationEditorClient();
  const message = document.getElementById("donationEditorMessage");

  if (!client) {
    if (message) {
      message.textContent = "No se pudo conectar con Supabase.";
    }

    return;
  }

  const payload = {
    id: 1,
    title: document.getElementById("donationTitleInput")?.value || "Apoya este proyecto",
    description: document.getElementById("donationDescriptionInput")?.value || "",
    method: document.getElementById("donationMethodInput")?.value || "Mercado Pago",
    transfer_number: document.getElementById("donationTransferNumberInput")?.value || "",
    note: document.getElementById("donationNoteInput")?.value || "",
    updated_at: new Date().toISOString()
  };

  const result = await client
    .from("donation_settings")
    .upsert(payload, { onConflict: "id" });

  if (result.error) {
    if (message) {
      message.textContent = "No se pudo guardar: " + result.error.message;
    }

    alert("No se pudo guardar donaciones: " + result.error.message);
    return;
  }

  if (message) {
    message.textContent = "Donaciones guardadas correctamente.";
  }

  alert("Donaciones guardadas correctamente.");
}

async function loadDonationPage() {
  const box = document.getElementById("donationsBox");

  if (!box) return;

  const client = donationEditorClient();

  if (!client) {
    box.innerHTML = `
      <h2>No se pudo cargar</h2>
      <p style="color:var(--secondary);">
        Revisa la conexión con Supabase.
      </p>
    `;
    return;
  }

  const result = await client
    .from("donation_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (result.error || !result.data) {
    box.innerHTML = `
      <h2>Apoya este proyecto</h2>
      <p style="color:var(--secondary); line-height:1.7;">
        La información de donaciones aún no está disponible.
      </p>
    `;
    return;
  }

  const data = result.data;

  box.innerHTML = `
    <h2>${donationEditorEscape(data.title || "Apoya este proyecto")}</h2>

    <p style="color:var(--secondary); line-height:1.7; margin-bottom:22px;">
      ${donationEditorEscape(data.description || "")}
    </p>

    <div class="donation-info">

      <div class="donation-row">
        <strong>Método de transferencia</strong>
        <span>${donationEditorEscape(data.method || "Mercado Pago")}</span>
      </div>

      <div class="donation-row">
        <strong>Número para transferir</strong>
        <span id="donationNumber">${donationEditorEscape(data.transfer_number || "")}</span>
      </div>

      <div class="donation-row">
        <strong>Nota</strong>
        <span>${donationEditorEscape(data.note || "")}</span>
      </div>

    </div>

    <div style="margin-top:22px;">
      <button class="song-btn" type="button" onclick="copyDonationNumber()">
        Copiar número
      </button>
    </div>

    <p id="copyDonationMessage" style="color:var(--secondary); margin-top:14px;"></p>
  `;
}

function copyDonationNumber() {
  const number = document.getElementById("donationNumber")?.textContent?.trim() || "";
  const message = document.getElementById("copyDonationMessage");

  if (!number) {
    if (message) {
      message.textContent = "No hay número disponible para copiar.";
    }

    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(number).then(function () {
      if (message) {
        message.textContent = "Número copiado correctamente.";
      }
    }).catch(function () {
      if (message) {
        message.textContent = "No se pudo copiar automáticamente. Puedes copiarlo manualmente.";
      }
    });

    return;
  }

  if (message) {
    message.textContent = "Puedes copiar el número manualmente: " + number;
  }
}

window.ensureDonationEditorInAdmin = ensureDonationEditorInAdmin;
window.loadDonationSettingsAdmin = loadDonationSettingsAdmin;
window.saveDonationSettings = saveDonationSettings;
window.loadDonationPage = loadDonationPage;
window.copyDonationNumber = copyDonationNumber;

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    ensureDonationEditorInAdmin();

    if (document.getElementById("donationsBox")) {
      loadDonationPage();
    }
  }, 1000);
});
/* =========================================================
   APP 1.7 - CORRECCIÓN LINKS DE ARTISTAS
========================================================= */

function safeArtistSlug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function artistProfileUrlFixed(artist) {
  if (!artist) return "artistas.html";

  if (artist.slug) {
    return "artista.html?slug=" + encodeURIComponent(artist.slug);
  }

  if (artist.id) {
    return "artista.html?id=" + encodeURIComponent(artist.id);
  }

  if (artist.name) {
    return "artista.html?slug=" + encodeURIComponent(safeArtistSlug(artist.name));
  }

  return "artistas.html";
}

function artistLinksHTML(artists) {
  if (!artists || !artists.length) {
    return "";
  }

  return artists.map(function (artist) {
    const name = artist && artist.name ? artist.name : "Artista";
    const url = artistProfileUrlFixed(artist);

    return '<a href="' + url + '">' + escapeHTML(name) + '</a>';
  }).join(" · ");
}

window.artistLinksHTML = artistLinksHTML;
