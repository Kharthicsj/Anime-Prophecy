import React, { useState } from "react";
import { FiLink, FiX, FiTerminal, FiRefreshCw } from "react-icons/fi";
import { SiAliexpress, SiFlipkart } from "react-icons/si";
import { FaAmazon } from "react-icons/fa";
import apiClient from "../../services/apiClient";

const AffiliateSelectionModal = ({ onClose, onSelect, onOpenCronLogs }) => {
	const [isSyncing, setIsSyncing] = useState(false);
	const platforms = [
		{ id: 'aliexpress', name: 'AliExpress', icon: <SiAliexpress />, color: 'orange-500', bg: 'hover:border-orange-500', desc: 'Fetch products using AliExpress API', warning: 'Requires VPN connection to avoid API timeouts.' },
		{ id: 'cj', name: 'CJ Affiliate', icon: <FiLink />, color: 'green-500', bg: 'hover:border-green-500', desc: 'Fetch bulk products securely via CJ API.' },
		{ id: 'amazon', name: 'Amazon (PA-API)', icon: <FaAmazon />, color: 'blue-500', bg: 'hover:border-blue-500', desc: 'Fetch products using Amazon Affiliate API (Coming Soon)' },
		{ id: 'flipkart', name: 'Flipkart', icon: <SiFlipkart />, color: 'yellow-500', bg: 'hover:border-yellow-500', desc: 'Fetch products using Flipkart Affiliate API (Coming Soon)' },
	];

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
			<div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
				<div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
					<div>
						<h2 className="text-xl font-bold text-white flex items-center gap-2">
							<FiLink className="text-purple-500" /> Fetch Affiliate Products
						</h2>
						<p className="text-sm text-zinc-400 mt-1">Select the affiliate platform you want to import from.</p>
					</div>
					<div className="flex items-center gap-3">
						<button 
							onClick={async () => {
								if (isSyncing) return;
								try {
									setIsSyncing(true);
									const res = await apiClient.post('/products/admin/trigger-sync');
									alert(res.data.message || 'Sync completed successfully!');
								} catch (err) {
									alert('Failed to trigger sync.');
								} finally {
									setIsSyncing(false);
								}
							}}
							disabled={isSyncing}
							className={`whitespace-nowrap cursor-pointer text-xs font-semibold ${isSyncing ? 'text-zinc-500 bg-zinc-800' : 'text-zinc-300 bg-blue-900/30 hover:bg-blue-900/50 border-blue-900'} px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2`}
						>
							<FiRefreshCw className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Force Sync'}
						</button>
						<button 
							onClick={() => { onClose(); if (onOpenCronLogs) onOpenCronLogs(); }} 
							className="whitespace-nowrap cursor-pointer text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors flex items-center gap-2"
						>
							<FiTerminal /> View Sync Logs
						</button>
						<button onClick={onClose} className="cursor-pointer text-zinc-400 hover:text-white p-2 flex items-center justify-center">
						<FiX className="w-5 h-5" />

						</button>
					</div>
				</div>
				<div className="p-6 bg-black/20 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
					{platforms.map((p) => (
						<button
							key={p.id}
							onClick={() => (p.id === 'aliexpress' || p.id === 'cj') ? onSelect(p.id) : null}
							className={`text-left p-5 rounded-xl border flex flex-col gap-3 transition-all ${(p.id === 'aliexpress' || p.id === 'cj') ? `bg-zinc-800 border-zinc-700 ${p.bg} cursor-pointer hover:shadow-lg text-white` : 'bg-zinc-900/50 border-zinc-800 opacity-60 cursor-not-allowed text-zinc-500'}`}
						>
							<div className={`text-4xl text-${p.color}`}>{p.icon}</div>
							<div className="w-full">
								<h3 className={`text-lg font-bold text-${p.color}`}>{p.name}</h3>
								<p className="text-xs text-zinc-400 leading-relaxed mt-1">{p.desc}</p>
								{p.warning && <div className="mt-3 text-xs font-semibold text-orange-400 bg-orange-950/40 p-2 rounded border border-orange-900/50">⚠️ {p.warning}</div>}
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
};
export default AffiliateSelectionModal;
