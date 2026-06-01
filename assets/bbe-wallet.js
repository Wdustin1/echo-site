import { createAppKit } from 'https://esm.sh/@reown/appkit@1.8.20';
import { EthersAdapter } from 'https://esm.sh/@reown/appkit-adapter-ethers@1.8.20';
import { base } from 'https://esm.sh/@reown/appkit@1.8.20/networks';
import { BrowserProvider, Contract } from 'https://esm.sh/ethers@6.15.0';

const PROJECT_ID = '3d61fb566793d86056fafe298ac03f84';
const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_HEX = '0x2105';
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
];

const metadata = {
  name: 'BuiltByEcho',
  description: 'Human-friendly wallet checkout for BuiltByEcho tools on Base.',
  url: window.location.origin,
  icons: [`${window.location.origin}/assets/brand/builtbyecho-logo.png`],
};

let appKit;
let walletProvider;
let connectedAddress = '';
const subscribers = new Set();

function notify() {
  const state = getWalletState();
  for (const subscriber of subscribers) subscriber(state);
}

export function shortAddress(value) {
  const text = String(value || '');
  return text.length > 14 ? `${text.slice(0, 8)}...${text.slice(-6)}` : text;
}

export function getWalletState() {
  return {
    address: connectedAddress,
    connected: Boolean(connectedAddress && walletProvider),
    provider: walletProvider,
  };
}

export function subscribeWallet(listener) {
  subscribers.add(listener);
  listener(getWalletState());
  return () => subscribers.delete(listener);
}

function getAccountAddress(state) {
  if (!state) return '';
  if (typeof state.address === 'string') return state.address;
  if (typeof state.caipAddress === 'string') return state.caipAddress.split(':').pop();
  if (Array.isArray(state.allAccounts) && state.allAccounts[0]?.address) return state.allAccounts[0].address;
  return '';
}

export async function initBuiltByEchoWallet() {
  if (appKit) return appKit;

  appKit = createAppKit({
    adapters: [new EthersAdapter()],
    networks: [base],
    metadata,
    projectId: PROJECT_ID,
    features: { analytics: false },
    themeMode: 'dark',
  });

  appKit.subscribeProviders((state) => {
    walletProvider = state?.eip155;
    notify();
  });

  appKit.subscribeAccount((state) => {
    connectedAddress = getAccountAddress(state);
    notify();
  });

  bindConnectButtons();
  notify();
  return appKit;
}

export async function connectWallet() {
  await initBuiltByEchoWallet();
  await appKit.open();
}

export async function waitForProvider(timeoutMs = 45000) {
  await initBuiltByEchoWallet();
  const started = Date.now();
  while (!walletProvider) {
    if (Date.now() - started > timeoutMs) throw new Error('Wallet connection timed out');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return walletProvider;
}

export async function ensureBaseNetwork(provider) {
  const current = await provider.request({ method: 'eth_chainId' });
  if (Number.parseInt(current, 16) === BASE_CHAIN_ID) return;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_CHAIN_HEX }],
    });
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: BASE_CHAIN_HEX,
        chainName: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org'],
      }],
    });
  }
}

export async function payErc20({ tokenAddress, receiver, amountRaw, status }) {
  if (!tokenAddress || !receiver || !amountRaw) throw new Error('Payment quote is incomplete');
  status?.('Preparing wallet payment...');
  if (!walletProvider) await connectWallet();
  const provider = await waitForProvider();
  await ensureBaseNetwork(provider);

  const ethersProvider = new BrowserProvider(provider, BASE_CHAIN_ID);
  const signer = await ethersProvider.getSigner();
  const from = await signer.getAddress();
  const token = new Contract(tokenAddress, ERC20_ABI, signer);

  status?.(`Confirm transfer from ${shortAddress(from)}.`);
  const tx = await token.transfer(receiver, BigInt(amountRaw));
  status?.(`Payment submitted: ${tx.hash}`);
  await tx.wait(1);
  status?.(`Payment confirmed: ${tx.hash}`);
  return { txHash: tx.hash, from };
}

export function readableWalletError(error) {
  const message = String(error?.shortMessage || error?.message || error || '');
  if (message.includes('0xe450d38c') || /insufficient.*balance/i.test(message)) {
    return 'Connected wallet does not have enough token balance on Base for this payment.';
  }
  if (/user rejected|denied|rejected request/i.test(message)) {
    return 'Transaction was rejected in the wallet.';
  }
  if (/chain|network/i.test(message) && /rejected|switch|add/i.test(message)) {
    return 'Wallet needs to switch to Base before paying.';
  }
  return message || 'unknown error';
}

function bindConnectButtons() {
  document.querySelectorAll('[data-wallet-connect]').forEach((button) => {
    if (button.dataset.walletBound === '1') return;
    button.dataset.walletBound = '1';
    button.addEventListener('click', () => {
      connectWallet().catch((error) => {
        const target = document.querySelector(button.dataset.walletStatusTarget || '#wallet-status');
        if (target) target.textContent = readableWalletError(error);
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBuiltByEchoWallet().catch(() => undefined);
});

window.BuiltByEchoWallet = {
  connectWallet,
  ensureBaseNetwork,
  getWalletState,
  initBuiltByEchoWallet,
  payErc20,
  readableWalletError,
  shortAddress,
  subscribeWallet,
  waitForProvider,
};
