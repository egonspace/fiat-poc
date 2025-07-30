import { task, types } from "hardhat/config";
import { getSignerFromArgs, parseCallArgs, bigintToString } from "../utils/utils";
import { Interface } from "@ethersproject/abi";
import { Contract } from "ethers";
import { printResult } from "./abi";

task("call", "Call a function of contract")
    .addPositionalParam("address", "contract address")
    .addPositionalParam("contract", "contract name")
    .addPositionalParam("function", "function name")
    .addOptionalVariadicPositionalParam("args", "arguments", [])
    .addFlag("estimateGas", "estimate gas")
    .addOptionalParam("block", "block height", undefined, types.int)
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("password", "password for decrypting wallet")
    .addOptionalParam("value", "value to payable")
    .addOptionalParam("privateKey", "private key")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);

        console.log(`=== INPUT ===`);
        console.log(`deployer: ${signer.address}`);
        console.log(`address: ${taskArgs.address}`);
        console.log(`contract: ${taskArgs.contract}`);
        console.log(`function: ${taskArgs.function}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`estimateGas: ${taskArgs.estimateGas}`);
        console.log(`block: ${taskArgs.block}`);
        console.log(`=============\n`);

        const artifact = await hre.artifacts.readArtifact(taskArgs.contract);
        const iface = new Interface(artifact.abi);
        const functionFragment = iface.getFunction(taskArgs.function);
        const args = parseCallArgs(taskArgs.args, functionFragment);
        const contract = new Contract(taskArgs.address, iface, signer);
        let ret;
        if (taskArgs.estimateGas) {
            ret = await contract.estimateGas[taskArgs.function](...args);
            console.log(ret.toString());
        } else {
            if (functionFragment.constant) {
                if (taskArgs.block) {
                    ret = await contract[taskArgs.function](...args, { blockTag: taskArgs.block });
                } else {
                    ret = await contract[taskArgs.function](...args);
                }
                printResult("", ret, 0);
            } else {
                if (taskArgs.value) {
                    ret = await contract[taskArgs.function](...args, {gasPrice: 100000000001, value: taskArgs.value});
                } else {
                    ret = await contract[taskArgs.function](...args, {gasPrice: 100000000001});
                }
                if (ret.wait) {
                    ret = await ret.wait();
                }

                const result = JSON.stringify(
                    {
                        transactionHash: ret.transactionHash,
                        blockNumber: ret.blockNumber,
                        blockHash: ret.blockHash,
                        transactionIndex: ret.transactionIndex,
                        from: ret.from,
                        to: ret.to,
                        gasUsed: ret.gasUsed,
                        cumulativeGasUsed: ret.cumulativeGasUsed,
                        effectiveGasPrice: ret.effectiveGasPrice,
                        status: ret.status,
                    },
                    (key, value) => (value.hex ? bigintToString(BigInt(value.hex)) : value),
                    2
                );
                console.log(result);
            }
        }
        return ret;
    });

task("call2", "Call a function of contract without abi")
    .addPositionalParam("address", "contract address")
    .addPositionalParam("funcSignature", "function signature")
    .addOptionalVariadicPositionalParam("args", "arguments", [])
    .addOptionalParam("block", "block height", undefined, types.int)
    .addOptionalParam("gasLimit", "gas limit")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);

        console.log(`=== INPUT ===`);
        console.log(`deployer: ${signer.address}`);
        console.log(`address: ${taskArgs.address}`);
        console.log(`funcSignature: ${taskArgs.funcSignature}`);
        console.log(`args: ${taskArgs.args}`);
        console.log(`estimateGas: ${taskArgs.estimateGas}`);
        console.log(`block: ${taskArgs.block}`);
        console.log(`=============\n`);

        const args = [];
        const iface = new Interface(["function " + taskArgs.funcSignature]);
        const functionFragment = iface.getFunction(taskArgs.funcSignature.split("(")[0]);

        if (functionFragment.inputs.length != taskArgs.args.length) {
            console.error("invalid argument count");
            return;
        }

        for (let i = 0; i < functionFragment.inputs.length; i++) {
            if (functionFragment.inputs[i].baseType === "array") {
                args[i] = taskArgs.args[i].split(",");
            } else {
                args[i] = taskArgs.args[i];
            }
        }

        const contract = new Contract(taskArgs.address, iface, signer);

        let ret;
        if (taskArgs.estimateGas) {
            ret = await contract.estimateGas[functionFragment.name](...args);
            console.log(ret.toString());
        } else {
            if (functionFragment.constant) {
                if (taskArgs.block) {
                    ret = await contract[functionFragment.name](...args, { blockTag: taskArgs.block });
                } else {
                    ret = await contract[functionFragment.name](...args);
                }
                printResult("", ret, 0);
            } else {
                if (taskArgs.gasLimit) {
                    ret = await contract[functionFragment.name](...args, { gasLimit: taskArgs.gasLimit });
                } else {
                    ret = await contract[functionFragment.name](...args);
                }
                if (ret.wait) {
                    ret = await ret.wait();
                }

                delete ret.events;
                delete ret.logs;

                console.log(ret);
            }
        }
    });

task("send", "Send base coin to")
    .addPositionalParam("address", "address to send to")
    .addPositionalParam("amount", "amount to send (unit=ETH)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("privateKey", "private key")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);

        console.log(`=== INPUT ===`);
        console.log(`address: ${taskArgs.address}`);
        console.log(`amount: ${taskArgs.amount}`);
        console.log(`=============\n`);

        console.log("before...");
        console.log(`sender bal: ${hre.ethers.utils.formatEther(await signer.getBalance())}`);
        console.log(
            `recipient bal: ${hre.ethers.utils.formatEther(await hre.ethers.provider.getBalance(taskArgs.address))}`
        );

        let tx = await signer.sendTransaction({
            to: taskArgs.address,
            value: hre.ethers.utils.parseEther(taskArgs.amount),
            gasPrice: 100000000001,
        });
        let receipt = await tx.wait();
        console.log(receipt);

        console.log("after...");
        console.log(`sender bal: ${hre.ethers.utils.formatEther(await signer.getBalance())}`);
        console.log(
            `recipient bal: ${hre.ethers.utils.formatEther(await hre.ethers.provider.getBalance(taskArgs.address))}`
        );
    });
