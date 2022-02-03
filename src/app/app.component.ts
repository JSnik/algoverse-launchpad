import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isThemeChanged: boolean = false;

  changeTheme(value: boolean) {
    this.isThemeChanged = value;
    return this.isThemeChanged;
  }

  log() {
    console.log(1)
  }
}
