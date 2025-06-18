import { VerificationStatus } from "../../models";

interface VerificationStatusPillProps {
  status: VerificationStatus;
  className?: string;
}

const statusColors: Record<VerificationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  requires_review: 'bg-blue-100 text-blue-800 border-blue-300',
};

const VerificationStatusPill: React.FC<VerificationStatusPillProps> = ({ status, className = '' }) => {
  const colorClasses = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colorClasses} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default VerificationStatusPill; 