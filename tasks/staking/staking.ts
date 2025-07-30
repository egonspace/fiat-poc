import { task, types } from "hardhat/config";
import { getSignerFromArgs } from "../utils/utils";
import { BigNumber } from "ethers";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

async function getTokens(
    hre: HardhatRuntimeEnvironment,
    iskraTokenAddress: string,
    stakingTokenAddress: string,
    wallet: ethers.Signer
) {
    iskraTokenAddress = iskraTokenAddress ? iskraTokenAddress : ethers.constants.AddressZero;
    stakingTokenAddress = stakingTokenAddress ? stakingTokenAddress : ethers.constants.AddressZero;
    const OriginToken = await hre.ethers.getContractFactory("IskraToken", wallet);
    const originToken = OriginToken.attach(iskraTokenAddress);
    const StakingToken = await hre.ethers.getContractFactory("StakingToken", wallet);
    const stakingToken = StakingToken.attach(stakingTokenAddress);
    return [originToken, stakingToken];
}

function toTokenAmount(amount: number) {
    return BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
}

task("stakingtoken:deploy", "deploy Staking token")
    .addParam("start", "Inflation(reward) distributed from the timestamp")
    .addParam("originToken", "The address of the original token contract")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .addOptionalParam("symbol", "symbol of the token", "sISK")
    .addOptionalParam("desc", "description of the token", "Iskra Staking Token")
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);
        const StakingToken = await hre.ethers.getContractFactory("StakingToken", wallet);

        const token = await hre.upgrades.deployProxy(StakingToken, [
            taskArgs.originToken,
            "Iskra Staking Token",
            "sISK",
            taskArgs.start * 1,
        ]);
        await token.deployed();

        console.log(" > used wallet = " + wallet.address);
        console.log(" > StakingToken contract was deployed to: " + token.address);
    });

task("stakingtoken:deposit_reserve", "deposit original token for reserve")
    .addParam("amount", "amount(without decimal)")
    .addParam("stakingToken", "The address of the staking token contract")
    .addParam("originToken", "The address of the original token contract")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);
        const [originToken, stakingToken] = await getTokens(hre, taskArgs.originToken, taskArgs.stakingToken, wallet);

        if ((await originToken.allowance(wallet.address, stakingToken.address)) < toTokenAmount(taskArgs.amount)) {
            const tx = await originToken.approve(stakingToken.address, hre.ethers.constants.MaxUint256);
            await tx.wait(3);
        }
        await stakingToken.depositReserve(toTokenAmount(taskArgs.amount));

        console.log(" > used wallet = " + wallet.address);
    });

task("stakingtoken:withdraw_reserve", "withdraw original token reserved")
    .addParam("amount", "amount(without decimal)")
    .addParam("stakingToken", "The address of the staking token contract")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);

        const [_, stakingToken] = await getTokens(hre, taskArgs.originToken, taskArgs.stakingToken, wallet);

        await stakingToken.withdrawReserve(toTokenAmount(taskArgs.amount));

        console.log(" > used wallet = " + wallet.address);
    });

task("stakingtoken:stake", "stake original token")
    .addParam("amount", "amount(without decimal)")
    .addParam("stakingToken", "The address of the staking token contract")
    .addParam("originToken", "The address of the original token contract")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);
        const [originToken, stakingToken] = await getTokens(hre, taskArgs.originToken, taskArgs.stakingToken, wallet);

        if ((await originToken.allowance(wallet.address, stakingToken.address)) < toTokenAmount(taskArgs.amount)) {
            const tx = await originToken.approve(stakingToken.address, hre.ethers.constants.MaxUint256);
            await tx.wait(3);
        }

        await stakingToken.stake(toTokenAmount(taskArgs.amount));

        console.log(" > used wallet = " + wallet.address);
    });

task("stakingtoken:withdraw", "burn staking token and withdraw original token")
    .addParam("amount", "amount(without decimal)")
    .addParam("stakingToken", "The address of the staking token contract")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);

        const [_, stakingToken] = await getTokens(hre, taskArgs.originToken, taskArgs.stakingToken, wallet);

        await stakingToken.withdraw(toTokenAmount(taskArgs.amount));

        console.log(" > used wallet = " + wallet.address);
    });

task("stakingtoken:approveall", "approve maximum amount")
    .addParam("stakingToken", "The address of the staking token contract")
    .addParam("originToken", "The address of the original token contract")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .setAction(async (taskArgs, hre) => {
        const wallet = await getSignerFromArgs(taskArgs, hre);
        const [originToken, stakingToken] = await getTokens(hre, taskArgs.originToken, taskArgs.stakingToken, wallet);

        await originToken.approve(stakingToken.address, hre.ethers.constants.MaxUint256);

        console.log(" > used wallet = " + wallet.address);
    });
