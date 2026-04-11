export class TestimonialEntity {
  id: string;
  quote: string;
  author: string;
  role: string;
  initials: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTestimonialData = Omit<TestimonialEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTestimonialData = Partial<Omit<TestimonialEntity, 'id' | 'createdAt' | 'updatedAt'>>;
