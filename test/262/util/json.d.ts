export type Json =
  | Json[]
  | { [key: string]: Json }
  | boolean
  | null
  | number
  | string;
