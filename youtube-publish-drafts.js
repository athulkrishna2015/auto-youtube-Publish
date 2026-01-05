(() => {
  // -----------------------------------------------------------------
  // CONFIG
  // -----------------------------------------------------------------
  const MODE = 'publish_drafts' 
  const DEBUG_MODE = true 
  const MADE_FOR_KIDS = false 
  const VISIBILITY = 'Unlisted' // Defaults to Unlisted

  // -----------------------------------------------------------------
  // INTERNAL UTILS
  // -----------------------------------------------------------------
  const TIMEOUT_STEP_MS = 500 
  const DEFAULT_ELEMENT_TIMEOUT_MS = 20000 

  function debugLog (...args) {
    if (DEBUG_MODE) console.debug(...args)
  }
  
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  // *** NEW: NETWORK CHECKER ***
  async function waitUntilOnline() {
    if (navigator.onLine) return;
    
    debugLog('⚠️ Network Disconnected! Pausing script...');
    while (!navigator.onLine) {
      await sleep(2000);
    }
    debugLog('✅ Network Restored! Resuming in 3 seconds...');
    await sleep(3000); // Give YouTube a moment to reconnect internally
  }

  async function waitForElement (selector, baseEl, timeoutMs) {
    if (timeoutMs === undefined) timeoutMs = DEFAULT_ELEMENT_TIMEOUT_MS
    if (!baseEl) baseEl = document 
    
    let timeout = timeoutMs
    while (timeout > 0) {
      // Pause if offline during wait
      await waitUntilOnline();

      const element = baseEl.querySelector(selector)
      if (element !== null) return element
      await sleep(TIMEOUT_STEP_MS)
      timeout -= TIMEOUT_STEP_MS
    }
    debugLog(`[Warning] could not find ${selector}`)
    return null
  }

  function click (element) {
    if (!element) {
        debugLog('Cannot click null element')
        return
    }
    const event = document.createEvent('MouseEvents')
    event.initMouseEvent('mousedown', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    element.dispatchEvent(event)
    element.click()
    debugLog('Clicked element:', element)
  }

  // ----------------------------------
  // PUBLISH LOGIC
  // ----------------------------------
  const VISIBILITY_PUBLISH_ORDER = { Private: 0, Unlisted: 1, Public: 2 }

  // SELECTORS
  const VIDEO_ROW_SELECTOR = 'ytcp-video-row'
  const DRAFT_MODAL_SELECTOR = '.style-scope.ytcp-uploads-dialog'
  const DRAFT_BUTTON_SELECTOR = '.edit-draft-button'
  const MADE_FOR_KIDS_SELECTOR = '#made-for-kids-group'
  const RADIO_BUTTON_SELECTOR = 'tp-yt-paper-radio-button'
  const VISIBILITY_STEPPER_SELECTOR = '#step-badge-3'
  const VISIBILITY_PAPER_BUTTONS_SELECTOR = 'tp-yt-paper-radio-group'
  const SAVE_BUTTON_SELECTOR = '#done-button'
  const SUCCESS_ELEMENT_SELECTOR = 'ytcp-video-thumbnail-with-info'
  
  const DIALOG_SELECTOR = 'ytcp-video-share-dialog'
  const DIALOG_CLOSE_BUTTON_SELECTOR = '#close-button'

  class SuccessDialog {
    constructor (raw) {
      this.raw = raw
    }

    async close () {
      await sleep(1500)
      await waitUntilOnline(); // Ensure online before closing

      let btn = await waitForElement(DIALOG_CLOSE_BUTTON_SELECTOR, this.raw, 3000)
      
      if (!btn) {
          debugLog('Close button not found in context, searching globally...')
          btn = document.querySelector('ytcp-video-share-dialog #close-button') || 
                document.querySelector('#close-button[label="Close"]')
      }

      if (btn) {
          click(btn)
          await sleep(1000) 
      } else {
          debugLog('CRITICAL: Could not find any close button. Script may get stuck.')
      }
    }
  }

  class VisibilityModal {
    constructor (raw) {
      this.raw = raw
    }

    async setVisibility () {
      await waitUntilOnline();
      const group = await waitForElement(VISIBILITY_PAPER_BUTTONS_SELECTOR, this.raw)
      const value = VISIBILITY_PUBLISH_ORDER[VISIBILITY]
      const radioBtn = [...group.querySelectorAll(RADIO_BUTTON_SELECTOR)][value]
      
      await sleep(1000)
      click(radioBtn)
      await sleep(1000)
    }

    async save () {
      // *** RETRY LOOP FOR SAVING ***
      let success = null;
      let attempts = 0;

      while (!success && attempts < 5) {
        attempts++;
        await waitUntilOnline(); // Ensure online before clicking save
        
        const saveBtn = await waitForElement(SAVE_BUTTON_SELECTOR, this.raw)
        
        if (attempts > 1) debugLog(`Retry attempt ${attempts} for saving...`);
        click(saveBtn)
        
        debugLog('Waiting for save completion...');
        // Wait 15s for the success screen. If it fails (due to network), loop repeats.
        success = await waitForElement(SUCCESS_ELEMENT_SELECTOR, document, 15000)
        
        if (!success) {
            debugLog('Save timed out (possible network error). Retrying...');
            await sleep(2000); // Wait a bit before retrying
        }
      }

      if (!success) {
          throw new Error("Failed to save video after 5 attempts.");
      }

      debugLog('Save completed.')
      const dialogElement = await waitForElement(DIALOG_SELECTOR, document, 5000)
      return new SuccessDialog(dialogElement)
    }
  }

  class DraftModal {
    constructor (raw) {
      this.raw = raw
    }

    async selectMadeForKids () {
      await waitUntilOnline();
      const nthChild = MADE_FOR_KIDS ? 1 : 2
      const radioButton = await waitForElement(`${RADIO_BUTTON_SELECTOR}:nth-child(${nthChild})`, this.raw)
      
      await sleep(1000)
      click(radioButton)
      await sleep(1000)
    }

    async goToVisibility () {
      await waitUntilOnline();
      const stepper = await waitForElement(VISIBILITY_STEPPER_SELECTOR, this.raw)
      click(stepper)
      await sleep(2000) 
      return new VisibilityModal(this.raw)
    }
  }

  class VideoRow {
    constructor (raw) {
      this.raw = raw
    }

    get editDraftButton () {
      return this.raw.querySelector(DRAFT_BUTTON_SELECTOR)
    }

    async openDraft () {
      await waitUntilOnline();
      click(this.editDraftButton)
      const modal = await waitForElement(DRAFT_MODAL_SELECTOR)
      await sleep(1500) 
      return new DraftModal(modal)
    }
  }

  async function publishDrafts () {
    const rows = [...document.querySelectorAll(VIDEO_ROW_SELECTOR)]
    const editable = rows.filter(row => row.querySelector(DRAFT_BUTTON_SELECTOR))

    debugLog(`Found ${editable.length} draft videos.`)
    debugLog('Starting Network-Aware Execution...')
    
    for (const rowEl of editable) {
      const video = new VideoRow(rowEl)
      debugLog('Processing video...')
      
      try {
        const draft = await video.openDraft()
        await draft.selectMadeForKids()
        const visibility = await draft.goToVisibility()
        await visibility.setVisibility()
        
        const successDialog = await visibility.save()
        await successDialog.close()
        
        debugLog('Video processed. Waiting 5s before next...')
        await sleep(5000)
      } catch (e) {
        console.error("Error processing video:", e);
        debugLog("Skipping video due to error and moving to next...");
      }
    }
    debugLog('All Done!')
  }

  // ENTRY POINT
  if (MODE === 'publish_drafts') {
      publishDrafts()
  }
})()
