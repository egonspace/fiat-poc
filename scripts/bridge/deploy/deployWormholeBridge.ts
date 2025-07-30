import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {hexToBytes32} from "../utils/utils";
import {Contract, Wallet} from "ethers";
import {validAddress} from "../env/deployEnv";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

export async function deployWormholeBridgeImpl(
    ethers: HardhatEthersHelpers,
    deployer: SignerWithAddress | Wallet,
    version?: number,
    libAddress?: string
): Promise<Contract> {
    if (!libAddress) {
        const Lib = await ethers.getContractFactory("BridgeUtil", deployer);
        const lib = await Lib.deploy();
        await lib.deployed();
        console.log(`lib deployed: ${lib.address}`);
        libAddress = lib.address;
    }

    let contract = "BridgeImplementation";
    if (version) {
        contract = `${contract}V${version}`;
    }
    const bridgeImplFactory = await ethers.getContractFactory(contract, {
        libraries: {
            BridgeUtil: libAddress,
        }},
    );

    // @ts-ignore
    const bridgeImpl = await bridgeImplFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await bridgeImpl.deployed();
    await bridgeImpl.deployTransaction.wait(3);

    console.log(`bridgeUtil library: ${libAddress}`);
    console.log(`bridgeImpl: ${bridgeImpl.address}`);

    return bridgeImpl;
}

export async function deployWormholeBridge(
    ethers: HardhatEthersHelpers,
    wormhole: string,
    chainId: number,
    finality: number,
    version: number,
    governanceChainId: number,
    governanceContract: string,
    governanceVerifier: string,
    deployer: SignerWithAddress | Wallet
) {
    const feeCollector = validAddress(process.env.FEE_COLLECTOR_ADDRESS as string, "fee collector addres.");

    console.log(`\n=== Wormhole Bridge Contract Deployment Input ===`);
    console.log(`wormhole: ${wormhole}`);
    console.log(`chainId: ${chainId}`);
    console.log(`governanceChainId: ${governanceChainId}`);
    console.log(`governanceContract: ${governanceContract}`);
    console.log(`finality: ${finality}`);
    console.log(`governanceVerifier: ${governanceVerifier}`);
    console.log(`feeCollector: ${feeCollector}`);
    console.log(`=============\n`);

    console.log(`deployer: ${deployer.address}`);

    const bridgeImpl = await deployWormholeBridgeImpl(ethers, deployer, version);

    const setupFactory = await ethers.getContractFactory("BridgeSetup");
    // @ts-ignore
    const setup = await setupFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await setup.deployed();
    await setup.deployTransaction.wait(3);
    console.log(`setup: ${setup.address}`);

    const tokenFactory = await ethers.getContractFactory("TokenImplementation");
    // @ts-ignore
    const tokenImpl = await tokenFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await tokenImpl.deployed();
    await tokenImpl.deployTransaction.wait(3);
    console.log(`tokenImpl: ${tokenImpl.address}`);

    const tokenAdapterFactory = await ethers.getContractFactory("TokenAdapterImplementation");
    // @ts-ignore
    const tokenAdapterImpl = await tokenAdapterFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await tokenAdapterImpl.deployed();
    await tokenAdapterImpl.deployTransaction.wait(3);
    console.log(`tokenAdapterImpl: ${tokenAdapterImpl.address}`);

    const feePolicyFactory = await ethers.getContractFactory("FixedRatioFee");
    // @ts-ignore
    const feePolicy = await feePolicyFactory.connect(deployer).deploy(
        feeCollector,
        1000,
        {
            nonce: ethers.provider.getTransactionCount(deployer.address),
        });
    await feePolicy.deployed();
    await feePolicy.deployTransaction.wait(3);
    console.log(`feePolicy: ${feePolicy.address}`);

    const setupData = setup.interface.encodeFunctionData("setup", [
        bridgeImpl.address,
        chainId,
        wormhole,
        governanceChainId,
        hexToBytes32(governanceContract),
        finality,
        tokenImpl.address,
        tokenAdapterImpl.address,
        governanceVerifier,
        feePolicy.address
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
