import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { SvgIcon } from '../svg-icon/svg-icon';

@Component({
  selector: 'cui-search-input',
  imports: [SvgIcon],
  templateUrl: './search-input.html',
  styleUrl: './search-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  value = input<string>('');
  placeholder = input<string>('Search...');
  disabled = input<boolean>(false);
  debounceTime = input<number>(300);

  valueChange = output<string>();
  searchChange = output<string>();

  showClearButton = computed(() => this.value().length > 0 && !this.disabled());

  private searchSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(this.debounceTime()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.searchChange.emit(value);
      });
  }

  onInput(event: Event): void {
    const { value } = event.target as HTMLInputElement;
    this.valueChange.emit(value);
    this.searchSubject.next(value);
  }

  onFocus(): void {}

  onBlur(): void {}

  clear(): void {
    this.valueChange.emit('');
    this.searchSubject.next('');
  }
}
