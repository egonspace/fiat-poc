const { task } = require("hardhat/config");
const { Contract } = require("ethers");
/**
 * 복잡한 결과를 보기 좋게 출력하기 위한 헬퍼 함수
 * BigInt, 배열, 구조체(Result 객체)를 재귀적으로 처리합니다.
 */
function printResult(result) {
    // BigInt는 따옴표 없는 숫자로 출력
    if (typeof result === 'bigint') {
        console.log(result.toString());
        return;
    }

    // 배열인 경우 각 요소를 재귀적으로 출력
    if (Array.isArray(result)) {
        console.log("[");
        result.forEach((item, index) => {
            process.stdout.write(`  ${index}: `);
            printResult(item);
        });
        console.log("]");
        return;
    }

    // Ethers.js의 Result 객체(구조체 반환 시) 처리
    // 일반 배열 속성과 이름있는 속성을 모두 가짐
    if (typeof result === 'object' && result !== null && result.constructor.name === 'Result') {
        const plainObject = result.toObject();
        console.log("{");
        Object.keys(plainObject).forEach((key) => {
            // 숫자 인덱스는 건너뛰어 중복 출력을 방지
            if (isNaN(parseInt(key))) {
                process.stdout.write(`  ${key}: `);
                printResult(plainObject[key]);
            }
        });
        console.log("}");
        return;
    }

    // 그 외의 경우(string, number, boolean) 그대로 출력
    console.log(result);
}


task("call", "Calls a read-only or state-changing contract function")
    .addPositionalParam("contractAddress", "The address of the target contract")
    .addPositionalParam("contractName", "The name of the contract (for fetching ABI)")
    .addPositionalParam("functionName", "The name of the function to call")
    .addOptionalVariadicPositionalParam("args", "The arguments for the function", [])
    .setAction(async (taskArgs, hre) => {
        const { contractAddress, contractName, functionName, args } = taskArgs;
        const { ethers } = hre;

        console.log(`--- Calling Function ---`);
        console.log(`  Network:       ${hre.network.name}`);
        console.log(`  Contract:      ${contractName}`);
        console.log(`  Address:       ${contractAddress}`);
        console.log(`  Function:      ${functionName}`);
        console.log(`  Arguments:     ${args.join(", ") || "None"}`);
        console.log(`------------------------\n`);

        const artifact = await hre.artifacts.readArtifact(contractName);
        const contractInterface = new ethers.Interface(artifact.abi);
        const functionFragment = contractInterface.getFunction(functionName);

        if (!functionFragment) {
            console.error(`\n❌ Error: Function '${functionName}' not found in contract '${contractName}'.`);
            return;
        }

        const signer = await ethers.provider.getSigner();
        const contract = new Contract(contractAddress, artifact.abi, signer);

        // 핵심 분기 로직: 함수의 stateMutability 확인
        const isReadOnly = functionFragment.stateMutability === 'view' || functionFragment.stateMutability === 'pure';

        try {
            if (isReadOnly) {
                // --- 읽기 전용 함수 호출 (Call) ---
                console.log("Executing as a read-only call (no transaction cost)...");

                // contract.myFunction()과 동일. 결과가 바로 반환됨.
                const result = await contract[functionName](...args);

                console.log("\n✅ Call successful! Result:");
                printResult(result);

            } else {
                // --- 상태 변경 함수 호출 (Transaction) ---
                console.log("Executing as a state-changing transaction...");

                // tx 객체가 반환됨
                const tx = await contract[functionName](...args, {gasPrice: 100000000001, value: taskArgs.value});

                console.log(`\n▶️ Transaction sent! Hash: ${tx.hash}`);
                console.log("Waiting for transaction to be mined...");

                // 트랜잭션이 채굴될 때까지 기다립니다.
                const receipt = await tx.wait();

                console.log("\n✅ Transaction mined successfully!");
                console.log(`   - Block Number: ${receipt.blockNumber}`);
                console.log(`   - Gas Used: ${receipt.gasUsed.toString()}`);
            }
        } catch (error) {
            console.error("\n❌ An error occurred:");
            // Ethers.js가 제공하는 상세 에러 메시지(revert reason 등)를 출력
            console.error(error.reason || error.message);
        }
    });