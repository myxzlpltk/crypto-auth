"use client";

import {
  getEVMNonce,
  verifyEVMSignature,
} from "@/actions/auth/evm_login_actions";
import {
  getSolflareNonce,
  verifySolflareSignature,
} from "@/actions/auth/solflare_login_actions";
import Solflare from "@solflare-wallet/sdk";
import base58 from "bs58";
import { useEffect, useMemo, useState } from "react";
import Web3 from "web3";

type Auth = {
  address: string;
  type: "evm" | "solflare";
};

export default function LoginPage() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isEthereumSupported, setIsEthereumSupported] = useState(false);

  // Window and web3 instance
  const [currentWindow, setCurrentWindow] = useState<Window | null>();
  const web3Instance = useMemo(
    () => currentWindow && new Web3(currentWindow.ethereum),
    [currentWindow]
  );
  const solflareInstance = useMemo(() => new Solflare(), []);

  useEffect(() => {
    setCurrentWindow(window);
    setIsEthereumSupported(!!window.ethereum);
  }, []);

  const onLoginWithMetamask = async () => {
    try {
      // Skip if ethereum is not supported
      if (!web3Instance) throw new Error("Web3 instance not found");
      if (!isEthereumSupported) throw new Error("Ethereum is not supported");
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

  const onLogout = () => {
    // Disconnect based on auth type
    switch (auth?.type) {
      case "evm":
        web3Instance?.currentProvider?.disconnect();
        break;
      case "solflare":
        solflareInstance.disconnect();
    }
    // Reset auth state
    setAuth(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center container">
      {!auth && (
        <div className="flex flex-col gap-2 max-w-lg">
          {isEthereumSupported && (
            <button className="btn btn-neutral" onClick={onLoginWithMetamask}>
              Login With Metamask/Phantom
            </button>
          )}
          <button className="btn btn-neutral" onClick={onLoginSolflare}>
            Login With Solflare
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
