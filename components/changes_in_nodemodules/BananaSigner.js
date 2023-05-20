"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BananaSigner = void 0;
const ethers_1 = require("ethers");
const WebAuthnContext_1 = require("./WebAuthnContext");
const sdk_1 = require("@account-abstraction/sdk");
class BananaSigner extends sdk_1.ERC4337EthersSigner {
    constructor(config, originalSigner, erc4337provider, httpRpcClient, smartAccountAPI, provider, publicKey) {
        super(config, originalSigner, erc4337provider, httpRpcClient, smartAccountAPI);
        this.config = config;
        this.originalSigner = originalSigner;
        this.erc4337provider = erc4337provider;
        this.httpRpcClient = httpRpcClient;
        this.smartAccountAPI = smartAccountAPI;
        this.jsonRpcProvider = provider;
        this.publicKey = publicKey;
        this.encodedId = publicKey.encodedId;
        this.getAddress();
    }
    // need to do some changes in it

    async sendTransaction(transaction) {
        console.log("sendTransaction txxn", transaction)
        const tx = await this.populateTransaction(transaction);
        await this.verifyAllNecessaryFields(tx);
        console.log("sendTransaction tx", tx)
        let userOperation = await this.smartAccountAPI.createUnsignedUserOp({
            target: tx.to ?? "",
            data: tx.data?.toString() ?? "",
            value: tx.value,
            gasLimit: tx.gasLimit,
        });
        console.log("sendTransaction userOperation", userOperation)
        let processStatus = true;
        while (processStatus) {
            let minGasRequired = ethers_1.ethers.BigNumber.from(userOperation?.callGasLimit)
                .add(ethers_1.ethers.BigNumber.from(userOperation?.verificationGasLimit))
                .add(ethers_1.ethers.BigNumber.from(userOperation?.callGasLimit));
            let currentGasPrice = await this.jsonRpcProvider.getGasPrice();
            let minBalanceRequired = minGasRequired.mul(currentGasPrice);
            //@ts-ignore
            let userBalance = await this.jsonRpcProvider.getBalance(userOperation?.sender);
            if (userBalance.lt(minBalanceRequired)) {
                throw new Error("ERROR: Insufficient balance in Wallet");
            }
            userOperation.preVerificationGas = ethers_1.ethers.BigNumber.from(await userOperation.preVerificationGas).add(5000);
            userOperation.verificationGasLimit = 1.5e6;
            const message = await this.smartAccountAPI.getUserOpHash(userOperation);
            const { newUserOp, process } = await this.signUserOp(userOperation, message, this.encodedId);
            if (process === "success") {
                userOperation = newUserOp;
                processStatus = false;
            }
        }
        const transactionResponse = await this.erc4337provider.constructUserOpTransactionResponse(userOperation);
        try {
            await this.httpRpcClient.sendUserOpToBundler(userOperation);
        }
        catch (error) {
            // console.error('sendUserOpToBundler failed', error)
            throw this.unwrapError(error);
        }
        // TODO: handle errors - transaction that is "rejected" by bundler is _not likely_ to ever resolve its "wait()"
        return transactionResponse;
    }
    async signBananaMessage(message) {
        const messageHash = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.solidityPack(["string"], [message]));
        let process = true;
        let userOpWithSignatureAndMessage;
        try {
            while (process) {
                userOpWithSignatureAndMessage = await (0, WebAuthnContext_1.verifyFingerprint)({}, messageHash, this.encodedId);
                if (userOpWithSignatureAndMessage.process === "success") {
                    process = false;
                }
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
        const signatureAndMessage = userOpWithSignatureAndMessage.newUserOp.signature;
        const abi = ethers_1.ethers.utils.defaultAbiCoder;
        const decoded = abi.decode(["uint256", "uint256", "uint256"], signatureAndMessage);
        const signedMessage = decoded[2];
        const rHex = decoded[0].toHexString();
        const sHex = decoded[1].toHexString();
        const finalSignature = rHex + sHex.slice(2);
        /**
         * Note:
         * the `message` is signed using secp256r1 instead of secp256k1, hence to verify
         * signedMessage we cannot use ecrecover!
         */
        // return (finalSignature + signedMessage.toHexString()).toString();
        return {
            messageSigned: signedMessage.toHexString(),
            signature: finalSignature,
        };
    }
    async signUserOp(userOp, reqId, encodedId) {
        const signedUserOp = await (0, WebAuthnContext_1.verifyFingerprint)(userOp, reqId, encodedId);
        return signedUserOp;
    }
}
exports.BananaSigner = BananaSigner;
//# sourceMappingURL=BananaSigner.js.map