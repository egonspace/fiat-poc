import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {hexToBytes32} from "../utils/utils";
import {Contract, Wallet} from "ethers";
import {validAddress} from "../env/deployEnv";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

export async function deployWormholeBridgeProxy(
    ethers: HardhatEthersHelpers,
    bridgeImpl: string,
    wormhole: string,
    chainId: number,
    finality: number,
    governanceChainId: number,
    governanceContract: string,
    governanceVerifier: string,
    tokenImpl: string,
    tokenAdapterImpl: string,
    feePolicy: string,
    deployer: SignerWithAddress | Wallet
) {
    const setupFactory = await ethers.getContractFactory("BridgeSetup");
    // @ts-ignore
    const setup = await setupFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await setup.deployed();
    await setup.deployTransaction.wait(3);
    console.log(`setup: ${setup.address}`);

    const setupData = setup.interface.encodeFunctionData("setup", [
        bridgeImpl,
        chainId,
        governanceVerifier,
        governanceChainId,
        hexToBytes32(governanceContract),
        finality,
        tokenImpl,
        tokenAdapterImpl,
        governanceVerifier,
        feePolicy
    ]);

    const proxyFactory = await ethers.getContractFactory("TokenBridge");
    // @ts-ignore
    const proxy = await proxyFactory.connect(deployer).deploy(setup.address, setupData, {
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await proxy.deployed();
    await proxy.deployTransaction.wait(3);

    console.log(`wormholeBridge proxy contract: ${proxy.address}`);
    console.log(`Finished deploying wormhole bridge contract!`)

    return proxy;
}
