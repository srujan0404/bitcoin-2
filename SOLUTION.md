# Solution to the SOB(Summer of Bitcoin) Assingment

## Table Of Contents
  - [Design Approach](#design-approach)
  - [Design Overview](#design-overview)
  - [Implementaion Details](#implementationdetails)
  - [Results and Performance](#results-and-performance)
  - [Conclusion](#conclusion)
## Design Approach:
![Basic Design](images/basic-design.png)

## Design Overview

1. **Read Mempool Transactions**: Read all transactions from the memory pool (mempool).
2. **Verify File Names**: For each transaction, verify the file names by first calculating the `txId` as `Hash256(serialization(transaction))`, then compute `SHA256(txId)` to get the filename.
3. **Transaction Verification**: Verify all transactions using the `script_signature_asm` and `scriptpubkey_asm`, implementing a stack. Further details on this step will be discussed in the implementation section.
4. **Transaction Types**: Various types of transactions exist as depicted in the design. These types will be handled during the verification process.
5. **Create Merkle Root and Witness Txids**: Take the verified transactions and create a merkle root and witness Txids, along with the transactionIds needed to be added to the block.
6. **Create Coinbase Transaction**: As there are segwit transactions, create a coinbase transaction using the witness Txids produced in the previous step. Calculate the transaction weight and fees for verification.
  7. **Create Block**: Use the merkle root , and vary nonce and time stamps to meet the dificulty target and create the block

## Implementation Details

### Structure of MyCode

```

code-challenge-2024-narasimha-1511/

├── solution/
│   ├── index.js
│   ├── mine.js
│   └── Helpers/
│       ├── ecdsa.js  
│       ├── Hashes.js  
│       ├── ImplementCommands.js  
│       │── witnessTxId.js  
│       ├── digests/
│       │   ├── messageDigest.js
│       │   ├── messageDigest_p2sh.js
│       │   ├── messageDigestp2wpkh.js
│       │   └── serializeTxn.js
│       └── block/
│           ├── calculateWeight.js
│           ├── coinBase.js
│           ├── createBlock.js
│           ├── merkle_root.js
├── SOLUTION.md
└── README.md
```

The directory structure described above will now be discussed in terms of its implementation details

  ### Table Of Functions
  - [Verifying Transactions](#indexjs)
  - [ECDSA Verification](#helpersecdsajs)
  - [Hashes](#helpershashesjs)
  - [Implementing Stacks](#helpersimplementcommandsjs)
  - [Serialization](#helpersdigestsserializejs)
  - [Message Digest for P2PKH](#helpersdigestsmessagedigestjs)
  - [Message Digest for P2SH](#helpersdigestsmessagedigest_p2shjs)
  - [Message Digest for P2WPKH, P2SH-P2WPKH, P2WSH](#helpersdigestsmessagedigest_p2wpkhjs)
  - [Merkle Root](#helpersblockmerklerootjs)
  - [Witness Transaction ID](#helperswitnesstxidjs)
  - [Coinbase Transaction](#helpersblockcoinbasejs)
  - [Calculate Weight](#helpersblockcalculateweightjs)
  - [Create Block Header](#helpersblockcreateblockjs)
  - [Mining](#minejs)
  

###   `index.js` 

```javascript

    fn readAllFiles(dir="mempool") ->
    {
        ValidTxns = []
        for(transaction in mempool){
            if(isValidFileName(transaction)){
               ValidTxns.push(transaction)
            }
        }  
        TxnsforMining = [];
        
        validTxns.forEach((txn)=>{
            if(verify(txn)){
                TxnsforMining.push(txn)
            }
        });
        
        mine(TxnsforMining);
        
        fn veriy(transaction){
            /*
            here every transaction will be
            verfied using the script pub key asm's and witnesses
            we run these asm's in stacks,
            each opcode has a particluar funciton
            */
           ImplementCommands(transaction.asms);
           msgDigest = digest(transaction);
           signature = transaction.signature;
           publicKey = transaction.pubKey;
           return verifyECDS(msgDigest,signature,publicKey);
        }
    }

    function isValidFileName(JsonData, fileName) {
        serialize = serialize(Jsondata)
        txid = HASH256(serialize)// assumin this is in little endian format
        file = SHA256(txid)
        if(file == fileName) true;
    }

```

**Explanation**
1. Above, you can see that we first go through all the transactions and only select those whose filename is valid for filtering these transactions.
2. Then, we start validating these transactions using the script pubkey ASM's, and we mostly verify their ECDSA signatures here.
3. All the external functions used, such as ECDSAVerification,ImplementCommands will be discussed in the next files.
4. All the script signature asms , will be implemented using the ImplementCommands function will be discussed later
</details>

### `Helpers/ecdsa.js`

```javascript
    const pkg = require('elliptic')
    const { ec:EC } = pkg;

    fn ECDSAverify(message,pubkey,signature){
        const ecdsa = new EC("secp256k1");
        const key = ecdsa.keyFromPublic(pubkey, "hex");
        const isValid = key.verify(message, parseDER(signature));
    return isValid;
    }

    fn parseDER(signature){
        const rl = parseInt(serialized.substring(6, 8), 16) * 2;
        const r = serialized.substring(8, 8 + rl);
  
        const sl = parseInt(serialized.substring(10 + rl, 12 + rl), 16) * 2;
        const s = serialized.substring(12 + rl, 12 + rl + sl);

        return { r, s };
    }
```
**Explanation**

1. Here, above, you can see that first, after we start the function, we use the elliptic library for verifying without reinventing the wheel.
2. We pass the public key and message as they are.
3. As the signature is DER encoded, we extract the r and s values and pass them as an object in this function.
4. 
reference for Parsing the Signature : https://learn.saylor.org/mod/book/view.php?id=36341&chapterid=18917

### `Helpers/hashes.js`
  
```javascript
fn doubleSha256(hexInput):
    buffer = Convert hexInput to Buffer
    firstHash = Calculate SHA-256 hash of buffer
    secondHash = Calculate SHA-256 hash of firstHash
    RETURN secondHash as hexadecimal string

fn SHA256(data):
    buffr = Convert data to Buffer
    sha256 = Create new SHA-256 hash object
    RETURN SHA-256 hash of buffer as hexadecimal string

fn OP_HASH160(publicKey):
    sha256Hash = Create new SHA-256 hash object
    sha256Hash.update(Convert publicKey to Buffer)
    sha256 = Get digest of sha256Hash
    ripemd160Hash = Create new RIPEMD-160 hash object
    ripemd160Hash.update(sha256)
    ripemd160 = Get digest of ripemd160Hash
    RETURN ripemd160 as hexadecimal string
```

**Explanation**
- **doubleSha256** Calculates the double SHA-256 hash of a given hexadecimal input (hexInput). calculates the first SHA-256 hash , and again using SHA-256 and returns the final hash result as a hexadecimal string.
- **SHA256**  Calculates the SHA-256 hash of a given data string (data). SHA-256 hash using Node.js's crypto module. Returns the resulting hash.
- **OP_HASH160**  Implements the OP_HASH160 operation commonly used in Bitcoin scripts. Calculates the SHA-256 hash of the publicKey input, then calculates the RIPEMD-160 hash of the SHA-256 hash. Returns the final RIPEMD-160 hash .
**Note**: All these functions first Convert the given Hex to Buffer then Again while returning the hash they convert to hex
### `Helpers/ImplementCommands.js`

```javascript
fn ImpelmentCommands(stack, commands, type, transaction, index):
    commands.forEach((command)=>{
       IF command STARTS WITH "OP_PUSHBYTES_" OR "OP_PUSHDATA1" OR "OP_0":
            CONTINUE // These commands are automatically handled when the bytes are pushed
        ELSE IF command EQUALS "OP_HASH160":
            stackElement = stack.pop()
            hash = OP_HASH160(stackElement)
            stack.push(hash)
        ELSE IF command EQUALS "OP_EQUAL" OR command EQUALS "OP_EQUALVERIFY":
            stackElement1 = stack.pop()
            stackElement2 = stack.pop()
            stack.push(stackElement1 EQUALS stackElement2)
        ELSE IF command EQUALS "OP_DUP":
            stackElement = stack.pop()
            stack.push(stackElement)
            stack.push(stackElement)
           // ... more Commands are there for op codes
    })
    RETURN stackk
```

**Explanation**
 - The `ImpelmentCommands` function takes several arguments: a stack to hold values, commands representing the script commands to be executed, `type` indicating the transaction type, transaction representing the transaction data, and `index` indicating the index of the transaction input. The function iterates over each command in the commands array and implements the logic based on the command type.
- For commands like `OP_PUSHBYTES_`, `OP_PUSHDATA1`, and `OP_0`, no action is taken as the bytes are automatically pushed onto the stack.
- Commands like `OP_HASH160` calculate the `RIPEMD-160` hash of the top stack element and push the result back onto the stack.
- Commands like `OP_EQUAL` and `OP_EQUALVERIFY` compare the top two stack elements for equality and push the result back onto the stack.
- We have many `OP_CODES` as we go on, so here is the reference to the opcodes: [Script - Bitcoin Wiki](https://en.bitcoin.it/wiki/Script)

### `Helpers/digests/serialize.js`

```javascript
fn serializeTxn(transaction):
    serialized = ""
    serialized += version
    serialized += input_count
    // Serialize inputs
    FOREACH input IN transaction.vin:
        serialized += input.txid
        serialized += input.vout
        // Serialize scriptSig length
        serialized += input.scriptsig.length // in bytes 
        serialized += input.scriptsig
        serialized += input.sequence 
        
    serialized += transaction.vout.length // outputcount

    // Serialize outputs
    FOREACH output IN transaction.vout:
        serialized += output.value
        serialized += output.scriptpubkey.length // in bytes
        serialized += output.scriptpubkey
    
    serialized += transaction.locktime
    RETURN { filename: serialized, types: set }
```
  **Explanation**:
- The `serializeTxn` function serializes a Bitcoin transaction object into a hexadecimal string representation.
- It iterates over the transaction's inputs and outputs, appending their serialized representations to the `serialized` string.
- For each input, it appends the transaction ID (`txid`) in little-endian format, the output index (`vout`) in little-endian format, the scriptSig length, the scriptSig itself (if the inputIndex matches or if inputIndex is -1), and the sequence in little-endian format.
- For each output, it appends the value in little-endian format (assuming it's in satoshis), the scriptPubKey length, and the scriptPubKey itself.
- The function returns an object containing the serialized transaction string (`filename`) and a set (`types`) of unique scriptpubkey types encountered in the inputs.
### `Helpers/digests/messageDigest.js`

**This Digest is particularly for only Transaction of type p2pkh**

```javascript
fn messageDigest(transaction, inputIndex):
    serialized = ""
    serialized += transaction.version
    serialized += transaction.vin.length//input_count

    FOREACH input IN transaction.vin:
        serialized += input.txid
        serialized += input.vout

        IF index EQUALS inputIndex:
            serialized += input.prevout.scriptpubkey.length 
            serialized += input.prevout.scriptpubkey
        ELSE:
            serialized += "00" // Empty scriptSig
        
        serialized += input.sequence
    
    serialized += transaction.vout.length//output_count

    FOREACH output IN transaction.vout:
        serialized += output.value
        serialized += output.scriptpubkey.length 
        serialized += output.scriptpubkey

    serialized += transaction.locktime
    
    RETURN serialized + "01000000"// this is SIGH_HASH_ALL 
```

**Explanation**
- The `messageDigest` function serializes a Bitcoin transaction object into a hexadecimal string representation, similar to the `serializeTxn` function.
- It iterates over the transaction's inputs and outputs, appending their serialized representations to the `serialized` string.
- For each input, it appends the transaction ID (`txid`) in little-endian format, the output index (`vout`) in little-endian format, the scriptSig length, the scriptSig itself (if the inputIndex), and the sequence in little-endian format.
- For each output, it appends the value in little-endian format (assuming it's in satoshis), the scriptPubKey length, and the scriptPubKey itself.
- The function returns the serialized transaction string (`serialized`) appended with a standard four-byte little-endian value ("01000000") representing the transaction's default locktime.
- I have not converted anything to little endian as this is a pseudo code
### `Helpers/digests/messageDigest_p2sh.js`

```javascript
fn messageDigest_p2sh(transaction, inputIndex):
    messageDigest_p2sh = ""

    messageDigest_p2sh += transaction.version
    messageDigest_p2sh += transaction.vin.length

    // Serialize inputs
    FOREACH input, index IN transaction.vin:
        messageDigest_p2sh += input.txid
        messageDigest_p2sh += input.vout
        IF index EQUALS inputIndex:
            // Serialize scriptSig
            let scriptsig_asm = input.scriptsig_asm || "SCRIPT SIG ASM: MISSING";
            let scriptsig_asm_slices = scriptsig_asm.split(" ");
            let redeem_script = "";
            IF scriptsig_asm_slices.length != 0:
                redeem_script = scriptsig_asm_slices[scriptsig_asm_slices.length - 1];
            messageDigest_p2sh += redeem_script.length 
            messageDigest_p2sh += redeem_script;
        ELSE:
            messageDigest_p2sh += "00"; // Empty scriptSig
            
        messageDigest_p2sh += input.sequence
        
    messageDigest_p2sh += transaction.vout.length

    // Serialize outputs
    FOREACH output IN transaction.vout:
        messageDigest_p2sh += output.value
        messageDigest_p2sh += output.scriptpubkey.length 
        messageDigest_p2sh += output.scriptpubkey
    
    messageDigest_p2sh += transaction.locktime

    RETURN messageDigest_p2sh + "01000000"; // This is the SIGHASH_ALL flag

```

**Explanation**
- The `messageDigest_p2sh` function is used to create a message digest for a P2SH (Pay-to-Script-Hash) transaction.
- It serializes the version, inputs, and outputs of the transaction, similar to the `messageDigest` function, but also includes the redeem script for the specified `InputIndex`.
- If the `InputIndex` matches the current input being serialized, the redeem script is included in the serialized output. Otherwise, an empty scriptSig is added.
- The function returns the serialized message digest appended with the SIGHASH_ALL flag (represented as "01000000" in hexadecimal).
- I have not Converted any of them to Little endian as this is a Pseudo Code
### `Helpers/digests/messageDigest_p2wpkh.js`

**This Message Digest is  for Types , P2WPKH . P2WSH, P2SH_P2WPKH.**

```javascript
fn messageDigestp2wpkh(transaction, inputIndex, type = "p2wpkh"):
    IF transaction.vin.length <= inputIndex THEN
        RETURN ""; // Invalid input index, return empty string
    END IF

    version = transaction.version
    
    prevouts = ""
    sequences = ""
    
    FOREACH input IN transaction.vin:
        prevouts += input.txid
        prevouts += input.vout
        sequences += input.sequence
        
    hashPrevouts = doubleSha256(prevouts)
    SequenceHash = doubleSha256(sequences)

    serialized = version + hashPrevouts + SequenceHash

    serialized +=
        transaction.vin[inputIndex].txid +
        transaction.vin[inputIndex].vout
        
    IF type EQUALS "p2wpkh" THEN
        // Serialize script code for p2wpkh
        serialized +=
            "1976a914" +
            transaction.vin[inputIndex].prevout.scriptpubkey.slice(4) +
            "88ac"
    ELSE IF type EQUALS "p2sh_p2wpkh" THEN
        // Serialize script code for p2sh_p2wpkh
        serialized +=
            "1976a914" +
            transaction.vin[inputIndex].inner_redeemscript_asm.split(" ")[2] +
            "88ac"
    ELSE IF type EQUALS "p2wsh" THEN
        // Serialize witness data for p2wsh
        let length = transaction.vin[inputIndex].witness.length;
        serialized +=
            transaction.vin[inputIndex].witness[length - 1].length  +
            transaction.vin[inputIndex].witness[length - 1]
    
    serialized += transaction.vin[inputIndex].prevout.value
    serialized += transaction.vin[inputIndex].sequence
    
    outputs = ""
    FOREACH output IN transaction.vout:
        outputs += output.value
        outputs += output.scriptpubkey.length
        outputs += output.scriptpubkey

    hashOutputs = doubleSha256(outputs)
    serialized += hashOutputs

    // Serialize locktime
    serialized += transaction.locktime
    
    RETURN doubleSha256(serialized + "01000000")
```

**Explanation**
- The `messageDigestp2wpkh` function is used to create a message digest for a P2WPKH (Pay-to-Witness-Public-Key-Hash) transaction.
- It serializes the version, prevouts, sequences, current input, script code, input amount, sequence, outputs, and locktime of the transaction.
- The function handles different types of transactions based on the `type` parameter:
    - For `p2wpkh`, it includes the script code for P2WPKH.
    - For `p2sh_p2wpkh`, it includes the script code for P2SH-P2WPKH.
    - For `p2wsh`, it includes the witness data for P2WSH.
- The function then calculates the double SHA-256 hash of the serialized data appended with the SIGHASH_ALL flag (represented as "01000000" in hexadecimal) and returns the resulting hash.
- Reference : [BIP 143: Transaction Signature Verification for Version 0 Witness Program (bips.dev)](https://bips.dev/143/)
### `Helpers/Block/merkleRoot.js`

```javascript
fn merkle_root(txids):
    // Convert each txid to a Buffer and little Endian
    hashes = txids.map((txid) =>
        Buffer.from(txid.match(/../g).reverse().join(""), "hex")
    )
    // Continue hashing pairs of hashes until only one hash remains
    WHILE hashes.length > 1 DO
        newHashes = []
        FOR i FROM 0 TO hashes.length BY 2 DO
            left = hashes[i]
            right = ""
            IF i + 1 === hashes.length THEN
                right = left
            ELSE
                right = hashes[i + 1]
            END IF
            // Concatenate left and right hashes and hash them together
            hash = doubleSha256(Buffer.concat([left, right]))
            newHashes.push(Buffer.from(hash, "hex"))
        END FOR
        hashes = newHashes
    END WHILE
    // Return the final hash as a hexadecimal string
    RETURN hashes[0].toString("hex")
```
**Explanation**
- The `merkle_root` function is used to calculate the Merkle root of a list of transaction ids (`txids`).
- It first converts each transaction id to a Buffer, litlle Endian (since Bitcoin uses little-endian byte order), and stores it in the `hashes` array.
- It then repeatedly hashes pairs of hashes (concatenated together) until only one hash remains, which is the Merkle root.
- The function uses the `doubleSha256` function to compute the hash of concatenated left and right hashes
- Finally, it returns the Merkle root as a hexadecimal string.

### `Helpers/witnessTxID.js`

```javascript
fn witness_TxId(transaction):
    serialized = "" // Initialize an empty string for serialization
    witness = []    // Initialize an empty array to store witness data
    stack_items = 0 // Initialize stack_items counter
    stack_items_witness = "" // Initialize stack_items_witness string

    serialized += transaction.version

    serialized += "0001"; // Append marker + flag
    serialized += transaction.vin.length

    // Serialize inputs
    transaction.vin.forEach((input) => {
        stack_items = 0; // Reset stack_items for each input
        stack_items_witness = ""; // Reset stack_items_witness for each input

        serialized += input.txid

        // Serialize witness data
        stack_items = input.witness.length
        input.witness.forEach((witnessData) => {
            stack_items_witness += witnessData.length 
            stack_items_witness += witnessData;
        });
        
        witness.push(stack_items + stack_items_witness);
        serialized += input.vout
        serialized += input.scriptsig.length 
        serialized += input.scriptsig;
        serialized += input.sequence
    });

    // Serialize number of outputs
    serialized += transaction.vout.length

    // Serialize outputs
    transaction.vout.forEach((output) => {
        serialized += output.value
        serialized += output.scriptpubkey.length 
        serialized += output.scriptpubkey;
    });

    serialized += witness.join(""); // Append all witness data to the serialization

    serialized += transaction.locktime

    const Witnesstxid = doubleSha256(serialized).match(/../g).reverse().join("");

    RETURN Witnesstxid; 
```

**Explanation**
- The `witness_TxId` function serializes a Bitcoin transaction with witness data (SegWit) and calculates its transaction id.
- It first initializes the `serialized` string and an empty array `witness` to store witness data.
- The function iterates over each input in the transaction, serializing the txid, witness data, vout, scriptSig, and sequence.
- For witness data, it calculates the length of each witness item and concatenates them together with their respective data.
- It then serializes the number of outputs, each output's value and scriptPubKey, and finally the locktime.
- After serializing all inputs and outputs, it concatenates all the witness data to the serialized string.
- It then double SHA-256 hashes the serialized data and reverses the result to get the transaction id.
- I have Not Converted data to Little endian as this is psedo code

### `Helpers/Block/Coinbase.js`
```javascript
fn coinBase(witnessTxs):
    coinBase = "" 

    coinBase += "01000000" // Version 
    coinBase += "00"       // Marker 
    coinBase += "01"       // Flag 

    // Append input information
    coinBase += "01" // Number of inputs
    coinBase += "0000000000000000000000000000000000000000000000000000000000000000" // Previous Transaction Hash 
    coinBase += "ffffffff" // Previous Txout-index 
    coinBase += "25" // Txin-script length 
    coinBase += "246920616d206e61726173696d686120616e64206920616d20736f6c76696e672062697463" // Sig Contains => "$i am narasimha and i am solving bitc"
    coinBase += "ffffffff" // Sequence 
    
    coinBase += "02" // Number of outputs
    // First Output
    coinBase += "f595814a00000000" // Hard coded amount for Blockr reward
    coinBase += "19"               // Txout-script length 
    coinBase += "76a914edf10a7fac6b32e24daa5305c723f3de58db1bc888ac" 

    // Second Output
    coinBase += "0000000000000000" // Amount 2 
    // Create the witness commitment
    let script = `6a24aa21a9ed${witnessCommitment(witnessTxs)}`;
    coinBase += script.length  
    coinBase += script;

    // Append stack items and reserved value
    coinBase += "0120" // stack items , length of the stack item
    coinBase += "0000000000000000000000000000000000000000000000000000000000000000" // Reserved value
    coinBase += "00000000" // Locktime 
    RETURN coinBase; // Return the coinbase transaction

 fn witnessCommitment(witnessTxs):
  const merkle = merkle_root(witnessTxs);
  const reserved_value =
    "0000000000000000000000000000000000000000000000000000000000000000";
  return doubleSha256(merkle + reserved_value);
 
```

**Information**.
- It first initializes an empty string `coinBase` to store the serialized coinbase transaction.
- The function appends the version, marker, and flag fields to the coinbase.
- It then appends the input information, including the coinbase data.
- Next, it appends the output information, including a hardcoded reward for the miner and a  script pub key.
- The function then calculates the witness commitment by calling the `witnessCommitment` function, which calculates the merkle root of the witness transactions and double SHA-256 hashes it along with a reserved value.
- Finally, the function appends the witness commitment to the coinbase transaction and returns the serialized coinbase transaction.
- This coinbase transaction is used as the first transaction in a block and includes the miner's reward as well as the witness commitment for SegWit transactions.

### `Helpers/Block/calculateWeight.js`
```javascript
FUNCTION calculateWeight(tx):
    tx_type = "SEGWIT" // Assume transaction is segwit by default

    // Check if any input is missing witness data, then it's legacy
    IF ANY input IN tx.vin WHERE input.witness === undefined:
        tx_type = "LEGACY"

    tx_weight = 0 // Initialize transaction weight
    segwit_wt = 0 // Initialize segwit weight

    tx_weight += 4 // Version 
    tx_weight += 1 // Input count 
    // Iterate over transaction inputs and calculate weight
    FOR EACH input IN tx.vin:
        tx_weight += 32 // Txid 
        tx_weight += 4 // Vout 
        tx_weight += 1 // scriptSig length
        tx_weight += input.scriptsig.length // scriptSig 
        tx_weight += 4 // Sequence 
    tx_weight += 1 // Output count 

    // Iterate over transaction outputs and calculate weight
    FOR EACH output IN tx.vout:
        tx_weight += 8 // Value
        tx_weight += 1 // scriptPubKey length 
        tx_weight += output.scriptpubkey.length // scriptPubKey 

    tx_weight += 4 // Locktime 

    IF tx_type === "SEGWIT":
        segwit_wt += 1 // Number of stack items 
        // Iterate over transaction inputs and their witnesses to calculate segwit weight
        FOR EACH input IN tx.vin:
            FOR EACH witness IN input.witness:
                segwit_wt += 1 + witness.length // Witness

    // Calculate complete weight including segwit weight
    complete_weight = tx_weight * 4 + segwit_wt

    RETURN { complete_weight, tx_type }

```
**Explanation**
- It  initializes the transaction weight (`tx_weight`) and segwit weight (`segwit_wt`) to zero.
- The function iterates over the transaction inputs (`vin`) and adds the size of each input to the transaction weight. Each input consists of the transaction ID (`txid`), output index (`vout`), script length, script signature (`scriptsig`), and sequence.
- It then iterates over the transaction outputs (`vout`) and adds the size of each output to the transaction weight. Each output consists of the value (`value`) and script length of the locking script (`scriptpubkey`).
- If the transaction is segwit, the function calculates the segwit weight (`segwit_wt`) by adding the size of the witness data for each input.
- Finally, the function calculates the complete weight by multiplying the transaction weight by 4 (to convert to weight units) and adding the Segwit weight.
- The function returns an object containing the complete weight and the type of the transaction (`tx_type`), which is either "SEGWIT" or "LEGACY" , this later used while Mining for Coinbase Transaction
- As this is Pseudo Code I have not Converted them to bytes in this code.

### `Helpers/Block/createBlock.js`

```javascript
fn createBlock(merkle_root, nonce):
    block = "" // Initialize an empty string for the block

    block += "11100000" // Version 
    block += "0000000000000000000000000000000000000000000000000000000000000000" // Previous Block Hash 
    block += merkle_root 
    block += Math.floor(Date.now() / 1000);
    block += "ffff001f" // Target
    block += nonce
    
    RETURN block; // Return the serialized block
```
**Explanation**
- It first initializes an empty string `block` to store the serialized block.
- The function appends the version, which is hardcoded to "11100000" in little-endian format.
- It then appends a placeholder for the previous block hash, which is all zeros as this is the genesis block
- Next, the function appends the provided merkle root, which is the root of the merkle tree of all transactions in the block.
- The function calculates the current timestamp in seconds since the Unix epoch and appends it to the block header.
- It appends the bits field, which represents the current target for the block hash, hardcoded as "ffff001f" in little-endian format.
- Finally, the function appends the nonce, which is a 4-byte value that miners increment in an attempt to find a valid block hash that meets the current target.
- The function returns the serialized block header, which is used to mine a new block in the blockchain.

### `mine.js`
```javascript
fn mine(data):
    validTransactions = []
    txids = []
    
    // Process transactions
    for each transaction in data:
        serialize = serializeTxn(transaction.fileContent)
        txid = doubleSha256(serialize.filename).reverse().join("")
        txn = readTransactionFromFile(transaction.fileName)
        validTransactions.push(txn)
        txids.push(txid)

    max_weight = 4 * 1000 * 1000
    current_weight = 320
    transactions = []
    witnessTxs = []

    // Select valid transactions
    for i from 0 to validTransactions.length:
        tx_wt, tx_type = calculateWeight(validTransactions[i])
        if tx_type == "SEGWIT":
            witnessTxs.push(witness_TxId(validTransactions[i]))
        else:
            witnessTxs.push(txids[i])
        if tx_wt and current_weight + tx_wt <= max_weight:
            transactions.push(txids[i])
            current_weight += tx_wt
        else:
            break

    witnessTxs.unshift("0".padStart(64, "0"))
    coinbaseTransacton = coinBase(witnessTxs)
    coinBaseTxId = doubleSha256(coinbaseTransacton).reverse().join("")
    transactions.unshift(coinBaseTxId)
    merkleRoot = merkle_root(transactions)
    block = createBlock(merkleRoot, 0)

    // Mine the block
    nonce = 0
    difficulty = "0000ffff00000000000000000000000000000000000000000000000000000000"
    blockHash = doubleSha256(block).reverse().join("")
    while blockHash > difficulty:
        nonce++
        block = createBlock(merkleRoot, nonce)
        blockHash = doubleSha256(block).reverse().join("")

    // Write to output file
    writeToFile("output.txt", block + "\n" + coinbaseTransacton + "\n" + transactions.join("\n"))

```

**Explanation**
- **Initialization**: It initializes arrays to store valid transactions and their corresponding transaction IDs.
- **Processing Transactions**: It iterates over the input `data` array, which contains transaction information. For each transaction, it calculates the transaction ID (`txid`) and reads the transaction data from a file in the "mempool" directory. It then adds the transaction to the list of valid transactions and its ID to the list of transaction IDs.
- **Weight Calculation**: It calculates the weight of each transaction using the `calculateWeight` function and adds the transaction ID to the `transactions` array if its weight does not exceed the maximum weight limit (`max_weight`).
- **Coinbase Transaction**: It creates the coinbase transaction (`coinbaseTransacton`) using the `coinBase` function and calculates its transaction ID (`coinBaseTxId`).
- **Merkle Root Calculation**: It calculates the merkle root of the transactions using the `merkle_root` function.
- **Block Creation**: It continuously increments the nonce value in the block header and calculates the block hash until the hash meets the difficulty target specified by `difficulty`. Once the hash meets the target, it stops and finalizes the block.
- **Output File**: It writes the block header, coinbase transaction, and list of transaction IDs to an output file named "output.txt".



## Results and Performance:

I successfully mined a block containing transactions of types P2PKH, P2SH, P2WPKH, and P2WSH. After all the necessary verifications, including the combined ECDSA signatures, the mining process took roughly 2 minutes or less. The latest block weighed in at 3,722,185 bytes, with a collected fee of 21,018,075 satoshis. I considered including P2TR transactions as well, but I prioritized completing a proposal due to time constraints from communication with organizations and proposal writing.

## Conclusion:
Solving the problem of mining a block in a simplified Bitcoin-like blockchain system involves several key insights and areas for improvement:

1. **Transaction Processing:** Understanding how transactions are processed, including serialization, transaction types (legacy or segwit), and weight calculation, is crucial. This insight helps in efficiently selecting transactions for inclusion in the block.

2. **Block Creation:** Creating a block involves constructing the block header, generating the coinbase transaction, calculating the merkle root of the transaction ids, and mining the block by finding a suitable nonce. This process highlights the importance of block validation and consensus rules.
    
3. **Mining Difficulty:** The mining process requires finding a block hash that meets a certain difficulty target. This difficulty adjustment mechanism ensures that blocks are mined at a consistent rate, maintaining the security and stability of the blockchain.
    
4. **Future Improvement:** Future research could focus on optimizing the transaction selection algorithm to improve block efficiency and reduce processing time. Additionally, exploring more sophisticated mining algorithms or consensus mechanisms could enhance the scalability and security of the blockchain.
    
5. **References:** During the problem-solving process, resources such as the Bitcoin whitepaper, blockchain development tutorials, and cryptographic libraries (elliptic,crypto) were consulted to understand the underlying principles and implementation details of blockchain technology.

Overall, solving the problem of block mining provides valuable insights into the complexities of blockchain systems and highlights areas for further research and improvement