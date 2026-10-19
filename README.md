# Environmental Heroes - Android Project

Proyek ini adalah porting Android untuk game RPG Maker MZ **Environmental Heroes** menggunakan Capacitor & Android SDK 34.

---

## 📁 Struktur Folder Proyek

```
Environmental Heroes/
├── game/                    <=== [TEMPAT ASET GAME]
│   ├── audio/               (Audio, BGM, BGS, SE, ME)
│   ├── css/                 (CSS style game)
│   ├── data/                (Data JSON RPG Maker)
│   ├── effects/             (Efek visual Effekseer)
│   ├── fonts/               (Font game)
│   ├── icon/                (Icon game)
│   ├── img/                 (Grafis & tileset)
│   ├── js/                  (Script JS & plugin)
│   ├── movies/              (Video cutscene)
│   └── index.html           (Entry point web game)
│
├── android/                 (Proyek Android native / Gradle)
├── _docs/                   (File presentasi, zip, backup plugins, & dokumen referensi)
├── scripts/                 (Script otomasi build & generate icon/splash)
├── www/                     (Aset terkompilasi siap bungkus)
├── EnvironmentalHeroes.apk  (File APK siap install ke HP)
├── capacitor.config.json    (Konfigurasi Capacitor)
└── package.json             (NPM dependencies & scripts)
```

---

## 🚀 Cara Update Game di Masa Depan

Jika Anda mengedit game di **RPG Maker MZ** dan melakukan export/deployment baru:

1. **Copy semua file hasil export RPG Maker MZ** dan **paste / replace langsung ke dalam folder `game/`**.
2. Buka terminal di folder proyek ini, lalu jalankan:
   ```bash
   npm run build:apk
   ```
3. Script otomatis akan:
   - Menyinkronkan file dari `game/` ke `www/` dan `android/`
   - Mengompilasi APK terbaru
   - Mengupdate file `EnvironmentalHeroes.apk` di root folder.
4. Untuk langsung install ke HP yang tersambung via USB debugging (ADB):
   ```bash
   npm run install:apk
   ```

---

## 🛠️ Perintah Berguna (NPM Scripts)

| Perintah | Fungsi |
|---|---|
| `npm run build:apk` | Sync aset dan build file `EnvironmentalHeroes.apk` |
| `npm run install:apk` | Install langsung APK ke HP via ADB (`adb install -r`) |
| `npm run compress` | Optimasi & kompres gambar ke WebP, bersihkan audio unused, & kompres video |
| `npm run sync` | Hanya menyinkronkan aset dari `game/` ke proyek Android |
| `npm run icons` | Generate ulang icon launcher & splash screen gelap |

---

## ✨ Fitur Mobile Game Best Practice

1. **Layar Anti-Mati (*Keep Screen On*)**: Layar tidak akan mati sendiri saat pemain membaca dialog panjang.
2. **Splash Screen Gelap Elegan**: Tidak ada layar putih silau saat pembukaan game.
3. **Hardware Back Button Android**:
   - Menekan tombol Back sekali akan menutup menu atau cancel pilihan di dalam game (meniru tombol Cancel/Escape).
   - Menekan tombol Back 2 kali akan memunculkan konfirmasi keluar game dengan aman.
4. **Layar Penuh Landscape**: Terkunci di orientasi horizontal (`sensorLandscape`) dengan fullscreen sticky immersive tanpa gangguan status bar / navigation bar.
5. **Autoplay Audio**: Suara latar dan sound effects langsung berjalan tanpa kendala restriksi WebView.
