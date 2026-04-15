class $PanicError extends Error {}
function $panic() {
  throw new $PanicError();
}
const _M0FPB19int__to__string__js = (x, radix) => {
  return x.toString(radix);
};
const _M0MPB7JSArray4push = (arr, val) => { arr.push(val); };
function $bound_check(arr, index) {
  if (index < 0 || index >= arr.length) throw new Error("Index out of bounds");
}
const _M0FPB15ryu__to__string = (number) => number.toString();
const _M0MPB7JSArray3pop = (arr) => arr.pop();
function _M0TP26mizchi10pixelmatch5Color(param0, param1, param2, param3) {
  this.r = param0;
  this.g = param1;
  this.b = param2;
  this.a = param3;
}
function _M0TP26mizchi10pixelmatch5Image(param0, param1, param2) {
  this.width = param0;
  this.height = param1;
  this.data = param2;
}
function $make_array_len_and_init(a, b) {
  const arr = new Array(a);
  arr.fill(b);
  return arr;
}
function _M0TP26mizchi10pixelmatch11ShiftRegion(param0, param1, param2) {
  this.y_start = param0;
  this.y_end = param1;
  this.shift = param2;
}
function _M0TP26mizchi10pixelmatch10DiffRegion(param0, param1, param2, param3, param4, param5) {
  this.x = param0;
  this.y = param1;
  this.width = param2;
  this.height = param3;
  this.diff_pixels = param4;
  this.region_type = param5;
}
function _M0TP26mizchi10pixelmatch10DiffReport(param0, param1, param2, param3, param4, param5, param6, param7, param8, param9, param10, param11, param12, param13, param14) {
  this.width = param0;
  this.height = param1;
  this.total_pixels = param2;
  this.diff_count = param3;
  this.aa_count = param4;
  this.match_ratio = param5;
  this.grid = param6;
  this.grid_cols = param7;
  this.grid_rows = param8;
  this.regions = param9;
  this.shift_only = param10;
  this.content_change_count = param11;
  this.global_shift = param12;
  this.shift_regions = param13;
  this.compensated_diff_count = param14;
}
function _M0TP26mizchi10pixelmatch7Options(param0, param1, param2, param3, param4, param5, param6, param7) {
  this.threshold = param0;
  this.include_aa = param1;
  this.alpha = param2;
  this.aa_color = param3;
  this.diff_color = param4;
  this.diff_color_alt = param5;
  this.diff_mask = param6;
  this.detect_shift = param7;
}
const _M0FP26mizchi10pixelmatch25find__diff__regions__flatN7_2abindS764 = "";
function _M0FPC15abort5abortGuE(msg) {
  $panic();
}
function _M0MPC13int3Int18to__string_2einner(self, radix) {
  return _M0FPB19int__to__string__js(self, radix);
}
function _M0MPC15array5Array4pushGiE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0MPC15array5Array4pushGRP26mizchi10pixelmatch10DiffRegionE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0MPC15array5Array4makeGRPB5ArrayGiEE(len, elem) {
  const arr = new Array(len);
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < len) {
      arr[i] = elem;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC15array5Array4makeGiE(len, elem) {
  const arr = new Array(len);
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < len) {
      arr[i] = elem;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC15array5Array3setGRPB5ArrayGiEE(self, index, value) {
  const len = self.length;
  if (index >= 0 && index < len) {
    $bound_check(self, index);
    self[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15array5Array3setGiE(self, index, value) {
  const len = self.length;
  if (index >= 0 && index < len) {
    $bound_check(self, index);
    self[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC16double6Double7to__int(self) {
  return self !== self ? 0 : self >= 2147483647 ? 2147483647 : self <= -2147483648 ? -2147483648 : self | 0;
}
function _M0MPC16double6Double10to__string(self) {
  return _M0FPB15ryu__to__string(self);
}
function _M0MPC15array5Array11unsafe__popGiE(self) {
  return _M0MPB7JSArray3pop(self);
}
function _M0MPC15array5Array3popGiE(self) {
  if (self.length === 0) {
    return undefined;
  } else {
    const v = _M0MPC15array5Array11unsafe__popGiE(self);
    return v;
  }
}
function _M0MPC15array5Array2atGRPB5ArrayGiEE(self, index) {
  const len = self.length;
  if (index >= 0 && index < len) {
    $bound_check(self, index);
    return self[index];
  } else {
    return $panic();
  }
}
function _M0MPC15array5Array2atGiE(self, index) {
  const len = self.length;
  if (index >= 0 && index < len) {
    $bound_check(self, index);
    return self[index];
  } else {
    return $panic();
  }
}
function _M0MPC15array5Array2atGUiiiEE(self, index) {
  const len = self.length;
  if (index >= 0 && index < len) {
    $bound_check(self, index);
    return self[index];
  } else {
    return $panic();
  }
}
function _M0FP26mizchi10pixelmatch20color__delta__inline(data1, data2, base) {
  $bound_check(data1, base);
  const r1 = data1[base];
  const _tmp = base + 1 | 0;
  $bound_check(data1, _tmp);
  const g1 = data1[_tmp];
  const _tmp$2 = base + 2 | 0;
  $bound_check(data1, _tmp$2);
  const b1 = data1[_tmp$2];
  const _tmp$3 = base + 3 | 0;
  $bound_check(data1, _tmp$3);
  const a1 = data1[_tmp$3];
  $bound_check(data2, base);
  const r2 = data2[base];
  const _tmp$4 = base + 1 | 0;
  $bound_check(data2, _tmp$4);
  const g2 = data2[_tmp$4];
  const _tmp$5 = base + 2 | 0;
  $bound_check(data2, _tmp$5);
  const b2 = data2[_tmp$5];
  const _tmp$6 = base + 3 | 0;
  $bound_check(data2, _tmp$6);
  const a2 = data2[_tmp$6];
  if (r1 === r2 && (g1 === g2 && (b1 === b2 && a1 === a2))) {
    return 0;
  }
  let rf1;
  let gf1;
  let bf1;
  let rf2;
  let gf2;
  let bf2;
  _L: {
    if (a1 === a2 && a1 === 255) {
      rf1 = r1 + 0;
      gf1 = g1 + 0;
      bf1 = b1 + 0;
      rf2 = r2 + 0;
      gf2 = g2 + 0;
      bf2 = b2 + 0;
      break _L;
    } else {
      const alpha1 = (a1 + 0) / 255;
      const white1 = 255 * (1 - alpha1);
      const alpha2 = (a2 + 0) / 255;
      const white2 = 255 * (1 - alpha2);
      rf1 = (r1 + 0) * alpha1 + white1;
      gf1 = (g1 + 0) * alpha1 + white1;
      bf1 = (b1 + 0) * alpha1 + white1;
      rf2 = (r2 + 0) * alpha2 + white2;
      gf2 = (g2 + 0) * alpha2 + white2;
      bf2 = (b2 + 0) * alpha2 + white2;
      break _L;
    }
  }
  const dr = rf1 - rf2;
  const dg = gf1 - gf2;
  const db = bf1 - bf2;
  const y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db;
  const i = 0.59597799 * dr - 0.2741761 * dg - 0.32180189 * db;
  const q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db;
  return 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;
}
function _M0MP26mizchi10pixelmatch5Color4rgba(r, g, b, a) {
  return new _M0TP26mizchi10pixelmatch5Color(r, g, b, a);
}
function _M0MP26mizchi10pixelmatch5Image3new(width, height) {
  const size = Math.imul(Math.imul(width, height) | 0, 4) | 0;
  return new _M0TP26mizchi10pixelmatch5Image(width, height, $make_array_len_and_init(size, 0));
}
function _M0MP26mizchi10pixelmatch5Image10set__pixel(self, x, y, c) {
  const idx = Math.imul((Math.imul(y, self.width) | 0) + x | 0, 4) | 0;
  const _tmp = self.data;
  $bound_check(_tmp, idx);
  _tmp[idx] = c.r;
  const _tmp$2 = self.data;
  const _tmp$3 = idx + 1 | 0;
  $bound_check(_tmp$2, _tmp$3);
  _tmp$2[_tmp$3] = c.g;
  const _tmp$4 = self.data;
  const _tmp$5 = idx + 2 | 0;
  $bound_check(_tmp$4, _tmp$5);
  _tmp$4[_tmp$5] = c.b;
  const _tmp$6 = self.data;
  const _tmp$7 = idx + 3 | 0;
  $bound_check(_tmp$6, _tmp$7);
  _tmp$6[_tmp$7] = c.a;
}
function _M0FP26mizchi10pixelmatch11blend__gray(img, x, y, alpha) {
  const idx = Math.imul((Math.imul(y, img.width) | 0) + x | 0, 4) | 0;
  const _tmp = img.data;
  $bound_check(_tmp, idx);
  const r = _tmp[idx] + 0;
  const _tmp$2 = img.data;
  const _tmp$3 = idx + 1 | 0;
  $bound_check(_tmp$2, _tmp$3);
  const g = _tmp$2[_tmp$3] + 0;
  const _tmp$4 = img.data;
  const _tmp$5 = idx + 2 | 0;
  $bound_check(_tmp$4, _tmp$5);
  const b = _tmp$4[_tmp$5] + 0;
  const lum = _M0MPC16double6Double7to__int(0.299 * r + 0.587 * g + 0.114 * b);
  const blended = _M0MPC16double6Double7to__int((lum + 0) * alpha);
  return _M0MP26mizchi10pixelmatch5Color4rgba(blended, blended, blended, 255);
}
function _M0FP26mizchi10pixelmatch12color__delta(r1, g1, b1, a1, r2, g2, b2, a2, y_only) {
  let rf1;
  let gf1;
  let bf1;
  let rf2;
  let gf2;
  let bf2;
  _L: {
    if (a1 === a2 && a1 === 255) {
      rf1 = r1 + 0;
      gf1 = g1 + 0;
      bf1 = b1 + 0;
      rf2 = r2 + 0;
      gf2 = g2 + 0;
      bf2 = b2 + 0;
      break _L;
    } else {
      const alpha1 = (a1 + 0) / 255;
      const white1 = 255 * (1 - alpha1);
      const alpha2 = (a2 + 0) / 255;
      const white2 = 255 * (1 - alpha2);
      rf1 = (r1 + 0) * alpha1 + white1;
      gf1 = (g1 + 0) * alpha1 + white1;
      bf1 = (b1 + 0) * alpha1 + white1;
      rf2 = (r2 + 0) * alpha2 + white2;
      gf2 = (g2 + 0) * alpha2 + white2;
      bf2 = (b2 + 0) * alpha2 + white2;
      break _L;
    }
  }
  const dr = rf1 - rf2;
  const dg = gf1 - gf2;
  const db = bf1 - bf2;
  const y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db;
  if (y_only) {
    return y;
  }
  const i = 0.59597799 * dr - 0.2741761 * dg - 0.32180189 * db;
  const q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db;
  const delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;
  return y < 0 ? -delta : delta;
}
function _M0FP26mizchi10pixelmatch16color__delta__at(img1, img2, x, y, y_only) {
  const idx = Math.imul((Math.imul(y, img1.width) | 0) + x | 0, 4) | 0;
  const _tmp = img1.data;
  $bound_check(_tmp, idx);
  const _tmp$2 = _tmp[idx];
  const _tmp$3 = img1.data;
  const _tmp$4 = idx + 1 | 0;
  $bound_check(_tmp$3, _tmp$4);
  const _tmp$5 = _tmp$3[_tmp$4];
  const _tmp$6 = img1.data;
  const _tmp$7 = idx + 2 | 0;
  $bound_check(_tmp$6, _tmp$7);
  const _tmp$8 = _tmp$6[_tmp$7];
  const _tmp$9 = img1.data;
  const _tmp$10 = idx + 3 | 0;
  $bound_check(_tmp$9, _tmp$10);
  const _tmp$11 = _tmp$9[_tmp$10];
  const _tmp$12 = img2.data;
  $bound_check(_tmp$12, idx);
  const _tmp$13 = _tmp$12[idx];
  const _tmp$14 = img2.data;
  const _tmp$15 = idx + 1 | 0;
  $bound_check(_tmp$14, _tmp$15);
  const _tmp$16 = _tmp$14[_tmp$15];
  const _tmp$17 = img2.data;
  const _tmp$18 = idx + 2 | 0;
  $bound_check(_tmp$17, _tmp$18);
  const _tmp$19 = _tmp$17[_tmp$18];
  const _tmp$20 = img2.data;
  const _tmp$21 = idx + 3 | 0;
  $bound_check(_tmp$20, _tmp$21);
  return _M0FP26mizchi10pixelmatch12color__delta(_tmp$2, _tmp$5, _tmp$8, _tmp$11, _tmp$13, _tmp$16, _tmp$19, _tmp$20[_tmp$21], y_only);
}
function _M0FP26mizchi10pixelmatch19has__many__siblings(img, x, y) {
  const width = img.width;
  const height = img.height;
  const data = img.data;
  let count = 0;
  const idx = Math.imul((Math.imul(y, width) | 0) + x | 0, 4) | 0;
  $bound_check(data, idx);
  const r = data[idx];
  const _tmp = idx + 1 | 0;
  $bound_check(data, _tmp);
  const g = data[_tmp];
  const _tmp$2 = idx + 2 | 0;
  $bound_check(data, _tmp$2);
  const b = data[_tmp$2];
  const _tmp$3 = idx + 3 | 0;
  $bound_check(data, _tmp$3);
  const a = data[_tmp$3];
  const x0 = x > 0;
  const x1 = x < (width - 1 | 0);
  const y0 = y > 0;
  const y1 = y < (height - 1 | 0);
  if (x0 && y0) {
    const n = Math.imul(((Math.imul(y - 1 | 0, width) | 0) + x | 0) - 1 | 0, 4) | 0;
    let _tmp$4;
    $bound_check(data, n);
    const _p = data[n] - r | 0;
    if ((_p < 0 ? -_p | 0 : _p) < 3) {
      let _tmp$5;
      const _tmp$6 = n + 1 | 0;
      $bound_check(data, _tmp$6);
      const _p$2 = data[_tmp$6] - g | 0;
      if ((_p$2 < 0 ? -_p$2 | 0 : _p$2) < 3) {
        let _tmp$7;
        const _tmp$8 = n + 2 | 0;
        $bound_check(data, _tmp$8);
        const _p$3 = data[_tmp$8] - b | 0;
        if ((_p$3 < 0 ? -_p$3 | 0 : _p$3) < 3) {
          const _tmp$9 = n + 3 | 0;
          $bound_check(data, _tmp$9);
          const _p$4 = data[_tmp$9] - a | 0;
          _tmp$7 = (_p$4 < 0 ? -_p$4 | 0 : _p$4) < 3;
        } else {
          _tmp$7 = false;
        }
        _tmp$5 = _tmp$7;
      } else {
        _tmp$5 = false;
      }
      _tmp$4 = _tmp$5;
    } else {
      _tmp$4 = false;
    }
    if (_tmp$4) {
      count = count + 1 | 0;
    }
  }
  if (y0) {
    const n = Math.imul((Math.imul(y - 1 | 0, width) | 0) + x | 0, 4) | 0;
    let _tmp$4;
    $bound_check(data, n);
    const _p = data[n] - r | 0;
    if ((_p < 0 ? -_p | 0 : _p) < 3) {
      let _tmp$5;
      const _tmp$6 = n + 1 | 0;
      $bound_check(data, _tmp$6);
      const _p$2 = data[_tmp$6] - g | 0;
      if ((_p$2 < 0 ? -_p$2 | 0 : _p$2) < 3) {
        let _tmp$7;
        const _tmp$8 = n + 2 | 0;
        $bound_check(data, _tmp$8);
        const _p$3 = data[_tmp$8] - b | 0;
        if ((_p$3 < 0 ? -_p$3 | 0 : _p$3) < 3) {
          const _tmp$9 = n + 3 | 0;
          $bound_check(data, _tmp$9);
          const _p$4 = data[_tmp$9] - a | 0;
          _tmp$7 = (_p$4 < 0 ? -_p$4 | 0 : _p$4) < 3;
        } else {
          _tmp$7 = false;
        }
        _tmp$5 = _tmp$7;
      } else {
        _tmp$5 = false;
      }
      _tmp$4 = _tmp$5;
    } else {
      _tmp$4 = false;
    }
    if (_tmp$4) {
      count = count + 1 | 0;
      if (count >= 3) {
        return true;
      }
    }
  }
  if (x1 && y0) {
    const n = Math.imul(((Math.imul(y - 1 | 0, width) | 0) + x | 0) + 1 | 0, 4) | 0;
    let _tmp$4;
    $bound_check(data, n);
    const _p = data[n] - r | 0;
    if ((_p < 0 ? -_p | 0 : _p) < 3) {
      let _tmp$5;
      const _tmp$6 = n + 1 | 0;
      $bound_check(data, _tmp$6);
      const _p$2 = data[_tmp$6] - g | 0;
      if ((_p$2 < 0 ? -_p$2 | 0 : _p$2) < 3) {
        let _tmp$7;
        const _tmp$8 = n + 2 | 0;
        $bound_check(data, _tmp$8);
        const _p$3 = data[_tmp$8] - b | 0;
        if ((_p$3 < 0 ? -_p$3 | 0 : _p$3) < 3) {
          const _tmp$9 = n + 3 | 0;
          $bound_check(data, _tmp$9);
          const _p$4 = data[_tmp$9] - a | 0;
          _tmp$7 = (_p$4 < 0 ? -_p$4 | 0 : _p$4) < 3;
        } else {
          _tmp$7 = false;
        }
        _tmp$5 = _tmp$7;
      } else {
        _tmp$5 = false;
      }
      _tmp$4 = _tmp$5;
    } else {
      _tmp$4 = false;
    }
    if (_tmp$4) {
      count = count + 1 | 0;
      if (count >= 3) {
        return true;
      }
    }
  }
  if (x0) {
    const n = Math.imul(((Math.imul(y, width) | 0) + x | 0) - 1 | 0, 4) | 0;
    let _tmp$4;
    $bound_check(data, n);
    const _p = data[n] - r | 0;
    if ((_p < 0 ? -_p | 0 : _p) < 3) {
      let _tmp$5;
      const _tmp$6 = n + 1 | 0;
      $bound_check(data, _tmp$6);
      const _p$2 = data[_tmp$6] - g | 0;
      if ((_p$2 < 0 ? -_p$2 | 0 : _p$2) < 3) {
        let _tmp$7;
        const _tmp$8 = n + 2 | 0;
        $bound_check(data, _tmp$8);
        const _p$3 = data[_tmp$8] - b | 0;
        if ((_p$3 < 0 ? -_p$3 | 0 : _p$3) < 3) {
          const _tmp$9 = n + 3 | 0;
          $bound_check(data, _tmp$9);
          const _p$4 = data[_tmp$9] - a | 0;
          _tmp$7 = (_p$4 < 0 ? -_p$4 | 0 : _p$4) < 3;
        } else {
          _tmp$7 = false;
        }
        _tmp$5 = _tmp$7;
      } else {
        _tmp$5 = false;
      }
      _tmp$4 = _tmp$5;
    } else {
      _tmp$4 = false;
    }
    if (_tmp$4) {
      count = count + 1 | 0;
      if (count >= 3) {
        return true;
      }
    }
  }
  if (x1) {
    const n = Math.imul(((Math.imul(y, width) | 0) + x | 0) + 1 | 0, 4) | 0;
    let _tmp$4;
    $bound_check(data, n);
    const _p = data[n] - r | 0;
    if ((_p < 0 ? -_p | 0 : _p) < 3) {
      let _tmp$5;
      const _tmp$6 = n + 1 | 0;
      $bound_check(data, _tmp$6);
      const _p$2 = data[_tmp$6] - g | 0;
      if ((_p$2 < 0 ? -_p$2 | 0 : _p$2) < 3) {
        let _tmp$7;
        const _tmp$8 = n + 2 | 0;
        $bound_check(data, _tmp$8);
        const _p$3 = data[_tmp$8] - b | 0;
        if ((_p$3 < 0 ? -_p$3 | 0 : _p$3) < 3) {
          const _tmp$9 = n + 3 | 0;
          $bound_check(data, _tmp$9);
          const _p$4 = data[_tmp$9] - a | 0;
          _tmp$7 = (_p$4 < 0 ? -_p$4 | 0 : _p$4) < 3;
        } else {
          _tmp$7 = false;
        }
        _tmp$5 = _tmp$7;
      } else {
        _tmp$5 = false;
      }
      _tmp$4 = _tmp$5;
    } else {
      _tmp$4 = false;
    }
    if (_tmp$4) {
      count = count + 1 | 0;
      if (count >= 3) {
        return true;
      }
    }
  }
  if (x0 && y1) {
    const n = Math.imul(((Math.imul(y + 1 | 0, width) | 0) + x | 0) - 1 | 0, 4) | 0;
    let _tmp$4;
    $bound_check(data, n);
    const _p = data[n] - r | 0;
    if ((_p < 0 ? -_p | 0 : _p) < 3) {
      let _tmp$5;
      const _tmp$6 = n + 1 | 0;
      $bound_check(data, _tmp$6);
      const _p$2 = data[_tmp$6] - g | 0;
      if ((_p$2 < 0 ? -_p$2 | 0 : _p$2) < 3) {
        let _tmp$7;
        const _tmp$8 = n + 2 | 0;
        $bound_check(data, _tmp$8);
        const _p$3 = data[_tmp$8] - b | 0;
        if ((_p$3 < 0 ? -_p$3 | 0 : _p$3) < 3) {
          const _tmp$9 = n + 3 | 0;
          $bound_check(data, _tmp$9);
          const _p$4 = data[_tmp$9] - a | 0;
          _tmp$7 = (_p$4 < 0 ? -_p$4 | 0 : _p$4) < 3;
        } else {
          _tmp$7 = false;
        }
        _tmp$5 = _tmp$7;
      } else {
        _tmp$5 = false;
      }
      _tmp$4 = _tmp$5;
    } else {
      _tmp$4 = false;
    }
    if (_tmp$4) {
      count = count + 1 | 0;
      if (count >= 3) {
        return true;
      }
    }
  }
  if (y1) {
    const n = Math.imul((Math.imul(y + 1 | 0, width) | 0) + x | 0, 4) | 0;
    let _tmp$4;
    $bound_check(data, n);
    const _p = data[n] - r | 0;
    if ((_p < 0 ? -_p | 0 : _p) < 3) {
      let _tmp$5;
      const _tmp$6 = n + 1 | 0;
      $bound_check(data, _tmp$6);
      const _p$2 = data[_tmp$6] - g | 0;
      if ((_p$2 < 0 ? -_p$2 | 0 : _p$2) < 3) {
        let _tmp$7;
        const _tmp$8 = n + 2 | 0;
        $bound_check(data, _tmp$8);
        const _p$3 = data[_tmp$8] - b | 0;
        if ((_p$3 < 0 ? -_p$3 | 0 : _p$3) < 3) {
          const _tmp$9 = n + 3 | 0;
          $bound_check(data, _tmp$9);
          const _p$4 = data[_tmp$9] - a | 0;
          _tmp$7 = (_p$4 < 0 ? -_p$4 | 0 : _p$4) < 3;
        } else {
          _tmp$7 = false;
        }
        _tmp$5 = _tmp$7;
      } else {
        _tmp$5 = false;
      }
      _tmp$4 = _tmp$5;
    } else {
      _tmp$4 = false;
    }
    if (_tmp$4) {
      count = count + 1 | 0;
      if (count >= 3) {
        return true;
      }
    }
  }
  if (x1 && y1) {
    const n = Math.imul(((Math.imul(y + 1 | 0, width) | 0) + x | 0) + 1 | 0, 4) | 0;
    let _tmp$4;
    $bound_check(data, n);
    const _p = data[n] - r | 0;
    if ((_p < 0 ? -_p | 0 : _p) < 3) {
      let _tmp$5;
      const _tmp$6 = n + 1 | 0;
      $bound_check(data, _tmp$6);
      const _p$2 = data[_tmp$6] - g | 0;
      if ((_p$2 < 0 ? -_p$2 | 0 : _p$2) < 3) {
        let _tmp$7;
        const _tmp$8 = n + 2 | 0;
        $bound_check(data, _tmp$8);
        const _p$3 = data[_tmp$8] - b | 0;
        if ((_p$3 < 0 ? -_p$3 | 0 : _p$3) < 3) {
          const _tmp$9 = n + 3 | 0;
          $bound_check(data, _tmp$9);
          const _p$4 = data[_tmp$9] - a | 0;
          _tmp$7 = (_p$4 < 0 ? -_p$4 | 0 : _p$4) < 3;
        } else {
          _tmp$7 = false;
        }
        _tmp$5 = _tmp$7;
      } else {
        _tmp$5 = false;
      }
      _tmp$4 = _tmp$5;
    } else {
      _tmp$4 = false;
    }
    if (_tmp$4) {
      count = count + 1 | 0;
      if (count >= 3) {
        return true;
      }
    }
  }
  return false;
}
function _M0FP26mizchi10pixelmatch25luminance__delta__between(data, width, x1, y1, x2, y2) {
  const idx1 = Math.imul((Math.imul(y1, width) | 0) + x1 | 0, 4) | 0;
  const idx2 = Math.imul((Math.imul(y2, width) | 0) + x2 | 0, 4) | 0;
  $bound_check(data, idx1);
  const _tmp = data[idx1];
  const _tmp$2 = idx1 + 1 | 0;
  $bound_check(data, _tmp$2);
  const _tmp$3 = data[_tmp$2];
  const _tmp$4 = idx1 + 2 | 0;
  $bound_check(data, _tmp$4);
  const _tmp$5 = data[_tmp$4];
  const _tmp$6 = idx1 + 3 | 0;
  $bound_check(data, _tmp$6);
  const _tmp$7 = data[_tmp$6];
  $bound_check(data, idx2);
  const _tmp$8 = data[idx2];
  const _tmp$9 = idx2 + 1 | 0;
  $bound_check(data, _tmp$9);
  const _tmp$10 = data[_tmp$9];
  const _tmp$11 = idx2 + 2 | 0;
  $bound_check(data, _tmp$11);
  const _tmp$12 = data[_tmp$11];
  const _tmp$13 = idx2 + 3 | 0;
  $bound_check(data, _tmp$13);
  return _M0FP26mizchi10pixelmatch12color__delta(_tmp, _tmp$3, _tmp$5, _tmp$7, _tmp$8, _tmp$10, _tmp$12, data[_tmp$13], true);
}
function _M0FP26mizchi10pixelmatch15is__antialiased(img1, img2, x, y) {
  const width = img1.width;
  const height = img1.height;
  const data1 = img1.data;
  let min_delta = 0;
  let max_delta = 0;
  let min_x = x;
  let min_y = y;
  let max_x = x;
  let max_y = y;
  let _tmp = -1;
  while (true) {
    const dy = _tmp;
    if (dy <= 1) {
      let _tmp$2 = -1;
      while (true) {
        const dx = _tmp$2;
        if (dx <= 1) {
          _L: {
            if (dx === 0 && dy === 0) {
              break _L;
            }
            const nx = x + dx | 0;
            const ny = y + dy | 0;
            if (nx < 0 || (nx >= width || (ny < 0 || ny >= height))) {
              break _L;
            }
            const delta = _M0FP26mizchi10pixelmatch25luminance__delta__between(data1, width, x, y, nx, ny);
            if (delta === 0) {
              break _L;
            }
            if (delta < min_delta) {
              min_delta = delta;
              min_x = nx;
              min_y = ny;
            }
            if (delta > max_delta) {
              max_delta = delta;
              max_x = nx;
              max_y = ny;
            }
            break _L;
          }
          _tmp$2 = dx + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp = dy + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  if (min_delta === 0 && max_delta === 0) {
    return false;
  }
  return _M0FP26mizchi10pixelmatch19has__many__siblings(img1, min_x, min_y) && _M0FP26mizchi10pixelmatch19has__many__siblings(img2, min_x, min_y) || _M0FP26mizchi10pixelmatch19has__many__siblings(img1, max_x, max_y) && _M0FP26mizchi10pixelmatch19has__many__siblings(img2, max_x, max_y);
}
function _M0FP26mizchi10pixelmatch10pixelmatch(img1, img2, output, options) {
  if (img1.width !== img2.width || img1.height !== img2.height) {
    _M0FPC15abort5abortGuE("Image dimensions must match");
  }
  const width = img1.width;
  const height = img1.height;
  const max_delta = 35215 * options.threshold * options.threshold * options.threshold * options.threshold;
  let diff_count = 0;
  let _tmp = 0;
  while (true) {
    const y = _tmp;
    if (y < height) {
      let _tmp$2 = 0;
      while (true) {
        const x = _tmp$2;
        if (x < width) {
          const delta = _M0FP26mizchi10pixelmatch16color__delta__at(img1, img2, x, y, false);
          if (Math.abs(delta) > max_delta) {
            if (!options.include_aa && (_M0FP26mizchi10pixelmatch15is__antialiased(img1, img2, x, y) || _M0FP26mizchi10pixelmatch15is__antialiased(img2, img1, x, y))) {
              if (output === undefined) {
              } else {
                const _Some = output;
                const _out = _Some;
                if (!options.diff_mask) {
                  _M0MP26mizchi10pixelmatch5Image10set__pixel(_out, x, y, options.aa_color);
                }
              }
            } else {
              diff_count = diff_count + 1 | 0;
              if (output === undefined) {
              } else {
                const _Some = output;
                const _out = _Some;
                let color;
                if (delta < 0) {
                  const _p = options.diff_color_alt;
                  const _p$2 = options.diff_color;
                  if (_p === undefined) {
                    color = _p$2;
                  } else {
                    const _p$3 = _p;
                    color = _p$3;
                  }
                } else {
                  color = options.diff_color;
                }
                _M0MP26mizchi10pixelmatch5Image10set__pixel(_out, x, y, color);
              }
            }
          } else {
            if (output === undefined) {
            } else {
              const _Some = output;
              const _out = _Some;
              if (!options.diff_mask) {
                const gray = _M0FP26mizchi10pixelmatch11blend__gray(img1, x, y, options.alpha);
                _M0MP26mizchi10pixelmatch5Image10set__pixel(_out, x, y, gray);
              }
            }
          }
          _tmp$2 = x + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp = y + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return diff_count;
}
function _M0FP26mizchi10pixelmatch18pixelmatch__simple(img1, img2, threshold) {
  if (img1.width !== img2.width || img1.height !== img2.height) {
    _M0FPC15abort5abortGuE("Image dimensions must match");
  }
  const max_delta = 35215 * threshold * threshold * threshold * threshold;
  let diff_count = 0;
  const len = img1.data.length / 4 | 0;
  const data1 = img1.data;
  const data2 = img2.data;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < len) {
      const base = Math.imul(i, 4) | 0;
      const delta = _M0FP26mizchi10pixelmatch20color__delta__inline(data1, data2, base);
      if (delta > max_delta) {
        diff_count = diff_count + 1 | 0;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return diff_count;
}
function _M0FP26mizchi10pixelmatch12match__ratio(img1, img2, options) {
  const total = Math.imul(img1.width, img1.height) | 0;
  if (total === 0) {
    return 1;
  }
  const diff = _M0FP26mizchi10pixelmatch10pixelmatch(img1, img2, undefined, options);
  return 1 - (diff + 0) / (total + 0);
}
function _M0FP26mizchi10pixelmatch18luminance__profile(img) {
  const profile = $make_array_len_and_init(img.height, 0);
  const data = img.data;
  const width = img.width;
  const inv_width = 1 / (width + 0);
  const _bind = img.height;
  let _tmp = 0;
  while (true) {
    const y = _tmp;
    if (y < _bind) {
      let sum = 0;
      const row_base = Math.imul(Math.imul(y, width) | 0, 4) | 0;
      let _tmp$2 = 0;
      while (true) {
        const x = _tmp$2;
        if (x < width) {
          const base = row_base + (Math.imul(x, 4) | 0) | 0;
          $bound_check(data, base);
          const r = data[base] + 0;
          const _tmp$3 = base + 1 | 0;
          $bound_check(data, _tmp$3);
          const g = data[_tmp$3] + 0;
          const _tmp$4 = base + 2 | 0;
          $bound_check(data, _tmp$4);
          const b = data[_tmp$4] + 0;
          sum = sum + (0.299 * r + 0.587 * g + 0.114 * b);
          _tmp$2 = x + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      $bound_check(profile, y);
      profile[y] = sum * inv_width;
      _tmp = y + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return profile;
}
function _M0FP26mizchi10pixelmatch20cross__correlate__at(profile1, off1, profile2, off2, len1, len2, offset) {
  let sum_xy = 0;
  let sum_xx = 0;
  let sum_yy = 0;
  const start = offset > 0 ? offset : 0;
  const n = len1 < len2 ? len1 : len2;
  const end = offset > 0 ? n : n + offset | 0;
  let _tmp = start;
  while (true) {
    const i = _tmp;
    if (i < end) {
      const j = i - offset | 0;
      const _tmp$2 = off1 + j | 0;
      $bound_check(profile1, _tmp$2);
      const x = profile1[_tmp$2];
      const _tmp$3 = off2 + i | 0;
      $bound_check(profile2, _tmp$3);
      const y = profile2[_tmp$3];
      sum_xy = sum_xy + x * y;
      sum_xx = sum_xx + x * x;
      sum_yy = sum_yy + y * y;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const denom = Math.sqrt(sum_xx * sum_yy);
  return denom > 0 ? sum_xy / denom : 0;
}
function _M0FP26mizchi10pixelmatch21detect__global__shift(profile1, profile2, max_shift) {
  const n = profile1.length;
  if (n !== profile2.length || n === 0) {
    return 0;
  }
  const limit = max_shift < (n / 4 | 0) ? max_shift : n / 4 | 0;
  if (limit <= 16) {
    let best_corr = -1;
    let best_offset = 0;
    let offset = -limit | 0;
    while (true) {
      if (offset <= limit) {
        const corr = _M0FP26mizchi10pixelmatch20cross__correlate__at(profile1, 0, profile2, 0, n, n, offset);
        if (corr > best_corr) {
          best_corr = corr;
          best_offset = offset;
        }
        offset = offset + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return best_offset;
  }
  const stride = limit > 64 ? limit / 16 | 0 : 4;
  let best_corr = -1;
  let coarse_best = 0;
  let offset = -limit | 0;
  while (true) {
    if (offset <= limit) {
      const corr = _M0FP26mizchi10pixelmatch20cross__correlate__at(profile1, 0, profile2, 0, n, n, offset);
      if (corr > best_corr) {
        best_corr = corr;
        coarse_best = offset;
      }
      offset = offset + stride | 0;
      continue;
    } else {
      break;
    }
  }
  const refine_lo = (coarse_best - stride | 0) > (-limit | 0) ? coarse_best - stride | 0 : -limit | 0;
  const refine_hi = (coarse_best + stride | 0) < limit ? coarse_best + stride | 0 : limit;
  let best_offset = coarse_best;
  offset = refine_lo;
  while (true) {
    if (offset <= refine_hi) {
      const corr = _M0FP26mizchi10pixelmatch20cross__correlate__at(profile1, 0, profile2, 0, n, n, offset);
      if (corr > best_corr) {
        best_corr = corr;
        best_offset = offset;
      }
      offset = offset + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return best_offset;
}
function _M0FP26mizchi10pixelmatch21detect__window__shift(profile1, profile2, offset, len, max_shift) {
  const limit = max_shift < (len / 4 | 0) ? max_shift : len / 4 | 0;
  let best_corr = -1;
  let best_offset = 0;
  if (limit <= 16) {
    let off = -limit | 0;
    while (true) {
      if (off <= limit) {
        const corr = _M0FP26mizchi10pixelmatch20cross__correlate__at(profile1, offset, profile2, offset, len, len, off);
        if (corr > best_corr) {
          best_corr = corr;
          best_offset = off;
        }
        off = off + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return best_offset;
  }
  const stride = limit > 64 ? limit / 16 | 0 : 4;
  let coarse_best = 0;
  let off = -limit | 0;
  while (true) {
    if (off <= limit) {
      const corr = _M0FP26mizchi10pixelmatch20cross__correlate__at(profile1, offset, profile2, offset, len, len, off);
      if (corr > best_corr) {
        best_corr = corr;
        coarse_best = off;
      }
      off = off + stride | 0;
      continue;
    } else {
      break;
    }
  }
  const refine_lo = (coarse_best - stride | 0) > (-limit | 0) ? coarse_best - stride | 0 : -limit | 0;
  const refine_hi = (coarse_best + stride | 0) < limit ? coarse_best + stride | 0 : limit;
  best_offset = coarse_best;
  off = refine_lo;
  while (true) {
    if (off <= refine_hi) {
      const corr = _M0FP26mizchi10pixelmatch20cross__correlate__at(profile1, offset, profile2, offset, len, len, off);
      if (corr > best_corr) {
        best_corr = corr;
        best_offset = off;
      }
      off = off + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return best_offset;
}
function _M0FP26mizchi10pixelmatch32detect__piecewise__shift_2einner(profile1, profile2, max_shift, window_size) {
  const n = profile1.length;
  if (n === 0) {
    return [];
  }
  const step = window_size / 2 | 0;
  const step$2 = step < 1 ? 1 : step;
  const window_shifts = [];
  let y = 0;
  while (true) {
    if (y < n) {
      const end = (y + window_size | 0) > n ? n : y + window_size | 0;
      const len = end - y | 0;
      if (len < 4) {
        break;
      }
      const shift = _M0FP26mizchi10pixelmatch21detect__window__shift(profile1, profile2, y, len, max_shift);
      _M0MPC15array5Array4pushGRP26mizchi10pixelmatch10DiffRegionE(window_shifts, { _0: y, _1: end, _2: shift });
      y = y + step$2 | 0;
      continue;
    } else {
      break;
    }
  }
  if (window_shifts.length === 0) {
    return [new _M0TP26mizchi10pixelmatch11ShiftRegion(0, n, 0)];
  }
  const regions = [];
  const _bind = _M0MPC15array5Array2atGUiiiEE(window_shifts, 0);
  const _first_start = _bind._0;
  const _first_end = _bind._1;
  const _first_shift = _bind._2;
  let current_start = _first_start;
  let current_end = _first_end;
  let current_shift = _first_shift;
  const _bind$2 = window_shifts.length;
  let _tmp = 1;
  while (true) {
    const i = _tmp;
    if (i < _bind$2) {
      const _bind$3 = _M0MPC15array5Array2atGUiiiEE(window_shifts, i);
      const _w_end = _bind$3._1;
      const _w_shift = _bind$3._2;
      if (_w_shift === current_shift) {
        current_end = _w_end;
      } else {
        _M0MPC15array5Array4pushGRP26mizchi10pixelmatch10DiffRegionE(regions, new _M0TP26mizchi10pixelmatch11ShiftRegion(current_start, current_end, current_shift));
        current_start = current_end;
        current_end = _w_end;
        current_shift = _w_shift;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  _M0MPC15array5Array4pushGRP26mizchi10pixelmatch10DiffRegionE(regions, new _M0TP26mizchi10pixelmatch11ShiftRegion(current_start, current_end, current_shift));
  return regions;
}
function _M0FP26mizchi10pixelmatch21color__delta__inline2(data1, base1, data2, base2) {
  $bound_check(data1, base1);
  const r1 = data1[base1];
  const _tmp = base1 + 1 | 0;
  $bound_check(data1, _tmp);
  const g1 = data1[_tmp];
  const _tmp$2 = base1 + 2 | 0;
  $bound_check(data1, _tmp$2);
  const b1 = data1[_tmp$2];
  const _tmp$3 = base1 + 3 | 0;
  $bound_check(data1, _tmp$3);
  const a1 = data1[_tmp$3];
  $bound_check(data2, base2);
  const r2 = data2[base2];
  const _tmp$4 = base2 + 1 | 0;
  $bound_check(data2, _tmp$4);
  const g2 = data2[_tmp$4];
  const _tmp$5 = base2 + 2 | 0;
  $bound_check(data2, _tmp$5);
  const b2 = data2[_tmp$5];
  const _tmp$6 = base2 + 3 | 0;
  $bound_check(data2, _tmp$6);
  const a2 = data2[_tmp$6];
  if (r1 === r2 && (g1 === g2 && (b1 === b2 && a1 === a2))) {
    return 0;
  }
  let rf1;
  let gf1;
  let bf1;
  let rf2;
  let gf2;
  let bf2;
  _L: {
    if (a1 === a2 && a1 === 255) {
      rf1 = r1 + 0;
      gf1 = g1 + 0;
      bf1 = b1 + 0;
      rf2 = r2 + 0;
      gf2 = g2 + 0;
      bf2 = b2 + 0;
      break _L;
    } else {
      const alpha1 = (a1 + 0) / 255;
      const white1 = 255 * (1 - alpha1);
      const alpha2 = (a2 + 0) / 255;
      const white2 = 255 * (1 - alpha2);
      rf1 = (r1 + 0) * alpha1 + white1;
      gf1 = (g1 + 0) * alpha1 + white1;
      bf1 = (b1 + 0) * alpha1 + white1;
      rf2 = (r2 + 0) * alpha2 + white2;
      gf2 = (g2 + 0) * alpha2 + white2;
      bf2 = (b2 + 0) * alpha2 + white2;
      break _L;
    }
  }
  const dr = rf1 - rf2;
  const dg = gf1 - gf2;
  const db = bf1 - bf2;
  const y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db;
  const i = 0.59597799 * dr - 0.2741761 * dg - 0.32180189 * db;
  const q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db;
  return 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;
}
function _M0FP26mizchi10pixelmatch17compensated__diff(img1, img2, shift_regions, threshold) {
  const width = img1.width;
  const height = img1.height;
  const max_delta = 35215 * threshold * threshold * threshold * threshold;
  const data1 = img1.data;
  const data2 = img2.data;
  let count = 0;
  const _bind = shift_regions.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const region = shift_regions[_];
      const _bind$2 = region.y_start;
      const _bind$3 = region.y_end;
      let _tmp$2 = _bind$2;
      while (true) {
        const y = _tmp$2;
        if (y < _bind$3) {
          _L: {
            const src_y = y - region.shift | 0;
            if (src_y < 0 || src_y >= height) {
              count = count + width | 0;
              break _L;
            }
            const row1 = Math.imul(Math.imul(src_y, width) | 0, 4) | 0;
            const row2 = Math.imul(Math.imul(y, width) | 0, 4) | 0;
            const row_len = Math.imul(width, 4) | 0;
            let row_identical = true;
            let _tmp$3 = 0;
            while (true) {
              const i = _tmp$3;
              if (i < row_len) {
                const _tmp$4 = row1 + i | 0;
                $bound_check(data1, _tmp$4);
                const _tmp$5 = data1[_tmp$4];
                const _tmp$6 = row2 + i | 0;
                $bound_check(data2, _tmp$6);
                if (_tmp$5 !== data2[_tmp$6]) {
                  row_identical = false;
                  break;
                }
                _tmp$3 = i + 1 | 0;
                continue;
              } else {
                break;
              }
            }
            if (row_identical) {
              break _L;
            }
            let _tmp$4 = 0;
            while (true) {
              const x = _tmp$4;
              if (x < width) {
                const base1 = row1 + (Math.imul(x, 4) | 0) | 0;
                const base2 = row2 + (Math.imul(x, 4) | 0) | 0;
                const delta = _M0FP26mizchi10pixelmatch21color__delta__inline2(data1, base1, data2, base2);
                if (delta > max_delta) {
                  count = count + 1 | 0;
                }
                _tmp$4 = x + 1 | 0;
                continue;
              } else {
                break;
              }
            }
            break _L;
          }
          _tmp$2 = y + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return count;
}
function _M0FP26mizchi10pixelmatch16classify__region(region, image_width) {
  return region.height <= 2 || region.width <= 2 ? "edge" : (region.width + 0) / (region.height + 0) > 3 && region.width > ((Math.imul(image_width, 80) | 0) / 100 | 0) ? "shift" : "content";
}
function _M0FP26mizchi10pixelmatch25find__diff__regions__flat(diff_map, width, height) {
  const size = Math.imul(width, height) | 0;
  const visited = $make_array_len_and_init(size, false);
  const regions = [];
  let _tmp = 0;
  while (true) {
    const y = _tmp;
    if (y < height) {
      let _tmp$2 = 0;
      while (true) {
        const x = _tmp$2;
        if (x < width) {
          const idx = (Math.imul(y, width) | 0) + x | 0;
          let _tmp$3;
          $bound_check(diff_map, idx);
          if (diff_map[idx]) {
            $bound_check(visited, idx);
            _tmp$3 = !visited[idx];
          } else {
            _tmp$3 = false;
          }
          if (_tmp$3) {
            let min_x = x;
            let max_x = x;
            let min_y = y;
            let max_y = y;
            let pixel_count = 0;
            const stack = [idx];
            while (true) {
              if (stack.length > 0) {
                const _p = _M0MPC15array5Array3popGiE(stack);
                let cidx;
                if (_p === undefined) {
                  cidx = $panic();
                } else {
                  const _p$2 = _p;
                  cidx = _p$2;
                }
                let _tmp$4;
                $bound_check(visited, cidx);
                if (visited[cidx]) {
                  _tmp$4 = true;
                } else {
                  $bound_check(diff_map, cidx);
                  _tmp$4 = !diff_map[cidx];
                }
                if (_tmp$4) {
                  continue;
                }
                $bound_check(visited, cidx);
                visited[cidx] = true;
                pixel_count = pixel_count + 1 | 0;
                const cx = cidx % width | 0;
                const cy = cidx / width | 0;
                if (cx < min_x) {
                  min_x = cx;
                }
                if (cx > max_x) {
                  max_x = cx;
                }
                if (cy < min_y) {
                  min_y = cy;
                }
                if (cy > max_y) {
                  max_y = cy;
                }
                if (cx > 0) {
                  _M0MPC15array5Array4pushGiE(stack, cidx - 1 | 0);
                }
                if (cx < (width - 1 | 0)) {
                  _M0MPC15array5Array4pushGiE(stack, cidx + 1 | 0);
                }
                if (cy > 0) {
                  _M0MPC15array5Array4pushGiE(stack, cidx - width | 0);
                }
                if (cy < (height - 1 | 0)) {
                  _M0MPC15array5Array4pushGiE(stack, cidx + width | 0);
                }
                continue;
              } else {
                break;
              }
            }
            if (pixel_count > 0) {
              const _bind = min_x;
              const _bind$2 = min_y;
              const _bind$3 = (max_x - min_x | 0) + 1 | 0;
              const _bind$4 = (max_y - min_y | 0) + 1 | 0;
              const _bind$5 = pixel_count;
              const region = new _M0TP26mizchi10pixelmatch10DiffRegion(_bind, _bind$2, _bind$3, _bind$4, _bind$5, _M0FP26mizchi10pixelmatch25find__diff__regions__flatN7_2abindS764);
              _M0MPC15array5Array4pushGRP26mizchi10pixelmatch10DiffRegionE(regions, new _M0TP26mizchi10pixelmatch10DiffRegion(_bind, _bind$2, _bind$3, _bind$4, _bind$5, _M0FP26mizchi10pixelmatch16classify__region(region, width)));
            }
          }
          _tmp$2 = x + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp = y + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return regions;
}
function _M0FP26mizchi10pixelmatch20diff__report_2einner(img1, img2, options, grid_size) {
  if (img1.width !== img2.width || img1.height !== img2.height) {
    _M0FPC15abort5abortGuE("Image dimensions must match");
  }
  const width = img1.width;
  const height = img1.height;
  const total_pixels = Math.imul(width, height) | 0;
  const max_delta = 35215 * options.threshold * options.threshold * options.threshold * options.threshold;
  const grid_cols = width < grid_size ? 1 : grid_size;
  const grid_rows = height < grid_size ? 1 : grid_size;
  const cell_w = width / grid_cols | 0;
  const cell_h = height / grid_rows | 0;
  const grid = _M0MPC15array5Array4makeGRPB5ArrayGiEE(grid_rows, []);
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < grid_rows) {
      _M0MPC15array5Array3setGRPB5ArrayGiEE(grid, i, _M0MPC15array5Array4makeGiE(grid_cols, 0));
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  let diff_count = 0;
  let aa_count = 0;
  const diff_map = $make_array_len_and_init(Math.imul(width, height) | 0, false);
  const data1 = img1.data;
  const data2 = img2.data;
  let _tmp$2 = 0;
  while (true) {
    const y = _tmp$2;
    if (y < height) {
      _L: {
        const row_offset = Math.imul(y, width) | 0;
        const row_start = Math.imul(row_offset, 4) | 0;
        const row_end = row_start + (Math.imul(width, 4) | 0) | 0;
        let row_identical = true;
        let _tmp$3 = row_start;
        while (true) {
          const i = _tmp$3;
          if (i < row_end) {
            $bound_check(data1, i);
            const _tmp$4 = data1[i];
            $bound_check(data2, i);
            if (_tmp$4 !== data2[i]) {
              row_identical = false;
              break;
            }
            _tmp$3 = i + 1 | 0;
            continue;
          } else {
            break;
          }
        }
        if (row_identical) {
          break _L;
        }
        let _tmp$4 = 0;
        while (true) {
          const x = _tmp$4;
          if (x < width) {
            const base = Math.imul(row_offset + x | 0, 4) | 0;
            const delta = _M0FP26mizchi10pixelmatch20color__delta__inline(data1, data2, base);
            if (delta > max_delta) {
              if (!options.include_aa && (_M0FP26mizchi10pixelmatch15is__antialiased(img1, img2, x, y) || _M0FP26mizchi10pixelmatch15is__antialiased(img2, img1, x, y))) {
                aa_count = aa_count + 1 | 0;
              } else {
                diff_count = diff_count + 1 | 0;
                const _tmp$5 = row_offset + x | 0;
                $bound_check(diff_map, _tmp$5);
                diff_map[_tmp$5] = true;
                const gx = cell_w > 0 ? x / cell_w | 0 : 0;
                const gy = cell_h > 0 ? y / cell_h | 0 : 0;
                const gx$2 = gx >= grid_cols ? grid_cols - 1 | 0 : gx;
                const gy$2 = gy >= grid_rows ? grid_rows - 1 | 0 : gy;
                const _array_1 = _M0MPC15array5Array2atGRPB5ArrayGiEE(grid, gy$2);
                _M0MPC15array5Array3setGiE(_array_1, gx$2, _M0MPC15array5Array2atGiE(_array_1, gx$2) + 1 | 0);
              }
            }
            _tmp$4 = x + 1 | 0;
            continue;
          } else {
            break;
          }
        }
        break _L;
      }
      _tmp$2 = y + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const regions = _M0FP26mizchi10pixelmatch25find__diff__regions__flat(diff_map, width, height);
  const match_ratio = total_pixels > 0 ? 1 - (diff_count + 0) / (total_pixels + 0) : 1;
  let content_change_count = 0;
  let has_non_shift = false;
  const _bind = regions.length;
  let _tmp$3 = 0;
  while (true) {
    const _ = _tmp$3;
    if (_ < _bind) {
      const region = regions[_];
      if (region.region_type === "content") {
        content_change_count = content_change_count + 1 | 0;
        has_non_shift = true;
      } else {
        if (region.region_type === "edge") {
          has_non_shift = true;
        }
      }
      _tmp$3 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const shift_only = regions.length > 0 && !has_non_shift;
  let global_shift;
  let shift_regions;
  let compensated_diff_count;
  _L: {
    if (options.detect_shift && height > 4) {
      const p1 = _M0FP26mizchi10pixelmatch18luminance__profile(img1);
      const p2 = _M0FP26mizchi10pixelmatch18luminance__profile(img2);
      const max_shift_val = (height / 4 | 0) < 500 ? height / 4 | 0 : 500;
      const gs = _M0FP26mizchi10pixelmatch21detect__global__shift(p1, p2, max_shift_val);
      const sr = _M0FP26mizchi10pixelmatch32detect__piecewise__shift_2einner(p1, p2, max_shift_val, 100);
      const cd = _M0FP26mizchi10pixelmatch17compensated__diff(img1, img2, sr, options.threshold);
      global_shift = gs;
      shift_regions = sr;
      compensated_diff_count = cd;
      break _L;
    } else {
      global_shift = 0;
      shift_regions = [];
      compensated_diff_count = 0;
      break _L;
    }
  }
  return new _M0TP26mizchi10pixelmatch10DiffReport(width, height, total_pixels, diff_count, aa_count, match_ratio, grid, grid_cols, grid_rows, regions, shift_only, content_change_count, global_shift, shift_regions, compensated_diff_count);
}
function _M0MP26mizchi10pixelmatch10DiffReport8to__json(self) {
  let s = "{\n";
  s = `${s}  \"width\": ${_M0MPC13int3Int18to__string_2einner(self.width, 10)},\n`;
  s = `${s}  \"height\": ${_M0MPC13int3Int18to__string_2einner(self.height, 10)},\n`;
  s = `${s}  \"total_pixels\": ${_M0MPC13int3Int18to__string_2einner(self.total_pixels, 10)},\n`;
  s = `${s}  \"diff_count\": ${_M0MPC13int3Int18to__string_2einner(self.diff_count, 10)},\n`;
  s = `${s}  \"aa_count\": ${_M0MPC13int3Int18to__string_2einner(self.aa_count, 10)},\n`;
  s = `${s}  \"match_ratio\": ${_M0MPC16double6Double10to__string(self.match_ratio)},\n`;
  s = `${s}  \"grid\": [\n`;
  const _bind = self.grid;
  const _bind$2 = _bind.length;
  let _tmp = 0;
  while (true) {
    const row_idx = _tmp;
    if (row_idx < _bind$2) {
      const row = _bind[row_idx];
      s = `${s}    [`;
      const _bind$3 = row.length;
      let _tmp$2 = 0;
      while (true) {
        const col_idx = _tmp$2;
        if (col_idx < _bind$3) {
          const val = row[col_idx];
          s = `${s}${_M0MPC13int3Int18to__string_2einner(val, 10)}`;
          if (col_idx < (row.length - 1 | 0)) {
            s = `${s}, `;
          }
          _tmp$2 = col_idx + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      s = `${s}]`;
      if (row_idx < (self.grid.length - 1 | 0)) {
        s = `${s},`;
      }
      s = `${s}\n`;
      _tmp = row_idx + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  s = `${s}  ],\n`;
  s = `${s}  \"regions\": [\n`;
  const _bind$3 = self.regions;
  const _bind$4 = _bind$3.length;
  let _tmp$2 = 0;
  while (true) {
    const i = _tmp$2;
    if (i < _bind$4) {
      const region = _bind$3[i];
      s = `${s}    {\"x\": ${_M0MPC13int3Int18to__string_2einner(region.x, 10)}`;
      s = `${s}, \"y\": ${_M0MPC13int3Int18to__string_2einner(region.y, 10)}`;
      s = `${s}, \"width\": ${_M0MPC13int3Int18to__string_2einner(region.width, 10)}`;
      s = `${s}, \"height\": ${_M0MPC13int3Int18to__string_2einner(region.height, 10)}`;
      s = `${s}, \"diff_pixels\": ${_M0MPC13int3Int18to__string_2einner(region.diff_pixels, 10)}`;
      s = `${s}, \"region_type\": \"${region.region_type}\"}`;
      if (i < (self.regions.length - 1 | 0)) {
        s = `${s},`;
      }
      s = `${s}\n`;
      _tmp$2 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  s = `${s}  ],\n`;
  const shift_only_str = self.shift_only ? "true" : "false";
  s = `${s}  \"shift_only\": ${shift_only_str},\n`;
  s = `${s}  \"content_change_count\": ${_M0MPC13int3Int18to__string_2einner(self.content_change_count, 10)},\n`;
  s = `${s}  \"global_shift\": ${_M0MPC13int3Int18to__string_2einner(self.global_shift, 10)},\n`;
  s = `${s}  \"compensated_diff_count\": ${_M0MPC13int3Int18to__string_2einner(self.compensated_diff_count, 10)},\n`;
  s = `${s}  \"shift_regions\": [\n`;
  const _bind$5 = self.shift_regions;
  const _bind$6 = _bind$5.length;
  let _tmp$3 = 0;
  while (true) {
    const i = _tmp$3;
    if (i < _bind$6) {
      const sr = _bind$5[i];
      s = `${s}    {\"y_start\": ${_M0MPC13int3Int18to__string_2einner(sr.y_start, 10)}`;
      s = `${s}, \"y_end\": ${_M0MPC13int3Int18to__string_2einner(sr.y_end, 10)}`;
      s = `${s}, \"shift\": ${_M0MPC13int3Int18to__string_2einner(sr.shift, 10)}}`;
      if (i < (self.shift_regions.length - 1 | 0)) {
        s = `${s},`;
      }
      s = `${s}\n`;
      _tmp$3 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  s = `${s}  ]\n`;
  s = `${s}}`;
  return s;
}
function _M0FP215pixelmatch_2djs3src9to__image(data, width, height) {
  return new _M0TP26mizchi10pixelmatch5Image(width, height, data);
}
function _M0FP215pixelmatch_2djs3src14pixelmatch__js(img1_data, img2_data, width, height, include_output, threshold, include_aa, alpha, diff_mask) {
  const img1 = _M0FP215pixelmatch_2djs3src9to__image(img1_data, width, height);
  const img2 = _M0FP215pixelmatch_2djs3src9to__image(img2_data, width, height);
  const opts = new _M0TP26mizchi10pixelmatch7Options(threshold, include_aa, alpha, _M0MP26mizchi10pixelmatch5Color4rgba(255, 255, 0, 255), _M0MP26mizchi10pixelmatch5Color4rgba(255, 0, 0, 255), undefined, diff_mask, false);
  if (include_output) {
    const out = _M0MP26mizchi10pixelmatch5Image3new(width, height);
    const diff_count = _M0FP26mizchi10pixelmatch10pixelmatch(img1, img2, out, opts);
    let s = `{\"diffCount\":${_M0MPC13int3Int18to__string_2einner(diff_count, 10)},\"output\":[`;
    const _bind = out.data.length;
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < _bind) {
        if (i > 0) {
          s = `${s},`;
        }
        const _tmp$2 = s;
        const _tmp$3 = out.data;
        $bound_check(_tmp$3, i);
        s = `${_tmp$2}${_M0MPC13int3Int18to__string_2einner(_tmp$3[i], 10)}`;
        _tmp = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    s = `${s}]}`;
    return s;
  } else {
    const diff_count = _M0FP26mizchi10pixelmatch10pixelmatch(img1, img2, undefined, opts);
    return `{\"diffCount\":${_M0MPC13int3Int18to__string_2einner(diff_count, 10)}}`;
  }
}
function _M0FP215pixelmatch_2djs3src22pixelmatch__simple__js(img1_data, img2_data, width, height, threshold) {
  const img1 = _M0FP215pixelmatch_2djs3src9to__image(img1_data, width, height);
  const img2 = _M0FP215pixelmatch_2djs3src9to__image(img2_data, width, height);
  return _M0FP26mizchi10pixelmatch18pixelmatch__simple(img1, img2, threshold);
}
function _M0FP215pixelmatch_2djs3src16match__ratio__js(img1_data, img2_data, width, height, threshold, include_aa, alpha, diff_mask) {
  const img1 = _M0FP215pixelmatch_2djs3src9to__image(img1_data, width, height);
  const img2 = _M0FP215pixelmatch_2djs3src9to__image(img2_data, width, height);
  const opts = new _M0TP26mizchi10pixelmatch7Options(threshold, include_aa, alpha, _M0MP26mizchi10pixelmatch5Color4rgba(255, 255, 0, 255), _M0MP26mizchi10pixelmatch5Color4rgba(255, 0, 0, 255), undefined, diff_mask, false);
  return _M0FP26mizchi10pixelmatch12match__ratio(img1, img2, opts);
}
function _M0FP215pixelmatch_2djs3src16diff__report__js(img1_data, img2_data, width, height, threshold, include_aa, alpha, diff_mask, grid_size, detect_shift) {
  const img1 = _M0FP215pixelmatch_2djs3src9to__image(img1_data, width, height);
  const img2 = _M0FP215pixelmatch_2djs3src9to__image(img2_data, width, height);
  const opts = new _M0TP26mizchi10pixelmatch7Options(threshold, include_aa, alpha, _M0MP26mizchi10pixelmatch5Color4rgba(255, 255, 0, 255), _M0MP26mizchi10pixelmatch5Color4rgba(255, 0, 0, 255), undefined, diff_mask, detect_shift);
  const report = _M0FP26mizchi10pixelmatch20diff__report_2einner(img1, img2, opts, grid_size);
  return _M0MP26mizchi10pixelmatch10DiffReport8to__json(report);
}
(() => {
})();
export { _M0FP215pixelmatch_2djs3src14pixelmatch__js as pixelmatch_js, _M0FP215pixelmatch_2djs3src22pixelmatch__simple__js as pixelmatch_simple_js, _M0FP215pixelmatch_2djs3src16match__ratio__js as match_ratio_js, _M0FP215pixelmatch_2djs3src16diff__report__js as diff_report_js }
