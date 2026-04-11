import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'cui-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spinner {
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  color = input<string>('#fff');
  label = input<string>();
  fullscreen = input<boolean>(false);

  protected containerClasses() {
    return 'flex flex-col items-center justify-center gap-4';
  }

  protected spinnerClasses() {
    const baseClasses = 'cui-spinner rounded-full border-solid border-white/30';

    const sizeClasses = {
      sm: 'w-5 h-5 border-2',
      md: 'w-8 h-8 border-[3px]',
      lg: 'w-12 h-12 border-4',
      xl: 'w-16 h-16 border-[5px]',
    };

    return `${baseClasses} ${sizeClasses[this.size()]}`;
  }
}
