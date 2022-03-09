import * as React from 'react'
import { act, renderHook } from '@testing-library/react-hooks'

// Constants
import { mockAccount } from '../constants/mocks'
import { BraveWallet } from '../../constants/types'

// Options
import { AccountAssetOptions } from '../../options/asset-options'

// Hooks
jest.mock('../async/lib')
jest.mock('../async/bridge')
import * as MockedLib from '../async/lib'
import { TextEncoder, TextDecoder } from 'util'
global.TextDecoder = TextDecoder as any
global.TextEncoder = TextEncoder
import useSwap from './swap'

// Redux
import { Provider } from 'react-redux'
import { combineReducers, createStore } from 'redux'
import { createWalletReducer } from '../reducers/wallet_reducer'
import { createPageReducer } from '../../page/reducers/page_reducer'

// Mocks
import { mockWalletState } from '../../stories/mock-data/mock-wallet-state'
import { mockPageState } from '../../stories/mock-data/mock-page-state'
import getAPIProxy from '../async/bridge'
import { MockedWalletApiProxy } from '../async/__mocks__/bridge'

const mockedProxy = getAPIProxy() as unknown as MockedWalletApiProxy

jest.useFakeTimers()

const store = createStore(combineReducers({
  wallet: createWalletReducer(mockWalletState),
  page: createPageReducer(mockPageState)
}))

const renderHookOptions = {
  wrapper: ({ children }: { children?: React.ReactChildren }) => <Provider store={store}>{children}</Provider>
}

function renderHookOptionsWithCustomStore (store: any) {
  return {
    wrapper: ({ children }: { children?: React.ReactChildren }) => <Provider store={store}>{children}</Provider>
  }
}

const mockQuote = {
  allowanceTarget: '',
  price: '',
  guaranteedPrice: '',
  to: '',
  data: '',
  value: '',
  gas: '0',
  estimatedGas: '0',
  gasPrice: '0',
  protocolFee: '0',
  minimumProtocolFee: '0',
  buyTokenAddress: '',
  sellTokenAddress: '',
  buyAmount: '0',
  sellAmount: '0',
  sellTokenToEthRate: '1',
  buyTokenToEthRate: '1'
} as BraveWallet.SwapResponse

describe('useSwap hook', () => {
  it('should initialize From and To assets', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSwap(), renderHookOptions)

    act(() => {
      result.current.setFromAsset(AccountAssetOptions[0])
      result.current.setToAsset(AccountAssetOptions[1])
    })

    await waitForNextUpdate()

    expect(result.current.fromAsset).toEqual(AccountAssetOptions[0])
    expect(result.current.toAsset).toEqual(AccountAssetOptions[1])
  })

  it('should return if network supports swap or not', async () => {
    const { result, waitFor } = renderHook(() => useSwap(), renderHookOptions)

    await waitFor(() => {
      expect(result.current.isSwapSupported).toBe(true)
    })
  })

  describe('token allowance', () => {
    it('should not query allowance for native From asset', async () => {
      const mockFn = jest.fn(() => Promise.resolve('mockErc20Allowance'))

      const { waitForNextUpdate } = renderHook(() => useSwap(), renderHookOptions)

      await waitForNextUpdate()

      expect(mockFn).not.toHaveBeenCalled()
    })

    it('should not query allowance if no quote', async () => {
      const mockFn = jest.fn(() => Promise.resolve('mockErc20Allowance'))

      // Remove first item in the list, since it is the native asset.
      // const swapAssets = AccountAssetOptions.slice(1)

      const { waitForNextUpdate } = renderHook(() => useSwap(), renderHookOptions)

      await waitForNextUpdate()

      expect(mockFn).not.toHaveBeenCalled()
    })

    it('should query allowance for an ERC20 From asset', async () => {
      const quote: BraveWallet.SwapResponse = {
        ...mockQuote,
        allowanceTarget: 'mockAllowanceTarget'
      }

      // Remove first item in the list, since it is the native asset.
      const swapAssets = AccountAssetOptions.slice(1)

      const mockFn = jest.spyOn(MockedLib, 'getERC20Allowance')

      const { result, waitForNextUpdate } = renderHook(() => useSwap(), renderHookOptions)

      act(() => {
        result.current.setFromAsset(AccountAssetOptions.slice(1)[0])
        result.current.setSwapQuote(quote)
      })

      await waitForNextUpdate()

      expect(mockFn).toBeCalledWith(
        swapAssets[0].contractAddress,
        mockWalletState.accounts[0].address,
        quote.allowanceTarget
      )
    })
  })

  describe('swap validation errors', () => {
    it('should not return error if From and To amount are empty', async () => {
      // Step 1: Initialize the useSwap hook.
      const { result, waitForValueToChange, waitFor } = renderHook(() => useSwap(), renderHookOptions)

      act(() => {
        result.current.setSwapQuote(mockQuote)
      })

      // Step 2: Consume the update to isSwapSupported, so it does not fire
      // in the middle of a future update.
      await waitForValueToChange(() => result.current.isSwapSupported)

      // OK: From and To amounts are 0, and swapValidationError is undefined.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.fromAmount).toBe('0')
        expect(result.current.toAmount).toBe('0')
        expect(result.current.swapValidationError).toBeUndefined()
      })
    })

    it('should return error if From amount has decimals overflow', async () => {
      // Step 1: Initialize the useSwap hook with the following parameters.
      //    From asset: ETH
      //    Balance:    1 ETH
      const { result, waitForValueToChange, waitFor } = renderHook(() => useSwap(), renderHookOptions)

      // Step 2: Consume the update to isSwapSupported, so it does not fire
      // in the middle of a future update.
      await waitForValueToChange(() => result.current.isSwapSupported)

      // Step 3: Set From amount without decimal overflow and wait for at least
      // 1000ms to avoid debouncing.
      act(() => {
        result.current.onSetFromAmount('0.1')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be undefined.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.swapValidationError).toBeUndefined()
      })

      // Step 4: Set From amount with decimal overflow and wait for at least
      // 1000ms to avoid debouncing.
      act(() => {
        result.current.onSetFromAmount('0.1000000000000000000123')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be 'fromAmountDecimalsOverflow'
      // KO: Test case times out
      await waitFor(() => {
        expect(result.current.swapValidationError).toBe('fromAmountDecimalsOverflow')
      })
    })

    it('should return error if To amount has decimals overflow', async () => {
      // Step 1: Initialize the useSwap hook with the following parameters.
      //    To asset: BAT
      const { result, waitFor, waitForValueToChange } = renderHook(() => useSwap(), renderHookOptions)

      // Step 2: Consume the update to isSwapSupported, so it does not fire
      // in the middle of a future update.
      await waitForValueToChange(() => result.current.isSwapSupported)

      // Step 3: Set To amount and wait for at least 1000ms to avoid
      // debouncing.
      act(() => {
        result.current.onSetToAmount('0.1')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be undefined.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.swapValidationError).toBeUndefined()
      })

      // Step 4: Set To amount with a decimal overflow and wait for at least
      // 1000ms to avoid debouncing.
      act(() => {
        result.current.onSetToAmount('0.1000000000000000000123')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be 'toAmountDecimalsOverflow'
      // KO: Test case times out
      await waitFor(() => {
        expect(result.current.swapValidationError).toBe('toAmountDecimalsOverflow')
      })
    })

    it('should return error if From ETH amount has insufficient balance', async () => {
      // Step 1: Initialize the useSwap hook with the following parameters.
      //    From asset: ETH
      //    Balance:    0.000000000000123456 ETH
      const { result, waitFor, waitForValueToChange } = renderHook(() => useSwap(), renderHookOptions)

      // Step 2: Consume the update to isSwapSupported, so it does not fire
      // in the middle of a future update.
      await waitForValueToChange(() => result.current.isSwapSupported)

      // Step 3: Set a From amount and wait for at least 1000ms to avoid
      // debouncing.
      act(() => {
        result.current.onSetFromAmount('0.000000000000123456')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be undefined.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.swapValidationError).toBeUndefined()
      })

      // Step 4: Set a From amount greater than balance and wait for at least
      // 1000ms to avoid debouncing.
      act(() => {
        result.current.onSetFromAmount('1')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be 'insufficientBalance'
      // KO: Test case times out
      await waitFor(() => {
        expect(result.current.swapValidationError).toBe('insufficientBalance')
      })
    })

    it('should return error if From token amount has insufficient balance', async () => {
      // Step 1: Initialize the useSwap hook with the following parameters.
      //    From asset: BAT
      //    Balance:    0.000000000000123456 ETH
      const { result, waitFor, waitForValueToChange } = renderHook(() => useSwap(), renderHookOptions)

      // Step 2: Consume the update to isSwapSupported, so it does not fire
      // in the middle of a future update.
      await waitForValueToChange(() => result.current.isSwapSupported)

      // Step 3: Set a From amount and wait for at least 1000ms to avoid
      // debouncing.
      act(() => {
        result.current.onSetFromAmount('0.000000000000123456')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be undefined.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.swapValidationError).toBeUndefined()
      })

      // Step 4: Set a From amount greater than balance and wait for at least
      // 1000ms to avoid debouncing.
      act(() => {
        result.current.onSetFromAmount('1')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be 'insufficientBalance'
      // KO: Test case times out
      await waitFor(() => {
        expect(result.current.swapValidationError).toBe('insufficientBalance')
      })
    })

    it('should return error if From ETH asset has insufficient balance for fees', async () => {
      // Step 1: Initialize the useSwap hook with the following parameters.
      //    From asset: ETH
      //    Balance:    0.000000000000123456 ETH
      //    Quote fees: 0.000000000001000000 ETH

      const mockStore = createStore(combineReducers({
        wallet: createWalletReducer({
          ...mockWalletState,
          selectedAccount: mockAccount // Balance: 123456 Wei
        }),
        page: createPageReducer(mockPageState)
      }))

      const { result, waitFor, waitForValueToChange } = renderHook(() => useSwap(), renderHookOptionsWithCustomStore(mockStore))

      act(() => {
        result.current.setFromAsset(AccountAssetOptions[0]) // From asset is ETH
        result.current.setSwapQuote({
          ...mockQuote,
          gasPrice: '10',
          gas: '100000'
        })
      })

      // Step 2: Consume the update to isSwapSupported, so it does not fire
      // in the middle of a future update.
      await waitForValueToChange(() => result.current.isSwapSupported)

      // OK: Assert for swapValidationError to be 'insufficientFundsForGas'.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.swapValidationError).toBe('insufficientFundsForGas')
      })
    })

    it('should return error if From ETH asset has insufficient balance for fees + swap', async () => {
      // Step 1: Initialize the useSwap hook with the following parameters.
      //    From asset:  ETH
      //    From amount: 0.000000000000234560 ETH
      //    Quote fees:  0.000000000001000000 ETH
      //    Balance:     0.000000000001234560 ETH
      const mockStore = createStore(combineReducers({
        wallet: createWalletReducer({
          ...mockWalletState,
          selectedAccount: {
            ...mockAccount,
            balance: '1234560' // 1234560 Wei
          }
        }),
        page: createPageReducer(mockPageState)
      }))

      const { result, waitFor, waitForValueToChange } = renderHook(() => useSwap(), renderHookOptionsWithCustomStore(mockStore))

      act(() => {
        result.current.setFromAsset(AccountAssetOptions[0])
        result.current.setSwapQuote({
            ...mockQuote,
            gasPrice: '10',
            gas: '100000',
            sellAmount: '234561' // 0.000000000000234561 ETH
        })
      })

      // Step 2: Consume the update to isSwapSupported, so it does not fire
      // in the middle of a future update.
      await waitForValueToChange(() => result.current.isSwapSupported)

      // Step 3: Set a From amount, such that the value + fees is greater than
      // balance and wait for at least 1000ms to avoid debouncing.
      act(() => {
        result.current.onSetFromAmount('0.000000000000234561')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be 'insufficientFundsForGas'.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.swapValidationError).toBe('insufficientFundsForGas')
      })

      // OK: Assert for fromAmount to be '0.000000000000234561'.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.fromAmount).toBe('0.000000000000234561')
      })
    })

    it('should return error if not enough allowance', async () => {
      // Step 1: Initialize the useSwap hook with the following parameters.
      //    From asset:  BAT
      //    From amount: 10 BAT
      //    Quote fees:  0.000000000001 ETH
      //    Balance:     20 BAT
      const mockStore = createStore(combineReducers({
        wallet: createWalletReducer({
          ...mockWalletState,
          selectedAccount: {
            ...mockAccount,
            balance: '1000000000000000000', // 1 ETH
            tokenBalanceRegistry: {
              [AccountAssetOptions[1].contractAddress.toLowerCase()]: '20000000000000000000' // 20 BAT
            }
          }
        }),
        page: createPageReducer(mockPageState)
      }))

      // set quote
      mockedProxy.setMockedQuote({
        allowanceTarget: '0x0000000000000000000000000000000000000000',
        buyAmount: '211599920',
        buyTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        buyTokenToEthRate: '1720.180416',
        data: '',
        estimatedGas: '280000',
        gas: '100000',
        gasPrice: '10',
        guaranteedPrice: '',
        minimumProtocolFee: '0',
        price: '1705.399509',
        protocolFee: '0',
        sellAmount: '10000000000000000000', // 10 BAT
        sellTokenAddress: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
        sellTokenToEthRate: '1',
        to: '',
        value: '124067000000000000'
      })
      mockedProxy.setMockedTransactionPayload({
        allowanceTarget: '0x0000000000000000000000000000000000000000',
        buyAmount: '211599920',
        buyTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        buyTokenToEthRate: '1720.180416',
        data: '',
        estimatedGas: '280000',
        gas: '100000',
        gasPrice: '10',
        guaranteedPrice: '',
        minimumProtocolFee: '0',
        price: '1705.399509',
        protocolFee: '0',
        sellAmount: '10000000000000000000', // 10 BAT
        sellTokenAddress: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
        sellTokenToEthRate: '1',
        to: '',
        value: '124067000000000000'
      })

      const { result, waitFor, waitForValueToChange } = renderHook(
        () => useSwap({
          fromAsset: AccountAssetOptions[1],
          toAsset: AccountAssetOptions[0]
        }),
        renderHookOptionsWithCustomStore(mockStore)
      )

      // Step 2: Consume the update to isSwapSupported, so it does not fire
      // in the middle of a future update.
      await waitForValueToChange(() => result.current.isSwapSupported)

      // Step 3: Set a From amount, such that the value is greater than
      // token allowance, and wait for at least 1000ms to avoid debouncing.
      // set from-amount
      act(() => {
        result.current.onSwapInputChange('10000000000000000000', 'from') // From asset is BAT
        jest.advanceTimersByTime(1001)
      })
      await waitFor(() => {
        expect(result.current.fromAmount).toBe('10000000000000000000')
        jest.advanceTimersByTime(1001)
      })

      // set-allowance
      act(() => {
        result.current.setAllowance('10')
        jest.advanceTimersByTime(1001)
      })
      await waitFor(() => {
        expect(result.current.allowance).toBe('10')
      })

      // await waitFor(() => {
      //   expect(result.current.swapQuote).not.toBe(undefined)
      // })

      // OK: Assert for swapValidationError to be 'insufficientAllowance'.
      // KO: Test case times out.
      expect(result.current.swapValidationError).toBe('insufficientAllowance')
    })

    it('should return error if insufficient liquidity', async () => {
      // Step 1: Initialize the useSwap hook with the following parameters.
      //    From asset:  ETH
      //    From amount: 0.1 ETH
      //    Quote fees:  0.000000000001 ETH
      //    Balance:     1 ETH
      const { result, waitFor } = renderHook(() => useSwap(), renderHookOptions)

      act(() => {
        result.current.setSwapQuote({
          ...mockQuote,
          gasPrice: '10',
          gas: '100000',
          sellAmount: '100000000000000000' // 0.1 ETH
        })
        result.current.setSwapError({
          code: 100, // SWAP_VALIDATION_ERROR_CODE
          reason: 'mockReason',
          validationErrors: [
            {
              field: 'mockField',
              code: 12345,
              reason: 'INSUFFICIENT_ASSET_LIQUIDITY'
            }
          ]
        })
      })

      // Step 2: Set a From amount, such that there is no validation error,
      // and wait for at least 1000ms to avoid debouncing.
      act(() => {
        result.current.onSetFromAmount('0.1')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be 'insufficientLiquidity'.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.swapValidationError).toBe('insufficientLiquidity')
      })
    })

    it('should return error if gas estimation failed', async () => {
      // Step 1: Initialize the useSwap hook with the following parameters.
      //    From asset:  ETH
      //    From amount: 0.1 ETH
      //    Quote fees:  0.000000000001 ETH
      //    Balance:     1 ETH
      const { result, waitFor } = renderHook(() => useSwap(), renderHookOptions)

      act(() => {
        result.current.setSwapQuote({
          ...mockQuote,
          gasPrice: '10',
          gas: '100000',
          sellAmount: '100000000000000000' // 0.1 ETH
        })
        result.current.setSwapError({
          code: 111, // gas estimation failed
          reason: 'Gas estimation failed'
        })
      })

      // Step 2: Set a From amount, such that there is no validation error,
      // and wait for at least 1000ms to avoid debouncing.
      act(() => {
        result.current.onSetFromAmount('0.1')
        jest.advanceTimersByTime(1001)
      })

      // OK: Assert for swapValidationError to be 'unknownError'.
      // KO: Test case times out.
      await waitFor(() => {
        expect(result.current.swapValidationError).toBe('unknownError')
      })
    })
  })
})
