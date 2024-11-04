"use client"

import {PrivyProvider} from '@privy-io/react-auth';

interface ChainConfig {
    id: number;
    name: string;
    network: string;
    nativeCurrency: {
      decimals: number;
      name: string;
      symbol: string;
    };
    rpcUrls: {
      default: {
        http: string[];
      };
    };
    blockExplorers: {
      default: {
        name: string;
        url: string;
      };
    };
  }
  
  function defineChain(config: ChainConfig) {
    return {
      id: config.id,
      name: config.name,
      network: config.network,
      nativeCurrency: config.nativeCurrency,
      rpcUrls: config.rpcUrls,
      blockExplorers: config.blockExplorers,
    };
  }
  
  const zkSyncSepolia = defineChain({
    id: 300,
    name: "zkSync Sepolia Testnet",
    network: "zkSync Sepolia Testnet",
    nativeCurrency: {
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        http: ["https://zksync2-testnet.zksync.dev"],
      },
    },
    blockExplorers: {
      default: { name: "zkSync Explorer", url: "https://zksync2-testnet-explorer.zkscan.io/" },
    },
  });

export default function ProviderForPrivy({children}: {children: React.ReactNode}) {
  let appId = "cm33h9snb06g7whuebsnpjttd";

  return (
    <PrivyProvider
        appId={appId}
      config={{
        // Customize Privy's appearance in your app
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: 'https://your-logo-url',
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: zkSyncSepolia,
        supportedChains:[zkSyncSepolia]
      }}
    >
      {children}
    </PrivyProvider>
  );
}
