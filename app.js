// ==========================================
// WEB3 WALLET BALANCE CHECKER
// READ-ONLY APPLICATION
// ==========================================

// Ethereum Mainnet RPC
const RPC_URL = "https://ethereum-rpc.publicnode.com";

// Ethereum Mainnet USDC Contract
const USDC_CONTRACT_ADDRESS =
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Minimal ERC-20 ABI
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

// DOM Elements
const walletInput = document.getElementById("walletAddress");
const checkButton = document.getElementById("checkBalanceBtn");
const errorMessage = document.getElementById("errorMessage");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const fullAddress = document.getElementById("fullAddress");
const ethBalance = document.getElementById("ethBalance");
const usdcBalance = document.getElementById("usdcBalance");

// Check button
checkButton.addEventListener("click", checkWalletBalance);

// Allow Enter key
walletInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    checkWalletBalance();
  }
});

// ==========================================
// MAIN FUNCTION
// ==========================================

async function checkWalletBalance() {

  const address = walletInput.value.trim();

  // Clear previous error
  errorMessage.textContent = "";

  // Hide previous results
  results.classList.add("hidden");

  // Validate empty input
  if (!address) {
    showError("Please enter a wallet address.");
    return;
  }

  // Validate Ethereum address
  if (!ethers.isAddress(address)) {
    showError("Please enter a valid Ethereum wallet address.");
    return;
  }

  try {

    // Show loading
    loading.classList.remove("hidden");
    checkButton.disabled = true;
    checkButton.textContent = "Checking...";

    // Create provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Create USDC contract
    const usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS,
      ERC20_ABI,
      provider
    );

    // Fetch ETH and USDC simultaneously
    const [ethBalanceRaw, usdcBalanceRaw] = await Promise.all([
      provider.getBalance(address),
      usdcContract.balanceOf(address)
    ]);

    // Format balances
    const formattedEth = ethers.formatEther(ethBalanceRaw);

    const formattedUsdc = ethers.formatUnits(
      usdcBalanceRaw,
      6
    );

    // Display address
    fullAddress.textContent = address;

    // Display ETH
    ethBalance.textContent =
      formatBalance(Number(formattedEth), 6) + " ETH";

    // Display USDC
    usdcBalance.textContent =
      formatBalance(Number(formattedUsdc), 2) + " USDC";

    // Hide loading
    loading.classList.add("hidden");

    // Show results
    results.classList.remove("hidden");

  } catch (error) {

    console.error("Balance fetch error:", error);

    loading.classList.add("hidden");

    showError(
      "Unable to fetch blockchain data. Please try again."
    );

  } finally {

    checkButton.disabled = false;
    checkButton.textContent = "Check Balance";

  }

}

// ==========================================
// FORMAT BALANCE
// ==========================================

function formatBalance(value, decimals) {

  if (value === 0 || !Number.isFinite(value)) {
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
  errorMessage.textContent = message;
}