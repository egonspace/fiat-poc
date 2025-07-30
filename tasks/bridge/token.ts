import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
    approve,
    getAdapterBalance,
    getBalance,
    getTotalSupply,
    getWrappedAddress,
    getWrappedAssetBalance,
} from "../../scripts/bridge/cmd/bridge";
import { getSignerFromArgs } from "../utils/utils";
import { chainNameToChainId } from "./common";

task("deploy-erc20")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam(
        "totalSupply",
        "total supply amount (without decimal applied). it will be minted to the msg.sender"
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const factory = await hre.ethers.getContractFactory("TestToken");
        // @ts-ignore
        let totalSupply;
        if (taskArgs.totalSupply) {
            totalSupply = taskArgs.totalSupply;
        } else {
            totalSupply = "1000000000";
        }
        // @ts-ignore
        const token = await factory.connect(signer).deploy("Test", "TT", 18, totalSupply);
        await token.deployed();
        console.log("Deployed token address: " + token.address);
    });

task("approve", "Approve Tx")
    .addParam("token", "token address.")
    .addParam("spender", "wallet address to approve token.")
    .addParam("amount", "amount to approve.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        let signer = await getSignerFromArgs(taskArgs, hre);
        await approve(hre, taskArgs.token, taskArgs.spender, taskArgs.amount, signer);
    });

task("balance", "Get token balance of the address.")
    .addParam("token", "token address.")
    .addParam("address", "wallet address to retrieve balance.")
    .setAction((taskArgs, hre: HardhatRuntimeEnvironment) => getBalance(hre, taskArgs.token, taskArgs.address));

task("total-supply", "Get total supply of the address.")
    .addParam("token", "token address.")
    .setAction((taskArgs, hre: HardhatRuntimeEnvironment) => getTotalSupply(hre, taskArgs.token));

task("wrapped-address", "Get wrapped token address.")
    .addParam("originChain", "id of the origin chain.")
    .addParam("originToken", "address of the origin token.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const chainId = chainNameToChainId(hre.network.name);
        await getWrappedAddress(hre, chainId, taskArgs.originChain, taskArgs.originToken, "bridge");
    });

task("wrapped-balance", "Get wrapped token balance of the address.")
    .addParam("originChain", "id of the origin chain.")
    .addParam("originToken", "address of the origin token.")
    .addParam("address", "wallet address to retrieve balance.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const chainId = chainNameToChainId(hre.network.name);
        await getWrappedAssetBalance(
            hre,
            chainId,
            taskArgs.originChain,
            taskArgs.originToken,
            taskArgs.address,
            "bridge"
        );
    });

task("adapter-balance", "Get wrapped token balance of the address.")
    .addParam("originChain", "id of the origin chain.")
    .addParam("originToken", "address of the origin token.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const chainId = chainNameToChainId(hre.network.name);
        await getAdapterBalance(hre, chainId, taskArgs.originChain, taskArgs.originToken);
    });
