import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";
import CountryFlag from "./CountryFlag";
import {
	FacebookIcon,
	HeartIcon,
	InstagramIcon,
	PintrestIcon,
	YoutubeIcon,
} from "./Icons";

const NEWSLETTER_COUNTRIES = [
	{ value: "", label: "Select country (optional)", flagValue: null },
	{ value: "Japan", label: "Japan", flagValue: "Japan" },
	{ value: "US", label: "United States", flagValue: "US" },
	{ value: "India", label: "India", flagValue: "India" },
	{ value: "UK", label: "United Kingdom", flagValue: "UK" },
	{ value: "South Korea", label: "South Korea", flagValue: "South Korea" },
	{ value: "Worldwide", label: "Worldwide", flagValue: "Worldwide" },
	{ value: "Others", label: "Others", flagValue: null },
];

const CONTACT_EMAIL = "animeprophecy2005@gmail.com";

const CountrySelectDropdown = ({ value, onChange, disabled }) => {
	const [open, setOpen] = useState(false);
	const rootRef = useRef(null);
	const selected =
		NEWSLETTER_COUNTRIES.find((c) => c.value === value) ||
		NEWSLETTER_COUNTRIES[0];

	useEffect(() => {
		const handleOutside = (e) => {
			if (rootRef.current && !rootRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleOutside);
		return () => document.removeEventListener("mousedown", handleOutside);
	}, []);

	return (
		<div ref={rootRef} className="relative min-w-[200px] flex-[0_1_220px]">
			<button
				type="button"
				disabled={disabled}
				onClick={() => setOpen((o) => !o)}
				className="flex w-full items-center gap-2.5 rounded-full border border-purple-500/30 bg-zinc-900/80 px-4 py-2.5 text-left text-sm text-white outline-none transition hover:border-purple-500/50 disabled:opacity-50"
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				{selected.flagValue ? (
					<CountryFlag
						value={selected.flagValue}
						size="xs"
						mode="image"
					/>
				) : (
					<span className="inline-flex h-[14px] w-5 shrink-0 items-center justify-center text-zinc-500">
						—
					</span>
				)}
				<span className="min-w-0 flex-1 truncate">
					{selected.label}
				</span>
				<span className="text-zinc-500" aria-hidden>
					{open ? "▴" : "▾"}
				</span>
			</button>

			{open && (
				<ul
					role="listbox"
					className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-56 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-xl shadow-black/50"
				>
					{NEWSLETTER_COUNTRIES.map((c) => (
						<li
							key={c.value || "empty"}
							role="option"
							aria-selected={value === c.value}
						>
							<button
								type="button"
								onClick={() => {
									onChange(c.value);
									setOpen(false);
								}}
								className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-800 ${
									value === c.value
										? "bg-purple-900/30 text-violet-200"
										: "text-zinc-200"
								}`}
							>
								{c.flagValue ? (
									<CountryFlag
										value={c.flagValue}
										size="xs"
										mode="image"
									/>
								) : (
									<span className="inline-flex h-[14px] w-5 shrink-0 items-center justify-center text-xs text-zinc-500">
										{c.value === "" ? "—" : "•"}
									</span>
								)}
								<span>{c.label}</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

const NewsletterBar = () => {
	const [email, setEmail] = useState("");
	const [country, setCountry] = useState("");
	const [status, setStatus] = useState(null);
	const [msg, setMsg] = useState("");

	const handleSubscribe = async (e) => {
		e.preventDefault();
		if (!email.trim()) return;
		setStatus("loading");
		const savedCountry = country === "Others" ? "Worldwide" : country;
		try {
			const res = await apiClient.post("/newsletter/subscribe", {
				email: email.trim(),
				country: savedCountry,
				source: "landing",
			});
			setMsg(res.data?.message || "Subscribed successfully!");
			setStatus("success");
			setEmail("");
			setCountry("");
		} catch (err) {
			setMsg(
				err.response?.data?.message ||
					"Something went wrong. Please try again.",
			);
			setStatus("error");
		}
		setTimeout(() => setStatus(null), 4000);
	};

	return (
		<div className="border-b border-zinc-800/80 bg-gradient-to-b from-violet-950/25 to-zinc-950 px-4 py-12 sm:px-6 sm:py-14">
			<div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
				<div className="space-y-2">
					<p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-purple-400">
						✦ Stay in the loop
					</p>
					<h3 className="text-xl font-extrabold text-white sm:text-2xl">
						Get Exclusive Anime Merch Drops
					</h3>
					<p className="text-sm text-zinc-500">
						Subscribe for curated deals, new arrivals, and
						region-specific alerts.
					</p>
				</div>

				<form
					onSubmit={handleSubscribe}
					className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center"
				>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="your@email.com"
						required
						disabled={status === "loading"}
						className="min-w-0 flex-1 rounded-full border border-purple-500/30 bg-zinc-900/80 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500/60 sm:min-w-[200px]"
					/>
					<CountrySelectDropdown
						value={country}
						onChange={setCountry}
						disabled={status === "loading"}
					/>
					<button
						type="submit"
						disabled={status === "loading"}
						className="rounded-full bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:shrink-0"
					>
						{status === "loading" ? "Subscribing…" : "Subscribe →"}
					</button>
				</form>

				{status && status !== "loading" && (
					<p
						className={`text-sm font-medium ${
							status === "success"
								? "text-green-400"
								: "text-red-400"
						}`}
					>
						{status === "success" ? "✓ " : "✗ "}
						{msg}
					</p>
				)}
			</div>
		</div>
	);
};

const Footer = () => {
	const footerLinks = {
		company: [
			{ label: "About Us", to: "/legal/about" },
			{ label: "Contact Us", to: "/legal/contact" },
			// { label: "Blog", to: "/legal/blog" },
		],
		legal: [
			{
				label: "Affiliate Disclosure",
				to: "/legal/affiliate-disclosure",
			},
			{ label: "Privacy Policy", to: "/legal/privacy" },
			{ label: "Terms & Conditions", to: "/legal/terms" },
			{ label: "Disclaimer", to: "/legal/disclaimer" },
		],
	};

	const socialLinks = [
		{
			icon: YoutubeIcon,
			label: "YouTube",
			href: "https://www.youtube.com/@ANIMEPROPHECY22",
			color: "hover:text-red-500",
		},
		{
			icon: PintrestIcon,
			label: "Pinterest",
			href: "https://pin.it/Mmw0KNf9R",
			color: "hover:text-rose-400",
		},
		{
			icon: FacebookIcon,
			label: "Facebook",
			href: "https://www.facebook.com/share/1FQ7qwjUj4/",
			color: "hover:text-sky-400",
		},
		{
			icon: InstagramIcon,
			label: "Instagram",
			href: "https://www.instagram.com/anime.prophecy_official?igsh=MWljb21tb2xzeGJ6Yw==",
			color: "hover:text-pink-400",
		},
	];

	return (
		<footer className="bg-zinc-950 border-t border-zinc-800">
			<NewsletterBar />

			<div className="max-w-7xl mx-auto px-4 py-14">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<svg
								viewBox="0 0 24 24"
								className="h-8 w-8 text-purple-400"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M12 2l1.9 5.8L20 9.7l-5.3 3.8L16.8 20 12 16.7 7.2 20l2.1-6.5L4 9.7l6.1-1.9Z" />
							</svg>
							<h3 className="text-xl font-bold text-white">
								Prophecy Hub
							</h3>
						</div>
						<p className="text-zinc-400 text-sm leading-6">
							A premium anime commerce experience with regional
							storefronts, curated product discovery, and a dark
							cinematic interface.
						</p>
						<p className="text-zinc-500 text-xs">
							© 2026 Prophecy Hub. All rights reserved.
						</p>
					</div>

					<div className="space-y-4">
						<h4 className="font-bold text-white text-sm">
							Company
						</h4>
						<ul className="space-y-2">
							{footerLinks.company.map((link) => (
								<li key={link.label}>
									<Link
										to={link.to}
										className="text-zinc-400 hover:text-purple-400 transition-colors text-sm"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div className="space-y-4">
						<h4 className="font-bold text-white text-sm">Legal</h4>
						<ul className="space-y-2">
							{footerLinks.legal.map((link) => (
								<li key={link.label}>
									<Link
										to={link.to}
										className="text-zinc-400 hover:text-purple-400 transition-colors text-sm"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div className="space-y-4">
						<h4 className="font-bold text-white text-sm">
							Connect With Us
						</h4>
						<div className="flex gap-3">
							{socialLinks.map((social) => (
								<a
									key={social.label}
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									className={`text-zinc-400 transition-colors ${social.color}`}
									title={social.label}
								>
									<social.icon className="h-5 w-5" />
								</a>
							))}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8 border-t border-zinc-800">
					<div className="space-y-1">
						<p className="text-zinc-500 text-xs">EMAIL</p>
						<a
							href={`mailto:${CONTACT_EMAIL}`}
							className="text-white font-semibold hover:text-purple-400 transition-colors"
						>
							{CONTACT_EMAIL}
						</a>
					</div>
					<div className="space-y-1">
						<p className="text-zinc-500 text-xs">LOCATION</p>
						<p className="text-white font-semibold">
							Anime Merchandise Hub, Global
						</p>
					</div>
				</div>
			</div>

			<div className="border-t border-zinc-800 bg-zinc-900/40 py-5">
				<div className="max-w-7xl mx-auto px-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-xs text-zinc-500">
					<p>
						Prophecy Hub is not affiliated with any anime studios or
						production companies. Product links may generate
						affiliate commissions.
					</p>
					<p className="flex items-center justify-end gap-1.5 text-right text-zinc-400">
						<span>Made with</span>
						<HeartIcon
							className="h-3.5 w-3.5 shrink-0 text-rose-400"
							aria-hidden
						/>
						<span>by</span>
						<a
							href="https://kharthicsj.onrender.com"
							target="_blank"
							rel="noreferrer"
							className="font-medium text-zinc-200 transition-colors hover:text-white"
						>
							Kharthic S J
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
