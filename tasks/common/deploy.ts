import { task, types } from "hardhat/config";
import { getSignerFromArgs, parseCallArgs } from "../utils/utils";
import { Contract } from "ethers";

task("deploy", "Deploy a contract from the source.")
    .addPositionalParam("contract", "contract name.")
    .addOptionalVariadicPositionalParam("args", "constructor arguments.", [])
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("privateKey", "private key")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);

        console.log(`=== INPUT ===`);
        console.log(`deployer: ${signer.address}`);
        console.log(`contract: ${taskArgs.contract}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`=============\n`);

        const factory = await hre.ethers.getContractFactory(taskArgs.contract);
        const args = parseCallArgs(taskArgs.args, factory.interface.deploy);
        const contract = await factory.connect(signer).deploy(...args, {gasPrice: 100000000001});
        await contract.deployed();
        console.log(`contract address: ${contract.address}`);
        return contract.address;
    });

task("deploy-with-lib", "Deploy a contract from the source with a library")
    .addPositionalParam("contract", "contract name.")
    .addOptionalVariadicPositionalParam("args", "constructor arguments.", [])
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("lib", "library name")
    .addOptionalParam("libAddr", "deployed library address")
    .addOptionalParam("privateKey", "private key")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);

        console.log(`=== INPUT ===`);
        console.log(`deployer: ${signer.address}`);
        console.log(`contract: ${taskArgs.contract}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`=============\n`);

        const factory = await hre.ethers.getContractFactory(taskArgs.contract, {
          libraries: {
            [taskArgs.lib]: taskArgs.libAddr, 
          },
        });
        const args = parseCallArgs(taskArgs.args, factory.interface.deploy);
        const contract = await factory.connect(signer).deploy(...args, {gasPrice: 100000000001});
        await contract.deployed();
        console.log(`contract address: ${contract.address}`);
        return contract.address;
    });


task("deploy:upgradeable", "Deploy an upgradeable contract from the source.")
    .addPositionalParam("contract", "contract name.")
    .addOptionalVariadicPositionalParam("args", "initalizer arguments.", [])
    .addOptionalParam("implementation", "implementation address.")
    .addOptionalParam("initializeFunc", "initializer function name.", "initialize")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const sender = await getSignerFromArgs(taskArgs, hre);

        console.log(`=== INPUT ===`);
        console.log(`sender: ${sender.address}`);
        console.log(`contract: ${taskArgs.contract}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`initializeFunc: ${taskArgs.initializeFunc}`);
        console.log(`=============\n`);

        let impl: Contract;
        const implFactory = await hre.ethers.getContractFactory(taskArgs.contract, sender);
        if (taskArgs.implementation) {
            impl = implFactory.attach(taskArgs.implementation);
        } else {
            impl = await implFactory.deploy();
            await impl.deployed();
        }
        console.log(`Impl: ${impl.address}`);

        const initializerFactory = await hre.ethers.getContractFactory(`${taskArgs.contract}Initializer`, sender);
        const initializer = await initializerFactory.deploy();
        await initializer.deployed();
        console.log(`initializer: ${initializer.address}`);

        const initializeData = initializer.interface.encodeFunctionData(taskArgs.initializeFunc, [
            impl.address,
            ...taskArgs.args,
        ]);

        const proxyFactory = await hre.ethers.getContractFactory(
            "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
            sender
        );
        const proxy = await proxyFactory.deploy(initializer.address, initializeData);
        await proxy.deployed();

        console.log(`proxy: ${proxy.address}`);
        return [proxy.address, impl.address];
    });

task("iskratoken:deploy", "deploy Iskra token")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .addOptionalParam("supply", "total supply", "1000000000000000000000000000")
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);
        const IskraToken = await hre.ethers.getContractFactory("IskraToken", wallet);
        const token = await IskraToken.deploy(taskArgs.supply);
        console.log(" > used wallet = " + wallet.address);
        console.log(" > IskraToken contract was deployed to: " + token.address);
    });

task("deploy-token", "Deploy TestToken.")
    .addOptionalParam("name", "Name of the token.", "TestToken", types.string)
    .addOptionalParam("symbol", "Symbol of the token.", "TT", types.string)
    .addOptionalParam("decimal", "Decimal of the token.", 18, types.int)
    .addOptionalParam("initialAmount", "Initial amount of token to be minted to deployer.", 0, types.int)
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);

        console.log(`=== INPUT ===`);
        console.log(`deployer: ${signer.address}`);
        console.log(`name: ${taskArgs.name}`);
        console.log(`symbol: ${taskArgs.symbol}`);
        console.log(`decimal: ${taskArgs.decimal}`);
        console.log(`decimal: ${taskArgs.initialAmount}`);
        console.log(`=============\n`);

        const factory = await hre.ethers.getContractFactory("TestToken");
        const contract = await factory
            // @ts-ignore
            .connect(signer)
            .deploy(taskArgs.name, taskArgs.symbol, taskArgs.decimal, taskArgs.initialAmount, {
                nonce: hre.ethers.provider.getTransactionCount(signer.address),
            });
        await contract.deployed();
        console.log(`token address: ${contract.address}`);
    });

task("greeter:deploy", "Deploy a greeting contract")
    .addOptionalParam("wallet", "Thee wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);
        // @ts-ignore
        const Greeter = await hre.ethers.getContractFactory("Greeter", wallet);
        const greeter = await Greeter.deploy("Hello world");
        await greeter.deployed();
        console.log("deployed contract: " + greeter.address);
    });

task("batch-transfer:deploy", "Deploy a batch transfer tool")
    .addOptionalParam("wallet", "Thee wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);
        const Batcher = await hre.ethers.getContractFactory("BatchTransferERC721", wallet);
        const batcher = await Batcher.deploy();
        await batcher.deployed();
        console.log("deployed contract: " + batcher.address);
    });
