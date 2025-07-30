import {string} from "hardhat/internal/core/params/argumentTypes";
import {Deferrable} from "@ethersproject/properties";
import {BaseProvider} from "@ethersproject/providers/src.ts/base-provider";

const {ZERO_ADDRESS} = require("@openzeppelin/test-helpers/src/constants");
const {toUtf8String} = require("ethers/lib/utils");

/**
 * Get the revert reason from just a transaction hash
 * @param {string} txHash - Hash of an Ethereum transaction
 * @param {number} blockNumber - A block number to make the call from
 * @param {*} provider - Custom provider (Only ethers and web3 providers are supported at this time)
 */
export async function getRevertReason (txHash: string, provider: BaseProvider, blockNumber: string | number | undefined = undefined) {
    blockNumber = blockNumber || 'latest';

    await validateInputPreProvider(txHash)
    await validateInputPostProvider(txHash, blockNumber, provider)

    try {
        const tx = await provider.getTransaction(txHash)
        if (!tx) {
            console.error("cannot find transaction.");
            return;
        }
        const code = await getCode(tx, blockNumber, provider)
        return decodeMessage(code)
    } catch (err) {
        console.error(err);
        throw new Error('Unable to decode revert reason.')
    }
}

async function validateInputPreProvider(txHash: string) {
    // Only accept a valid txHash
    if (!(/^0x([A-Fa-f0-9]{64})$/.test(txHash)) || txHash.substring(0,2) !== '0x') {
        throw new Error('Invalid transaction hash')
    }
}

async function validateInputPostProvider(txHash: string, blockNumber: number | string, provider: BaseProvider) {
    // Validate the block number
    if (blockNumber !== 'latest') {
        const currentBlockNumber = await provider.getBlockNumber()
        blockNumber = Number(blockNumber)

        if (blockNumber >= currentBlockNumber) {
            throw new Error('You cannot use a blocknumber that has not yet happened.')
        }

        // A block older than 128 blocks needs access to an archive node
        if (blockNumber < currentBlockNumber - 128) {
            try {
                // Check to see if a provider has access to an archive node
                await provider.getBalance(ZERO_ADDRESS, blockNumber)
            } catch (err: any) {
                const errCode = JSON.parse(err.responseText).error.code
                // NOTE: This error code is specific to Infura. Alchemy offers an Archive node by default, so an Alchemy node will never throw here.
                const infuraErrCode = -32002
                if (errCode === infuraErrCode) {
                    throw new Error('You cannot use a blocknumber that is older than 128 blocks. Please use a provider that uses a full archival node.')
                }
            }
        }
    }
}

function decodeMessage(code: string) {
    // NOTE: `code` may end with 0's which will return a text string with empty whitespace characters
    // This will truncate all 0s and set up the hex string as expected
    // NOTE: Parity (Kovan) returns in a different format than other clients
    let codeString = `0x${code.substr(138)}`.replace(/0+$/, '')

    // If the codeString is an odd number of characters, add a trailing 0
    if (codeString.length % 2 === 1) {
        codeString += '0'
    }

    return toUtf8String(codeString)

}

async function getCode(tx: Deferrable<any>, blockNumber: string | number, provider: BaseProvider): Promise<string> {
    return provider.call(tx, blockNumber)
}
