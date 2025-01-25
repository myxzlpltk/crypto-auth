"use server";

import User from "@/models/user";
import bs58 from "bs58";
import crypto from "crypto";
import nacl from "tweetnacl";

type NonceResponse = {
  nonce: string;
};

export async function getSolflareNonce(
  address: string
): Promise<NonceResponse> {
  // Get user from database
  const user = await User.findOne({ where: { address } });
  // If user exists, return nonce
  if (user) return { nonce: user.nonce };
  // If user does not exist, create user and return nonce
  const nonce = crypto.randomUUID();
  await User.create({ address, nonce });
  return { nonce };
}

export async function verifySolflareSignature(
  address: string,
  signature: string
): Promise<boolean> {
  // Get user
  const user = await User.findOne({ where: { address: address } });
  if (!user) return false;
  // Verify signature
  const message = new TextEncoder().encode(user.nonce);
  const bufferAddress = bs58.decode(address);
  const bufferSignature = bs58.decode(signature);
  const verified = nacl.sign.detached.verify(message, bufferSignature, bufferAddress);
  if (!verified) return false;
  // Reset nonce
  await user.update({ nonce: crypto.randomUUID() });
  return true;

  //   // Verify signature
  //   const recoveredAddress = recoverPersonalSignature({
  //     data: user.nonce,
  //     signature: signature,
  //   });
  //   // Compare addresses
  //   const valid = recoveredAddress === address;
  //   if (!valid) return false;
  //   // Reset nonce
  //   await user.update({ nonce: crypto.randomUUID() });
  //   return true;
}
