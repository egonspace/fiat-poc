const { web3 } = require("@openzeppelin/test-helpers/src/setup");

export function sleep(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

export function hexToBytes32(hex: string) {
    return web3.utils.padLeft(hex, 64).toLowerCase();
}
