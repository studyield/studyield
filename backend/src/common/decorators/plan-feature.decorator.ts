import { SetMetadata } from '@nestjs/common';

export const PLAN_FEATURE_KEY = 'plan_feature';

export interface PlanFeatureMeta {
  feature: string;
}

export const PlanFeature = (feature: string) =>
  SetMetadata(PLAN_FEATURE_KEY, { feature } as PlanFeatureMeta);
