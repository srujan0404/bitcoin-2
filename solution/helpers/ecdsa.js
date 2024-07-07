import pkg from "elliptic";
const { ec: EC } = pkg;

function parseDER(serialized) {
  const toHex = (start, length) => serialized.substring(start, start + length);

  // Extract R
  const rLength = parseInt(toHex(6, 2), 16) * 2;
  const rStart = 8;
  const rEnd = rStart + rLength;
  const r = toHex(rStart, rLength);

  // Extract S
  const sLength = parseInt(toHex(rEnd + 2, 2), 16) * 2;
  const sStart = rEnd + 4;
  const sEnd = sStart + sLength;
  const s = toHex(sStart, sLength);

  return { r, s };
}

function verifyECDSASignature(publicKeyHex, signatureHex, messageHex) {
  const ecdsa = new EC("secp256k1");
  const key = ecdsa.keyFromPublic(publicKeyHex, "hex");
  const signature = parseDER(signatureHex);
  const isValid = key.verify(messageHex, signature);
  return isValid;
}

export { verifyECDSASignature };
