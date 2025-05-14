import type { User } from '../models/schema';

declare interface DataServiceInterface {
  isDemoMode: boolean;
  currentUser: { uid: string; displayName?: string } | null;
  configure: (config: { isDemoMode: boolean; currentUser: any }) => void;
  [key: string]: any;
}

declare const dataService: DataServiceInterface;

export default dataService; 