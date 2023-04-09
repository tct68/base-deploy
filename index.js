console.clear();
require('dotenv').config()
let Web3 = require('web3')
const { readFileSync, writeFileSync } = require('fs')
const web3 = new Web3("https://goerli.base.org")
const solc = require('solc')
const _ = require('lodash');
const { getRandomInt, generateName, getTicker, getRandom, logInfo } = require('./utils');
const file = readFileSync('TCTToken.sol').toString()
web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
const mainAccount = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)

const generateInput = async (file) => {
    let newFile = _.cloneDeep(file)
    const randomSupply = getRandomInt(1000000, 100000000)
    const name = generateName()
    const ticker = getTicker(name)
    newFile = newFile
        .replace('CONTRACT_NAME', name)
        .replace('CONTRACT_TICKER', ticker)
        .replace('TOTAL_SUPPLY', randomSupply)
        .replace('TCTToken', `${ticker}Token`)
    var input = {
        language: "Solidity",
        sources: {
            [`${ticker}Token.sol`]: {
                content: newFile,
            },
        },

        settings: {
            outputSelection: {
                "*": {
                    "*": ["*"],
                },
            },
        },
    };

    return [ticker, input]
}

const runAsync = async (count) => {
    const accounts = []
    for (let index = 0; index < count; index++) {
        const [ticker, input] = await generateInput(file)
        const name = `${ticker}Token`
        const fileName = `${name}.sol`

        var output = JSON.parse(solc.compile(JSON.stringify(input)));
        const ABI = output.contracts[fileName][name].abi;
        const bytecode = output.contracts[fileName][name].evm.bytecode.object;
        const contract = new web3.eth.Contract(ABI)

        logInfo(`Creating new account`)
        const newAccount = web3.eth.accounts.create()
        const { address, privateKey } = newAccount

        const amount = getRandom(0.02, 0.09).toFixed(3)
        const amountWei = web3.utils.toWei(`${amount}`, 'ether')

        logInfo(`Sending ${amount}ETH to address: ${address}`)

        // create the transaction object
        const transactionObject = {
            from: mainAccount.address,
            to: address,
            value: amountWei,
            gas: 200000
        };
        // sign the transaction with the sender's private key
        const signedTransaction = await mainAccount.signTransaction(transactionObject);

        // send the signed transaction to the network
        const transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        if (transactionReceipt) {
            logInfo('Transaction hash:' + transactionReceipt.transactionHash);
            web3.eth.accounts.wallet.add(privateKey);
            logInfo(`Deploying contract`)

            const deploy = contract.deploy({ data: bytecode })
            var block = await web3.eth.getBlock("latest");
            var gasLimit = Math.round(block.gasLimit / block.transactions.length);
            const deployedContract = await deploy.send({ from: newAccount.address, gas: gasLimit })
            const contractAdress = deployedContract._address;
            accounts.push({ address, privateKey, contractAdress });
        }
    }

    writeFileSync('accounts.json', JSON.stringify(accounts, null, 2))
}

runAsync(1).then(x => logInfo('Done')).catch(x => logInfo(x.message))