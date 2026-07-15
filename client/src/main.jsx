import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
	api_host: import.meta.env.VITE_POSTHOG_HOST,
	person_profiles: "identified_only", // Keeps anonymous users anonymous
});

// Do not send analytics when running locally on localhost
if (import.meta.env.DEV) {
    posthog.opt_out_capturing();
}

const rootElement = document.getElementById("root");
const app = (
	<StrictMode>
		<PostHogProvider client={posthog}>
			<App />
		</PostHogProvider>
	</StrictMode>
);

	createRoot(rootElement).render(app);
