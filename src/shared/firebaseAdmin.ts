import admin from "firebase-admin";
import { config } from "./config";

let firebaseApp: admin.app.App | null = null;

function loadServiceAccount() {
  if (!config.firebase.serviceAccountJson) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON env var.");
  }
  try {
    return JSON.parse(config.firebase.serviceAccountJson);
  } catch (error) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON.");
  }
}

export function getFirebaseAdmin() {
  if (!firebaseApp) {
    const serviceAccount = loadServiceAccount();
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}
