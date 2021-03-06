/* eslint-disable no-console */
import {platform_settings as ps} from './platform-conf'
import algosdk, {LogicSigAccount} from 'algosdk'
import { Asset, AssetHolding } from 'algosdk/dist/types/src/client/v2/algod/models/types'
import AlgodClient from 'algosdk/dist/types/src/client/v2/algod/algod';

export const dummy_addr = "b64(YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=)"

type Holding= {
    assetId: number
    assetContract: number
}

let client: algosdk.Algodv2 | undefined = undefined;
export function getAlgodClient(){
    if(client===undefined){
        const {token, server, port} = ps.algod
        client = new algosdk.Algodv2(token, server, port)
    }
    return client
}

let indexer: algosdk.Indexer | undefined = undefined;
export function getIndexer() {
    if(indexer===undefined){
        const {token, server, port} = ps.indexer
        indexer = new algosdk.Indexer(token, server, port)
    }
    return indexer
}

export async function getLogicFromTransaction(addr: string): Promise<LogicSigAccount | undefined> {
    const indexer = getIndexer()
    const txns = await indexer.searchForTransactions()
        .address(addr).do()

    for(let tidx in txns.transactions){
        const txn = txns.transactions[tidx]
        if(txn.sender == addr){
            const program_bytes = new Uint8Array(Buffer.from(txn.signature.logicsig.logic, "base64"));
            return new LogicSigAccount(program_bytes);
        }
    }
    return undefined
}

export async function isOptedIntoApp(address: string, app_id: number): Promise<boolean> {
    const client = getAlgodClient()
    const result = await client.accountInformation(address).do()
    const optedIn = result['apps-local-state'].find((r: { id: number; })=>{ return r.id == app_id })
    return optedIn !== undefined
}

export async function isOptedIntoAsset(address: string, idx: number): Promise<boolean> {
    const client = getAlgodClient()
    const result = await client.accountInformation(address).do()
    const optedIn = result['assets'].find((r: { [x: string]: number; })=>{ return r['asset-id'] == idx })
    return optedIn !== undefined
}

export async function getHolding(addr: string): Promise<Holding[] | undefined> {
    const client = getAlgodClient()
    const portfolio: Holding[] = [];
    let acct = undefined

    try{
        acct = await client.accountInformation(addr).do()
    }catch(error){
        return undefined
    }

    const np = []
    // TODO: load deployed assets from backend here
    const deployedAssets: any[] = []
    for(let aidx in acct['assets']) {
        // TODO: filter for assetIds in the deployed assets
        const ass: AssetHolding = acct['assets'][aidx]
        if (Number(ass.assetId) in deployedAssets) {
            const holding: Holding = {
                assetId: Number(ass.assetId),
                // TODO: add Contract id from deployed assets
                assetContract: Number(0)
            }
            portfolio.push();
        }
    }
    return portfolio
}

export async function getGlobalState(contractId: number){
    let client: algosdk.Algodv2 = getAlgodClient();
    let applicationInfoResponse = await client.getApplicationByID(contractId).do();
    let globalState = []
    if(applicationInfoResponse['params'].includes('global-state')) {
        globalState = applicationInfoResponse['params']['global-state']
    }
    return globalState
}

export async function readLocalState(addr: string, index: number){
    const client: algosdk.Algodv2 = getAlgodClient();
    let accountInfoResponse = await client.accountInformation(addr).do();
    for (let i = 0; i < accountInfoResponse['apps-local-state'].length; i++) {
        if (accountInfoResponse['apps-local-state'][i].id == index) {
            return accountInfoResponse['apps-local-state'][i]
        }
    }
}

export async function getSuggested(rounds: number){
    const client = getAlgodClient();
    const txParams = await client.getTransactionParams().do();
    return { ...txParams, lastRound: txParams['firstRound'] + rounds }
}


export function uintToB64(x: number): string {
    return Buffer.from(algosdk.encodeUint64(x)).toString('base64')
}

export function addrToB64(addr: string): string {
    if (addr == "" ){
        return dummy_addr
    }
    try {
        const dec = algosdk.decodeAddress(addr)
        return "b64("+Buffer.from(dec.publicKey).toString('base64')+")"
    }catch(err){
        return dummy_addr
    }
}
export function b64ToAddr(x: string){
    return algosdk.encodeAddress(new Uint8Array(Buffer.from(x, "base64")));
}

export async function sendWait(signed: any[]): Promise<any> {
    const client = getAlgodClient()

    try {
        const {txId}  = await client.sendRawTransaction(signed.map((t)=>{return t.blob})).do()
        // TODO: implement some kind of popup for showing waiting for blockchain network
        //showNetworkWaiting(txId)

        const result = await waitForConfirmation(client, txId, 3)
        //showNetworkSuccess(txId)

        return result
    } catch (error) {
        //showNetworkError("", error)
    }

    return undefined
}


export async function getTransaction(txid: string) {
    return await waitForConfirmation(getAlgodClient(), txid, 3)
}

export async function waitForConfirmation(algodclient: algosdk.Algodv2 | null, txId: string | null, timeout: number) {
    if (algodclient == null || txId == null || timeout < 0) {
      throw new Error('Bad arguments.');
    }

    const status = await algodclient.status().do();
    if (typeof status === 'undefined')
      throw new Error('Unable to get node status');

    const startround = status['last-round'] + 1;
    let currentround = startround;

    /* eslint-disable no-await-in-loop */
    while (currentround < startround + timeout) {
      const pending = await algodclient
        .pendingTransactionInformation(txId)
        .do();

      if (pending !== undefined) {
        if ( pending['confirmed-round'] !== null && pending['confirmed-round'] > 0)
          return pending;

        if ( pending['pool-error'] != null && pending['pool-error'].length > 0)
          throw new Error( `Transaction Rejected pool error${pending['pool-error']}`);
      }

      await algodclient.statusAfterBlock(currentround).do();
      currentround += 1;
    }

    /* eslint-enable no-await-in-loop */
    throw new Error(`Transaction not confirmed after ${timeout} rounds!`);
}
