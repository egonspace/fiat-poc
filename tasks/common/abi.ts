import { subtask, task } from "hardhat/config";
import { FormatTypes, Interface } from "@ethersproject/abi";
import { BigNumber } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

task("abi:find-function", "find function by sig")
    .addPositionalParam("sig", "function sig")
    .setAction(async (taskArgs, hre) => {
        console.log(`=== INPUT ===`);
        console.log(`sig: ${taskArgs.sig}`);
        console.log(`=============\n`);

        let functionWithContract = await hre.run("abi:find-function-by-sig", taskArgs);

        const artifact = await hre.artifacts.readArtifact(functionWithContract.contract);
        const iface = new Interface(artifact.abi);
        const functionFragment = iface.getFunction(functionWithContract.function);

        console.log(`contract: ${functionWithContract.contract}`);
        console.log(`function: ${functionFragment.format(FormatTypes.full).slice(9)}`);
    });

task("abi:find-event", "find event by topic0")
    .addPositionalParam("topic", "topic 0")
    .setAction(async (taskArgs, hre) => {
        console.log(`=== INPUT ===`);
        console.log(`topic: ${taskArgs.topic}`);
        console.log(`=============\n`);

        let eventWithContract = await hre.run("abi:find-event-by-topic", taskArgs);

        const artifact = await hre.artifacts.readArtifact(eventWithContract.contract);
        const iface = new Interface(artifact.abi);
        const eventFragment = iface.getEvent(eventWithContract.event);

        console.log(`contract: ${eventWithContract.contract}`);
        console.log(`event: ${eventFragment.format(FormatTypes.full).slice(6)}`);
    });

task("abi:decode-function-data", "decode function data")
    .addPositionalParam("data", "data with function sig")
    .setAction(async (taskArgs, hre) => {
        console.log(`=== INPUT ===`);
        console.log(`data: ${taskArgs.data}`);
        console.log(`=============\n`);

        let functionWithContract = await hre.run("abi:find-function-by-sig", { sig: taskArgs.data.substring(0, 10) });
        const artifact = await hre.artifacts.readArtifact(functionWithContract.contract);
        const iface = new Interface(artifact.abi);
        const functionFragment = iface.getFunction(functionWithContract.function);
        const decoded = iface.decodeFunctionData(functionFragment, taskArgs.data);
        console.log("function: " + functionWithContract.function);
        console.log("data:");
        printResult("", decoded, 0);
    });

task("abi:decode", "decode data")
    .addPositionalParam("types", "comma separated types")
    .addPositionalParam("data", "data")
    .setAction(async (taskArgs, hre) => {
        console.log(`=== INPUT ===`);
        console.log(`types: ${taskArgs.types}`);
        console.log(`data: ${taskArgs.data}`);
        console.log(`=============\n`);

        const decoded = defaultAbiCoder.decode(eval(taskArgs.types), taskArgs.data);
        printResult("", decoded, 0);
    });

subtask("abi:find-function-by-sig", "find function by sig")
    .addPositionalParam("sig", "function sig")
    .setAction(async (taskArgs, hre) => {
        for (const name of await hre.artifacts.getAllFullyQualifiedNames()) {
            const artifact = await hre.artifacts.readArtifact(name);
            const iface = new Interface(artifact.abi);
            for (let fragment of Object.keys(iface.functions)) {
                const sig = iface.getSighash(fragment);
                if (sig === taskArgs.sig) {
                    return { contract: name, function: fragment };
                }
            }
        }

        throw Error(`no matching function with '${taskArgs.sig}'`);
    });

subtask("abi:find-event-by-topic", "find event by topic0")
    .addPositionalParam("topic", "topic0")
    .setAction(async (taskArgs, hre) => {
        for (const name of await hre.artifacts.getAllFullyQualifiedNames()) {
            const artifact = await hre.artifacts.readArtifact(name);
            const iface = new Interface(artifact.abi);
            for (let fragment of Object.keys(iface.events)) {
                const eventTopic = iface.getEventTopic(fragment);
                if (eventTopic === taskArgs.topic) {
                    return { contract: name, event: fragment };
                }
            }
        }

        throw Error(`no matching event with '${taskArgs.topic}'`);
    });

export function printResult(name: string, item: any, indent: number) {
    if (Array.isArray(item)) {
        if (item.length > 0) {
            if (name) {
                console.log("  ".repeat(indent) + name + ": [");
            } else {
                console.log("  ".repeat(indent) + "[");
            }

            for (let key of Object.keys(item).slice(-item.length)) {
                printResult(key, item[key as keyof typeof item], indent + 1);
            }
            console.log("  ".repeat(indent) + "]");
        } else {
            console.log("  ".repeat(indent) + name + ": []");
        }
    } else {
        let value = item;
        if (item instanceof BigNumber) {
            value = item.toString();
            if (value.length > 18) {
                value = value.substring(0, value.length - 18) + "_" + value.substring(value.length - 18);
            }
        }
        if (name) {
            console.log("  ".repeat(indent) + name + ": " + value);
        } else {
            console.log("  ".repeat(indent) + value);
        }
    }
}
