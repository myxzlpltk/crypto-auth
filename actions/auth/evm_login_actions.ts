"use server";

import crypto from "crypto";
import { recoverPersonalSignature } from "@metamask/eth-sig-util";
import User from "@/models/user";

type NonceResponse = {
  nonce: string;
};

export async function getEVMNonce(address: string): Promise<NonceResponse> {
  // Get user from database
  const user = await User.findOne({ where: { address } });
  // If user exists, return nonce
  if (user) return { nonce: user.nonce };
  // If user does not exist, create user and return nonce
  const nonce = crypto.randomUUID();
  await User.create({ address, nonce });
  return { nonce };
}

export async function verifyEVMSignature(
  address: string,
  signature: string
): Promise<boolean> {
  // Get user
  const user = await User.findOne({ where: { address } });
  if (!user) return false;
  // Verify signature
  const recoveredAddress = recoverPersonalSignature({
    data: user.nonce,
    signature: signature,
  });
  // Compare addresses
  const valid = recoveredAddress === address;
  if (!valid) return false;
  // Reset nonce
  await user.update({ nonce: crypto.randomUUID() });
  return true;
}
