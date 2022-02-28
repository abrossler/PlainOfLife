import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { ModelModule } from '../model/model.module'
import { PolLabComponent } from './pol_lab.component'

@NgModule({
  imports: [ModelModule, BrowserModule],
  declarations: [PolLabComponent],
  exports: [PolLabComponent]
})
export class PolLabModule {}
