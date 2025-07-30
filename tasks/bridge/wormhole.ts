import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFromArgs } from "../utils/utils";
import { upgradeWormhole } from "../../scripts/bridge/cmd/wormhole";
import { chainNameToChainId } from "./common";
import { getWormhole } from "../../scripts/bridge/env/deployEnv";
import { wormholeStatus } from "../../scripts/bridge/cmd/bridge";

task("upgrade-wormhole", "Upgrade wormhole contract.")
    .addParam("vaa", "VAA (Hex encoded)")
    .addParam("type", "'0' means WH_19, '1' means 'WH_ISK'")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        await upgradeWormhole(hre, chainId, taskArgs.vaa, taskArgs.type, signer);
    });

task("wormhole-status", "Get status of the wormhole core contract.")
    .addParam("type", "'0' means WH_19, '1' means 'WH_ISK'")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        let wormholeAddress = getWormhole(chainNameToChainId(hre.network.name), taskArgs.type);
        await wormholeStatus(hre, wormholeAddress);
    });
