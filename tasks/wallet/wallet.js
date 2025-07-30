const { walletExist, walletSave, walletDelete, walletList, walletShow } = require("./functions");
const { getPassword } = require("../utils/utils");
task("wallet:add", "add a new wallet account")
  .addParam("name", "name of this account")
  .addOptionalParam("password", "password for decrypting wallet")
  .setAction(async (taskArgs) => {
    if (walletExist(taskArgs.name)) {
      console.error(`wallet [${taskArgs.name}] is exist already. try another name`);
      return;
    }
    const wallet = ethers.Wallet.createRandom();
    if (await walletSave(taskArgs.name, getPassword(taskArgs), wallet)) {
      console.log(`wallet [${taskArgs.name}] is added`);
    } else {
      console.log(`adding wallet [${taskArgs.name}] is failed`);
    }
  });

task("wallet:import", "import a wallet from private key")
  .addParam("name", "name of this account")
  .addParam("privatekey", "the private key of this account")
  .addOptionalParam("password", "password for decrypting wallet")
  .setAction(async (taskArgs) => {
    if (walletExist(taskArgs.name)) {
      console.error(`wallet [${taskArgs.name}] is exist already. try another name`);
      return;
    }
    const wallet = new ethers.Wallet(taskArgs.privatekey, ethers.provider);
    if (await walletSave(taskArgs.name, getPassword(taskArgs), wallet)) {
      console.log(`wallet [${taskArgs.name}] is imported`);
    } else {
      console.log(`importing wallet [${taskArgs.name}] is failed`);
    }
  });

task("wallet:delete", "delete a wallet")
  .addParam("name", "name of this account")
  .setAction(async (taskArgs) => {
    if (!walletExist(taskArgs.name)) {
      console.error(`wallet [${taskArgs.name}] is not exist. try another name`);
      return;
    }
    if (await walletDelete(taskArgs.name)) {
      console.log(`wallet [${taskArgs.name}] is deleted`);
    } else {
      console.log(`deleting wallet [${taskArgs.name}] is failed`);
    }
  });

task("wallet:list", "list names of wallet").setAction(async () => {
  console.log(walletList());
});

task("wallet:show", "show a wallet stored")
  .addParam("name", "name of this account")
  .addFlag("a", "show address only")
  .setAction(async (taskArgs) => {
    const walletContent = walletShow(taskArgs.name);
    walletContentJson = JSON.parse(walletContent);
    if (taskArgs.a) {
      walletContentJson = walletContentJson.address;
    }
    console.log(walletContentJson);
  });
