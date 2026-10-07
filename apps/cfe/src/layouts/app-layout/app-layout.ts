import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomTabBar } from '../../shared/bottom-tab-bar/bottom-tab-bar';
import { Footer } from '../../shared/footer/footer';
import { SlimTopBar } from '../../shared/slim-top-bar/slim-top-bar';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SlimTopBar, BottomTabBar, Footer],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {}
