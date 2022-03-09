import { BraveWallet } from '../../../constants/types'
import WalletApiProxy from '../../wallet_api_proxy'

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

export default function getAPIProxy (): WalletApiProxy {
    return {
        swapService: {
            getTransactionPayload: async () => ({
                success: true,
                errorResponse: {},
                response: {
                    ...mockQuote,
                    gasPrice: '10',
                    gas: '100000',
                    sellAmount: '10000000000000000000' // 10 BAT
                }
            }),
            getPriceQuote: async () => ({
                success: true,
                errorResponse: {},
                response: {}
            })
        },
        ethTxManagerProxy: {
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
    } as any
}
