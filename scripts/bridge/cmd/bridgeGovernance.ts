import {HardhatRuntimeEnvironment} from "hardhat/types";
import {hexToBytes32} from "../utils/utils";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {getTxId} from "./multisig";
import assert from "assert";
import {base64ToHex, waitConfirmation} from "./common";
import {getWormhole, getWormhole19, getWormholeIsk, WormholeType} from "../env/deployEnv";
import {Wallet} from "ethers";

const TOKEN_BRIDGE_MODULE = "TokenBridge";
const NFT_BRIDGE_MODULE = "NFTBridge";
const MULTI_TOKEN_MODULE = "MultiTokenBridge";

function appModule(app: string) {
    if (app === 'bridge') {
        return TOKEN_BRIDGE_MODULE;
    }
    else if (app === 'nftbridge') {
        return NFT_BRIDGE_MODULE;
    }
    else if (app === 'multitokenbridge') {
        return MULTI_TOKEN_MODULE;
    }
    return "";
}

export async function proposeRegisterChain(
    hre: HardhatRuntimeEnvironment,
    targetChainId: number,
    chainId: number,
    app: string,
    bridgeAddress: string,
    verifierType: WormholeType,
    proposer: SignerWithAddress | Wallet
): Promise<string> {
    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
    let verifierAddress;
    if (verifierType == WormholeType.WH19) {
        verifierAddress = getWormhole19(targetChainId);
    } else if (verifierType == WormholeType.WH_ISK) {
        verifierAddress = getWormholeIsk(targetChainId);
    } else {
        throw Error("invalid wormhole type.");
    }

    console.log(`=== Governance RegisterChain Input ===`);
    console.log(`govAddress: ${process.env.BRIDGE_GOVERNANCE_CONTRACT}`);
    console.log(`targetChainId: ${targetChainId}`);
    console.log(`chainId: ${chainId}`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`verifierAddress: ${verifierAddress}`);
    console.log(`=============\n`);

    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const registerChainTx = await gov.connect(proposer).registerChain(
        appModule(app),
        targetChainId,
        chainId,
        hexToBytes32(bridgeAddress),
        hexToBytes32(verifierAddress),
        {
            nonce: hre.ethers.provider.getTransactionCount(proposer.address),
        }
    );
    const receipt = await waitConfirmation(hre, registerChainTx);
    assert(receipt.status == 1); // success

    const txId = getTxId(receipt);
    console.log(`registerChain proposal txId: ${txId}`);
    return txId;
}

export async function proposeUpgradeBridge(
    hre: HardhatRuntimeEnvironment,
    targetChainId: number,
    app: string,
    implementation: string,
    proposer: SignerWithAddress | Wallet
): Promise<string> {
    console.log(`=== Governance UpgradeBridgeContract INPUT ===`);
    console.log(`targetChainId: ${targetChainId}`);
    console.log(`implementation: ${implementation}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    let module;
    if (app === 'bridge') {
        module = TOKEN_BRIDGE_MODULE;
    }
    else if (app === 'nftbridge') {
        module = NFT_BRIDGE_MODULE;
    }
    // @ts-ignore
    const upgradeBridgeTx = await gov.connect(proposer).upgradeBridgeContract(
        module,
        targetChainId,
        hexToBytes32(implementation),
        {
            nonce: hre.ethers.provider.getTransactionCount(proposer.address),
        }
    );
    const receipt = await waitConfirmation(hre, upgradeBridgeTx);
    assert(receipt.status == 1); // success

    const txId = getTxId(receipt);
    console.log(`upgradeBridge proposal txId: ${txId}`);

    return txId;
}

export async function proposeCreateWrapped(
    hre: HardhatRuntimeEnvironment,
    assetMetaVm: string,
    name: string,
    symbol: string,
    targetChainId: number,
    proposer: SignerWithAddress | Wallet
): Promise<string> {
    console.log(`=== Governance CreateWrapped INPUT ===`);
    console.log(`assetMetaVm: ${assetMetaVm}`);
    console.log(`name: ${name}`);
    console.log(`symbol: ${symbol}`);
    console.log(`targetChainId: ${targetChainId}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const createWrappedTx = await gov.connect(proposer).createWrapped(
        base64ToHex(assetMetaVm),
        name,
        symbol,
        targetChainId
    );
    const receipt = await waitConfirmation(hre, createWrappedTx);
    assert(receipt.status == 1); // success

    const txId = getTxId(receipt);
    console.log(`createWrapped proposal txId: ${txId}`);

    return txId;
}

export async function proposeCreateAdapter(
    hre: HardhatRuntimeEnvironment,
    assetMetaVm: string,
    targetChainId: number,
    tokenAddress: string,
    proposer: SignerWithAddress | Wallet
): Promise<string> {
    console.log(`=== Governance CreateAdapter INPUT ===`);
    console.log(`assetMetaVm: ${assetMetaVm}`);
    console.log(`targetChainId: ${targetChainId}`);
    console.log(`tokenAddress: ${tokenAddress}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const createAdapterTx = await gov.connect(proposer).createAdapter(
        base64ToHex(assetMetaVm),
        targetChainId,
        hexToBytes32(tokenAddress)
    );
    const receipt = await waitConfirmation(hre, createAdapterTx);
    assert(receipt.status == 1); // success

    const txId = getTxId(receipt);
    console.log(`createAdapter proposal txId: ${txId}`);

    return txId;
}

export async function proposeUpdateServiceFeePolicy(
    hre: HardhatRuntimeEnvironment,
    targetChainId: number,
    newPolicy: string,
    proposer: SignerWithAddress | Wallet
): Promise<string> {
    console.log(`=== Governance UpdateServiceFeePolicy INPUT ===`);
    console.log(`targetChainId: ${targetChainId}`);
    console.log(`newPolicy: ${newPolicy}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const updateServiceFeePolicyTx = await gov.connect(proposer).updateServiceFeePolicy(
        TOKEN_BRIDGE_MODULE,
        targetChainId,
        hexToBytes32(newPolicy)
    );
    const receipt = await waitConfirmation(hre, updateServiceFeePolicyTx);
    assert(receipt.status == 1); // success

    const txId = getTxId(receipt);
    console.log(`createWrapped proposal txId: ${txId}`);

    return txId;
}

export async function proposeSetVerifier(
  hre: HardhatRuntimeEnvironment,
  emitterChain: number,
  type: WormholeType,
  proposer: SignerWithAddress | Wallet
): Promise<string> {
    const verifier = getWormhole(
        parseInt(process.env.BRIDGE_GOVERNANCE_CHAIN as string),
        type
    );
  console.log(`=== Governance SetVerifier INPUT ===`);
  console.log(`emitterChain: ${emitterChain}`);
  console.log(`verifier: ${verifier}`);
  console.log(`=============\n`);

  // @ts-ignore
  const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
  const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

  // @ts-ignore
  const setVerifierTx = await gov.connect(proposer).setVerifier(
    emitterChain,
    verifier
  );
  const receipt = await waitConfirmation(hre, setVerifierTx);
  assert(receipt.status == 1); // success

  const txId = getTxId(receipt);
  console.log(`createWrapped proposal txId: ${txId}`);

  return txId;
}
