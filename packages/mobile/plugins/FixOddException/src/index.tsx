import { before, instead } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { React } from "@vendetta/metro/common";
import { View, Text } from "@vendetta/ui/components";

storage.crashesPrevented ??= 0;

const pushFeedbackModule = findByProps("getPushFeedback", "hasPushNotificationPermissions");
const channelStreamModule = findByProps("createChannelStream", "createDirectMessageChannelStream");

let unpatches = [];

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
	useProxy(storage);

	return (
		<View style={{ padding: 16 }}>
			<Text>Crashes prevented: {storage.crashesPrevented}</Text>
		</View>
	);
}

export default {
	onUnload: () => {
		unpatches.forEach(unpatch => unpatch());
	},
	settings: SettingsPage
};
