import { MaintenanceStatus } from "../../models";

interface StatusPillProps {
  status: MaintenanceStatus;
  className?: string;
}

const statusColors: Record<MaintenanceStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800 border-blue-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  'on-hold': 'bg-gray-100 text-gray-800 border-gray-300',
  scheduled: 'bg-purple-100 text-purple-800 border-purple-300',
  requires_parts: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  pending_approval: 'bg-pink-100 text-pink-800 border-pink-300',
};

const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  const colorClasses = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colorClasses} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusPill; 