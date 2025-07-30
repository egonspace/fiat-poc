const { BigNumber } = require("ethers");
const { printTxResult, printArguments, iskraContractHomeDir } = require("../wallet/functions");
const { getSignerFromArgs } = require("../utils/utils");
const { types } = require("hardhat/config");
const fs = require("fs");
const path = require("path");
const os = require("os");

const vestingDir = path.join(iskraContractHomeDir, "vesting");
const vestingImplAddressJson = path.join(vestingDir, "vesting-impl-address.json");
const vestingAddressJson = path.join(vestingDir, "vesting-address.json");

async function getDeployedVestingBeaconAddress() {
  if (!fs.existsSync(vestingImplAddressJson)) {
    console.error("You need to deploy your vesting implementation contract first");
    return;
  }

  const addressJson = fs.readFileSync(vestingImplAddressJson);
  return JSON.parse(addressJson).VestingBeaconAddress;
}

async function getDeployedVestingAddress() {
  if (!fs.existsSync(vestingAddressJson)) {
    console.error("You need to deploy your vesting proxy contract first");
    return;
  }

  const addressJson = fs.readFileSync(vestingAddressJson);
  return JSON.parse(addressJson).VestingAddress;
}

function saveVestingImplAddress(impl, beacon) {
  const fs = require("fs");
  checkVesingDir(fs);

  fs.writeFileSync(
    vestingImplAddressJson,
    JSON.stringify(
      {
        VestingImplAddress: impl,
        VestingBeaconAddress: beacon,
      },
      undefined,
      2
    )
  );
}

function saveVestingAddress(vesting) {
  const fs = require("fs");
  checkVesingDir(fs);

  fs.writeFileSync(vestingAddressJson, JSON.stringify({ VestingAddress: vesting.address }, undefined, 2));
}

function checkVesingDir(fs) {
  if (!fs.existsSync(vestingDir)) {
    fs.mkdirSync(vestingDir, { recursive: true });
  }
}

task("vesting:deploy_impl", "deploy vesting implementation contract and upgradeable beacon contract")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    const wallet = await getSignerFromArgs(taskArgs, hre);
    const Vesting = await hre.ethers.getContractFactory("IskraVesting", wallet);
    const beacon = await upgrades.deployBeacon(Vesting);
    await beacon.deployed();
    printTxResult(await beacon.deployTransaction.wait());
    console.log(" > used wallet = " + wallet.address);
    console.log(" > Vesting implementation contract was deployed to: " + (await beacon.implementation()));
    console.log(" > Vesting beacon contract was deployed to: " + beacon.address);
    saveVestingImplAddress(await beacon.implementation(), beacon.address);
  });

task("vesting:deploy", "deploy vesting proxy contract with designated beacon address")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addOptionalParam("count", "the count of proxies", "1")
  .addOptionalParam("beacon", "the beacon address", "")
  .addOptionalParam("owner", "the new owner")
  .setAction(async (taskArgs) => {
    printArguments(taskArgs);
    if (taskArgs.beacon === "") {
      taskArgs.beacon = await getDeployedVestingBeaconAddress();
    }
    const wallet = await getSignerFromArgs(taskArgs, hre);
    const Vesting = await ethers.getContractFactory("IskraVesting", wallet);
    for (let i = 1; i <= taskArgs.count; i++) {
      const vesting = await upgrades.deployBeaconProxy(taskArgs.beacon, Vesting);
      await vesting.deployed();
      console.log(" > Vesting proxy[" + i + "] deployed to: " + vesting.address);
      if (taskArgs.owner != undefined) {
        await vesting.transferOwnership(taskArgs.owner);
        console.log(" > Vesting proxy[" + i + "] ownership transferred to: " + taskArgs.owner);
      }
      if (i == taskArgs.count) {
        saveVestingAddress(vesting);
      }
    }
  });

task("vesting:prepare", "prepare vesting contract")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("beneficiary", "the beneficiary of vesting")
  .addParam("amount", "the vesting amount")
  .addParam("token", "the target token address")
  .addOptionalParam("vesting", "the vesting contract address", "")
  .addOptionalParam("duration", "the vesting duration(default=36)", "36")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    if (taskArgs.vesting === "") {
      taskArgs.vesting = await getDeployedVestingAddress();
    }
    const wallet = await getSignerFromArgs(taskArgs, hre);
    const Vesting = await hre.ethers.getContractFactory("IskraVesting", wallet);
    const vesting = await Vesting.attach(taskArgs.vesting);
    let tx = await vesting
      .connect(wallet)
      .prepare(wallet.address, taskArgs.beneficiary, taskArgs.amount, taskArgs.duration, taskArgs.token);
    printTxResult(await tx.wait());
  });

task("vesting:setstart", "set start timestamp of the vesting contract")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("start", "the start time (yyyy-mm-dd hh:mm:ss), local time zone applied")
  .addOptionalParam("vesting", "the vesting contract address", "")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    if (taskArgs.vesting === "") {
      taskArgs.vesting = await getDeployedVestingAddress();
    }
    const wallet = await getSignerFromArgs(taskArgs, hre);
    const Vesting = await hre.ethers.getContractFactory("IskraVesting", wallet);
    const vesting = await Vesting.attach(taskArgs.vesting);
    let timestamp = Date.parse(taskArgs.start);
    let tx = await vesting.connect(wallet).setStart(timestamp / 1000);
    printTxResult(await tx.wait());
  });

task("eco:deploy", "deploy EcoSystemFund implementation contract and upgradeable beacon contract")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("isk", "isk token address")
  .addParam("owner", "owner address")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    const wallet = await getSignerFromArgs(taskArgs, hre);
    const EcoFund = await hre.ethers.getContractFactory("EcoSystemFund", wallet);
    const beacon = await upgrades.deployBeacon(EcoFund);
    await beacon.deployed();
    printTxResult(await beacon.deployTransaction.wait());

    let eco = await upgrades.deployBeaconProxy(beacon.address, EcoFund, [taskArgs.isk]);
    await eco.deployed();
    eco = await EcoFund.attach(eco.address);
    await eco.transferOwnership(taskArgs.owner);

    console.log(" > used wallet = " + wallet.address);
    console.log(" > EcoSystemFund implementation contract was deployed to: " + (await beacon.implementation()));
    console.log(" > EcoSystemFund beacon contract was deployed to: " + beacon.address);
    console.log(" > EcoSystemFund proxy was deployed to: " + eco.address);
    console.log(" > EcoSystemFund new owner: " + taskArgs.owner);
  });
