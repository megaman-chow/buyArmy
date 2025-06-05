const fetch = require('node-fetch');

async function performSwap({
  action,
  mint,
  amount,
  denominatedInSol,
  slippage = 10,
  priorityFee = 0.00005,
  pool = 'auto',
  apiKey
}) {
  try {
    const response = await fetch(`https://pumpporta
l.fun/api/trade?api-key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        mint,
        amount,
        denominatedInSol,
        slippage,
        priorityFee,
        pool
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Swap failed: ${JSON.stringif
y(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error performing swap:', error);
    throw error;
  }
}

// Helper function to buy tokens
async function buyTokens({
  mint,
  amount,
  denominatedInSol = true,
  slippage = 10,
  priorityFee = 0.00005,
  pool = 'auto',
  apiKey
}) {
  return performSwap({
    action: 'buy',
    mint,
    amount,
    denominatedInSol,
    slippage,
    priorityFee,
    pool,
    apiKey
  });
}

// Helper function to sell tokens
async function sellTokens({
  mint,
  amount,
  denominatedInSol = false,
  slippage = 10,
  priorityFee = 0.00005,
  pool = 'auto',
  apiKey
}) {
  return performSwap({
    action: 'sell',
    mint,
    amount,
    denominatedInSol,
    slippage,
    priorityFee,
    pool,
    apiKey
  });
}

module.exports = {
  performSwap,
  buyTokens,
  sellTokens
