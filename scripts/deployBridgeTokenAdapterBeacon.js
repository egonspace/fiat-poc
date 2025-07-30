const {ethers} = require("hardhat");

async function main() {
    const TokenAdapterImplementation = await ethers.getContractFactory("TokenAdapterImplementation");
    const tokenAdapterImpl = await TokenAdapterImplementation.deploy();
    await tokenAdapterImpl.deployed()

    const Beacon = await ethers.getContractFactory("Beacon");
    const beacon = await Beacon.deploy(tokenAdapterImpl.address);
    await beacon.deployed()

    console.log(`Beacon contract for TokenAdapterImpl deployed: ${beacon.address}`);

    return beacon;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
