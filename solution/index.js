import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import pkg from "elliptic";
import { performance } from "perf_hooks";
const { ec: EC } = pkg;
import { ImpelmentCommands } from "./Helpers/ImplementCommands.js";
import { SHA256, doubleSha256, OP_HASH160 } from "./Helpers/Hashes.js";
import { serializeTxn } from "./Helpers/digests/serialize.js";
import { messageDigestp2wpkh } from "./Helpers/digests/messageDigestp2wpkh.js";
import { messageDigest_p2sh } from "./Helpers/digests/messageDigest_p2sh.js";

readAllFilesGetData("mempool");
// readfilesFromFile();
function readfilesFromFile() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Replace 'all_p2pkh.txt' with the path to your text file
  const filePath = path.join(__dirname, "all_p2pkh.txt");

  // Read the file line by line
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    // Split the file content by new lines
    const lines = data.split(/\r?\n/);

    // Extract and print each filename
    const inValidTransactions = [];
    lines.forEach((line) => {
      if (line) {
        // Assuming the filename is the first word of the line
        const filename = line.split(" ")[0];
        const filePath = `mempool/${filename}.json`;
        const fileContent = fs.readFileSync(filePath, "utf8");
        const JsonData = JSON.parse(fileContent);
        if (!verifyTransaction(JsonData)) {
          inValidTransactions.push(getFileName(JsonData));
        }
        // console.log(inValidTransactions);
      }
    });
    // write invalid transactions to the file
    fs.writeFileSync(
      "invalid_transactions.txt",
      inValidTransactions.join("\n")
    );
  });
}

function readAllFilesGetData(FolderPath) {
  //read the valid transactions from the file if file not present keep it empty
	@@ -114,8 +71,8 @@ function readAllFilesGetData(FolderPath) {
  });

  // fs.writeFileSync("valid_transactions.txt", JSON.stringify(Data));
  fs.writeFileSync(
    "valid_transactions_Count.json",
    JSON.stringify({
      Data,
    })
	@@ -131,36 +88,6 @@ function readAllFilesGetData(FolderPath) {
  console.log("v0_p2wsh", v0_p2wsh_valid, v0_p2wsht);
  console.log("v1_p2tr", v1_p2tr_valid, v1_p2trt);

  let set = new Set();

  // ValidData.forEach((e) => {
  //   // console.log(e.types[0]);
  //   console.log(e.types);
  // });
  // now every file has been read and we have the valid data with its types

  //write the fileNames to the
  // let sets = new Set();
  // // console.log(ValidData[0], "Valid Transactions");
  // ValidData.forEach((e) => {
  //   if (e.types.size != 1) {
  //     if (!sets.has(e.types)) {
  //       sets.add(e.types);
  //     }
  //   }
  // });

  //write this to the file
  // let setArray = Array.from(sets); // Assuming 'sets' is an iterable of Set objects
  // for (let i = 0; i < setArray.length; i++) {
  //   // Convert each Set to an Array to use the join method
  //   setArray[i] = Array.from(setArray[i]).join(" ");
  // }

  // fs.writeFileSync("set.txt", setArray.join("\n"));

  // fs.writeFileSync("_transactions.txt", ValidData);
  // Return the valid data
  return ValidData;
}