import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjYob8hBpCt_rq38FSwwJFQFst80tLCps",
  authDomain: "theoportofolio-5c09e.firebaseapp.com",
  projectId: "theoportofolio-5c09e",
  storageBucket: "theoportofolio-5c09e.firebasestorage.app",
  messagingSenderId: "618834852973",
  appId: "1:618834852973:web:ca9cf109df20e256a19364",
  measurementId: "G-E0G8YP1JGW"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Sesi login tetap aktif sampai Logout ditekan
setPersistence(auth, browserLocalPersistence);

const mainDocRef = doc(db, "portofolio", "mainProfile");
const bannerDocRef = doc(db, "portofolio", "bannerMedia");
const avatarDocRef = doc(db, "portofolio", "avatarMedia");
const pageBgDocRef = doc(db, "portofolio", "pageBgMedia");
const tasksColRef = collection(db, "portofolio_tasks");

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

let portfolioData = {
  pageBgUrl: "",
  bannerUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  texts: {
    logo: "Theo.",
    sidebarUploadTitle: "Upload Tugas Baru",
    profileName: "Theo",
    profileRole: "Web Developer & UI/UX Enthusiast",
    profileBio: "Selamat datang di portofolio saya. Klik tombol Admin di sidebar untuk masuk dan mengatur konten portofolio ini.",
    headingDataDiri: "Data Diri",
    lblNama: "Nama Lengkap",
    valNama: "Theo Pratama",
    lblTtl: "Tempat, Tanggal Lahir",
    valTtl: "Jakarta, 12 Mei 2005",
    lblAlamat: "Alamat",
    valAlamat: "Indonesia",
    lblPendidikan: "Pendidikan / Status",
    valPendidikan: "Pelajar / Mahasiswa",
    lblEmail: "Email",
    valEmail: "theo@example.com",
    lblHobi: "Hobi & Minat",
    valHobi: "Coding, Desain Web, Kopi",
    headingSkill: "Keahlian (Skill)",
    skillTitle1: "Web Development",
    skillDesc1: "Membangun antarmuka website responsif dan interaktif menggunakan HTML5, CSS3, dan JavaScript modern.",
    skillTitle2: "Firebase & Cloud",
    skillDesc2: "Mengelola autentikasi pengguna, database real-time Firestore, serta deployment aplikasi web.",
    skillTitle3: "UI/UX Design",
    skillDesc3: "Merancang tata letak antarmuka yang bersih, nyaman digunakan, dan estetis di berbagai ukuran layar.",
    skillTitle4: "Git & GitHub",
    skillDesc4: "Mengatur manajemen versi kode sumber serta kolaborasi proyek secara terstruktur dan aman.",
    headingTugas: "Koleksi Tugas & Karya",
    descTugas: "Klik tombol \"Lihat Tugas\" pada kartu untuk menampilkan pratinjau video, PDF, Drive, atau gambar langsung di halaman ini.",
    headingKontak: "Kontak & Media Sosial",
    descKontak: "Hubungi saya langsung melalui WhatsApp atau ikuti kanal media sosial saya:",
    lblWa: "WhatsApp",
    valWa: "+62 812-3456-7890",
    lblYt: "YouTube",
    valYt: "https://youtube.com/@username",
    lblTt: "TikTok",
    valTt: "https://tiktok.com/@username",
    footerText: "© 2026 Theo. Dibuat dengan VS Code, GitHub & Firebase."
  }
};

let taskList = [];
let isLoggedIn = false; // Status apakah masuk akun Admin
let isEditMode = false; // Status apakah Mode Edit sedang dinyalakan (bebas toggle)

// Elemen DOM
const adminToolbar = document.getElementById("admin-toolbar");
const adminStatusDot = document.getElementById("admin-status-dot");
const adminStatusText = document.getElementById("admin-status-text");
const btnToggleEdit = document.getElementById("btn-toggle-edit");
const editOnlyControls = document.getElementById("edit-only-controls");
const btnSaveAll = document.getElementById("btn-save-all");

const pageBgImage = document.getElementById("page-bg-image");
const inputPageBg = document.getElementById("input-page-bg");
const btnResetBg = document.getElementById("btn-reset-bg");
const btnAuthModal = document.getElementById("btn-auth-modal");
const loginModal = document.getElementById("login-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const sidebarUploadBox = document.getElementById("sidebar-upload-box");
const avatarContainer = document.getElementById("avatar-container");
const avatarHoverOverlay = document.getElementById("avatar-hover-overlay");
const inputAvatarFile = document.getElementById("input-avatar-file");

// Modal Pratinjau Tugas
const previewModal = document.getElementById("preview-modal");
const previewBadge = document.getElementById("preview-badge");
const previewTitle = document.getElementById("preview-title");
const previewDesc = document.getElementById("preview-desc");
const previewBody = document.getElementById("preview-body");
const previewExternalBtn = document.getElementById("preview-external-btn");

// Toast Notification
function showToast(message, isError = false) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : ""}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Efek Ripple saat tombol diklik
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".ripple-btn");
  if (!btn) return;
  const circle = document.createElement("span");
  const diameter = Math.max(btn.clientWidth, btn.clientHeight);
  const rect = btn.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
  circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
  circle.classList.add("ripple-circle");
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 550);
});

// Scroll Reveal & Active Sidebar Indicator
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        const id = entry.target.getAttribute("id");
        document.querySelectorAll(".nav-item").forEach((link) => {
          link.classList.toggle("active", link.dataset.target === id);
        });
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".reveal-section").forEach((sec) => revealObserver.observe(sec));

// Deteksi Platform & Buat URL Embed agar bisa dilihat langsung di dalam web
function parseMediaEmbed(task) {
  if (task.fileData) {
    if (task.fileData.startsWith("data:image/")) {
      return { platform: "GAMBAR", type: "image", src: task.fileData, externalUrl: task.fileData };
    }
    if (task.fileData.startsWith("data:application/pdf")) {
      return { platform: "PDF", type: "iframe", src: task.fileData, externalUrl: task.fileData };
    }
    return { platform: "FILE", type: "download", src: task.fileData, externalUrl: task.fileData };
  }

  const url = (task.externalUrl || "").trim();
  if (!url) return { platform: "CATATAN", type: "none", src: "", externalUrl: "" };

  // 1. YouTube (watch?v=, youtu.be/, shorts/)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return {
      platform: "YOUTUBE",
      type: "iframe",
      src: `https://www.youtube.com/embed/${ytMatch[1]}`,
      externalUrl: url
    };
  }

  // 2. TikTok (/video/ID)
  const ttMatch = url.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (ttMatch) {
    return {
      platform: "TIKTOK",
      type: "iframe",
      src: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
      externalUrl: url
    };
  }
  if (url.includes("tiktok.com")) {
    return { platform: "TIKTOK", type: "link", src: url, externalUrl: url };
  }

  // 3. Instagram (/p/CODE, /reel/CODE, /tv/CODE)
  const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) {
    return {
      platform: "INSTAGRAM",
      type: "iframe",
      src: `https://www.instagram.com/p/${igMatch[1]}/embed`,
      externalUrl: url
    };
  }
  if (url.includes("instagram.com")) {
    return { platform: "INSTAGRAM", type: "link", src: url, externalUrl: url };
  }

  // 4. Google Drive (/file/d/ID)
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return {
      platform: "GOOGLE DRIVE",
      type: "iframe",
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      externalUrl: url
    };
  }
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const previewUrl = url.replace(/\/edit.*$/, "/preview").replace(/\/view.*$/, "/preview");
    return { platform: "GOOGLE DRIVE", type: "iframe", src: previewUrl, externalUrl: url };
  }

  // 5. PDF Online
  if (url.toLowerCase().endsWith(".pdf")) {
    return { platform: "PDF", type: "iframe", src: url, externalUrl: url };
  }

  // 6. Tautan Web Lainnya
  return { platform: "TAUTAN", type: "iframe", src: url, externalUrl: url };
}

// Buka Pratinjau Tugas Langsung di Web
function openTaskPreview(task) {
  const media = parseMediaEmbed(task);
  previewBadge.textContent = media.platform;
  previewTitle.textContent = task.title;
  previewDesc.textContent = task.desc;

  if (media.externalUrl) {
    previewExternalBtn.href = media.externalUrl;
    previewExternalBtn.classList.remove("hidden");
    if (task.fileData) {
      previewExternalBtn.setAttribute("download", task.fileName || "tugas");
      previewExternalBtn.textContent = "⬇️ Unduh File";
    } else {
      previewExternalBtn.removeAttribute("download");
      previewExternalBtn.textContent = "Buka Tab Baru ↗";
    }
  } else {
    previewExternalBtn.classList.add("hidden");
  }

  previewBody.innerHTML = "";
  if (media.type === "image") {
    previewBody.innerHTML = `<img src="${media.src}" alt="${task.title}" />`;
  } else if (media.type === "iframe") {
    previewBody.innerHTML = `<iframe src="${media.src}" allowfullscreen loading="lazy"></iframe>`;
  } else if (media.type === "download") {
    previewBody.innerHTML = `
      <div class="preview-fallback-box">
        <p>File <strong>${task.fileName}</strong> siap diunduh.</p>
        <a href="${media.src}" download="${task.fileName}" class="btn">⬇️ Unduh Sekarang</a>
      </div>
    `;
  } else if (media.type === "link") {
    previewBody.innerHTML = `
      <div class="preview-fallback-box">
        <p>Tautan ${media.platform} singkat/profil tidak mengizinkan embed langsung. Klik tombol di bawah untuk membukanya:</p>
        <a href="${media.externalUrl}" target="_blank" class="btn">Buka ${media.platform} ↗</a>
      </div>
    `;
  } else {
    previewBody.innerHTML = `<div class="preview-fallback-box"><p>Tugas ini hanya berisi deskripsi teks.</p></div>`;
  }

  previewModal.classList.remove("hidden");
}

document.getElementById("btn-close-preview").addEventListener("click", () => {
  previewModal.classList.add("hidden");
  previewBody.innerHTML = ""; // Hentikan pemutaran video saat modal ditutup
});

previewModal.addEventListener("click", (e) => {
  if (e.target === previewModal) {
    previewModal.classList.add("hidden");
    previewBody.innerHTML = "";
  }
});

// Validasi & Konversi file <= 1MB ke Base64
function fileToBase64(file, maxWidth = 1280) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error("Ukuran file melebihi 1 MB! Pilih file maksimal 1 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file."));

    if (file.type.startsWith("image/")) {
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(outputType, 0.82);

          if (dataUrl.length > 980000) {
            resolve(canvas.toDataURL("image/jpeg", 0.65));
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        const result = event.target.result;
        if (result.length > 1000000) {
          reject(new Error("File terlalu besar setelah encoding. Gunakan file di bawah 700 KB atau gunakan Link Drive/PDF."));
        } else {
          resolve(result);
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// Terapkan Gambar Background Halaman
function applyPageBackground(url) {
  if (url) {
    pageBgImage.style.backgroundImage = `url("${url}")`;
    pageBgImage.classList.add("has-image");
    if (isLoggedIn && isEditMode) btnResetBg.classList.remove("hidden");
    else btnResetBg.classList.add("hidden");
  } else {
    pageBgImage.style.backgroundImage = "none";
    pageBgImage.classList.remove("has-image");
    btnResetBg.classList.add("hidden");
  }
}

// Muat Semua Data dari Firestore
async function loadAllData() {
  try {
    const [mainSnap, bannerSnap, avatarSnap, bgSnap, tasksSnap] = await Promise.all([
      getDoc(mainDocRef),
      getDoc(bannerDocRef),
      getDoc(avatarDocRef),
      getDoc(pageBgDocRef),
      getDocs(query(tasksColRef, orderBy("createdAt", "desc")))
    ]);

    if (mainSnap.exists()) {
      const saved = mainSnap.data();
      portfolioData = {
        ...portfolioData,
        ...saved,
        texts: { ...portfolioData.texts, ...(saved.texts || {}) }
      };
    }

    if (bannerSnap.exists() && bannerSnap.data().url) {
      portfolioData.bannerUrl = bannerSnap.data().url;
    }

    if (avatarSnap.exists() && avatarSnap.data().url) {
      portfolioData.avatarUrl = avatarSnap.data().url;
    }

    if (bgSnap.exists() && bgSnap.data().url) {
      portfolioData.pageBgUrl = bgSnap.data().url;
    }

    taskList = [];
    tasksSnap.forEach((docItem) => {
      taskList.push({ id: docItem.id, ...docItem.data() });
    });
  } catch (err) {
    console.error("Gagal memuat data:", err);
  }
  renderAll();
}

function updateSocialHrefs() {
  const waText = portfolioData.texts.valWa || "";
  const waClean = waText.replace(/[^0-9]/g, "");
  document.getElementById("link-wa").href = waClean ? `https://wa.me/${waClean}` : "#bagian-kontak";

  const ytText = (portfolioData.texts.valYt || "").trim();
  document.getElementById("link-yt").href = ytText.startsWith("http")
    ? ytText
    : `https://youtube.com/${ytText.replace(/^@/, "@")}`;

  const ttText = (portfolioData.texts.valTt || "").trim();
  document.getElementById("link-tt").href = ttText.startsWith("http")
    ? ttText
    : `https://tiktok.com/${ttText.replace(/^@/, "@")}`;
}

// Sinkronkan Tampilan Kontrol Admin & Mode Edit
function syncAdminUI() {
  const canEdit = isLoggedIn && isEditMode;

  if (isLoggedIn) {
    adminToolbar.classList.remove("hidden");
    sidebarUploadBox.classList.remove("hidden");
    btnAuthModal.textContent = "Admin ✓";
  } else {
    adminToolbar.classList.add("hidden");
    sidebarUploadBox.classList.add("hidden");
    btnAuthModal.textContent = "Admin";
  }

  // Tombol Toggle Mode Edit
  if (canEdit) {
    btnToggleEdit.textContent = "✅ Selesai Edit (Tutup Mode Edit)";
    btnToggleEdit.classList.add("active");
    adminStatusDot.classList.add("editing");
    adminStatusText.innerHTML = "<strong>Mode Edit Aktif</strong> — Klik teks/foto untuk mengubah";
    editOnlyControls.classList.remove("hidden");
    btnSaveAll.classList.remove("hidden");
    avatarHoverOverlay.classList.remove("hidden");
    document.getElementById("btn-edit-banner").classList.remove("hidden");
    avatarContainer.classList.add("admin-clickable");
    avatarContainer.title = "Klik untuk mengganti foto profil (Maks 1MB)";
  } else {
    btnToggleEdit.textContent = "✏️ Aktifkan Mode Edit";
    btnToggleEdit.classList.remove("active");
    adminStatusDot.classList.remove("editing");
    adminStatusText.innerHTML = "<strong>Akun Admin</strong> (Mode Pratinjau)";
    editOnlyControls.classList.add("hidden");
    btnSaveAll.classList.add("hidden");
    avatarHoverOverlay.classList.add("hidden");
    document.getElementById("btn-edit-banner").classList.add("hidden");
    avatarContainer.classList.remove("admin-clickable");
    avatarContainer.title = "Foto Profil";
  }

  renderAll();
}

// Render Seluruh Halaman
function renderAll() {
  const canEdit = isLoggedIn && isEditMode;
  applyPageBackground(portfolioData.pageBgUrl);

  document.getElementById("banner-img").src = portfolioData.bannerUrl;
  document.getElementById("avatar-img").src = portfolioData.avatarUrl;

  document.querySelectorAll(".editable").forEach((el) => {
    const field = el.dataset.field;
    if (portfolioData.texts[field] !== undefined) {
      el.textContent = portfolioData.texts[field];
    }
    el.contentEditable = canEdit ? "true" : "false";
  });

  updateSocialHrefs();

  // Render Daftar Tugas
  const taskGrid = document.getElementById("task-grid");
  taskGrid.innerHTML = "";
  taskList.forEach((task) => {
    const media = parseMediaEmbed(task);
    const isImage = task.fileData && task.fileData.startsWith("data:image/");

    const card = document.createElement("div");
    card.className = "card glass-card interactive-card";
    card.dataset.id = task.id;
    card.innerHTML = `
      ${isLoggedIn ? `<button class="btn-delete-card" data-id="${task.id}">Hapus</button>` : ""}
      <span class="platform-badge">${media.platform}</span>
      ${isImage ? `<img src="${task.fileData}" alt="${task.title}" class="task-preview-img" />` : ""}
      <h3 class="task-title" contenteditable="${canEdit}">${task.title}</h3>
      <p class="task-desc" contenteditable="${canEdit}">${task.desc}</p>
      <div class="task-card-actions">
        <button type="button" class="btn-view-task ripple-btn">👁️ Lihat Tugas</button>
        ${task.fileData ? `<a href="${task.fileData}" download="${task.fileName || "tugas"}" class="task-file-link">⬇️ Unduh</a>` : ""}
      </div>
    `;

    // Klik tombol Lihat Tugas atau gambar pratinjau untuk melihat langsung di web
    card.querySelector(".btn-view-task").addEventListener("click", () => openTaskPreview(task));
    const previewImg = card.querySelector(".task-preview-img");
    if (previewImg) {
      previewImg.addEventListener("click", () => openTaskPreview(task));
    }

    taskGrid.appendChild(card);
  });

  if (isLoggedIn) {
    document.querySelectorAll("#task-grid .btn-delete-card").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Hapus tugas ini secara permanen?")) return;
        try {
          await deleteDoc(doc(db, "portofolio_tasks", id));
          taskList = taskList.filter((t) => t.id !== id);
          renderAll();
          showToast("Tugas berhasil dihapus.");
        } catch (err) {
          showToast("Gagal menghapus tugas: " + err.message, true);
        }
      });
    });
  }
}

// Cegah kartu sosial media membuka link baru hanya ketika Mode Edit aktif
document.querySelectorAll(".social-card").forEach((card) => {
  card.addEventListener("click", (e) => {
    if (isLoggedIn && isEditMode) {
      e.preventDefault();
    }
  });
});

// Pantau Status Login Admin
onAuthStateChanged(auth, (user) => {
  isLoggedIn = !!user;
  if (!isLoggedIn) {
    isEditMode = false;
  }
  syncAdminUI();
});

// Toggle Mode Edit secara bebas saat berada di akun Admin
btnToggleEdit.addEventListener("click", () => {
  if (!isLoggedIn) return;
  isEditMode = !isEditMode;
  syncAdminUI();
  showToast(isEditMode ? "Mode Edit diaktifkan." : "Kembali ke Mode Pratinjau.");
});

// Klik langsung area foto profil saat Mode Edit aktif
avatarContainer.addEventListener("click", () => {
  if (isLoggedIn && isEditMode) {
    inputAvatarFile.click();
  }
});

// Upload Foto Profil (Maks 1MB)
inputAvatarFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !(isLoggedIn && isEditMode)) return;
  try {
    showToast("Memproses foto profil...");
    const base64 = await fileToBase64(file, 500);
    await setDoc(avatarDocRef, { url: base64 });
    portfolioData.avatarUrl = base64;
    document.getElementById("avatar-img").src = base64;
    showToast("Foto profil berhasil diganti!");
  } catch (err) {
    showToast(err.message, true);
  }
  e.target.value = "";
});

// Upload Banner (Maks 1MB)
document.getElementById("input-banner-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !(isLoggedIn && isEditMode)) return;
  try {
    showToast("Memproses banner...");
    const base64 = await fileToBase64(file, 1280);
    await setDoc(bannerDocRef, { url: base64 });
    portfolioData.bannerUrl = base64;
    document.getElementById("banner-img").src = base64;
    showToast("Banner berhasil diperbarui!");
  } catch (err) {
    showToast(err.message, true);
  }
  e.target.value = "";
});

// Upload Background Halaman (Maks 1MB)
inputPageBg.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !(isLoggedIn && isEditMode)) return;
  try {
    showToast("Memproses gambar background...");
    const base64 = await fileToBase64(file, 1440);
    await setDoc(pageBgDocRef, { url: base64 });
    portfolioData.pageBgUrl = base64;
    applyPageBackground(base64);
    showToast("Background halaman berhasil diubah!");
  } catch (err) {
    showToast(err.message, true);
  }
  e.target.value = "";
});

// Reset Gambar Background Halaman
btnResetBg.addEventListener("click", async () => {
  if (!(isLoggedIn && isEditMode)) return;
  try {
    await deleteDoc(pageBgDocRef);
    portfolioData.pageBgUrl = "";
    applyPageBackground("");
    showToast("Gambar background dihapus.");
  } catch (err) {
    showToast("Gagal menghapus background: " + err.message, true);
  }
});

// Modal Login & Auth
btnAuthModal.addEventListener("click", () => {
  if (!isLoggedIn) {
    loginError.textContent = "";
    loginModal.classList.remove("hidden");
  }
});

btnCloseModal.addEventListener("click", () => loginModal.classList.add("hidden"));

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("login-email").value,
      document.getElementById("login-password").value
    );
    loginModal.classList.add("hidden");
    loginForm.reset();
    showToast("Berhasil masuk ke akun Admin.");
  } catch (err) {
    loginError.textContent = "Email atau password salah!";
  }
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await signOut(auth);
  showToast("Berhasil keluar dari akun Admin.");
});

// Upload Tugas dari Sidebar (Mendukung Link TikTok/IG/YT/Drive/PDF atau File Lokal <= 1MB)
const taskFileInput = document.getElementById("task-file-input");
taskFileInput.addEventListener("change", () => {
  const file = taskFileInput.files[0];
  if (!file) {
    document.getElementById("task-file-name").textContent = "Belum ada file dipilih";
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showToast("Ukuran file melebihi 1 MB! Gunakan link Drive/YouTube atau file <= 1MB.", true);
    taskFileInput.value = "";
    document.getElementById("task-file-name").textContent = "File ditolak (> 1MB)";
    return;
  }
  document.getElementById("task-file-name").textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
});

document.getElementById("btn-upload-task").addEventListener("click", async () => {
  if (!isLoggedIn) return;
  const title = document.getElementById("task-title-input").value.trim();
  const desc = document.getElementById("task-desc-input").value.trim();
  const externalUrl = document.getElementById("task-link-input").value.trim();
  const file = taskFileInput.files[0];

  if (!title) {
    showToast("Masukkan judul tugas terlebih dahulu.", true);
    return;
  }

  let fileData = "";
  let fileName = "";

  try {
    if (file) {
      fileData = await fileToBase64(file, 1000);
      fileName = file.name;
    }

    const newTask = {
      title,
      desc: desc || "Tidak ada deskripsi.",
      externalUrl,
      fileData,
      fileName,
      createdAt: Date.now()
    };

    const docRef = await addDoc(tasksColRef, newTask);
    taskList.unshift({ id: docRef.id, ...newTask });

    document.getElementById("task-title-input").value = "";
    document.getElementById("task-desc-input").value = "";
    document.getElementById("task-link-input").value = "";
    taskFileInput.value = "";
    document.getElementById("task-file-name").textContent = "Belum ada file dipilih";

    renderAll();
    showToast("Tugas berhasil ditambahkan dan dapat langsung dilihat!");
  } catch (err) {
    showToast("Gagal mengunggah tugas: " + err.message, true);
  }
});

// Simpan Semua Perubahan Teks
document.getElementById("btn-save-all").addEventListener("click", async () => {
  if (!(isLoggedIn && isEditMode)) return;

  document.querySelectorAll(".editable").forEach((el) => {
    portfolioData.texts[el.dataset.field] = el.textContent.trim();
  });

  const taskCards = document.querySelectorAll("#task-grid .card");
  for (const card of taskCards) {
    const id = card.dataset.id;
    const newTitle = card.querySelector(".task-title").textContent.trim();
    const newDesc = card.querySelector(".task-desc").textContent.trim();
    const existing = taskList.find((t) => t.id === id);
    if (existing && (existing.title !== newTitle || existing.desc !== newDesc)) {
      existing.title = newTitle;
      existing.desc = newDesc;
      await updateDoc(doc(db, "portofolio_tasks", id), { title: newTitle, desc: newDesc });
    }
  }

  try {
    const { bannerUrl, avatarUrl, pageBgUrl, ...profileOnlyData } = portfolioData;
    await setDoc(mainDocRef, profileOnlyData);
    updateSocialHrefs();
    showToast("Semua perubahan berhasil disimpan!");
    renderAll();
  } catch (err) {
    showToast("Gagal menyimpan: " + err.message, true);
  }
});

loadAllData();