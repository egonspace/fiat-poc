const { task } = require("hardhat/config");

task("check-code", "Checks if code exists at a given address on the network")
    .addPositionalParam("address", "The address to check")
    .setAction(async (taskArgs, hre) => {
        const { address } = taskArgs;
        const { ethers } = hre;

        console.log(`Checking code at address: ${address} on network: ${hre.network.name}`);

        try {
            const code = await ethers.provider.getCode(address);

            if (code && code !== '0x') {
                console.log("\n✅ Code found at the address.");
                // console.log("Code:", code); // 너무 길면 주석 처리
            } else {
                console.log("\n❌ No code found at the address. It is likely an EOA or an empty address.");
            }
        } catch (error) {
            console.error("\nAn error occurred while checking the address:", error);
        }
    });