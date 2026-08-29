// src/lib/biometricService.js
// Biometric + PIN Authentication Service für HUI
// Nutzt @aparajita/capacitor-biometric-auth + @capacitor/preferences
// ══════════════════════════════════════════════════════════════

import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const KEYS = {
  REFRESH_TOKEN: 'hui_biometric_refresh_token',
  EMAIL: 'hui_biometric_email',
  PIN_HASH: 'hui_biometric_pin_hash',
  ENABLED: 'hui_biometric_enabled',
  PIN_ENABLED: 'hui_biometric_pin_enabled',
};

// Biometrie verfügbar?
export async function checkBiometricAvailability() {
  if (!Capacitor.isNativePlatform()) return { available: false };
  try {
    const result = await BiometricAuth.checkBiometry();
    return {
      available: result.isAvailable,
      biometryType: result.biometryType,
      strongBiometryIsAvailable: result.strongBiometryIsAvailable,
    };
  } catch {
    return { available: false };
  }
}

// Biometrie aktiv?
export async function isBiometricEnabled() {
  const { value } = await Preferences.get({ key: KEYS.ENABLED });
  return value === 'true';
}

// PIN aktiv?
export async function isPINEnabled() {
  const { value } = await Preferences.get({ key: KEYS.PIN_ENABLED });
  return value === 'true';
}

// Token sicher speichern
export async function saveSession(email, refreshToken) {
  await Preferences.set({ key: KEYS.EMAIL, value: email });
  await Preferences.set({ key: KEYS.REFRESH_TOKEN, value: refreshToken });
}

// Token holen
export async function getSavedSession() {
  const { value: email } = await Preferences.get({ key: KEYS.EMAIL });
  const { value: refreshToken } = await Preferences.get({ key: KEYS.REFRESH_TOKEN });
  return { email, refreshToken };
}

// Session löschen (bei Logout)
export async function clearSavedSession() {
  await Preferences.remove({ key: KEYS.REFRESH_TOKEN });
  await Preferences.remove({ key: KEYS.EMAIL });
  await Preferences.remove({ key: KEYS.ENABLED });
  await Preferences.remove({ key: KEYS.PIN_ENABLED });
  await Preferences.remove({ key: KEYS.PIN_HASH });
}

// Biometrie durchführen
export async function authenticateWithBiometric() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await BiometricAuth.authenticate({
      reason: 'HUI entsperren',
      cancelTitle: 'Abbrechen',
      allowDeviceCredential: false,
      iosFallbackTitle: 'PIN verwenden',
    });
    return true;
  } catch {
    return false;
  }
}

// Biometrie aktivieren
export async function enableBiometric(email, refreshToken) {
  await saveSession(email, refreshToken);
  await Preferences.set({ key: KEYS.ENABLED, value: 'true' });
}

// PIN setzen (einfacher Hash)
export async function setPIN(pin) {
  const hash = btoa(pin + 'hui_salt_2026');
  await Preferences.set({ key: KEYS.PIN_HASH, value: hash });
  await Preferences.set({ key: KEYS.PIN_ENABLED, value: 'true' });
}

// Biometrie DEAKTIVIEREN (nur Biometrie — PIN unangetastet)
export async function disableBiometric() {
  await Preferences.remove({ key: KEYS.ENABLED });
  await Preferences.remove({ key: KEYS.REFRESH_TOKEN });
  await Preferences.remove({ key: KEYS.EMAIL });
}

// PIN DEAKTIVIEREN (nur PIN — Biometrie unangetastet)
export async function disablePIN() {
  await Preferences.remove({ key: KEYS.PIN_ENABLED });
  await Preferences.remove({ key: KEYS.PIN_HASH });
}

// PIN prüfen
export async function verifyPIN(pin) {
  const { value: stored } = await Preferences.get({ key: KEYS.PIN_HASH });
  const hash = btoa(pin + 'hui_salt_2026');
  return stored === hash;
}
