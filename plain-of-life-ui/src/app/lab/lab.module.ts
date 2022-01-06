import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { ModelModule } from '../model/model.module'
import { LabComponent } from './lab.component'

@NgModule({
  imports: [ModelModule, BrowserModule],
  declarations: [LabComponent],
  exports: [LabComponent]
})
export class LabModule {}
