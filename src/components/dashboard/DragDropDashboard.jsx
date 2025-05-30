import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  PresentationChartLineIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sortable Widget Component
function SortableWidget({ id, widget, data, isCustomizing }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 ${
        widget.size === 'large' ? 'lg:col-span-2' : ''
      } ${
        isDragging ? 'z-50 rotate-3 scale-105' : ''
      }`}
    >
      <div
        className={`bg-white rounded-xl border transition-all duration-200 ${
          isCustomizing
            ? 'border-orange-200 shadow-md hover:shadow-lg'
            : 'border-gray-200 shadow-sm hover:shadow-md'
        }`}
      >
        {/* Widget Header */}
        <div
          {...attributes}
          {...listeners}
          className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${
            isCustomizing ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <widget.icon className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">
              {widget.title}
            </h3>
          </div>
          {isCustomizing && (
            <div className="text-gray-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Widget Content */}
        <div className="p-6">
          <widget.component data={data} />
        </div>
      </div>
    </div>
  );
}

/**
 * Advanced Drag & Drop Dashboard with Customizable Widgets
 * Phase 1.2 Implementation
 */
const DragDropDashboard = ({ userRole = 'landlord' }) => {
  // Sample data for charts
  const revenueData = [
    { month: 'Jan', revenue: 4200, expenses: 2400 },
    { month: 'Feb', revenue: 4800, expenses: 2200 },
    { month: 'Mar', revenue: 5200, expenses: 2800 },
    { month: 'Apr', revenue: 4900, expenses: 2100 },
    { month: 'May', revenue: 5400, expenses: 2500 },
    { month: 'Jun', revenue: 5800, expenses: 2300 }
  ];

  const occupancyData = [
    { name: 'Occupied', value: 85, color: '#f97316' },
    { name: 'Vacant', value: 15, color: '#e5e7eb' }
  ];

  const maintenanceData = [
    { category: 'Plumbing', requests: 12, resolved: 10 },
    { category: 'Electrical', requests: 8, resolved: 7 },
    { category: 'HVAC', requests: 15, resolved: 12 },
    { category: 'General', requests: 20, resolved: 18 }
  ];

  // Widget definitions
  const availableWidgets = {
    stats: {
      id: 'stats',
      title: 'Key Metrics',
      icon: ChartBarIcon,
      size: 'large',
      component: StatsWidget
    },
    revenue: {
      id: 'revenue',
      title: 'Revenue & Expenses',
      icon: CurrencyDollarIcon,
      size: 'large',
      component: RevenueWidget
    },
    occupancy: {
      id: 'occupancy',
      title: 'Occupancy Rate',
      icon: PieChart,
      size: 'medium',
      component: OccupancyWidget
    },
    maintenance: {
      id: 'maintenance',
      title: 'Maintenance Overview',
      icon: ClipboardDocumentListIcon,
      size: 'large',
      component: MaintenanceWidget
    },
    properties: {
      id: 'properties',
      title: 'Recent Properties',
      icon: HomeIcon,
      size: 'medium',
      component: PropertiesWidget
    },
    calendar: {
      id: 'calendar',
      title: 'Upcoming Events',
      icon: CalendarIcon,
      size: 'medium',
      component: CalendarWidget
    }
  };

  // Default dashboard layout
  const [dashboardLayout, setDashboardLayout] = useState([
    { id: 'stats', position: 0, visible: true },
    { id: 'revenue', position: 1, visible: true },
    { id: 'occupancy', position: 2, visible: true },
    { id: 'maintenance', position: 3, visible: true },
    { id: 'properties', position: 4, visible: true },
    { id: 'calendar', position: 5, visible: false }
  ]);

  const [isCustomizing, setIsCustomizing] = useState(false);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setDashboardLayout((items) => {
        const visibleItems = items.filter(item => item.visible);
        const oldIndex = visibleItems.findIndex(item => item.id === active.id);
        const newIndex = visibleItems.findIndex(item => item.id === over.id);
        
        const reorderedVisible = arrayMove(visibleItems, oldIndex, newIndex);
        
        // Update positions for visible items
        const updatedVisible = reorderedVisible.map((item, index) => ({
          ...item,
          position: index
        }));
        
        // Merge back with hidden items
        const hiddenItems = items.filter(item => !item.visible);
        return [...updatedVisible, ...hiddenItems];
      });
    }
  }, []);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback((widgetId) => {
    setDashboardLayout(prev => 
      prev.map(item => 
        item.id === widgetId 
          ? { ...item, visible: !item.visible }
          : item
      )
    );
  }, []);

  // Get visible widgets in order
  const visibleWidgets = dashboardLayout
    .filter(item => item.visible)
    .sort((a, b) => a.position - b.position);

  const chartData = {
    revenue: revenueData,
    occupancy: occupancyData,
    maintenance: maintenanceData
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Customize your workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                isCustomizing
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Cog6ToothIcon className="w-4 h-4" />
              {isCustomizing ? 'Done Customizing' : 'Customize Dashboard'}
            </button>
          </div>
        </div>
      </div>

      {/* Customization Panel */}
      {isCustomizing && (
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Cog6ToothIcon className="w-5 h-5" />
              <span className="font-medium">Widget Controls</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.values(availableWidgets).map(widget => {
              const layoutItem = dashboardLayout.find(item => item.id === widget.id);
              const isVisible = layoutItem?.visible;
              
              return (
                <button
                  key={widget.id}
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-2 ${
                    isVisible
                      ? 'border-orange-300 bg-white text-orange-700 shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <widget.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{widget.title}</span>
                  {isVisible ? (
                    <EyeIcon className="w-4 h-4 ml-auto" />
                  ) : (
                    <EyeSlashIcon className="w-4 h-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleWidgets.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {visibleWidgets.map((layoutItem) => {
                const widget = availableWidgets[layoutItem.id];
                
                return (
                  <SortableWidget
                    key={layoutItem.id}
                    id={layoutItem.id}
                    widget={widget}
                    data={chartData}
                    isCustomizing={isCustomizing}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty State */}
        {visibleWidgets.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Cog6ToothIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Widgets Visible</h3>
            <p className="text-gray-600 mb-4">Enable some widgets to customize your dashboard</p>
            <button
              onClick={() => setIsCustomizing(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Customize Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Widget Components
function StatsWidget() {
  const stats = [
    { label: 'Total Properties', value: '12', change: '+2', positive: true },
    { label: 'Active Tenants', value: '28', change: '+4', positive: true },
    { label: 'Open Requests', value: '7', change: '-3', positive: true },
    { label: 'Monthly Revenue', value: '$24,800', change: '+12%', positive: true }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
          <div className={`text-xs font-medium ${
            stat.positive ? 'text-green-600' : 'text-red-600'
          }`}>
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueWidget({ data }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.revenue}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="#fed7aa" strokeWidth={2} />
          <Area type="monotone" dataKey="expenses" stroke="#dc2626" fill="#fecaca" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function OccupancyWidget({ data }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.occupancy}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.occupancy.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-2">
        <div className="text-2xl font-bold text-orange-600">85%</div>
        <div className="text-sm text-gray-600">Occupancy Rate</div>
      </div>
    </div>
  );
}

function MaintenanceWidget({ data }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.maintenance}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="requests" fill="#f97316" radius={[4, 4, 0, 0]} />
          <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PropertiesWidget() {
  const properties = [
    { name: 'Sunset Apartments', units: 24, occupancy: 92 },
    { name: 'Downtown Lofts', units: 12, occupancy: 100 },
    { name: 'Garden Complex', units: 36, occupancy: 78 }
  ];

  return (
    <div className="space-y-3">
      {properties.map((property, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">{property.name}</div>
            <div className="text-sm text-gray-600">{property.units} units</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-orange-600">{property.occupancy}%</div>
            <div className="text-xs text-gray-500">occupied</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarWidget() {
  const events = [
    { title: 'Lease Renewal', date: 'Tomorrow', type: 'important' },
    { title: 'Maintenance Visit', date: 'Jan 15', type: 'normal' },
    { title: 'Property Inspection', date: 'Jan 18', type: 'normal' }
  ];

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className={`w-3 h-3 rounded-full ${
            event.type === 'important' ? 'bg-red-500' : 'bg-orange-500'
          }`} />
          <div className="flex-1">
            <div className="font-medium text-gray-900">{event.title}</div>
            <div className="text-sm text-gray-600">{event.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DragDropDashboard; 