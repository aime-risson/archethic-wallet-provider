import React, {Context, createContext, useReducer} from "react";
import Archethic from "archethic";
import { useWallet } from "./useWallet";
import {AccountIdentity, RpcRequestOrigin, TransactionSuccess} from "archethic/dist/api/types";

export {useWallet};

const WALLET_RPC_ENDPOINT = "ws://localhost:12345";

// -------------------------- Context -------------------------- //
export interface walletContext {
    archetic?: Archethic ,
    walletEndpoint? : URL,
    isConnected: boolean,
    currentAccount?: AccountIdentity,
    accounts: AccountIdentity[],
    connect: () => void,
    disconnect: () => void,
    initialize: () => void,
    getAccounts: () => Promise<AccountIdentity[]>,
    sendTransaction: (transaction: any) => Promise<any>,
}
export const WalletContext: Context<walletContext> = createContext<walletContext>({
    isConnected: false,
    accounts: [],
    connect: () => {},
    disconnect: () => {},
    initialize: () => {},
    getAccounts: () => Promise.resolve([]),
    sendTransaction: () => Promise.resolve({}),
});

// -------------------------------------------------------------- //


// -------------------------- Reducer -------------------------- //

// ------------------ Action Types ------------------ //
//@ts-ignore
enum ActionType {
    INITIALIZE = "INITIALIZE",
    CONNECT = "CONNECT",
    DISCONNECT = "DISCONNECT",
    CURRENT_ACCOUNT_CHANGED = "CURRENT_ACCOUNT_CHANGED",
    GET_ACCOUNTS = "GET_ACCOUNTS",
}
// -------------------------------------------------- //

// ------------------ Initial State ------------------ //
interface walletState {
    archetic?: Archethic,
    walletEndpoint?: URL,
    isConnected: boolean,
    currentAccount?: AccountIdentity,
    accounts: AccountIdentity[],
}
const initialState: walletState = {
    isConnected: false,
    accounts: [],
};
// --------------------------------------------------- //

// ------------------ Reducer ------------------ //
type Action =
    | { type: ActionType.INITIALIZE; payload: { archetic: Archethic } }
    | { type: ActionType.CONNECT; payload: { walletEndpoint: URL } }
    | { type: ActionType.CURRENT_ACCOUNT_CHANGED; payload: { currentAccount: AccountIdentity } }
    | { type: ActionType.GET_ACCOUNTS; payload: { accounts: AccountIdentity[] } }
    | { type: ActionType.DISCONNECT; payload: {} };

function reducer(state: walletState, action: Action) : walletState {
    switch (action.type) {
        case ActionType.INITIALIZE:
            console.debug("INITIALIZE", action.payload)
            return {
                ...state,
                archetic: action.payload.archetic,
            };

        case ActionType.CONNECT:
            console.debug("CONNECT", action.payload)
            return {
                ...state,
                walletEndpoint: action.payload.walletEndpoint,
                isConnected: true,
            }

        case ActionType.CURRENT_ACCOUNT_CHANGED:
            console.debug("CURRENT_ACCOUNT_CHANGED", action.payload)
            return {
                ...state,
                currentAccount: action.payload.currentAccount,
            }

        case ActionType.GET_ACCOUNTS:
            console.debug("GET_ACCOUNTS", action.payload)
            return {
                ...state,
                accounts: action.payload.accounts,
            }
        case ActionType.DISCONNECT:
            console.debug("DISCONNECT", action.payload)
            return {
                ...state,
                walletEndpoint: undefined,
                isConnected: false,
                currentAccount: undefined,
            };
        default:
            return state;
    }
}
// ---------------------------------------------- //

// ------------------ Provider ------------------ //
type WalletProviderProps = {
    children: React.ReactNode;
    initilizeOnPageLoad?: boolean;
    origin: RpcRequestOrigin
}

const WalletProvider = ({children, initilizeOnPageLoad = false, origin}: WalletProviderProps) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    function ensureInitialized() {
        if (!state.archetic) {
            throw new Error("WalletProvider is not initialized");
        }
    }

    function ensureConnected() {
        if (!state.isConnected) {
            throw new Error("WalletProvider is not connected to the wallet");
        }
    }

    function ensureInitializedAndConnected() {
        ensureInitialized();
        ensureConnected();
    }

    async function initialize ()  {
        const archethic = new Archethic(WALLET_RPC_ENDPOINT)
        archethic.rpcWallet?.setOrigin(origin)
        dispatch({
            type: ActionType.INITIALIZE,
            payload: {
                archetic: archethic,
            }
        });
    }

    async function connect () {
        ensureInitialized();
        await state.archetic!.connect().then(async () => {
            const endpoint = await state.archetic!.rpcWallet!.getEndpoint();
            console.log("endpoint", endpoint)
            console.log("endpoint.endpointUrl", endpoint.endpointUrl)
            console.log("connecting to wallet...")
            await dispatch({
                type: ActionType.CONNECT,
                payload: {
                    walletEndpoint: new URL(endpoint.endpointUrl),
                }
            });
        })

        // Listen to account changes
        state.archetic?.rpcWallet?.onCurrentAccountChange((account: AccountIdentity) => {
            console.log("onCurrentAccountChange", account)
            dispatch({
                type: ActionType.CURRENT_ACCOUNT_CHANGED,
                payload: {
                    currentAccount: account,
                }
            });
        })



    }

    async function getAccounts() : Promise<AccountIdentity[]> {
        ensureInitializedAndConnected();
        return state.archetic!.rpcWallet!.getAccounts().then((accounts: AccountIdentity[]) => {
            dispatch({
                type: ActionType.GET_ACCOUNTS,
                payload: {
                    accounts: accounts,
                }
            });
            return accounts;
        })
    }

    async function disconnect () {
        ensureInitializedAndConnected();
        state.archetic!.rpcWallet!.close().then(() => {
            dispatch({
                type: ActionType.DISCONNECT,
                payload: {}
            });
        })
    }
    
    async function sendTransaction(transaction: any) : Promise<TransactionSuccess> {
        ensureInitializedAndConnected()
        return state.archetic!.rpcWallet!.sendTransaction(transaction);
    }

    React.useEffect( () => {
        if (initilizeOnPageLoad){
            initialize();
        }
    }, [initialize]);

    return (
        <WalletContext.Provider value={{
            ...state,
            initialize,
            connect,
            disconnect,
            getAccounts,
            sendTransaction,
        }} >
            {children}
        </WalletContext.Provider>
    );
};

export default WalletProvider;
// -------------------------------------------------------------- //



