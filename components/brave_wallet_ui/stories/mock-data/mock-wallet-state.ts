import { BraveWallet, WalletAccountType, WalletState } from '../../constants/types'
import { mockNetworks } from './mock-networks'

const mockAccount: WalletAccountType = {
    id: 'mockId',
    name: 'mockAccountName',
    address: 'mockAddress',
    balance: '123456',
    accountType: 'Primary' as 'Primary' | 'Secondary' | 'Ledger' | 'Trezor',
    tokenBalanceRegistry: {},
    coin: BraveWallet.CoinType.ETH
}

export const mockWalletState: WalletState = {
    accounts: [
        mockAccount
    ],
    hasInitialized: false,
    isFilecoinEnabled: false,
    isSolanaEnabled: false,
    isWalletCreated: false,
    isWalletLocked: true,
    favoriteApps: [],
    isWalletBackedUp: false,
    hasIncorrectPassword: false,
    selectedAccount: mockAccount,
    selectedNetwork: {
        chainId: BraveWallet.MAINNET_CHAIN_ID,
        chainName: 'Ethereum Mainnet',
        rpcUrls: [],
        blockExplorerUrls: [],
        iconUrls: [],
        symbol: 'ETH',
        symbolName: 'Ethereum',
        decimals: 18,
        coin: BraveWallet.CoinType.ETH,
        data: {
            ethData: {
                isEip1559: true
            }
        }
    },
    userVisibleTokensInfo: [],
    transactions: {},
    pendingTransactions: [],
    knownTransactions: [],
    fullTokenList: [],
    portfolioPriceHistory: [],
    selectedPendingTransaction: undefined,
    isFetchingPortfolioPriceHistory: true,
    selectedPortfolioTimeline: BraveWallet.AssetPriceTimeframe.OneDay,
    networkList: mockNetworks,
    transactionSpotPrices: [],
    addUserAssetError: false,
    defaultWallet: BraveWallet.DefaultWallet.BraveWalletPreferExtension,
    activeOrigin: '',
    gasEstimates: undefined,
    connectedAccounts: [],
    isMetaMaskInstalled: false,
    defaultCurrencies: {
        fiat: '',
        crypto: ''
    }
}
