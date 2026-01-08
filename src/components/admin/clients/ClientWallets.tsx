'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import {
    AlertTriangle,
    Copy,
    Loader2,
    Plus,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    Wallet
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
    aml_risk_score: number | null;
    aml_status: string;
    aml_monitoring_enabled: boolean;
    linkInfo?: {
        isPrimary: boolean;
        linkedAt: string;
        notes?: string;
    };
}

const NETWORKS = [
    { value: 'solana', label: 'Solana (SOL)' },
    { value: 'ethereum', label: 'Ethereum (ETH)' },
    { value: 'tron', label: 'Tron (TRX)' },
];

export function ClientWallets({ clientId }: { clientId: string }) {
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Create form state
    const [formData, setFormData] = useState({
        network: 'solana',
        label: '',
        isPrimary: false,
        enableKytMonitoring: true,
    });

    const toast = useToast();

    const fetchClientWallets = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/client/${clientId}/wallet`);
            const data = await response.json();

            if (response.ok) {
                setWallets(data.wallets || []);
            } else {
                toast.error('Error', data.error || 'Failed to fetch client wallets');
            }
        } catch (error) {
            toast.error('Error', 'Failed to fetch client wallets');
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchClientWallets();
    }, [fetchClientWallets]);

    const handleCreateWallet = async () => {
        try {
            setCreating(true);
            const response = await fetch(`/api/admin/client/${clientId}/wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Success', 'Wallet created successfully');
                setShowCreateModal(false);
                setFormData({
                    network: 'solana',
                    label: '',
                    isPrimary: false,
                    enableKytMonitoring: true,
                });
                fetchClientWallets();
            } else {
                toast.error('Error', data.error || 'Failed to create wallet');
            }
        } catch (error) {
            toast.error('Error', 'Failed to create wallet');
        } finally {
            setCreating(false);
        }
    };

    const copyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        toast.success('Copied', 'Address copied to clipboard');
    };

    const getAmlStatusBadge = (wallet: WalletData) => {
        const status = wallet.aml_status;
        const score = wallet.aml_risk_score;

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

        if (status === 'not_checked') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    <Shield className="h-3 w-3" />
                    Not Screened
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-medium text-gray-900">Client Wallets</h2>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="cursor-pointer bg-gradient-blue flex items-center gap-2 text-white"
                >
                    <Plus className="h-4 w-4" />
                    Add Wallet
                </Button>
            </div>

            {/* Wallets Table */}
            <div className="overflow-hidden rounded-lg border bg-white">
                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center text-gray-500">
                        <Wallet className="mb-2 h-8 w-8 text-gray-300" />
                        <p>No wallets found</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Label
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Network
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Risk Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Primary
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {wallets.map((wallet) => (
                                <tr key={wallet.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <p className="text-sm font-medium text-gray-900">
                                            {wallet.label || 'Unnamed Wallet'}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs text-gray-500 bg-gray-50 p-1 rounded">
                                                {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                                            </code>
                                            <button
                                                onClick={() => copyAddress(wallet.address)}
                                                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-transform active:scale-95"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {getNetworkBadge(wallet.network)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {getAmlStatusBadge(wallet)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        {wallet.linkInfo?.isPrimary && (
                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                Primary
                                            </span>
                                        )}
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
                title="Add Client Wallet"
            >
                <div className="space-y-4">
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
                        <label className="block text-sm font-medium text-gray-700">Label</label>
                        <Input
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder="e.g., Main Trading Wallet"
                            className="mt-1"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isPrimary"
                                checked={formData.isPrimary}
                                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                            <label htmlFor="isPrimary" className="text-sm text-gray-700">
                                Set as Primary Wallet
                            </label>
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
                                Enable KYT Monitoring
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setShowCreateModal(false)} className="cursor-pointer">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateWallet}
                            disabled={creating}
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
        </div>
    );
}
