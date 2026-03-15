/**
 * Servicialo v0.8 — Provider Profile & Discoverable Attributes
 * TypeScript types and Zod schemas for the MCP server.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. Enums
// ---------------------------------------------------------------------------

export const AttributeCategory = z.enum([
  'identity',
  'capability',
  'availability',
  'geography',
  'economic',
  'trust',
]);

export const AttributeOrigin = z.enum(['declared', 'verified', 'inferred']);

export const AttributeVisibility = z.enum(['public', 'unlisted', 'private']);

// ---------------------------------------------------------------------------
// 2. Provider Attribute
// ---------------------------------------------------------------------------

export const ProviderAttributeSchema = z.object({
  attribute_id: z.string().uuid(),
  provider_id: z.string(),
  category: AttributeCategory,
  key: z.string(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.record(z.unknown()), // for structured values like coordinates, price_range
  ]),
  origin: AttributeOrigin,
  confidence: z.number().min(0).max(1).optional()
    .describe('Required for inferred attributes. Statistical confidence 0.0–1.0.'),
  evidence_count: z.number().int().optional()
    .describe('Number of data points supporting an inferred attribute.'),
  verified_by: z.string().optional()
    .describe('Entity that confirmed a verified attribute.'),
  verified_at: z.string().datetime().optional(),
  visibility: AttributeVisibility,
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
  version: z.number().int().min(1),
  updated_at: z.string().datetime(),
});

export type ProviderAttribute = z.infer<typeof ProviderAttributeSchema>;

// ---------------------------------------------------------------------------
// 3. Provider Profile
// ---------------------------------------------------------------------------

export const ProviderProfileSchema = z.object({
  profile_id: z.string().uuid(),
  provider_id: z.string(),
  organization_id: z.string(),
  display_name: z.string(),
  slug: z.string(),
  attributes: z.array(ProviderAttributeSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.number().int().min(1),
});

export type ProviderProfile = z.infer<typeof ProviderProfileSchema>;

// ---------------------------------------------------------------------------
// 4. Matching Query
// ---------------------------------------------------------------------------

export const MatchQuerySchema = z.object({
  conditions: z.array(z.string()).min(1)
    .describe('Conditions/diagnoses to match against provider capabilities.'),
  population: z.string().optional()
    .describe('Target population segment (e.g., postpartum, elderly, pediatric).'),
  modality: z.enum(['in_person', 'virtual', 'home_visit']).optional()
    .describe('Preferred service delivery modality.'),
  geography: z.object({
    city: z.string().optional(),
    district: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    max_distance_km: z.number().positive().optional(),
  }).optional()
    .describe('Geographic criteria for provider matching.'),
  insurance: z.string().optional()
    .describe('Insurance type to filter by (e.g., fonasa, isapre_banmedica).'),
  max_wait_days: z.number().int().positive().optional()
    .describe('Maximum acceptable wait time in days.'),
  language: z.string().optional()
    .describe('Preferred language (ISO 639-1).'),
});

export type MatchQuery = z.infer<typeof MatchQuerySchema>;

export const PatientContextSchema = z.object({
  age: z.number().int().min(0).optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  weeks_postpartum: z.number().int().min(0).optional(),
  conditions: z.array(z.string()).optional()
    .describe('Known conditions/diagnoses.'),
  referral_source: z.string().optional()
    .describe('Where the referral came from.'),
}).optional();

export type PatientContext = z.infer<typeof PatientContextSchema>;

// ---------------------------------------------------------------------------
// 5. Match Result
// ---------------------------------------------------------------------------

export const MatchBreakdownSchema = z.object({
  conditions: z.object({
    score: z.number(),
    origin: AttributeOrigin,
    confidence: z.number().optional(),
  }).optional(),
  population: z.object({
    score: z.number(),
    origin: AttributeOrigin,
    confidence: z.number().optional(),
  }).optional(),
  geography: z.object({
    score: z.number(),
    origin: AttributeOrigin,
    distance_km: z.number().optional(),
  }).optional(),
  availability: z.object({
    score: z.number(),
    origin: AttributeOrigin,
    next_available: z.string().datetime().optional(),
  }).optional(),
  insurance: z.object({
    score: z.number(),
    origin: AttributeOrigin,
  }).optional(),
  trust: z.object({
    score: z.number(),
    rating: z.number().optional(),
    services_completed: z.number().optional(),
  }).optional(),
});

export type MatchBreakdown = z.infer<typeof MatchBreakdownSchema>;

export const MatchResultSchema = z.object({
  provider_id: z.string(),
  display_name: z.string(),
  organization_id: z.string(),
  compatibility_score: z.number().min(0).max(1),
  match_breakdown: MatchBreakdownSchema,
  profile_url: z.string().url().optional(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

export const MatchResponseSchema = z.object({
  results: z.array(MatchResultSchema),
  query_metadata: z.object({
    total_matches: z.number().int(),
    returned: z.number().int(),
    staleness_warnings: z.array(z.string()),
  }),
});

export type MatchResponse = z.infer<typeof MatchResponseSchema>;

// ---------------------------------------------------------------------------
// 6. JSON-LD serialization helper type
// ---------------------------------------------------------------------------

export interface ProviderProfileJsonLd {
  '@context': Record<string, string>;
  '@type': string[];
  '@id': string;
  name: string;
  description?: string;
  medicalSpecialty?: {
    '@type': 'MedicalSpecialty';
    name: string;
  };
  availableService?: Array<{
    '@type': string;
    name: string;
    procedureType?: string;
  }>;
  areaServed?: {
    '@type': 'City';
    name: string;
    containedInPlace?: {
      '@type': 'AdministrativeArea';
      name: string;
    };
  };
  address?: {
    '@type': 'PostalAddress';
    addressLocality?: string;
    addressRegion?: string;
    addressCountry?: string;
  };
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  priceRange?: string;
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
    bestRating: number;
  };
  'servicialo:trustMetrics'?: Record<string, number>;
  'servicialo:capabilities'?: {
    conditionsTreated?: string[];
    populationsServed?: string[];
    techniques?: string[];
  };
}

// ---------------------------------------------------------------------------
// 7. Attribute key constants — typed taxonomy
// ---------------------------------------------------------------------------

/** Protocol-defined attribute keys per category */
export const ATTRIBUTE_KEYS = {
  identity: [
    'profession',
    'primary_specialty',
    'subspecialties',
    'title',
    'training_institution',
    'license_number',
    'license_jurisdiction',
    'years_experience',
    'languages',
    'bio',
    'photo_url',
  ],
  capability: [
    'conditions_treated',
    'techniques',
    'populations_served',
    'age_range',
    'contraindications',
    'typical_session_count',
    'outcome_metrics',
  ],
  availability: [
    'modalities',
    'typical_hours',
    'avg_wait_days',
    'next_available',
    'accepts_new_patients',
    'max_daily_sessions',
  ],
  geography: [
    'country',
    'region',
    'city',
    'district',
    'address',
    'coordinates',
    'service_radius_km',
    'remote_policy',
  ],
  economic: [
    'price_range',
    'insurance_accepted',
    'payment_methods',
    'cancellation_policy',
    'cancellation_window_hours',
    'offers_packages',
  ],
  trust: [
    'rating_avg',
    'rating_count',
    'cancellation_rate',
    'no_show_rate',
    'response_time_hours',
    'platform_tenure_months',
    'services_completed',
    'repeat_client_rate',
  ],
} as const;

export type AttributeCategoryKey = keyof typeof ATTRIBUTE_KEYS;
export type AttributeKey<C extends AttributeCategoryKey> = (typeof ATTRIBUTE_KEYS)[C][number];
