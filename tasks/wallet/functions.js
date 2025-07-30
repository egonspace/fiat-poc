const path = require("path");
const os = require("os");
const fs = require("fs");

const iskraContractHomeDir = path.join(os.homedir(), ".my-contract");
const walletDir = path.join(iskraContractHomeDir, "wallet");

function printArguments(taskArgs) {
  console.log("============Args================");
  console.log(taskArgs);
  console.log("================================");
}

function printQueryResult(queried) {
  console.log("============QueryResult=========");
  console.log(queried);
  console.log("================================");
}

function printTxResult(receipt) {
  console.log("============TxResult============");
  if (receipt.status !== 1) {
    console.error("Tx Failed");
    console.error(receipt.logs);
  } else {
    console.log("Tx Success");
    console.log(receipt.logs);
  }
  console.log("================================");
}

function walletExist(name) {
  const walletJson = path.join(walletDir, name);
  return fs.existsSync(walletJson);
}

function walletList() {
  return fs.readdirSync(walletDir);
}

async function walletLoad(name, password, hre) {
  const walletJson = path.join(walletDir, name);
  if (!fs.existsSync(walletJson)) {
    console.error(`wallet [${name}] is not exist`);
    return;
  }
  const walletJsonContent = fs.readFileSync(walletJson);
  return hre.ethers.Wallet.fromEncryptedJsonSync(walletJsonContent, password).connect(hre.ethers.provider);
}

function walletShow(name) {
  const walletJson = path.join(walletDir, name);
  if (!fs.existsSync(walletJson)) {
    console.error(`wallet [${name}] is not exist`);
    return;
  }
  return fs.readFileSync(walletJson, "utf-8");
}

async function walletSave(name, password, wallet) {
  const encrypted = await wallet.encrypt(password);
  const walletJson = path.join(walletDir, name);
  let success = false;
  try {
    if (!fs.existsSync(walletDir)) {
      fs.mkdirSync(walletDir, { recursive: true });
    }
    fs.writeFileSync(walletJson, encrypted);
    success = true;
  } catch (err) {
    console.error(err);
  }
  return success;
}

async function walletDelete(name) {
  const walletJson = path.join(walletDir, name);
  let success = false;
  try {
    fs.unlinkSync(walletJson);
    success = true;
  } catch (err) {
    console.error(err);
  }
  return success;
}

module.exports = {
  iskraContractHomeDir,
  printArguments,
  printQueryResult,
  printTxResult,
  walletExist,
  walletLoad,
  walletSave,
  walletDelete,
  walletList,
  walletShow,
};
