import { task, types } from "hardhat/config";
import { getSignerFromArgs } from "../utils/utils";
import { getTransparentUpgradeableProxyFactory } from "@openzeppelin/hardhat-upgrades/dist/utils";

task("deploy-beacon-proxy", "Deploy a contract from the source.")
    .addParam("attachTo", "contract name to attach to.")
    .addOptionalParam("beacon", "beacon address. if not provided, a new beacon will be deployed.")
    .addOptionalParam("amount", "amount of proxies.", 1, types.int)
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);

        console.log(`=== INPUT ===`);
        console.log(`deployer: ${signer.address}`);
        console.log(`beacon: ${taskArgs.beacon}`);
        console.log(`attachTo: ${taskArgs.attachTo}`);
        console.log(`amount: ${taskArgs.amount}`);
        console.log(`=============\n`);

        const implFactory = await hre.ethers.getContractFactory(taskArgs.attachTo);

        let beacon: string;
        if (taskArgs.beacon) {
            beacon = taskArgs.beacon;
        } else {
            const beaconContract = await hre.upgrades.deployBeacon(implFactory);
            await beaconContract.deployed();
            console.log("beacon deployed:", beaconContract.address);

            beacon = beaconContract.address;
        }

        for (let i = 0; i < taskArgs.amount; i++) {
            const proxy = await hre.upgrades.deployBeaconProxy(beacon, implFactory, []);
            await proxy.deployed();

            console.log(`proxy contract address: ${proxy.address}`);
        }
    });

task("upgrade", "Deploy a new implementation and upgrade proxy.")
    .addParam("contract", "a new implementation contract name.")
    .addParam("proxy", "proxy address.")
    .addOptionalParam(
        "implementationAddress",
        "if set, the new implementation will not be deployed but use this address"
    )
    .addOptionalParam("upgradeCall", "additional setup call function")
    .addOptionalParam("callParams", "comma separated call arguments")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const deployer = await getSignerFromArgs(taskArgs, hre);

        console.log(`=== INPUT ===`);
        console.log(`contract: ${taskArgs.contract}`);
        console.log(`proxy: ${taskArgs.proxy}`);
        console.log(`implementationAddress: ${taskArgs.implementationAddress}`);
        console.log(`upgradeCall: ${taskArgs.upgradeCall}`);
        console.log(`callParams: ${taskArgs.callParams}`);
        console.log(`deployer: ${deployer.address}`);
        console.log(`=============\n`);

        const implFactory = await hre.ethers.getContractFactory(taskArgs.contract);
        let implAddress;
        if (taskArgs.implementationAddress) {
            implAddress = taskArgs.implementationAddress;
            const proxyFactory = await getTransparentUpgradeableProxyFactory(hre, deployer);
            const proxy = proxyFactory.attach(taskArgs.proxy);
            let tx;
            if (taskArgs.upgradeCall) {
                const calldata = implFactory.interface.encodeFunctionData(
                    taskArgs.upgradeCall,
                    taskArgs.callParams.split(",")
                );
                tx = await proxy.upgradeToAndCall(implAddress, calldata);
            } else {
                tx = await proxy.upgradeTo(implAddress);
            }
            await tx.wait();
        } else {
            let calldata = undefined;
            if (taskArgs.upgradeCall) {
                let callParams = taskArgs.callParams ? taskArgs.callParams.split(",") : undefined;
                calldata = {
                    fn: taskArgs.upgradeCall,
                    args: callParams,
                };
            }
            const contract = await hre.upgrades.upgradeProxy(taskArgs.proxy, implFactory.connect(deployer), {
                call: calldata,
            });
            await contract.deployed();
            implAddress = await hre.upgrades.erc1967.getImplementationAddress(taskArgs.proxy);
        }

        console.log(`proxy: ${taskArgs.proxy}`);
        console.log(`impl: ${implAddress}`);
    });
