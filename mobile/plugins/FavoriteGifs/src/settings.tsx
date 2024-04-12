import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets"
import { Forms, General } from "@vendetta/ui/components";

const { ScrollView } = General;
const { FormSection, FormSwitchRow, FormIcon } = Forms;

export default () =>  {
	useProxy(storage);
  
	return (
	  <ScrollView style={{ flex: 1 }}>
		<FormSection title="Settings" >
			<FormSwitchRow
				label="Confirm actions"
				subLabel="Show a confirmation alert before performing actions"
				leading={<FormIcon source={getAssetIDByName("alert")} />}
				value={ storage.confirm ?? false }
				onValueChange={ (value: boolean) => {
					storage.confirm = value;
				}}
			/>
		</FormSection>
	  </ScrollView>
	);
}