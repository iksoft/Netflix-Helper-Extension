# 🎬 Netflix Helper Pro

A professional browser extension that enhances your Netflix streaming experience by automatically removing interstitial modals and resuming playback.

## ✨ Features

- **Auto-remove Overlays**: Automatically removes Netflix interstitial modals and popups
- **Resume Playback**: Automatically resumes video playback when paused
- **Real-time Status**: Monitor video and overlay status in real-time
- **Professional UI**: Modern, intuitive popup interface
- **Error Handling**: Robust error handling and user feedback
- **Auto-detection**: Automatically detects and removes overlays as they appear

## 🚀 Installation

### For Development

1. **Clone or download** this repository
2. **Generate Icons** (see Icon Generation section below)
3. **Load Extension** in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select this folder
   - The extension will appear in your toolbar

### Icon Generation

The extension requires PNG icons in multiple sizes. To generate them:

1. **Open** `simple_icon_generator.html` in your web browser
2. **Wait** for the automatic generation to complete
3. **Move** the downloaded PNG files to the `icons/` directory:
   - `icon16.png`
   - `icon32.png` 
   - `icon48.png`
   - `icon128.png`

## 📁 Project Structure

```
netflix-helper-extension/
├── manifest.json          # Extension configuration
├── content.js             # Content script for Netflix pages
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── icons/
│   ├── icon.svg           # Source SVG icon
│   ├── icon16.png         # 16x16 icon
│   ├── icon32.png         # 32x32 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
├── simple_icon_generator.html  # Icon generation tool
└── README.md              # This file
```

## 🛠️ Usage

1. **Navigate** to any Netflix page
2. **Click** the Netflix Helper Pro icon in your browser toolbar
3. **Use** the popup interface to:
   - Remove overlays manually
   - Resume video playback
   - Check current status
   - Refresh status information

## 🔧 Technical Details

### Content Script (`content.js`)
- **NetflixHelper Class**: Main functionality container
- **Auto-removal**: Uses MutationObserver to detect and remove overlays
- **Multiple Selectors**: Targets various Netflix modal types
- **Error Handling**: Comprehensive error catching and logging

### Popup Interface (`popup.html` & `popup.js`)
- **Modern UI**: Professional gradient design with animations
- **Real-time Status**: Live updates of video and overlay status
- **User Feedback**: Success/error notifications
- **Responsive Design**: Works across different screen sizes

### Manifest (`manifest.json`)
- **Manifest V3**: Latest Chrome extension standard
- **Minimal Permissions**: Only requires access to Netflix domains
- **Professional Metadata**: Complete extension information

## 🎨 Icon Design

The extension features a custom-designed icon that combines:
- **Netflix Red**: Official Netflix brand colors (#E50914)
- **Play Button**: Universal play symbol for media control
- **Helper Elements**: Checkmark indicating assistance functionality
- **Modern Style**: Gradient backgrounds and subtle shadows

## 🔒 Privacy & Security

- **No Data Collection**: The extension doesn't collect or transmit any user data
- **Local Processing**: All functionality runs locally in your browser
- **Minimal Permissions**: Only accesses Netflix.com domains
- **Open Source**: Transparent code for security review

## 🐛 Troubleshooting

### Extension Not Working
1. **Check Permissions**: Ensure the extension has access to Netflix
2. **Refresh Page**: Reload the Netflix page after installing
3. **Check Console**: Open browser dev tools to see any error messages

### Icons Not Loading
1. **Generate Icons**: Use the icon generator tool
2. **Check File Names**: Ensure PNG files are named correctly
3. **Reload Extension**: Remove and re-add the extension

### Overlays Not Removing
1. **Manual Removal**: Try the "Remove Overlays" button in the popup
2. **Page Refresh**: Netflix may have updated their modal structure
3. **Check Selectors**: Review console for any selector errors

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly on Netflix
5. **Submit** a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Open an issue on the project repository

---

**Made with ❤️ for Netflix users everywhere** 