const { BigNumber } = require("ethers");
const { printTxResult, printArguments, iskraContractHomeDir } = require("../wallet/functions");
const { getSignerFromArgs } = require("../utils/utils");
const { types } = require("hardhat/config");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

function toTokenAmount(amount) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
}

task("mkp:deploy_full", "deploy full set including MarketPlace, token contracts")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addOptionalParam("iskra", "iskra token address", "")
  .addParam("income", "iskra income wallet")
  .addParam("claimer", "iskra claimer")
  .addParam("priceSigner", "price signer")
  .addParam("checkerSigner", "checker signer")
  .addParam("gameOperator", "game contract operator")
  .addOptionalParam("pricer", "pre-deployed pricer address", "")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("deployer: " + wallet.address);

    let iskraToken;
    const IskraToken = await ethers.getContractFactory("IskraToken", wallet);
    if (taskArgs.iskra === "") {
      iskraToken = await IskraToken.deploy(toTokenAmount(1000000000));
      await iskraToken.deployed();
      console.log("IskraToken deployed to:", iskraToken.address);
    } else {
      iskraToken = await IskraToken.attach(taskArgs.iskra);
      console.log("IskraToken attached to:", iskraToken.address);
    }

    const MarketPlace = await ethers.getContractFactory("MarketPlace", wallet);
    const beacon = await upgrades.deployBeacon(MarketPlace);
    await beacon.deployed();
    const proxy = await upgrades.deployBeaconProxy(beacon, MarketPlace, [
      iskraToken.address,
      taskArgs.income,
      taskArgs.claimer,
    ]);
    await proxy.deployed();
    const iskraMarket = MarketPlace.attach(proxy.address);
    console.log("MarketPlace beacon deployed to: ", beacon.address);
    console.log("MarketPlace deployed to: ", iskraMarket.address);

    const GameManager = await ethers.getContractFactory("GameContractManager", wallet);
    const beacon2 = await upgrades.deployBeacon(GameManager);
    await beacon2.deployed();
    const proxy2 = await upgrades.deployBeaconProxy(beacon2, GameManager, []);
    await proxy2.deployed();
    const gameManager = GameManager.attach(proxy2.address);
    await gameManager.addOperator(taskArgs.gameOperator);
    console.log("GameContractManager beacon deployed to: ", beacon2.address);
    console.log("GameContractManager deployed to: ", gameManager.address);

    const Validator = await ethers.getContractFactory("MarketPlaceValidator", wallet);
    const validator = await Validator.deploy(iskraMarket.address);
    await validator.deployed();
    console.log("MarketPlaceValidator deployed to: ", validator.address);

    let pricer;
    const Pricer = await ethers.getContractFactory("TokenPricerByVerifying", wallet);
    if (taskArgs.pricer === "") {
      pricer = await Pricer.deploy(taskArgs.priceSigner); // signing key
      await pricer.deployed();
      console.log("TokenPricerByVerifying deployed to: ", pricer.address);
    } else {
      pricer = await Pricer.attach(taskArgs.pricer);
      console.log("TokenPricerByVerifying attached to: ", pricer.address);
    }

    const PurchaseChecker = await ethers.getContractFactory("PurchaseCheckerByVerifying", wallet);
    const checker = await PurchaseChecker.deploy(iskraMarket.address, taskArgs.checkerSigner);
    await checker.deployed();
    console.log("PurchaseCheckerByVerifying deployed to: ", checker.address);

    // pairing
    let tx;
    tx = await iskraMarket.setGameContractManager(gameManager.address);
    await tx.wait();
    tx = await gameManager.setMarketPlace(iskraMarket.address);
    await tx.wait();
    tx = await iskraMarket.setValidator(validator.address);
    await tx.wait();
    tx = await iskraMarket.setTokenPricer(pricer.address);
    await tx.wait();
  });

task("mkp:upgrade", "upgrade market place proxy to a new implementation")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("beacon", "the beacon contract address")
  .setAction(async (taskArgs) => {
    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("deployer: " + wallet.address);

    const MarketPlace = await ethers.getContractFactory("MarketPlace", wallet);
    await upgrades.upgradeBeacon(taskArgs.beacon, MarketPlace);
    console.log("Beacon upgraded");
  });

task("mkp:deploy_checker")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("market", "market address")
  .addParam("checkerSigner", "checker signer")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("deployer: " + wallet.address);

    const PurchaseChecker = await ethers.getContractFactory("PurchaseCheckerByVerifying", wallet);
    const checker = await PurchaseChecker.deploy(taskArgs.market, taskArgs.checkerSigner);
    await checker.deployed();
    console.log("PurchaseCheckerByVerifying deployed to: ", checker.address);
  });

task("multitoken:deploy", "deploy a sample ERC1155 token")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("uri", "metadata uri", "sample.world")
  .addParam("name", "metadata name", "sample")
  .addFlag("pausable", "whether the token is pausable")
  .addFlag("burnable", "whether the token is burnable")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("deployer: " + wallet.address);

    const MultiToken = await ethers.getContractFactory("MultiToken", wallet);
    const token = await MultiToken.deploy(taskArgs.uri, taskArgs.name, taskArgs.pausable, taskArgs.burnable);
    await token.deployed();
    console.log("token deployed: " + token.address);
  });

task("nft:deploy", "deploy sample nft")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("name", "NFT name")
  .addParam("symbol", "NFT symbol")
  .addOptionalParam("uri", "base uri", "")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("deployer: " + wallet.address);

    const NFT = await ethers.getContractFactory("ItemNFT", wallet);
    const nft = await NFT.deploy(taskArgs.name, taskArgs.symbol, taskArgs.uri, true);
    console.log("nft deployed: " + nft.address);
  });

task("multitoken:mint", "mint a token")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("token", "deployed multi token address")
  .addParam("id", "token id to mint")
  .addParam("amount", "token amount to mint")
  .addOptionalParam("to", "mint to", "")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("minter: " + wallet.address);

    const MultiToken = await ethers.getContractFactory("MultiToken", wallet);
    const token = MultiToken.attach(taskArgs.token);
    console.log("token attached to: " + token.address);

    let to;
    if (taskArgs.to === "") {
      to = wallet.address;
    } else {
      to = taskArgs.to;
    }

    let tx = await token.mint(to, taskArgs.id, taskArgs.amount, 0);
    printTxResult(await tx.wait());
  });

task("multitoken:mint_batch", "batch mint a token")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("token", "deployed multi token address")
  .addParam("ids", "comma separated token ids to mint")
  .addParam("amounts", "comma separated token amounts to mint")
  .addOptionalParam("to", "mint to", "")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("minter: " + wallet.address);

    const MultiToken = await ethers.getContractFactory("MultiToken", wallet);
    const token = MultiToken.attach(taskArgs.token);
    console.log("token attached to: " + token.address);

    let to;
    if (taskArgs.to === "") {
      to = wallet.address;
    } else {
      to = taskArgs.to;
    }

    let ids = taskArgs.ids.split(",");
    let amounts = taskArgs.amounts.split(",");

    let tx = await token.mintBatch(to, ids, amounts, 0);
    printTxResult(await tx.wait());
  });

task("nft:mint", "mint a nft")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("token", "deployed nft token address")
  .addParam("id", "token id to mint")
  .addOptionalParam("to", "mint to", "")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("minter: " + wallet.address);

    const NFT = await ethers.getContractFactory("ItemNFT", wallet);
    const nft = NFT.attach(taskArgs.token);
    console.log("token attached to: " + nft.address);

    let to;
    if (taskArgs.to === "") {
      to = wallet.address;
    } else {
      to = taskArgs.to;
    }

    let tx = await nft.safeMint(to, taskArgs.id);
    printTxResult(await tx.wait());
  });

task("nft:mint_batch", "mint nfts")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("token", "deployed nft token address")
  .addParam("ids", "token ids; comma separated")
  .addOptionalParam("to", "mint to", "")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("minter: " + wallet.address);

    const NFT = await ethers.getContractFactory("ItemNFT", wallet);
    const nft = NFT.attach(taskArgs.token);
    console.log("token attached to: " + nft.address);

    let to;
    if (taskArgs.to === "") {
      to = wallet.address;
    } else {
      to = taskArgs.to;
    }

    let ids = taskArgs.ids.split(",");
    let tx = await nft.safeMintBatch(to, ids);
    printTxResult(await tx.wait());
  });

task("multitoken:approve", "approve token")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("token", "deployed multi token address")
  .addParam("operator", "approve to")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("minter: " + wallet.address);

    const MultiToken = await ethers.getContractFactory("MultiToken", wallet);
    const token = MultiToken.attach(taskArgs.token);
    console.log("token attached to: " + token.address);

    let tx = await token.setApprovalForAll(taskArgs.operator, true);
    printTxResult(await tx.wait());
  });

task("nft:approve", "approve token")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("token", "deployed nft token address")
  .addParam("operator", "approve to")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("minter: " + wallet.address);

    const NFT = await ethers.getContractFactory("ItemNFT", wallet);
    const nft = NFT.attach(taskArgs.token);
    console.log("token attached to: " + nft.address);

    let tx = await nft.setApprovalForAll(taskArgs.operator, true);
    printTxResult(await tx.wait());
  });

task("mkp:register_game", "register a game")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addOptionalParam("iskra", "iskra token address", "")
  .addParam("manager", "game manager contract")
  .addParam("game", "a game contract(ERC1155 token)")
  .addParam("gameOwner", "game contract owner")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("register owner: " + wallet.address);

    const GameManager = await ethers.getContractFactory("GameContractManager", wallet);
    const manager = GameManager.attach(taskArgs.manager);
    console.log("GameContractManager attached to: " + manager.address);
    let tx = await manager.registerGameContract(taskArgs.game, taskArgs.gameOwner, 25, ADDRESS_ZERO);
    printTxResult(await tx.wait());
  });

task("mkp:register_card", "register card")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("market", "market place contract")
  .addParam("game", "a game contract")
  .addParam("card", "card ID to register")
  .addParam("type", "card type: 0(nft) or 1(semi-nft) or 2(package)")
  .addOptionalParam("tokenId", "token id(s); comma separated for package")
  .addOptionalParam("units", "token units; only for package; comma separated")
  .addOptionalParam("amount", "card amount", "1")
  .addOptionalParam("startTokenId", "start token id(only for mystery card)")
  .addOptionalParam("endTokenId", "end token id(only for mystery card)")
  .addOptionalParam("holder", "token holder(only for mystery card)")
  .addParam("price", "price")
  .addParam("start", "start timestamp")
  .addParam("end", "end timestamp")
  .addOptionalParam("checker", "checker address", ADDRESS_ZERO)
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("test owner: " + wallet.address);

    const MarketPlace = await ethers.getContractFactory("MarketPlace", wallet);
    const market = MarketPlace.attach(taskArgs.market);
    console.log("MarketPlace attached to: " + market.address);

    let tx;
    if (taskArgs.type == 0) {
      tx = await market.registerCardNFT(
        taskArgs.game,
        taskArgs.card,
        taskArgs.tokenId,
        toTokenAmount(taskArgs.price),
        taskArgs.start,
        taskArgs.end,
        taskArgs.checker
      );
      printTxResult(await tx.wait());
    } else if (taskArgs.type == 1) {
      tx = await market.registerCardSemiNFT(
        taskArgs.game,
        taskArgs.card,
        taskArgs.tokenId,
        taskArgs.amount,
        toTokenAmount(taskArgs.price),
        taskArgs.start,
        taskArgs.end,
        taskArgs.checker
      );
      printTxResult(await tx.wait());
    } else if (taskArgs.type == 2) {
      let ids = taskArgs.tokenId.split(",");
      let units = taskArgs.units.split(",");
      tx = await market.registerCardPackage(
        taskArgs.game,
        taskArgs.card,
        taskArgs.amount,
        ids,
        units,
        toTokenAmount(taskArgs.price),
        taskArgs.start,
        taskArgs.end,
        taskArgs.checker
      );
      printTxResult(await tx.wait());
    } else if (taskArgs.type == 3) {
      tx = await market.registerCardMystery(
        taskArgs.game,
        taskArgs.card,
        taskArgs.startTokenId,
        taskArgs.endTokenId,
        toTokenAmount(taskArgs.price),
        taskArgs.start,
        taskArgs.end,
        taskArgs.checker,
        taskArgs.holder
      );
      printTxResult(await tx.wait());
    } else {
      console.log("error: invalid type: " + taskArgs.type);
    }
  });

task("mkp:purchase", "purchase card")
  .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
  .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
  .addOptionalParam("password", "password for decrypting wallet")
  .addParam("market", "market place contract")
  .addParam("iskra", "iskra token address")
  .addParam("card", "card id to purchase")
  .addParam("amount", "card amount to purchase")
  .addParam("priceData", "price data")
  .addOptionalParam("approve", "true or false", "false")
  .addOptionalParam("serverData", "server signed data", "0x00")
  .setAction(async (taskArgs, hre) => {
    printArguments(taskArgs);

    const wallet = await getSignerFromArgs(taskArgs, hre);
    console.log("test owner: " + wallet.address);

    const MarketPlace = await ethers.getContractFactory("MarketPlace", wallet);
    const market = MarketPlace.attach(taskArgs.market);
    console.log("MarketPlace attached to: " + market.address);

    const IskraToken = await ethers.getContractFactory("IskraToken", wallet);
    const iskraToken = await IskraToken.attach(taskArgs.iskra);
    console.log("IskraToken attached to:", iskraToken.address);

    let tx;
    if (taskArgs.approve) {
      let bal = await iskraToken.balanceOf(wallet.address);
      console.log("iskra token balance: " + bal);
      tx = await iskraToken.approve(market.address, bal);
      printTxResult(await tx.wait());
      console.log("iskra token approved");
    }
    tx = await market.purchaseCard(
      taskArgs.card,
      iskraToken.address,
      taskArgs.amount,
      taskArgs.priceData,
      taskArgs.serverData
    );
    printTxResult(await tx.wait());
  });
