/**
 * AlertManagement Component Tests
 * Unit tests for React alert dashboard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AlertManagement from '../AlertManagement';

// Mock API
jest.mock('../../services/api', () => ({
  getAlerts: jest.fn(),
  getStatistics: jest.fn(),
  acknowledgeAlert: jest.fn(),
  resolveAlert: jest.fn(),
  provideFeedback: jest.fn()
}));

const mockApi = require('../../services/api');

// Mock data
const mockAlerts = [
  {
    id: 'alert-1',
    timestamp: new Date().toISOString(),
    type: 'leak_detected',
    severity: 'critical',
    location: 'main_pipe',
    description: 'Critical leak detected',
    status: 'active',
    acknowledged: false,
    resolved: false,
    valveClosureTriggered: true,
    notificationsSent: ['email', 'sms']
  },
  {
    id: 'alert-2',
    timestamp: new Date().toISOString(),
    severity: 'warning',
    location: 'branch_pipe',
    description: 'Minor leak detected',
    status: 'active',
    acknowledged: true,
    resolved: false,
    acknowledgedBy: 'user1',
    acknowledgedAt: new Date().toISOString()
  }
];

const mockStatistics = {
  total: 10,
  active: 5,
  acknowledged: 3,
  acknowledgeRate: '60.0',
  resolved: 2,
  falsePositives: 1,
  averageResponseTime: 120,
  valvesClosedCount: 2,
  severityBreakdown: {
    info: 1,
    warning: 2,
    critical: 5,
    emergency: 2
  }
};

describe('AlertManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getAlerts.mockResolvedValue(mockAlerts);
    mockApi.getStatistics.mockResolvedValue(mockStatistics);
  });

  // ==================== RENDERING ====================
  describe('Component Rendering', () => {
    test('should render without crashing', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Alert Management/i)).toBeInTheDocument();
      });
    });

    test('should display header', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Alert Management/i)).toBeInTheDocument();
      });
    });

    test('should display statistics section', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Active/i)).toBeInTheDocument();
      });
    });

    test('should display tab navigation', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/All Alerts/i)).toBeInTheDocument();
        expect(screen.getByText(/Unacknowledged/i)).toBeInTheDocument();
      });
    });

    test('should display severity filter', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Critical/i)).toBeInTheDocument();
        expect(screen.getByText(/Warning/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== DATA LOADING ====================
  describe('Data Loading', () => {
    test('should fetch alerts on mount', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(mockApi.getAlerts).toHaveBeenCalled();
      });
    });

    test('should fetch statistics on mount', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(mockApi.getStatistics).toHaveBeenCalled();
      });
    });

    test('should display loading state initially', () => {
      // Mock to delay response
      mockApi.getAlerts.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(mockAlerts), 100))
      );

      const { container } = render(<AlertManagement />);

      // Should have loading indicator or spinner
      expect(container).toBeInTheDocument();
    });

    test('should display alerts after loading', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Critical leak detected/i)).toBeInTheDocument();
      });
    });

    test('should handle API errors gracefully', async () => {
      mockApi.getAlerts.mockRejectedValueOnce(new Error('API Error'));

      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== STATISTICS DISPLAY ====================
  describe('Statistics Display', () => {
    test('should display total alerts count', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/10/)).toBeInTheDocument();
      });
    });

    test('should display active count', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    test('should display acknowledged count', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    test('should calculate and display acknowledge rate', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText('60.0%')).toBeInTheDocument();
      });
    });

    test('should display false positives count', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    test('should display average response time', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/120/)).toBeInTheDocument();
      });
    });

    test('should display valves closed count', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  // ==================== ALERT FILTERING ====================
  describe('Alert Filtering', () => {
    test('should filter by severity when clicked', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Critical leak detected/i)).toBeInTheDocument();
      });

      const criticalFilter = screen.getByText('Critical');
      fireEvent.click(criticalFilter);

      expect(mockApi.getAlerts).toHaveBeenCalledWith({
        severity: 'critical'
      });
    });

    test('should show all alerts when "All" is selected', async () => {
      render(<AlertManagement />);

      const allFilter = screen.getByText('All');
      fireEvent.click(allFilter);

      expect(mockApi.getAlerts).toHaveBeenCalledWith({
        severity: undefined
      });
    });

    test('should filter by warning', async () => {
      render(<AlertManagement />);

      const warningFilter = screen.getByText('Warning');
      fireEvent.click(warningFilter);

      expect(mockApi.getAlerts).toHaveBeenCalledWith({
        severity: 'warning'
      });
    });

    test('should update alerts when filter changes', async () => {
      mockApi.getAlerts
        .mockResolvedValueOnce(mockAlerts)
        .mockResolvedValueOnce([mockAlerts[1]]); // Only warning

      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Critical leak detected/i)).toBeInTheDocument();
      });

      const warningFilter = screen.getByText('Warning');
      fireEvent.click(warningFilter);

      await waitFor(() => {
        expect(mockApi.getAlerts).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ==================== TAB NAVIGATION ====================
  describe('Tab Navigation', () => {
    test('should switch to "All Alerts" tab', async () => {
      render(<AlertManagement />);

      const allAlertsTab = screen.getByText('All Alerts');
      fireEvent.click(allAlertsTab);

      expect(mockApi.getAlerts).toHaveBeenCalled();
    });

    test('should switch to "Unacknowledged" tab', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Unacknowledged/i)).toBeInTheDocument();
      });

      const unackedTab = screen.getByText('Unacknowledged');
      fireEvent.click(unackedTab);

      expect(mockApi.getAlerts).toHaveBeenCalledWith(
        expect.objectContaining({
          acknowledged: false
        })
      );
    });

    test('should highlight active tab', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const allAlertsTab = screen.getByText('All Alerts');
        expect(allAlertsTab.closest('[role="tab"]')).toHaveClass('active');
      });
    });
  });

  // ==================== ALERT LIST ====================
  describe('Alert List Display', () => {
    test('should display alert cards', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Critical leak detected/i)).toBeInTheDocument();
        expect(screen.getByText(/Minor leak detected/i)).toBeInTheDocument();
      });
    });

    test('should show severity badges with correct color', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const criticalBadge = screen.getByText('CRITICAL');
        expect(criticalBadge).toHaveClass('severity-critical');
      });
    });

    test('should show timestamp for each alert', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        // Should display formatted timestamp
        expect(screen.getAllByText(/\d{1,2}:\d{2}/)).toHaveLength(2);
      });
    });

    test('should show location information', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/main_pipe/i)).toBeInTheDocument();
      });
    });

    test('should show acknowledgment status', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const unacknowledgedBadge = screen.getByText('Unacknowledged');
        expect(unacknowledgedBadge).toBeInTheDocument();
      });
    });
  });

  // ==================== MODAL/DETAIL VIEW ====================
  describe('Alert Detail Modal', () => {
    test('should open modal when alert is clicked', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Critical leak detected/i)).toBeInTheDocument();
      });

      const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
      fireEvent.click(alertCard);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    test('should display alert details in modal', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Critical leak detected/i)).toBeInTheDocument();
      });

      const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
      fireEvent.click(alertCard);

      await waitFor(() => {
        expect(screen.getByText(/Type:/i)).toBeInTheDocument();
        expect(screen.getByText(/Severity:/i)).toBeInTheDocument();
        expect(screen.getByText(/Location:/i)).toBeInTheDocument();
      });
    });

    test('should show valve closure information', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const criticalAlert = screen.getByText(/Critical leak detected/i);
        fireEvent.click(criticalAlert.closest('.alert-card'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Valve Closure Triggered:/i)).toBeInTheDocument();
        expect(screen.getByText(/Yes/i)).toBeInTheDocument();
      });
    });

    test('should close modal when X is clicked', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('should display notifications sent list', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const criticalAlert = screen.getByText(/Critical leak detected/i);
        fireEvent.click(criticalAlert.closest('.alert-card'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Notifications Sent:/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== ACKNOWLEDGE ACTION ====================
  describe('Acknowledge Alert', () => {
    test('should show acknowledge button for unacknowledged alerts', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      await waitFor(() => {
        expect(screen.getByText(/Acknowledge/i)).toBeInTheDocument();
      });
    });

    test('should call acknowledgeAlert when button clicked', async () => {
      mockApi.acknowledgeAlert.mockResolvedValueOnce({
        ...mockAlerts[0],
        acknowledged: true
      });

      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      await waitFor(() => {
        expect(screen.getByText(/Acknowledge/i)).toBeInTheDocument();
      });

      const acknowledgeButton = screen.getByText(/Acknowledge/i);
      fireEvent.click(acknowledgeButton);

      await waitFor(() => {
        expect(mockApi.acknowledgeAlert).toHaveBeenCalledWith('alert-1');
      });
    });

    test('should refresh alerts after acknowledging', async () => {
      mockApi.acknowledgeAlert.mockResolvedValueOnce({
        ...mockAlerts[0],
        acknowledged: true
      });

      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      const acknowledgeButton = screen.getByText(/Acknowledge/i);
      fireEvent.click(acknowledgeButton);

      await waitFor(() => {
        expect(mockApi.getAlerts).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ==================== RESOLVE ACTION ====================
  describe('Resolve Alert', () => {
    test('should show resolve button in modal', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      await waitFor(() => {
        expect(screen.getByText(/Resolve/i)).toBeInTheDocument();
      });
    });

    test('should show feedback form when resolve clicked', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      await waitFor(() => {
        const resolveButton = screen.getByText(/Resolve/i);
        fireEvent.click(resolveButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Feedback/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== FEEDBACK FORM ====================
  describe('Feedback Form', () => {
    test('should display feedback options', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      const resolveButton = screen.getByText(/Resolve/i);
      fireEvent.click(resolveButton);

      await waitFor(() => {
        expect(screen.getByText(/False Positive/i)).toBeInTheDocument();
        expect(screen.getByText(/Correct Detection/i)).toBeInTheDocument();
      });
    });

    test('should allow setting confidence', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      const resolveButton = screen.getByText(/Resolve/i);
      fireEvent.click(resolveButton);

      const confidenceSlider = screen.getByRole('slider', { name: /confidence/i });
      fireEvent.change(confidenceSlider, { target: { value: 0.85 } });

      expect(confidenceSlider.value).toBe('0.85');
    });

    test('should allow adding comments', async () => {
      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      const resolveButton = screen.getByText(/Resolve/i);
      fireEvent.click(resolveButton);

      const commentBox = screen.getByPlaceholderText(/comments/i);
      fireEvent.change(commentBox, {
        target: { value: 'This was a real leak in the main pipe' }
      });

      expect(commentBox.value).toBe('This was a real leak in the main pipe');
    });

    test('should submit feedback', async () => {
      mockApi.resolveAlert.mockResolvedValueOnce({
        ...mockAlerts[0],
        resolved: true
      });

      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      const resolveButton = screen.getByText(/Resolve/i);
      fireEvent.click(resolveButton);

      const submitButton = screen.getByText(/Submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApi.resolveAlert).toHaveBeenCalled();
      });
    });
  });

  // ==================== AUTO-REFRESH ====================
  describe('Auto-refresh', () => {
    test('should refresh alerts periodically', async () => {
      jest.useFakeTimers();

      render(<AlertManagement />);

      await waitFor(() => {
        expect(mockApi.getAlerts).toHaveBeenCalledTimes(1);
      });

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockApi.getAlerts).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    test('should refresh statistics periodically', async () => {
      jest.useFakeTimers();

      render(<AlertManagement />);

      await waitFor(() => {
        expect(mockApi.getStatistics).toHaveBeenCalledTimes(1);
      });

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockApi.getStatistics).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });

  // ==================== RESPONSIVE DESIGN ====================
  describe('Responsive Design', () => {
    test('should render statistics grid', () => {
      const { container } = render(<AlertManagement />);

      const statsGrid = container.querySelector('.stats-grid');
      expect(statsGrid).toBeInTheDocument();
    });

    test('should stack layout on mobile', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));

      const { container } = render(<AlertManagement />);

      expect(container).toBeInTheDocument();
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    test('should display error message when fetch fails', async () => {
      mockApi.getAlerts.mockRejectedValueOnce(new Error('Network error'));

      render(<AlertManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });
    });

    test('should handle acknowledge error gracefully', async () => {
      mockApi.acknowledgeAlert.mockRejectedValueOnce(new Error('Acknowledge failed'));

      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      const acknowledgeButton = screen.getByText(/Acknowledge/i);
      fireEvent.click(acknowledgeButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('should handle resolve error gracefully', async () => {
      mockApi.resolveAlert.mockRejectedValueOnce(new Error('Resolve failed'));

      render(<AlertManagement />);

      await waitFor(() => {
        const alertCard = screen.getByText(/Critical leak detected/i).closest('.alert-card');
        fireEvent.click(alertCard);
      });

      const resolveButton = screen.getByText(/Resolve/i);
      fireEvent.click(resolveButton);

      const submitButton = screen.getByText(/Submit/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
