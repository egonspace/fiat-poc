const {ethers, upgrades} = require("hardhat");

async function main() {
    const IskraVesting = await ethers.getContractFactory("IskraVesting");
    const beacon = await upgrades.deployBeacon(IskraVesting);
    await beacon.deployed();
    console.log("beacon deployed:", beacon.address);
    const proxy = await upgrades.deployBeaconProxy(beacon, IskraVesting, []);
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
