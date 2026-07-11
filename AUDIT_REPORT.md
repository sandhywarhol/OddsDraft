# OddsDraft — Audit Report

**Project:** oddsdraft.fun (TxOdds Hackathon — Consumer & Fan Experiences track)
**Stack:** Next.js 15/16 · Solana (Anchor + web3.js) · Supabase · TxLINE · Vercel Edge · Telegram Bot
**Tanggal audit:** 10 Juli 2026
**Scope:** Keamanan, logika fantasy point, integrasi TxLINE, konsistensi arsitektur on-chain, UX, kesiapan demo.

---

## Ringkasan Eksekutif

OddsDraft adalah produk yang ambisius dan fitur-lengkap: parsing event live dari TxLINE, mesin scoring per-posisi yang matang, sistem kartu koleksi 8-tier, komentator NPC, dan bot Telegram. Dari sisi *product experience*, ini sangat kuat untuk sebuah hackathon.

Namun ada **satu masalah arsitektur inti** yang harus kamu pahami sebelum demo: **narasi "semuanya on-chain" tidak sesuai dengan kode yang benar-benar berjalan.** Alur yang aktif adalah kustodian (treasury wallet biasa) dengan **beberapa endpoint pembayaran yang tidak terlindungi**, sehingga secara teori prize pool bisa dikuras. Untuk hackathon dengan SOL devnet ini bukan bencana, tapi juri teknis kemungkinan besar akan menanyakannya — jadi lebih baik kamu yang mengangkat topik ini lebih dulu dan membingkainya sebagai roadmap.

Prioritas: perbaiki 3 celah pembayaran (P0) sebelum ada uang sungguhan; selaraskan klaim "on-chain" dengan realita; sisanya bisa masuk roadmap.

---

## Temuan Kritis (P0) — perbaiki sebelum menyentuh mainnet / uang nyata

### 1. `/api/prize/submit` tidak punya autentikasi
`src/app/api/prize/submit/route.ts` menerima `leaderboard`, `rank`, dan `participantCount` langsung dari body request tanpa verifikasi apa pun. Server memang menghitung `prize_sol` sendiri lewat `getPrizeForRank()` (bagus, klien tidak menetapkan nominal), **tetapi klien menentukan siapa yang rank 1 dan berapa jumlah peserta.** Artinya penyerang cukup mengirim:

```json
{ "fixtureId": "...", "contestType": "wta", "participantCount": 100,
  "leaderboard": [{ "walletAddress": "<wallet_penyerang>", "rank": 1, "points": 9999 }] }
```

lalu hasilnya tersimpan di `contest_results` sebagai pemenang. Karena `upsert(..., { ignoreDuplicates: true })`, **submission pertama yang menang** — penyerang bisa mengunci hasil lebih dulu.

**Dampak:** Kombinasi dengan temuan #2 → penyerang bisa menjadi "pemenang" dan menarik seluruh prize pool dari treasury.
**Fix:** Endpoint ini harus server-authoritative — server menghitung leaderboard sendiri dari event TxLINE + entry tersimpan, bukan menerima dari klien. Minimal: lindungi dengan `CRON_SECRET`/service-role dan hanya boleh dipanggil dari server job, bukan browser.

### 2. `/api/contest/enter` tidak memverifikasi pembayaran on-chain
`entryTxSig` diterima dan disimpan (`entry_tx_sig`) tetapi **tidak pernah divalidasi** — tidak ada `getTransaction()`/`getParsedTransaction()` untuk mengecek bahwa transfer 0.01 SOL ke treasury benar-benar terjadi, dari wallet yang benar, untuk fixture yang benar, dan belum pernah dipakai. Validasi lineup sudah bagus dan menyeluruh, tapi *pembayaran*-nya tidak ditegakkan.

**Dampak:** Siapa pun bisa masuk kontes berbayar tanpa membayar (kirim `entryTxSig: null` atau sig ngawur). Merusak integritas prize pool.
**Fix:** Verifikasi tanda tangan on-chain server-side: konfirmasi transfer, jumlah, tujuan (treasury), pengirim (walletAddress), dan simpan sig sebagai *nonce* unik agar tidak bisa dipakai ulang.

### 3. Skor fantasy dihitung di sisi klien lalu dipercaya begitu saja
Leaderboard dan poin dihitung di browser (`src/app/live/[contestId]/page.tsx`) dan dikirim ke `/api/prize/submit` apa adanya. Tidak ada perhitungan ulang di server dari event TxLINE mentah. Field `total_points` bahkan ada di skema tapi kebenarannya bergantung pada klien.

**Dampak:** Poin bisa dipalsukan sepenuhnya; menggabungkan ini dengan #1 membuat "menang" jadi trivial.
**Fix:** Pindahkan perhitungan skor akhir ke server (mesin `fantasy-engine.ts` sudah murni/portabel — jalankan di server dari snapshot event TxLINE yang terkonfirmasi).

### 4. Hot wallet treasury melindungi payout dengan endpoint tanpa auth
`TREASURY_WALLET_SECRET_KEY` (secret key wallet panas) dimuat di `/api/prize/claim` dan mengirim SOL. Endpoint ini **tidak memverifikasi bahwa pemanggil memiliki wallet** yang mengklaim (tidak ada signature/`signMessage`). Dana memang dikirim ke `walletAddress` yang ada di DB (jadi tidak bisa dibelokkan), **tetapi** karena temuan #1 membiarkan penyerang menaruh wallet sendiri sebagai pemenang, gabungannya = treasury bisa dikuras.
**Fix:** Wajibkan bukti kepemilikan wallet (tanda tangan pesan) pada `claim`, plus perbaiki #1–#3.

---

## Temuan Tinggi (P1)

### 5. Klaim "everything on-chain" tidak sesuai kode yang berjalan
README & SUBMISSION.md menyatakan *"Everything — entry, leaderboard, payout — runs on-chain."* Realitanya:

- **Entry** = `SystemProgram.transfer` biasa 0.01 SOL ke `NEXT_PUBLIC_TREASURY_WALLET` (`lineup/[contestId]/page.tsx`), **bukan** instruksi Anchor `join_contest`.
- **Payout** = transfer kustodian dari treasury via `/api/prize/claim`, berdasarkan data Supabase.
- Program Anchor (`oddsdraft_program`: `initialize_contest`/`join_contest`/`resolve_contest` dengan prize pool PDA) **ada di repo tapi tidak dipanggil di mana pun oleh aplikasi.** Tidak ada `initializeContest`/`joinContest` yang dipakai frontend.

**Dampak:** Risiko kredibilitas di depan juri teknis. Ini custodial/off-chain dengan program on-chain yang belum tersambung.
**Rekomendasi:** Ubah bahasa jadi jujur — "entry & payout dijalankan lewat treasury on Solana devnet hari ini; program escrow on-chain sudah ditulis dan menjadi milestone berikutnya." Kejujuran ini justru memperkuat pitch, bukan melemahkannya.

### 6. Supabase RLS terbuka + anon key publik
`supabase-schema.sql` memakai policy `with check (true)` untuk insert/upsert, dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` terekspos ke browser. Artinya siapa pun bisa menulis langsung ke `contest_entries`/`users` **melewati** validasi API sama sekali.
**Fix:** Ketatkan RLS (tulis hanya lewat service-role di server), atau jadikan tabel hasil/entry write-only via server.

### 7. Kartu skill memengaruhi poin tapi disimpan di localStorage + RNG `Math.random()`
`card-collection.ts` memakai `Math.random()` untuk drop rarity, dan koleksi disimpan di `localStorage`. Kartu memberi bonus poin flat (mis. Legendary Striker +5/goal). Karena tersimpan di klien dan skor dihitung di klien (#3), pemain bisa menyunting localStorage untuk memberi diri sendiri kartu Mythic/SSSR.
**Fix:** Setelah skor pindah ke server, bonus kartu juga harus divalidasi server-side dari kepemilikan yang tercatat. RNG kosmetik boleh tetap `Math.random()`, tapi kepemilikan harus otoritatif di server.

### 8. Default RPC `mainnet-beta` pada jalur payout
`prize/claim` fallback ke `https://api.mainnet-beta.solana.com` jika `NEXT_PUBLIC_SOLANA_RPC` tidak diset, sementara entry berjalan di devnet. Ketidakcocokan jaringan bisa membuat klaim gagal atau (jika treasury didanai mainnet) mengirim SOL nyata.
**Fix:** Samakan sumber jaringan lewat satu variabel; jangan pakai default mainnet pada jalur uang.

---

## Temuan Sedang (P2)

### 9. Token TxLINE publik masih ada meski proxy sudah dibangun
SUBMISSION menyatakan *"TxLINE tokens never exposed to browser."* Proxy edge (`api/txline/[...path]`) memang bagus dan lebih memilih `TXODDS_API_TOKEN` server-side, **tetapi** `NEXT_PUBLIC_TXODDS_API_TOKEN` masih ada sebagai fallback dan bisa terekspos ke bundle browser. Selaraskan klaim vs realita: hapus fallback publik bila memang ingin token benar-benar tersembunyi.

### 10. Program Anchor `resolve_contest` rapuh & manipulasi lamport manual
`lib.rs` mengurangi lamport PDA secara manual tanpa menjamin sisa rent-exempt, dan mengandung komentar setengah-jadi (`// wait, get_lamports is...`). Berpotensi mem-*brick* akun contest atau gagal transfer. Program juga belum ada test. Karena tidak dipakai app, ini "utang" yang tersembunyi — perlu diselesaikan sebelum benar-benar dipakai on-chain.

### 11. Kebersihan repo & artefak scratch ikut ter-commit
File scratch masih ada di root: `fix.py`, `swap.js`, `block.txt`, `add_grid_classes.js`, `screenshot.js`, `check_db.js`. `supabase-schema.sql` juga menaruh URL/ref project Supabase asli di komentar. Bersihkan sebelum juri membuka repo.

### 12. Inkonsistensi biaya entry di dokumentasi
Komentar `supabase-schema.sql` menyebut *"0.1 SOL payment"*, sementara kode & README memakai **0.01 SOL** (`ENTRY_FEE_SOL = 0.01`). Samakan agar tidak membingungkan.

---

## Temuan Rendah / Catatan Positif

- **Deteksi dual-path TxLINE** (SSE events + delta `PlayerStats`) benar-benar rapi dan merupakan solusi tepat untuk masalah `PlayerName` kosong — ini layak jadi sorotan pitch.
- **Filter `Confirmed`** untuk menghindari poin dari gol yang dibatalkan VAR menunjukkan pemahaman domain yang matang.
- **Scoring bank** (`scoring-bank.ts`) sebagai single source of truth, poin per-posisi, dan bonus statistik half-time/full-time dirancang dengan baik dan mudah diaudit.
- **`fantasy-engine.ts`** murni dan deterministik — sangat siap dipindah ke server (justru memudahkan perbaikan #3).
- Ada file test (`src/__tests__/fantasy-analytics.test.ts`) — bagus, tapi perlu diperluas ke jalur pembayaran & scoring.
- Deduplikasi event (content-key, bukan Seq) di cron menunjukkan penanganan edge-case double-send TxLINE yang teliti.

---

## Daftar Prioritas Perbaikan

| Prioritas | Item | Effort | Kenapa |
|-----------|------|--------|--------|
| P0 | Jadikan `/api/prize/submit` server-authoritative (hitung leaderboard di server) | Sedang | Cegah pemenang palsu |
| P0 | Verifikasi `entryTxSig` on-chain di `/api/contest/enter` | Kecil–Sedang | Tegakkan pembayaran |
| P0 | Pindah perhitungan skor final ke server | Sedang | Cegah poin palsu |
| P0 | Wajibkan signature kepemilikan wallet di `/api/prize/claim` | Kecil | Amankan hot wallet |
| P1 | Selaraskan narasi "on-chain" dengan realita (atau sambungkan program Anchor) | Kecil (teks) / Besar (integrasi) | Kredibilitas juri |
| P1 | Ketatkan Supabase RLS | Kecil | Tutup penulisan langsung |
| P1 | Samakan jaringan RPC, buang default mainnet | Kecil | Cegah salah kirim SOL |
| P2 | Hapus fallback token publik TxLINE | Kecil | Konsistensi klaim keamanan |
| P2 | Bersihkan file scratch & rahasia di komentar | Kecil | Kerapian repo |
| P2 | Perbaiki/uji `resolve_contest` Anchor | Sedang | Sebelum dipakai on-chain |

---

## Kesimpulan

Dari sisi pengalaman dan integrasi TxLINE, OddsDraft adalah entri hackathon yang kuat — deteksi event dual-path dan mesin scoring-nya benar-benar bagus. Kelemahan utamanya adalah **lapisan kepercayaan pembayaran** (payment trust): jalur uang saat ini custodial dan beberapa endpoint kritis tidak terlindungi, sementara narasi memasarkannya sebagai fully on-chain. Untuk demo devnet ini tidak menggagalkan, tapi angkat sendiri topik ini di depan juri dan bingkai perbaikannya sebagai roadmap — itu akan terlihat jauh lebih kuat daripada bila juri yang menemukannya.
