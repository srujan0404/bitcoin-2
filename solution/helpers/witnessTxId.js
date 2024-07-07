import { doubleSha256 } from "./Hashes.js";

function witness_TxId(transaction) {
  let serialized = "";
  let witness = [];

  // Helper function to convert a number to little-endian hex and pad to specified length
  const toLittleEndianHex = (num, length) => {
    return num
      .toString(16)
      .padStart(length, "0")
      .match(/../g)
      .reverse()
      .join("");
  };

  // Serialize version (4 bytes, little-endian)
  serialized += toLittleEndianHex(transaction.version, 8);

  // Serialize marker and flag (0001)
  serialized += "0001";

  // Serialize number of inputs (1 byte)
  serialized += transaction.vin.length.toString(16).padStart(2, "0");

  // Serialize inputs
  transaction.vin.forEach((input) => {
    let stackItemsWitness = "";

    // Serialize txid (32 bytes, little-endian)
    serialized += input.txid.match(/../g).reverse().join("");

    // Serialize vout (4 bytes, little-endian)
    serialized += toLittleEndianHex(input.vout, 8);

    // Serialize scriptSig length and scriptSig
    serialized += (input.scriptsig.length / 2).toString(16).padStart(2, "0");
    serialized += input.scriptsig;

    // Serialize sequence (4 bytes, little-endian)
    serialized += toLittleEndianHex(input.sequence, 8);

    // Serialize witness field
    stackItemsWitness += input.witness.length.toString(16).padStart(2, "0");
    input.witness.forEach((witness) => {
      stackItemsWitness += (witness.length / 2).toString(16).padStart(2, "0");
      stackItemsWitness += witness;
    });

    witness.push(stackItemsWitness);
  });

  // Serialize number of outputs (1 byte)
  serialized += transaction.vout.length.toString(16).padStart(2, "0");

  // Serialize outputs
  transaction.vout.forEach((output) => {
    // Serialize the satoshis value (8 bytes, little-endian)
    serialized += toLittleEndianHex(output.value, 16);

    // Serialize scriptPubKey length and scriptPubKey
    serialized += (output.scriptpubkey.length / 2)
      .toString(16)
      .padStart(2, "0");
    serialized += output.scriptpubkey;
  });

  // Append witness data
  serialized += witness.join("");

  // Serialize locktime (4 bytes, little-endian)
  serialized += toLittleEndianHex(transaction.locktime, 8);

  // Calculate txid
  const txid = doubleSha256(serialized).match(/../g).reverse().join("");

  return txid;
}

export { witness_TxId };
// Path: solution/serialize.js
