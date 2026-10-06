export interface StoreItem {
  name: string;
  price: string;
  description: string;
  image: string;
}

// Shown in the "Loja Online" preview until the store exists.
export const STORE_ITEMS: StoreItem[] = [
  {
    name: 'Camisola Principal',
    price: '35€',
    description:
      'Camisola oficial amarela e preta. Tecido respirável e confortável para o dia-a-dia ou para apoiar nas bancadas.',
    image: 'assets/equip1.jpg',
  },
  {
    name: 'Camisola Alternativa',
    price: '35€',
    description:
      'Equipamento alternativo em azul. Design moderno com os detalhes clássicos dos Canarinhos.',
    image: 'assets/equip2.jpg',
  },
  {
    name: 'Cachecol Oficial',
    price: '15€',
    description: 'Cachecol oficial do clube para sentires as cores de perto em todos os jogos.',
    image: 'assets/scarf.webp',
  },
];
