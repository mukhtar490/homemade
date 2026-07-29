import {
  auth, db,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile,
  collection, addDoc, query, orderBy, serverTimestamp, onSnapshot
} from "./firebase-config.js";

/* ---------------- STATE ---------------- */
let currentUser = null;
let allBusinesses = [];
let activeCategory = "";

const CATEGORY_TONES = {
  "Food & Baking": "wood",
  "Handmade Crafts": "sage",
  "Gifts": "wood",
  "Services": "slate",
  "Apparel & Accessories": "sage"
};
const CATEGORY_GRADIENTS = {
  "Food & Baking": "linear-gradient(135deg,#D9A15C,#9C6A2E)",
  "Handmade Crafts": "linear-gradient(135deg,#8FA377,#556B44)",
  "Gifts": "linear-gradient(135deg,#C98849,#8A5427)",
  "Services": "linear-gradient(135deg,#5A87A3,#2E4A5C)",
  "Apparel & Accessories": "linear-gradient(135deg,#4E7590,#28404F)"
};

/* ---------------- DOM REFS ---------------- */
const headerActions = document.getElementById("headerActions");
const loginBtn = document.getElementById("loginBtn");
const addBusinessBtn = document.getElementById("addBusinessBtn");

const authModal = document.getElementById("authModal");
const closeAuthModal = document.getElementById("closeAuthModal");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authError = document.getElementById("authError");
const nameField = document.getElementById("nameField");
const authSubmitBtn = document.getElementById("authSubmitBtn");
let authMode = "login";

const businessModal = document.getElementById("businessModal");
const closeBusinessModal = document.getElementById("closeBusinessModal");
const businessForm = document.getElementById("businessForm");
const bizError = document.getElementById("bizError");

const searchInput = document.getElementById("searchInput");
const stateSelect = document.getElementById("stateSelect");
const catGrid = document.getElementById("catGrid");
const businessGrid = document.getElementById("businessGrid");

const browseView = document.getElementById("browseView");
const detailView = document.getElementById("detailView");
const detailHero = document.getElementById("detailHero");
const detailCard = document.getElementById("detailCard");
const backToBrowse = document.getElementById("backToBrowse");
const logoHome = document.getElementById("logoHome");

/* ---------------- AUTH UI ---------------- */
function openAuthModal(mode) {
  authMode = mode;
  document.querySelectorAll("[data-authtab]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.authtab === mode);
  });
  nameField.classList.toggle("hidden", mode !== "signup");
  authTitle.textContent = mode === "signup" ? "Sign up" : "Log in";
  authSubmitBtn.textContent = mode === "signup" ? "Create account" : "Log in";
  authError.classList.add("hidden");
  authForm.reset();
  authModal.classList.remove("hidden");
}
loginBtn.addEventListener("click", () => openAuthModal("login"));
closeAuthModal.addEventListener("click", () => authModal.classList.add("hidden"));
document.querySelectorAll("[data-authtab]").forEach(btn => {
  btn.addEventListener("click", () => openAuthModal(btn.dataset.authtab));
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.classList.add("hidden");
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const name = document.getElementById("authName").value.trim();

  try {
    if (authMode === "signup") {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    authModal.classList.add("hidden");
  } catch (err) {
    authError.textContent = friendlyAuthError(err.code);
    authError.classList.remove("hidden");
  }
});

function friendlyAuthError(code) {
  const map = {
    "auth/email-already-in-use": "That email is already registered — try logging in instead.",
    "auth/invalid-email": "That email doesn't look right.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect email or password."
  };
  return map[code] || "Something went wrong. Please try again.";
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  renderHeader();
});

function renderHeader() {
  if (currentUser) {
    headerActions.innerHTML = `
      <span class="user-pill">👤 ${escapeHtml(currentUser.displayName || currentUser.email)}</span>
      <button class="btn btn-ghost" id="logoutBtn">Log out</button>
      <button class="btn btn-primary" id="addBusinessBtn2">Add your business</button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));
    document.getElementById("addBusinessBtn2").addEventListener("click", openBusinessModal);
  } else {
    headerActions.innerHTML = `
      <button class="btn btn-ghost" id="loginBtn2">Log in</button>
      <button class="btn btn-primary" id="addBusinessBtn2">Add your business</button>
    `;
    document.getElementById("loginBtn2").addEventListener("click", () => openAuthModal("login"));
    document.getElementById("addBusinessBtn2").addEventListener("click", openBusinessModal);
  }
}

/* ---------------- ADD BUSINESS ---------------- */
function openBusinessModal() {
  if (!currentUser) {
    openAuthModal("login");
    return;
  }
  bizError.classList.add("hidden");
  businessForm.reset();
  businessModal.classList.remove("hidden");
}
addBusinessBtn.addEventListener("click", openBusinessModal);
closeBusinessModal.addEventListener("click", () => businessModal.classList.add("hidden"));

businessForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  bizError.classList.add("hidden");

  const data = {
    ownerId: currentUser.uid,
    ownerName: currentUser.displayName || currentUser.email,
    name: document.getElementById("bizName").value.trim(),
    description: document.getElementById("bizDesc").value.trim(),
    category: document.getElementById("bizCategory").value,
    city: document.getElementById("bizCity").value.trim(),
    state: document.getElementById("bizState").value,
    contact: {
      sms: document.getElementById("bizSms").value.trim(),
      call: document.getElementById("bizCall").value.trim(),
      instagram: document.getElementById("bizInsta").value.trim().replace(/^@/, ""),
      whatsapp: document.getElementById("bizWhatsapp").value.trim()
    },
    createdAt: serverTimestamp()
  };

  if (!data.contact.sms && !data.contact.call && !data.contact.instagram && !data.contact.whatsapp) {
    bizError.textContent = "Please add at least one way for people to reach you.";
    bizError.classList.remove("hidden");
    return;
  }

  try {
    await addDoc(collection(db, "businesses"), data);
    businessModal.classList.add("hidden");
  } catch (err) {
    bizError.textContent = "Couldn't publish your business. Please try again.";
    bizError.classList.remove("hidden");
  }
});

/* ---------------- BROWSE / LISTING ---------------- */
const businessesQuery = query(collection(db, "businesses"), orderBy("createdAt", "desc"));
onSnapshot(businessesQuery, (snapshot) => {
  allBusinesses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderGrid();
}, (err) => {
  businessGrid.innerHTML = `<div class="empty-state">Couldn't load businesses right now.</div>`;
  console.error(err);
});

function renderGrid() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const stateFilter = stateSelect.value;

  const filtered = allBusinesses.filter(b => {
    if (activeCategory && b.category !== activeCategory) return false;
    if (stateFilter && b.state !== stateFilter) return false;
    if (searchTerm) {
      const haystack = `${b.name} ${b.city}`.toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    businessGrid.innerHTML = `<div class="empty-state">No businesses match yet — be the first to add one in this category.</div>`;
    return;
  }

  businessGrid.innerHTML = filtered.map(b => `
    <div class="card" data-id="${b.id}">
      <div class="card-media" style="background:${CATEGORY_GRADIENTS[b.category] || CATEGORY_GRADIENTS["Services"]};">
        <span class="card-tag">${escapeHtml(b.category || "")}</span>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(b.name)}</div>
        <div class="card-owner">Owner: ${escapeHtml(b.ownerName || "")}</div>
        <div class="card-footer">
          <span class="city">📍 ${escapeHtml(b.city)}, ${escapeHtml(b.state)}</span>
        </div>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => showDetail(card.dataset.id));
  });
}

searchInput.addEventListener("input", renderGrid);
stateSelect.addEventListener("change", renderGrid);
catGrid.addEventListener("click", (e) => {
  const tile = e.target.closest(".cat-tile");
  if (!tile) return;
  document.querySelectorAll(".cat-tile").forEach(t => t.classList.remove("active"));
  tile.classList.add("active");
  activeCategory = tile.dataset.cat;
  renderGrid();
});

/* ---------------- DETAIL VIEW ---------------- */
function showDetail(id) {
  const b = allBusinesses.find(x => x.id === id);
  if (!b) return;

  detailHero.style.background = CATEGORY_GRADIENTS[b.category] || CATEGORY_GRADIENTS["Services"];

  const contactButtons = [];
  if (b.contact?.sms) {
    contactButtons.push(`<a class="contact-btn icon-sms" href="sms:${encodeURIComponent(b.contact.sms)}">✉ Text</a>`);
  }
  if (b.contact?.call) {
    contactButtons.push(`<a class="contact-btn icon-call" href="tel:${encodeURIComponent(b.contact.call)}">☎ Call</a>`);
  }
  if (b.contact?.instagram) {
    contactButtons.push(`<a class="contact-btn icon-insta" target="_blank" rel="noopener" href="https://instagram.com/${encodeURIComponent(b.contact.instagram)}">📷 Instagram</a>`);
  }
  if (b.contact?.whatsapp) {
    const digits = b.contact.whatsapp.replace(/[^\d]/g, "");
    contactButtons.push(`<a class="contact-btn icon-wa" target="_blank" rel="noopener" href="https://wa.me/${digits}">💬 WhatsApp</a>`);
  }

  detailCard.innerHTML = `
    <div class="profile-logo"></div>
    <h2 class="profile-name">${escapeHtml(b.name)}</h2>
    <div class="profile-meta">
      <span>👤 ${escapeHtml(b.ownerName || "")}</span>
      <span>📍 ${escapeHtml(b.city)}, ${escapeHtml(b.state)}</span>
    </div>
    <p class="profile-desc">${escapeHtml(b.description || "")}</p>
    <div class="profile-tags"><span class="tag">${escapeHtml(b.category || "")}</span></div>
    <div class="contact-row">${contactButtons.join("") || "<span style='opacity:0.5; font-size:13px;'>No contact info provided yet.</span>"}</div>
    <p class="disclaimer">Homemade is a directory only. All orders, payments, and food safety are handled directly between you and the business owner.</p>
  `;

  browseView.classList.add("hidden");
  detailView.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

backToBrowse.addEventListener("click", () => {
  detailView.classList.add("hidden");
  browseView.classList.remove("hidden");
});
logoHome.addEventListener("click", () => {
  detailView.classList.add("hidden");
  browseView.classList.remove("hidden");
});

/* ---------------- UTIL ---------------- */
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
