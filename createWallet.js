const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { Keypair } = require('@solana/web3.js');

// Function to create a new wallet
async function createWallet() {
  try {
    const response = await fetch("https://pumpporta
l.fun/api/create-wallet", {
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to create wallet: ${r
esponse.status}`);
    }

    const data = await response.json();

    // Convert private key to Uint8Array for Solana
    const privateKeyArray = Uint8Array.from(Buffer.
from(data.privateKey, 'base64'));
    data.secretKey = Array.from(privateKeyArray);

    // Store wallet data in db.json
    await storeWalletData(data);

    return data;
  } catch (error) {
    console.error("Error creating wallet:", error);
    throw error; // Propagate error for better hand
ling
  }
}

// Function to store wallet data in db.json
async function storeWalletData(walletData) {
  try {
    const dbPath = path.join(__dirname, 'db.json');
    let db = {};

    // Read existing data if file exists
    try {
      const existingData = await fs.readFile(dbPath
, 'utf8');
      db = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist or is empty, start with
 empty object
    }

    // Add new wallet data
    if (!db.wallets) {
      db.wallets = [];
    }

    db.wallets.push({
      address: walletData.walletPublicKey,
      privateKey: walletData.privateKey,
      secretKey: walletData.secretKey,
      apiKey: walletData.apiKey,
      createdAt: new Date().toISOString()
    });

    // Write back to file
    await fs.writeFile(dbPath, JSON.stringify(db, n
ull, 2));
    console.log('Wallet data stored successfully');
  } catch (error) {
    console.error('Error storing wallet data:', err
or);
    throw error;
  }
}

// Function to get all stored wallets
async function getStoredWallets() {
  try {
    const dbPath = path.join(__dirname, 'db.json');
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data).wallets || [];
  } catch (error) {
    console.error('Error reading stored wallets:',
error);
    return [];
  }
}

module.exports = {
  createWallet,
  getStoredWallets
