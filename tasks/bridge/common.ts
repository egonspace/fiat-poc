import { BASE_CHAIN_ID, ETHREUM_CHAIN_ID, KLAYTN_CHAIN_ID, WormholeType } from "../../scripts/bridge/env/deployEnv";
import { sleep } from "../../scripts/bridge/utils/utils";
import { base64ToHex, getTxReceipt, getVAA, parseLogMessagePublished, parseVAA } from "../../scripts/bridge/cmd/common";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment, HttpNetworkConfig } from "hardhat/types";
import { approve } from "../../scripts/bridge/cmd/bridge";
import { getRevertReason } from "../../scripts/bridge/utils/revertReason";

const LOG_MESSAGE_PUBLISHED_EVENT_SIGNATURE = "0x6eb224fb001ed210e379b335e35efe88672a8ce935d981a6896b27ffdf52a3b2";

export function chainNameToChainId(chainName: string) {
    if (chainName == "cypress" || chainName == "baobab") {
        return KLAYTN_CHAIN_ID;
    } else if (chainName == "ethereum" || chainName == "goerli") {
        return ETHREUM_CHAIN_ID;
    } else if (chainName == "base" || chainName == "baseGoerli") {
        return BASE_CHAIN_ID;
    } else {
        throw Error("invalid chain name.");
    }
}

export async function fetchVAA(
    times: number,
    type: WormholeType,
    chainId: number,
    emitterAddress: string,
    sequence: string,
    encoding: string = "base64"
) {
    let count = 0;
    console.log("Fetching VAA..");

    while (count < times) {
        await sleep(5);
        const vaa = await getVAA(type, chainId, emitterAddress, sequence, encoding);
        if (vaa) {
            return;
        } else {
            count++;
        }
    }
}

/**
 * VAA
 */
task("get-vaa", "Get VAA")
    .addParam("chainId", "wormhole chain id")
    .addParam("emitterAddress", "message emitter address")
    .addParam("sequence", "sequence number of the tx")
    .addParam("type", "'0' means WH_19, '1' means 'WH_ISK'")
    .addOptionalParam("encoding", "'hex' or 'base64'", "base64")
    .setAction((taskArgs, _: HardhatRuntimeEnvironment) =>
        getVAA(taskArgs.type, taskArgs.chainId, taskArgs.emitterAddress, taskArgs.sequence, taskArgs.encoding)
    );

task("tx-receipt", "Get transaction receipt.")
    .addPositionalParam("txHash", "transaction hash")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const receipt = await getTxReceipt(hre, taskArgs.txHash);
        console.log(JSON.stringify(receipt, undefined, 2));
    });

task("parse-message", "parse LogMessagePublished message.")
    .addParam("txHash", "transaction hash.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const receipt = await getTxReceipt(hre, taskArgs.txHash);
        receipt.logs
            .filter((log) => log.topics[0] === LOG_MESSAGE_PUBLISHED_EVENT_SIGNATURE)
            .forEach((eventLog) => {
                console.log(parseLogMessagePublished(eventLog.topics, eventLog.data));
            });
    });

task("revert-reason", "Get revert reason.")
    .addParam("txHash", "transaction hash.")
    .addOptionalParam("blockNumber", "block number to query.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        if (!hre.network.name) {
            console.error("[ERROR] please specify --network");
            return;
        }
        const networkConfig = hre.network.config as HttpNetworkConfig;
        const provider = new hre.ethers.providers.JsonRpcProvider({
            url: networkConfig.url,
            headers: networkConfig.httpHeaders,
        });
        await provider.ready;
        const message = await getRevertReason(taskArgs.txHash, provider);
        if (message) {
            console.log(message);
        }
    });

task("parse-vm")
    .addParam("vaa", "VAA (Base64 encoded)")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const vaa = parseVAA(base64ToHex(taskArgs.vaa));
        console.log(vaa);
    });
