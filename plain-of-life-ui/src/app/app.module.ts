import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'
import { PolLabModule } from './pol_lab/pol_lab.module'
import { LogService } from './log.service'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, PolLabModule],
  providers: [LogService],
  bootstrap: [AppComponent]
})
export class AppModule {}
