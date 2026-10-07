import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../shared/theme.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Instantiated at startup so the stored theme is applied before any page renders.
  protected readonly theme = inject(ThemeService);
}
