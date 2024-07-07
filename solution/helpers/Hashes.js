import crypto from "crypto";

function doubleSha256(hexInput) {
  const buffer = Buffer.from(hexInput, "hex");

  const firstHash = crypto.createHash("sha256").update(buffer).digest();
  const secondHash = crypto
    .createHash("sha256")
    .update(firstHash)
    .digest("hex");

  return secondHash;
}

function SHA256(data) {
  const buffer = Buffer.from(data, "hex");
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function OP_HASH160(publicKey) {
  const buffer = Buffer.from(publicKey, "hex");

  const sha256 = crypto.createHash("sha256").update(buffer).digest();
  const ripemd160 = crypto.createHash("ripemd160").update(sha256).digest("hex");

  return ripemd160;
}

export { doubleSha256, SHA256, OP_HASH160 };
// Path: solution/Hashes.js
