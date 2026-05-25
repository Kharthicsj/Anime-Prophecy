import { Link } from "react-router-dom";

const BannerDisplay = ({ banner }) => {
	if (!banner || !banner.image) {
		return null;
	}

	const content = (
		<div className="relative w-full h-64 rounded-lg overflow-hidden group">
			<img
				src={banner.image.url}
				alt={banner.title}
				className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
			<div className="absolute bottom-0 left-0 right-0 p-4">
				<h3 className="text-xl font-bold text-white">{banner.title}</h3>
				{banner.description && (
					<p className="text-gray-200 text-sm mt-1">
						{banner.description}
					</p>
				)}
			</div>
		</div>
	);

	if (banner.link) {
		return (
			<a
				href={banner.link}
				target="_blank"
				rel="noopener noreferrer"
				className="block cursor-pointer"
			>
				{content}
			</a>
		);
	}

	return content;
};

export default BannerDisplay;
