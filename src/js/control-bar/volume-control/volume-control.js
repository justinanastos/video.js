/**
 * @file volume-control.js
 */
import Component from '../../component.js';
import checkVolumeSupport from './check-volume-support';
import {isPlain} from '../../utils/obj';
import { throttle, bind } from '../../utils/fn.js';

// Required children
import './volume-bar.js';

/**
 * The component for controlling the volume level
 *
 * @extends Component
 */
class VolumeControl extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options={}]
   *        The key/value store of player options.
   */
  constructor(player, options = {}) {
    options.vertical = options.vertical || false;

    // Pass the vertical option down to the VolumeBar if
    // the VolumeBar is turned on.
    if (typeof options.volumeBar === 'undefined' || isPlain(options.volumeBar)) {
      options.volumeBar = options.volumeBar || {};
      options.volumeBar.vertical = options.vertical;
    }

    super(player, options);

    // hide this control if volume support is missing
    checkVolumeSupport(this, player);

    this.throttledHandleMouseMove = throttle(bind(this, this.handleMouseMove), 25);

    this.on('mousedown', this.handleMouseDown);
    this.on('touchstart', this.handleMouseDown);

    // while the slider is active (the mouse has been pressed down and
    // is dragging) we do not want to hide the VolumeBar
    this.on(this.volumeBar, ['slideractive'], () => {
      this.volumeBar.addClass('vjs-slider-active');
      this.lockShowing_ = true;
    });

    // when the slider becomes inactive again we want to hide
    // the VolumeBar, but only if we tried to hide when
    // lockShowing_ was true. see the VolumeBar#hide function.
    this.on(this.volumeBar, ['sliderinactive'], () => {
      this.volumeBar.removeClass('vjs-slider-active');
      this.lockShowing_ = false;

      if (this.shouldHide_) {
        this.hide();
      }
    });

    // show/hide the VolumeBar on focus/blur
    // happens in VolumeControl but if we want to use the
    // VolumeBar by itself we will need this
    this.on(this.volumeBar, ['focus'], () => this.show());
    this.on(this.volumeBar, ['blur'], () => this.hide());
  }

  /**
   * Remove the visual hidden state from the `VolumeControl`.
   */
  show() {
    this.shouldHide_ = false;

    if (this.options_.vertical) {
      this.removeClass('vjs-visual-hide-vertical');
    } else {
      this.removeClass('vjs-visual-hide-horizontal');
    }

  }

  /**
   * Hide the `VolumeControl` visually but not from screen-readers unless
   * showing is locked (due to the slider being active). If showing is locked
   * hide will be called when the slider becomes inactive.
   */
  hide() {
    // if we are currently locked to the showing state
    // don't hide, but store that we should hide when
    // lockShowing_ turns to a false value.
    if (this.lockShowing_) {
      this.shouldHide_ = true;
      return;
    }

    // animate hiding the bar via transitions
    if (this.options_.vertical) {
      this.addClass('vjs-visual-hide-vertical');
    } else {
      this.addClass('vjs-visual-hide-horizontal');
    }
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    let orientationClass = 'vjs-volume-horizonal vjs-visual-hide-horizontal';

    if (this.options_.vertical) {
      orientationClass = 'vjs-volume-vertical vjs-visual-hide-vertical';
    }

    return super.createEl('div', {
      className: `vjs-volume-control vjs-control ${orientationClass}`
    });
  }

  /**
   * Handle `mousedown` or `touchstart` events on the `VolumeControl`.
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *
   * @listens mousedown
   * @listens touchstart
   */
  handleMouseDown(event) {
    const doc = this.el_.ownerDocument;

    this.on(doc, 'mousemove', this.throttledHandleMouseMove);
    this.on(doc, 'touchmove', this.throttledHandleMouseMove);
    this.on(doc, 'mouseup', this.handleMouseUp);
    this.on(doc, 'touchend', this.handleMouseUp);
  }

  /**
   * Handle `mouseup` or `touchend` events on the `VolumeControl`.
   *
   * @param {EventTarget~Event} event
   *        `mouseup` or `touchend` event that triggered this function.
   *
   * @listens touchend
   * @listens mouseup
   */
  handleMouseUp(event) {
    const doc = this.el_.ownerDocument;

    this.off(doc, 'mousemove', this.throttledHandleMouseMove);
    this.off(doc, 'touchmove', this.throttledHandleMouseMove);
    this.off(doc, 'mouseup', this.handleMouseUp);
    this.off(doc, 'touchend', this.handleMouseUp);
  }

  /**
   * Handle `mousedown` or `touchstart` events on the `VolumeControl`.
   *
   * @param {EventTarget~Event} event
   *        `mousedown` or `touchstart` event that triggered this function
   *
   * @listens mousedown
   * @listens touchstart
   */
  handleMouseMove(event) {
    this.volumeBar.handleMouseMove(event);
  }
}

/**
 * Default options for the `VolumeControl`
 *
 * @type {Object}
 * @private
 */
VolumeControl.prototype.options_ = {
  children: [
    'volumeBar'
  ]
};

Component.registerComponent('VolumeControl', VolumeControl);
export default VolumeControl;
