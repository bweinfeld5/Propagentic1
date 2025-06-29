import React from 'react';
import {
  UsersIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import StatCard from '../landlord/StatCard';

// Type the StatCard component to avoid TypeScript issues
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  variant?: string;
}

interface AdminStats {
  totalUsers: number;
  totalLandlords: number;
  totalTenants: number;
  totalContractors: number;
  activeProperties: number;
  pendingRequests: number;
  criticalAlerts: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

interface AdminStatsCardsProps {
  stats: AdminStats;
  isLoading: boolean;
}

const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ stats, isLoading }) => {
  const getSystemHealthVariant = (health: string) => {
    switch (health) {
      case 'good':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const statsConfig: StatCardProps[] = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: UsersIcon,
      variant: 'primary'
    },
    {
      title: 'Landlords',
      value: stats.totalLandlords.toLocaleString(),
      icon: UserGroupIcon,
      variant: 'info'
    },
    {
      title: 'Tenants',
      value: stats.totalTenants.toLocaleString(),
      icon: UserGroupIcon,
      variant: 'secondary'
    },
    {
      title: 'Contractors',
      value: stats.totalContractors.toLocaleString(),
      icon: WrenchScrewdriverIcon,
      variant: 'neutral'
    },
    {
      title: 'Active Properties',
      value: stats.activeProperties.toLocaleString(),
      icon: BuildingOfficeIcon,
      variant: 'success'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests.toLocaleString(),
      icon: ExclamationTriangleIcon,
      variant: stats.pendingRequests > 10 ? 'warning' : 'neutral'
    },
    {
      title: 'Critical Alerts',
      value: stats.criticalAlerts.toLocaleString(),
      icon: ExclamationTriangleIcon,
      variant: stats.criticalAlerts > 0 ? 'danger' : 'success'
    },
    {
      title: 'System Health',
      value: stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1),
      icon: stats.systemHealth === 'good' ? ShieldCheckIcon : 
            stats.systemHealth === 'warning' ? ExclamationTriangleIcon : 
            ShieldCheckIcon,
      variant: getSystemHealthVariant(stats.systemHealth)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, index) => {
        const StatCardComponent = StatCard as any;
        return (
          <div key={index} className={isLoading ? 'animate-pulse' : ''}>
            <StatCardComponent
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              variant={stat.variant}
            />
          </div>
        );
      })}
    </div>
  );
};

export default AdminStatsCards; 