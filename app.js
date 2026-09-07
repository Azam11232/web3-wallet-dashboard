/**
 * Simple MetaMask dashboard using Ethers.js v6.
 * Reads address, native balance, USDC (ERC-20) balance, and network name.
 */

// Ethereum mainnet USDC (Circle)
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Minimal ERC-20 ABI: only what we need for a balance lookup
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// Friendly names for common chain IDs (ethers may return "unknown" otherwise)
const NETWORK_NAMES = {
  1: "Ethereum Mainnet",
  5: "Goerli",
  10: "Optimism",
  56: "BNB Smart Chain",
  137: "Polygon",
  8453: "Base",
  42161: "Arbitrum One",
  11155111: "Sepolia",
};

const connectBtn = document.getElementById("connect-btn");
const statusEl = document.getElementById("status");
const addressEl = document.getElementById("address");
const nativeEl = document.getElementById("native-balance");
const usdcEl = document.getElementById("usdc-balance");
const networkEl = document.getElementById("network-name");

let provider = null;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function setValue(el, text, filled) {
  el.textContent = text;
  el.classList.toggle("muted", !filled);
}

function resetCards() {
  setValue(addressEl, "—", false);
  setValue(nativeEl, "—", false);
  setValue(usdcEl, "—", false);
  setValue(networkEl, "—", false);
}

function getEthereum() {
  if (typeof window.ethereum === "undefined") {
    return null;
  }
  return window.ethereum;
}

async function connectWallet() {
  const ethereum = getEthereum();

  if (!ethereum) {
    setStatus("MetaMask is not installed. Please install the MetaMask extension.", true);
    return;
  }

  try {
    setStatus("Connecting…");
    connectBtn.disabled = true;

    // BrowserProvider wraps window.ethereum (MetaMask)
    provider = new ethers.BrowserProvider(ethereum);

    // Prompts MetaMask; throws if the user rejects
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    await refreshDashboard(address);

    connectBtn.textContent = "Refresh";
    setStatus("Wallet connected.");
  } catch (error) {
    handleConnectError(error);
  } finally {
    connectBtn.disabled = false;
  }
}

function handleConnectError(error) {
  // EIP-1193: user rejected the request
  const code = error?.code ?? error?.info?.error?.code;
  if (code === 4001) {
    setStatus("Connection rejected. Approve the request in MetaMask to continue.", true);
    return;
  }

  const message = error?.shortMessage || error?.message || "Failed to connect wallet.";
  setStatus(message, true);
}

async function refreshDashboard(address) {
  setValue(addressEl, address, true);
  addressEl.title = address;

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const networkName =
    NETWORK_NAMES[chainId] || network.name || `Chain ID ${chainId}`;
  setValue(networkEl, `${networkName} (${chainId})`, true);

  // Native token (ETH on mainnet, MATIC on Polygon, etc.)
  const nativeBalance = await provider.getBalance(address);
  const nativeSymbol = chainId === 1 ? "ETH" : "native";
  setValue(nativeEl, `${ethers.formatEther(nativeBalance)} ${nativeSymbol}`, true);

  await loadUsdcBalance(address, chainId);
}

async function loadUsdcBalance(address, chainId) {
  // The hardcoded USDC address is Ethereum mainnet only
  if (chainId !== 1) {
    setValue(
      usdcEl,
      "Switch to Ethereum Mainnet to read USDC",
      true
    );
    return;
  }

  try {
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const [rawBalance, decimals, symbol] = await Promise.all([
      usdc.balanceOf(address),
      usdc.decimals(),
      usdc.symbol(),
    ]);
    setValue(usdcEl, `${ethers.formatUnits(rawBalance, decimals)} ${symbol}`, true);
  } catch (error) {
    setValue(usdcEl, "Unable to fetch USDC balance", true);
    console.error(error);
  }
}

connectBtn.addEventListener("click", connectWallet);

// Keep the UI in sync if the user switches account or network in MetaMask
if (getEthereum()) {
  window.ethereum.on("accountsChanged", async (accounts) => {
    if (!accounts.length) {
      resetCards();
      connectBtn.textContent = "Connect Wallet";
      provider = null;
      setStatus("Wallet disconnected.");
      return;
    }

    if (!provider) {
      provider = new ethers.BrowserProvider(window.ethereum);
    }

    try {
      await refreshDashboard(accounts[0]);
      connectBtn.textContent = "Refresh";
      setStatus("Account updated.");
    } catch (error) {
      handleConnectError(error);
    }
  });

  window.ethereum.on("chainChanged", () => {
    // MetaMask recommends a reload when the chain changes
    window.location.reload();
  });
}
