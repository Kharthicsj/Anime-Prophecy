import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { GlobeIcon } from "../../components/common/Icons";

const NotFoundPage = () => {
	const navigate = useNavigate();

	return (
		<div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
			<div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950/90 p-10 text-center shadow-2xl shadow-black/30">
				<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
					<GlobeIcon className="h-8 w-8" />
				</div>
				<p className="text-sm uppercase tracking-[0.28em] text-zinc-500">
					404
				</p>
				<h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
					Page not found
				</h1>
				<p className="mt-4 text-zinc-400 leading-7">
					The page you requested does not exist or has moved. Return
					to the country selector or continue browsing the catalog.
				</p>
				<div className="mt-8 flex flex-wrap justify-center gap-3">
					<Button onClick={() => navigate("/")} size="md">
						Go to Country Selection
					</Button>
					<Button
						onClick={() => navigate("/")}
						variant="secondary"
						size="md"
					>
						Open Store
					</Button>
				</div>
			</div>
		</div>
	);
};

export default NotFoundPage;
