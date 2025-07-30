import { task, types } from "hardhat/config";
import { getSignerFromArgs } from "../utils/utils";
import { ethers } from "hardhat";

task("klayswap-wrapper:deploy")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);
        console.log("Wallet:", wallet.address);

        const FactoryWrapperFactory = await hre.ethers.getContractFactory("FactoryWrapper", wallet);
        const factory = await hre.upgrades.deployProxy(FactoryWrapperFactory, [
            "0xC6a2Ad8cC6e4A7E08FC37cC5954be07d499E7654",
        ]);
        await factory.deployed();

        console.log(factory.address);
    });

task("klayswap-wrapper:upgrade")
    .addParam("wrapper", "wrapper contract address.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);
        console.log("Wallet:", wallet.address);

        const FactoryWrapperFactory = await hre.ethers.getContractFactory("FactoryWrapper", wallet);
        const contract = await hre.upgrades.upgradeProxy(taskArgs.wrapper, FactoryWrapperFactory, {
            // call: {
            //     fn: "initialize",
            // },
        });

        console.log("factory wrapper contract is upgraded.");
    });
