// ==========================================
// WEB3 WALLET BALANCE CHECKER
// READ-ONLY APPLICATION
// ==========================================


// Ethereum Mainnet RPC

const RPC_URL = "https://eth.llamarpc.com";


// Ethereum Mainnet USDC Contract

const USDC_CONTRACT_ADDRESS =
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";


// Minimal ERC-20 ABI

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];


// DOM Elements

const walletInput =
  document.getElementById("walletAddress");

const checkButton =
  document.getElementById("checkBalanceBtn");

const errorMessage =
  document.getElementById("errorMessage");

const loading =
  document.getElementById("loading");

const results =
  document.getElementById("results");

const fullAddress =
  document.getElementById("fullAddress");

const ethBalance =
  document.getElementById("ethBalance");

const usdcBalance =
  document.getElementById("usdcBalance");


// ==========================================
// CHECK BALANCE BUTTON
// ==========================================

checkButton.addEventListener(
  "click",
  checkWalletBalance
);


// Allow Enter key

walletInput.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Enter") {

      checkWalletBalance();

    }

  }
);


// ==========================================
// MAIN FUNCTION
// ==========================================

async function checkWalletBalance() {


  // Get input

  const address =
    walletInput.value.trim();


  // Clear previous error

  errorMessage.textContent = "";


  // Hide previous results

  results.classList.add("hidden");


  // Validate empty input

  if (!address) {

    showError(
      "Please enter a wallet address."
    );

    return;

  }


  // Validate Ethereum address

  if (!ethers.isAddress(address)) {

    showError(
      "Please enter a valid Ethereum wallet address."
    );

    return;

  }


  try {


    // Show loading

    loading.classList.remove("hidden");

    checkButton.disabled = true;

    checkButton.textContent =
      "Checking...";


    // Create provider

    const provider =
      new ethers.JsonRpcProvider(
        RPC_URL
      );


    // Create USDC contract

    const usdcContract =
      new ethers.Contract(
        USDC_CONTRACT_ADDRESS,
        ERC20_ABI,
        provider
      );


    // Fetch ETH balance

    const ethBalancePromise =
      provider.getBalance(address);


    // Fetch USDC balance

    const usdcBalancePromise =
      usdcContract.balanceOf(address);


    // Fetch both simultaneously

    const [
      ethBalanceRaw,
      usdcBalanceRaw
    ] =
      await Promise.all([
        ethBalancePromise,
        usdcBalancePromise
      ]);


    // Format ETH

    const formattedEth =
      ethers.formatEther(
        ethBalanceRaw
      );


    // Format USDC

    const formattedUsdc =
      ethers.formatUnits(
        usdcBalanceRaw,
        6
      );


    // Display address

    fullAddress.textContent =
      address;


    // Format ETH number

    const ethNumber =
      Number(formattedEth);


    // Format USDC number

    const usdcNumber =
      Number(formattedUsdc);


    // Display ETH

    ethBalance.textContent =
      formatBalance(
        ethNumber,
        6
      ) + " ETH";


    // Display USDC

    usdcBalance.textContent =
      formatBalance(
        usdcNumber,
        2
      ) + " USDC";


    // Hide loading

    loading.classList.add(
      "hidden"
    );


    // Show results

    results.classList.remove(
      "hidden"
    );


  } catch (error) {


    console.error(
      "Balance fetch error:",
      error
    );


    loading.classList.add(
      "hidden"
    );


    showError(
      "Unable to fetch blockchain data. Please try again."
    );


  } finally {


    // Restore button

    checkButton.disabled = false;

    checkButton.textContent =
      "Check Balance";


  }


}


// ==========================================
// FORMAT BALANCE
// ==========================================

function formatBalance(
  value,
  decimals
) {


  if (value === 0) {

    return "0";

  }


  if (!Number.isFinite(value)) {

    return "0";

  }


  return value
    .toFixed(decimals)
    .replace(/\.?0+$/, "");


}


// ==========================================
// SHOW ERROR
// ==========================================

function showError(message) {

  errorMessage.textContent =
    message;

}