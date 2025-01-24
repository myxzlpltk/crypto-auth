"use client";

import { getNonce, verifySignature } from "@/actions/auth/evm_login_actions";
import { useEffect, useMemo, useState } from "react";
import Web3 from "web3";

type Auth = {
  address: string;
};

export default function LoginPage() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isEthereumSupported, setIsEthereumSupported] = useState(false);

  useEffect(() => {
    setIsEthereumSupported(!!window.ethereum);
  }, []);

  const onLoginWithMetamask = async () => {
    try {
      // Skip if ethereum is not supported
      if (!isEthereumSupported) throw new Error("Ethereum is not supported");
      // Create web3 instance and request accounts
      const web3Instance = new Web3(window.ethereum);
      const accounts = await web3Instance.eth.requestAccounts();
      if (accounts.length === 0) throw new Error("No accounts found");
      const account = accounts[0];
      // Get nonce from server
      const { nonce } = await getNonce(account);
      // Sign nonce with metamask
      const signature = await web3Instance.eth.personal.sign(
        nonce,
        account,
        ""
      );
      // Send signature to server
      const verified = await verifySignature(account, signature);
      if (!verified) throw new Error("Signature verification failed");
      // Set auth state
      setAuth({ address: account });
    } catch (error) {
      console.error(error);
    }
  };

  const onLogout = () => {
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
          <button className="btn btn-neutral">Login With Solflare</button>
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
