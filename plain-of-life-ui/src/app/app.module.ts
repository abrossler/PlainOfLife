import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { LabModule } from './lab/lab.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    LabModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
