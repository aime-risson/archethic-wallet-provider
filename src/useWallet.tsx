import {WalletContext} from "./WalletProvider";
import React from "react";

export function useWallet(){
    const context = React.useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}
