# Archethic wallet provider
Build in progress, to use it you will need the [archethic libjs typescript version](https://github.com/archethic-foundation/libjs) package installed in your project.
## Connect archethic wallet easily to your app
This package was build to simplify the connection between your react DApp and the archethic wallet. 

It is build as a react context provider, so you can easily use it in your react app and access the wallet from anywhere in your app.
## Build
To build the package, run the following command:

```bash
npm install
tsc
```
## How to use
In your main app file, wrap your app with the WalletProvider component and pass the origin object as a prop. 
The origin object is required and must contain the name of your app. 

```javascript
// App.js
import WalletProvider from "archethic-provider";

// required origin object
const origin = {
    name: "Your app name",
    url: "https://yourapp.com"
}

const App = () => {
  return (
    <WalletProvider origin={origin} initilizeOnPageLoad={true} >
      <YourApp />
    </WalletProvider>
  );
};
```

In a component, you can access the wallet object by using the useWallet hook.
    
```javascript
// YourComponent.js
import { useWallet } from "archethic-provider";

const YourComponent = () => {
    const { isConnected, walletEndpoint, currentAccount, connect, archethic } = useWallet();
    return (
        <div>
            <p>Is connected: {isConnected}</p>
            <p>Wallet endpoint: {walletEndpoint.origin}</p>
            <p>Current account: {currentAccount.name}</p>
            <p>Current account: {currentAccount.genesisAddress}</p>
            <button onClick={!isConnected && connect}>Connect</button>
        </div>
    )
}
```
You can also use all the [archethic libjs SDK](https://github.com/archethic-foundation/libjs) by using the archethic object.

