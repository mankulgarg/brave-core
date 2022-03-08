import * as React from 'react'
import {
  UserAccountType,
  BuySendSwapViewTypes,
  ToOrFromType,
  BraveWallet,
  SwapValidationErrorType
} from '../../../constants/types'
import {
  AccountsAssetsNetworks,
  Header,
  Swap
} from '..'

export interface Props {
  assetOptions: BraveWallet.BlockchainToken[]
  isFetchingQuote: boolean
  validationError: SwapValidationErrorType | undefined
  onSelectNetwork: (network: BraveWallet.NetworkInfo) => void
  onSelectAccount: (account: UserAccountType) => void
  onSelectSwapAsset: (asset: BraveWallet.BlockchainToken, toOrFrom: ToOrFromType) => void
  onAddNetwork: () => void
  onAddAsset: () => void
}

function SwapTab (props: Props) {
  const {
    assetOptions,
    isFetchingQuote,
    validationError,
    onSelectNetwork,
    onSelectAccount,
    onSelectSwapAsset,
    onAddNetwork,
    onAddAsset
  } = props

  const [swapView, setSwapView] = React.useState<BuySendSwapViewTypes>('swap')
  const [isSelectingAsset, setIsSelectingAsset] = React.useState<ToOrFromType>('from')
  const [filteredAssetList, setFilteredAssetList] = React.useState<BraveWallet.BlockchainToken[]>(assetOptions)

  const onChangeSwapView = (view: BuySendSwapViewTypes, option?: ToOrFromType) => {
    if (option) {
      setIsSelectingAsset(option)
      setSwapView(view)
    } else {
      setSwapView(view)
    }
  }

  const onClickSelectNetwork = (network: BraveWallet.NetworkInfo) => () => {
    onSelectNetwork(network)
    setSwapView('swap')
  }

  const onClickSelectAccount = (account: UserAccountType) => () => {
    onSelectAccount(account)
    setSwapView('swap')
  }

  const onSelectAsset = (asset: BraveWallet.BlockchainToken) => () => {
    onSelectSwapAsset(asset, isSelectingAsset)
    setSwapView('swap')
  }

  const onFilterAssetList = (asset?: BraveWallet.BlockchainToken) => {
    if (!asset) {
      return
    }

    const newList = assetOptions.filter((assets) => assets !== asset)
    setFilteredAssetList(newList)
  }

  const goBack = () => {
    setSwapView('swap')
  }

  return (
    <>
      {swapView === 'swap' &&
        <>
          <Header
            onChangeSwapView={onChangeSwapView}
          />
          <Swap
            isFetchingQuote={isFetchingQuote}
            validationError={validationError}
            onChangeSwapView={onChangeSwapView}
            onFilterAssetList={onFilterAssetList}
          />
        </>
      }
      {swapView !== 'swap' &&
        <AccountsAssetsNetworks
          goBack={goBack}
          assetOptions={filteredAssetList}
          onClickSelectAccount={onClickSelectAccount}
          onClickSelectNetwork={onClickSelectNetwork}
          onSelectedAsset={onSelectAsset}
          selectedView={swapView}
          onAddNetwork={onAddNetwork}
          onAddAsset={onAddAsset}
        />
      }
    </>
  )
}

export default SwapTab
