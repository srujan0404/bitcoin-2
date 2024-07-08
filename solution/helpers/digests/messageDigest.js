function messageDigest(transaction, inputIndex = -1) {
  let serialized = "";

  serialized += transaction.version
    .toString(16)
    .padStart(8, "0")
    .match(/../g)
    .reverse()
    .join("");

  serialized += transaction.vin.length.toString(16).padStart(2, "0");

  transaction.vin.forEach((input, index) => {
    serialized += input.txid.match(/../g).reverse().join("");

    serialized += input.vout
      .toString(16)
      .padStart(8, "0")
      .match(/../g)
      .reverse()
      .join("");

    if (index === inputIndex) {
      serialized += (input.prevout.scriptpubkey.length / 2)
        .toString(16)
        .padStart(2, "0");
      serialized += input.prevout.scriptpubkey;
    } else {
      serialized += "00";
    }

    serialized += input.sequence
      .toString(16)
      .padStart(8, "0")
      .match(/../g)
      .reverse()
      .join("");
  });

  serialized += transaction.vout.length.toString(16).padStart(2, "0");

  transaction.vout.forEach((output) => {
    const satoshis = output.value;

    serialized += satoshis
      .toString(16)
      .padStart(16, "0")
      .match(/../g)
      .reverse()
      .join("");

    serialized += (output.scriptpubkey.length / 2)
      .toString(16)
      .padStart(2, "0");
    serialized += output.scriptpubkey;
  });

  serialized += transaction.locktime
    .toString(16)
    .padStart(8, "0")
    .match(/../g)
    .reverse()
    .join("");

  return serialized + "01000000";
}

export { messageDigest };
