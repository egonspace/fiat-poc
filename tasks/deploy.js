const { task, types } = require("hardhat/config");
const { TASK_COMPILE } = require("hardhat/builtin-tasks/task-names");

// 'deploy' 라는 이름의 새로운 task를 정의합니다.
task("deploy", "Deploys a contract with specified constructor arguments")
    // 1. 필수 위치 파라미터: 컨트랙트 이름
    .addPositionalParam("contractName", "The name of the contract to deploy")

    // 2. 선택적 가변 위치 파라미터: 생성자 인자들 (0개 이상 가능)
    .addOptionalVariadicPositionalParam(
        "constructorArgs",
        "The constructor arguments for the contract",
        [] // 기본값은 빈 배열
    )
    .setAction(async (taskArgs, hre) => {
        const { contractName, constructorArgs } = taskArgs;

        // 1. 스크립트 실행 전, 먼저 컴파일을 실행하여 최신 상태를 보장합니다.
        await hre.run(TASK_COMPILE);

        // 2. 배포할 컨트랙트의 팩토리를 가져옵니다.
        const ContractFactory = await hre.ethers.getContractFactory(contractName);

        console.log(`Deploying '${contractName}'...`);
        if (constructorArgs.length > 0) {
            console.log(`With constructor arguments: ${constructorArgs.join(", ")}`);
        }

        try {
            // 3. 팩토리의 deploy() 함수에 인자 배열을 spread operator(...)로 전달합니다.
            // Ethers.js가 숫자 문자열을 BigNumber로 자동 변환해줍니다.
            const contract = await ContractFactory.deploy(...constructorArgs, {gasPrice: 100000000001, value: taskArgs.value});

            // 4. 컨트랙트 배포가 완료될 때까지 기다립니다.
            await contract.waitForDeployment();

            const address = contract.target;
            console.log("\n✅ Contract deployed successfully!");
            console.log(`Transaction hash: ${contract.deploymentTransaction().hash}`);
            console.log(`Deployed contract address: ${address}`);

            // 배포된 주소를 반환하여 다른 task에서 활용할 수 있게 합니다.
            return contract;

        } catch (error) {
            // 컴파일은 되었으나 ABI에 없는 함수를 호출하는 등의 에러 처리
            if (error.message.includes("invalid number of arguments to constructor")) {
                console.error("\n❌ Error: Invalid number of constructor arguments.");
                console.error(`Expected: ${ContractFactory.interface.deploy.inputs.length}, Got: ${constructorArgs.length}`);
            } else {
                console.error("\n❌ An error occurred during deployment:");
                console.error(error);
            }
            process.exit(1);
        }
    });
