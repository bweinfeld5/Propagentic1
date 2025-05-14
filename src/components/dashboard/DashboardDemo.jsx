import React from 'react';
import DashboardCard from './DashboardCard';
import StatsChart from './StatsChart';
import AnimatedDashboardStats from './AnimatedDashboardStats';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import { BuildingOfficeIcon, WrenchScrewdriverIcon, ClockIcon, ExclamationTriangleIcon, PlusCircleIcon, UserPlusIcon, ArrowPathIcon, CogIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const DashboardDemo = () => {
  // Sample data for charts
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Maintenance Requests',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: '#14B8A6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  const barChartData = {
    labels: ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Other'],
    datasets: [
      {
        label: 'Open Requests',
        data: [5, 3, 2, 4, 1, 2],
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: '#8B5CF6',
        borderWidth: 1
      }
    ]
  };
  
  // Sample data for smaller trend charts in stats cards
  const trendData1 = {
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    datasets: [{
      data: [3, 7, 5, 9, 6, 8, 10],
      borderColor: 'rgb(10, 179, 172)',
      backgroundColor: 'rgba(10, 179, 172, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 2
    }]
  };
  
  const trendData2 = {
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    datasets: [{
      data: [8, 9, 12, 10, 7, 5, 4],
      borderColor: 'rgb(23, 140, 249)',
      backgroundColor: 'rgba(23, 140, 249, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 2
    }]
  };
  
  const trendData3 = {
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    datasets: [{
      data: [5, 4, 6, 7, 9, 7, 8],
      borderColor: 'rgb(4, 184, 81)',
      backgroundColor: 'rgba(4, 184, 81, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 2
    }]
  };
  
  const trendData4 = {
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    datasets: [{
      data: [2, 1, 3, 5, 4, 7, 9],
      borderColor: 'rgb(255, 184, 0)',
      backgroundColor: 'rgba(255, 184, 0, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 2
    }]
  };
  
  const mockRequests = [
    { id: 'MR-1024', issue: 'Leaking kitchen faucet', property: 'Sunset Apartments #304', tenant: 'John Smith', status: 'In Progress', date: '2023-06-10', description: 'Leaking kitchen faucet', location: 'Sunset Apartments #304' },
    { id: 'MR-1023', issue: 'Heating not working', property: 'Oakwood Terrace #201', tenant: 'Maria Garcia', status: 'New', date: '2023-06-09', description: 'Heating not working', location: 'Oakwood Terrace #201' },
    { id: 'MR-1022', issue: 'Broken dishwasher', property: 'Lakeside Manor #502', tenant: 'Robert Johnson', status: 'Completed', date: '2023-06-08', description: 'Broken dishwasher', location: 'Lakeside Manor #502' },
    { id: 'MR-1021', issue: 'Electrical outlet not working', property: 'Maple Heights #105', tenant: 'Sarah Williams', status: 'In Progress', date: '2023-06-07', description: 'Electrical outlet not working', location: 'Maple Heights #105' },
    { id: 'MR-1020', issue: 'Bathroom ceiling leak', property: 'Sunset Apartments #201', tenant: 'James Wilson', status: 'Urgent', date: '2023-06-06', description: 'Bathroom ceiling leak', location: 'Sunset Apartments #201' },
  ];
  
  return (
    <div className="space-y-8">
      {/* Stats Overview Section */}
      <section>
        <h2 className="text-2xl font-semibold text-content dark:text-content-dark mb-6">
          Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedDashboardStats 
            title="Total Maintenance Requests"
            value={87}
            previousValue={75}
            percentageChange={16}
            description="vs. last month"
            chartData={trendData1}
            theme="primary"
            delay={0}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          
          <AnimatedDashboardStats 
            title="Active Tenants"
            value={42}
            previousValue={36}
            percentageChange={16.7}
            description="vs. last month"
            chartData={trendData2}
            theme="secondary"
            delay={0.1}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          
          <AnimatedDashboardStats 
            title="Resolved Requests"
            value={64}
            previousValue={52}
            percentageChange={23.1}
            description="vs. last month"
            chartData={trendData3}
            theme="success"
            delay={0.2}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <AnimatedDashboardStats 
            title="Average Response Time"
            value={8}
            previousValue={12}
            percentageChange={-33.3}
            description="vs. last month"
            chartData={trendData4}
            theme="warning"
            delay={0.3}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </section>
      
      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Maintenance Requests Trend"
          theme="primary"
          animate
          delay={0.4}
        >
          <div className="h-80">
            <StatsChart 
              type="line"
              data={lineChartData}
              height={300}
              animate
            />
          </div>
        </DashboardCard>
        
        <DashboardCard
          title="Requests by Category"
          theme="secondary"
          animate
          delay={0.5}
        >
          <div className="h-80">
            <StatsChart 
              type="bar"
              data={barChartData}
              height={300}
              animate
            />
          </div>
        </DashboardCard>
      </section>
      
      {/* Recent Requests Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-content dark:text-content-dark">
            Recent Requests
          </h2>
          <Button variant="ghost" size="sm" icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
            View All
          </Button>
        </div>
        
        <div className="bg-background dark:bg-background-darkSubtle rounded-xl shadow overflow-hidden border border-border dark:border-border-dark">
          <table className="min-w-full divide-y divide-border dark:divide-border-dark">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Issue</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Property</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Tenant</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-background dark:bg-background-darkSubtle divide-y divide-border dark:divide-border-dark">
              {mockRequests.map((request, index) => (
                <tr key={request.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary dark:text-primary-light">{request.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-content dark:text-content-dark">{request.issue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-content dark:text-content-dark">{request.property}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-content dark:text-content-dark">{request.tenant}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusPill status={request.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary dark:text-content-darkSecondary">{request.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Maintenance Feed - Apply theme */}
      <div className="md:col-span-2 bg-background dark:bg-background-darkSubtle p-6 rounded-lg shadow border border-border dark:border-border-dark">
        <h2 className="text-lg font-semibold text-content dark:text-content-dark mb-4">Maintenance Feed</h2>
        <div className="space-y-4">
          {mockRequests.map(req => (
            <div key={req.id} className="p-4 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-content dark:text-content-dark">{req.description}</p>
                <StatusPill status={req.status} />
              </div>
              <p className="text-xs text-content-secondary dark:text-content-darkSecondary mb-3">{req.location}</p>
              <div className="flex justify-between items-center text-xs text-content-subtle dark:text-content-darkSubtle">
                <span>Submitted: {req.date}</span>
                {/* Use Button component */}
                <Button variant="ghost" size="xs" className="text-primary dark:text-primary-light">View Details</Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full">View All Requests</Button>
      </div>

      {/* Quick Actions - Apply theme */}
      <div className="md:col-span-1 bg-background dark:bg-background-darkSubtle p-6 rounded-lg shadow border border-border dark:border-border-dark">
        <h2 className="text-lg font-semibold text-content dark:text-content-dark mb-4">Quick Actions</h2>
        <div className="space-y-3">
          <Button variant="primary" fullWidth icon={<PlusCircleIcon className="w-5 h-5"/>}>New Maintenance Request</Button>
          <Button variant="outline" fullWidth icon={<UserPlusIcon className="w-5 h-5"/>}>Add New Tenant</Button>
          <Button variant="outline" fullWidth icon={<ArrowPathIcon className="w-5 h-5"/>}>Generate Report</Button>
          <Button variant="ghost" fullWidth className="text-primary dark:text-primary-light" icon={<CogIcon className="w-5 h-5"/>}>Settings</Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardDemo; 