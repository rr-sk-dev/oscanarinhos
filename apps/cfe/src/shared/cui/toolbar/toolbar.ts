import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cui-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbar {}
