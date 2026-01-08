'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import {
    AlertTriangle,
    CheckCircle,
    Copy,
    Eye,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface WalletData {
    id: string;
    address: string;
    network: string;
    wallet_type: string;
    label: string;
    status: string;
    balance: number;
    usdc_balance: number;
    usdt_balance: number;
    native_balance: number;
    aml_risk_score: number | null;
    aml_status: string;
    aml_monitoring_enabled: boolean;
    turnkeyWalletId: string;
    createdAt: string;
}

const NETWORKS = [
    { value: 'solana', label: 'Solana (SOL)' },
    { value: 'ethereum', label: 'Ethereum (ETH)' },
    { value: 'tron', label: 'Tron (TRX)' },
];

const WALLET_TYPES = [
    { value: 'master', label: 'Master Wallet' },
    { value: 'client', label: 'Client Wallet' },
    { value: 'client_external', label: 'External Wallet' },
];

export default function WalletsPage() {
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [networkFilter, setNetworkFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
    const [creating, setCreating] = useState(false);
    const [screening, setScreening] = useState<string | null>(null);

    // Create form state
    const [formData, setFormData] = useState({
        name: '',
        label: '',
        network: 'solana',
        walletType: 'master',
        enableKytMonitoring: true,
    });

    const toast = useToast();

    const fetchWallets = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (networkFilter !== 'all') params.append('network', networkFilter);
            if (typeFilter !== 'all') params.append('type', typeFilter);

            const response = await fetch(`/api/admin/wallets?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setWallets(data.wallets || []);
            } else {
                toast.error('Error', data.error || 'Failed to fetch wallets');
            }
        } catch (error) {
            toast.error('Error', 'Failed to fetch wallets');
        } finally {
            setLoading(false);
        }
    }, [networkFilter, typeFilter]);

    useEffect(() => {
        fetchWallets();
    }, [fetchWallets]);

    const handleCreateWallet = async () => {
        if (!formData.name) {
            toast.error('Error', 'Wallet name is required');
            return;
        }

        try {
            setCreating(true);
            const response = await fetch('/api/admin/wallets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Success', 'Wallet created successfully');
                setShowCreateModal(false);
                setFormData({
                    name: '',
                    label: '',
                    network: 'solana',
                    walletType: 'master',
                    enableKytMonitoring: true,
                });
                fetchWallets();
            } else {
                toast.error('Error', data.error || 'Failed to create wallet');
            }
        } catch (error) {
            toast.error('Error', 'Failed to create wallet');
        } finally {
            setCreating(false);
        }
    };

    const handleScreenWallet = async (wallet: WalletData) => {
        try {
            setScreening(wallet.id);
            const response = await fetch('/api/kyt/screen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: wallet.address,
                    network: wallet.network,
                    walletId: wallet.id,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Screening Complete', `Risk Score: ${data.riskScore?.toFixed(1)}% (${data.severity})`);
                fetchWallets();
            } else {
                toast.error('Error', data.error || 'Screening failed');
            }
        } catch (error) {
            toast.error('Error', 'Failed to screen wallet');
        } finally {
            setScreening(null);
        }
    };

    const copyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        toast.success('Copied', 'Address copied to clipboard');
    };

    const getAmlStatusBadge = (wallet: WalletData) => {
        const status = wallet.aml_status;
        const score = wallet.aml_risk_score;

        if (status === 'not_checked') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    <Shield className="h-3 w-3" />
                    Not Screened
                </span>
            );
        }

        if (status === 'blacklisted') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    <ShieldX className="h-3 w-3" />
                    Blacklisted
                </span>
            );
        }

        if (status === 'critical') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    <ShieldAlert className="h-3 w-3" />
                    Critical ({score?.toFixed(0)}%)
                </span>
            );
        }

        if (status === 'warning') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                    <AlertTriangle className="h-3 w-3" />
                    Warning ({score?.toFixed(0)}%)
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <ShieldCheck className="h-3 w-3" />
                Clear ({score?.toFixed(0)}%)
            </span>
        );
    };

    const getNetworkBadge = (network: string) => {
        const colors: Record<string, string> = {
            solana: 'bg-purple-100 text-purple-700',
            ethereum: 'bg-blue-100 text-blue-700',
            tron: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[network] || 'bg-gray-100 text-gray-700'}`}>
                {network.charAt(0).toUpperCase() + network.slice(1)}
            </span>
        );
    };

    const filteredWallets = wallets.filter(wallet => {
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                wallet.address.toLowerCase().includes(search) ||
                wallet.label?.toLowerCase().includes(search) ||
                wallet.network.toLowerCase().includes(search)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage Turnkey wallets and monitor AML risk scores
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="cursor-pointer bg-gradient-blue flex items-center gap-2 text-white"
                >
                    <Plus className="h-4 w-4" />
                    Create Wallet
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search by address or label..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select
                    value={networkFilter}
                    onChange={setNetworkFilter}
                    options={[{ value: 'all', label: 'All Networks' }, ...NETWORKS]}
                    className="w-full sm:w-40"
                />
                <Select
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[{ value: 'all', label: 'All Types' }, ...WALLET_TYPES]}
                    className="w-full sm:w-40"
                />
                <Button
                    onClick={fetchWallets}
                    variant="outline"
                    className="cursor-pointer flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Wallets Table */}
            <div className="overflow-hidden rounded-lg border bg-white">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredWallets.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                        <Wallet className="mb-4 h-12 w-12 text-gray-300" />
                        <p className="text-lg font-medium">No wallets found</p>
                        <p className="text-sm">Create your first wallet to get started</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Wallet
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Network
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    AML Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Monitoring
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredWallets.map((wallet) => (
                                <tr key={wallet.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {wallet.label || 'Unnamed Wallet'}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs text-gray-500">
                                                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                                                </code>
                                                <button
                                                    onClick={() => copyAddress(wallet.address)}
                                                    className="cursor-pointer text-gray-400 hover:text-gray-600 transition-transform active:scale-95"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {getNetworkBadge(wallet.network)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className="text-sm text-gray-600 capitalize">
                                            {wallet.wallet_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {getAmlStatusBadge(wallet)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {wallet.aml_monitoring_enabled ? (
                                            <span className="inline-flex items-center gap-1 text-sm text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">Disabled</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleScreenWallet(wallet)}
                                                disabled={screening === wallet.id}
                                                className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                                                title="Screen Address"
                                            >
                                                {screening === wallet.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Shield className="h-4 w-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedWallet(wallet);
                                                    setShowDetailModal(true);
                                                }}
                                                className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Wallet Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Wallet"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Wallet Name *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., SOL Master Wallet"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Label</label>
                        <Input
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder="Display label (optional)"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Network *</label>
                        <Select
                            value={formData.network}
                            onChange={(value) => setFormData({ ...formData, network: value })}
                            options={NETWORKS}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Wallet Type</label>
                        <Select
                            value={formData.walletType}
                            onChange={(value) => setFormData({ ...formData, walletType: value })}
                            options={WALLET_TYPES}
                            className="mt-1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="enableKyt"
                            checked={formData.enableKytMonitoring}
                            onChange={(e) => setFormData({ ...formData, enableKytMonitoring: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <label htmlFor="enableKyt" className="text-sm text-gray-700">
                            Enable KYT Monitoring (auto-screen and monitor)
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setShowCreateModal(false)} className="cursor-pointer">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateWallet}
                            disabled={creating || !formData.name}
                            className="cursor-pointer bg-gradient-blue text-white"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Wallet'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Wallet Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Wallet Details"
            >
                {selectedWallet && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-800">Label</p>
                                <p className="font-medium text-gray-600">{selectedWallet.label || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-800">Network</p>
                                <p className="font-medium text-gray-600 capitalize">{selectedWallet.network}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-800">Type</p>
                                <p className="font-medium text-gray-600 capitalize">{selectedWallet.wallet_type.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-800">Status</p>
                                <p className="font-medium text-gray-600 capitalize">{selectedWallet.status}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-800">Address</p>
                            <div className="mt-1 flex items-center gap-2">
                                <code className="flex-1 rounded bg-gray-100 p-2 text-sm text-gray-700 break-all">
                                    {selectedWallet.address}
                                </code>
                                <button
                                    onClick={() => copyAddress(selectedWallet.address)}
                                    className="rounded p-2 text-gray-500 hover:bg-gray-100 transition-transform active:scale-95"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <p className="mb-2 text-sm font-medium text-gray-700">AML Status</p>
                            <div className="flex items-center justify-between">
                                {getAmlStatusBadge(selectedWallet)}
                                {selectedWallet.aml_monitoring_enabled && (
                                    <span className="text-xs text-green-600">Monitoring Active</span>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
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
