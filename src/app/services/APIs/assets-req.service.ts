import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AssetViewModel } from 'src/app/models/assetView.model';

@Injectable({
  providedIn: 'root',
})
export class AssetReqService {
  private baseUrl = environment.baseUrl;

  constructor(private _http: HttpClient) {}

  getAssetPairs(
    all: boolean = false,
    search: string = '',
    wallet: string = ''
  ) {
    const url = `${this.baseUrl}/asset/get/pairs`;
    return this._http.get<AssetViewModel[]>(url, {
      params: {
        wallet: wallet,
        search: search,
        all: all,
      },
    });
  }

  getAssetFavorites(wallet: string | any) {
    const url = `${this.baseUrl}/asset/get/favorites`;
    return this._http.get<AssetViewModel[]>(url, {
      params: {
        wallet: wallet,
      },
    });
  }

  addFavoriteAsset(assetId: number, wallet: string) {
    const url = `${this.baseUrl}/asset/favorites/add`;
    return this._http.get(url, {
      params: {
        assetId: assetId,
        wallet: wallet,
      },
    });
  }

  removeFavoriteAsset(assetId: number, wallet: string) {
    const url = `${this.baseUrl}/asset/favorites/remove`;
    return this._http.get(url, {
      params: {
        assetId: assetId,
        wallet: wallet,
      },
    });
  }

  removeMaxBuy(assetId: number) {
    const url = `${this.baseUrl}/asset/remove/maxBuy`;
    return this._http.post(url, {
      params: {
        assetId: assetId,
      },
    });
  }
}

//   getUserByWallet(wallet: string | any): Observable<User> {
//     const url = `${this.baseUrl}/user/get/byWallet`;
//     return this._http.get<User>(url, {
//       params: {
//         wallet: wallet
//       }
//     })
//   }
