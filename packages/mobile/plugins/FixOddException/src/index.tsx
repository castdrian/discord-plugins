import { before, instead } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { Text } from "@vendetta/components";

// Initialize crash counter in plugin storage
storage.crashesPrevented ??= 0;

// Find the modules by searching for relevant properties
const pushFeedbackModule = findByProps("getPushFeedback", "hasPushNotificationPermissions");
const channelStreamModule = findByProps("createChannelStream", "createDirectMessageChannelStream");

let unpatches = [];

// Patch the getPushFeedback function to add null checks
if (pushFeedbackModule) {
	const unpatchPushFeedback = before("getPushFeedback", pushFeedbackModule, (args) => {
		const [channel] = args;

		// If channel is null, prevent the crash and return an empty object
		if (!channel) {
			storage.crashesPrevented++;
			// Return an empty feedback object to prevent further processing
			return [{
				channelId: "CRASH_PREVENTED",
				muted: true,
			}];
		}

		if (channel && channel.channelId === undefined) {
			channel.channelId = channel.id || "MISSING_CHANNEL_ID";
		}
	});

	unpatches.push(unpatchPushFeedback);
}

// Patch the createChannelStream function to filter out null channels
if (channelStreamModule) {
	const unpatchCreateChannelStream = instead("createChannelStream", channelStreamModule, (args, orig) => {
		try {
			// Filter out any null channels before they get processed
			const validChannels = args[0]?.filter(channel => channel != null);

			if (validChannels && validChannels.length !== args[0]?.length) {
				args[0] = validChannels;
			}

			return orig(...args);
		} catch (e) {
			// Return a minimal result to prevent crashes
			return [];
		}
	});

	unpatches.push(unpatchCreateChannelStream);
}

// Simple settings UI
function SettingsPage() {
	return React.createElement("div", { style: { padding: 16 } }, [
		React.createElement(Text, {}, `Crashes prevented: ${storage.crashesPrevented}`),
	]);
}

export default {
	onUnload: () => {
		unpatches.forEach(unpatch => unpatch());
	},
	settings: SettingsPage
};
