import { Link, useParams, Navigate } from "react-router-dom";
import { LEGAL_PAGES } from "../../data/legalContent";

const LegalPage = () => {
	const { page } = useParams();
	const content = LEGAL_PAGES[page];

	if (!content) return <Navigate to="/" replace />;

	return (
		<div className="min-h-screen bg-zinc-950 text-white">
			<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
				<Link
					to="/"
					className="mb-8 inline-flex text-sm text-violet-400 transition hover:text-violet-300"
				>
					← Back to home
				</Link>
				<h1 className="mb-8 text-3xl font-extrabold tracking-tight">
					{content.title}
				</h1>
				<div className="space-y-8">
					{content.sections.map((section) => (
						<section key={section.heading}>
							<h2 className="mb-3 text-lg font-bold text-violet-200">
								{section.heading}
							</h2>
							<p className="leading-relaxed text-zinc-400">
								{section.body}
							</p>
						</section>
					))}
				</div>
				{page === "contact" && (
					<p className="mt-10">
						<a
							href="mailto:animeprophecy2005@gmail.com"
							className="font-semibold text-violet-400 hover:text-violet-300"
						>
							animeprophecy2005@gmail.com
						</a>
					</p>
				)}
			</div>
		</div>
	);
};

export default LegalPage;
