const { createWallet, getStoredWallets } = require(
'./createWallet');
const { buyTokens } = require('./swap');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const { Connection, PublicKey, SystemProgram, Trans
action, Keypair, sendAndConfirmTransaction } = requ
ire('@solana/web3.js');

class MotherBot {
  constructor() {
    this.motherWallet = null;
    this.babyWallets = [];
    this.totalBuyAmount = 0;
    this.babyCount = 0;
    this.dbPath = path.join(__dirname, 'db.json');
    this.connection = new Connection(process.env.RP
C_URL || 'https://api.mainnet-beta.solana.com');
  }

  async initialize() {
    // Create mother wallet if it doesn't exist
    const storedWallets = await getStoredWallets();
    if (storedWallets.length === 0) {
      console.log('Creating mother wallet...');
      this.motherWallet = await createWallet();
      console.log('Mother wallet created:', this.mo
therWallet.walletPublicKey);
      console.log('Please send funds to this addres
s to begin operations');
    } else {
      this.motherWallet = storedWallets[0];
      this.motherApiKey = this.motherWallet.apiKey;
      // this.motherKey = this.motherWallet.secretK
ey;
      console.log('Mother wallet loaded:', this.mot
herWallet.address);

      const buyResult = await buyTokens({
        action: "buy",
        mint: "FG5U9yBZb8yewg5MepRVAMfPCr3afvyRhdST
6Y73pump",
        amount: 0.02, // Use all available funds
        denominatedInSol: "true", // Fixed: Use str
ing "false" instead of boolean
        slippage: 10,
        priorityFee: 0.00005,
        pool: 'auto',
        apiKey: this.motherApiKey
      });
      console.log('Mother wallet buy result:', buyR
esult);

      // Load existing baby wallets
      this.babyWallets = storedWallets.slice(1);
      console.log(`Loaded ${this.babyWallets.length
} existing baby wallets`);
    }
  }

  async createBabyWallets(count) {
    this.babyCount = count;
    const existingCount = this.babyWallets.length;
    const newWalletsNeeded = Math.max(0, count - ex
istingCount);

    if (newWalletsNeeded > 0) {
      console.log(`Creating ${newWalletsNeeded} new
 baby wallets...`);

      for (let i = 0; i < newWalletsNeeded; i++) {
        const babyWallet = await createWallet();
        this.babyWallets.push(babyWallet);
        console.log(`Baby wallet ${existingCount +
i + 1} created:`, babyWallet.walletPublicKey);
      }
    } else {
      console.log(`Using ${count} existing baby wal
lets`);
      this.babyWallets = this.babyWallets.slice(0,
count);
    }
  }

  async getBalance(walletPublicKey) {
    try {
      const balance = await this.connection.getBala
nce(new PublicKey(walletPublicKey));
      return balance / 1e9; // Convert lamports to
SOL
    } catch (error) {
      console.error('Error getting balance:', error
);
      return 0;
    }
  }

  async checkBalances() {
    console.log('Checking wallet balances...');

    // Check mother wallet balance
    const motherBalance = await this.getBalance(thi
s.motherWallet.walletPublicKey);
    console.log(`Mother wallet balance: ${motherBal
ance} SOL`);

    // Check baby wallet balances
    for (let i = 0; i < this.babyWallets.length; i+
+) {
      const balance = await this.getBalance(this.ba
byWallets[i].walletPublicKey);
      console.log(`Baby wallet ${i + 1} balance: ${
balance} SOL`);
    }

    return {
      motherBalance,
      babyBalances: this.babyWallets.map((_, i) =>
this.getBalance(this.babyWallets[i].walletPublicKey
))
    };
  }

  async _transferSol(fromKeypair, toPublicKey, amou
ntInSol) {
    try {
      const toPubkey = new PublicKey(toPublicKey);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPubkey,
          lamports: Math.floor(amountInSol * 1e9) /
/ Convert SOL to lamports
        })
      );

      const signature = await sendAndConfirmTransac
tion(
        this.connection,
        transaction,
        [fromKeypair],
        { commitment: 'confirmed' }
      );

      return signature;
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  }

  async distributeFunds(totalAmount) {
    this.totalBuyAmount = totalAmount;
    const amountPerBaby = totalAmount / this.babyCo
unt;

    // Randomly distribute slightly different amoun
ts to each baby
    const amounts = this.babyWallets.map(() => {
      const variation = (Math.random() - 0.5) * (am
ountPerBaby * 0.1); // 10% variation
      return amountPerBaby + variation;
    });

    // Normalize to ensure total equals original am
ount
    const total = amounts.reduce((a, b) => a + b, 0
);
    const normalizedAmounts = amounts.map(amount =>
 (amount / total) * totalAmount);

    console.log('Distributing funds to baby wallets
...');
    for (let i = 0; i < this.babyWallets.length; i+
+) {
      const amount = normalizedAmounts[i];
      console.log(`Sending ${amount} SOL to baby wa
llet ${i + 1}`);
      const txid = await this._transferSol(
        this.motherWallet.secretKey,
        this.babyWallets[i].walletPublicKey,
        amount
      );
      console.log(`TX: https://solscan.io/tx/${txid
}`);

      // Add random delay between transfers (2-10s)
      await new Promise(r => setTimeout(r, 2000 + M
ath.random() * 8000));
    }
  }

  // async distributeFunds(totalAmount) {
  //   this.totalBuyAmount = totalAmount;
  //   const FEE_PER_TX = 0.000005; // 5000 lamport
s (0.000005 SOL)

  //   // Create mother wallet keypair
  //   const motherKeypair = Keypair.fromSecretKey(
  //     new Uint8Array(this.motherWallet.secretKey
)
  //   );

  //   // Check mother wallet balance
  //   const motherBalance = await this.getBalance(
this.motherWallet.walletPublicKey);
  //   const totalNeeded = totalAmount + (this.baby
Count * FEE_PER_TX);

  //   if (motherBalance < totalNeeded) {
  //     throw new Error(
  //       `Mother wallet needs ${totalNeeded} SOL
(${motherBalance} available)`
  //     );
  //   }

  //   // Calculate amounts with random variation
  //   const baseAmount = totalAmount / this.babyCo
unt;
  //   const amounts = this.babyWallets.map(() =>
  //     baseAmount * (0.95 + Math.random() * 0.1)
// 5-15% variation
  //   );

  //   // Normalize amounts
  //   const totalActual = amounts.reduce((sum, amo
unt) => sum + amount, 0);
  //   const normalizedAmounts = amounts.map(
  //     amount => (amount / totalActual) * totalAm
ount
  //   );

  //   console.log('Distributing funds:');
  //   for (let i = 0; i < this.babyWallets.length;
 i++) {
  //     const amount = normalizedAmounts[i];
  //     const babyAddress = this.babyWallets[i].wa
lletPublicKey;

  //     console.log(`• Sending ${amount.toFixed(6)
} SOL to baby ${i+1}`);
  //     const txid = await this._transferSol(
  //       motherKeypair,
  //       babyAddress,
  //       amount
  //     );
  //     console.log(`TX: https://solscan.io/tx/${t
xid}`);

  //     // Add random delay between transfers (2-1
0s)
  //     await new Promise(r => setTimeout(r, 2000
+ Math.random() * 8000));
  //   }
  // }

  async executeBabyBuys(mintAddress) {
    console.log('Starting baby wallet buy operation
s...');

    // Check if baby wallets have enough funds
    for (let i = 0; i < this.babyWallets.length; i+
+) {
      const babyWallet = this.babyWallets[i];
      const balance = await this.getBalance(babyWal
let.walletPublicKey);
      if (balance < 0.1) { // Minimum 0.1 SOL requi
red
        console.log(`Baby wallet ${i + 1} has insuf
ficient funds (${balance} SOL)`);
        return;
      }
    }

    for (let i = 0; i < this.babyWallets.length; i+
+) {
      const babyWallet = this.babyWallets[i];

      // Random delay between 1-5 minutes
      const delay = Math.floor(Math.random() * 2400
00) + 60000;
      console.log(`Waiting ${delay/1000} seconds be
fore next buy...`);
      await new Promise(resolve => setTimeout(resol
ve, delay));

      try {
        console.log(`Baby wallet ${i + 1} executing
 buy...`);
        const buyResult = await buyTokens({
          mint: mintAddress,
          amount: '100%', // Use all available fund
s
          denominatedInSol: "false", // Fixed: Use
string "false" instead of boolean
          slippage: 10,
          priorityFee: 0.00005,
          pool: 'auto',
          apiKey: babyWallet.apiKey
        });

        console.log(`Baby wallet ${i + 1} buy resul
t:`, buyResult);

        // Add delay after successful buy
        await new Promise(resolve => setTimeout(res
olve, 30000)); // 30 second delay
      } catch (error) {
        console.error(`Error in baby wallet ${i + 1
} buy:`, error);
        // Continue with next wallet even if one fa
ils
      }
    }
  }
}



module.exports = MotherBot; 
