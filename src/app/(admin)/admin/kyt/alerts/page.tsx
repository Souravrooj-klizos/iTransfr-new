'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import {
    AlertTriangle,
    Bell,
    Check,
    CheckCircle,
    Clock,
    Eye,
    Loader2,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldX,
    X,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AlertData {
    id: string;
    wallet_id: string | null;
    address: string;
    network: string;
    alert_type: string;
    previous_risk_score: number | null;
    new_risk_score: number | null;
    risk_signals: Record<string, number>;
    severity: string;
    status: string;
    notes: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
}

const SEVERITY_FILTERS = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
];

const STATUS_FILTERS = [
    { value: 'all', label: 'All Status' },
    { value: 'unread', label: 'Unread' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' },
];

export default function KytAlertsPage() {
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    const toast = useToast();

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (severityFilter !== 'all') params.append('severity', severityFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await fetch(`/api/kyt/alerts?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setAlerts(data.alerts || []);
                setUnreadCount(data.unreadCount || 0);
            } else {
                toast.error('Error', data.error || 'Failed to fetch alerts');
            }
        } catch (error) {
            toast.error('Error', 'Failed to fetch alerts');
        } finally {
            setLoading(false);
        }
    }, [severityFilter, statusFilter]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const updateAlertStatus = async (alertId: string, status: string) => {
        try {
            setUpdating(alertId);
            const response = await fetch(`/api/kyt/alerts/${alertId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, notes }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Success', `Alert marked as ${status}`);
                fetchAlerts();
                if (showDetailModal) {
                    setShowDetailModal(false);
                    setSelectedAlert(null);
                }
            } else {
                toast.error('Error', data.error || 'Failed to update alert');
            }
        } catch (error) {
            toast.error('Error', 'Failed to update alert');
        } finally {
            setUpdating(null);
            setNotes('');
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <ShieldX className="h-5 w-5 text-red-600" />;
            case 'high':
                return <ShieldAlert className="h-5 w-5 text-orange-600" />;
            case 'medium':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            default:
                return <Bell className="h-5 w-5 text-blue-600" />;
        }
    };

    const getSeverityBadge = (severity: string) => {
        const colors: Record<string, string> = {
            critical: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            low: 'bg-blue-100 text-blue-700 border-blue-200',
        };
        return (
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colors[severity] || 'bg-gray-100 text-gray-700'}`}>
                {severity}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { color: string; icon: any }> = {
            unread: { color: 'bg-blue-100 text-blue-700', icon: Clock },
            reviewed: { color: 'bg-purple-100 text-purple-700', icon: Eye },
            resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
            dismissed: { color: 'bg-gray-100 text-gray-700', icon: XCircle },
        };
        const config = configs[status] || configs['unread'];
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${config.color}`}>
                <Icon className="h-3 w-3" />
                {status}
            </span>
        );
    };

    const getAlertTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            risk_increase: 'Risk Increase',
            threshold_exceeded: 'Threshold Exceeded',
            blacklisted: 'Blacklisted Address',
            suspicious_activity: 'Suspicious Activity',
        };
        return labels[type] || type;
    };

    const getTopSignals = (signals: Record<string, number>) => {
        return Object.entries(signals || {})
            .filter(([, value]) => value > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredAlerts = alerts.filter(alert => {
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                alert.address.toLowerCase().includes(search) ||
                alert.network.toLowerCase().includes(search)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">KYT Alerts</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Monitor and manage AML risk alerts from wallet screenings
                    </p>
                </div>
                {unreadCount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 border border-red-200">
                        <Bell className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-700">{unreadCount} Unread Alerts</span>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-red-100 p-2">
                            <ShieldX className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {alerts.filter(a => a.severity === 'critical').length}
                            </p>
                            <p className="text-sm text-gray-500">Critical</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-orange-100 p-2">
                            <ShieldAlert className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {alerts.filter(a => a.severity === 'high').length}
                            </p>
                            <p className="text-sm text-gray-500">High</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-yellow-100 p-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {alerts.filter(a => a.severity === 'warning' || a.severity === 'medium').length}
                            </p>
                            <p className="text-sm text-gray-500">Warning</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {alerts.filter(a => a.status === 'resolved').length}
                            </p>
                            <p className="text-sm text-gray-500">Resolved</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search by address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select
                    value={severityFilter}
                    onChange={setSeverityFilter}
                    options={SEVERITY_FILTERS}
                    className="w-full sm:w-40"
                />
                <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={STATUS_FILTERS}
                    className="w-full sm:w-40"
                />
                <Button
                    onClick={fetchAlerts}
                    variant="outline"
                    className="cursor-pointer flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex h-64 items-center justify-center rounded-lg border bg-white">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-white text-gray-500">
                        <ShieldAlert className="mb-4 h-12 w-12 text-gray-300" />
                        <p className="text-lg font-medium">No alerts found</p>
                        <p className="text-sm">All clear! No AML alerts to review.</p>
                    </div>
                ) : (
                    filteredAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50 ${alert.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''
                                }`}
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        {getSeverityIcon(alert.severity)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">
                                                {getAlertTypeLabel(alert.alert_type)}
                                            </span>
                                            {getSeverityBadge(alert.severity)}
                                            {getStatusBadge(alert.status)}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                            <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                                                {alert.address.slice(0, 12)}...{alert.address.slice(-8)}
                                            </code>
                                            <span className="text-gray-400">•</span>
                                            <span className="capitalize">{alert.network}</span>
                                            <span className="text-gray-400">•</span>
                                            <span>{formatDate(alert.created_at)}</span>
                                        </div>
                                        {alert.new_risk_score !== null && (
                                            <div className="mt-2 text-sm">
                                                <span className="text-gray-500">Risk Score: </span>
                                                {alert.previous_risk_score !== null && (
                                                    <span className="text-gray-400">
                                                        {alert.previous_risk_score.toFixed(1)}% →{' '}
                                                    </span>
                                                )}
                                                <span className={`font-medium ${alert.new_risk_score >= 47 ? 'text-red-600' :
                                                    alert.new_risk_score >= 35 ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`}>
                                                    {alert.new_risk_score.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {alert.status === 'unread' && (
                                        <>
                                            <Button
                                                onClick={() => updateAlertStatus(alert.id, 'reviewed')}
                                                disabled={updating === alert.id}
                                                variant="outline"
                                                className="cursor-pointer text-sm"
                                            >
                                                {updating === alert.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Eye className="mr-1 h-4 w-4" />
                                                        Review
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => updateAlertStatus(alert.id, 'resolved')}
                                                disabled={updating === alert.id}
                                                className="cursor-pointer bg-green-600 text-sm text-white hover:bg-green-700"
                                            >
                                                <Check className="mr-1 h-4 w-4" />
                                                Resolve
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        onClick={() => {
                                            setSelectedAlert(alert);
                                            setShowDetailModal(true);
                                        }}
                                        variant="outline"
                                        className="cursor-pointer text-sm"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Alert Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedAlert(null);
                    setNotes('');
                }}
                title="Alert Details"
            >
                {selectedAlert && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            {getSeverityIcon(selectedAlert.severity)}
                            <div>
                                <p className="font-medium text-gray-900">
                                    {getAlertTypeLabel(selectedAlert.alert_type)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {formatDate(selectedAlert.created_at)}
                                </p>
                            </div>
                            <div className="ml-auto flex gap-2">
                                {getSeverityBadge(selectedAlert.severity)}
                                {getStatusBadge(selectedAlert.status)}
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-gray-500">Address</p>
                            <code className="block mt-1 break-all text-sm bg-gray-50 p-2 rounded">
                                {selectedAlert.address}
                            </code>
                            <p className="mt-2 text-sm text-gray-500">Network</p>
                            <p className="capitalize">{selectedAlert.network}</p>
                        </div>

                        {selectedAlert.new_risk_score !== null && (
                            <div className="rounded-lg border p-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Risk Score</p>
                                <div className="flex items-center gap-4">
                                    {selectedAlert.previous_risk_score !== null && (
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-gray-400">
                                                {selectedAlert.previous_risk_score.toFixed(1)}%
                                            </p>
                                            <p className="text-xs text-gray-400">Previous</p>
                                        </div>
                                    )}
                                    {selectedAlert.previous_risk_score !== null && (
                                        <span className="text-gray-400">→</span>
                                    )}
                                    <div className="text-center">
                                        <p className={`text-2xl font-bold ${selectedAlert.new_risk_score >= 47 ? 'text-red-600' :
                                            selectedAlert.new_risk_score >= 35 ? 'text-yellow-600' :
                                                'text-green-600'
                                            }`}>
                                            {selectedAlert.new_risk_score.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-gray-500">Current</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {Object.keys(selectedAlert.risk_signals || {}).length > 0 && (
                            <div className="rounded-lg border p-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Risk Signals</p>
                                <div className="space-y-2">
                                    {getTopSignals(selectedAlert.risk_signals).map(([name, value]) => (
                                        <div key={name} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 capitalize">
                                                {name.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-sm font-medium">
                                                {(value * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedAlert.status !== 'resolved' && selectedAlert.status !== 'dismissed' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes about this alert..."
                                    className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            {selectedAlert.status === 'unread' && (
                                <>
                                    <Button
                                        onClick={() => updateAlertStatus(selectedAlert.id, 'dismissed')}
                                        disabled={updating === selectedAlert.id}
                                        variant="outline"
                                        className="cursor-pointer text-gray-600"
                                    >
                                        <X className="mr-1 h-4 w-4" />
                                        Dismiss
                                    </Button>
                                    <Button
                                        onClick={() => updateAlertStatus(selectedAlert.id, 'reviewed')}
                                        disabled={updating === selectedAlert.id}
                                        variant="outline"
                                        className="cursor-pointer"
                                    >
                                        <Eye className="mr-1 h-4 w-4" />
                                        Mark Reviewed
                                    </Button>
                                    <Button
                                        onClick={() => updateAlertStatus(selectedAlert.id, 'resolved')}
                                        disabled={updating === selectedAlert.id}
                                        className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
                                    >
                                        {updating === selectedAlert.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="mr-1 h-4 w-4" />
                                                Resolve
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                            {selectedAlert.status === 'reviewed' && (
                                <Button
                                    onClick={() => updateAlertStatus(selectedAlert.id, 'resolved')}
                                    disabled={updating === selectedAlert.id}
                                    className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
                                >
                                    <Check className="mr-1 h-4 w-4" />
                                    Resolve
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setShowDetailModal(false)} className="cursor-pointer">
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
