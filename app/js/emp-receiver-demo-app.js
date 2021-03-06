﻿import window from 'global/window';
import document from 'global/document';
import empReceiver from 'emp-chromecast-receiver-2-dev';

const empPlayer = empReceiver.empPlayer;

 /**
 * EMPReceiverApp - UIController that handle the ui-logic for the receiver.
 * It instantiate the empReceiver and listen to events.
 *  
 * You make changes in this class to build your own Receiver, with your preferred look and feel.
 */
class EMPReceiverApp {

  constructor() {
    let player = document.getElementById('player');
    this.container_ = document.getElementById('receiver');
    /**
    * Timeout in hours when a "Are You Still Watching?" message will be displayed.
    * Playback will be paused and Chromecast PAUSED IdleTimeout will be trigger.
    * If sender not send PLAY before PAUSED IdleTimeout (20 min) the cast session will stop.
    * If value is zero, this feature will be disabled and casting will continue forever when live streaming.
    */
    this.Still_Watching_Timeout = 10;

    let options = {
      debug: false,
      statusText: 'Chromecast-TV',
      playerOptions: {
        errorDisplay: false, //error displayed with showError method in EMPReceiverApp
        mediaInfo: {
          artworkEnable: true,
          titleEnable: true,
          subtitleEnable: true,
          logoEnable: true
        }
      }
    };

    this.empReceiver_ = new empReceiver(player, options, () => {
      this.empReceiver_.player.on(empPlayer.Events.PLAYING, this.onPlayStateChange.bind(this));
      this.empReceiver_.player.on(empPlayer.Events.PAUSE, this.onPlayStateChange.bind(this));
      this.empReceiver_.player.on(empPlayer.Events.SEEKING, this.onPlayStateChange.bind(this));
      this.empReceiver_.player.on(empPlayer.Events.WAITING, this.onPlayStateChange.bind(this));
      this.empReceiver_.player.on(empPlayer.Events.ENDED, this.onPlayStateChange.bind(this));
      this.empReceiver_.player.on(empPlayer.Events.ERROR, this.onPlayStateChange.bind(this));
      this.empReceiver_.player.on(empPlayer.Events.PROGRAM_CHANGED, this.onProgramChanged.bind(this));
      this.empReceiver_.player.on(empPlayer.Events.ASSET_CHANGED, this.onVODAssetChanged.bind(this));
    });

    this.empReceiver_.on(empReceiver.Events.STATE_CHANGED, this.onStateChange.bind(this));
    this.empReceiver_.on(empReceiver.Events.METADATA_UPDATED, this.onMetadataUpdate.bind(this));
    this.empReceiver_.on(empReceiver.Events.RESOLUTION_CHANGED, this.onResolutionChanged.bind(this));
  }


  /**
  * Handle metadata changed, Update the mediaArt UI here
  *
  * @param {object} metadata {title:'', subtitle:'', images:[]}
  */
  onMetadataUpdate(metadata) {
    this.onStateChange('update');
    //Code to handle Metadata Update

    //Show media info
    setTimeout(function () {
      this.onStateChange('playing');
    }.bind(this), 1000);
  }


  /**
  * Handle resolution changed, show/hide resolution text
  *
  * @param {string} resolution ['SD','HD','2K','4K']
  */
  onResolutionChanged(resolution) {
    //Code to handle resolution change
  }


  /**
  *  Handle play state change,
  *
  * @param {Event} event the play state event that triggered this function
  * @param {object} data the data that was sent with the event
  */
  onPlayStateChange(event, data) {
    empPlayer.log('playStateChanged', event, data);
    if ('ended' === event.type) {
      // You can now load the next asset...
    }
    else if ('playing' === event.type) {
      var els = document.getElementsByClassName('vjs-current-time');
      if (els && els.length > 0) {
        var timeDisplay = els[0];
        if (this.empReceiver_.player.isLive() && !this.empReceiver_.player.timeShiftEnabled()) {
          timeDisplay.style.display = 'none';
        }
        else {
          timeDisplay.style.display = 'block';
        }
      }
      if (!this.stillWatchingTimeout_) {
        this.restartStillWatchingTimeout();
      }
    }
    else if ('error' === event.type) {
      const error = this.empReceiver_.player.getError();
      this.showError(error ? error.message : data);
    }
  }


  /**
  *  Handle empReceiver state change,
  *
  * @param {string} state empReceiver.ReceiverStates ['launching', 'loading','buffering', 'seeking', 'playing', 'paused', 'done', 'idle']
  */
  onStateChange(state) {
    if (state === empReceiver.ReceiverStates.BUFFERING) {
      //buffering is handle by videojs, vjs-waiting class
      return;
    }
    this.container_.setAttribute('state', state);
    if (state === empReceiver.ReceiverStates.LOADING) {
      this.hideError();
      this.restartStillWatchingTimeout();
    }
    else if (state === empReceiver.ReceiverStates.IDLE) {
      let logo = document.getElementById('media-logo');
      logo.style.backgroundImage = 'url("images/logo.png")';
    }
  }

  /**
  * Restart Still Watching Timeout
  */
  restartStillWatchingTimeout() {
    if (this.stillWatchingTimeout_) {
      clearTimeout(this.stillWatchingTimeout_);
      this.stillWatchingTimeout_ = null;
    }
    if (!this.Still_Watching_Timeout)
      return;

    var stillWatchingEl = document.getElementById('still-watching');
    if (stillWatchingEl) {
      stillWatchingEl.style.display = 'none';
    }
    this.stillWatchingTimeout_ = setTimeout(() => {
      if (this.stillWatchingTimeout_) {
        clearTimeout(this.stillWatchingTimeout_);
        this.stillWatchingTimeout_ = null;
      }

      this.empReceiver_.player.pause();
      if (stillWatchingEl) {
        stillWatchingEl.innerHTML = 'Are You Still Watching?';
        stillWatchingEl.style.display = 'block';
      }
    }, this.Still_Watching_Timeout * 1000 * 3600);
  }


  /**
  * show error message on screen
  *
  * @param {string} message
  */
  showError(message) {
    let errorDisplay = document.getElementById('emp-error-display');
    if (errorDisplay) {
      errorDisplay.innerHTML = '[ERROR] ' + (message ? message : '');
      errorDisplay.style.display = 'block';
    }
  }

  /**
  * Hide error message on screen
  *
  */
  hideError() {
    let errorDisplay = document.getElementById('emp-error-display');
    if (errorDisplay) {
      errorDisplay.style.display = 'none';
    }
  }

  /**
  *  Handle Program changed,
  *
  * @param {Event} event the event that triggered this function
  * @param {object} data the data that was sent with the event, contain the program
  */
  onProgramChanged(event, data) {
    if (data && data.program) {
     //Code to handle Program Asset Changed
    }
  }

  /**
  *  Handle VOD Asset changed,
  *
  * @param {Event} event the event that triggered this function
  * @param {object} data the data that was sent with the event, contain the asset
  */
  onVODAssetChanged(event, data) {
    if (data && data.asset) {
      //Code to handle VOD Asset Changed
    }
  }
}

/**
*  Initialize then receiver app
*/
function receiverAppInit() {
  empPlayer.log.setLogToBrowserConsole(true);
  window.receiverApp = new EMPReceiverApp();
}

if (document.readyState === 'loading' ||
  document.readyState === 'interactive') {
  window.addEventListener('load', receiverAppInit);
} else {
  receiverAppInit();
}
