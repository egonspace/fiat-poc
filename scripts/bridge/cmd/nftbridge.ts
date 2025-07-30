import {HardhatRuntimeEnvironment} from "hardhat/types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract, Wallet} from "ethers";
import {base64ToHex, getSequence, waitConfirmation} from "./common";
import assert from "assert";
import {sleep} from "../utils/utils";

export async function registerChainNFTBridge(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Bridge Register Chain INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`=============\n`);

    const bridgeFactory = await hre.ethers.getContractFactory("NFTBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const registerChainTx = await bridge.connect(signer).registerChain(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, registerChainTx);
    assert(receipt.status == 1); // success

    console.log("successfully registered chain.");
}

export async function upgradeNFTBridge(
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

    const bridgeFactory = await hre.ethers.getContractFactory("NFTBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const upgradeTx = await bridge.connect(signer).upgrade(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, upgradeTx);
    assert(receipt.status == 1); // success

    console.log("successfully upgraded bridge contract.");
}

export async function transferNFT(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    token: string,
    tokenID: number,
    sender: SignerWithAddress | Wallet,
    recipientChain: number,
    recipient: string,
    arbiterFee: bigint,
    nonce: number,
    executeApprove: boolean,
) {
    const bridgeFactory = await hre.ethers.getContractFactory("NFTBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);
    const bal = await hre.ethers.provider.getBalance(sender.address);

    if (executeApprove) {
        await approve721(hre, token, bridgeAddress, tokenID, sender);
    }

    const {
        gasPrice, maxFeePerGas, maxPriorityFeePerGas
    } = await hre.ethers.provider.getFeeData();

    let sequence;
    let serviceFee;
    [sequence, serviceFee] = await bridge.connect(sender).callStatic.transferNFT(
        token,
        tokenID,
        recipientChain,
        recipient,
        arbiterFee,
        nonce,
        {
            nonce: hre.ethers.provider.getTransactionCount(sender.address),
            value: 100000000000000000n,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            maxFeePerGas: maxFeePerGas
        }
    );

    console.log(`=== Transfer Tokens INPUT ===`);
    console.log(`gasPrice: ${gasPrice}`);
    console.log(`maxFeePerGas: ${maxFeePerGas}`);
    console.log(`maxPriorityFeePerGas: ${maxPriorityFeePerGas}`);
    console.log(`balance of sender: ${bal}`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`token: ${token}`);
    console.log(`tokenID: ${tokenID}`);
    console.log(`recipientChain: ${recipientChain}`);
    console.log(`recipient: ${recipient}`);
    console.log(`sequence: ${sequence}`);
    console.log(`serviceFee: ${serviceFee}`);
    console.log(`arbiterFee: ${arbiterFee}`);
    console.log(`pay: ${serviceFee.add(arbiterFee)}`);
    console.log(`nonce: ${nonce}`);
    console.log(`=============\n`);

    // @ts-ignore
    const tx = await bridge.connect(sender).transferNFT(
        token,
        tokenID,
        recipientChain,
        recipient,
        arbiterFee,
        nonce,
        {
            nonce: hre.ethers.provider.getTransactionCount(sender.address),
            value: serviceFee.add(arbiterFee)
        }
    );
    const receipt = await waitConfirmation(hre, tx);
    console.log("receipt: " + receipt);
    sequence = getSequence(receipt);
    console.log("Sequence: " + sequence);

    return sequence;
}

export async function batchTransferNFT(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    token: string,
    tokenIDs: number[],
    sender: SignerWithAddress | Wallet,
    recipientChain: number,
    recipient: string,
    arbiterFee: bigint,
    nonce: number,
    executeApprove: boolean,
) {
    const bridgeFactory = await hre.ethers.getContractFactory("NFTBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);
    const bal = await hre.ethers.provider.getBalance(sender.address);

    console.log(`=== Transfer Tokens INPUT ===`);
    console.log(`balance of sender: ${bal}`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`token: ${token}`);
    console.log(`tokenIDs: ${tokenIDs}`);
    console.log(`recipientChain: ${recipientChain}`);
    console.log(`recipient: ${recipient}`);
    console.log(`arbiterFee: ${arbiterFee}`);
    console.log(`pay: 0.1 eth`);
    console.log(`nonce: ${nonce}`);
    console.log(`=============\n`);

    if (executeApprove) {
        await approve721All(hre, token, bridgeAddress, sender);
    }

    // @ts-ignore
    const tx = await bridge.connect(sender).batchTransferNFT(
        token,
        tokenIDs,
        recipientChain,
        recipient,
        arbiterFee,
        nonce,
        {
            nonce: hre.ethers.provider.getTransactionCount(sender.address),
            value: 10000000000000000n
        }
    );
    const receipt = await waitConfirmation(hre, tx);
    console.log("receipt: " + receipt);
    const sequence = getSequence(receipt);
    console.log("Sequence: " + sequence);
    console.log("used base coin: " + bal.sub(await hre.ethers.provider.getBalance(sender.address)));
    return sequence;
}

export async function approve721(
    hre: HardhatRuntimeEnvironment,
    token: string,
    spender: string,
    tokenID: number,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Approve INPUT ===`);
    console.log(`token: ${token}`);
    console.log(`spender: ${spender}`);
    console.log(`tokenID: ${tokenID}`);
    console.log(`signer: ${signer.address}`);
    console.log(`=============\n`);

    const erc721Factory = await hre.ethers.getContractFactory("ItemNFT");
    const erc721 = erc721Factory.attach(token);
    // @ts-ignore
    const approveTx = await erc721.connect(signer).approve(spender, tokenID, {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, approveTx);

    console.log("Successfully approved token.")
}

export async function approve721All(
    hre: HardhatRuntimeEnvironment,
    token: string,
    spender: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Approve INPUT ===`);
    console.log(`token: ${token}`);
    console.log(`spender: ${spender}`);
    console.log(`signer: ${signer.address}`);
    console.log(`=============\n`);

    const erc721Factory = await hre.ethers.getContractFactory("ItemNFT");
    const erc721 = erc721Factory.attach(token);
    // @ts-ignore
    const approveTx = await erc721.connect(signer).setApprovalForAll(spender, {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, approveTx);

    console.log("Successfully approved all.")
}

export async function completeTransferNFT(
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

    console.log("vaa = " + base64ToHex(vaa));


    const bridgeFactory = await hre.ethers.getContractFactory("NFTBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const tx = await bridge.connect(signer).completeTransfer(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, tx);

    console.log("Transfer completed!");
}

export async function completeBatchTransferNFT(
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

    console.log("vaa = " + base64ToHex(vaa));


    const bridgeFactory = await hre.ethers.getContractFactory("NFTBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const tx = await bridge.connect(signer).completeBatchTransfer(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, tx);

    console.log("Batch transfer completed!");
}

export async function registerChainMultiTokenBridge(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Bridge Register Chain INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`=============\n`);

    const bridgeFactory = await hre.ethers.getContractFactory("MultiTokenBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const registerChainTx = await bridge.connect(signer).registerChain(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, registerChainTx);
    assert(receipt.status == 1); // success

    console.log("successfully registered chain.");
}

export async function upgradeMultiTokenBridge(
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

    const bridgeFactory = await hre.ethers.getContractFactory("MultiTokenBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const upgradeTx = await bridge.connect(signer).upgrade(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    const receipt = await waitConfirmation(hre, upgradeTx);
    assert(receipt.status == 1); // success

    console.log("successfully upgraded bridge contract.");
}

export async function transferMultiToken(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    token: string,
    tokenID: number,
    amount: number,
    sender: SignerWithAddress | Wallet,
    recipientChain: number,
    recipient: string,
    arbiterFee: bigint,
    nonce: number,
    executeApprove: boolean,
) {
    const bridgeFactory = await hre.ethers.getContractFactory("MultiTokenBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);
    const bal = await hre.ethers.provider.getBalance(sender.address);

    if (executeApprove) {
        await approve1155(hre, token, bridgeAddress, sender);
    }

    const {
        gasPrice, maxFeePerGas, maxPriorityFeePerGas
    } = await hre.ethers.provider.getFeeData();

    let sequence;
    let serviceFee;
    [sequence, serviceFee] = await bridge.connect(sender).callStatic.transferMultiToken(
        token,
        tokenID,
        amount,
        recipientChain,
        recipient,
        arbiterFee,
        nonce,
        {
            nonce: hre.ethers.provider.getTransactionCount(sender.address),
            value: 100000000000000000n,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            maxFeePerGas: maxFeePerGas
        }
    );

    console.log(`=== Transfer Tokens INPUT ===`);
    console.log(`gasPrice: ${gasPrice}`);
    console.log(`maxFeePerGas: ${maxFeePerGas}`);
    console.log(`maxPriorityFeePerGas: ${maxPriorityFeePerGas}`);
    console.log(`balance of sender: ${bal}`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`token: ${token}`);
    console.log(`tokenID: ${tokenID}`);
    console.log(`amount: ${amount}`);
    console.log(`recipientChain: ${recipientChain}`);
    console.log(`recipient: ${recipient}`);
    console.log(`serviceFee: ${serviceFee}`);
    console.log(`arbiterFee: ${arbiterFee}`);
    console.log(`pay: ${serviceFee.add(arbiterFee)}`);
    console.log(`nonce: ${nonce}`);
    console.log(`=============\n`);

    // @ts-ignore
    const tx = await bridge.connect(sender).transferMultiToken(
        token,
        tokenID,
        amount,
        recipientChain,
        recipient,
        arbiterFee,
        nonce,
        {
            nonce: hre.ethers.provider.getTransactionCount(sender.address),
            value: 100000000000000000n,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            maxFeePerGas: maxFeePerGas
        }
    );
    const receipt = await waitConfirmation(hre, tx);
    console.log("receipt: " + receipt);
    sequence = getSequence(receipt);
    console.log("Sequence: " + sequence);

    return sequence;
}

export async function batchTransferMultiToken(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    token: string,
    tokenIDs: number[],
    amounts: number[],
    sender: SignerWithAddress | Wallet,
    recipientChain: number,
    recipient: string,
    arbiterFee: bigint,
    nonce: number,
    executeApprove: boolean,
) {
    const bridgeFactory = await hre.ethers.getContractFactory("MultiTokenBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);
    const bal = await hre.ethers.provider.getBalance(sender.address);

    console.log(`=== Transfer Tokens INPUT ===`);
    console.log(`balance of sender: ${bal}`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`token: ${token}`);
    console.log(`tokenID: ${tokenIDs}`);
    console.log(`amount: ${amounts}`);
    console.log(`recipientChain: ${recipientChain}`);
    console.log(`recipient: ${recipient}`);
    console.log(`arbiterFee: ${arbiterFee}`);
    console.log(`nonce: ${nonce}`);
    console.log(`=============\n`);

    if (executeApprove) {
        await approve1155(hre, token, bridgeAddress, sender);
    }

    // @ts-ignore
    const tx = await bridge.connect(sender).batchTransferMultiToken(
        token,
        tokenIDs,
        amounts,
        recipientChain,
        recipient,
        arbiterFee,
        nonce,
        {
            nonce: hre.ethers.provider.getTransactionCount(sender.address),
            value: 10000000000000000n
        }
    );
    const receipt = await waitConfirmation(hre, tx);
    console.log("receipt: " + receipt);
    const sequence = getSequence(receipt);
    console.log("Sequence: " + sequence);
    console.log("used base coin: " + bal.sub(await hre.ethers.provider.getBalance(sender.address)));

    return sequence;
}

export async function approve1155(
    hre: HardhatRuntimeEnvironment,
    token: string,
    spender: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Approve INPUT ===`);
    console.log(`token: ${token}`);
    console.log(`spender: ${spender}`);
    console.log(`signer: ${signer.address}`);
    console.log(`=============\n`);

    const erc1155Factory = await hre.ethers.getContractFactory("MultiToken");
    const erc1155 = erc1155Factory.attach(token);
    // @ts-ignore
    const approveTx = await erc1155.connect(signer).setApprovalForAll(spender, true, {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, approveTx);

    console.log("Successfully approved token.")
}

export async function completeTransferMultiToken(
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

    console.log("vaa = " + base64ToHex(vaa));


    const bridgeFactory = await hre.ethers.getContractFactory("MultiTokenBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const tx = await bridge.connect(signer).completeTransfer(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, tx);

    console.log("Transfer completed!");
}

export async function completeBatchTransferMultiToken(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Complete Batch Transfer INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`signer: ${signer.address}`);
    console.log(`=============\n`);

    console.log("vaa = " + base64ToHex(vaa));


    const bridgeFactory = await hre.ethers.getContractFactory("MultiTokenBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const tx = await bridge.connect(signer).completeBatchTransfer(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, tx);

    console.log("Transfer completed!");
}

export async function transferFeeToken(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    toChain: number,
    sender: SignerWithAddress | Wallet,
    recipient: string,
    nonce: number,
) {
    const bridgeFactory = await hre.ethers.getContractFactory("NFTBridge");
    const erc20Factory = await hre.ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
    const fromBridge = bridgeFactory.attach(bridgeAddress);
    const feeToken = erc20Factory.attach(await fromBridge.wrappedFeeToken(toChain));
    const bal = await feeToken.balanceOf(sender.address);

    console.log(`=== Transfer Tokens INPUT ===`);
    console.log(`balance of sender: ${bal}`);
    console.log(`bridgeAddress: ${fromBridge.address}`);
    console.log(`token: ${feeToken.address}`);
    console.log(`amount: ${bal}`);
    console.log(`recipientChain: ${toChain}`);
    console.log(`recipient: ${recipient}`);
    console.log(`nonce: ${nonce}`);
    console.log(`=============\n`);

    let tx = await feeToken.connect(sender).approve(fromBridge.address, bal,
        {
            nonce: hre.ethers.provider.getTransactionCount(sender.address)
        }
    );
    let receipt = await waitConfirmation(hre, tx);
    console.log("receipt: " + receipt);

    tx = await fromBridge.connect(sender).transferFeeToken(toChain, recipient, bal, nonce,
        {
            nonce: hre.ethers.provider.getTransactionCount(sender.address)
        }
    );
    receipt = await waitConfirmation(hre, tx);
    console.log("receipt: " + receipt);

    const sequence = getSequence(receipt);
    console.log("Sequence: " + sequence);

    return sequence;
}

export async function completeTransferFeeToken(
    hre: HardhatRuntimeEnvironment,
    bridgeAddress: string,
    vaa: string,
    signer: SignerWithAddress | Wallet
) {
    console.log(`=== Complete TransferFeeToken INPUT ===`);
    console.log(`bridgeAddress: ${bridgeAddress}`);
    console.log(`vaa: ${vaa}`);
    console.log(`signer: ${signer.address}`);
    console.log(`=============\n`);

    console.log("vaa = " + base64ToHex(vaa));


    const bridgeFactory = await hre.ethers.getContractFactory("NFTBridge");
    const bridge = bridgeFactory.attach(bridgeAddress);

    // @ts-ignore
    const tx = await bridge.connect(signer).completeTransferFeeToken(base64ToHex(vaa), {
        nonce: hre.ethers.provider.getTransactionCount(signer.address),
    });
    await waitConfirmation(hre, tx);

    console.log("Transfer completed!");
}
