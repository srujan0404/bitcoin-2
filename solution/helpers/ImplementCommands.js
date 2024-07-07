import { doubleSha256, OP_HASH160 } from "./Hashes.js";
import { messageDigest } from "./digests/messageDigest.js";
import { messageDigest_p2sh } from "./digests/messageDigest_p2sh.js";
import { messageDigestp2wpkh } from "./digests/messageDigestp2wpkh.js";
import { verifyECDSASignature } from "./ecdsa.js";

function ImplementCommands(
  stack,
  commands,
  type = "p2pkh",
  transaction,
  index
) {
  commands.forEach((command) => {
    if (
      command.startsWith("OP_PUSHBYTES_") ||
      command.startsWith("OP_PUSHDATA1") ||
      command.startsWith("OP_0")
    ) {
      // Handle pushing bytes or data, no action needed here
    } else if (command === "OP_HASH160") {
      const stackElement = stack.pop();
      const hash = OP_HASH160(stackElement);
      stack.push(hash);
    } else if (command === "OP_EQUAL" || command === "OP_EQUALVERIFY") {
      const stackElement1 = stack.pop();
      const stackElement2 = stack.pop();
      const isEqual = stackElement1 === stackElement2;
      stack.push(isEqual);
    } else if (command === "OP_DUP") {
      const stackElement = stack.pop();
      stack.push(stackElement, stackElement); // Push twice
    } else if (command === "OP_CHECKSIG") {
      const prevResponse = stack.pop();
      if (prevResponse === true) {
        const publicKey = stack.pop();
        const signature = stack.pop();
        const message = messageDigest(transaction, index);
        const hash = doubleSha256(message);
        const isValid = verifyECDSASignature(publicKey, signature, hash);
        stack.push(isValid);
      }
    } else if (command === "OP_CHECKMULTISIG") {
      let message = "";
      if (type === "p2sh") {
        message = doubleSha256(messageDigest_p2sh(transaction, index));
      } else if (type === "p2wsh") {
        message = doubleSha256(
          messageDigestp2wpkh(transaction, index, "p2wsh")
        );
      }

      const noOfKeys = stack.pop();
      const keys = [];
      for (let i = 0; i < noOfKeys; i++) {
        keys.push(stack.pop());
      }

      const noOfSignatures = stack.pop();
      const signatures = [];
      for (let i = 0; i < noOfSignatures; i++) {
        signatures.push(stack.pop());
      }

      let allValid = true;
      for (let i = 0; i < noOfSignatures; i++) {
        let isValid = false;
        for (let j = 0; j < noOfKeys; j++) {
          if (verifyECDSASignature(keys[j], signatures[i], message)) {
            isValid = true;
            break;
          }
        }
        if (!isValid) {
          allValid = false;
          break;
        }
      }
      stack.push(allValid);
    } else if (command.startsWith("OP_PUSHNUM")) {
      stack.push(parseInt(command.split("_")[2]));
    } else {
      stack.push(command); // Push other commands directly onto the stack
    }
  });
  return stack;
}

export { ImplementCommands };
