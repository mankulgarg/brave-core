import { BraveWallet } from '../../../constants/types'
import WalletApiProxy from '../../wallet_api_proxy'
export class MockedWalletApiProxy {
    mockQuote = {
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
    }

    swapService = {
        getTransactionPayload: async () => ({
            success: true,
            errorResponse: {},
            response: this.mockQuote
        }),
        getPriceQuote: async () => ({
            success: true,
            errorResponse: {},
            response: {}
        })
    }

    ethTxManagerProxy = {
        getGasEstimation1559: async () => {
            return {
                estimation: {
                    slowMaxPriorityFeePerGas: '0',
                    slowMaxFeePerGas: '0',
                    avgMaxPriorityFeePerGas: '0',
                    avgMaxFeePerGas: '0',
                    fastMaxPriorityFeePerGas: '0',
                    fastMaxFeePerGas: '0',
                    baseFeePerGas: '0'
                } as BraveWallet.GasEstimation1559 | null
            }
        }
    }

    setMockedQuote (newQuote: typeof this.mockQuote) {
        this.mockQuote = newQuote
    }
}

export default function getAPIProxy (): Partial<WalletApiProxy> {
    return new MockedWalletApiProxy() as unknown as Partial<WalletApiProxy> & MockedWalletApiProxy
}
