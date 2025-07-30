import {getWormhole, getWormhole19, getWormholeIsk, WormholeType} from "../env/deployEnv";
import {waitConfirmation} from "./common";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {sleep} from "../utils/utils";
import {Wallet} from "ethers";

export async function upgradeWormhole(
    hre: HardhatRuntimeEnvironment,
    chainId: number,
    vaa: string,
    type: WormholeType,
    signer: SignerWithAddress | Wallet
) {
    const wormholeAddress = getWormhole(chainId, type);

    console.log(`=== Upgrade Wormhole INPUT ===`);
    console.log(`chainId: ${chainId}`);
    console.log(`type: ${type}`);
    console.log(`wormhole address: ${wormholeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`signer: ${signer.address}`);
    console.log(`=============\n`);
    console.log("Please confirm the details. Upgrade will be started after 10 seconds.")

    await sleep(10); // sleep for confirmation
    console.log("Start upgrading wormhole core contract.");

    const wormholeFactory = await hre.ethers.getContractFactory("Implementation");
    const wormhole = wormholeFactory.attach(wormholeAddress);
    // @ts-ignore
    const tx = await wormhole.connect(signer).submitContractUpgrade(
        vaa
    );
    await waitConfirmation(hre, tx);

    console.log("successfully upgraded wormhole contract.");
}
