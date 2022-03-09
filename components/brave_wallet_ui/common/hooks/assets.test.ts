import { TextEncoder, TextDecoder } from 'util'
global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder
import { renderHook, act } from '@testing-library/react-hooks'
import {
  mockAccount,
  mockAssetPrices,
  mockNetwork
} from '../constants/mocks'
import { AccountAssetOptions } from '../../options/asset-options'
import useAssets from './assets'
import { WalletAccountType } from '../../constants/types'
import { setMockedBuyAssets } from '../async/__mocks__/lib'

jest.mock('../async/lib')

const mockAccounts = [
  {
    ...mockAccount,
    tokenBalanceRegistry: {
      [AccountAssetOptions[0].contractAddress.toLowerCase()]: '238699740940532500',
      [AccountAssetOptions[1].contractAddress.toLowerCase()]: '0'
    }
  } as WalletAccountType,
  {
    ...mockAccount,
    balance: '',
    tokenBalanceRegistry: {
      [AccountAssetOptions[0].contractAddress.toLowerCase()]: '0',
      [AccountAssetOptions[1].contractAddress.toLowerCase()]: '0'
    }
  } as WalletAccountType
]

const mockVisibleList = [
  AccountAssetOptions[0],
  AccountAssetOptions[1]
]

describe('useAssets hook', () => {
  it('Selected account has balances, should return expectedResult', async () => {
    setMockedBuyAssets(mockVisibleList)
    const { result, waitForNextUpdate } = renderHook(() => useAssets(
      mockAccounts[0],
      mockNetwork,
      mockVisibleList,
      mockAssetPrices
    ))
    await act(async () => {
      await waitForNextUpdate()
    })
    expect(result.current.panelUserAssetList).toEqual(mockVisibleList)
  })

  it('should return empty array for panelUserAssetList if visible assets is empty', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAssets(
      mockAccount,
      mockNetwork,
      [],
      mockAssetPrices
    ))
    await act(async () => {
      await waitForNextUpdate()
    })
    expect(result.current.panelUserAssetList).toEqual([])
  })
})
