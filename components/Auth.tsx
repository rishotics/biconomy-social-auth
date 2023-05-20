import { useState, useEffect, useRef } from 'react'
// import SocialLogin from '@biconomy/web3-auth'
import SocialLogin from './web3-auth/src/SocialLogin'
import { ChainId } from '@biconomy/core-types'
import { ethers } from 'ethers'
import SmartAccount from '@biconomy/smart-account'
import { Banana, Chains} from '@rize-labs/banana-wallet-sdk'
import { css } from '@emotion/css'
import { SampleAbi } from "./abi";

export default function Home() {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null)
  const [interval, enableInterval] = useState(false)
  const sdkRef = useRef<SocialLogin | null>(null)
  const [ bananaWallet, setBananaWallet ]  = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let configureLogin
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!sdkRef.current?.provider) {
          setupSmartAccount()
          clearInterval(configureLogin)
        }
      }, 1000)
    }
  }, [interval])

  async function login() {
    if (!sdkRef.current) {
      const socialLoginSDK = new SocialLogin()
      
      const signature1 = await socialLoginSDK.whitelistUrl('https://biconomy-social-auth.vercel.app')
      await socialLoginSDK.init({
        chainId: ethers.utils.hexValue(ChainId.POLYGON_MAINNET),
        whitelistUrls: {
          'https://biconomy-social-auth.vercel.app': signature1,
        }
      })
      sdkRef.current = socialLoginSDK
    }
    if (!sdkRef.current.provider) {
      // sdkRef.current.showConnectModal()
      sdkRef.current.showWallet()
      enableInterval(true)
    } else {
      setupSmartAccount()
    }
  }

  async function bananaLogin() {
    // if (!sdkRef.current) {
    //   const socialLoginSDK = new SocialLogin()
      
    //   const signature1 = await socialLoginSDK.whitelistUrl('https://biconomy-social-auth.vercel.app')
    //   await socialLoginSDK.init({
    //     chainId: ethers.utils.hexValue(ChainId.POLYGON_MAINNET),
    //     whitelistUrls: {
    //       'https://biconomy-social-auth.vercel.app': signature1,
    //     }
    //   })
    //   sdkRef.current = socialLoginSDK
    // }
   
      setupSmartAccountBanana()
    
  }

  async function setupSmartAccount() {
    if (!sdkRef?.current?.provider) return
    sdkRef.current.hideWallet()
    setLoading(true)
    const web3Provider = new ethers.providers.Web3Provider(
      sdkRef.current.provider
    )
    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: ChainId.POLYGON_MAINNET,
        supportedNetworksIds: [ChainId.POLYGON_MAINNET],
      })
      await smartAccount.init()
      setSmartAccount(smartAccount)
      setLoading(false)
    } catch (err) {
      console.log('error setting up smart account... ', err)
    }
  }

  async function setupSmartAccountBanana() {
    setLoading(true);
    const bananaLogin = new Banana(Chains.mumbai);
    const bananaW = await bananaLogin.createWallet();
    // setBananaWallet(bananaW);
    const web3Provider = await bananaW.getSigner();

    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: ChainId.POLYGON_MUMBAI,
        supportedNetworksIds: [ChainId.POLYGON_MUMBAI],
      })
      await smartAccount.init()
      setSmartAccount(smartAccount)
      setLoading(false)
    } catch (err) {
      console.log('error setting up smart account... ', err)
    }
  }

  const makeTransaction = async () => {
    if (!smartAccount) return;
    const tx = {
      gasLimit: "0x55555",
      to: "0xCB8a3Ca479aa171aE895A5D2215A9115D261A566",
      value: ethers.utils.parseEther("0.00001"),
      data: new ethers.utils.Interface(SampleAbi).encodeFunctionData(
        "stake",
        []
      ),
    };
    try{
      const tx1 = await smartAccount.sendTransaction({transaction: tx})
      console.log(tx1);
    } catch(err) {
      console.log("error in transaction", err);
    }
  }

  const logout = async () => {
    if (!sdkRef.current) {
      console.error('Web3Modal not initialized.')
      return
    }
    await sdkRef.current.logout()
    sdkRef.current.hideWallet()
    setSmartAccount(null)
    enableInterval(false)
  }

  return (
    <div className={containerStyle}>
      <h1 className={headerStyle}>BICONOMY AUTH</h1>
      {
        !smartAccount && !loading && <button className={buttonStyle} onClick={login}>Login</button>
      }
      {
        !smartAccount && !loading && <button className={buttonStyle} onClick={bananaLogin}>Login with Rainbow</button>
      }

      {
        loading && <p>Loading account details...</p>
      }
      {
        !!smartAccount && (
          <div className={detailsContainerStyle}>
            <h3>Smart account address:</h3>
            <p>{smartAccount.address}</p>
            <button className={buttonStyle} onClick={logout}>Logout</button>
          </div>
        )
      }
      {
        !!smartAccount && <button className={buttonStyle} onClick={makeTransaction}>Make Txn</button>
      }

      
    </div>
  )
}

const detailsContainerStyle = css`
  margin-top: 10px;
`

const buttonStyle = css`
  padding: 14px;
  width: 300px;
  border: none;
  cursor: pointer;
  border-radius: 999px;
  outline: none;
  margin-top: 20px;
  transition: all .25s;
  &:hover {
    background-color: rgba(0, 0, 0, .2); 
  }
`

const headerStyle = css`
  font-size: 44px;
`

const containerStyle = css`
  width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-top: 100px;
`
