import { HardhatRuntimeEnvironment } from "hardhat/types";
import { task } from "hardhat/config";
import { Table } from "console-table-printer";
import { string } from "hardhat/internal/core/params/argumentTypes";

task("storage-layout", "Prints the storage layout")
    .addParam("contract", "contract name or fully qualified name([SOURCE_PATH]:[CONTRACT_NAME])", undefined, string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const artifact = await hre.artifacts.readArtifact(taskArgs.contract);
        const buildInfo = await hre.artifacts.getBuildInfo(`${artifact.sourceName}:${artifact.contractName}`);

        // @ts-ignore
        const storageLayout = buildInfo?.output.contracts[artifact.sourceName][artifact.contractName].storageLayout;

        const table = new Table({
            columns: [
                { name: "variable", alignment: "center" },
                { name: "type", alignment: "center" },
                { name: "num_bytes", title: "num of bytes", alignment: "center" },
                { name: "slot_from", title: "slot(from)", alignment: "center" },
                { name: "slot_to", title: "slot(to)", alignment: "center" },
                { name: "offset", alignment: "center" },
                { name: "num_slot", title: "num of slot", alignment: "center" },
            ],
        });

        for (const variable of storageLayout.storage) {
            table.addRow({
                variable: variable.label,
                slot_from: variable.slot,
                offset: variable.offset,
                slot_to: Number(variable.slot) + Math.ceil(storageLayout.types[variable.type].numberOfBytes / 32) - 1,
                num_slot: Math.ceil(storageLayout.types[variable.type].numberOfBytes / 32),
                num_bytes: storageLayout.types[variable.type].numberOfBytes,
                type: storageLayout.types[variable.type].label,
            });
        }

        table.printTable();
    });
