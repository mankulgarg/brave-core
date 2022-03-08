import { BraveWallet, PageState } from '../../constants/types'

export const mockPageState: PageState = {
    hasInitialized: false,
    showAddModal: false,
    showRecoveryPhrase: false,
    invalidMnemonic: false,
    importAccountError: false,
    importWalletError: { hasError: false },
    selectedTimeline: BraveWallet.AssetPriceTimeframe.OneDay,
    selectedAsset: undefined,
    selectedAssetFiatPrice: undefined,
    selectedAssetCryptoPrice: undefined,
    selectedAssetPriceHistory: [],
    portfolioPriceHistory: [],
    isFetchingPriceHistory: false,
    showIsRestoring: false,
    setupStillInProgress: false,
    isCryptoWalletsInitialized: false,
    isMetaMaskInitialized: false
}
