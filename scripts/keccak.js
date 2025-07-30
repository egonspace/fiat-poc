const Web3 = require('web3');

// web3.utils.keccak256는 문자열을 해싱하는 가장 간단한 방법입니다.
const hash = Web3.utils.keccak256("blockRewardDistribution");

console.log(hash);
