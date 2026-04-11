import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'cui-content-card',
  imports: [RouterLink],
  templateUrl: './content-card.html',
  styleUrl: './content-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentCard {
  // Content
  image = input<string>();
  imageAlt = input<string>('');
  date = input<string>();
  title = input.required<string>();
  description = input<string>();

  // CTA
  ctaText = input<string>('Ler Mais');
  ctaUrl = input<string>();

  // Styling
  truncateDescription = input(true);
  maxLines = input(3);

  // Events
  cardClick = output<void>();

  // Handle card click (only if no ctaUrl)
  protected onCardClick(): void {
    if (!this.ctaUrl()) {
      this.cardClick.emit();
    }
  }

  // Handle CTA click
  protected onCtaClick(event: Event): void {
    if (!this.ctaUrl()) {
      event.stopPropagation();
      this.cardClick.emit();
    }
  }
}
