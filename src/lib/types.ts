export interface Article {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  hero_image_url?: string;
  published_at: string;
  created_at?: string;
  updated_at?: string;
  category: { name: string; slug: string } | null;
  tags?: Tag[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id?: string;
  name: string;
  slug: string;
}
