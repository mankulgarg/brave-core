import { AccountAssetOptions } from '../../../options/asset-options'
import { BraveWallet } from '../../../constants/types'

export const getERC20Allowance = () => new Promise<string>((resolve) => {
    resolve('1000000000000000000') // 1 unit
})

export const getIsSwapSupported = (network: BraveWallet.NetworkInfo) => new Promise<boolean>((resolve) => {
    resolve(true)
})

const mockVisibleList = [
    AccountAssetOptions[0],
    AccountAssetOptions[1]
]

export const getBuyAssets = () => new Promise<typeof mockVisibleList>((resolve) => {
    resolve(mockVisibleList)
})
