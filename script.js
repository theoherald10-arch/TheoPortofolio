import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyAjYob8hBpCt_rq38FSwwJFQFst80tLCps",
  authDomain: "theoportofolio-5c09e.firebaseapp.com",
  projectId: "theoportofolio-5c09e",
  storageBucket: "theoportofolio-5c09e.firebasestorage.app",
  messagingSenderId: "618834852973",
  appId: "1:618834852973:web:ca9cf109df20e256a19364",
  measurementId: "G-E0G8YP1JGW"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const contentDocRef = doc(db, "portofolio", "mainData");

// Data awal sebelum disimpan pertama kali ke Firestore
let portfolioData = {
  logo: "Theo.",
  heroBadge: "Selamat datang di ruang karya saya",
  heroName: "Theo",
  heroDesc: "Web Developer & UI/UX Enthusiast yang fokus membangun aplikasi web modern, cepat, dan fungsional.",
  aboutDesc: "Saya adalah pengembang web yang gemar menciptakan pengalaman digital yang bersih dan intuitif. Berpengalaman menggunakan HTML, CSS, JavaScript, serta ekosistem cloud seperti Firebase untuk membangun aplikasi real-time.",
  contactDesc: "Tertarik berdiskusi tentang proyek atau kolaborasi? Mari berbincang sambil menikmati secangkir kopi:",
  footerName: "Theo",
  email: "theo@example.com",
  github: "https://github.com/",
  linkedin: "https://linkedin.com/",
  projects: [
    {
      title: "Aplikasi Manajemen Tugas",
      desc: "Aplikasi web untuk mencatat aktivitas harian dengan sinkronisasi real-time menggunakan Firebase Firestore.",
      tags: "HTML, CSS, Firebase"
    },
    {
      title: "Website Katalog Kopi",
      desc: "Antarmuka web responsif bertema hangat dengan filter kategori produk dan keranjang pesanan.",
      tags: "JavaScript, CSS Grid"
    }
  ]
};

let isAdmin = false;

// Elemen DOM
const loginModal = document.getElementById("login-modal");
const btnAuthModal = document.getElementById("btn-auth-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const adminToolbar = document.getElementById("admin-toolbar");
const contactEditBox = document.getElementById("contact-edit-box");
const projectGrid = document.getElementById("project-grid");

// 1. Ambil data terbaru dari Firestore
async function loadPortfolioData() {
  try {
    const snap = await getDoc(contentDocRef);
    if (snap.exists()) {
      portfolioData = { ...portfolioData, ...snap.data() };
    }
  } catch (err) {
    console.error("Gagal memuat data dari Firestore:", err);
  }
  renderPage();
}

// 2. Render data ke tampilan HTML
function renderPage() {
  document.querySelectorAll(".editable").forEach((el) => {
    const field = el.dataset.field;
    if (portfolioData[field] !== undefined) {
      el.textContent = portfolioData[field];
    }
    el.contentEditable = isAdmin ? "true" : "false";
  });

  // Update tautan kontak
  document.getElementById("link-email").href = `mailto:${portfolioData.email}`;
  document.getElementById("link-github").href = portfolioData.github;
  document.getElementById("link-linkedin").href = portfolioData.linkedin;

  document.getElementById("input-email").value = portfolioData.email;
  document.getElementById("input-github").value = portfolioData.github;
  document.getElementById("input-linkedin").value = portfolioData.linkedin;

  // Render kartu proyek
  projectGrid.innerHTML = "";
  portfolioData.projects.forEach((proj, index) => {
    const tagsHtml = proj.tags
      .split(",")
      .filter((t) => t.trim() !== "")
      .map((t) => `<span class="tag">${t.trim()}</span>`)
      .join("");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      ${isAdmin ? `<button class="btn-delete-card" data-index="${index}">Hapus</button>` : ""}
      <h3 class="proj-title" contenteditable="${isAdmin}">${proj.title}</h3>
      <p class="proj-desc" contenteditable="${isAdmin}">${proj.desc}</p>
      <div class="proj-tags" contenteditable="${isAdmin}">${isAdmin ? proj.tags : tagsHtml}</div>
    `;
    projectGrid.appendChild(card);
  });

  if (isAdmin) {
    document.querySelectorAll(".btn-delete-card").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = Number(e.target.dataset.index);
        portfolioData.projects.splice(idx, 1);
        renderPage();
      });
    });
  }
}

// 3. Cek Status Login Admin
onAuthStateChanged(auth, (user) => {
  isAdmin = !!user;
  if (isAdmin) {
    adminToolbar.classList.remove("hidden");
    contactEditBox.classList.remove("hidden");
    btnAuthModal.textContent = "Admin Aktif";
  } else {
    adminToolbar.classList.add("hidden");
    contactEditBox.classList.add("hidden");
    btnAuthModal.textContent = "Admin";
  }
  renderPage();
});

// Buka & Tutup Modal Login
btnAuthModal.addEventListener("click", () => {
  if (!isAdmin) {
    loginError.textContent = "";
    loginModal.classList.remove("hidden");
  }
});

btnCloseModal.addEventListener("click", () => {
  loginModal.classList.add("hidden");
});

// Proses Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginModal.classList.add("hidden");
    loginForm.reset();
  } catch (err) {
    loginError.textContent = "Email atau password salah!";
  }
});

// Proses Logout
document.getElementById("btn-logout").addEventListener("click", async () => {
  await signOut(auth);
});

// Tambah Kartu Proyek Baru
document.getElementById("btn-add-project").addEventListener("click", () => {
  portfolioData.projects.push({
    title: "Judul Proyek Baru",
    desc: "Klik teks ini untuk menulis deskripsi proyek Anda.",
    tags: "HTML, CSS, Firebase"
  });
  renderPage();
});

// Simpan Perubahan ke Firestore
document.getElementById("btn-save-all").addEventListener("click", async () => {
  if (!isAdmin) return;

  document.querySelectorAll(".editable").forEach((el) => {
    portfolioData[el.dataset.field] = el.textContent.trim();
  });

  portfolioData.email = document.getElementById("input-email").value.trim();
  portfolioData.github = document.getElementById("input-github").value.trim();
  portfolioData.linkedin = document.getElementById("input-linkedin").value.trim();

  const updatedProjects = [];
  document.querySelectorAll("#project-grid .card").forEach((card) => {
    updatedProjects.push({
      title: card.querySelector(".proj-title").textContent.trim(),
      desc: card.querySelector(".proj-desc").textContent.trim(),
      tags: card.querySelector(".proj-tags").textContent.trim()
    });
  });
  portfolioData.projects = updatedProjects;

  try {
    await setDoc(contentDocRef, portfolioData);
    alert("Perubahan berhasil disimpan!");
    renderPage();
  } catch (err) {
    alert("Gagal menyimpan. Pastikan Firestore Rules & akun Admin sudah aktif: " + err.message);
  }
});

loadPortfolioData();