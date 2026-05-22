// ─────────────────────────────────────────────────────────
// DIALED — Firebase Configuration
// Replace all values below with your Firebase project config.
// Find these in: Firebase Console → Project Settings → General → Your apps → SDK setup
// ─────────────────────────────────────────────────────────
//
// FIRESTORE SECURITY RULES (set in Firebase Console → Firestore → Rules):
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /{document=**} {
//       allow read, write: if true;  // Personal app, open access
//     }
//   }
// }
//
// ─────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyBTuUPZksCbWhn-airYg3ic8BBHRkkHHCw",
  authDomain: "bike-setup-240de.firebaseapp.com",
  projectId: "bike-setup-240de",
  storageBucket: "bike-setup-240de.firebasestorage.app",
  messagingSenderId: "891278137715",
  appId: "1:891278137715:web:e8bf59bffbc041181f0d06"
};
