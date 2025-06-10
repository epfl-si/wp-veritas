import { TYPES } from '@/constants/types';

export type TypeType = (typeof TYPES)[keyof typeof TYPES];
