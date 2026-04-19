export type GraphicStyle = 'editorial' | 'flat' | 'organico' | 'tech' | 'brutalism' | 'minimalista'
export type ToneOfVoice = 'inspiracional' | 'educativo' | 'descontraido' | 'autoritativo' | 'empatico' | 'provocativo'

export interface BrandPalette {
  primary: string
  secondary: string
  accent: string
  text: string
}

export interface BrandVisual {
  palette: BrandPalette
  typography: { display: string | null; body: string | null }
  graphic_style: GraphicStyle
  recurring_elements: string
}

export interface Brand {
  id: string
  owner_id: string
  client_id: string | null
  name: string
  slug: string
  niche: string | null
  target_audience: string | null
  tone_of_voice: ToneOfVoice | null
  visual: BrandVisual
  assets: { logo_primary: string | null; logo_mono: string | null; brand_guide_pdf: string | null; reference_images: string[] }
  content_strategy: { pillars: string[]; banned_words: string[]; preferred_hashtags: string[]; cta_style: string | null }
  is_active: boolean
  created_at: string
  updated_at: string
}

export const DEFAULT_BRAND_VISUAL: BrandVisual = {
  palette: { primary: '#1a1a2e', secondary: '#e94560', accent: '#f5f5f5', text: '#ffffff' },
  typography: { display: null, body: null },
  graphic_style: 'minimalista',
  recurring_elements: '',
}
