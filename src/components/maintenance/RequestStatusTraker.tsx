import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { 
  MaintenanceRequest, 
  MaintenanceStatus, 
  MaintenancePriority,
  UserRole
} from '../../models';
import { maintenanceRequestConverter } from '../../models/converters';
import StatusPill from '../ui/StatusPill';
import ActionFeedback from '../ui/ActionFeedback'; 