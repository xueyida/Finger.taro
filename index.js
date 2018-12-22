import Taro, { Component } from '@tarojs/taro';
import { View }  from '@tarojs/components';
import './index.scss';

export default class Finger extends Component {
  constructor(props) {
    super(props);

    this.preV = { x: null, y: null };
    this.pinchStartLen = null;
    this.scale = 1;
    this.isSingleTap = false;
    this.isDoubleTap = false;
    this.delta = null;
    this.last = null;
    this.now = null;
    this.end = null;
    this.multiTouch = false;
    this.tapTimeout = null;
    this.longTapTimeout = null;
    this.singleTapTimeout = null;
    this.swipeTimeout=null;
    this.x1 = this.x2 = this.y1 = this.y2 = null;
    this.preTapPosition={x: null, y: null};

    // Disable taps after longTap
    this.afterLongTap = false;
    this.afterLongTapTimeout = null;
  }

  getLen(v) {
      return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  dot(v1, v2) {
      return v1.x * v2.x + v1.y * v2.y;
  }

  getAngle(v1, v2) {
      var mr = this.getLen(v1) * this.getLen(v2);
      if (mr === 0) return 0;
      var r = this.dot(v1, v2) / mr;
      if (r > 1) r = 1;
      return Math.acos(r);
  }

  cross(v1, v2) {
      return v1.x * v2.y - v2.x * v1.y;
  }

  getRotateAngle(v1, v2) {
      var angle = this.getAngle(v1, v2);
      if (this.cross(v1, v2) > 0) {
          angle *= -1;
      }

      return angle * 180 / Math.PI;
  }

  self_resetState() {
      this.setState({
        x: null,
        y: null,
        swiping: false,
        start: 0
      });
  }


  self_emitEvent(name, ...arg) {
      if (this.props[name]) {
          this.props[name](...arg);
      }
  }

  self_handleTouchStart (evt) {
      this.self_emitEvent('onTouchStart', evt);
      if (!evt.touches) return;
      this.now = Date.now();
      this.x1 = evt.touches[0].pageX;
      this.y1 = evt.touches[0].pageY;
      this.delta = this.now - (this.last || this.now);
      if (this.preTapPosition.x!==null) {
          this.isDoubleTap = (this.delta > 0 && this.delta <= 250&&Math.abs(this.preTapPosition.x-this.x1)<30&&Math.abs(this.preTapPosition.y-this.y1)<30);
      }
      this.preTapPosition.x=this.x1;
      this.preTapPosition.y=this.y1;
      this.last = this.now;
      var preV = this.preV,
          len = evt.touches.length;

      if (len > 1) {
          this.self_cancelLongTap();
          this.self_cancelSingleTap();
          var v = { x: evt.touches[1].pageX - this.x1, y: evt.touches[1].pageY - this.y1 };
          preV.x = v.x;
          preV.y = v.y;
          this.pinchStartLen = this.getLen(preV);
          this.self_emitEvent('onMultipointStart', evt);
      } else {
          this.isSingleTap = true;
      }
      this.longTapTimeout = setTimeout(() => {
          this.self_emitEvent('onLongTap', evt);
          this.afterLongTap = true;
          this.afterLongTapTimeout = setTimeout(() => {
              this.afterLongTap = false;
          }, 1000);
      }, 750);
  }

  self_handleTouchMove(evt) {
      this.self_emitEvent('onTouchMove', evt);
      var preV = this.preV,
          len = evt.touches.length,
          currentX = evt.touches[0].pageX,
          currentY = evt.touches[0].pageY;
      this.isSingleTap = false;
      this.isDoubleTap = false;
      if (len > 1) {
          var v = { x: evt.touches[1].pageX - currentX, y: evt.touches[1].pageY - currentY };
          if (preV.x !== null) {
              if (this.pinchStartLen > 0) {
                  evt.center = {
                      x: (evt.touches[1].pageX + currentX) / 2,
                      y: (evt.touches[1].pageY + currentY) / 2
                  };
                  evt.scale = evt.zoom = this.getLen(v) / this.pinchStartLen;
                  this.self_emitEvent('onPinch', evt);
              }
              evt.angle = this.getRotateAngle(v, preV);
              this.self_emitEvent('onRotate', evt);
          }
          preV.x = v.x;
          preV.y = v.y;
          this.multiTouch = true;
      } else {
          if (this.x2 !== null) {
              evt.deltaX = currentX - this.x2;
              evt.deltaY = currentY - this.y2;
          } else {
              evt.deltaX = 0;
              evt.deltaY = 0;
          }
          this.self_emitEvent('onPressMove', evt);
      }
      this.self_cancelLongTap();
      this.x2 = currentX;
      this.y2 = currentY;

      if (len > 1) {
          evt.preventDefault();
      }
  }

  self_handleTouchCancel(evt) {
      this.self_emitEvent('onTouchCancel', evt);
      clearInterval(this.singleTapTimeout);
      clearInterval(this.tapTimeout);
      clearInterval(this.longTapTimeout);
      clearInterval(this.swipeTimeout);
  }

  self_handleTouchEnd(evt) {
      const { onRightFn } = this.props;
      this.self_emitEvent('onTouchEnd', evt);
      this.end = Date.now();
      this.self_cancelLongTap();

      if (this.multiTouch === true && evt.touches.length < 2) {
          this.self_emitEvent('onMultipointEnd', evt);
      }

      evt.origin = [this.x1, this.y1];
      if (this.multiTouch === false) {
          if ((this.x2 && Math.abs(this.x1 - this.x2) > 30) ||
              (this.y2 && Math.abs(this.y1 - this.y2) > 30)) {
              const direction = this.self_swipeDirection(this.x1, this.x2, this.y1, this.y2);
              evt.direction = direction;
              if(direction === 'Right'){
                onRightFn();
              }
              evt.distance = Math.abs(this.x1 - this.x2);
              this.swipeTimeout = setTimeout(() => {
                  this.self_emitEvent('onSwipe', evt);
              }, 0);
          } else {
              if (this.afterLongTap) {
                  clearTimeout(this.afterLongTapTimeout);
                  this.afterLongTap = false;
              } else {
                  this.tapTimeout = setTimeout(() => {
                      this.self_emitEvent('onTap', evt);
                      if (this.isDoubleTap) {
                          this.self_emitEvent('onDoubleTap', evt);
                          clearTimeout(this.singleTapTimeout);
                          this.isDoubleTap = false;
                      } else if (this.isSingleTap) {
                          this.singleTapTimeout = setTimeout(()=>{
                              this.self_emitEvent('onSingleTap', evt);
                          }, 250);
                          this.isSingleTap = false;
                      }
                  }, 0);
              }
          }
      }

      this.preV.x = 0;
      this.preV.y = 0;
      this.scale = 1;
      this.pinchStartLen = null;
      this.x1 = this.x2 = this.y1 = this.y2 = null;
      this.multiTouch = false;
  }

  self_cancelLongTap () {
      clearTimeout(this.longTapTimeout);
  }

  self_cancelSingleTap () {
      clearTimeout(this.singleTapTimeout);
  }

  self_swipeDirection (x1, x2, y1, y2) {
      if (Math.abs(x1 - x2) > 80 || this.end-this.now < 250) {
          return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down');
      } else {
          return 'Nochange';
      }

  }
  render(){
    return (
      <View 
        className='fingerTaro'
        onTouchStart={this.self_handleTouchStart.bind(this)}
        onTouchMove={this.self_handleTouchMove.bind(this)}
        onTouchCancel={this.self_handleTouchCancel.bind(this)}
        onTouchEnd={this.self_handleTouchEnd.bind(this)}
      >
        {this.props.children}
      </View>
    )
  }
}