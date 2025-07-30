import { TaskArguments } from "hardhat/src/types/runtime";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wallet } from "ethers";
import * as readlineSync from "readline-sync";
import { promises as fs } from "fs";
import "@nomiclabs/hardhat-ethers/internal/type-extensions";
import { Fragment, ParamType } from "ethers/lib/utils";

const { walletLoad } = require("../wallet/functions");

export function getPassword(taskArgs: TaskArguments) {
    let password = taskArgs.password;
    if (password == undefined) {
        password = readlineSync.question("Keyfile Password:", { hideEchoBack: true, mask: "" });
    }
    return password;
}

async function retry(fn: (error: any) => Promise<any>, retries: number = 3, error: any = null): Promise<any> {
    if (!retries) {
        return Promise.reject(error);
    }
    try {
        return await fn(error);
    } catch (errorAgain) {
        return retry(fn, retries - 1, errorAgain);
    }
}

export async function getSignerFromArgs(
    taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment
): Promise<SignerWithAddress | Wallet> {
    let signer;
    if (taskArgs.jsonKeyfile) {
        try {
            signer = await retry(async (error: any) => {
                if (error) {
                    console.warn(`${error.toString()}, try again!`);
                }
                const password = readlineSync.question("Keyfile Password:", { hideEchoBack: true, mask: "" });
                const content = await fs.readFile(taskArgs.jsonKeyfile, "utf8");
                return await hre.ethers.Wallet.fromEncryptedJson(content, password);
            });
            signer = signer.connect(hre.ethers.provider);
        } catch (error: any) {
            console.error(error.toString());
            process.exit(1);
        }
    } else if (taskArgs.wallet) {
        signer = await walletLoad(taskArgs.wallet, getPassword(taskArgs), hre);
    } else if (taskArgs.signer) {
        signer = await hre.ethers.getSigner(taskArgs.signer);
    } else if (taskArgs.privateKey) {
        signer = new hre.ethers.Wallet(taskArgs.privateKey, hre.ethers.provider);
    } else {
        [signer] = await hre.ethers.getSigners();
    }
    return signer;
}

export function parseCallArgs(args: string[], fragment: Fragment) {
    return fragment.inputs.map((paramType: ParamType, index: number) => {
        console.log("parse param type: " + paramType.baseType)
        const strArg = args[index];

        if (paramType.baseType === "array") {
            console.log("array param: " + strArg)
            if (strArg) {
                const argArray = strArg.split(",");
                if (paramType.arrayChildren.baseType.includes("int")) {
                    return argArray.map((value: string): bigint => parseBigInt(value));
                } else {
                    return argArray;
                }
            } else {
                return [];
            }
        } else if (paramType.baseType.includes("int")) {
            console.log("int param: " + strArg)
            return parseBigInt(strArg);
        } else if (paramType.baseType === "tuple") {
            console.log("tuple param: " + strArg)
            //var tup = JSON.parse(strArg)
            //return [tup];
            return strArg.split(",");
        } else {
            return strArg;
        }
    });
}

export function parseBigInt(value: string) {
    // allowable format:
    //   19_999e+18
    //   10e18
    //   100_000
    //   10000

    let match = /^(?<integer>[+-]?[\d_]+)(e(?<exponent>[+-]?\d+))?$/.exec(value);
    if (match) {
        const integer = match.groups!.integer;
        const exponent = match.groups!.exponent;
        if (!/^[+-]?\d{1,3}((_\d{3})*|\d*)$/.test(integer)) {
            throw Error(`invalid delimiter: ${integer}`);
        }
        let ret = BigInt(integer.replace(/_/g, ""));
        if (exponent) {
            ret = ret * 10n ** BigInt(exponent);
        }
        return ret;
    } else {
        throw Error(`invalid number format: ${value}`);
    }
}

export function bigintToString(value: bigint) {
    let strValue = value.toString();
    if (strValue.length > 18) {
        strValue = strValue.substring(0, strValue.length - 18) + "_" + strValue.substring(strValue.length - 18);
    }
    return strValue;
}
