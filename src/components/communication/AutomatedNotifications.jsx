import React, { useState, useEffect } from 'react';
import {
  BellAlertIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
  BoltIcon,
  ArrowPathIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';

const AutomatedNotifications = ({ userRole = 'landlord' }) => {
  const [activeTab, setActiveTab] = useState('rules');
  const [notificationRules, setNotificationRules] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [escalationQueues, setEscalationQueues] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);

  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    trigger: '',
    conditions: [],
    actions: [],
    priority: 'medium',
    active: true,
    schedule: 'immediate'
  });

  useEffect(() => {
    loadNotificationData();
  }, []);

  const loadNotificationData = () => {
    // Mock notification rules
    const mockRules = [
      {
        id: 'rule_001',
        name: 'Emergency Maintenance Escalation',
        description: 'Escalate emergency maintenance requests if not acknowledged within 30 minutes',
        trigger: 'maintenance_request_created',
        conditions: [
          { field: 'priority', operator: 'equals', value: 'emergency' },
          { field: 'status', operator: 'equals', value: 'pending' },
          { field: 'time_elapsed', operator: 'greater_than', value: '30_minutes' }
        ],
        actions: [
          { type: 'send_sms', target: 'property_manager' },
          { type: 'send_email', target: 'emergency_contact' },
          { type: 'create_task', target: 'maintenance_team' },
          { type: 'update_priority', value: 'critical' }
        ],
        priority: 'high',
        active: true,
        schedule: 'immediate',
        createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
        triggerCount: 15
      },
      {
        id: 'rule_002',
        name: 'Overdue Rent Payment Alert',
        description: 'Send notifications when rent payment is overdue by 3 days',
        trigger: 'payment_due_date_passed',
        conditions: [
          { field: 'payment_status', operator: 'equals', value: 'overdue' },
          { field: 'days_overdue', operator: 'greater_than', value: '3' }
        ],
        actions: [
          { type: 'send_email', target: 'tenant' },
          { type: 'send_email', target: 'landlord' },
          { type: 'create_reminder', target: 'landlord' }
        ],
        priority: 'medium',
        active: true,
        schedule: 'daily_9am',
        createdDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        triggerCount: 8
      },
      {
        id: 'rule_003',
        name: 'Contractor Response Timeout',
        description: 'Alert when contractors don\'t respond to job postings within 24 hours',
        trigger: 'job_posted',
        conditions: [
          { field: 'bid_count', operator: 'equals', value: '0' },
          { field: 'time_elapsed', operator: 'greater_than', value: '24_hours' }
        ],
        actions: [
          { type: 'send_email', target: 'more_contractors' },
          { type: 'increase_budget', value: '10_percent' },
          { type: 'extend_deadline', value: '3_days' }
        ],
        priority: 'low',
        active: true,
        schedule: 'hourly',
        createdDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000),
        triggerCount: 3
      },
      {
        id: 'rule_004',
        name: 'Lease Expiration Reminder',
        description: 'Send reminders 60, 30, and 7 days before lease expiration',
        trigger: 'lease_expiration_approaching',
        conditions: [
          { field: 'days_until_expiration', operator: 'in', value: '[60, 30, 7]' }
        ],
        actions: [
          { type: 'send_email', target: 'tenant' },
          { type: 'send_email', target: 'landlord' },
          { type: 'create_task', target: 'leasing_team' }
        ],
        priority: 'medium',
        active: true,
        schedule: 'daily_8am',
        createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastTriggered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        triggerCount: 12
      }
    ];

    // Mock active notifications
    const mockActive = [
      {
        id: 'notif_001',
        ruleId: 'rule_001',
        ruleName: 'Emergency Maintenance Escalation',
        title: 'Emergency Maintenance - Unit 2A Flooding',
        message: 'Emergency maintenance request has not been acknowledged for 45 minutes',
        priority: 'critical',
        status: 'active',
        createdDate: new Date(Date.now() - 45 * 60 * 1000),
        affectedEntity: { type: 'maintenance_request', id: 'req_123', name: 'Unit 2A Flooding' },
        actions: [
          { type: 'acknowledge', label: 'Acknowledge' },
          { type: 'assign', label: 'Assign Contractor' },
          { type: 'escalate', label: 'Escalate Further' }
        ]
      },
      {
        id: 'notif_002',
        ruleId: 'rule_002',
        ruleName: 'Overdue Rent Payment Alert',
        title: 'Rent Payment Overdue - Sarah Johnson',
        message: 'Rent payment is 5 days overdue for Unit 3B',
        priority: 'medium',
        status: 'active',
        createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        affectedEntity: { type: 'tenant', id: 'tenant_456', name: 'Sarah Johnson - Unit 3B' },
        actions: [
          { type: 'contact_tenant', label: 'Contact Tenant' },
          { type: 'send_notice', label: 'Send Notice' },
          { type: 'defer', label: 'Defer 3 Days' }
        ]
      }
    ];

    // Mock escalation queues
    const mockEscalations = [
      {
        id: 'esc_001',
        type: 'maintenance_emergency',
        name: 'Emergency Maintenance Escalation',
        description: 'Critical maintenance issues that require immediate attention',
        steps: [
          { level: 1, target: 'maintenance_supervisor', timeout: '15_minutes' },
          { level: 2, target: 'property_manager', timeout: '30_minutes' },
          { level: 3, target: 'emergency_contractor', timeout: '60_minutes' },
          { level: 4, target: 'owner_landlord', timeout: 'immediate' }
        ],
        currentItems: 3,
        active: true
      },
      {
        id: 'esc_002',
        type: 'payment_overdue',
        name: 'Payment Escalation',
        description: 'Overdue rent payments requiring progressive action',
        steps: [
          { level: 1, target: 'friendly_reminder', timeout: '3_days' },
          { level: 2, target: 'formal_notice', timeout: '7_days' },
          { level: 3, target: 'late_fee_application', timeout: '10_days' },
          { level: 4, target: 'legal_action', timeout: '30_days' }
        ],
        currentItems: 1,
        active: true
      }
    ];

    setNotificationRules(mockRules);
    setActiveNotifications(mockActive);
    setEscalationQueues(mockEscalations);
  };

  const triggerOptions = [
    { value: 'maintenance_request_created', label: 'Maintenance Request Created' },
    { value: 'payment_due_date_passed', label: 'Payment Due Date Passed' },
    { value: 'job_posted', label: 'Job Posted' },
    { value: 'lease_expiration_approaching', label: 'Lease Expiration Approaching' },
    { value: 'tenant_moved_in', label: 'Tenant Moved In' },
    { value: 'contractor_bid_received', label: 'Contractor Bid Received' },
    { value: 'property_inspection_due', label: 'Property Inspection Due' },
    { value: 'emergency_alert', label: 'Emergency Alert' }
  ];

  const conditionOperators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'in', label: 'In List' }
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'send_sms', label: 'Send SMS' },
    { value: 'send_push', label: 'Send Push Notification' },
    { value: 'create_task', label: 'Create Task' },
    { value: 'create_reminder', label: 'Create Reminder' },
    { value: 'update_priority', label: 'Update Priority' },
    { value: 'assign_contractor', label: 'Assign Contractor' },
    { value: 'escalate', label: 'Escalate' }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleRule = (ruleId) => {
    setNotificationRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, active: !rule.active } : rule
      )
    );
  };

  const handleNotificationAction = (notificationId, action) => {
    console.log(`Handling action ${action} for notification ${notificationId}`);
    // Remove from active notifications
    setActiveNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const renderRulesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notification Rules</h2>
          <p className="text-gray-600">Configure automated notification triggers and actions</p>
        </div>
        <button
          onClick={() => setShowRuleModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <PlusIcon className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      <div className="grid gap-4">
        {notificationRules.map((rule) => (
          <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rule.priority)}`}>
                    {rule.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{rule.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Trigger:</span>
                    <span className="ml-2 text-gray-600">
                      {triggerOptions.find(t => t.value === rule.trigger)?.label || rule.trigger}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Schedule:</span>
                    <span className="ml-2 text-gray-600">{rule.schedule}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Triggered:</span>
                    <span className="ml-2 text-gray-600">
                      {rule.lastTriggered ? formatDistanceToNow(rule.lastTriggered) + ' ago' : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Trigger Count:</span>
                    <span className="ml-2 text-gray-600">{rule.triggerCount}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`p-2 rounded-lg ${
                    rule.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {rule.active ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedRule(rule);
                    setShowRuleModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{rule.conditions.length}</span> conditions
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{rule.actions.length}</span> actions
              </div>
              <div className="text-sm text-gray-600">
                Created {format(rule.createdDate, 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActiveTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Active Notifications</h2>
          <p className="text-gray-600">Notifications awaiting action or acknowledgment</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{activeNotifications.length} active</span>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600">No active notifications requiring attention</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeNotifications.map((notification) => (
            <div key={notification.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{notification.message}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {formatDistanceToNow(notification.createdDate)} ago
                    </div>
                    <div>
                      Rule: {notification.ruleName}
                    </div>
                    <div>
                      Entity: {notification.affectedEntity.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleNotificationAction(notification.id, action.type)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        action.type === 'acknowledge' 
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : action.type === 'escalate'
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEscalationTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Escalation Queues</h2>
          <p className="text-gray-600">Manage escalation workflows and current queue status</p>
        </div>
        <button
          onClick={() => setShowEscalationModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <PlusIcon className="w-4 h-4" />
          Create Queue
        </button>
      </div>

      <div className="grid gap-6">
        {escalationQueues.map((queue) => (
          <div key={queue.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{queue.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    queue.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {queue.active ? 'Active' : 'Inactive'}
                  </span>
                  {queue.currentItems > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {queue.currentItems} items in queue
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{queue.description}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                  <ChartBarIcon className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Escalation Steps</h4>
              <div className="space-y-2">
                {queue.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-medium text-orange-700">
                      {step.level}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{step.target}</div>
                      <div className="text-sm text-gray-600">Timeout: {step.timeout}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {index < queue.steps.length - 1 && '→'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notification Analytics</h2>
        <p className="text-gray-600">Performance metrics and insights for automated notifications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Total Notifications</h3>
            <BellAlertIcon className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">1,247</div>
          <div className="text-sm text-green-600">+12% from last month</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Response Rate</h3>
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">94.2%</div>
          <div className="text-sm text-green-600">+3% from last month</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Avg Response Time</h3>
            <ClockIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">23m</div>
          <div className="text-sm text-red-600">+5m from last month</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Most Triggered Rules (Last 30 Days)</h3>
        <div className="space-y-3">
          {notificationRules
            .sort((a, b) => b.triggerCount - a.triggerCount)
            .slice(0, 5)
            .map((rule, index) => (
              <div key={rule.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-medium text-orange-700">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{rule.name}</div>
                    <div className="text-sm text-gray-600">{rule.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{rule.triggerCount}</div>
                  <div className="text-sm text-gray-600">triggers</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BoltIcon className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automated Notifications</h1>
              <p className="text-gray-600">Smart alerts and escalation management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: 'rules', label: 'Rules', icon: CogIcon },
              { key: 'active', label: 'Active', icon: BellAlertIcon },
              { key: 'escalation', label: 'Escalation', icon: ExclamationTriangleIcon },
              { key: 'analytics', label: 'Analytics', icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'rules' && renderRulesTab()}
        {activeTab === 'active' && renderActiveTab()}
        {activeTab === 'escalation' && renderEscalationTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">System Status: Active</span>
            </div>
            <div className="text-gray-600">
              {notificationRules.filter(r => r.active).length} active rules
            </div>
            <div className="text-gray-600">
              {activeNotifications.length} pending notifications
            </div>
          </div>
          
          <div className="text-gray-500">
            Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomatedNotifications; 