const MotherBot = require('./motherBot');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) =
> rl.question(query, resolve));

async function main() {
  try {
    console.log('Initializing PumpPortal Bot...\n')
;
    const bot = new MotherBot();

    // Initialize mother wallet
    await bot.initialize();

    // Check mother wallet balance
    const motherBalance = await bot.getBalance(bot.
motherWallet.walletPublicKey);
    console.log(`\nMother wallet balance: ${motherB
alance} SOL`);

    if (motherBalance < 0.1) {
      console.log('\n⚠️  Warning: Mother wallet has
low balance!');
      const proceed = await question('Do you want t
o proceed? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Exiting...');
        rl.close();
        return;
      }
    }

    // Get number of baby wallets
    const babyCount = parseInt(await question('\nEn
ter number of baby wallets to use: '));
    if (isNaN(babyCount) || babyCount < 1) {
      throw new Error('Invalid number of baby walle
ts');
    }

    await bot.createBabyWallets(babyCount);

    // Get total buy amount
    const totalAmount = parseFloat(await question('
\nEnter total amount of SOL to distribute: '));
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error('Invalid amount');
    }

    // Confirm distribution
    console.log(`\nAbout to distribute ${totalAmoun
t} SOL across ${babyCount} wallets`);
    const confirm = await question('Proceed with di
stribution? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Exiting...');
      rl.close();
      return;
    }

    await bot.distributeFunds(totalAmount);

    // Get token mint address
    const mintAddress = await question('\nEnter tok
en mint address to buy: ');
    if (!mintAddress || mintAddress.length < 32) {
      throw new Error('Invalid mint address');
    }

    // Confirm buy operation
    console.log('\nAbout to execute buy operations:
');
    console.log(`• Token: ${mintAddress}`);
    console.log(`• Number of wallets: ${babyCount}`
);
    const confirmBuy = await question('Proceed with
 buy operations? (y/n): ');
    if (confirmBuy.toLowerCase() !== 'y') {
      console.log('Exiting...');
      rl.close();
      return;
    }

    // Start buy operations
    console.log('\nStarting buy operations...');
    await bot.executeBabyBuys(mintAddress);

    console.log('\nOperations completed!');
    rl.close();
  } catch (error) {
    console.error('\nError:', error.message);
    rl.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  rl.close();
  process.exit(0);
});
