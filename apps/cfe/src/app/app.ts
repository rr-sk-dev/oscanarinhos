import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppUpdateService } from '../shared/app-update.service';
import { ThemeService } from '../shared/theme.service';
import { UpdateBanner } from '../shared/update-banner/update-banner';

@Component({
  imports: [RouterOutlet, UpdateBanner],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  // Instantiated at startup so the stored theme is applied before any page renders.
  protected readonly theme = inject(ThemeService);
  protected readonly appUpdate = inject(AppUpdateService);
}
