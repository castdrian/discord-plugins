import { before, instead } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { React } from "@vendetta/metro/common";
import { View, Text } from "@vendetta/ui/components";
import { logger } from "@vendetta/logger";

storage.crashesPrevented ??= 0;

// Use try/catch when loading modules to prevent installation errors
let pushFeedbackModule;
let channelStreamModule;

try {
	pushFeedbackModule = findByProps("getPushFeedback", "hasPushNotificationPermissions");
} catch (e) {
	logger.error("FixOddException: Failed to find pushFeedbackModule", e);
}

try {
	channelStreamModule = findByProps("createChannelStream", "createDirectMessageChannelStream");
} catch (e) {
	logger.error("FixOddException: Failed to find channelStreamModule", e);
}

let unpatches = [];

// Only patch if the module was successfully loaded
if (pushFeedbackModule) {
	const unpatchPushFeedback = before("getPushFeedback", pushFeedbackModule, (args) => {
		const [channel] = args;

		if (!channel) {
			storage.crashesPrevented++;
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

if (channelStreamModule) {
	const unpatchCreateChannelStream = instead("createChannelStream", channelStreamModule, (args, orig) => {
		try {
			const validChannels = args[0]?.filter(channel => channel != null);

			if (validChannels && validChannels.length !== args[0]?.length) {
				args[0] = validChannels;
			}

			return orig(...args);
		} catch (e) {
			return [];
		}
	});

	unpatches.push(unpatchCreateChannelStream);
}

function SettingsPage() {
	return (
		<View style={{ padding: 16 }}>
			<Text>Crashes prevented: {storage.crashesPrevented}</Text>
			{(!pushFeedbackModule || !channelStreamModule) &&
				<Text style={{ color: "red", marginTop: 8 }}>
					Warning: Some modules could not be loaded. The plugin may not function correctly.
				</Text>
			}
		</View>
	);
}

export default {
	onLoad: () => {
		logger.log("FixOddException: Plugin loaded");
	},
	onUnload: () => {
		unpatches.forEach(unpatch => unpatch());
		logger.log("FixOddException: Plugin unloaded");
	},
	settings: SettingsPage
};
