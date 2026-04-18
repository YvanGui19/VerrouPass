/**
 * Fonctions de chiffrement - Identique au client web
 * Utilise la Web Crypto API de Node.js
 */

import { webcrypto } from 'crypto';
const crypto = webcrypto;

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

function stringToBuffer(str) {
  return new TextEncoder().encode(str);
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

function base64ToBuffer(base64) {
  const binary = Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(password, salt) {
  const passwordBuffer = stringToBuffer(password);
  const saltBuffer = stringToBuffer(salt.toLowerCase());

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function deriveKeys(masterPassword, email) {
  // Clé d'authentification
  const authCryptoKey = await deriveKey(masterPassword, email);
  const authKeyRaw = await crypto.subtle.exportKey('raw', authCryptoKey);
  const authKey = bufferToHex(authKeyRaw);

  // Clé de chiffrement
  const encKey = await deriveKey(masterPassword, email + 'enc');

  return { authKey, encKey };
}

export async function hashForServer(key) {
  const keyBuffer = stringToBuffer(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
  return bufferToHex(hashBuffer);
}

export async function encrypt(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dataBuffer = stringToBuffer(JSON.stringify(data));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  return {
    encryptedData: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv)
  };
}

export async function decrypt(encryptedData, iv, key) {
  const encryptedBuffer = base64ToBuffer(encryptedData);
  const ivBuffer = base64ToBuffer(iv);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encryptedBuffer
  );

  const decryptedText = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decryptedText);
}

// Fonction pour exporter une clé en format stockable
export async function exportKey(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

// Fonction pour importer une clé depuis le format stocké
export async function importKey(keyString) {
  const keyBuffer = base64ToBuffer(keyString);
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export default {
  deriveKeys,
  hashForServer,
  encrypt,
  decrypt,
  exportKey,
  importKey
};
