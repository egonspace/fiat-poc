const { BigNumber } = require("ethers");
const { printTxResult, printArguments, iskraContractHomeDir } = require("../wallet/functions");
const { getSignerFromArgs } = require("../utils/utils");
const { types } = require("hardhat/config");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

task("pnft:deploy_sale")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("env", "GlobalEnv address")
  .addParam("nft", "pnft address")
  .addParam("staking", "staking address")
  .addParam("starting", "starting token id")
  .addParam("local", "previous local total sold")
  .addParam("price", "initial price USD. 6000000000")
  .addParam("unit", "per unit. 10")
  .addParam("rising", "rising usd. 20000000")
  .addParam("reclaimer", "reclaimer")
  .addParam("amount", "sale amount")
  .addParam("dummy", "starting dummy ticket id. 100000000")
  .addParam("signer", "server signer")
  .addParam("usdt", "usdt address")
  .addParam("usdc", "usdc address")
  .addParam("iusdt", "iusdt address")
  .addParam("isk", "isk address")
  .addParam("vault", "vault address")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("deployer: " + wallet.address);

    const PioneerNFTSale = await ethers.getContractFactory("PioneerNFTSale", wallet);
    const saleImpl = await PioneerNFTSale.deploy(true);
    await saleImpl.deployed();

    console.log("PioneerNFTSale implementation deployed to: ", saleImpl.address);

    let PioneerNFTSaleInitializer = await ethers.getContractFactory("PioneerNFTSaleInitializer", wallet);
    const initializer = await PioneerNFTSaleInitializer.deploy();
    await initializer.deployed();
    console.log("PioneerNFTSaleInitializer deployed to: ", initializer.address);

    const initializeData = initializer.interface.encodeFunctionData("initialize", [
      taskArgs.env,
      taskArgs.nft,
      taskArgs.staking,
      taskArgs.starting,
      taskArgs.local,
      taskArgs.price,
      taskArgs.unit,
      taskArgs.rising,
      taskArgs.reclaimer,
      taskArgs.amount,
      taskArgs.dummy,
      saleImpl.address,
    ]);

    const proxyFactory = await ethers.getContractFactory(
      "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
      wallet
    );
    const proxy = await proxyFactory.deploy(initializer.address, initializeData);
    await proxy.deployed();

    let sale = PioneerNFTSale.attach(proxy.address);
    console.log("PioneerNFTSale deployed to: ", sale.address);

    const BulkPurchaseDelegator = await ethers.getContractFactory("BulkPurchaseDelegator", wallet);
    let delegator = await BulkPurchaseDelegator.deploy(sale.address, taskArgs.usdt, taskArgs.usdc, taskArgs.iusdt);
    await delegator.deployed();
    console.log("BulkPurchaseDelegator deployed to: ", delegator.address);

    const Env = await ethers.getContractFactory("PioneerNFTSaleGlobalEnv", wallet);
    const env = Env.attach(taskArgs.env);
    const Staking = await ethers.getContractFactory("PioneerNFTStaking", wallet);
    const staking = Staking.attach(taskArgs.staking);
    const NFT = await ethers.getContractFactory("PioneerNFT", wallet);
    const nft = NFT.attach(taskArgs.nft);

    let tx = await sale.registerSigner(taskArgs.signer);
    await tx.wait();
    console.log("signer is registered");
    tx = await sale.setBulkPurchaseDelegator(delegator.address);
    await tx.wait();
    console.log("bulk purchase delegator is set");
    tx = await sale.setLockedIskVault(taskArgs.isk, taskArgs.vault);
    await tx.wait();
    console.log("isk and vault are set");
    tx = await env.setCurrentSale(sale.address);
    await tx.wait();
    console.log("sale contract is set on env");
    tx = await nft.setMinter(1, sale.address);
    await tx.wait();
    console.log("sale contract is set on nft as a minter");
    tx = await staking.setPioneerSale(sale.address);
    await tx.wait();
    console.log("sale contract is set on staking");
  });

task("pnft:open_sale")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("sale", "Sale address")
  .addParam("isk", "ISK address")
  .addParam("usdt", "usdt address")
  .addParam("usdc", "usdc address")
  .addParam("iusdt", "iusdt address")
  .addParam("amount", "Sale amount")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    const wallet = await getSignerFromArgs(taskArgs, hre);
    const klayAddr = "0x0D78Acf75Cd09E00D2013b700bd048F62a8B2EA3";
    console.log("operator: " + wallet.address);

    const PioneerNFTSale = await ethers.getContractFactory("PioneerNFTSale", wallet);
    const sale = PioneerNFTSale.attach(taskArgs.sale);
    let tx = await sale.openSalePhase(
      taskArgs.amount,
      [taskArgs.isk, klayAddr],
      [taskArgs.usdt, taskArgs.usdc, taskArgs.iusdt]
    );
    await tx.wait();
    console.log("sale opened");
  });

task("pnft:close_sale")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("sale", "Sale address")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("operator: " + wallet.address);

    const PioneerNFTSale = await ethers.getContractFactory("PioneerNFTSale", wallet);
    const sale = PioneerNFTSale.attach(taskArgs.sale);
    let tx = await sale.closeSalePhase();
    await tx.wait();
    console.log("sale closed");
  });

function makeArray(startId, count) {
  let ret = [];
  for (let i = 0; i < count; i++) {
    ret[i] = startId++;
  }
  return ret;
}

async function stakeBulk(startId, count, investor, staking, nft) {
  const loop = ~~(count / 50);
  for (let i = 0; i < loop; i++) {
    let ids = makeArray(startId + i * 50, 50);
    let data = staking.interface.encodeFunctionData("stake(address,uint256[])", [investor.address, ids]);
    let tx = await nft.connect(investor).approveBatchAndCall(staking.address, ids, data);
    await tx.wait();
    console.log(startId + i * 50 + " ~ " + (startId + i * 50 + 49) + " staked");
  }
  const remain = count - loop * 50;
  if (remain > 0) {
    let ids = makeArray(startId + loop * 50, remain);
    let data = staking.interface.encodeFunctionData("stake(address,uint256[])", [investor.address, ids]);
    let tx = await nft.connect(investor).approveBatchAndCall(staking.address, ids, data);
    await tx.wait();
    console.log(startId + loop * 50 + " ~ " + (startId + loop * 50 + remain - 1) + " staked");
  }
}

task("pnft:deploy_test_set")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("isk", "isk token address")
  .addParam("pricer", "isk token pricer")
  .addParam("signer", "server signer")
  .addParam("investors", "private investor private keys, comma separated")
  .addParam("usdt", "usdt address")
  .addParam("usdc", "usdc address")
  .addParam("iusdt", "iusdt address")
  .setAction(async (taskArgs, hre) => {
    const investors = taskArgs.investors.split(",");
    if (investors.length < 8) {
      console.log("investors should have 8 addresses at least");
      return;
    }

    printArguments(taskArgs);

    const fixedStart = 1656565200;
    const block = await hre.ethers.provider.getBlock("latest");
    let timeTerm = block.timestamp - fixedStart + 3600;
    console.log("time term = " + timeTerm);

    const bulk = ~~(4000 / investors.length);
    console.log("mint unit = " + bulk);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("deployer: " + wallet.address);

    const PioneerNFT = await hre.ethers.getContractFactory("PioneerNFT", wallet);
    const nft = await PioneerNFT.deploy([4000, 26000, 3000, 7000], 1000);
    await nft.deployed();
    console.log("nft: " + nft.address);

    const PioneerNFTStaking = await hre.ethers.getContractFactory("PioneerNFTStakingAlpha", wallet);
    const beacon = await hre.upgrades.deployBeacon(PioneerNFTStaking);
    await beacon.deployed();
    const stakingProxy = await hre.upgrades.deployBeaconProxy(beacon, PioneerNFTStaking, [nft.address, taskArgs.isk]);
    await stakingProxy.deployed();
    const staking = PioneerNFTStaking.attach(stakingProxy.address);
    console.log("staking: " + staking.address);

    const PioneerStakingUnlockRule = await hre.ethers.getContractFactory("PioneerStakingUnlockRule");
    const unlockRule = await PioneerStakingUnlockRule.deploy(
      staking.address,
      nft.address,
      5000,
      30000,
      1000,
      100,
      ZERO_ADDRESS
    );
    console.log("unlockRule: " + unlockRule.address);

    const PioneerNFTSaleGlobalEnv = await hre.ethers.getContractFactory("PioneerNFTSaleGlobalEnv", wallet);
    const env = await PioneerNFTSaleGlobalEnv.deploy();
    await env.deployed();
    console.log("env: " + env.address);

    const PioneerNFTSale = await hre.ethers.getContractFactory("PioneerNFTSale", wallet);
    const saleImpl = await PioneerNFTSale.deploy(true);
    await saleImpl.deployed();

    console.log("PioneerNFTSale implementation deployed to: ", saleImpl.address);

    let PioneerNFTSaleInitializer = await hre.ethers.getContractFactory("PioneerNFTSaleInitializer", wallet);
    const initializer = await PioneerNFTSaleInitializer.deploy();
    await initializer.deployed();
    console.log("PioneerNFTSaleInitializer deployed to: ", initializer.address);

    const initializeData = initializer.interface.encodeFunctionData("initialize", [
      env.address,
      nft.address,
      staking.address,
      4001,
      0,
      6000000000n,
      10,
      20000000n,
      wallet.address,
      26000,
      100000000n,
      saleImpl.address,
    ]);

    const proxyFactory = await hre.ethers.getContractFactory(
      "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
      wallet
    );
    const proxy = await proxyFactory.deploy(initializer.address, initializeData);
    await proxy.deployed();

    let sale = PioneerNFTSale.attach(proxy.address);
    console.log("PioneerNFTSale deployed to: ", sale.address);

    const BulkPurchaseDelegator = await hre.ethers.getContractFactory("BulkPurchaseDelegator", wallet);
    let delegator = await BulkPurchaseDelegator.deploy(sale.address, taskArgs.usdt, taskArgs.usdc, taskArgs.iusdt);
    await delegator.deployed();
    console.log("BulkPurchaseDelegator deployed to: ", delegator.address);

    // setting nft
    let tx = await nft.setMintListener(unlockRule.address);
    await tx.wait();
    console.log("nft.setMintListener");
    tx = await nft.registerPauseExcluded(staking.address);
    await tx.wait();
    console.log("nft.registerPauseExcluded");
    tx = await nft.setMinter(1, sale.address);
    await tx.wait();
    console.log("nft.setMinter");

    // setting staking
    tx = await staking.setRewardUnlockRule(unlockRule.address);
    await tx.wait();
    console.log("staking.setRewardUnlockRule");
    tx = await staking.allowConsumer(sale.address);
    await tx.wait();
    console.log("staking.allowConsumer");
    tx = await staking.setInitialTime(timeTerm); // before 1 hour from start time
    await tx.wait();
    console.log("staking.setInitialTime");

    // setting globel env
    tx = await env.setCurrentSale(sale.address);
    await tx.wait();
    console.log("evn.setCurrentSale");

    // setting sale
    tx = await sale.registerSigner(taskArgs.signer);
    await tx.wait();
    console.log("sale.registerSigner");
    tx = await sale.setBulkPurchaseDelegator(delegator.address);
    await tx.wait();
    console.log("sale.setBulkPurchaseDelegator");
    tx = await sale.setLockedIskVault(taskArgs.isk, wallet.address);
    await tx.wait();
    console.log("sale.setLockedIskVault");
    tx = await sale.setIskPricer(taskArgs.pricer);
    await tx.wait();
    console.log("sale.setIskPricer");

    // setStart
    tx = await staking.setStart(fixedStart);
    await tx.wait();
    console.log("staking.setStart");

    // mint private pnft for investors
    for (let i = 0; i < investors.length; i++) {
      const investor = new hre.ethers.Wallet(investors[i], hre.ethers.provider);
      tx = await nft.mintPrivateBatch(investor.address, bulk);
      await tx.wait();
      console.log("private " + bulk + " minted");

      await stakeBulk(i * bulk + 1, bulk, investor, staking, nft);
    }
    const remain = 4000 - investors.length * bulk;
    if (remain > 0) {
      const investor = new hre.ethers.Wallet(investors[0], hre.ethers.provider);
      tx = await nft.mintPrivateBatch(investor.address, remain);
      await tx.wait();
      console.log("private " + remain + " minted");

      await stakeBulk(investors.length * bulk + 1, remain, investor, staking, nft);
    }
    tx = await nft.mintTeamBatch(wallet.address, 400);
    tx.wait();
    console.log("team 400 minted");

    // open sale
    const KlayCoinAddress = "0x0D78Acf75Cd09E00D2013b700bd048F62a8B2EA3";
    tx = await sale.openSalePhase(
      6000,
      [KlayCoinAddress, taskArgs.isk],
      [taskArgs.usdt, taskArgs.usdc, taskArgs.iusdt]
    );
    await tx.wait();

    // forward to start time
    tx = await staking.forward(timeTerm);
    await tx.wait();
  });

task("pnft:upgrade_staking")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("beacon", "staking beacon address")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);
    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("deployer: " + wallet.address);

    const PioneerNFTStaking = await hre.ethers.getContractFactory("PioneerNFTStakingAlpha", wallet);
    const newImpl = await PioneerNFTStaking.deploy();
    await newImpl.deployed();

    console.log("new staking implementation: " + newImpl.address);

    const Beacon = await hre.ethers.getContractFactory("UpgradeableBeacon", wallet);
    const beacon = Beacon.attach(taskArgs.beacon);
    await beacon.upgradeTo(newImpl.address);
    console.log("staking upgraded");
  });
