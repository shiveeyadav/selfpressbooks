import { BINDINGS, PAPER_TYPES, TRIM_SIZES } from '@/config/pricing';

export const trimLabel = (v: string) => TRIM_SIZES.find((t) => t.value === v)?.label ?? v;
export const paperLabel = (v: string) => PAPER_TYPES.find((t) => t.value === v)?.label ?? v;
export const bindingLabel = (v: string) => BINDINGS.find((t) => t.value === v)?.label ?? v;

export const BOOK_STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending review',
  approved: 'Approved – on sale',
  rejected: 'Not approved',
};
