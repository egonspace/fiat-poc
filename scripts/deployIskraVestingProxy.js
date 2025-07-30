const {ethers, upgrades} = require("hardhat");

async function main() {
    const IskraVesting = await ethers.getContractFactory("IskraVesting");
    const proxy = await upgrades.deployBeaconProxy("0xE36C43eBF7AC4bb91556Ef8749353b1B0Fe66DB9", IskraVesting, []);
    await proxy.deployed();
    const vesting = IskraVesting.attach(proxy.address);
    console.log("IskraVesting contract deployed:", vesting.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
