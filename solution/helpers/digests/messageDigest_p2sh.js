function messageDigest_p2sh(transaction, inputIndex) {
  let messageDigest_p2sh = "";

  // Helper function to serialize numbers in little-endian format
  const toLittleEndian = (number, bytes) => {
    return number
      .toString(16)
      .padStart(bytes * 2, "0")
      .match(/../g)
      .reverse()
      .join("");
  };

  // Serialize version (4 bytes, little-endian)
  messageDigest_p2sh += toLittleEndian(transaction.version, 4);

  // Serialize number of inputs (1 byte)
  messageDigest_p2sh += transaction.vin.length.toString(16).padStart(2, "0");

  // Serialize inputs
  transaction.vin.forEach((input, index) => {
    // Serialize txid (32 bytes, little-endian)
    messageDigest_p2sh += input.txid.match(/../g).reverse().join("");

    // Serialize vout (4 bytes, little-endian)
    messageDigest_p2sh += toLittleEndian(input.vout, 4);

    if (index === inputIndex) {
      // Serialize scriptSig length and scriptSig
      const scriptsig_asm = input.scriptsig_asm || "SCRIPT SIG ASM: MISSING";
      const redeem_script = scriptsig_asm.split(" ").pop() || "";
      messageDigest_p2sh += (redeem_script.length / 2)
        .toString(16)
        .padStart(2, "0");
      messageDigest_p2sh += redeem_script;
    } else {
      // Empty scriptSig
      messageDigest_p2sh += "00";
    }

    // Serialize sequence (4 bytes, little-endian)
    messageDigest_p2sh += toLittleEndian(input.sequence, 4);
  });

  // Serialize number of outputs (1 byte)
  messageDigest_p2sh += transaction.vout.length.toString(16).padStart(2, "0");

  // Serialize outputs
  transaction.vout.forEach((output) => {
    // Serialize value (8 bytes, little-endian)
    messageDigest_p2sh += toLittleEndian(output.value, 8);

    // Serialize scriptPubKey length and scriptPubKey
    messageDigest_p2sh += (output.scriptpubkey.length / 2)
      .toString(16)
      .padStart(2, "0");
    messageDigest_p2sh += output.scriptpubkey;
  });

  // Serialize locktime (4 bytes, little-endian)
  messageDigest_p2sh += toLittleEndian(transaction.locktime, 4);

  // Append SIGHASH_ALL flag (4 bytes, little-endian)
  messageDigest_p2sh += "01000000";

  return messageDigest_p2sh;
}

export { messageDigest_p2sh };
// Path: solution/Helpers/messageDigest_p2sh.js
