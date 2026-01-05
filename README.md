
# YouTube Bulk Publish Drafts Script

A robust JavaScript tool designed to automate the process of publishing bulk "Draft" videos in YouTube Studio. This script runs directly in the browser console and handles audience settings, visibility selection, and network instability automatically.

## 🚀 Features

* **Bulk Automation:** Iterates through all draft videos on the current page and publishes them one by one.
* **Network Resilience:** Automatically pauses execution if the internet disconnects and resumes when online.
* **Smart Retries:** Detects if a "Save" fails due to network timeout and retries automatically up to 5 times.
* **Throttled Execution:** Intentionally slows down clicks to prevent YouTube's internal "Browser is offline" or "Race condition" errors.
* **Configurable:** Easily change visibility (Public/Unlisted/Private) and Audience settings.

## 📋 Prerequisites

* A desktop browser (Chrome, Firefox, Edge, Brave, etc.).
* YouTube Studio account with videos uploaded as **Drafts**.

## ⚙️ Configuration

At the very top of the script, you will see a **CONFIG** section. You can edit these values before running the script:

```javascript
// -----------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------
const MODE = 'publish_drafts'; 
const DEBUG_MODE = true;       // Set to false to reduce console clutter
const MADE_FOR_KIDS = false;   // true = Yes, it's for kids; false = No, it's not
const VISIBILITY = 'Unlisted'; // Options: 'Public', 'Unlisted', 'Private'

```

* **`VISIBILITY`**: Change this to `'Public'` if you want videos to go live immediately.
* **`MADE_FOR_KIDS`**: Ensure this matches your content type to comply with COPPA.

## 🛠️ How to Use

1. **Log in** to [YouTube Studio](https://studio.youtube.com/).
2. Navigate to the **Content** tab (Video list).
3. Ensure your **Draft** videos are visible in the list.
* *Tip: You can filter by "Draft" to see only unpublished videos.*


4. Open the **Developer Console**:
* **Windows/Linux:** Press `F12` or `Ctrl` + `Shift` + `J`.
* **Mac:** Press `Cmd` + `Option` + `J`.


5. **Paste** the script into the console area.
6. Press **Enter**.
7. **Wait.** The script will open each draft, select the settings, save, and close the dialog.
* *Note: Do not close the tab or refresh the page while it is running.*



## ⚠️ Known Behaviors

* **Pausing:** You might see the script "wait" for 5-10 seconds between videos. This is intentional to prevent YouTube from crashing or blocking the automated clicks.
* **Network Loss:** If your internet drops, the console will log `⚠️ Network Disconnected! Pausing script...`. It will resume automatically once you reconnect.

## 🛑 Troubleshooting

* **Script stops mid-way:**
* If the script gets stuck for more than 1 minute, you can refresh the page and run the script again. It will skip videos that are already published and continue with the remaining drafts.


* **"Cannot read properties of null":**
* This usually means YouTube changed their website layout (DOM). Ensure you are using the latest version of this script.



## 📄 Disclaimer

This script is for educational and productivity purposes. It interacts with the YouTube Studio DOM directly. YouTube frequently updates their interface, which may break selectors in this script. Use responsibly.

This script is for educational and productivity purposes. It interacts with the YouTube Studio DOM directly. YouTube frequently updates their interface, which may break selectors in this script. Use responsibly.
