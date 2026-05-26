import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Helpers ──────────────────────────────────────────────
function clean(data) {
  // Remove undefined values before writing to Firestore
  return JSON.parse(JSON.stringify(data, (_, v) => v === undefined ? null : v));
}

function docData(snap) {
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

function colData(snap) {
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── BIKES ─────────────────────────────────────────────────
export async function getBikes() {
  const snap = await getDocs(query(collection(db, 'bikes'), orderBy('createdAt', 'asc')));
  return colData(snap);
}

export async function createBike(data) {
  const ref = await addDoc(collection(db, 'bikes'), clean({
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));
  return ref.id;
}

export async function updateBike(bikeId, data) {
  await updateDoc(doc(db, 'bikes', bikeId), clean({
    ...data,
    updatedAt: serverTimestamp()
  }));
}

export async function deleteBike(bikeId) {
  // Delete all subcollections first
  await deleteCollection(db, `bikes/${bikeId}/components`);
  await deleteCollection(db, `bikes/${bikeId}/presets`);
  await deleteCollection(db, `bikes/${bikeId}/testSessions`);
  await deleteDoc(doc(db, 'bikes', bikeId));
}

// ── COMPONENTS ────────────────────────────────────────────
export async function getComponents(bikeId) {
  const snap = await getDocs(
    query(collection(db, 'bikes', bikeId, 'components'), orderBy('category', 'asc'))
  );
  return colData(snap);
}

export async function createComponent(bikeId, data) {
  const ref = await addDoc(collection(db, 'bikes', bikeId, 'components'), clean({
    ...data,
    createdAt: serverTimestamp()
  }));
  return ref.id;
}

export async function updateComponent(bikeId, componentId, data) {
  await updateDoc(doc(db, 'bikes', bikeId, 'components', componentId), clean(data));
}

export async function deleteComponent(bikeId, componentId) {
  await deleteDoc(doc(db, 'bikes', bikeId, 'components', componentId));
}

// ── RIDES ─────────────────────────────────────────────────
export async function getRides(bikeId) {
  const snap = await getDocs(
    query(collection(db, 'bikes', bikeId, 'rides'), orderBy('date', 'desc'))
  );
  return colData(snap);
}

export async function createRide(bikeId, data) {
  const ref = await addDoc(collection(db, 'bikes', bikeId, 'rides'), clean({
    ...data, createdAt: serverTimestamp()
  }));
  return ref.id;
}

export async function updateRide(bikeId, rideId, data) {
  await updateDoc(doc(db, 'bikes', bikeId, 'rides', rideId), clean(data));
}

export async function deleteRide(bikeId, rideId) {
  await deleteDoc(doc(db, 'bikes', bikeId, 'rides', rideId));
}

// ── PRESETS ───────────────────────────────────────────────
export async function getPresets(bikeId) {
  const snap = await getDocs(
    query(collection(db, 'bikes', bikeId, 'presets'), orderBy('createdAt', 'desc'))
  );
  return colData(snap);
}

export async function createPreset(bikeId, data) {
  const ref = await addDoc(collection(db, 'bikes', bikeId, 'presets'), clean({
    ...data,
    createdAt: serverTimestamp()
  }));
  return ref.id;
}

export async function updatePreset(bikeId, presetId, data) {
  await updateDoc(doc(db, 'bikes', bikeId, 'presets', presetId), clean(data));
}

export async function deletePreset(bikeId, presetId) {
  await deleteDoc(doc(db, 'bikes', bikeId, 'presets', presetId));
}

// ── TEST SESSIONS ─────────────────────────────────────────
export async function getTestSessions(bikeId) {
  const snap = await getDocs(
    query(collection(db, 'bikes', bikeId, 'testSessions'), orderBy('createdAt', 'desc'))
  );
  return colData(snap);
}

export async function createTestSession(bikeId, data) {
  const ref = await addDoc(collection(db, 'bikes', bikeId, 'testSessions'), clean({
    ...data,
    adopted: false,
    createdAt: serverTimestamp()
  }));
  return ref.id;
}

export async function updateTestSession(bikeId, sessionId, data) {
  await updateDoc(doc(db, 'bikes', bikeId, 'testSessions', sessionId), clean(data));
}

export async function deleteTestSession(bikeId, sessionId) {
  await deleteDoc(doc(db, 'bikes', bikeId, 'testSessions', sessionId));
}

// ── Utility ───────────────────────────────────────────────
async function deleteCollection(db, path) {
  try {
    const snap = await getDocs(collection(db, path));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  } catch (_) {}
}
