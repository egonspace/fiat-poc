import {HardhatRuntimeEnvironment} from "hardhat/types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import assert from "assert";
import {BigNumber, Wallet} from "ethers";
import {waitConfirmation} from "./common";

export async function governanceStatus(hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const voters = await gov.getVoters();
    const proposers = await gov.getProposers();
    const quorumSize = await gov.required();
    const consistencyLevel = await gov.consistencyLevel();
    const validTransactionIdStart = await gov.validTransactionIdStart();
    console.log("Voters: " + voters);
    console.log("Proposers: " + proposers);
    console.log("Quorum Size: " + quorumSize);
    console.log("Consistency Level: " + consistencyLevel);
    console.log("Valid TransactionID Start: " + validTransactionIdStart);
}

export async function vote(hre: HardhatRuntimeEnvironment, txId: string, voter: SignerWithAddress | Wallet) {
    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const confirmTx = await gov.connect(voter).confirmTransaction(txId);
    const receipt = await waitConfirmation(hre, confirmTx);
    assert(receipt.status == 1); // success

    assert(receipt.events[0].event === "Confirmation");
    console.log(`[${voter.address}] successfully voted to tx (txId: ${txId})`);
}

export async function execute(
    hre: HardhatRuntimeEnvironment,
    txId: string,
    voter: SignerWithAddress | Wallet
): Promise<string | undefined> {
    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const confirmTx = await gov.connect(voter).executeTransaction(txId);
    const receipt = await waitConfirmation(hre, confirmTx);
    assert(receipt.status == 1); // success
    assert(receipt.events.filter((e: any) => e.event === "Execution").length === 1);

    console.log(`[${voter.address}] successfully executed tx (txId: ${txId})`);

    return receipt;
}

export async function proposeAddVoter(
    hre: HardhatRuntimeEnvironment,
    newVoter: string,
    proposer: SignerWithAddress | Wallet
): Promise<string> {
    console.log(`=== Add Voter INPUT ===`);
    console.log(`newVoter: ${newVoter}`);
    console.log(`proposer: ${proposer.address}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("MultiSigContractGovernable");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const confirmTx = await gov.connect(proposer).proposeAddVoter(newVoter);
    const receipt = await waitConfirmation(hre, confirmTx);

    const txId = getTxId(receipt);
    console.log("Successfully proposed to add voter. txId: " + txId);

    return txId;
}

export async function proposeRemoveVoter(
    hre: HardhatRuntimeEnvironment,
    target: string,
    proposer: SignerWithAddress | Wallet
): Promise<string> {
    console.log(`=== Remove Voter INPUT ===`);
    console.log(`target: ${target}`);
    console.log(`proposer: ${proposer.address}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("MultiSigContractGovernable");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const confirmTx = await gov.connect(proposer).proposeRemoveVoter(target);
    const receipt = await waitConfirmation(hre, confirmTx);

    const txId = getTxId(receipt);
    console.log("Successfully proposed to remove voter. txId: " + txId);

    return txId;
}

export async function proposeAddProposer(
    hre: HardhatRuntimeEnvironment,
    newProposer: string,
    proposer: SignerWithAddress | Wallet
): Promise<string> {
    console.log(`=== Add Proposer INPUT ===`);
    console.log(`newProposer: ${newProposer}`);
    console.log(`proposer: ${proposer.address}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("MultiSigContractGovernable");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const confirmTx = await gov.connect(proposer).proposeAddProposer(newProposer);
    const receipt = await waitConfirmation(hre, confirmTx);

    const txId = getTxId(receipt);
    console.log("Successfully proposed to add proposer. txId: " + txId);

    return txId;
}

export async function proposeRemoveProposer(
    hre: HardhatRuntimeEnvironment,
    target: string,
    proposer: SignerWithAddress | Wallet
): Promise<string> {
    console.log(`=== Remove Proposer INPUT ===`);
    console.log(`target: ${target}`);
    console.log(`proposer: ${proposer.address}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("MultiSigContractGovernable");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const confirmTx = await gov.connect(proposer).proposeRemoveProposer(target);
    const receipt = await waitConfirmation(hre, confirmTx);

    const txId = getTxId(receipt);
    console.log("Successfully proposed to remove proposer. txId: " + txId);

    return txId;
}

export async function proposeChangeQuorumSize(
    hre: HardhatRuntimeEnvironment,
    newQuorumSize: number,
    proposer: SignerWithAddress | Wallet
) {
    console.log(`=== Remove Proposer INPUT ===`);
    console.log(`newQuorumSize: ${newQuorumSize}`);
    console.log(`proposer: ${proposer.address}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("MultiSigContractGovernable");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const confirmTx = await gov.connect(proposer).proposeChangeQuorumSize(newQuorumSize);
    const receipt = await waitConfirmation(hre, confirmTx);

    const txId = getTxId(receipt);
    console.log("Successfully proposed to change quorum size. txId: " + txId);

    return txId;
}

export async function proposeCheckPointTransactionId(
    hre: HardhatRuntimeEnvironment,
    checkPoint: number,
    proposer: SignerWithAddress | Wallet
) {
    console.log(`=== Remove Proposer INPUT ===`);
    console.log(`checkPoint: ${checkPoint}`);
    console.log(`proposer: ${proposer.address}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("MultiSigContractGovernable");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const confirmTx = await gov.connect(proposer).proposeCheckpoint(checkPoint);
    const receipt = await waitConfirmation(hre, confirmTx);

    const txId = getTxId(receipt);
    console.log("Successfully proposed to checkpoint txid. txId: " + txId);

    return txId;
}

export async function proposeSetGovernanceConsistencyLevel(
    hre: HardhatRuntimeEnvironment,
    newConsistencyLevel: number,
    proposer: SignerWithAddress | Wallet
) {
    console.log(`=== Change Consistency Level INPUT ===`);
    console.log(`newConsistencyLevel: ${newConsistencyLevel}`);
    console.log(`proposer: ${proposer.address}`);
    console.log(`=============\n`);

    // @ts-ignore
    const bridgeGovernanceFactory = await hre.ethers.getContractFactory("IskraBridgeGovernance");
    const gov = bridgeGovernanceFactory.attach(process.env.BRIDGE_GOVERNANCE_CONTRACT as string);

    // @ts-ignore
    const confirmTx = await gov.connect(proposer).setConsistencyLevel(newConsistencyLevel);
    const receipt = await waitConfirmation(hre, confirmTx);

    const txId = getTxId(receipt);
    console.log("Successfully proposed to set consistency level. txId: " + txId);

    return receipt;
}

export function getTxId(receipt: any): string {
    assert(receipt.events[0].event === "Submission");
    const txIdInHex = receipt.events[0].topics[1];
    return BigNumber.from(txIdInHex).toString();
}
