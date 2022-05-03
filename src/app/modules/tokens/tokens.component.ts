import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { platform_settings as ps } from 'src/app/blockchain/platform-conf';
import { DeployedApp } from 'src/app/blockchain/deployer_application';
import { BlockchainInformation } from 'src/app/blockchain/platform-conf';
import { ProjectPreviewModel } from 'src/app/models/projectPreview.model';
import { projectReqService } from 'src/app/services/APIs/project-req.service';
import { VerseApp } from 'src/app/blockchain/verse_application';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class TokensComponent implements OnInit {

  

  arr: [ProjectPreviewModel, BlockchainInformation][] = [];

  public isActiveFirst: boolean = false;
  public isActiveSecond: boolean = false;

  searchInput = this.fb.control([]);

  constructor(
    private projectsReqService: projectReqService,
    private fb: FormBuilder,
    private deployedApp: DeployedApp,
    private verseApp: VerseApp
  ) { }

  ngOnInit(): void {
    this.projectsReqService.getAllProjects('a-z', 1).subscribe(
      (res) => {
        this.arr = []
        res.forEach(async element => {
          if(element.asset.assetId == ps.platform.verse_asset_id) {
            let bcInfo = await this.verseApp.getBlockchainInformation();
            this.arr.push([element, bcInfo])
          } else {
            let bcInfo = await this.deployedApp.getBlockchainInformation(element.asset.contractId)
            this.arr.push([element, bcInfo])
          }
        });
        console.log(this.arr);
      }
    )
    this.isActiveFirst = true;
  }

  activeFirst() {
    this.isActiveFirst = true;
    this.isActiveSecond = false;
  }

  activeSecond() {
    this.isActiveSecond = true;
    this.isActiveFirst = false;
  }

  copyContentToClipboard(content: HTMLElement) {
    navigator.clipboard.writeText(content.innerText);
  }

}
