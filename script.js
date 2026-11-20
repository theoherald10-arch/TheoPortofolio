import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
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

// 1. TEMPEL KONFIGURASI FIREBASE ANDA DI SINI
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjYob8hBpCt_rq38FSwwJFQFst80tLCps",
  authDomain: "theoportofolio-5c09e.firebaseapp.com",
  projectId: "theoportofolio-5c09e",
  storageBucket: "theoportofolio-5c09e.firebasestorage.app",
  messagingSenderId: "618834852973",
  appId: "1:618834852973:web:ca9cf109df20e256a19364",
  measurementId: "G-E0G8YP1JGW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Data default jika database masih kosong
let portfolioData = {
  logo: "NamaAnda.",
  heroName: "Nama Anda",
  heroDesc: "Web Developer & UI/UX Enthusiast yang fokus membangun aplikasi web modern, cepat, dan responsif.",
  aboutDesc: "Saya adalah pengembang perangkat lunak dengan pengalaman di HTML, CSS, JavaScript, dan layanan cloud seperti Firebase.",
  contactDesc: "Tertarik berkolaborasi atau memiliki pertanyaan? Hubungi saya melalui:",
  footerName: "Nama Anda",
  email: "emailanda@example.com",
  github: "https://github.com/usernameanda",
  linkedin: "https://linkedin.com/in/usernameanda",
  projects: [
    {
      title: "Aplikasi Manajemen Tugas",
      desc: "Aplikasi web untuk mencatat aktivitas harian dengan sinkronisasi real-time menggunakan Firebase Firestore.",
      tags: "HTML, CSS, Firebase"
    },
    {
      title: "Website E-Commerce",
      desc: "Antarmuka toko online responsif lengkap dengan fitur keranjang belanja dan filter kategori produk.",
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

// 2. Muat data dari Firestore saat halaman dibuka
async function loadPortfolioData() {
  try {
    const snap = await getDoc(contentDocRef);
    if (snap.exists()) {
      portfolioData = { ...portfolioData, ...snap.data() };
    }
  } catch (err) {
    console.error("Gagal memuat data:", err);
  }
  renderPage();
}

// 3. Tampilkan data ke halaman
function renderPage() {
  document.querySelectorAll(".editable").forEach((el) => {
    const field = el.dataset.field;
    if (portfolioData[field]) {
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

  // Event tombol hapus kartu proyek
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

// 4. Pantau Status Login Admin
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

// Proses Login Email & Password
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

// Tambah Proyek Baru
document.getElementById("btn-add-project").addEventListener("click", () => {
  portfolioData.projects.push({
    title: "Judul Proyek Baru",
    desc: "Klik teks ini untuk menulis deskripsi singkat proyek Anda.",
    tags: "HTML, CSS, JS"
  });
  renderPage();
});

// Simpan Semua Perubahan ke Firestore
document.getElementById("btn-save-all").addEventListener("click", async () => {
  if (!isAdmin) return;

  // Ambil teks terbaru dari elemen editable
  document.querySelectorAll(".editable").forEach((el) => {
    portfolioData[el.dataset.field] = el.textContent.trim();
  });

  // Ambil tautan kontak terbaru
  portfolioData.email = document.getElementById("input-email").value.trim();
  portfolioData.github = document.getElementById("input-github").value.trim();
  portfolioData.linkedin = document.getElementById("input-linkedin").value.trim();

  // Ambil data proyek terbaru dari kartu
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
    alert("Perubahan berhasil disimpan ke Firebase!");
    renderPage();
  } catch (err) {
    alert("Gagal menyimpan: " + err.message);
  }
});

loadPortfolioData();