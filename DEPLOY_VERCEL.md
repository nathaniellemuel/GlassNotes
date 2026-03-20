# Deploy to Vercel - Step by Step Guide

## ✅ Setup sudah siap! Ini cara deploy:

---

## 📋 **Step 1: Push ke GitHub**

```bash
# Di folder GlassNotes
git add .
git commit -m "add vercel serverless function for AI"
git push origin main
```

---

## 🚀 **Step 2: Deploy ke Vercel**

### Pilihan A: Pakai Website (Paling Mudah)

1. Buka https://vercel.com
2. **Login** dengan GitHub (atau email)
3. Klik **"Add New..."** → **"Project"**
4. Pilih repository `glassnotes`
5. Klik **"Import"**
6. Di bagian **Environment Variables**, tambahkan:
   ```
   Variable Name: ANTHROPIC_API_KEY
   Value: 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
   ```
7. Klik **"Deploy"** → tunggu 2-3 menit

### Pilihan B: Pakai Vercel CLI (untuk developer)

```bash
# Install Vercel CLI (global)
npm install -g vercel

# Di folder GlassNotes
vercel

# Follow prompts:
# - Choose organization: select yours
# - Name: glassnotes (atau name lain)
# - Root directory: ./
# - Build: default
# - Output directory: auto

# Set environment variable saat proses atau di dashboard
```

---

## 🔑 **Step 3: Set Environment Variable**

Jika belum set saat deploy:

1. Buka dashboard Vercel: https://vercel.com/dashboard
2. Pilih project **glassnotes**
3. Klik **Settings** → **Environment Variables**
4. Klik **"Add"** dan set:
   ```
   Key: ANTHROPIC_API_KEY
   Value: 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
   ```
5. **Redeploy** (klik **Deployments** → last one → **Redeploy**)

---

## 🎯 **Step 4: Update App Config**

Setelah deploy selesai:

1. Di Vercel dashboard, cari **Production URL** (contoh: `https://glassnotes-xyz.vercel.app`)
2. Update file `.env` di folder app:
   ```
   EXPO_PUBLIC_API_URL=https://glassnotes-xyz.vercel.app
   ```
3. Push ke GitHub:
   ```bash
   git add .env
   git commit -m "update api url to vercel"
   git push
   ```

---

## ✨ **Step 5: Test**

Sekarang tinggal jalankan app:

```bash
npx expo start --android
```

**Tidak perlu server lokal lagi!** Backend sudah berjalan di Vercel cloud.

---

## 🧪 **Troubleshooting**

### "502 Bad Gateway" atau "500 Error"
- Check API key benar di Vercel settings
- Redeploy: klik Deployments → Redeploy

### "Cannot reach API"
- Pastikan `EXPO_PUBLIC_API_URL` benar di `.env`
- Vercel URL format: `https://project-name.vercel.app` (HTTPS, tanpa `/`)

### API key not working
- Copy-paste exact dari console Anthropic: https://console.anthropic.com/
- Pastikan tidak ada space atau karakter tambahan

---

## 📊 **Ya Jadi Gini, Struktur File**

```
GlassNotes/
├── vercel.json                 ← Konfigurasi Vercel ✓
├── .env                        ← Update dengan Vercel URL nanti ✓
├── api/
│   └── ai.ts                  ← Express handler untuk Vercel ✓
├── app/
│   └── editor.tsx             ← App Expo
├── components/
│   ├── ai-editor.tsx
│   ├── list-type-picker.tsx
│   └── ...
└── package.json               ← Added express, cors, @anthropic-ai/sdk ✓
```

---

## 📝 **Ringkas Proses**

1. **Push code ke GitHub** (sudah siap)
2. **Login Vercel** → Import project
3. **Set `ANTHROPIC_API_KEY`** di Environment Variables
4. **Deploy** (otomatis)
5. **Copy production URL** (contoh: `https://glassnotes-xyz.vercel.app`)
6. **Update `.env`** di app dengan URL tersebut
7. **Run app**: `npx expo start --android`

**Total waktu: ~5 menit** 🎉

---

## 🤔 **FAQ**

**Q: Apakah gratis?**
A: Ya, Vercel free tier support 100 GB bandwidth per bulan, cukup untuk personal.

**Q: Apakah perlu server lokal terus?**
A: Tidak! Sekali deploy, backend sudah di cloud. Cuma jalankan Expo app saja.

**Q: Bagaimana kalau mau update backend?**
A: Cukup push ke GitHub, Vercel otomatis redeploy.

**Q: Apakah aman harus set API key di Vercel?**
A: Ya, Vercel encrypt environment variables. Lebih aman daripada hardcode di app.

---

**Siap deploy! Follow steps di atas.** ✅
