"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SmartAccount_smartAccountConfig;
Object.defineProperty(exports, "__esModule", { value: true });
const core_types_1 = require("@biconomy/core-types");
const node_client_1 = __importDefault(require("@biconomy/node-client"));
const providers_1 = require("@ethersproject/providers");
const relayer_1 = require("@biconomy/relayer");
const _ = __importStar(require("lodash"));
const transactions_1 = __importStar(require("@biconomy/transactions"));
const events_1 = __importDefault(require("events"));
const SmartAccountSigner_1 = require("./signers/SmartAccountSigner");
const config_1 = require("./config");
// AA
const account_abstraction_1 = require("@biconomy/account-abstraction");
const common_1 = require("@biconomy/common");
const ethers_1 = require("ethers");
// Create an instance of Smart Account with multi-chain support.
class SmartAccount extends events_1.default {
    // WIP
    // Could expose recommended provider classes through the SDK
    /**
     * Constructor for the Smart Account. If config is not provided it makes Smart Account available using default configuration
     * If you wish to use your own backend server and relayer service, pass the URLs here
     */
    constructor(signerOrProvider, config) {
        var _a;
        super();
        // By default latest version
        this.DEFAULT_VERSION = '1.0.0';
        // Optional config to initialise instance of Smart Account. One can provide main active chain and only limited chains they need to be on.
        _SmartAccount_smartAccountConfig.set(this, void 0);
        const env = (_a = config === null || config === void 0 ? void 0 : config.environment) !== null && _a !== void 0 ? _a : core_types_1.Environments.PROD;
        if (!env || env === core_types_1.Environments.PROD) {
            common_1.Logger.log('Client connected to production environment');
            __classPrivateFieldSet(this, _SmartAccount_smartAccountConfig, { ...config_1.ProductionConfig }, "f");
        }
        else if (env && env === core_types_1.Environments.DEV) {
            common_1.Logger.log('Client connected to testing environment');
            __classPrivateFieldSet(this, _SmartAccount_smartAccountConfig, { ...config_1.DevelopmentConfig }, "f");
        }
        else {
            common_1.Logger.log('Client connected to STAGING');
            __classPrivateFieldSet(this, _SmartAccount_smartAccountConfig, { ...config_1.StagingConfig }, "f");
        }
        if (!__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId) {
            throw Error('active chain needs to be specified');
        }
        if (__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").supportedNetworksIds.length == 0)
            __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").supportedNetworksIds = [__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId];
        let networkConfig = __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").networkConfig;
        if (config) {
            const customNetworkConfig = config.networkConfig || [];
            common_1.Logger.log('Custom network config', customNetworkConfig);
            if (customNetworkConfig.length !== 0) {
                const mergedNetworkConfig = _.merge(_.keyBy(customNetworkConfig, 'chainId'), _.keyBy(networkConfig, 'chainId'));
                networkConfig = _.values(mergedNetworkConfig);
            }
            common_1.Logger.log('Merged network config values', networkConfig);
            __classPrivateFieldSet(this, _SmartAccount_smartAccountConfig, { ...__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f"), ...config }, "f");
            __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").networkConfig = networkConfig;
        }
        this.supportedNetworkIds = __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").supportedNetworksIds;
        if (ethers_1.Signer.isSigner(signerOrProvider)) {
            this.signer = signerOrProvider;
        }
        else if (providers_1.Provider.isProvider(signerOrProvider)) {
            this.signer = new SmartAccountSigner_1.SmartAccountSigner(signerOrProvider);
        }
        else {
            common_1.Logger.error('signer or provider is not valid');
        }
        this.nodeClient = new node_client_1.default({ txServiceUrl: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").backendUrl });
        this.relayer = new relayer_1.RestRelayer({
            url: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").relayerUrl,
            socketServerUrl: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").socketServerUrl
        });
        this.aaProvider = {};
        this.chainConfig = [];
    }
    getConfig() {
        return __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f");
    }
    // Changes if we make change in nature of smart account signer
    getsigner() {
        return this.signer;
    }
    getSmartAccountAPI(chainId) {
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        const aaSigner = this.aaProvider[chainId].getSigner();
        return aaSigner.smartAccountAPI;
    }
    getProviderUrl(network) {
        var _a;
        common_1.Logger.log('after init smartAccountConfig.networkConfig', __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").networkConfig);
        const networkConfig = __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").networkConfig;
        common_1.Logger.log(`networkConfig state is`, networkConfig);
        let providerUrl = ((_a = networkConfig.find((element) => element.chainId === network.chainId)) === null || _a === void 0 ? void 0 : _a.providerUrl) || '';
        common_1.Logger.log('provider url in unioned network config ', providerUrl);
        if (!providerUrl) {
            common_1.Logger.log('using rpc url from chain seed ', network.providerUrl);
            providerUrl = network.providerUrl;
        }
        return providerUrl;
    }
    async getNetworkConfigValues(chainId) {
        var _a;
        const networkConfigValues = await ((_a = __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").networkConfig) === null || _a === void 0 ? void 0 : _a.find((element) => element.chainId === chainId));
        if (!networkConfigValues)
            throw new Error('Could not get network config values');
        return networkConfigValues;
    }
    async initializeAtChain(chainId) {
        let exist;
        try {
            exist = this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION].getContract();
        }
        catch (err) {
            common_1.Logger.log('Chain config contract not loaded ', chainId);
        }
        if (!exist) {
            const network = this.chainConfig.find((element) => element.chainId === chainId);
            if (!network)
                return;
            const providerUrl = this.getProviderUrl(network);
            common_1.Logger.log('init at chain', chainId);
            const walletInfo = await this.getAddress({
                index: 0,
                chainId: network.chainId,
                version: this.DEFAULT_VERSION
            });
            this.address = walletInfo.smartAccountAddress;
            common_1.Logger.log('smart wallet address is ', this.address);
            const readProvider = new ethers_1.ethers.providers.JsonRpcProvider(providerUrl);
            this.provider = readProvider;
            this.contractUtils.initializeContracts(this.signer, readProvider, walletInfo, network);
            const clientConfig = await this.getNetworkConfigValues(network.chainId);
            this.signingService = new account_abstraction_1.FallbackGasTankAPI(__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").biconomySigningServiceUrl || '', clientConfig.dappAPIKey || '');
            this.fallbackRelayer = new relayer_1.FallbackRelayer({
                dappAPIKey: clientConfig.dappAPIKey || '',
                url: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").relayerUrl,
                relayerServiceUrl: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").socketServerUrl
            });
            this.aaProvider[network.chainId] = await (0, account_abstraction_1.newProvider)(new ethers_1.ethers.providers.JsonRpcProvider(providerUrl), {
                dappAPIKey: clientConfig.dappAPIKey || '',
                // Review: default false
                // could come from global set config or method level when we implement fee mode
                strictSponsorshipMode: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").strictSponsorshipMode || false,
                biconomySigningServiceUrl: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").biconomySigningServiceUrl || '',
                socketServerUrl: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").socketServerUrl || '',
                entryPointAddress: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").entryPointAddress
                    ? __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").entryPointAddress
                    : network.entryPoint[network.entryPoint.length - 1].address,
                bundlerUrl: clientConfig.bundlerUrl || __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").bundlerUrl || '',
                chainId: network.chainId,
                customPaymasterAPI: clientConfig.customPaymasterAPI,
                txServiceUrl: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").backendUrl
            }, this.signer, this.address, network.wallet[network.wallet.length - 1].address, network.fallBackHandler[network.fallBackHandler.length - 1].address, network.walletFactory[network.walletFactory.length - 1].address);
        }
    }
    async init() {
        try {
            this.owner = await this.signer.getAddress();
        }
        catch (error) {
            throw new Error('Invalid Provider, cant get signer address');
        }
        this.setActiveChain(__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId);
        const chainConfig = (await this.nodeClient.getAllSupportedChains()).data;
        this.contractUtils = new transactions_1.ContractUtils(chainConfig);
        for (let index = 0; index < __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").supportedNetworksIds.length; index++) {
            const network = chainConfig.find((element) => element.chainId === __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").supportedNetworksIds[index]);
            if (network) {
                this.chainConfig.push(network);
            }
        }
        await this.initializeAtChain(__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId);
        this.transactionManager = new transactions_1.default(this.contractUtils.getSmartAccountState());
        await this.transactionManager.initialize(this.relayer, this.nodeClient, this.contractUtils);
        return this;
    }
    // WIP
    // Optional methods for connecting paymaster
    // Optional methods for connecting another bundler
    async sendFallbackTransaction(transactionDto) {
        var _a;
        let { version, chainId } = transactionDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        version = version ? version : this.DEFAULT_VERSION;
        await this.initializeAtChain(chainId);
        // create IWalletTransaction instance
        const transaction = await this.createTransaction(transactionDto);
        // create instance of SmartWallet contracts
        const walletContract = this.contractUtils.attachWalletContract(chainId, this.DEFAULT_VERSION, this.address);
        const signature = await this.signUserPaidTransaction({
            version: this.DEFAULT_VERSION,
            tx: transaction,
            chainId,
            signer: this.signer
        });
        const refundInfo = {
            baseGas: transaction.baseGas,
            gasPrice: transaction.gasPrice,
            tokenGasPriceFactor: transaction.tokenGasPriceFactor,
            gasToken: transaction.gasToken,
            refundReceiver: transaction.refundReceiver
        };
        const execTransactionData = await walletContract.interface.encodeFunctionData('execTransaction', [transaction, refundInfo, signature]);
        // create instance of fallbackGasTank contracts to get nonce
        const fallbackGasTank = this.contractUtils.fallbackGasTankContract[chainId][version].getContract();
        const gasTankNonce = await fallbackGasTank.getNonce(this.address);
        const isDeployed = await this.contractUtils.isDeployed(chainId, this.address);
        // dappIdentifier and signature will be added by signing service
        const fallbackUserOp = {
            sender: this.address,
            target: this.address,
            nonce: gasTankNonce,
            callData: execTransactionData || '',
            callGasLimit: ethers_1.BigNumber.from(800000),
            dappIdentifier: '',
            signature: ''
        };
        if (!isDeployed) {
            const network = this.chainConfig.find((element) => element.chainId === chainId);
            if (!network)
                throw new Error('No Network Found for given chainid');
            const { multiSendCall, walletFactory } = this.getSmartAccountContext(chainId);
            const deployWalletEncodedData = await (0, common_1.deployCounterFactualEncodedData)({
                chainId: (_a = (await this.provider.getNetwork())) === null || _a === void 0 ? void 0 : _a.chainId,
                owner: await this.owner,
                txServiceUrl: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").backendUrl,
                index: 0
            });
            const txs = [
                {
                    to: walletFactory.getAddress(),
                    value: 0,
                    data: deployWalletEncodedData,
                    operation: 0
                },
                {
                    to: this.address,
                    value: 0,
                    data: execTransactionData || '',
                    operation: 0
                }
            ];
            const txnData = multiSendCall
                .getInterface()
                .encodeFunctionData('multiSend', [(0, transactions_1.encodeMultiSend)(txs)]);
            common_1.Logger.log('txnData', txnData);
            // update fallbackUserOp with target and multiSend call data
            fallbackUserOp.target = multiSendCall.getAddress();
            fallbackUserOp.callData = txnData;
        }
        common_1.Logger.log('fallbackUserOp before', fallbackUserOp);
        // send fallback user operation to signing service to get signature and dappIdentifier
        const signingServiceResponse = await this.signingService.getDappIdentifierAndSign(fallbackUserOp);
        fallbackUserOp.dappIdentifier = signingServiceResponse.dappIdentifier;
        fallbackUserOp.signature = signingServiceResponse.signature;
        common_1.Logger.log('fallbackUserOp after', fallbackUserOp);
        const handleFallBackData = await fallbackGasTank.populateTransaction.handleFallbackUserOp(fallbackUserOp);
        const rawTrx = {
            to: fallbackGasTank.address,
            data: handleFallBackData.data,
            value: 0,
            chainId: chainId
        };
        const signedTx = {
            rawTx: rawTrx,
            tx: transaction
        };
        const state = await this.contractUtils.getSmartAccountState();
        const relayTrx = {
            signedTx,
            config: state,
            context: this.getSmartAccountContext(chainId)
        };
        const relayResponse = await this.fallbackRelayer.relay(relayTrx, this);
        return relayResponse;
    }
    /**
     * @description this function will make complete transaction data for updateImplementationTrx
     * @param chainId
     * @returns
     */
    async updateImplementationTrx(chainId) {
        const isWalletDeployed = await this.isDeployed(chainId);
        if (isWalletDeployed) {
            const chainInfo = this.chainConfig.find((element) => element.chainId === chainId);
            if (!chainInfo) {
                throw new Error('No ChainInfo Found');
            }
            const latestImpAddress = chainInfo.wallet[chainInfo.wallet.length - 1].address;
            const walletsImpAddress = await this.contractUtils.getSmartAccountState()
                .implementationAddress;
            if (latestImpAddress !== walletsImpAddress) {
                const updateImplementationCallData = await (0, common_1.updateImplementationEncodedData)(latestImpAddress);
                return { to: this.address, value: ethers_1.BigNumber.from(0), data: updateImplementationCallData };
            }
        }
        return { to: this.address, value: 0, data: '0x' };
    }
    /**
     * @description this function will make complete transaction data for updateFallBackHandlerTrx
     * @param chainId
     * @returns
     */
    async updateFallBackHandlerTrx(chainId) {
        const isWalletDeployed = await this.isDeployed(chainId);
        if (isWalletDeployed) {
            const chainInfo = this.chainConfig.find((element) => element.chainId === chainId);
            if (!chainInfo) {
                throw new Error('No ChainInfo Found');
            }
            const latestfallBackHandlerAddress = chainInfo.fallBackHandler[chainInfo.fallBackHandler.length - 1].address;
            const walletInfo = await this.contractUtils.getSmartAccountState();
            const fallBackHandlerAddress = walletInfo.fallbackHandlerAddress;
            if (latestfallBackHandlerAddress !== fallBackHandlerAddress) {
                const fallbackHandlerCallData = await (0, common_1.fallbackHandlerEncodedData)(latestfallBackHandlerAddress);
                return { to: this.address, value: ethers_1.BigNumber.from(0), data: fallbackHandlerCallData };
            }
        }
        return { to: this.address, value: 0, data: '0x' };
    }
    /**
     * @description this function will let dapp to update Base wallet Implemenation to Latest
     * @returns
     */
    async updateFallbackHandler() {
        const chainId = __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        const fallbackHandlerTrx = await this.updateFallBackHandlerTrx(__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId);
        await this.initializeAtChain(chainId);
        const aaSigner = this.aaProvider[chainId].getSigner();
        const response = await aaSigner.sendTransaction(fallbackHandlerTrx, false, {}, this);
        return response;
    }
    /**
     * @description this function will let dapp to update FallBackHandler to Latest
     * @returns
     */
    async updateImplementation() {
        const chainId = __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        const updateImplTrx = await this.updateImplementationTrx(__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId);
        await this.initializeAtChain(chainId);
        const aaSigner = this.aaProvider[chainId].getSigner();
        const response = await aaSigner.sendTransaction(updateImplTrx, false, {}, this);
        return response;
    }
    // TODO: single method. can have types as aa-4337 and non-4337. can have fee modes based on types
    async sendTransaction(transactionDto // TODO: revise DTO as per above
    // isUpdateImpTrx?: Boolean
    ) {
        console.log('sendTransaction txn', transactionDto);
        let isFallbackEnabled = false;
        try {
            const { data } = await this.nodeClient.isFallbackEnabled();
            isFallbackEnabled = data.enable_fallback_flow;
            common_1.Logger.log('isFallbackEnabled', data.enable_fallback_flow);
        }
        catch (error) {
            console.error('isFallbackEnabled', error);
        }
        if (isFallbackEnabled) {
            return this.sendFallbackTransaction(transactionDto);
        }
        let { chainId } = transactionDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        // version = version ? version : this.DEFAULT_VERSION
        const aaSigner = this.aaProvider[chainId].getSigner();
        await this.initializeAtChain(chainId);
        const batchTrx = [];
        const updateImplTrx = await this.updateImplementationTrx(chainId);
        let response;
        // this case will run when user is making any normal trx and we have detected that the wallet is
        // not pointing to latest implementation so will merge user's trx with update Implementation Trx and
        // Batch both trx
        //     if ( updateImplTrx.data != '0x' && !isUpdateImpTrx){
        if (updateImplTrx.data != '0x') {
            console.log('updateImplTrx', updateImplTrx);
            batchTrx.push(updateImplTrx, transactionDto.transaction);
            response = this.sendTransactionBatch({
                transactions: batchTrx,
                paymasterServiceData: transactionDto.paymasterServiceData
            });
        }
        else {
            console.log('transactionDto.transaction', transactionDto.transaction);
            // this case { if ( isUpdateImpTrx ) } will work only when user specifically wanted to just update Base wallet Implementation
            // if ( isUpdateImpTrx )
            // transactionDto.transaction = updateImplTrx
            console.log("aasigner", aaSigner);
            response = await aaSigner.sendTransaction(transactionDto.transaction);
        }
        return response;
    }
    async sendTransactionBatch(transactionBatchDto) {
        let { chainId } = transactionBatchDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        const { transactions, paymasterServiceData } = transactionBatchDto;
        const aaSigner = this.aaProvider[chainId].getSigner();
        const updateImplTrx = await this.updateImplementationTrx(chainId);
        // whatever batch trx user make. will ensure to update Base wallet implementation if needed
        if (updateImplTrx.data != '0x') {
            transactions.unshift(updateImplTrx);
        }
        const response = await aaSigner.sendTransactionBatch(transactions, paymasterServiceData, this);
        return response;
    }
    // Only to deploy wallet using connected paymaster
    async deployWalletUsingPaymaster() {
        const aaSigner = this.aaProvider[__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId].getSigner();
        const transaction = {
            to: core_types_1.ZERO_ADDRESS,
            data: '0x'
        };
        const response = await aaSigner.sendTransaction(transaction, true, {}, this);
        return response;
    }
    /**
     *
     * @param smartAccountVersion
     * @description // set wallet version to be able to interact with different deployed versions
     */
    async setSmartAccountVersion(smartAccountVersion) {
        this.DEFAULT_VERSION = smartAccountVersion;
        this.address = (await this.getAddress({
            index: 0,
            chainId: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId,
            version: this.DEFAULT_VERSION
        })).smartAccountAddress;
        return this;
    }
    async getAlltokenBalances(balancesDto) {
        return this.nodeClient.getAlltokenBalances(balancesDto);
    }
    async getTotalBalanceInUsd(balancesDto) {
        return this.nodeClient.getTotalBalanceInUsd(balancesDto);
    }
    async getSmartAccountsByOwner(smartAccountByOwnerDto) {
        return this.nodeClient.getSmartAccountsByOwner(smartAccountByOwnerDto);
    }
    async getTransactionByAddress(chainId, address) {
        return this.nodeClient.getTransactionByAddress(chainId, address);
    }
    async getTransactionByHash(txHash) {
        return this.nodeClient.getTransactionByHash(txHash);
    }
    // Assigns transaction relayer to this smart wallet instance
    /**
     * Assigns transaction relayer to this smart wallet instance
     * @notice Assumption is that relayer will accept calls for all supported chains
     * @param relayer Relayer client to be associated with this smart account
     * @returns this/self
     */
    async setRelayer(relayer) {
        if (relayer === undefined)
            return this;
        this.relayer = relayer;
        //If we end up maintaining relayer instance on this then it should update all transaction managers
        //await this.transactionManager.setRelayer(relayer)
        return this;
    }
    /**
     * Allows to change default active chain of the Smart Account
     * @param chainId
     * @returns self/this
     */
    async setActiveChain(chainId) {
        __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId = chainId;
        await this.initializeAtChain(__classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId);
        return this;
    }
    // TODO: single method. can have types as aa-4337 and non-4337. can have fee modes based on types
    /*async signTransaction() {
  
    }*/
    /**
     *
     * @notice personal sign is used currently (Signer should be able to use _typedSignData)
     * @param tx IWalletTransaction Smart Account Transaction object prepared
     * @param chainId optional chainId
     * @returns:string Signature
     */
    async signUserPaidTransaction(signUserPaidTransactionDto) {
        const { chainId = __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId, tx } = signUserPaidTransactionDto;
        const signatureType = __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").signType;
        const walletContract = this.contractUtils.attachWalletContract(chainId, this.DEFAULT_VERSION, this.address);
        let signature = '0x';
        if (signatureType === core_types_1.SignTypeMethod.PERSONAL_SIGN) {
            const { data } = await (0, transactions_1.smartAccountSignMessage)(this.signer, walletContract, tx, chainId);
            signature += data.slice(2);
        }
        else {
            const { data } = await (0, transactions_1.smartAccountSignTypedData)(this.signer, walletContract, tx, chainId);
            signature += data.slice(2);
        }
        const potentiallyIncorrectV = parseInt(signature.slice(-2), 16);
        if (![27, 28].includes(potentiallyIncorrectV)) {
            const correctV = potentiallyIncorrectV + 27;
            signature = signature.slice(0, -2) + correctV.toString(16);
        }
        common_1.Logger.log('non-4337 flow signature: ', signature);
        return signature;
    }
    // This would be a implementation on non-aa4337 provider
    /**
     * Prepares encoded wallet transaction, gets signature from the signer and dispatches to the blockchain using relayer
     * @param tx IWalletTransaction Smart Account Transaction object prepared
     * @param chainId optional chainId
     * @returns transactionId : transaction identifier
     */
    // Forward transaction // rename options: sendDirectTransactionWithFeeQuote
    async sendUserPaidTransaction(sendUserPaidTransactionDto) {
        let { chainId } = sendUserPaidTransactionDto;
        const { tx } = sendUserPaidTransactionDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        const { gasLimit } = sendUserPaidTransactionDto;
        const isDeployed = await this.contractUtils.isDeployed(chainId, this.address);
        const rawTx = {
            to: tx.to,
            data: tx.data,
            chainId: chainId
        };
        const transaction = {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            operation: tx.operation,
            targetTxGas: tx.targetTxGas
        };
        const refundInfo = {
            baseGas: tx.baseGas,
            gasPrice: tx.gasPrice,
            tokenGasPriceFactor: tx.tokenGasPriceFactor,
            gasToken: tx.gasToken,
            refundReceiver: tx.refundReceiver
        };
        const walletContract = this.contractUtils.attachWalletContract(chainId, this.DEFAULT_VERSION, this.address);
        const signature = await this.signUserPaidTransaction({
            version: this.DEFAULT_VERSION,
            tx,
            chainId,
            signer: this.signer
        });
        const execTransaction = await walletContract.populateTransaction.execTransaction(transaction, refundInfo, signature);
        rawTx.to = this.address;
        rawTx.data = execTransaction.data;
        const state = await this.contractUtils.getSmartAccountState();
        const signedTx = {
            rawTx,
            tx
        };
        const relayTrx = {
            signedTx,
            config: state,
            context: this.getSmartAccountContext(chainId)
        };
        if (gasLimit) {
            relayTrx.gasLimit = gasLimit;
        }
        else {
            relayTrx.gasLimit = {
                hex: '0x16E360',
                type: 'hex'
            };
        }
        if (!isDeployed) {
            relayTrx.gasLimit = {
                hex: '0x1E8480',
                type: 'hex'
            };
        }
        const relayResponse = await this.relayer.relay(relayTrx, this);
        if (relayResponse.transactionId) {
            return relayResponse.transactionId;
        }
        return '';
    }
    // TODO: single method. can have types as aa-4337 and non-4337. can have fee modes based on types
    /*async sendSignedTransaction() {
  
    }*/
    async sendSignedTransactionWithFeeQuote(sendUserPaidSignedTransactionDto) {
        let { chainId } = sendUserPaidSignedTransactionDto;
        const { tx, signature } = sendUserPaidSignedTransactionDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        let { gasLimit } = sendUserPaidSignedTransactionDto;
        const isDeployed = await this.contractUtils.isDeployed(chainId, this.address);
        const rawTx = {
            to: tx.to,
            data: tx.data,
            value: 0,
            chainId: chainId
        };
        const transaction = {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            operation: tx.operation,
            targetTxGas: tx.targetTxGas
        };
        const refundInfo = {
            baseGas: tx.baseGas,
            gasPrice: tx.gasPrice,
            tokenGasPriceFactor: tx.tokenGasPriceFactor,
            gasToken: tx.gasToken,
            refundReceiver: tx.refundReceiver
        };
        const walletContract = this.contractUtils.attachWalletContract(chainId, this.DEFAULT_VERSION, this.address);
        const execTransaction = await walletContract.populateTransaction.execTransaction(transaction, refundInfo, signature);
        rawTx.to = this.address;
        rawTx.data = execTransaction.data;
        const state = await this.contractUtils.getSmartAccountState();
        const signedTx = {
            rawTx,
            tx
        };
        const relayTrx = {
            signedTx,
            config: state,
            context: this.getSmartAccountContext(chainId)
        };
        if (gasLimit) {
            relayTrx.gasLimit = gasLimit;
        }
        if (!isDeployed) {
            gasLimit = {
                hex: '0x1E8480',
                type: 'hex'
            };
            relayTrx.gasLimit = gasLimit;
        }
        const relayResponse = await this.relayer.relay(relayTrx, this);
        common_1.Logger.log('relayResponse', relayResponse);
        if (relayResponse.transactionId) {
            return relayResponse.transactionId;
        }
        return '';
    }
    // Get Fee Options from relayer and make it available for display
    // We can also show list of transactions to be processed (decodeContractCall)
    /**
     *
     * @param getFeeQuotesDto
     */
    async getFeeQuotes(getFeeQuotesDto) {
        let { version, chainId } = getFeeQuotesDto;
        const { transaction } = getFeeQuotesDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        version = version ? version : this.DEFAULT_VERSION;
        return this.transactionManager.getFeeQuotes({
            chainId,
            version,
            transaction
        });
    }
    // Get Fee Options from relayer and make it available for display
    // We can also show list of transactions to be processed (decodeContractCall)
    /**
     *
     * @param getFeeQuotesForBatchDto
     */
    // TODO: rename to getFeeQuotes // can keep single method for batch and single tx
    async getFeeQuotesForBatch(getFeeQuotesForBatchDto) {
        let { version, chainId } = getFeeQuotesForBatchDto;
        const { transactions } = getFeeQuotesForBatchDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        version = version ? version : this.DEFAULT_VERSION;
        return this.transactionManager.getFeeQuotesForBatch({
            version,
            chainId,
            transactions
        });
    }
    // Other helpers go here for pre build (feeOptions and quotes from relayer) , build and execution of refund type transactions
    /**
     * Prepares compatible IWalletTransaction object based on Transaction Request
     * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
     * @param createUserPaidTransactionDto
     * @returns
     */
    // options : createSCWTransactionWithFeeQuote / invokeAccountWithFeeQuote / createDirectSCWTransaction
    async createUserPaidTransaction(createUserPaidTransactionDto) {
        let { version, chainId, skipEstimation } = createUserPaidTransactionDto;
        const { transaction, feeQuote } = createUserPaidTransactionDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        version = version ? version : this.DEFAULT_VERSION;
        skipEstimation = skipEstimation !== null && skipEstimation !== void 0 ? skipEstimation : false;
        return this.transactionManager.createUserPaidTransaction({
            version,
            transaction,
            chainId,
            feeQuote,
            skipEstimation
        });
    }
    /**
     * Prepares compatible IWalletTransaction object based on Transaction Request
     * @notice This transaction is without fee refund (gasless)
     * @param transactionDto
     * @returns
     */
    async createTransaction(transactionDto) {
        let { version, chainId } = transactionDto;
        const { transaction } = transactionDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        version = version ? version : this.DEFAULT_VERSION;
        return this.transactionManager.createTransaction({ chainId, version, transaction });
    }
    /**
     * Prepares compatible IWalletTransaction object based on Transaction Request
     * @notice This transaction is without fee refund (gasless)
     * @param transaction
     * @param chainId
     * @returns
     */
    async createTransactionBatch(transactionBatchDto) {
        let { version, chainId } = transactionBatchDto;
        const { transactions } = transactionBatchDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        version = version ? version : this.DEFAULT_VERSION;
        return this.transactionManager.createTransactionBatch({
            version,
            transactions,
            chainId
        });
    }
    /**
     * Prepares compatible IWalletTransaction object based on Transaction Request
     * @notice This transaction is with fee refund (smart account pays using it's own assets accepted by relayers)
     * @param createUserPaidTransactionBatchDto
     * @returns
     */
    async createUserPaidTransactionBatch(createUserPaidTransactionBatchDto) {
        let { version, chainId, skipEstimation } = createUserPaidTransactionBatchDto;
        const { transactions, feeQuote } = createUserPaidTransactionBatchDto;
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        version = version ? version : this.DEFAULT_VERSION;
        skipEstimation = skipEstimation !== null && skipEstimation !== void 0 ? skipEstimation : false;
        return this.transactionManager.createUserPaidTransactionBatch({
            version,
            transactions,
            chainId,
            feeQuote,
            skipEstimation
        });
    }
    /**
     *
     * @param chainId optional chainId
     * @returns Smart Wallet Contract instance attached with current smart account address (proxy)
     */
    smartAccount(chainId) {
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        const smartWallet = this.contractUtils.smartWalletContract[chainId][this.DEFAULT_VERSION];
        const address = this.address;
        smartWallet.getContract().attach(address);
        return smartWallet;
    }
    /**
     *
     * @param address EOA address
     * @param chainId optional chainId
     * @param index optional index for counterfactual address
     * @returns SmartAccount address for given EOA address
     */
    async getSmartAccountAddress(owner, chainId, index) {
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        index = index ? index : 0;
        const factoryAddr = this.contractUtils.smartWalletFactoryContract[chainId][this.DEFAULT_VERSION];
        return await factoryAddr.getAddressForCounterFactualAccount(owner, index);
    }
    /**
     *
     * @param chainId optional chainId
     * @returns Smart Wallet Factory instance for requested chainId
     */
    factory(chainId) {
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        return this.contractUtils.smartWalletFactoryContract[chainId][this.DEFAULT_VERSION];
    }
    multiSend(chainId) {
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        return this.contractUtils.multiSendContract[chainId][this.DEFAULT_VERSION];
    }
    // WIP
    // expose getMultiSend(), getMultiSendCall()
    async getAddress(addressForCounterFactualWalletDto) {
        const { index, chainId } = addressForCounterFactualWalletDto;
        const walletInfo = await (0, common_1.getWalletInfo)({
            chainId,
            owner: this.owner,
            txServiceUrl: __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").backendUrl,
            index
        });
        common_1.Logger.log('walletInfo ', walletInfo);
        this.address = walletInfo.smartAccountAddress;
        const smartAccountState = {
            chainId: chainId,
            version: walletInfo.version,
            address: walletInfo.smartAccountAddress,
            owner: this.owner,
            isDeployed: walletInfo.isDeployed,
            entryPointAddress: walletInfo.entryPointAddress,
            implementationAddress: walletInfo.implementationAddress,
            fallbackHandlerAddress: walletInfo.fallBackHandlerAddress,
            factoryAddress: walletInfo.factoryAddress
        };
        this.contractUtils.setSmartAccountState(smartAccountState);
        return walletInfo;
    }
    /**
     * Allows one to check if the smart account is already deployed on requested chainOd
     * @notice the check is made on Wallet Factory state with current address in Smart Account state
     * @param chainId optional chainId : Default is current active
     * @returns
     */
    async isDeployed(chainId) {
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        return await this.contractUtils.isDeployed(chainId, this.address);
    }
    /**
     * @param chainId requested chain : default is active chain
     * @returns object containing infromation (owner, relevant contract addresses, isDeployed) about Smart Account for requested chain
     */
    async getSmartAccountState() {
        return this.contractUtils.getSmartAccountState();
    }
    //
    /**
     * Serves smart contract instances associated with Smart Account for requested ChainId
     * Context is useful when relayer is deploying a wallet
     * @param chainId requested chain : default is active chain
     * @returns object containing relevant contract instances
     */
    getSmartAccountContext(
    // smartAccountVersion: SmartAccountVersion = this.DEFAULT_VERSION,
    chainId) {
        chainId = chainId ? chainId : __classPrivateFieldGet(this, _SmartAccount_smartAccountConfig, "f").activeNetworkId;
        const context = this.contractUtils.getSmartAccountContext(chainId, this.DEFAULT_VERSION);
        return context;
    }
}
_SmartAccount_smartAccountConfig = new WeakMap();
// Current default config
exports.default = SmartAccount;
//# sourceMappingURL=SmartAccount.js.map