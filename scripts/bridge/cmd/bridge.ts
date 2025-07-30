import {HardhatRuntimeEnvironment, HttpNetworkConfig} from "hardhat/types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {base64ToHex, getBridgeFactory, getSequence, waitConfirmation} from "./common";
import assert from "assert";
import {getBridgeApp} from "../env/deployEnv";
import {hexToBytes32, sleep} from "../utils/utils";
import {Contract, Wallet} from "ethers";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function attestToken(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    tokenAddress: string,
    nonce: number,
    signer: SignerWithAddress | Wallet
): Promise<string> {
    console.log(`=== Attest Token INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`tokenAddress: ${tokenAddress}`);
    console.log(`nonce: ${nonce}`);
    console.log(`=============\n`);

    const bridgeFactory = await hre.ethers.getContractFactory("Bridge", {
        libraries: {
            BridgeUtil: ZERO_ADDRESS
        }
    });
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const attestTokenTx = await bridge.connect(signer).attestToken(tokenAddress, nonce, {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, attestTokenTx);

    const sequence = getSequence(receipt);
    console.log(`emitterAddress: ${bridgeAddress}`);
    console.log(`sequence: ${sequence}`);

    return sequence
}
export async function registerChain(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Bridge Register Chain INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`=============\n`);

    const bridgeFactory = await getBridgeFactory(hre);
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const registerChainTx = await bridge.connect(signer).registerChain(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, registerChainTx);
    assert(receipt.status == 1); // success

    console.log("successfully registered chain.");
}


export async function upgradeBridge(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Upgrade Bridge INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`signer: ${signer.address}`)
    console.log(`=============\n`);
    console.log("Please confirm the details. Upgrade will be started after 10 seconds.");
    await sleep(10); // sleep for confirmation
    console.log("Start upgrading bridge contract.");

    const bridgeFactory = await getBridgeFactory(hre);
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const upgradeTx = await bridge.connect(signer).upgrade(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, upgradeTx);
    assert(receipt.status == 1); // success

    console.log("successfully upgraded bridge contract.");

    const bridgeImplFactory = await hre.ethers.getContractFactory("BridgeImplementation", {
        libraries: {
            BridgeUtil: ZERO_ADDRESS, // not use library this time
        }
    });
    const impl = bridgeImplFactory.attach(bridgeAddress);

    const version = await impl.version();
    console.log("New Implementation Version: " + version);
}

export async function createWrapped(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    nonce: number,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Create Wrapped INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`=============\n`);

    const bridgeFactory = await getBridgeFactory(hre);
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const createWrappedTx = await bridge.connect(signer).createWrapped(base64ToHex(vaa), nonce, {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, createWrappedTx);
    const sequence = getSequence(receipt);
    console.log(`emitterAddress: ${bridgeAddress}`);
    console.log(`sequence: ${sequence}`);
    console.log("successfully registered wrapped token.");

    return sequence
}

export async function createAdapter(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    initialAmount: bigint,
    nonce: number,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Create Adapter INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`initialAmount: ${initialAmount}`);
    console.log(`vaa: ${vaa}`);
    console.log(`=============\n`);

    const bridgeFactory = await getBridgeFactory(hre);
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const createAdapterTx = await bridge.connect(signer).createAdapter(base64ToHex(vaa), initialAmount, nonce, {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, createAdapterTx);

    const sequence = getSequence(receipt);
    console.log(`emitterAddress: ${bridgeAddress}`);
    console.log(`sequence: ${sequence}`);
    console.log("successfully registered adapter of the wrapped token.");

    return sequence
}

export async function completeRemoteAsset(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== completeRemoteAsset INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`=============\n`);

    const bridgeFactory = await getBridgeFactory(hre);
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const tx = await bridge.connect(signer).completeRemoteAsset(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, tx);
    console.log("successfully completeRemoteAsset.");
}


export async function updateServiceFeePolicy(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Update Service Fee Policy INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`=============\n`);

    const bridgeFactory = await getBridgeFactory(hre);
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const updateServiceFeePolicyTx = await bridge.connect(signer).updateServiceFeePolicy(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, updateServiceFeePolicyTx);
    assert(receipt.status == 1); // success

    console.log("successfully updated service fee policy.");
}

export async function transferTokens(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    token: string,
    amount: bigint,
    sender: SignerWithAddress | Wallet,
    recipientChain: number,
    recipient: string,
    nonce: number,
    executeApprove: boolean,
    arbiterFee: bigint,
    serviceFee?: bigint,
) {
    const bridgeFactory = await getBridgeFactory(hre);
    const bridge = bridgeFactory.attach(bridgeAddress);
    let actualServiceFee: bigint;
    if (serviceFee) {
        actualServiceFee = serviceFee
    } else {
        // @ts-ignore
        actualServiceFee = await bridge.connect(sender).calculateServiceFee(token, amount, recipientChain);
    }

    console.log(`=== Transfer Tokens INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`token: ${token}`);
    console.log(`amount: ${amount}`);
    console.log(`recipientChain: ${recipientChain}`);
    console.log(`recipient: ${recipient}`);
    console.log(`arbiterFee: ${arbiterFee}`);
    console.log(`serviceFee: ${actualServiceFee}`);
    console.log(`nonce: ${nonce}`);
    console.log(`=============\n`);

    if (executeApprove) {
        await approve(hre, token, bridgeAddress, amount, sender);
    }

    // @ts-ignore
    const tx = await bridge.connect(sender).transferTokens(
        token,
        amount,
        recipientChain,
        recipient,
        arbiterFee,
        actualServiceFee,
        nonce,
        {
            nonce: hre.ethers.provider.getTransactionCount(sender.address),
        }
    );
    const receipt = await waitConfirmation(hre, tx);
    const sequence = getSequence(receipt);
    console.log("Sequence: " + sequence);

    return sequence;
}

export async function approve(
    hre: HardhatRuntimeEnvironment,
    token: string,
    spender: string,
    amount: bigint,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Approve INPUT ===`);
    console.log(`token: ${token}`);
    console.log(`spender: ${spender}`);
    console.log(`amount: ${amount}`);
    console.log(`signer: ${signer.address}`);
    console.log(`=============\n`);

    const erc20Factory = await hre.ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
    const erc20 = erc20Factory.attach(token);
    // @ts-ignore
    const approveTx = await erc20.connect(signer).approve(spender, amount, {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, approveTx);

    console.log("Successfully approved token.")
}

export async function completeTransfer(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Complete Transfer INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`signer: ${signer.address}`);
    console.log(`=============\n`);

    const bridgeFactory = await getBridgeFactory(hre);
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const tx = await bridge.connect(signer).completeTransfer(base64ToHex(vaa), {
        //gasLimit: 1_000_000,
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, tx);

    console.log("Transfer completed!");
}

export async function returnTransfer(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    recipient: string,
    arbiterFee: bigint,
    nonce: number,
    signer: SignerWithAddress | Wallet,
    feeDecimals?: number
) {
    console.log(`=== Return Transfer INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`recipient: ${recipient}`);
    console.log(`arbiterFee: ${arbiterFee}`);
    console.log(`nonce: ${nonce}`);
    console.log(`signer: ${signer.address}`);
    console.log(`=============\n`);

    const bridgeFactory = await getBridgeFactory(hre);
    const bridge = bridgeFactory.attach(bridgeAddress);

    let tx;
    if (feeDecimals) {
        // @ts-ignore
        tx = await bridge.connect(signer)["returnTransfer(bytes,bytes32,uint256,uint8,uint32)"](
            base64ToHex(vaa),
            recipient,
            arbiterFee,
            feeDecimals,
            nonce,
            {
                nonce: hre.ethers.provider.getTransactionCount(signer.address),
            }
        );
    } else {
        // @ts-ignore
        tx = await bridge.connect(signer)["returnTransfer(bytes,bytes32,uint256,uint32)"](
            base64ToHex(vaa),
            recipient,
            arbiterFee,
            nonce,
            {
                nonce: hre.ethers.provider.getTransactionCount(signer.address),
            }
        );
    }
    const receipt = await waitConfirmation(hre, tx);
    const sequence = getSequence(receipt);

    console.log("Sequence: " + sequence);
    return sequence;
}

export async function getBalance(
    hre: HardhatRuntimeEnvironment,
    token: string,
    address: string,
) {
    const erc20Factory = await hre.ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
    const erc20 = erc20Factory.attach(token);

    const balance = await erc20.balanceOf(address);
    console.log("Balance: " + balance);

    return balance;
}

export async function getTotalSupply(
    hre: HardhatRuntimeEnvironment,
    token: string,
) {
    const erc20Factory = await hre.ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
    const erc20 = erc20Factory.attach(token);

    const supply = await erc20.totalSupply();
    console.log("Total Supply: " + supply);

    return supply;
}

export async function getBridgeContract(hre: HardhatRuntimeEnvironment, targetChainId: number, app: string): Promise<Contract> {
    const bridgeAddress = getBridgeApp(targetChainId, app) as string;
    const bridgeFactory = await getBridgeFactory(hre);
    return bridgeFactory.attach(bridgeAddress);
}

export async function getWrappedAddress(
    hre: HardhatRuntimeEnvironment,
    targetChainId: number,
    originChainId: number,
    originToken: string,
    app: string
) {
    const bridge = await getBridgeContract(hre, targetChainId, app);
    const wrappedToken = await bridge.wrappedAsset(originChainId, hexToBytes32(originToken));
    if (wrappedToken == ZERO_ADDRESS) {
        console.log("Wrapped asset does not exist.");
    } else {
        console.log("Wrapped asset: " + wrappedToken);
    }
}

export async function getWrappedAssetBalance(
    hre: HardhatRuntimeEnvironment,
    targetChainId: number,
    originChainId: number,
    originToken: string,
    address: string,
    app: string
) {
    const bridge = await getBridgeContract(hre, targetChainId, app);
    const wrappedToken = await bridge.wrappedAsset(originChainId, hexToBytes32(originToken));
    if (wrappedToken == ZERO_ADDRESS) {
        console.log("Wrapped asset does not exist.");
        return;
    } else {
        console.log("Wrapped asset: " + wrappedToken);
    }

    const erc20Factory = await hre.ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
    const erc20 = erc20Factory.attach(wrappedToken);

    const totalSupply = await erc20.totalSupply();
    console.log("Total Supply: " + totalSupply);
    const balance = await erc20.balanceOf(address);
    console.log("Balance: " + balance);

    return balance;
}

export async function getAdapterBalance(
    hre: HardhatRuntimeEnvironment,
    targetChainId: number,
    originChainId: number,
    originToken: string
) {
    const bridge = await getBridgeContract(hre, targetChainId, "bridge");
    const wrappedToken = await bridge.wrappedAsset(originChainId, hexToBytes32(originToken));
    if (wrappedToken == ZERO_ADDRESS) {
        console.log("Wrapped asset does not exist.");
        return;
    } else {
        console.log("Wrapped asset: " + wrappedToken);
    }
    const erc20Factory = await hre.ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
    const erc20 = erc20Factory.attach(wrappedToken);
    const totalSupply = await erc20.totalSupply();
    console.log("Total Supply of Wrapped asset: " + totalSupply);

    const adapterAddress = await bridge.adapterOf(wrappedToken);
    if (adapterAddress == ZERO_ADDRESS) {
        console.log("Adapter does not exist.");
        return;
    }

    const adapterFactory = await hre.ethers.getContractFactory("TokenAdapterImplementation");
    const adapter = adapterFactory.attach(adapterAddress);
    const circulation = await adapter.totalCirculation();
    console.log("Adapter: " + adapterAddress);
    console.log("Adapter Circulation: " + circulation);


    const balance = await erc20.balanceOf(adapterAddress);
    console.log("Adapter Balance: " + balance);

    return balance;
}

export async function bridgeStatus(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string
) {
    const bridgeImplFactory = await hre.ethers.getContractFactory("BridgeImplementation", {
        libraries: {
          BridgeUtil: ZERO_ADDRESS
        }});
    const impl = bridgeImplFactory.attach(bridgeAddress);

    console.log("Bridge Address: " + bridgeAddress);

    const chainId = await impl.chainId();
    console.log("Chain ID: " + chainId);

    const version = await impl.version();
    console.log("Version: " + version);

    const publisher = await impl.wormhole();
    console.log("Publisher Wormhole: " + publisher);

    const governanceChainId = await impl.governanceChainId();
    console.log("Governance Chain ID: " + governanceChainId);

    const governanceContract = await impl.governanceContract();
    console.log("Governance Contract: " + governanceContract);

    const governanceVerifier = await impl.verifierWormhole(governanceChainId);
    console.log("Governance Verifier Wormhole: " + governanceVerifier);

    const finality = await impl.finality();
    console.log("Finality: " + finality);
}

export async function wormholeStatus(
    hre: HardhatRuntimeEnvironment,
    wormholeAddress: string
) {
    const wormholeImplFactory = await hre.ethers.getContractFactory("Implementation");
    const impl = wormholeImplFactory.attach(wormholeAddress);

    console.log("Wormhole Address: " + wormholeAddress);

    const chainId = await impl.chainId();
    console.log("Chain ID: " + chainId);

    const gsIndex = await impl.getCurrentGuardianSetIndex();
    console.log("Guardian Set Index: " + gsIndex);

    const gs = await impl.getGuardianSet(gsIndex);
    console.log("Guardian Set: " + gs);

    const governanceChainId = await impl.governanceChainId();
    console.log("Governance Chain ID: " + governanceChainId);

    const governanceContract = await impl.governanceContract();
    console.log("Governance Contract: " + governanceContract);

    const messageFee = await impl.messageFee();
    console.log("Message Fee: " + messageFee);
}
