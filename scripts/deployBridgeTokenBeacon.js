const {ethers} = require("hardhat");

async function main() {
    const TokenImplementation = await ethers.getContractFactory("TokenImplementation");
    const tokenImpl = await TokenImplementation.deploy();
    await tokenImpl.deployed()

    const Beacon = await ethers.getContractFactory("Beacon");
    const beacon = await Beacon.deploy(tokenImpl.address);
    await beacon.deployed()

    console.log(`Beacon contract for TokenImpl deployed: ${beacon.address}`);

    return beacon;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
