"use client";

import {
  getEVMNonce,
  verifyEVMSignature,
} from "@/actions/auth/evm_login_actions";
import {
  getSolflareNonce,
  verifySolflareSignature,
} from "@/actions/auth/solflare_login_actions";
import { ETH_MAINNET_RPC } from "@/core/consts";
import Solflare from "@solflare-wallet/sdk";
import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import base58 from "bs58";
import { Web3Provider } from "@ethersproject/providers";
import { useEffect, useMemo, useState } from "react";
import Web3 from "web3";

type Auth = {
  address: string;
  type: "evm" | "solflare" | "onboard";
};

export default function LoginPage() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isBrowserWalletSupported, setIsBrowserWalletSupported] =
    useState(false);

  // Window and web3 instance
  const [currentWindow, setCurrentWindow] = useState<Window | null>();
  const web3Instance = useMemo(
    () => currentWindow && new Web3(currentWindow.ethereum),
    [currentWindow]
  );
  const solflareInstance = useMemo(() => new Solflare(), []);

  // Web3 Onboard
  const injected = useMemo(() => injectedModule(), []);
  const onboard = useMemo(
    () =>
      Onboard({
        wallets: [injected],
        chains: [
          {
            id: "0x1",
            token: "ETH",
            label: "Ethereum Mainnet",
            rpcUrl: ETH_MAINNET_RPC,
          },
        ],
      }),
    [injected]
  );

  useEffect(() => {
    setCurrentWindow(window);
    setIsBrowserWalletSupported(!!window.ethereum);
  }, []);

  const onLoginWithBrowserWallet = async () => {
    try {
      // Skip if ethereum is not supported
      if (!web3Instance) throw new Error("Web3 instance not found");
      if (!isBrowserWalletSupported)
        throw new Error("Ethereum is not supported");
      // Create web3 instance and request accounts
      const accounts = await web3Instance.eth.requestAccounts();
      if (accounts.length === 0) throw new Error("No accounts found");
      const account = accounts[0];
      // Get nonce from server
      const { nonce } = await getEVMNonce(account);
      // Sign nonce with metamask
      const signature = await web3Instance.eth.personal.sign(
        nonce,
        account,
        ""
      );
      // Send signature to server
      const verified = await verifyEVMSignature(account, signature);
      if (!verified) throw new Error("Signature verification failed");
      // Set auth state
      setAuth({ address: account, type: "evm" });
    } catch (error) {
      console.error(error);
    }
  };

  const onLoginSolflare = async () => {
    try {
      // Create solflare instance and connect
      const wallet = new Solflare();
      await wallet.connect();
      // Get address
      const address = wallet.publicKey?.toString();
      if (!address) throw new Error("No address found");
      // Get nonce from server
      const { nonce } = await getSolflareNonce(address);
      // Sign nonce with solflare
      const messageBytes = new TextEncoder().encode(nonce);
      const signedMessage = await wallet.signMessage(messageBytes);
      const signature = base58.encode(signedMessage);
      // Send signature to server
      const verified = await verifySolflareSignature(address, signature);
      if (!verified) throw new Error("Signature verification failed");
      // Set auth state
      setAuth({ address, type: "solflare" });
    } catch (error) {
      console.error(error);
    }
  };

  const onLoginWithWeb3Onboard = async () => {
    try {
      // Connect wallet
      const wallets = await onboard.connectWallet();
      if (wallets.length === 0) throw new Error("No wallet found");
      // Get address
      const wallet = wallets[0];
      const address = wallet.accounts[0].address;
      if (!address) throw new Error("No address found");
      // Get nonce from server
      const { nonce } = await getEVMNonce(address);
      // Sign nonce with wallet
      const ethersProvider = new Web3Provider(wallet.provider, "any");
      const signer = ethersProvider.getSigner();
      const signature = await signer.signMessage(nonce);
      // Send signature to server
      const verified = await verifyEVMSignature(address, signature);
      if (!verified) throw new Error("Signature verification failed");
      // Set auth state
      setAuth({ address, type: "onboard" });
    } catch (error) {
      console.error(error);
    }
  };

  const onLogout = () => {
    // Disconnect based on auth type
    try {
      switch (auth?.type) {
        case "evm":
          web3Instance?.eth?.currentProvider?.disconnect();
          break;
        case "solflare":
          solflareInstance.disconnect();
          break;
        case "onboard":
          const wallets = onboard.state.get().wallets;
          for (const wallet of wallets) {
            onboard.disconnectWallet({ label: wallet.label });
          }
          break;
      }
    } catch (error) {
      console.error(error);
    }
    // Reset auth state
    setAuth(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center container">
      {!auth && (
        <div className="flex flex-col gap-2 max-w-lg">
          {isBrowserWalletSupported && (
            <button
              className="btn btn-neutral"
              onClick={onLoginWithBrowserWallet}
            >
              Login With Browser Wallet
            </button>
          )}
          <button className="btn btn-neutral" onClick={onLoginSolflare}>
            Login With Solflare
          </button>
          <button className="btn btn-neutral" onClick={onLoginWithWeb3Onboard}>
            Login With Web3-Onboard
          </button>
        </div>
      )}

      {auth && (
        <div className="flex flex-col gap-2 max-w-lg">
          <div className="text-xl font-bold">Logged In</div>
          <div className="text-lg">{auth.address}</div>
          <button className="btn btn-neutral" onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
