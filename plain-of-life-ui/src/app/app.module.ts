import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'
import { LabModule } from './lab/lab.module'
import { LogService } from './log.service'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, LabModule],
  providers: [LogService],
  bootstrap: [AppComponent]
})
export class AppModule {}
