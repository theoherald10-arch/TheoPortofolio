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
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy
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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Sesi login tetap bertahan meski browser di-refresh/ditutup sampai Logout ditekan
setPersistence(auth, browserLocalPersistence);

// Dokumen terpisah di Firestore agar masing-masing punya kapasitas penuh
const mainDocRef = doc(db, "portofolio", "mainProfile");
const bannerDocRef = doc(db, "portofolio", "bannerMedia");
const avatarDocRef = doc(db, "portofolio", "avatarMedia");
const tasksColRef = collection(db, "portofolio_tasks");

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB (1.048.576 bytes)

let portfolioData = {
  bgColor: "#1c1512",
  bannerUrl: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  texts: {
    logo: "Theo.",
    sidebarUploadTitle: "Upload Tugas Baru",
    profileName: "Theo",
    profileRole: "Web Developer & UI/UX Enthusiast",
    profileBio: "Selamat datang di portofolio saya. Klik tombol Admin di sidebar untuk mengubah foto profil, banner, dan seluruh teks di halaman ini.",
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
    headingTugas: "Koleksi Tugas & Karya",
    descTugas: "Kumpulan file tugas dan proyek yang diunggah melalui panel sidebar.",
    headingKontak: "Kontak & Media Sosial",
    descKontak: "Hubungi saya langsung melalui WhatsApp atau ikuti kanal media sosial saya:",
    footerText: "© 2026 Theo. Dibuat dengan VS Code, GitHub & Firebase."
  },
  skills: ["HTML5", "CSS3", "JavaScript", "Firebase", "Git & GitHub", "UI/UX Design"],
  socials: {
    wa: "6281234567890",
    yt: "https://youtube.com/@username",
    tt: "https://tiktok.com/@username"
  }
};

let taskList = [];
let isAdmin = false;

// Elemen DOM
const adminToolbar = document.getElementById("admin-toolbar");
const bgColorPicker = document.getElementById("bg-color-picker");
const btnAuthModal = document.getElementById("btn-auth-modal");
const loginModal = document.getElementById("login-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const sidebarUploadBox = document.getElementById("sidebar-upload-box");
const socialEditBox = document.getElementById("social-edit-box");

// Fungsi validasi & konversi file <= 1MB ke Base64 Data URL
function fileToBase64(file, maxWidth = 1280) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error("Ukuran file melebihi 1 MB! Pilih file dengan ukuran maksimal 1 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file."));

    // Jika file adalah gambar, kompres ringan agar aman masuk batas dokumen Firestore
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

          // Format JPEG/WebP dengan kualitas 0.8 agar ukuran Base64 di bawah 900KB
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
      // Untuk file non-gambar (PDF, DOCX, ZIP, dll.)
      reader.onload = (event) => {
        const result = event.target.result;
        if (result.length > 1000000) {
          reject(new Error("File terlalu besar setelah encoding. Gunakan file di bawah 700 KB atau format gambar."));
        } else {
          resolve(result);
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// 1. Muat Semua Data dari Firestore
async function loadAllData() {
  try {
    const [mainSnap, bannerSnap, avatarSnap, tasksSnap] = await Promise.all([
      getDoc(mainDocRef),
      getDoc(bannerDocRef),
      getDoc(avatarDocRef),
      getDocs(query(tasksColRef, orderBy("createdAt", "desc")))
    ]);

    if (mainSnap.exists()) {
      const saved = mainSnap.data();
      portfolioData = {
        ...portfolioData,
        ...saved,
        texts: { ...portfolioData.texts, ...(saved.texts || {}) },
        socials: { ...portfolioData.socials, ...(saved.socials || {}) }
      };
    }

    if (bannerSnap.exists() && bannerSnap.data().url) {
      portfolioData.bannerUrl = bannerSnap.data().url;
    }

    if (avatarSnap.exists() && avatarSnap.data().url) {
      portfolioData.avatarUrl = avatarSnap.data().url;
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

// 2. Render Tampilan
function renderAll() {
  document.documentElement.style.setProperty("--bg", portfolioData.bgColor);
  bgColorPicker.value = portfolioData.bgColor;

  document.getElementById("banner-img").src = portfolioData.bannerUrl;
  document.getElementById("avatar-img").src = portfolioData.avatarUrl;

  document.querySelectorAll(".editable").forEach((el) => {
    const field = el.dataset.field;
    if (portfolioData.texts[field] !== undefined) {
      el.textContent = portfolioData.texts[field];
    }
    el.contentEditable = isAdmin ? "true" : "false";
  });

  // Render Skill
  const skillList = document.getElementById("skill-list");
  skillList.innerHTML = "";
  portfolioData.skills.forEach((skill, idx) => {
    const badge = document.createElement("div");
    badge.className = "skill-badge";
    badge.innerHTML = `
      <span class="skill-text" contenteditable="${isAdmin}">${skill}</span>
      ${isAdmin ? `<button class="btn-del-mini" data-idx="${idx}">×</button>` : ""}
    `;
    skillList.appendChild(badge);
  });

  if (isAdmin) {
    document.querySelectorAll(".btn-del-mini").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        portfolioData.skills.splice(Number(e.target.dataset.idx), 1);
        renderAll();
      });
    });
  }

  // Render Daftar Tugas
  const taskGrid = document.getElementById("task-grid");
  taskGrid.innerHTML = "";
  taskList.forEach((task) => {
    const isImage = task.fileData && task.fileData.startsWith("data:image/");
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = task.id;
    card.innerHTML = `
      ${isAdmin ? `<button class="btn-delete-card" data-id="${task.id}">Hapus</button>` : ""}
      ${isImage ? `<img src="${task.fileData}" alt="${task.title}" class="task-preview-img" />` : ""}
      <h3 class="task-title" contenteditable="${isAdmin}">${task.title}</h3>
      <p class="task-desc" contenteditable="${isAdmin}">${task.desc}</p>
      ${task.fileData ? `<a href="${task.fileData}" download="${task.fileName || "tugas"}" class="task-file-link">⬇️ Unduh (${task.fileName || "File"})</a>` : ""}
    `;
    taskGrid.appendChild(card);
  });

  if (isAdmin) {
    document.querySelectorAll("#task-grid .btn-delete-card").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Hapus tugas ini secara permanen?")) return;
        try {
          await deleteDoc(doc(db, "portofolio_tasks", id));
          taskList = taskList.filter((t) => t.id !== id);
          renderAll();
        } catch (err) {
          alert("Gagal menghapus tugas: " + err.message);
        }
      });
    });
  }

  // Render Kontak
  const waClean = portfolioData.socials.wa.replace(/[^0-9]/g, "");
  document.getElementById("link-wa").href = `https://wa.me/${waClean}`;
  document.getElementById("display-wa").textContent = `+${waClean}`;

  document.getElementById("link-yt").href = portfolioData.socials.yt;
  document.getElementById("display-yt").textContent = portfolioData.socials.yt;

  document.getElementById("link-tt").href = portfolioData.socials.tt;
  document.getElementById("display-tt").textContent = portfolioData.socials.tt;

  document.getElementById("input-wa").value = portfolioData.socials.wa;
  document.getElementById("input-yt").value = portfolioData.socials.yt;
  document.getElementById("input-tt").value = portfolioData.socials.tt;
}

// 3. Pantau Status Login Admin
onAuthStateChanged(auth, (user) => {
  isAdmin = !!user;
  const adminElements = [
    adminToolbar,
    sidebarUploadBox,
    socialEditBox,
    document.getElementById("btn-edit-banner"),
    document.getElementById("btn-edit-avatar"),
    document.getElementById("btn-add-skill")
  ];

  adminElements.forEach((el) => {
    if (isAdmin) el.classList.remove("hidden");
    else el.classList.add("hidden");
  });

  btnAuthModal.textContent = isAdmin ? "Admin ✓" : "Admin";
  renderAll();
});

btnAuthModal.addEventListener("click", () => {
  if (!isAdmin) {
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
  } catch (err) {
    loginError.textContent = "Email atau password salah!";
  }
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await signOut(auth);
});

bgColorPicker.addEventListener("input", (e) => {
  portfolioData.bgColor = e.target.value;
  document.documentElement.style.setProperty("--bg", e.target.value);
});

// Upload Banner (Maks 1MB) -> Langsung simpan ke Firestore dokumen terpisah
document.getElementById("input-banner-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !isAdmin) return;
  try {
    const base64 = await fileToBase64(file, 1280);
    await setDoc(bannerDocRef, { url: base64 });
    portfolioData.bannerUrl = base64;
    document.getElementById("banner-img").src = base64;
    alert("Banner berhasil diperbarui dan disimpan!");
  } catch (err) {
    alert(err.message);
  }
  e.target.value = "";
});

// Upload Foto Profil (Maks 1MB) -> Langsung simpan ke Firestore dokumen terpisah
document.getElementById("input-avatar-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !isAdmin) return;
  try {
    const base64 = await fileToBase64(file, 500);
    await setDoc(avatarDocRef, { url: base64 });
    portfolioData.avatarUrl = base64;
    document.getElementById("avatar-img").src = base64;
    alert("Foto profil berhasil diperbarui dan disimpan!");
  } catch (err) {
    alert(err.message);
  }
  e.target.value = "";
});

// Tambah Skill
document.getElementById("btn-add-skill").addEventListener("click", () => {
  portfolioData.skills.push("Skill Baru");
  renderAll();
});

// Upload Tugas dari Sidebar (Maks 1MB per file)
const taskFileInput = document.getElementById("task-file-input");
taskFileInput.addEventListener("change", () => {
  const file = taskFileInput.files[0];
  if (!file) {
    document.getElementById("task-file-name").textContent = "Belum ada file dipilih (Maks 1MB)";
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    alert("Ukuran file melebihi 1 MB! Silakan pilih file maksimal 1 MB.");
    taskFileInput.value = "";
    document.getElementById("task-file-name").textContent = "File ditolak (> 1MB)";
    return;
  }
  document.getElementById("task-file-name").textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
});

document.getElementById("btn-upload-task").addEventListener("click", async () => {
  if (!isAdmin) return;
  const title = document.getElementById("task-title-input").value.trim();
  const desc = document.getElementById("task-desc-input").value.trim();
  const file = taskFileInput.files[0];

  if (!title) {
    alert("Masukkan judul tugas terlebih dahulu.");
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
      fileData,
      fileName,
      createdAt: Date.now()
    };

    const docRef = await addDoc(tasksColRef, newTask);
    taskList.unshift({ id: docRef.id, ...newTask });

    document.getElementById("task-title-input").value = "";
    document.getElementById("task-desc-input").value = "";
    taskFileInput.value = "";
    document.getElementById("task-file-name").textContent = "Belum ada file dipilih (Maks 1MB)";

    renderAll();
    alert("Tugas berhasil diunggah dan tersimpan!");
  } catch (err) {
    alert("Gagal mengunggah tugas: " + err.message);
  }
});

// Simpan Perubahan Teks, Skill, & Kontak
document.getElementById("btn-save-all").addEventListener("click", async () => {
  if (!isAdmin) return;

  document.querySelectorAll(".editable").forEach((el) => {
    portfolioData.texts[el.dataset.field] = el.textContent.trim();
  });

  const updatedSkills = [];
  document.querySelectorAll("#skill-list .skill-text").forEach((el) => {
    updatedSkills.push(el.textContent.trim());
  });
  portfolioData.skills = updatedSkills;

  portfolioData.socials.wa = document.getElementById("input-wa").value.trim();
  portfolioData.socials.yt = document.getElementById("input-yt").value.trim();
  portfolioData.socials.tt = document.getElementById("input-tt").value.trim();

  // Simpan perubahan teks jika ada judul/deskripsi kartu tugas yang diedit langsung
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
    // Simpan profil utama tanpa menyertakan gambar besar agar tetap ringan
    const { bannerUrl, avatarUrl, ...profileOnlyData } = portfolioData;
    await setDoc(mainDocRef, profileOnlyData);
    alert("Semua perubahan teks dan pengaturan berhasil disimpan!");
    renderAll();
  } catch (err) {
    alert("Gagal menyimpan: " + err.message);
  }
});

loadAllData();