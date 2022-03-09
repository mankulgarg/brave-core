import * as React from 'react'
import {
  UserAccountType,
  BuySendSwapViewTypes,
  ToOrFromType,
  BraveWallet
} from '../../../constants/types'
import {
  AccountsAssetsNetworks,
  Header,
  Swap
} from '..'
import { useSwap } from '../../../common/hooks'

export interface Props {
  onSelectNetwork: (network: BraveWallet.NetworkInfo) => void
  onSelectAccount: (account: UserAccountType) => void
  onAddNetwork: () => void
  onAddAsset: () => void
}

function SwapTab (props: Props) {
  const {
    onSelectNetwork,
    onSelectAccount,
    onAddNetwork,
    onAddAsset
  } = props

  const swap = useSwap()
  const {
    onSelectTransactAsset,
    swapAssetOptions
  } = swap

  const [swapView, setSwapView] = React.useState<BuySendSwapViewTypes>('swap')
  const [isSelectingAsset, setIsSelectingAsset] = React.useState<ToOrFromType>('from')
  const [filteredAssetList, setFilteredAssetList] = React.useState<BraveWallet.BlockchainToken[]>(swapAssetOptions)

  const onChangeSwapView = (view: BuySendSwapViewTypes, option?: ToOrFromType) => {
    if (option) {
      setIsSelectingAsset(option)
    }
    setSwapView(view)
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
    onSelectTransactAsset(asset, isSelectingAsset)
    setSwapView('swap')
  }

  const onFilterAssetList = React.useCallback((asset?: BraveWallet.BlockchainToken) => {
    if (!asset) {
      return
    }

    const newList = swapAssetOptions.filter((assets) => assets !== asset)
    setFilteredAssetList(newList)
  }, [swapAssetOptions])

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
            {...swap}
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
