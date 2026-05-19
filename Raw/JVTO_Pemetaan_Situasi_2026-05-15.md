# JVTO WhatsApp Operations — Pemetaan Situasi

**Tanggal:** 15 Mei 2026
**Sumber:** awal_brainstorming.txt + konteks operasional JVTO
**Tujuan dokumen:** Memetakan situasi — permasalahan, yang ingin dibangun, dan yang sudah dimiliki — secara deskriptif

---

## Bagian 1: Permasalahan

### 1.1 Antarmuka Komunikasi

WhatsApp adalah antarmuka utama JVTO ke pihak luar. Semua percakapan — customer, B2B partner, vendor, crew — berjalan melalui aplikasi ini. Tidak ada pemisahan inbox per fungsi. Satu nomor menampung semuanya.

### 1.2 Lima Fungsi yang Berjalan di Satu Channel

Lima fungsi berbeda yang saat ini berjalan di satu inbox WhatsApp:

| Fungsi | Audiens | Stage |
|---|---|---|
| Sales | Calon tamu yang belum booking (JVTO direct inquiry) | Pre-sale |
| Concierge | Tamu yang sudah bayar via JVTO direct | Post-booking → in-tour → post-tour |
| Service Desk | Tamu yang booking via Klook | Booked (sudah bayar di platform) |
| Account Management B2B | The Window Travel (agent Malaysia) | B2B partnership |
| Internal Operations | Hotel, restaurant, driver, guide | Operasional eksekusi |

Setiap fungsi memiliki:
- Tone berbeda
- Otoritas berbeda (siapa boleh memutuskan apa)
- SLA berbeda
- Ekspektasi customer berbeda

### 1.3 Penanganan Operasional

Lima fungsi tersebut ditangani oleh satu staf (Inan). Inan adalah single point of failure operasional — bus factor = 1.

Kondisi:
- Tidak ada staf cadangan terdokumentasi
- Tidak ada playbook tertulis (sebelum dokumen WAOL Mei 2026)
- Tidak ada proses onboarding cepat untuk staf pengganti
- Sam tidak punya visibilitas operasional tanpa bertanya ke Inan

### 1.4 Pola Respons Off-Hours

Tamu Eropa kirim pesan jam 02:00 WIB sering tidak terbalas sampai 08:00 WIB. Selisih 6 jam. Untuk standar respons profesional pasar Eropa, pola ini terbaca sebagai signal kurangnya profesionalisme.

### 1.5 Infrastruktur WhatsApp Gateway

WA Pro CRM yang dibangun David adalah WhatsApp gateway non-resmi (bukan Meta Cloud API official). Konsekuensi yang teridentifikasi dalam sesi:
- Nomor bisnis JVTO punya risiko di-ban kalau pola pengiriman terlalu agresif atau pola pesan terbaca botty oleh Meta

### 1.6 Catatan Insidental dari Sesi Brainstorming

Tiga hal lain yang muncul dalam percakapan:
- Kredensial database produksi pernah ditempel di chat tanpa kesadaran risiko (sudah resolved: komitmen rotate password + pakai password manager)
- Folder AppData Claude bengkak (didiagnosis, belum dibersihkan)
- Plugin hookify Claude Code bermasalah karena username Windows mengandung spasi (resolved dalam sesi: editing manifest plugin manual)

---

## Bagian 2: Yang Ingin Dibangun

Yang dituju bukan aplikasi tunggal, tapi **lapisan operasional terintegrasi di atas WhatsApp** dengan delapan fungsi:

### 2.1 Routing Otomatis Berdasarkan Nomor Masuk

Saat pesan masuk, sistem mengidentifikasi pengirim sebagai:
- Tamu Klook yang sudah booking
- Tamu JVTO yang sedang inquiry
- Tamu JVTO post-booking
- Partner Window Travel
- Vendor atau crew

Channel ini menentukan flow yang dipakai.

### 2.2 State Tracking Setiap Customer

Tahap mana customer sedang berada:
- Cold inquiry
- Qualified
- Quoted
- Booked
- Pre-tour
- In-tour
- Post-tour

Setiap state memiliki konteks dan SLA berbeda.

### 2.3 Diferensiasi & Filtering Inquiry vs Booking

Sistem membedakan:
- Mana yang perlu mata Sam (mis. pricing tinggi-nilai)
- Mana yang cukup Inan (mis. negotiating, perubahan paket kecil)
- Mana yang AI bisa handle sendiri (mis. Klook FAQ standar, auto-ack off-hours)

Inquiry tinggi-nilai (JVTO direct) tidak tercampur prioritas dengan FAQ Klook ("kapan pickup?").

### 2.4 AI sebagai Co-Pilot (Bukan Pengganti)

AI berperan:
- Menyaring (filter)
- Mengklasifikasi (intent)
- Menyiapkan draft

Manusia (Inan/Sam) yang memutuskan apa yang dikirim. Pengecualian: beberapa intent low-risk yang sudah terbukti aman di-auto-handle (mis. Klook FAQ standar, auto-ack off-hours, pickup info data-driven).

### 2.5 Pengurangan Beban Inan Terukur

Pendekatan: otomatisasi pesan berulang yang tidak butuh keputusan manusia:
- Auto-acknowledgment di luar jam kerja
- FAQ Klook
- Pickup info data-driven

Tujuan akhir: Inan hanya menyentuh pesan yang benar-benar butuh perhatiannya.

### 2.6 Pemisahan Fisik Komunikasi (3 Nomor)

Tiga nomor WhatsApp terpisah:
- Nomor customer-facing
- Nomor B2B partner
- Nomor internal operations

Context-switching antar fungsi tidak terjadi di satu inbox.

### 2.7 Visibilitas untuk Sam

Sam dapat melihat ringkasan operasional tanpa bertanya ke Inan setiap kali.

### 2.8 Pembangunan Bertahap dengan Gate Criteria

Pendekatan: bukan big-bang. Mulai dari yang paling rendah-risiko, tinggi-value (auto-acknowledgment off-hours), naik bertahap ke draft-assist, lalu auto-reply selektif. Setiap fase punya gate criteria terukur.

### 2.9 Output Dokumentasi Sesi

Dua dokumen sudah tersimpan di llm-wiki sebagai hasil brainstorming:
- `ops/2026-05-14-whatsapp-operations-playbook.md` — peta strategi & flow
- `ops/2026-05-14-whatsapp-rules-engine.md` — logika eksekusi pure untuk konsumsi AI atau staf baru

Pembangunan teknis lanjutan dilakukan di Claude Code.

---

## Bagian 3: Yang Sudah Dimiliki

### 3.1 Sumber Daya Manusia

| Orang | Peran | Catatan |
|---|---|---|
| **Sam (Agung Sambuko)** | Founder JVTO | Tourist Police aktif (Polpar/Ditpamobvit East Java). Otoritas pricing & strategic decision. |
| **Inan** | Staf full-time | Titik pusat semua operasi WhatsApp (sales, concierge, Klook, Window, vendor, crew). |
| **David** | Staf IT full-time | Pembangun WA Pro CRM dan back office Laravel. |
| **Dr. Ahmad Irwandanu** | Dokter SIP-licensed | Skrining medis untuk tour Kawah Ijen. Terdokumentasi di `people/dr-ahmad-irwandanu`. |
| **Crew** | 11 staf KTA-credentialed | 7 guide + 4 driver. Lulus pelatihan HPWKI/BBKSDA. Terdaftar di `people/crew-registry`. |

### 3.2 Infrastruktur Teknis

**WA Pro CRM** — `wa-dashboard.javavolcano-touroperator.com`
- WhatsApp gateway internal, dibangun David sendiri
- REST API v1: `send_message`, `send_image_url`, `send_file_url`, `send_template`
- Webhook untuk inbound
- Status saat ini: dipakai hanya untuk trigger outbound booking notifications

**Back Office Laravel** — `new-backoffice.javavolcano-touroperator.com`
- Aplikasi internal JVTO
- Stack: Laravel + Inertia + React
- Finance Cockpit selesai Week 3 (per `F:\BACK OFFICE\CLAUDE.md`)
- Booking Overview API endpoint berfungsi

**MySQL `u1805424_jvto_clone`** — Hostinger host 153.92.9.37
- Operational database
- Berisi: data booking, customer, transaksi

**PostgreSQL** — di JVTO website utama
- Terpisah dari MySQL back office

**Webhook Flow yang Sudah Aktif:**

```
Booking via Klook atau website JVTO
    ↓
Webhook ke WA Pro CRM
    ↓
Trigger booking ke vendor
    ↓
Notif konfirmasi ke tamu
    ↓
Input ke database
```

### 3.3 Aset Konten (llm-wiki)

Lokasi: `E:\Users\JAVA VOLCANO\llm-wiki`

**Brand Voice & Komunikasi:**
- `content/brand-voice` — panduan tone Style A + Style B, voice invariants (forbidden phrases & approved Ijen language)
- `content/copy-bank` — snippet siap-pakai
- `content/aeo-claims` — 9 claim block C1–C9 dengan evidence chain
- `content/faq-master` — FAQ AEO-formatted
- `content/operational-facts` — suhu, travel time, jam dukungan, jadwal closure Ijen

**Destinasi:**
- `destinations/kawah-ijen`
- `destinations/mount-bromo`
- `destinations/tumpak-sewu`
- `destinations/madakaripura`
- `destinations/papuma-beach`

**Produk:**
- `products/packages-full-pricing` — pricing lengkap 22 paket
- `products/packages-itineraries` — itinerary per paket

**Orang & Lisensi:**
- `people/agung-sambuko`
- `people/dr-ahmad-irwandanu`
- `people/crew-registry`
- `credentials/legal-licenses` — NIB 1102230032918, TDUP, HPWKI, BBKSDA, ISIC
- `credentials/trust-signals`

**Review Compilations:**
- Trustpilot: 51 reviews (4.8/5)
- Google Maps: 92 reviews (4.90/5)
- TripAdvisor: 21 reviews (4.95/5)
- Pattern analysis: `reviews/review-patterns`

**Policy:**
- `sources/jvto-policy-pack-v6` — booking, payment, cancellation, inclusions/exclusions, privacy

**Hotel & Vendor:**
- `content/hotels` — 23 partner hotel terdaftar per fase itinerary

**Operational Documentation:**
- `ops/ingestion-profiles`
- `ops/compilation-profiles`
- `ops/health-checks`
- `ops/2026-05-14-whatsapp-operations-playbook` (baru dari sesi)
- `ops/2026-05-14-whatsapp-rules-engine` (baru dari sesi)

### 3.4 Channel Komunikasi yang Sudah Berjalan

- **Klook** — aggregator pihak ketiga (volume tamu pre-tour FAQ)
- **The Window Travel** — partner B2B Malaysia
- **JVTO website** — sumber inquiry & direct booking langsung

### 3.5 Project Memory (CLAUDE.md Aktif)

**Global:**
- `C:\Users\JAVA VOLCANO\AppData\Roaming\Claude\local-agent-mode-sessions\...\.claude\CLAUDE.md`
- Berisi: preferensi pribadi (ruthless mentor, naming convention YYYY-MM-DD)

**Wiki:**
- `E:\Users\JAVA VOLCANO\llm-wiki\CLAUDE.md`
- Berisi: schema wiki, workflow ingest/query/lint, content production guidelines

**Back Office:**
- `F:\BACK OFFICE\CLAUDE.md`
- Berisi: sprint terakhir Finance Cockpit Week 3, gstack skills, build status
- Open items: `php artisan key:generate` & `migrate` belum dijalankan

### 3.6 File yang Dimodifikasi dalam Sesi Brainstorming

**Dibuat:**
- `E:\Users\JAVA VOLCANO\llm-wiki\wiki\ops\2026-05-14-whatsapp-operations-playbook.md`
- `E:\Users\JAVA VOLCANO\llm-wiki\wiki\ops\2026-05-14-whatsapp-rules-engine.md`
- `C:\Users\JAVA VOLCANO\Downloads\hooks-FIXED.json` (perbaikan plugin Claude Code hookify)

**Diupdate:**
- `E:\Users\JAVA VOLCANO\llm-wiki\wiki\index.md`
- `E:\Users\JAVA VOLCANO\llm-wiki\wiki\log.md`

---

## Bagian 4: Ringkasan Tabel Status

| Aspek | Status |
|---|---|
| Antarmuka komunikasi utama | WhatsApp, satu nomor |
| Jumlah fungsi yang berjalan di inbox | 5 |
| Jumlah orang yang menangani | 1 (Inan) |
| Backup operator terdokumentasi | Tidak ada |
| Visibilitas Sam ke operasi | Lewat Inan |
| Pola respons off-hours customer Eropa | Selisih ~6 jam |
| Gateway WhatsApp | WA Pro CRM (non-official) |
| Database utama | MySQL Hostinger + PostgreSQL website |
| Back office | Laravel + Inertia + React (Finance Cockpit selesai) |
| Webhook flow booking | Aktif (Klook/website → WA Pro CRM → vendor → tamu → DB) |
| Wiki content knowledge base | Brand voice, destinasi, produk, lisensi, review, policy |
| Crew terdaftar | 11 KTA-credentialed |
| Hotel partner | 23 |
| Paket tour | 22 dengan pricing & itinerary lengkap |
| Dokumen playbook WhatsApp | 2 dokumen tersimpan di llm-wiki |
| Pembangunan teknis WAOL | Dilanjutkan di Claude Code |

---

*Dokumen ini bersifat deskriptif.*
