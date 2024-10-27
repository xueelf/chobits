import { type TotteInstance } from 'totte';
import gateway from './gateway';
import groups from './groups';
import users from './users';

export interface ErrorData {
  message: string;
  code: number;
  err_code: number;
  trace_id: string;
}

export function useApi(request: TotteInstance) {
  return {
    ...gateway(request),
    ...groups(request),
    ...users(request),
  };
}
