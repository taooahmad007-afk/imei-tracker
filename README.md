# 📱 USA Mobile Zone — IMEI Tracker
### Muzaffarabad Stolen Phone Verification System

---

## 🚀 What's Included

| File | Purpose |
|------|---------|
| `index.html` | Public IMEI Check page |
| `report.html` | Public stolen phone submission form |
| `admin.html` | Admin panel (login protected) |
| `style.css` | All styles (mobile-first, Urdu+English) |
| `app.js` | All page logic |
| `db.js` | Database layer (localStorage — swappable) |

---

## 🔐 Default Admin Credentials

```
Username: admin
Password: admin123
```

⚠️ **Change these in `db.js`** before going live:
```js
const ADMIN_CREDENTIALS = {
  username: 'YourUsername',
  password: 'YourStrongPassword'
};
```

---

## 🌐 FREE Deployment (Step by Step)

### Option A — GitHub Pages (Recommended, 100% Free)

1. Go to https://github.com → Sign up / Login
2. Click **New Repository**
   - Name: `imei-tracker`
   - Set to **Public**
   - Click "Create repository"
3. Upload all 6 files (`index.html`, `report.html`, `admin.html`, `style.css`, `app.js`, `db.js`)
   - Click "uploading an existing file" link
   - Drag and drop all files → Click **Commit changes**
4. Go to **Settings** → **Pages**
5. Under "Source" select **Deploy from a branch**
6. Select branch: `main`, folder: `/ (root)` → Click **Save**
7. Your site will be live at:
   `https://YOUR-USERNAME.github.io/imei-tracker/`

### Option B — Netlify (Drag & Drop, even easier)

1. Go to https://netlify.com → Sign up free
2. On dashboard, find **"Sites"** section
3. Drag your entire folder into the page
4. Done! You get a free URL like `https://amazing-name.netlify.app`
5. Optional: set a custom name in Site Settings

---

## 📊 Upgrading to Firebase (Optional — for shared database)

Currently the system uses **localStorage** (data stays on each device).
To share data across all devices/computers, use Firebase:

### Setup Firebase (Free Tier)

1. Go to https://console.firebase.google.com
2. Create project → Enable **Firestore Database**
3. Replace functions in `db.js` with Firebase calls:

```js
// Replace dbAddRecord with:
async function dbAddRecord(record) {
  const db = firebase.firestore();
  const ref = await db.collection('phones').add({
    ...record,
    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

// Replace dbCheckIMEI with:
async function dbCheckIMEI(imei) {
  const db = firebase.firestore();
  const snap = await db.collection('phones')
    .where('imei', '==', imei)
    .where('status', '==', 'approved')
    .limit(1).get();
  return snap.empty ? null : snap.docs[0].data();
}
```

4. Add Firebase SDK to each HTML `<head>`:
```html
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js"></script>
<script>
  firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    projectId: "YOUR_PROJECT_ID",
    // ... rest of config
  });
</script>
```

---

## 📲 How to Share with Shopkeepers

Send them this WhatsApp message:
```
📱 USA Mobile Zone - Free IMEI Checker
Check any phone before buying!

🔗 [Your website link]

How to use:
1. Dial *#06# on the phone
2. Open the link above
3. Type the 15-digit number
4. Green = Safe ✅ | Red = Stolen ❌

Free service by USA Mobile Zone, Muzaffarabad
```

---

## ✏️ Customization

### Change Contact Number
In `index.html`, find and replace `03001234567` with your actual number (twice — call + WhatsApp links).

### Change Shop Name/Location
In all HTML files, find `USA Mobile Zone` and `Muzaffarabad`.

### Add More Cities
In `report.html`, change the city `<input>` to a `<select>`:
```html
<select id="r_city" class="field-input">
  <option>Muzaffarabad</option>
  <option>Rawalakot</option>
  <option>Mirpur</option>
  <option>Bagh</option>
</select>
```

---

## ⚠️ Important Notes

- **localStorage** data is per-browser/device. Use Firebase for shared database.
- Admin password is in `db.js` — keep the repo **private** if password security matters.
- This system is for community safety — not an official government database.
- Always advise users to also check PTA DIRBS: https://dirbs.pta.gov.pk

---

## 📞 Support
USA Mobile Zone, Main Bazaar, Muzaffarabad, AJK
