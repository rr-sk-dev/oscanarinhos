import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Modal } from '@canarinhos/ngx-cui';

interface StoreItem {
  name: string;
  /** Euros. */
  price: number;
  description: string;
  image: string;
}

// Shown in the "Loja Online" preview until the store exists.
const STORE_ITEMS: StoreItem[] = [
  {
    name: 'Camisola Principal',
    price: 35,
    description:
      'Camisola oficial amarela e preta. Tecido respirável e confortável para o dia-a-dia ou para apoiar nas bancadas.',
    image: 'assets/equip1.jpg',
  },
  {
    name: 'Camisola Alternativa',
    price: 35,
    description:
      'Equipamento alternativo em azul. Design moderno com os detalhes clássicos dos Canarinhos.',
    image: 'assets/equip2.jpg',
  },
  {
    name: 'Cachecol Oficial',
    price: 15,
    description: 'Cachecol oficial do clube para sentires as cores de perto em todos os jogos.',
    image: 'assets/scarf.webp',
  },
];

/** "Loja Online" teaser card that opens a preview of the merchandise. */
@Component({
  selector: 'app-store-preview',
  imports: [Modal, CurrencyPipe, NgOptimizedImage],
  templateUrl: './store-preview.html',
  styleUrl: './store-preview.css',
})
export class StorePreview {
  protected readonly items = STORE_ITEMS;
  protected readonly modalOpen = signal(false);
}
