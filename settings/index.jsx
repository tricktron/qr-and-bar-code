
function mySettings(props) {
  const screenWidth = props.settingsStorage.getItem("screenWidth");
  const screenHeight = props.settingsStorage.getItem("screenHeight");

  return (
    <Page>
      <Section title={ <Text bold align="center">QR Code 1</Text>}>
        <ImagePicker
          title="Background Image"
          description="Pick an image to use as a QR code."
          label="Pick a Background Image"
          sublabel="Background image picker"
          settingsKey="background-image"
          imageWidth={ screenWidth }
          imageHeight={ screenHeight }
        />
       </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
