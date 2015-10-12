# illustrator-to-android

An Adobe Illustrator javascript for rapid UI prototyping & deployment. To be primarily used with the libGDX game development framework.

It processes the active Illustrator document and exports properly named elements as PNG files in different resolutions. In addition, an XML file is created which describes various attributes of each element, such as position, color, size, font type/size/color. For buttons & textButtons it also exports their "pressed", "checked" and "disabled" appearances. Also works with sliders ("knob" & "background" assets), checkboxes ("checked & "un-checked" assets) and editableTextAreas ("background", "cursor", "selectedText" assets).

The steps involved are:

1. Create/update a UI layout in Adobe Illustrator, and properly name all elements to be exported

2. Run the script

3. Run libGDX's texture-packer, to create a sprite sheet with all elements

4. Re-build a project that knows how to a) parse the .xml files and b) unpack the sprite sheets into a TextureAtlas.

-> Done!

(steps 2-4 can be simplified to issuing a single command line)