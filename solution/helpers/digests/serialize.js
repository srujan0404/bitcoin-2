function serializeTxn(transaction) {
  let serialized = "";

  serialized += transaction.version
    .toString(16)
    .padStart(8, "0")
    .match(/../g)
    .reverse()
    .join("");

  serialized += transaction.vin.length.toString(16).padStart(2, "0");
  let set = new Set();

  transaction.vin.forEach((input, index) => {
    serialized += input.txid.match(/../g).reverse().join("");
    set.add(input.prevout.scriptpubkey_type);

    serialized += input.vout
      .toString(16)
      .padStart(8, "0")
      .match(/../g)
      .reverse()
      .join("");

    serialized += (input.scriptsig.length / 2).toString(16).padStart(2, "0");
    serialized += input.scriptsig;

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

  return { filename: serialized, types: set };
}

export { serializeTxn };
// Path: solution/serialize.js
