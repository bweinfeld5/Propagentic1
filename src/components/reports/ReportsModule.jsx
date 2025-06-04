import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  FunnelIcon,
  PrinterIcon,
  DocumentTextIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { useAuth } from '../../context/AuthContext';
import { useDemoMode } from '../../context/DemoModeContext';
import dataService from '../../services/dataService';

/**
 * Advanced Reporting & Analytics Module
 * Phase 1.2 Implementation with Live Firestore Data
 */
const ReportsModule = () => {
  const { currentUser, userProfile } = useAuth();
  const { isDemoMode } = useDemoMode();
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [properties, setProperties] = useState([]);
  const reportRef = useRef(null);

  // Load data when component mounts or filters change
  useEffect(() => {
    loadReportData();
  }, [currentUser, userProfile, dateRange, selectedProperty, isDemoMode]);

  const loadReportData = async () => {
    if (!currentUser || !userProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Configure dataService
      dataService.configure({ 
        isDemoMode, 
        currentUser,
        userType: userProfile.userType || 'landlord'
      });

      // Load properties for filter dropdown
      const propertiesData = await dataService.getPropertiesForCurrentLandlord();
      setProperties(propertiesData);

      // Load analytics data
      const analyticsData = await dataService.getAnalyticsData({
        dateRange,
        propertyId: selectedProperty
      });

      setReportData(analyticsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading report data:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Mock data for reports
  const mockReportData = {
    propertyPerformance: [
      { property: 'Sunset Apartments', revenue: 36000, expenses: 12000, occupancy: 92, units: 24 },
      { property: 'Downtown Lofts', revenue: 26400, expenses: 8000, occupancy: 100, units: 12 },
      { property: 'Garden Complex', revenue: 43200, expenses: 15000, occupancy: 78, units: 36 },
      { property: 'City Heights', revenue: 28800, expenses: 9500, occupancy: 85, units: 18 }
    ],
    monthlyRevenue: [
      { month: 'Jan', revenue: 125000, expenses: 45000, profit: 80000 },
      { month: 'Feb', revenue: 132000, expenses: 48000, profit: 84000 },
      { month: 'Mar', revenue: 128000, expenses: 52000, profit: 76000 },
      { month: 'Apr', revenue: 135000, expenses: 49000, profit: 86000 },
      { month: 'May', revenue: 142000, expenses: 51000, profit: 91000 },
      { month: 'Jun', revenue: 138000, expenses: 47000, profit: 91000 }
    ],
    maintenanceCosts: [
      { category: 'Plumbing', cost: 8500, requests: 24, avgCost: 354 },
      { category: 'Electrical', cost: 6200, requests: 18, avgCost: 344 },
      { category: 'HVAC', cost: 12400, requests: 15, avgCost: 827 },
      { category: 'General', cost: 4800, requests: 32, avgCost: 150 },
      { category: 'Appliances', cost: 7200, requests: 12, avgCost: 600 }
    ],
    occupancyTrends: [
      { month: 'Jan', occupied: 78, vacant: 12 },
      { month: 'Feb', occupied: 82, vacant: 8 },
      { month: 'Mar', occupied: 85, vacant: 5 },
      { month: 'Apr', occupied: 87, vacant: 3 },
      { month: 'May', occupied: 88, vacant: 2 },
      { month: 'Jun', occupied: 90, vacant: 0 }
    ],
    tenantAnalytics: [
      { segment: 'Long-term (>2 years)', count: 45, percentage: 50 },
      { segment: 'Medium-term (1-2 years)', count: 27, percentage: 30 },
      { segment: 'Short-term (<1 year)', count: 18, percentage: 20 }
    ]
  };

  // Available reports
  const reports = [
    {
      id: 'overview',
      title: 'Portfolio Overview',
      icon: ChartBarIcon,
      description: 'Complete overview of your property portfolio performance'
    },
    {
      id: 'financial',
      title: 'Financial Performance',
      icon: CurrencyDollarIcon,
      description: 'Revenue, expenses, and profit analysis across properties'
    },
    {
      id: 'maintenance',
      title: 'Maintenance Analytics',
      icon: WrenchScrewdriverIcon,
      description: 'Maintenance costs, trends, and efficiency metrics'
    },
    {
      id: 'occupancy',
      title: 'Occupancy Analysis',
      icon: HomeIcon,
      description: 'Occupancy rates, vacancy trends, and tenant retention'
    },
    {
      id: 'tenant',
      title: 'Tenant Analytics',
      icon: UsersIcon,
      description: 'Tenant demographics, lease terms, and satisfaction metrics'
    }
  ];

  // Export functions
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`PropAgentic-${reports.find(r => r.id === selectedReport)?.title}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
    setIsExporting(false);
  };

  const exportToCSV = () => {
    if (!reportData) return;
    
    let csvData = [];
    let filename = '';
    
    switch (selectedReport) {
      case 'overview':
      case 'financial':
        csvData = (reportData.propertyPerformance || []).map(item => ({
          Property: item.property,
          Revenue: item.revenue,
          Expenses: item.expenses,
          'Net Income': item.revenue - item.expenses,
          'Occupancy Rate': `${item.occupancy}%`,
          Units: item.units
        }));
        filename = 'property-performance';
        break;
      case 'maintenance':
        csvData = (reportData.maintenanceCosts || []).map(item => ({
          Category: item.category,
          'Total Cost': item.cost,
          'Request Count': item.requests,
          'Average Cost': item.avgCost
        }));
        filename = 'maintenance-costs';
        break;
      case 'occupancy':
        csvData = (reportData.occupancyTrends || []).map(item => ({
          Month: item.month,
          'Occupied Units': item.occupied,
          'Vacant Units': item.vacant,
          'Occupancy Rate': `${((item.occupied / (item.occupied + item.vacant)) * 100).toFixed(1)}%`
        }));
        filename = 'occupancy-trends';
        break;
      case 'tenant':
        csvData = (reportData.tenantAnalytics || []).map(item => ({
          'Tenant Segment': item.segment,
          Count: item.count,
          Percentage: `${item.percentage}%`
        }));
        filename = 'tenant-analytics';
        break;
      default:
        csvData = reportData.propertyPerformance || [];
        filename = 'report-data';
    }
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!reportData?.propertyPerformance) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        totalUnits: 0,
        avgOccupancy: 0,
        profitMargin: 0
      };
    }

    const totalRevenue = reportData.propertyPerformance.reduce((sum, p) => sum + p.revenue, 0);
    const totalExpenses = reportData.propertyPerformance.reduce((sum, p) => sum + p.expenses, 0);
    const totalUnits = reportData.propertyPerformance.reduce((sum, p) => sum + p.units, 0);
    const avgOccupancy = reportData.propertyPerformance.length > 0 
      ? reportData.propertyPerformance.reduce((sum, p) => sum + p.occupancy, 0) / reportData.propertyPerformance.length
      : 0;
    
    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      totalUnits,
      avgOccupancy: Math.round(avgOccupancy),
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0
    };
  }, [reportData]);

  const renderOverviewReport = () => (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${summaryMetrics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className="text-2xl font-bold text-gray-900">${summaryMetrics.netIncome.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.avgOccupancy}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <HomeIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalUnits}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px' 
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="#fed7aa" />
                <Area type="monotone" dataKey="expenses" stroke="#dc2626" fill="#fecaca" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData?.propertyPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="property" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px' 
                  }}
                />
                <Bar dataKey="revenue" fill="#f97316" />
                <Bar dataKey="expenses" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancialReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData?.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} />
                  <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={3} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-semibold text-gray-900">${summaryMetrics.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-semibold text-gray-900">${summaryMetrics.totalExpenses.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Net Income</span>
                  <span className="font-bold text-green-600">${summaryMetrics.netIncome.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit Margin</span>
                <span className="font-semibold text-gray-900">{summaryMetrics.profitMargin}%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Properties</h3>
                          <div className="space-y-3">
               {(reportData?.propertyPerformance || [])
                 .sort((a, b) => (b.revenue - b.expenses) - (a.revenue - a.expenses))
                 .slice(0, 3)
                .map((property, index) => (
                  <div key={property.property} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{property.property}</div>
                      <div className="text-sm text-gray-600">{property.occupancy}% occupied</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        ${(property.revenue - property.expenses).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">net income</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMaintenanceReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Costs by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData?.maintenanceCosts || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="category" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="cost" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Volume vs Average Cost</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData?.maintenanceCosts || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="category" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="requests" fill="#3b82f6" />
                <Bar dataKey="avgCost" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Cost</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Requests</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Avg Cost</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Cost per Unit</th>
              </tr>
            </thead>
            <tbody>
              {(reportData?.maintenanceCosts || []).map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900">{item.category}</td>
                  <td className="py-3 px-4 text-right text-gray-900">${item.cost.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{item.requests}</td>
                  <td className="py-3 px-4 text-right text-gray-900">${item.avgCost}</td>
                  <td className="py-3 px-4 text-right text-gray-900">${Math.round(item.cost / summaryMetrics.totalUnits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOccupancyReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData?.occupancyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area type="monotone" dataKey="occupied" stackId="1" stroke="#f97316" fill="#fed7aa" />
                <Area type="monotone" dataKey="vacant" stackId="1" stroke="#dc2626" fill="#fecaca" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Occupancy by Property</h3>
          <div className="space-y-4">
            {(reportData?.propertyPerformance || []).map((property, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{property.property}</div>
                  <div className="text-sm text-gray-600">{property.units} units total</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-orange-600">{property.occupancy}%</div>
                  <div className="text-xs text-gray-500">
                    {Math.round(property.units * property.occupancy / 100)} / {property.units}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTenantReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenant Segments</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData?.tenantAnalytics || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {(reportData?.tenantAnalytics || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#10b981'][index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenant Retention Metrics</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">94%</div>
              <div className="text-sm text-green-700">Overall Retention Rate</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">2.3</div>
              <div className="text-sm text-blue-700">Average Lease Length (years)</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">18</div>
              <div className="text-sm text-orange-700">Days Average Vacancy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentReport = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'financial':
        return renderFinancialReport();
      case 'maintenance':
        return renderMaintenanceReport();
      case 'occupancy':
        return renderOccupancyReport();
      case 'tenant':
        return renderTenantReport();
      default:
        return renderOverviewReport();
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Reports</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadReportData}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into your property portfolio</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              disabled={!reportData}
            >
              <DocumentTextIcon className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              disabled={isExporting || !reportData}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <PrinterIcon className="w-4 h-4" />
              {isExporting ? 'Generating...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <div className="space-y-6">
            {/* Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="last30days">Last 30 Days</option>
                    <option value="last90days">Last 90 Days</option>
                    <option value="last6months">Last 6 Months</option>
                    <option value="lastyear">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Properties</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name || property.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Report Types */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Report Types</h3>
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start gap-3 ${
                      selectedReport === report.id
                        ? 'bg-orange-50 border-2 border-orange-200 text-orange-700'
                        : 'hover:bg-gray-50 border-2 border-transparent text-gray-700'
                    }`}
                  >
                    <report.icon className={`w-5 h-5 mt-0.5 ${
                      selectedReport === report.id ? 'text-orange-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium">{report.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{report.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div ref={reportRef} className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {reports.find(r => r.id === selectedReport)?.title}
              </h2>
              <p className="text-gray-600">
                Generated on {new Date().toLocaleDateString()} • {dateRange === 'last30days' ? 'Last 30 Days' : 'Selected Period'}
              </p>
            </div>
            
            {renderCurrentReport()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule; 